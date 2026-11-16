
const express = require("express");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const asyncHandler = require("../middleware/asyncHandler");
const { protect, adminOnly } = require("../middleware/auth");
const { upload, uploadDir } = require("../middleware/upload");

const router = express.Router();


const baseUrl = (req) => process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

function removeLocalImage(imageUrl) {
  if (!imageUrl || !imageUrl.includes("/uploads/")) return;
  const file = path.join(uploadDir, path.basename(imageUrl));
  fs.unlink(file, () => {}); // ignore errors (file may already be gone)
}


function readProductFields(body) {
  const data = {};
  for (const key of ["name", "description", "category", "image"]) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (body.price !== undefined) data.price = Number(body.price);
  const stock = body.stockQuantity !== undefined ? body.stockQuantity : body.stock;
  if (stock !== undefined) data.stockQuantity = Number(stock);
  return data;
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const checkId = (req, res, next) =>
  mongoose.isValidObjectId(req.params.id)
    ? next()
    : res.status(400).json({ message: "Invalid product ID." });


router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search, category, minPrice, maxPrice, sort, page, limit } = req.query;
    const filter = {};

    if (search) filter.name = { $regex: escapeRegex(String(search)), $options: "i" };
    if (category && category !== "all") filter.category = category;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const sortMap = { low: { price: 1 }, high: { price: -1 }, name: { name: 1 } };
    const sortBy = sortMap[sort] || { createdAt: -1 };

    
    if (page || limit) {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const perPage = Math.min(100, Math.max(1, parseInt(limit) || 12));
      const [products, total] = await Promise.all([
        Product.find(filter).sort(sortBy).skip((pageNum - 1) * perPage).limit(perPage),
        Product.countDocuments(filter),
      ]);
      return res.json({ products, total, page: pageNum, pages: Math.ceil(total / perPage) });
    }

    res.json(await Product.find(filter).sort(sortBy));
  })
);

router.get(
  "/:id",
  checkId,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });
    res.json(product);
  })
);

// ---------- admin routes ----------

router.post(
  "/",
  protect,
  adminOnly,
  upload.single("imageFile"),
  asyncHandler(async (req, res) => {
    const data = readProductFields(req.body);
    if (req.file) data.image = `${baseUrl(req)}/uploads/${req.file.filename}`;

    try {
      const product = await Product.create(data);
      res.status(201).json(product);
    } catch (err) {
      if (req.file) removeLocalImage(req.file.filename); // don't keep an orphan file
      throw err;
    }
  })
);

router.put(
  "/:id",
  protect,
  adminOnly,
  checkId,
  upload.single("imageFile"),
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      if (req.file) removeLocalImage(req.file.filename);
      return res.status(404).json({ message: "Product not found." });
    }

    const oldImage = product.image;
    const data = readProductFields(req.body);
    if (req.file) data.image = `${baseUrl(req)}/uploads/${req.file.filename}`;

    product.set(data);

    try {
      await product.save(); // runs validation
    } catch (err) {
      if (req.file) removeLocalImage(req.file.filename);
      throw err;
    }

    // If the image changed, remove the old uploaded file
    if (product.image !== oldImage) removeLocalImage(oldImage);

    res.json(product);
  })
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  checkId,
  asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });

    removeLocalImage(product.image);
    res.json({ message: "Product deleted.", id: product._id });
  })
);

module.exports = router;
