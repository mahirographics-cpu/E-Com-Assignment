const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Product name is required"], trim: true },
    description: { type: String, required: [true, "Description is required"], trim: true },
    price: { type: Number, required: [true, "Price is required"], min: [0, "Price cannot be negative"] },
    category: { type: String, required: [true, "Category is required"], trim: true },
    stockQuantity: { type: Number, required: true, min: [0, "Stock cannot be negative"], default: 0 },
    image: { type: String, default: "" }, // absolute URL (uploaded file or external link)
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

productSchema.virtual("stock").get(function () {
  return this.stockQuantity;
});

// Speeds up the name search
productSchema.index({ name: "text" });

module.exports = mongoose.model("Product", productSchema);
