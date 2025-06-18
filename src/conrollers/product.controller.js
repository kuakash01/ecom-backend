// const mongoose = require('mongoose');
const Product = require('../models/Product'); // Product Model



// src/controllers/product.controller.js
const addProduct = async (req, res) => {
    
try {
    const { productName, price, description, category, quantity, size} = req.body;
    const image = req.file?.filename; // OR use req.file.path if full path needed

    // Store this path or filename in your DB
    const newProduct = await Product.create({
      name: productName,
      price: price,
      description,
      image: `/uploads/${image}`,  // Save relative path
      category,
      stock:quantity,
      size
    });

    res.status(201).json({ success: true, data: newProduct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
//   res.send({
//     response: "Success",
//     data: {
//       ...req.body,
//       productImage: req.file?.filename || null
//     }
//   });
};

module.exports = {addProduct}