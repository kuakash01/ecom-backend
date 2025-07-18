// const mongoose = require('mongoose');
const Product = require('../models/Product'); // Product Model
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');



const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// src/controllers/product.controller.js
const addProduct = async (req, res) => {

  // try {
  //   const { productName, price, description, category, quantity, size } = req.body;
  //   const image = req.file?.filename; // OR use req.file.path if full path needed

  //   // Store this path or filename in your DB
  //   const newProduct = await Product.create({
  //     name: productName,
  //     price: price,
  //     description,
  //     image: `/uploads/${image}`,  // Save relative path
  //     category,
  //     stock: quantity,
  //     size
  //   });

  //   res.status(201).json({ success: true, data: newProduct });
  // } catch (err) {
  //   res.status(500).json({ error: err.message });
  // }

  try {
    const { productName, price, description, category, quantity, size } = req.body;
    const file = req.file;
    const result = await uploadToCloudinary(file.buffer, 'my-uploads');
    // Store this path or filename in your DB
    const newProduct = await Product.create({
      name: productName,
      price: price,
      description,
      image: {
        url: result.secure_url,
        public_id: result.public_id,
      },  // Save relative path
      category,
      stock: quantity,
      size
    });

    res.status(200).json({
      message: 'Upload successful',
      data: newProduct,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }

};



const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json({ success: true, data: products });
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
}


module.exports = { addProduct, getAllProducts }