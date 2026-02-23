// const mongoose = require('mongoose');
const Product = require('../models/product.model'); // Product Model
const Order = require('../models/order.model');
const Category = require("../models/categories.model");
const mongoose = require("mongoose");
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

    const {
      min,
      max,
      color,
      size,
      style,
      search
    } = req.query;

    // -----------------------------
    // 1️⃣ Build Match Stage
    // -----------------------------

    let matchStage = {
      isDeleted: false
    };

    // Category filter
    if (slug !== "shop") {
      const category = await Category.findOne({ slug });

      if (!category) {
        return res.status(404).json({
          status: "failed",
          message: "Category not found"
        });
      }

      const categoryIds = await getLeafCategories(category._id);

      matchStage.category = { $in: categoryIds };
    }

    // Price filter
    if (min || max) {
      matchStage["variants.price"] = {};

      if (min)
        matchStage["variants.price"].$gte = Number(min);

      if (max)
        matchStage["variants.price"].$lte = Number(max);
    }

    // Color filter
    const colorIds = color
      ? color.split(",").map(id => new mongoose.Types.ObjectId(id))
      : [];

    if (colorIds.length) {
      matchStage["variants.color"] = { $in: colorIds };
    }

    // Size filter
    const sizeIds = size
      ? size.split(",").map(id => new mongoose.Types.ObjectId(id))
      : [];

    if (sizeIds.length) {
      matchStage["variants.size"] = { $in: sizeIds };
    }

    // Style filter (filterTags)
    if (style) {
      matchStage.filterTags = style;
    }

    // Search
    if (search) {
      matchStage.$or = [
        { title: { $regex: search, $options: "i" } },
        { searchTags: { $regex: search, $options: "i" } }
      ];
    }

    const hasVariantFilter = colorIds.length || sizeIds.length;


    // -----------------------------
    // 2️⃣ Aggregation Pipeline
    // -----------------------------

    const products = await Product.aggregate([

      // Base filter
      { $match: matchStage },

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

      // Join colors
      {
        $lookup: {
          from: "colors",
          localField: "variants.color",
          foreignField: "_id",
          as: "colorDocs"
        }
      },

      // Join sizes
      {
        $lookup: {
          from: "sizes",
          localField: "variants.size",
          foreignField: "_id",
          as: "sizeDocs"
        }
      },

      // Enrich variants
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
                      cond: {
                        $eq: ["$$c._id", "$$v.color"]
                      }
                    }
                  }
                },

                size: {
                  $first: {
                    $filter: {
                      input: "$sizeDocs",
                      as: "s",
                      cond: {
                        $eq: ["$$s._id", "$$v.size"]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },

      // Preferred Variant (based on filters)
      {
        $addFields: {
          preferredVariant: hasVariantFilter
            ? {
              $first: {
                $filter: {
                  input: "$variants",
                  as: "v",
                  cond: {
                    $and: [

                      // In stock
                      { $gt: ["$$v.quantity", 0] },

                      ...(colorIds.length
                        ? [{ $in: ["$$v.color._id", colorIds] }]
                        : []),

                      ...(sizeIds.length
                        ? [{ $in: ["$$v.size._id", sizeIds] }]
                        : [])

                    ]
                  }
                }
              }
            }
            : null
        }
      },


      // Default Variant
      {
        $addFields: {
          defaultVariant: {
            $first: {
              $filter: {
                input: "$variants",
                as: "v",
                cond: {
                  $eq: ["$$v._id", "$defaultVariantId"]
                }
              }
            }
          }
        }
      },

      // Final Variant (Preferred → Default)
      {
        $addFields: {
          finalVariant: {
            $ifNull: [
              "$preferredVariant",
              { $ifNull: ["$defaultVariant", { $arrayElemAt: ["$variants", 0] }] }
            ]

          }
        }
      },

      // Remove broken products
      {
        $match: {
          finalVariant: { $ne: null }
        }
      },

      {
        $addFields: {
          thumbnail: {
            $let: {
              vars: {
                matchedGallery: {
                  $first: {
                    $filter: {
                      input: "$colorGalleries",
                      as: "cg",
                      cond: {
                        $eq: ["$$cg.color", "$finalVariant.color._id"]
                      }
                    }
                  }
                }
              },
              in: {
                $arrayElemAt: ["$$matchedGallery.gallery", 0]
              }
            }
          }
        }
      },


      // Unique Colors
      {
        $addFields: {
          allColors: {
            $map: {
              input: {
                $setUnion: [
                  {
                    $map: {
                      input: "$variants",
                      as: "v",
                      in: "$$v.color._id"
                    }
                  },
                  []
                ]
              },
              as: "cid",
              in: {
                $let: {
                  vars: {
                    related: {
                      $filter: {
                        input: "$variants",
                        as: "v",
                        cond: {
                          $eq: ["$$v.color._id", "$$cid"]
                        }
                      }
                    },

                    doc: {
                      $first: {
                        $filter: {
                          input: "$colorDocs",
                          as: "c",
                          cond: {
                            $eq: ["$$c._id", "$$cid"]
                          }
                        }
                      }
                    }
                  },
                  in: {
                    _id: "$$doc._id",
                    colorName: "$$doc.colorName",
                    colorHex: "$$doc.colorHex",

                    inStock: {
                      $gt: [
                        {
                          $size: {
                            $filter: {
                              input: "$$related",
                              as: "rv",
                              cond: {
                                $gt: ["$$rv.quantity", 0]
                              }
                            }
                          }
                        },
                        0
                      ]
                    }
                  }
                }
              }
            }
          }
        }
      },

      // Final response
      {
        $project: {
          _id: 1,
          title: 1,
          thumbnail: 1,

          variantId: "$finalVariant._id",

          price: "$finalVariant.price",
          mrp: "$finalVariant.mrp",

          color: "$finalVariant.color.colorName",
          size: "$finalVariant.size.sizeName",

          category: "$category.name",

          allColors: 1
        }
      }

    ]);

    return res.status(200).json({
      status: "success",
      products
    });

  } catch (err) {
    return res.status(500).json({
      status: "failed",
      message: err.message
    });
  }
};


// const getProducts = async (req, res) => {
//   try {
//     const { slug } = req.params;
//     const {
//       min,
//       max,
//       color,
//       size,
//       style,
//       search,
//       tag
//     } = req.query;

//     let finalProducts = []
//     // if slug is shop means all products
//     if (slug === "shop") {

//       let matchStage = {
//         isDeleted: false
//       };


//       const finalProducts = await Product.aggregate([

//         // 1️⃣ Join category
//         {
//           $lookup: {
//             from: "categories",
//             localField: "category",
//             foreignField: "_id",
//             as: "category"
//           }
//         },
//         { $unwind: "$category" },

//         // 2️⃣ Join colors
//         {
//           $lookup: {
//             from: "colors",
//             localField: "variants.color",
//             foreignField: "_id",
//             as: "colorDocs"
//           }
//         },

//         // 3️⃣ Join sizes
//         {
//           $lookup: {
//             from: "sizes",
//             localField: "variants.size",
//             foreignField: "_id",
//             as: "sizeDocs"
//           }
//         },

//         // 4️⃣ Replace variant refs with docs
//         {
//           $addFields: {
//             variants: {
//               $map: {
//                 input: "$variants",
//                 as: "v",
//                 in: {
//                   _id: "$$v._id",
//                   price: "$$v.price",
//                   mrp: "$$v.mrp",
//                   quantity: "$$v.quantity",

//                   color: {
//                     $first: {
//                       $filter: {
//                         input: "$colorDocs",
//                         as: "c",
//                         cond: { $eq: ["$$c._id", "$$v.color"] }
//                       }
//                     }
//                   },

//                   size: {
//                     $first: {
//                       $filter: {
//                         input: "$sizeDocs",
//                         as: "s",
//                         cond: { $eq: ["$$s._id", "$$v.size"] }
//                       }
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         },

//         // 5️⃣ Get default variant using stored ID
//         {
//           $addFields: {
//             defaultVariant: {
//               $first: {
//                 $filter: {
//                   input: "$variants",
//                   as: "v",
//                   cond: {
//                     $eq: ["$$v._id", "$defaultVariantId"]
//                   }
//                 }
//               }
//             }
//           }
//         },
//         // 9️⃣ Build unique colors
//         {
//           $addFields: {
//             allColors: {
//               $map: {
//                 input: {
//                   $setUnion: ["$variants.color._id", []]
//                 },
//                 as: "cid",
//                 in: {
//                   $let: {
//                     vars: {
//                       relatedVariants: {
//                         $filter: {
//                           input: "$variants",
//                           as: "v",
//                           cond: {
//                             $eq: ["$$v.color._id", "$$cid"]
//                           }
//                         }
//                       },

//                       colorDoc: {
//                         $first: {
//                           $filter: {
//                             input: "$colorDocs",
//                             as: "c",
//                             cond: {
//                               $eq: ["$$c._id", "$$cid"]
//                             }
//                           }
//                         }
//                       }
//                     },
//                     in: {
//                       _id: "$$colorDoc._id",
//                       colorName: "$$colorDoc.colorName",
//                       colorHex: "$$colorDoc.colorHex",

//                       // ✅ inStock if ANY variant has qty > 0
//                       inStock: {
//                         $gt: [
//                           {
//                             $size: {
//                               $filter: {
//                                 input: "$$relatedVariants",
//                                 as: "rv",
//                                 cond: { $gt: ["$$rv.quantity", 0] }
//                               }
//                             }
//                           },
//                           0
//                         ]
//                       }
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         },

//         // 6️⃣ Remove products with no default variant (sold out / broken)
//         {
//           $match: {
//             defaultVariant: { $ne: null }
//           }
//         },

//         // 7️⃣ Final structure for frontend
//         {
//           $project: {
//             _id: 1,
//             title: 1,
//             thumbnail: 1,
//             allColors: 1,
//             category: "$category.name",
//             price: "$defaultVariant.price",
//             mrp: "$defaultVariant.mrp",
//             color: "$defaultVariant.color.colorName",
//             size: "$defaultVariant.size.sizeName"
//           }
//         }

//       ]);

//       return res.status(200).json({
//         status: "success",
//         message: "Product fetch successfully",
//         products: finalProducts
//       });
//     }

//     // get category by slug
//     const category = await Category.findOne({ slug });
//     if (!category) return res.status(404).json({ status: "failed", message: "Category not found" });

//     const categoryIds = await getLeafCategories(category._id);


//     // aggregation to fetch products in desired output format
//     finalProducts = await Product.aggregate([
//       { $match: { category: { $in: categoryIds } } },

//       // Join category
//       {
//         $lookup: {
//           from: "categories",
//           localField: "category",
//           foreignField: "_id",
//           as: "category"
//         }
//       },
//       { $unwind: "$category" },

//       // Join COLOR
//       {
//         $lookup: {
//           from: "colors",
//           localField: "variants.color",
//           foreignField: "_id",
//           as: "colorDocs"
//         }
//       },

//       // Join SIZE
//       {
//         $lookup: {
//           from: "sizes",
//           localField: "variants.size",
//           foreignField: "_id",
//           as: "sizeDocs"
//         }
//       },

//       // Attach color & size into each variant
//       {
//         $addFields: {
//           variants: {
//             $map: {
//               input: "$variants",
//               as: "v",
//               in: {
//                 _id: "$$v._id",
//                 price: "$$v.price",
//                 mrp: "$$v.mrp",
//                 quantity: "$$v.quantity",
//                 color: {
//                   $first: {
//                     $filter: {
//                       input: "$colorDocs",
//                       as: "c",
//                       cond: { $eq: ["$$c._id", "$$v.color"] }
//                     }
//                   }
//                 },
//                 size: {
//                   $first: {
//                     $filter: {
//                       input: "$sizeDocs",
//                       as: "s",
//                       cond: { $eq: ["$$s._id", "$$v.size"] }
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         }
//       },

//       // 5️⃣ Get default variant using stored ID
//       {
//         $addFields: {
//           defaultVariant: {
//             $first: {
//               $filter: {
//                 input: "$variants",
//                 as: "v",
//                 cond: {
//                   $eq: ["$$v._id", "$defaultVariantId"]
//                 }
//               }
//             }
//           }
//         }
//       },
//       // 9️⃣ Build unique colors
//       {
//         $addFields: {
//           allColors: {
//             $map: {
//               input: {
//                 $setUnion: ["$variants.color._id", []]
//               },
//               as: "cid",
//               in: {
//                 $let: {
//                   vars: {
//                     relatedVariants: {
//                       $filter: {
//                         input: "$variants",
//                         as: "v",
//                         cond: {
//                           $eq: ["$$v.color._id", "$$cid"]
//                         }
//                       }
//                     },

//                     colorDoc: {
//                       $first: {
//                         $filter: {
//                           input: "$colorDocs",
//                           as: "c",
//                           cond: {
//                             $eq: ["$$c._id", "$$cid"]
//                           }
//                         }
//                       }
//                     }
//                   },
//                   in: {
//                     _id: "$$colorDoc._id",
//                     colorName: "$$colorDoc.colorName",
//                     colorHex: "$$colorDoc.colorHex",

//                     // ✅ inStock if ANY variant has qty > 0
//                     inStock: {
//                       $gt: [
//                         {
//                           $size: {
//                             $filter: {
//                               input: "$$relatedVariants",
//                               as: "rv",
//                               cond: { $gt: ["$$rv.quantity", 0] }
//                             }
//                           }
//                         },
//                         0
//                       ]
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         }
//       },

//       // 6️⃣ Remove products with no default variant (sold out / broken)
//       {
//         $match: {
//           defaultVariant: { $ne: null }
//         }
//       },

//       // 7️⃣ Final structure for frontend
//       {
//         $project: {
//           _id: 1,
//           title: 1,
//           thumbnail: 1,
//           allColors: 1,
//           category: "$category.name",
//           price: "$defaultVariant.price",
//           mrp: "$defaultVariant.mrp",
//           color: "$defaultVariant.color.colorName",
//           size: "$defaultVariant.size.sizeName"
//         }
//       }
//     ]);

//     res.status(200).json({
//       status: "success",
//       message: "Products fetched successfully",
//       products: finalProducts
//     });

//   } catch (err) {
//     res.status(500).json({ status: "failed", message: "Internal server error", error: err.message });
//   }
// }

const getProductDetails = async (req, res) => {
  try {
    const productId = new mongoose.Types.ObjectId(req.params.productId);

    const result = await Product.aggregate([

      // 1️⃣ Match product
      {
        $match: { _id: productId }
      },

      // 2️⃣ Lookup category
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category"
        }
      },
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true
        }
      },

      // 3️⃣ Lookup colors
      {
        $lookup: {
          from: "colors",
          localField: "variants.color",
          foreignField: "_id",
          as: "colorDocs"
        }
      },

      // 4️⃣ Lookup sizes
      {
        $lookup: {
          from: "sizes",
          localField: "variants.size",
          foreignField: "_id",
          as: "sizeDocs"
        }
      },

      // 5️⃣ Enrich variants
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
                      cond: {
                        $eq: ["$$c._id", "$$v.color"]
                      }
                    }
                  }
                },

                size: {
                  $first: {
                    $filter: {
                      input: "$sizeDocs",
                      as: "s",
                      cond: {
                        $eq: ["$$s._id", "$$v.size"]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },

      // 6️⃣ Get default variant
      {
        $addFields: {
          defaultVariant: {
            $first: {
              $filter: {
                input: "$variants",
                as: "v",
                cond: {
                  $eq: ["$$v._id", "$defaultVariantId"]
                }
              }
            }
          }
        }
      },

      // 7️⃣ Fallback default variant
      {
        $addFields: {
          defaultVariant: {
            $ifNull: [
              "$defaultVariant",
              { $arrayElemAt: ["$variants", 0] }
            ]
          }
        }
      },

      // 8️⃣ Get default gallery
      {
        $addFields: {
          defaultGallery: {
            $let: {
              vars: {
                matched: {
                  $first: {
                    $filter: {
                      input: "$colorGalleries",
                      as: "cg",
                      cond: {
                        $eq: [
                          "$$cg.color",
                          "$defaultVariant.color._id"
                        ]
                      }
                    }
                  }
                }
              },
              in: {
                $ifNull: ["$$matched.gallery", []]
              }
            }
          }
        }
      },

      // 9️⃣ Build unique colors
      {
        $addFields: {
          allColors: {
            $map: {
              input: {
                $setUnion: ["$variants.color._id", []]
              },
              as: "cid",
              in: {
                $let: {
                  vars: {
                    relatedVariants: {
                      $filter: {
                        input: "$variants",
                        as: "v",
                        cond: {
                          $eq: ["$$v.color._id", "$$cid"]
                        }
                      }
                    },

                    colorDoc: {
                      $first: {
                        $filter: {
                          input: "$colorDocs",
                          as: "c",
                          cond: {
                            $eq: ["$$c._id", "$$cid"]
                          }
                        }
                      }
                    }
                  },
                  in: {
                    _id: "$$colorDoc._id",
                    colorName: "$$colorDoc.colorName",
                    colorHex: "$$colorDoc.colorHex",

                    // ✅ inStock if ANY variant has qty > 0
                    inStock: {
                      $gt: [
                        {
                          $size: {
                            $filter: {
                              input: "$$relatedVariants",
                              as: "rv",
                              cond: { $gt: ["$$rv.quantity", 0] }
                            }
                          }
                        },
                        0
                      ]
                    }
                  }
                }
              }
            }
          }
        }
      },


      // 🔟 Cleanup
      {
        $project: {
          colorDocs: 0,
          sizeDocs: 0,
          defaultVariantId: 0,
          isDeleted: 0,
          newArrival: 0,
          filterTags: 0,
          searchTags: 0
        }
      }

    ]);

    if (!result.length) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: result[0]
    });

  } catch (err) {
    console.error("getProductDetails error:", err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};



const getNewArrivals = async (req, res) => {
  try {
    const products = await Product.find({ newArrival: true })
      .populate({
        path: "category",
        select: "name"
      })
      .populate({
        path: "variants.color",
        select: "colorName colorHex"
      })
      .populate({
        path: "variants.size",
        select: "sizeName"
      })
      .lean();

    if (!products.length) {
      return res.status(404).json({
        status: "failed",
        message: "No Products in New Arrivals"
      });
    }

    const formatted = products.map(product => {
      // Find default variant
      const defaultVariant = product.variants?.find(
        v => v._id?.toString() === product.defaultVariantId?.toString()
      );

      // Build color availability map
      const colorMap = new Map();

      product.variants.forEach(variant => {
        if (!variant.color) return;

        const colorId = variant.color._id.toString();

        if (!colorMap.has(colorId)) {
          colorMap.set(colorId, {
            name: variant.color.colorName,
            hex: variant.color.colorHex,
            inStock: false
          });
        }

        // If ANY size of this color has stock → available
        if (variant.quantity > 0) {
          colorMap.get(colorId).inStock = true;
        }
      });

      const colors = Array.from(colorMap.values());

      // If no default (sold out / broken)
      if (!defaultVariant) {
        return {
          _id: product._id,
          title: product.title,
          thumbnail: product.thumbnail,
          category: product.category?.name || null,
          price: null,
          mrp: null,
          colors,
          inStock: false
        };
      }

      return {
        _id: product._id,
        title: product.title,
        thumbnail: product.thumbnail,
        category: product.category?.name,
        price: defaultVariant.price,
        mrp: defaultVariant.mrp,
        color: defaultVariant.color?.colorName,
        colors, // 👈 send to frontend
        inStock: true
      };
    });


    return res.status(200).json({
      status: "success",
      message: "New Arrivals fetched successfully",
      data: formatted
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

const getProductFilters = async (req, res) => {
  try {
    const { slug } = req.params;

    let matchStage = {
      isDeleted: false
    };

    // Category filter
    if (slug !== "shop") {
      const category = await Category.findOne({ slug });

      if (!category) {
        return res.status(404).json({
          status: "failed",
          message: "Category not found"
        });
      }

      const categoryIds = await getLeafCategories(category._id);

      matchStage.category = { $in: categoryIds };
    }

    const data = await Product.aggregate([

      { $match: matchStage },

      { $unwind: "$variants" },

      // Join color
      {
        $lookup: {
          from: "colors",
          localField: "variants.color",
          foreignField: "_id",
          as: "color"
        }
      },
      { $unwind: "$color" },

      // Join size
      {
        $lookup: {
          from: "sizes",
          localField: "variants.size",
          foreignField: "_id",
          as: "size"
        }
      },
      { $unwind: "$size" },

      // Only in-stock variants
      {
        $match: {
          "variants.quantity": { $gt: 0 }
        }
      },

      // Group all filters
      {
        $group: {
          _id: null,

          colors: {
            $addToSet: {
              _id: "$color._id",
              name: "$color.colorName",
              hex: "$color.colorHex"
            }
          },

          sizes: {
            $addToSet: {
              _id: "$size._id",
              name: "$size.sizeName"
            }
          },

          styles: {
            $addToSet: "$filterTags"
          },

          minPrice: {
            $min: "$variants.price"
          },

          maxPrice: {
            $max: "$variants.price"
          }
        }
      },

      // Flatten styles array
      {
        $project: {
          colors: 1,
          sizes: 1,
          minPrice: 1,
          maxPrice: 1,

          styles: {
            $reduce: {
              input: "$styles",
              initialValue: [],
              in: { $setUnion: ["$$value", "$$this"] }
            }
          }
        }
      }

    ]);

    res.json({
      status: "success",
      filters: data[0] || {
        colors: [],
        sizes: [],
        styles: [],
        minPrice: 0,
        maxPrice: 0
      }
    });

  } catch (err) {
    res.status(500).json({
      status: "failed",
      message: err.message
    });
  }
};


module.exports = { getProducts, getProductDetails, getNewArrivals, getBestSeller, getColorGallery, getProductFilters }