// models/Admin.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // hashed password
  role: {
    type: String,
    enum: ["user", "admin"],  // more roles can be added later
    default: "user"
  },
  tokens: { type: Array }, // for JWT or session management
  profilePicture: { type: String }, // URL to the profile picture
  address: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address"
    }
  ],
  orderHistory: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order"
    }
  ],
  wishlist: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    }
  ],
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },
  ratings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rating"
    }
  ],
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review"
    }
  ]
}, { timestamps: true });

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
