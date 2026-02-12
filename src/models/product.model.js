const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
    },

    // Thumbnail (main image)
    thumbnail: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },


    // Product can belong to multiple categories
    category:
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    variants: [
      {
        color: { type: mongoose.Schema.Types.ObjectId, ref: "Color" },
        size: { type: mongoose.Schema.Types.ObjectId, ref: "Size" },
        price: { type: Number, required: true },
        mrp: { type: Number, required: true },
        quantity: { type: Number, default: 0 },
        sku: { type: String, },
        gstRate: {
          type: Number,
          required: true
        },
        basePrice: {
          type: Number,
          required: true
        },
        gstAmount: {  
          type: Number,
          required: true
        }
      }
    ],
    // Color-wise gallery
    colorGalleries: [
      {
        color: { type: mongoose.Schema.Types.ObjectId, ref: "Color" },
        gallery: [
          {
            url: String,
            public_id: String
          }
        ]
      }
    ],

    newArrival: {
      type: Boolean,
      default: false
    },
    searchTags: {
      type: [String],
      default: [],
    },
    filterTags: {
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


