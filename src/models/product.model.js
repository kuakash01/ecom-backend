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
      url: { type: String, },
      public_id: { type: String, },
    },

    // Default in-stock variant
    defaultVariantId: {
      type: mongoose.Schema.Types.ObjectId,
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


productSchema.pre("save", function (next) {
  try {
    // Skip if variants not modified and thumbnail exists
    if (
      !this.isModified("variants") &&
      !this.isModified("colorGalleries") &&
      this.thumbnail &&
      this.defaultVariantId
    ) {
      return next();
    }

    // No variants
    if (!this.variants || this.variants.length === 0) {
      this.defaultVariantId = null;
      this.thumbnail = null;
      return next();
    }

    // 1️⃣ Find first in-stock variant
    const inStockVariant = this.variants.find(
      (v) => Number(v.quantity) > 0
    );

    // All out of stock
    if (!inStockVariant) {
      this.defaultVariantId = null;
      this.thumbnail = null;
      return next();
    }

    // 2️⃣ Set default variant
    this.defaultVariantId = inStockVariant._id;

    // 3️⃣ Find matching gallery
    const matchingGallery = this.colorGalleries?.find(
      (g) =>
        g.color &&
        inStockVariant.color &&
        g.color.toString() === inStockVariant.color.toString()
    );

    // 4️⃣ Set thumbnail
    if (
      matchingGallery &&
      Array.isArray(matchingGallery.gallery) &&
      matchingGallery.gallery.length > 0
    ) {
      this.thumbnail = {
        url: matchingGallery.gallery[0].url,
        public_id: matchingGallery.gallery[0].public_id,
      };
    } else {
      // Fallback (no gallery found)
      this.thumbnail = null;
    }

    next();
  } catch (err) {
    next(err);
  }
});



module.exports = mongoose.model("Product", productSchema);


