// scripts/createAdmin.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

mongoose.connect("mongodb+srv://kuakash04:itsmeakash@cluster0.44juevl.mongodb.net/ecom?retryWrites=true&w=majority&appName=Cluster0");

async function createAdmin() {
  const existing = await User.findOne({ email: "admin@gmail.com" });
  if (existing) return console.log("Admin already exists");

  const hashed = await bcrypt.hash("admin123", 10);
  const admin = new User({ name: "admin", email: "admin@gmail.com", password: hashed, role: "admin" });
  await admin.save();
  console.log("Admin created");
  mongoose.disconnect();
}

createAdmin();
