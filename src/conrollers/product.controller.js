// const mongoose = require('mongoose');
const Product = require('../models/product.model'); // Product Model
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
  try {
    const { name, price, mrp, description, categories, stock, size, rating } = req.body;

    if (!req.files || !req.files.thumbnail) {
      return res.status(400).json({ message: "Thumbnail is required" });
    }

    // 1. Upload Thumbnail (single file)
    const thumbnailFile = req.files.thumbnail[0];
    const thumbnailResult = await uploadToCloudinary(thumbnailFile.buffer, "products/thumbnails");

    // 2. Upload Gallery (multiple files)
    let gallery = [];
    if (req.files.gallery && req.files.gallery.length > 0) {
      gallery = await Promise.all(
        req.files.gallery.map(async (file) => {
          const result = await uploadToCloudinary(file.buffer, "products/gallery");
          return {
            url: result.secure_url,
            public_id: result.public_id,
          };
        })
      );
    }

    // 3. Save product
    const newProduct = await Product.create({
      name,
      price,
      mrp,
      description,
      thumbnail: {
        url: thumbnailResult.secure_url,
        public_id: thumbnailResult.public_id,
      },
      gallery,
      categories,
      stock,
      size,
      rating,
    });

    res.status(201).json({
      message: "Product created successfully",
      data: newProduct,
    });
  } catch (err) {
    console.error("Error in addProduct:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
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


const getProductDetails = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.status(200).json({ success: true, data: product });
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
}

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, mrp, description, categories, stock, size, rating } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 1. Update Thumbnail (if new thumbnail is uploaded)
    if (req.files && req.files.thumbnail) {
      // Delete old thumbnail from Cloudinary
      if (product.thumbnail && product.thumbnail.public_id) {
        await cloudinary.uploader.destroy(product.thumbnail.public_id);
      }

      // Upload new thumbnail
      const thumbnailFile = req.files.thumbnail[0];
      const thumbnailResult = await uploadToCloudinary(thumbnailFile.buffer, "products/thumbnails");
      product.thumbnail = {
        url: thumbnailResult.secure_url,
        public_id: thumbnailResult.public_id,
      };
    }

    // 2. Update Gallery (if new gallery images are uploaded)
    if (req.files && req.files.gallery && req.files.gallery.length > 0) {
      // Delete old gallery images
      if (product.gallery && product.gallery.length > 0) {
        await Promise.all(
          product.gallery.map((img) => cloudinary.uploader.destroy(img.public_id))
        );
      }

      // Upload new gallery
      const newGallery = await Promise.all(
        req.files.gallery.map(async (file) => {
          const result = await uploadToCloudinary(file.buffer, "products/gallery");
          return {
            url: result.secure_url,
            public_id: result.public_id,
          };
        })
      );

      product.gallery = newGallery;
    }

    // 3. Update other fields
    product.name = name ?? product.name;
    product.price = price ?? product.price;
    product.mrp = mrp ?? product.mrp;
    product.description = description ?? product.description;
    product.categories = categories ?? product.categories;
    product.stock = stock ?? product.stock;
    product.size = size ?? product.size;
    product.rating = rating ?? product.rating;

    await product.save();

    res.status(200).json({
      message: "Product updated successfully",
      data: product,
    });
  } catch (err) {
    // console.error("Error in updateProduct:", err);
    res.status(500).json({ message: "Update failed", error: err.message });
  }
};


const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id)
      res.status(400).json({ error: "Product Id is required" })

      // Find the product first 
    const product = await Product.findById(id)
    if (!product)
      return res.status(404).json({ error: "Product not found" });

    
    // Optional: Delete image from Cloudinary
    if (product.image && product.image.public_id) {
      await cloudinary.uploader.destroy(product.image.public_id);
    }

    if (product.gallery && product.gallery.length > 0) {
      await Promise.all(
        product.gallery.map((img) => cloudinary.uploader.destroy(img.public_id))
      );
    }

    // Delete the product from the database
    await Product.deleteOne({ _id: id });

    res.status(200).json({ message: "Product deleted successfully" });

  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: error.message });
  }
}


module.exports = { addProduct, getAllProducts, getProductDetails, updateProduct, deleteProduct }