// const mongoose = require('mongoose');
const Product = require('../../models/product.model'); // Product Model
const cloudinary = require('../../config/cloudinary');
const streamifier = require('streamifier');
const Tax = require("../../models/tax.model");


// helper functions
const getTaxForPrice = (price, taxes) => {
  return taxes.find(tax => {
    const min = tax.minPrice || 0;
    const max = tax.maxPrice;

    if (max === null) {
      return price >= min;
    }

    return price >= min && price <= max;
  });
};


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


// Add Product common details for variations - Admin
const addProduct = async (req, res) => {
  try {
    const { title, description, category, searchTags, filterTags, variations } = req.body;

    // ---------------- 2️⃣ Variants ----------------
    if (!variations) {
      return res.status(400).json({ message: "Variations are required" });
    }



    // const parsedVariations = JSON.parse(variations);

    const activeTaxes = await Tax.find({ isActive: true });


    // Create variants array without gallery
    let count = 1;
    const variants = [];
    if (variations.length) {
       variants = variations.map(v => {
        const colorCode = v.color.slice(0, 4).toUpperCase();
        const sizeCode = v.size.slice(0, 4).toUpperCase();
        const sku = `${colorCode}-${sizeCode}-${count}`;
        count++;


        // 🔍 Find tax slab based on MRP (or price)
        const tax = getTaxForPrice(v.price, activeTaxes);

        let gstRate = 0;
        let basePrice = v.price;
        let gstAmount = 0;

        if (tax) {
          gstRate = tax.rate;

          basePrice = (v.price * 100) / (100 + gstRate);
          basePrice = Number(basePrice.toFixed(2));

          gstAmount = Number((v.price - basePrice).toFixed(2));
        }


        return {
          color: v.color,
          size: v.size,
          price: v.price,
          mrp: v.mrp,
          quantity: v.quantity,
          sku,
          gstRate,
          basePrice,
          gstAmount
        };
      });
    }
    // ---------------- 3️⃣ Save Product ----------------
    const newProduct = await Product.create({
      title,
      description: description ? description : "",
      category,
      variants: variants.length ? variants : [],
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
    const { title, description, category, searchTags, filterTags, } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 3. Update other fields
    product.title = title ?? product.title;
    product.description = description ?? product.description;
    product.category = category ?? product.category;
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


    // Delete image from Cloudinary
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

// POST /admin/products/:id/variants
const addVariant = async (req, res) => {
  try {
    const { color, size, price, mrp, quantity } = req.body;

    if (!color || !size || !price || !mrp || !quantity) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    /* ----------------- DUPLICATE CHECK ----------------- */

    const exists = product.variants.find(
      v =>
        v.color.toString() === color &&
        v.size.toString() === size &&
        v.isActive !== false
    );

    if (exists) {
      return res.status(400).json({
        message: "This color-size already exists"
      });
    }

    /* ----------------- SKU ----------------- */

    const sku = `${color.slice(0, 4).toUpperCase()}-${size
      .slice(0, 4)
      .toUpperCase()}-${Date.now()}`;

    /* ----------------- TAX ----------------- */
    const activeTaxes = await Tax.find({ isActive: true });

    // Use price for slab (or mrp if your rule says so)
    const taxBase = Number(price);

    const tax = getTaxForPrice(taxBase, activeTaxes);

    if (!tax) {
      return res.status(400).json({
        message: `No tax slab found for price ${taxBase}`
      });
    }

    const gstRate = tax.rate;

    // Inclusive GST
    let basePrice =
      (taxBase * 100) / (100 + gstRate);

    basePrice = Number(basePrice.toFixed(2));

    const gstAmount = Number(
      (taxBase - basePrice).toFixed(2)
    );

    /* ----------------- PUSH VARIANT ----------------- */

    const newVariant = {
      color,
      size,
      price: Number(price),
      mrp: Number(mrp),
      quantity: Number(quantity),
      sku,

      // ✅ Tax fields
      gstRate,
      basePrice,
      gstAmount,

      isActive: true
    };

    product.variants.push(newVariant);

    await product.save();

    res.status(201).json({
      success: true,
      message: "Variant added successfully",
      variants: product.variants
    });

  } catch (err) {
    console.error("Add Variant Error:", err);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message
    });
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

    const activeTaxes = await Tax.find({ isActive: true });
    // Decide price for tax slab (price or mrp)
    const taxBase = price !== undefined ? price : variant.price;

    const tax = getTaxForPrice(taxBase, activeTaxes);

    if (!tax) {
      return res.status(400).json({
        status: "failed",
        message: `No tax slab found for price ${taxBase}`
      });
    }

    const gstRate = tax.rate;

    // Inclusive tax calculation
    let basePrice =
      (taxBase * 100) / (100 + gstRate);

    basePrice = Number(basePrice.toFixed(2));

    const gstAmount = Number(
      (taxBase - basePrice).toFixed(2)
    );

    /* ----------------- Save Tax Fields ----------------- */

    variant.gstRate = gstRate;
    variant.basePrice = basePrice;
    variant.gstAmount = gstAmount;


    await product.save();
    res.status(200).json({ status: "success", message: "Variant updated successfully", variant });
  } catch (error) {
    res.status(500).json({ status: "failed", message: "Internal Server Error", error: error.message });
  }
};


// PATCH /admin/products/:pid/variants/:vid/disable
const disableVariant = async (req, res) => {
  try {
    const { pid, vid } = req.params;

    const product = await Product.findById(pid);

    const variant = product.variants.id(vid);

    if (!variant)
      return res.status(404).json({ message: "Variant not found" });

    variant.isActive = false;

    await product.save();

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
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

// controllers/productController.js

const getProductList = async (req, res) => {
  try {
    const products = await Product.find()
      .select("_id title thumbnail")
      .limit(200) // safety
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      data: products,
    });

  } catch (error) {
    console.error("Product List Error:", error);

    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

module.exports = { addProduct, getAllProducts, getProductDetails, updateProduct, deleteProduct, setNewArrival, getProductVariations, addVariant, updateVariant, disableVariant, getColorWiseGallery, updateColorWiseGallery, getProductList };