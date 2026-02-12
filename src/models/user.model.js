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
    enum: ["customer", "admin"],  // more roles can be added later
    default: "customer",
    required: true
  },
  tokens: { type: Array }, // for JWT or session management
  profilePicture: { type: String }, // URL to the profile picture


}, { timestamps: true });

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
