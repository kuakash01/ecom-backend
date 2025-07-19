// scripts/createAdmin.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

mongoose.connect("mongodb://localhost:27017/ecom");

async function createAdmin() {
  const existing = await Admin.findOne({ email: "admin@gmail.com" });
  if (existing) return console.log("Admin already exists");

  const hashed = await bcrypt.hash("admin123", 10);
  const admin = new Admin({ email: "admin@gmail.com", password: hashed });
  await admin.save();
  console.log("Admin created");
  mongoose.disconnect();
}

createAdmin();
