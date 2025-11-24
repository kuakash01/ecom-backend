// const mongoose = require('mongoose');
const Product = require('../models/product.model'); // Product Model
const Order = require('../models/order.model');




const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    return res.status(200).json({ status: "success", message: "Products find successfully", data: products });
  }
  catch (err) {
    return res.status(500).json({ status: "failed", message: "Products find successfully", error: err.message });
  }
}


const getProductDetails = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId)
      .populate("variants.color variants.size").populate("colorGalleries.color")
      .select("title description category thumbnail variants colorGalleries");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Filter only available variants
    const inStock = product.variants.filter(v => v.quantity > 0);

    let defaultVariant = null;
    if (inStock.length > 0) {
      defaultVariant = inStock.reduce(
        (min, variant) => (variant.price < min.price ? variant : min),
        inStock[0]
      );
    } else {
      // If no variants are in stock, just pick the first variant as default
      defaultVariant = product.variants[0];
    }

    const colorGallery = product.colorGalleries?.find(cg => cg.color._id.toString() === defaultVariant.color._id.toString());
    if (colorGallery) {
      product.defaultGallery = colorGallery.gallery;
    } else {
      product.defaultGallery = [];
    }

    let allColors = product.colorGalleries.map(cg => ({ _id: cg.color._id.toString(), colorName: cg.color.colorName, colorHex: cg.color.colorHex }));

    const responsePayload = {
      title: product.title,
      description: product.description,
      category: product.category,
      thumbnail: product.thumbnail,
      variants: product.variants,
      defaultGallery: product.defaultGallery,
      defaultVariant,
      allColors,
    };

    return res.status(200).json({
      success: true,
      data: responsePayload
    });
  } catch (err) {
    console.error("Error in getProductDetails:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};



const getNewArrivals = async (req, res) => {
  try {
    const products = await Product.find({ newArrival: true }).populate({
      path: "category",
      select: "name"
    }).populate({
      path: "variants.color",
      select: "colorName"
    }).populate({
      path: "variants.size",
      select: "sizeName"
    }).lean();

    if (!products.length) {
      return res.status(404).json({
        status: "failed",
        message: "No Products in new Arrivals"
      });
    }

    const lowestPriceProducts = products.map(product => {
      // Safe fallback if no variants
      if (!product.variants || product.variants.length === 0) {
        return {
          _id: product._id,
          title: product.title,
          thumbnail: product.thumbnail,
          category: product.category,
          price: null,
          mrp: null
        };
      }

      // Filter only in-stock variants first
      const inStockVariants = product?.variants?.filter(v => v.quantity > 0) || [];

      let lowestVariant = null;

      if (inStockVariants.length > 0) {
        lowestVariant = inStockVariants.reduce(
          (min, variant) => variant.price < min.price ? variant : min,
          inStockVariants[0]
        );
      }


      return {
        _id: product._id,
        title: product.title,
        thumbnail: product.thumbnail,
        category: product.category.name,
        price: lowestVariant.price,
        mrp: lowestVariant.mrp,
        color: lowestVariant.color.colorName,
        size: lowestVariant.size.sizeName
      };
    });

    return res.status(200).json({
      status: "success",
      message: "New Arrivals fetched successfully",
      data: lowestPriceProducts
    });

  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: "Internal Server Error",
      error: error.message
    });
  }
};

const getBestSeller = async (req, res) => {
  try {
    const products = await Order.aggregate([
      { $unwind: "$items" },

      {
        $group: {
          _id: "$items.product",
          totalSold: { $sum: "$items.quantity" }
        }
      },

      { $sort: { totalSold: -1 } },

      { $limit: 10 },

      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails"
        }
      },

      { $unwind: "$productDetails" },

      {
        $replaceRoot: {
          newRoot: "$productDetails"
        }
      }
    ]);


    if (products.length === 0)
      return res.status(404).json({ status: "failed", message: "No product found" });

    const lowestPriceProducts = products.map(product => {
      // Safe fallback if no variants
      if (!product.variants || product.variants.length === 0) {
        return {
          _id: product._id,
          title: product.title,
          thumbnail: product.thumbnail,
          category: product.category,
          price: null,
          mrp: null
        };
      }

      const lowestVariant = product.variants.reduce(
        (min, variant) => (variant.price < min.price ? variant : min),
        product.variants[0]
      );

      return {
        _id: product._id,
        title: product.title,
        thumbnail: product.thumbnail,
        category: product.category,
        price: lowestVariant.price,
        mrp: lowestVariant.mrp
      };
    });

    return res.status(200).json({ status: "success", message: "product fetch successfully", data: lowestPriceProducts });
  } catch (error) {
    return res.status(500).json({ status: "failed", message: "Internal Server error" });
  }
}

const getColorGallery = async (req, res) => {
  try {
    const { productId, colorId } = req.params;
    const product = await Product.findById(productId).select("colorGalleries");

    if (!product) {
      return res.status(404).json({ status: "failed", message: "Product not found" });
    }
    const colorGallery = product.colorGalleries.find(cg => cg.color.toString() === colorId);

    if (!colorGallery) {
      return res.status(404).json({ status: "failed", message: "Color gallery not found for the specified color" });
    }

    return res.status(200).json({ status: "success", message: "Color gallery fetched successfully", data: colorGallery });
  } catch (error) {
    return res.status(500).json({ status: "failed", message: "Internal Server Error", error: error.message });
  }
};

module.exports = { getAllProducts, getProductDetails, getNewArrivals, getBestSeller, getColorGallery }