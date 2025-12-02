// const mongoose = require('mongoose');
const Product = require('../../models/product.model'); // Product Model
const cloudinary = require('../../config/cloudinary');
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
// const addProduct = async (req, res) => {
//   try {
//     const { name, price, mrp, size, category, quantity, sku, searchTags, filterTags, description } = req.body;

//     if (!req.files || !req.files.thumbnail) {
//       return res.status(400).json({ message: "Thumbnail is required" });
//     }

//     // 1. Upload Thumbnail (single file)
//     const thumbnailFile = req.files.thumbnail[0];
//     const thumbnailResult = await uploadToCloudinary(thumbnailFile.buffer, "products/thumbnails");

//     // 2. Upload Gallery (multiple files)
//     let gallery = [];
//     if (req.files.gallery && req.files.gallery.length > 0) {
//       gallery = await Promise.all(
//         req.files.gallery.map(async (file) => {
//           const result = await uploadToCloudinary(file.buffer, "products/gallery");
//           return {
//             url: result.secure_url,
//             public_id: result.public_id,
//           };
//         })
//       );
//     }

//     // 3. Save product
//     const newProduct = await Product.create({
//       name,
//       price,
//       mrp,
//       description,
//       thumbnail: {
//         url: thumbnailResult.secure_url,
//         public_id: thumbnailResult.public_id,
//       },
//       gallery,
//       category,
//       quantity,
//       size,
//       sku,
//       searchTags: searchTags ? searchTags.split(',').map(tag => tag.trim()) : [],
//       filterTags: filterTags ? filterTags.split(',').map(tag => tag.trim()) : [],
//     });

//     res.status(201).json({
//       message: "Product created successfully",
//       data: newProduct,
//     });
//   } catch (err) {
//     console.error("Error in addProduct:", err);
//     res.status(500).json({ message: "Upload failed", error: err.message });
//   }
// };


// const addProduct = async (req, res) => {
//   try {
//     const {
//       title,
//       description,
//       category,
//       searchTags,
//       filterTags,
//       variations, // JSON string from frontend
//     } = req.body;

//     // ---------------- 1️⃣ Thumbnail ----------------
//     const thumbnailFile = req.files.find(f => f.fieldname === "thumbnail");
//     if (!thumbnailFile) {
//       return res.status(400).json({ message: "Thumbnail is required" });
//     }

//     const thumbnailResult = await uploadToCloudinary(thumbnailFile.buffer, "products/thumbnails");
//     const thumbnail = {
//       url: thumbnailResult.secure_url,
//       public_id: thumbnailResult.public_id,
//     };

//     // ---------------- 2️⃣ Variants ----------------
//     // Frontend sends:
//     // variations = JSON.stringify([
//     //   { color, size, price, mrp, quantity, sku },
//     //   ...
//     // ])
//     const parsedVariations = JSON.parse(variations);

//     // Map color galleries from req.files
//     const variantGalleriesMap = {};
//     if (req.files) {
//       req.files.forEach(file => {
//         const match = file.fieldname.match(/^colorGalleries_(.+)\[\]$/);
//         if (match) {
//           const colorId = match[1];
//           if (!variantGalleriesMap[colorId]) variantGalleriesMap[colorId] = [];
//           variantGalleriesMap[colorId].push(file);
//         }
//       });
//     }

//     // Upload variant galleries to Cloudinary
//     const variants = [];
//     for (const v of parsedVariations) {
//       const galleryFiles = variantGalleriesMap[v.color] || [];
//       const gallery = await Promise.all(
//         galleryFiles.map(async file => {
//           const uploaded = await uploadToCloudinary(file.buffer, "products/variants");
//           return {
//             url: uploaded.secure_url,
//             public_id: uploaded.public_id,
//           };
//         })
//       );

//       variants.push({
//         color: v.color,
//         size: v.size,
//         price: v.price,
//         mrp: v.mrp,
//         quantity: v.quantity,
//         sku: v.sku,
//         gallery,
//       });
//     }

//     // ---------------- 3️⃣ Save Product ----------------
//     const newProduct = await Product.create({
//       title,
//       description,
//       category,
//       thumbnail,
//       variants,
//       searchTags: searchTags ? searchTags.split(",").map(t => t.trim()) : [],
//       filterTags: filterTags ? filterTags.split(",").map(t => t.trim()) : [],
//     });

//     res.status(201).json({
//       message: "Product created successfully",
//       data: newProduct,
//     });
//   } catch (err) {
//     console.error("Error in addProduct:", err);
//     res.status(500).json({ message: "Upload failed", error: err.message });
//   }
// };

const addProduct = async (req, res) => {
  try {
    const { title, description, category, searchTags, filterTags, variations } = req.body;

    // ---------------- 1️⃣ Thumbnail ----------------
    if (!req.file) {
      return res.status(400).json({ message: "Thumbnail is required" });
    }

    let thumbnail;
    try {
      const thumbnailResult = await uploadToCloudinary(req.file.buffer, "products/thumbnails");
      thumbnail = {
        url: thumbnailResult.secure_url,
        public_id: thumbnailResult.public_id,
      };
    } catch (err) {
      console.error("Thumbnail upload failed:", err);
      return res.status(500).json({ message: "Thumbnail upload failed" });
    }

    // ---------------- 2️⃣ Variants ----------------
    if (!variations) {
      return res.status(400).json({ message: "Variations are required" });
    }

    const parsedVariations = JSON.parse(variations);

    // Create variants array without gallery
    let count = 1;
    const variants = parsedVariations.map(v => {
      const colorCode = v.color.slice(0, 4).toUpperCase();
      const sizeCode = v.size.slice(0, 4).toUpperCase();
      const sku = `${colorCode}-${sizeCode}-${count}`;
      count++;

      return {
        color: v.color,
        size: v.size,
        price: v.price,
        mrp: v.mrp,
        quantity: v.quantity,
        sku,
      };
    });

    // ---------------- 3️⃣ Save Product ----------------
    const newProduct = await Product.create({
      title,
      description,
      category,
      thumbnail,
      variants,
      searchTags: searchTags ? searchTags.split(",").map(t => t.trim()) : [],
      filterTags: filterTags ? filterTags.split(",").map(t => t.trim()) : [],
    });

    res.status(201).json({
      status: "success",
      message: "Product created successfully",
      data: newProduct,
    });
  } catch (err) {
    console.error("Error in addProduct:", err);
    res.status(500).json({ status: "failed", message: "Upload failed", error: err.message });
  }
};





const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}).select('title thumbnail category  searchTags filterTags newArrival description category createdAt updatedAt ').populate("category", "name slug");
    res.status(200).json({ status: "success", message: "Products retrieved successfully", data: products });
  }
  catch (err) {
    res.status(500).json({ status: "failed", message: "Internal Server Error", error: err.message });
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
    const { name, price, mrp, size, category, quantity, sku, searchTags, filterTags, description, existingGallery } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 1. Update Thumbnail (if new thumbnail is uploaded)
    if (req.files && req.files.thumbnail) {
      // Delete old thumbnail from Cloudinary (disabled intentionally)
      // if (product.thumbnail && product.thumbnail.public_id) {
      //   await cloudinary.uploader.destroy(product.thumbnail.public_id);
      // }

      const thumbnailFile = req.files.thumbnail[0];
      const thumbnailResult = await uploadToCloudinary(thumbnailFile.buffer, "products/thumbnails");

      product.thumbnail = {
        url: thumbnailResult.secure_url,
        public_id: thumbnailResult.public_id,
      };
    }

    // 2. Update Gallery
    // Keep only existing URLs that are still sent in the request (req.body.existingGallery)
    let updatedGallery = [];

    if (existingGallery) {
      // Parse existingGallery (it can come as string or array)
      const existing = Array.isArray(existingGallery)
        ? existingGallery
        : [existingGallery];
      updatedGallery = product.gallery.filter(img => existing.includes(img.url));
    }

    // If new gallery images are uploaded, append them
    if (req.files && req.files.gallery && req.files.gallery.length > 0) {
      // Delete old gallery images (disabled intentionally)
      // if (product.gallery && product.gallery.length > 0) {
      //   await Promise.all(
      //     product.gallery.map((img) => cloudinary.uploader.destroy(img.public_id))
      //   );
      // }

      const newGallery = await Promise.all(
        req.files.gallery.map(async (file) => {
          const result = await uploadToCloudinary(file.buffer, "products/gallery");
          return {
            url: result.secure_url,
            public_id: result.public_id,
          };
        })
      );

      // Append new images to the filtered old ones
      updatedGallery = [...updatedGallery, ...newGallery];
    }

    // Replace gallery with final updated list
    product.gallery = updatedGallery;

    // 3. Update other fields
    product.name = name ?? product.name;
    product.price = price ?? product.price;
    product.mrp = mrp ?? product.mrp;
    product.description = description ?? product.description;
    product.category = category ?? product.category;
    product.quantity = quantity ?? product.quantity;
    product.size = size ?? product.size;
    product.sku = sku ?? product.sku;
    product.searchTags = searchTags ? searchTags.split(",").map(tag => tag.trim()) : product.searchTags;
    product.filterTags = filterTags ? filterTags.split(",").map(tag => tag.trim()) : product.filterTags;

    await product.save();

    res.status(200).json({
      message: "Product updated successfully",
      data: product,
    });
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
    console.log("Error updating product", err)
  }
};


const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id)
      res.status(400).json({ status: "failed", message: "Product Id is required", error: "Product Id is required" })

    // Find the product first 
    const product = await Product.findById(id)
    if (!product)
      return res.status(404).json({ status: "failed", message: "Product not found", error: "Product not found" });


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

    res.status(200).json({ status: "success", message: "Product deleted successfully" });

  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: error.message });
  }
}

const setNewArrival = async (req, res) => {
  try {
    const { productId } = req.params;
    const { status } = req.body;

    if (!productId) {
      return res.status(400).json({
        status: "failed",
        message: "Product ID is required"
      });
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { newArrival: status },
      { new: true } // returns the updated doc
    );

    if (!product) {
      return res.status(404).json({
        status: "failed",
        message: "Product not found"
      });
    }

    return res.status(200).json({
      status: "success",
      message: `Product marked as ${status ? "New Arrival" : "Regular"}`,
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: "Internal Server Error"
    });
  }
};

const getProductVariations = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId).populate("variants.color")
      .populate("variants.size");
    if (!product) {
      return res.status(404).json({ status: "failed", message: "Product not found" });
    }
    const variations = product.variants || [];
    res.status(200).json({ status: "success", message: "Variations fetched successfully", variations });
  } catch (error) {
    res.status(500).json({ status: "failed", message: "Internal Server Error", error: error.message });
  }
};

const updateVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const { mrp, price, quantity } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ status: "failed", message: "Product not found" });
    }
    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({ status: "failed", message: "Variant not found" });
    }

    if (mrp !== undefined) variant.mrp = mrp;
    if (price !== undefined) variant.price = price;
    if (quantity !== undefined) variant.quantity = quantity;

    await product.save();
    res.status(200).json({ status: "success", message: "Variant updated successfully", variant });
  } catch (error) {
    res.status(500).json({ status: "failed", message: "Internal Server Error", error: error.message });
  }
};

const getColorWiseGallery = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ status: "failed", message: "Product not found" });
    }
    const colorGalleries = product.colorGalleries || [];
    res.status(200).json({ status: "success", message: "Color-wise galleries fetched successfully", data: colorGalleries });
  } catch (error) {
    res.status(500).json({ status: "failed", message: "Internal Server Error", error: error.message });
  }
};


const updateColorWiseGallery = async (req, res) => {
  try {
    const { productId, colorId } = req.params;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ status: "failed", message: "Product not found" });

    // Parse existing images sent from frontend (after removals)
    const existingGallery = req.body.gallery ? JSON.parse(req.body.gallery) : [];

    // Upload new images if any
    const newImages = req.files?.newImages || [];
    const uploadedImages = [];

    for (const file of newImages) {
      if (!file || !file.buffer) continue;
      const uploaded = await uploadToCloudinary(file.buffer, "products/color-galleries");
      uploadedImages.push({
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
      });
    }

    // Find or create color gallery
    let colorGallery = product.colorGalleries.find(cg => cg.color.toString() === colorId);
    // if (!colorGallery) {
    //   colorGallery = { color: colorId, gallery: [] };
    //   product.colorGalleries.push(colorGallery);
    // }
    if (!colorGallery) {
      colorGallery = product.colorGalleries.create({
        color: colorId,
        gallery: []
      });

      product.colorGalleries.push(colorGallery);
    }

    // ✅ REPLACE the gallery entirely
    colorGallery.gallery = [...existingGallery, ...uploadedImages];

    await product.save();

    return res.status(200).json({
      status: "success",
      message: "Color-wise gallery updated",
      colorGallery,
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


module.exports = { addProduct, getAllProducts, getProductDetails, updateProduct, deleteProduct, setNewArrival, getProductVariations, updateVariant, getColorWiseGallery, updateColorWiseGallery };