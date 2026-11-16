// POST /api/orders              -> place an order (customer, must be logged in)
// GET  /api/orders/my           -> my past orders (customer)
// GET  /api/orders              -> ALL orders (admin)
// GET  /api/orders/:id          -> one order (owner or admin)
// PUT  /api/orders/:id/status   -> change status (admin)
const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const asyncHandler = require("../middleware/asyncHandler");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

const STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

// Put stock back (used when an order fails half-way or is cancelled)
async function restoreStock(items) {
  await Promise.all(
    items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stockQuantity: i.quantity } }))
  );
}

// ---------- place an order ----------
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const { name, email, phone, address, paymentMethod, items } = req.body;
    // NOTE: req.body.total is ignored on purpose. The server calculates the price itself.

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Your bag is empty." });
    }

    // 1) Clean the cart: valid ids, whole-number quantities, merge duplicates
    const wanted = new Map(); // productId -> quantity
    for (const item of items) {
      const id = String(item.product);
      const qty = Number(item.quantity);
      if (!mongoose.isValidObjectId(id) || !Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ message: "Invalid item in order." });
      }
      wanted.set(id, (wanted.get(id) || 0) + qty);
    }

    // 2) Reduce stock one product at a time. The condition "stockQuantity >= qty" together with
    //    $inc is a single atomic step, so two customers can never buy the last item at once.
    const reserved = []; // what we've already taken (so we can undo on failure)
    const orderItems = [];
    let total = 0;

    for (const [id, qty] of wanted) {
      const product = await Product.findOneAndUpdate(
        { _id: id, stockQuantity: { $gte: qty } },
        { $inc: { stockQuantity: -qty } },
        { new: true }
      );

      if (!product) {
        await restoreStock(reserved); // undo everything reserved so far
        const existing = await Product.findById(id);
        const message = existing
          ? `Not enough stock for "${existing.name}" (only ${existing.stockQuantity} left).`
          : "A product in your bag no longer exists.";
        return res.status(400).json({ message });
      }

      reserved.push({ product: product._id, quantity: qty });
      orderItems.push({ product: product._id, name: product.name, price: product.price, quantity: qty });
      total += product.price * qty;
    }

    // 3) Save the order. If saving fails, give the stock back.
    try {
      const order = await Order.create({
        user: req.user._id,
        name,
        email: email || req.user.email,
        phone,
        address,
        paymentMethod,
        items: orderItems,
        total,
      });
      res.status(201).json(order);
    } catch (err) {
      await restoreStock(reserved);
      throw err;
    }
  })
);

// ---------- customer: my orders ----------
router.get(
  "/my",
  protect,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  })
);

// ---------- admin: all orders (uses populate to show who ordered) ----------
router.get(
  "/",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });
    res.json(orders);
  })
);

// ---------- one order ----------
router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid order ID." });
    }
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) return res.status(404).json({ message: "Order not found." });

    const isOwner = String(order.user._id) === String(req.user._id);
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: this is not your order." });
    }
    res.json(order);
  })
);

// ---------- admin: update status ----------
router.put(
  "/:id/status",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid order ID." });
    }
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${STATUSES.join(", ")}.` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });

    if (order.status === "Cancelled" && status !== "Cancelled") {
      return res.status(400).json({ message: "A cancelled order cannot be re-opened." });
    }

    // Cancelling returns the items to stock
    if (status === "Cancelled" && order.status !== "Cancelled") {
      await restoreStock(order.items);
    }

    order.status = status;
    await order.save();
    res.json(order);
  })
);

module.exports = router;
