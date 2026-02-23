// const mongoose = require("mongoose");

// const carouselImageSchema = new mongoose.Schema({
//     image: {
//         url: {
//             require: true,
//             type: String
//         },
//         public_id: {
//             require: true,
//             type: String
//         }
//     },
//     position: {
//         type: Number,
//     },
//     status: {
//         type: Boolean,
//         default: true,
//         required: true
//     },
//     redirectType: {
//         type: String,
//         enum: ["product", "category", "filter", "landing", "external"],
//         default: "filter"
//     },

//     redirectValue: {
//         type: String
//     }
// }, { timestamps: true });

// module.exports = mongoose.model("carouselImage", carouselImageSchema);









const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  public_id: {
    type: String,
    required: true,
  },
});

const carouselImageSchema = new mongoose.Schema(
  {
    desktopImage: {
      type: imageSchema,
      required: true,
    },

    mobileImage: {
      type: imageSchema,
      required: true,
    },

    position: {
      type: Number,
    },

    status: {
      type: Boolean,
      default: true,
      required: true,
    },

    redirectType: {
      type: String,
      enum: ["product", "category", "filter", "landing", "external"],
      default: "filter",
    },

    redirectValue: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("carouselImage", carouselImageSchema);