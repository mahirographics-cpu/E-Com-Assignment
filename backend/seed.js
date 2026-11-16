require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
const Product = require("./models/Product");

const sampleProducts = [
  { name: "Everyday Ceramic Set", price: 850, category: "Home", stockQuantity: 12,
    description: "A clean, timeless ceramic set made for everyday moments.",
    image: "https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=900" },
  { name: "Minimal Desk Lamp", price: 1450, category: "Living", stockQuantity: 8,
    description: "A simple statement lamp with a warm, calming glow.",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=900" },
  { name: "Canvas Weekend Bag", price: 1200, category: "Accessories", stockQuantity: 15,
    description: "A versatile everyday carryall with a practical silhouette.",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900" },
  { name: "Natural Skincare Kit", price: 980, category: "Beauty", stockQuantity: 10,
    description: "A thoughtful daily care set for a simple routine.",
    image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=900" },
];

async function seed() {
  await connectDB();

  const email = (process.env.ADMIN_EMAIL || "admin@meridian.com").toLowerCase();
  let admin = await User.findOne({ email });

  if (admin) {
    admin.role = "admin";
    await admin.save();
    console.log(`Existing user ${email} promoted to admin.`);
  } else {
    await User.create({
      name: process.env.ADMIN_NAME || "Store Owner",
      email,
      password: process.env.ADMIN_PASSWORD || "Admin12345",
      role: "admin",
    });
    console.log(`Admin created: ${email}`);
  }

  if ((await Product.countDocuments()) === 0) {
    await Product.insertMany(sampleProducts);
    console.log(`Inserted ${sampleProducts.length} sample products.`);
  } else {
    console.log("Products already exist, skipping sample products.");
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
