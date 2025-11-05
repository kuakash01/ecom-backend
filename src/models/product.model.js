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
    category: 
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },

    quantity: {
      type: Number,
      default: 0,
    },

    sku:{
      type: String,
      required: true,
    },
    size: {
      type: String, // You can also use [String] if product has multiple sizes
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model("Product", productSchema);
