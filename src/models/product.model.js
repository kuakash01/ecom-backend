const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    mrp: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
    },

    // Thumbnail (main image)
    thumbnail: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },

    // Gallery (extra images)
    gallery: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],

    // Product can belong to multiple categories
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],

    stock: {
      type: Number,
      default: 0,
    },

    size: {
      type: String, // You can also use [String] if product has multiple sizes
      required: true,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model("Product", productSchema);
