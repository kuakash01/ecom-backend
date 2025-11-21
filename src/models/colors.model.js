const mongoose = require("mongoose");

const colorSchema = new mongoose.Schema({
  colorName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  colorHex: {
    type: String,
    default: ""
  }
}, { timestamps: true });

module.exports = mongoose.model("Color", colorSchema);
