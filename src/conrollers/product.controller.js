// const mongoose = require('mongoose');
const Product = require('../models/product.model'); // Product Model
const Order = require('../models/order.model');
const Category = require("../models/categories.model");

const Color = require("../models/colors.model");

// Find leaf categories of a given category
const getLeafCategories = async (rootCategoryId) => {
  const queue = [rootCategoryId];
  const leafNodes = [];

  while (queue.length) {
    const current = queue.shift();
    const children = await Category.find({ parent: current });

    if (children.length === 0) {
      // No children means this is a leaf
      leafNodes.push(current);
    } else {
      // Push children for next iteration
      children.forEach(child => queue.push(child._id));
    }
  }
  return leafNodes;
};


const getProducts = async (req, res) => {
  try {
    const { slug } = req.params;
    let finalProducts = []
    // if slug is shop means all products
    if (slug === "shop") {
      const finalProducts = await Product.aggregate([
        // Join category
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category"
          }
        },
        { $unwind: "$category" },

        // Join COLOR for all variants
        {
          $lookup: {
            from: "colors",
            localField: "variants.color",
            foreignField: "_id",
            as: "colorDocs"
          }
        },

        // Join SIZE for all variants
        {
          $lookup: {
            from: "sizes",
            localField: "variants.size",
            foreignField: "_id",
            as: "sizeDocs"
          }
        },

        // Replace variant color/size IDs with actual docs
        {
          $addFields: {
            variants: {
              $map: {
                input: "$variants",
                as: "v",
                in: {
                  _id: "$$v._id",
                  price: "$$v.price",
                  mrp: "$$v.mrp",
                  quantity: "$$v.quantity",
                  color: {
                    $first: {
                      $filter: {
                        input: "$colorDocs",
                        as: "c",
                        cond: { $eq: ["$$c._id", "$$v.color"] }
                      }
                    }
                  },
                  size: {
                    $first: {
                      $filter: {
                        input: "$sizeDocs",
                        as: "s",
                        cond: { $eq: ["$$s._id", "$$v.size"] }
                      }
                    }
                  }
                }
              }
            }
          }
        },

        // Only in-stock variants
        {
          $addFields: {
            validVariants: {
              $filter: {
                input: "$variants",
                as: "v",
                cond: { $gt: ["$$v.quantity", 0] }
              }
            }
          }
        },

        // If no in-stock variant, drop whole product
        { $match: { "validVariants.0": { $exists: true } } },

        // Explode variants to sort by price
        { $unwind: "$validVariants" },
        { $sort: { "validVariants.price": 1 } },

        // Pick cheapest variant per product
        {
          $group: {
            _id: "$_id",
            title: { $first: "$title" },
            thumbnail: { $first: "$thumbnail" },
            category: { $first: "$category.name" },
            lowestVariant: { $first: "$validVariants" }
          }
        },

        // Final structure for FE
        {
          $project: {
            _id: 1,
            title: 1,
            thumbnail: 1,
            category: 1,
            price: "$lowestVariant.price",
            mrp: "$lowestVariant.mrp",
            color: "$lowestVariant.color.colorName",
            size: "$lowestVariant.size.sizeName"
          }
        }
      ]);

      return res.status(200).json({
        status: "success",
        message: "Product fetch successfully",
        products: finalProducts
      });
    }

    // // check category is present in db
    // const category = await Category.findOne({ slug });
    // if (!category) return res.status(404).json({ status: "failed", message: 'Category not found' });

    // // check for nested category
    // const childCategory = await Category.find({ parent: category._id });

    // if (childCategory.length) {
    //   for (const item of childCategory) {
    //     const products = await Product.find({ category: item._id });
    //     for (const item of products)
    //       finalProducts.push(item);
    //   }
    //   return res.status(200).json({ status: "success", message: "Products find successfully", products: finalProducts });
    // }

    // finalProducts = await Product.find({ category });
    // res.status(200).json({ status: "success", message: "Products find successfully", products: finalProducts });

    // get category by slug
    const category = await Category.findOne({ slug });
    if (!category) return res.status(404).json({ status: "failed", message: "Category not found" });

    // // fetch child categories
    // const childCategory = await Category.find({ parent: category._id });

    // // build category array: if leaf -> only itself, else -> itself + children
    // const categoryIds = childCategory.length
    //   ? [category._id, ...childCategory.map(c => c._id)]
    //   : [category._id];


    const categoryIds = await getLeafCategories(category._id);

    // console.log("categories id: ", categoryIds);

    // aggregation to fetch products in desired output format
    finalProducts = await Product.aggregate([
      { $match: { category: { $in: categoryIds } } },

      // Join category
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },

      // Join COLOR
      {
        $lookup: {
          from: "colors",
          localField: "variants.color",
          foreignField: "_id",
          as: "colorDocs"
        }
      },

      // Join SIZE
      {
        $lookup: {
          from: "sizes",
          localField: "variants.size",
          foreignField: "_id",
          as: "sizeDocs"
        }
      },

      // Attach color & size into each variant
      {
        $addFields: {
          variants: {
            $map: {
              input: "$variants",
              as: "v",
              in: {
                _id: "$$v._id",
                price: "$$v.price",
                mrp: "$$v.mrp",
                quantity: "$$v.quantity",
                color: {
                  $first: {
                    $filter: {
                      input: "$colorDocs",
                      as: "c",
                      cond: { $eq: ["$$c._id", "$$v.color"] }
                    }
                  }
                },
                size: {
                  $first: {
                    $filter: {
                      input: "$sizeDocs",
                      as: "s",
                      cond: { $eq: ["$$s._id", "$$v.size"] }
                    }
                  }
                }
              }
            }
          }
        }
      },

      // Only in-stock variants
      {
        $addFields: {
          validVariants: {
            $filter: {
              input: "$variants",
              as: "v",
              cond: { $gt: ["$$v.quantity", 0] }
            }
          }
        }
      },
      { $match: { "validVariants.0": { $exists: true } } },

      // Pick lowest priced variant
      { $unwind: "$validVariants" },
      { $sort: { "validVariants.price": 1 } },
      {
        $group: {
          _id: "$_id",
          title: { $first: "$title" },
          thumbnail: { $first: "$thumbnail" },
          category: { $first: "$category.name" },
          lowestVariant: { $first: "$validVariants" }
        }
      },

      // Final structure
      {
        $project: {
          _id: 1,
          title: 1,
          thumbnail: 1,
          category: 1,
          price: "$lowestVariant.price",
          mrp: "$lowestVariant.mrp",
          color: "$lowestVariant.color.colorName",
          size: "$lowestVariant.size.sizeName"
        }
      }
    ]);

    res.status(200).json({
      status: "success",
      message: "Products fetched successfully",
      products: finalProducts
    });

  } catch (err) {
    res.status(500).json({ status: "failed", message: "Internal server error", error: err.message });
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

    // let allColors = product.colorGalleries.map(cg => ({ _id: cg.color._id.toString(), colorName: cg.color.colorName, colorHex: cg.color.colorHex }));
    const allColors = [
      ...new Map(
        product.variants.map(v => [
          v.color._id,
          {
            _id: v.color._id,
            colorName: v.color.colorName,
            colorHex: v.color.colorHex
          }
        ])
      ).values()
    ];


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

module.exports = { getProducts, getProductDetails, getNewArrivals, getBestSeller, getColorGallery }