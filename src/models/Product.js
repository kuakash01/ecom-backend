const  mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    // mrp: {
    //   type: Number,
    //   required: true,
    // },
    description: {
      type: String,
    },
    image: {
      type: Object,
    },
    category: {
      type: [String],
    },
    stock: {
      type: Number,
      default: 0,
    },
    size: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model("Product", productSchema);

