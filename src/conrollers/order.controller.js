const Cart = require('../models/cart.model');
const CartItem = require('../models/cartItem.model');
const Order = require('../models/order.model'); // Order Model
const Address = require('../models/address.model');
const crypto = require('node:crypto');
const Product = require('../models/product.model');
const mongoose = require("mongoose");
const pricing = require('../utils/pricing');


const generateOrderId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `ORD${timestamp}${random}`;
};

const createOrder = async (req, res) => {
    try {
        const { type, productId, variantId, buyNowQty, paymentMethod } = req.body;
        const userId = req.user.id;
        let orderItems = [];
        let priceSummary = {
            basePrice:0,
            subtotal: 0,
            taxAmount: 0,
            deliveryCharge: 0,
            discount: 0,
            total: 0,
            finalTotal: 0,
        };

        // Cart order
        if (type === "CART") {

            let cart = await Cart.aggregate([
                { $match: { user: new mongoose.Types.ObjectId(userId) } },
                { $limit: 1 },
                {
                    $lookup: {
                        from: "cartitems",
                        let: { items: "$items" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $in: ["$_id", "$$items"] }
                                }

                            },
                            {
                                $project: {
                                    product: 1,
                                    variant: 1,
                                    quantity: 1,
                                    price: 1,
                                    mrp: 1,
                                }
                            }
                        ],

                        as: "items"
                    }
                },
                {
                    $unwind: "$items"
                },
                {
                    $lookup: {
                        from: "products",

                        let: {
                            productId: "$items.product",
                            variantId: "$items.variant"
                        },

                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ["$_id", "$$productId"] }
                                }
                            },

                            {
                                $project: {
                                    title: 1,
                                    price: 1,
                                    images: 1,
                                    category: 1,
                                    description: 1,
                                    colorGalleries: 1,

                                    variant: {
                                        $filter: {
                                            input: "$variants",
                                            as: "variant",
                                            cond: {
                                                $eq: [
                                                    "$$variant._id",
                                                    { $toObjectId: "$$variantId" }
                                                ]
                                            }
                                        },
                                    }
                                }
                            },
                            {
                                $unwind: "$variant"
                            },
                            {
                                $lookup: {
                                    from: "sizes",
                                    let: { sizeId: "$variant.size" },
                                    pipeline: [
                                        {
                                            $match: { $expr: { $eq: ["$_id", { $toObjectId: "$$sizeId" }] } }
                                        },
                                        {
                                            $project: {
                                                sizeName: 1,
                                                sizeValue: 1
                                            }
                                        }
                                    ],
                                    as: "sizeDetails"
                                }
                            },
                            {
                                $lookup: {
                                    from: "colors",
                                    let: { colorId: "$variant.color" },
                                    pipeline: [
                                        {
                                            $match: { $expr: { $eq: ["$_id", { $toObjectId: "$$colorId" }] } }
                                        },
                                        {
                                            $project: {
                                                colorName: 1,
                                                colorHex: 1
                                            }
                                        }
                                    ],
                                    as: "colorDetails"
                                }
                            },
                            {
                                $unwind: {
                                    path: "$colorDetails",
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $unwind: {
                                    path: "$sizeDetails",
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $addFields: {
                                    gallery: {
                                        $filter: {
                                            input: "$colorGalleries",
                                            as: "gallery",
                                            cond: {
                                                $eq: [
                                                    "$$gallery.color",
                                                    "$variant.color"
                                                ]
                                            }
                                        }
                                    },
                                    "variant.size": "$sizeDetails",
                                    "variant.color": "$colorDetails"

                                }
                            },
                            {
                                $unwind: {
                                    path: "$gallery",
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $project: {
                                    colorGalleries: 0,
                                    variants: 0,
                                    sizeDetails: 0,
                                    colorDetails: 0
                                }
                            }
                        ],

                        as: "product"
                    }
                },
                {
                    $unwind: "$product"
                },
                // {
                //     $lookup: {
                //         from: "categories",
                //         let: { categoryId: "$product.category" },
                //         pipeline: [
                //             {
                //                 $match: {
                //                     $expr: {$eq: ["$_id", "$$categoryId"]}
                //                 }
                //             },
                //             // {
                //             //     $project: {
                //             //         name: 1,
                //             //     }
                //             // }
                //         ],
                //         as: "cat"

                //     }
                // },
                // {
                //     $unwind: "$product.category"
                // },
                {
                    $addFields: {
                        "items.product": "$product",
                        "items.subTotal": { $multiply: ["$items.price", "$items.quantity"] },


                    }
                },
                {
                    $project: {
                        product: 0,
                        "items.variant": 0
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        user: { $first: "$user" },
                        items: { $push: "$items" }
                    }
                },

            ]);
            cart = cart[0];
            // return res.status(200).json({ status: "success", message: "Cart fetched successfully", data: cart });

            if (!cart?.items?.length) return res.status(400).json({ status: "failed", message: "Cart is empty", cart });

            // Snapshot products
            cart.items.map(item => {
                const formattedGallery = item.product.gallery.gallery.map(img => ({
                    public_id: img.public_id,
                    url: img.url
                }));
                let cartItem = {
                    product: item.product._id,
                    title: item.product.title,
                    price: item.product.variant.price,
                    mrp: item.product.variant.mrp,
                    gstRate: item.product.variant.gstRate,
                    basePrice: item.product.variant.basePrice,
                    gstAmount: item.product.variant.gstAmount,
                    description: item.product.description,
                    gallery: formattedGallery,
                    category: item.product.category,
                    size: item.product.variant.size.sizeName,
                    quantity: item.quantity,
                    subTotal: item.product.variant.price * item.quantity,
                }
                orderItems.push(cartItem);
                priceSummary.basePrice += cartItem.basePrice * cartItem.quantity;
                priceSummary.taxAmount += cartItem.gstAmount * cartItem.quantity;
                priceSummary.subtotal += cartItem.subTotal;
                priceSummary.discount += (cartItem.mrp - cartItem.price) * cartItem.quantity;
            });

            priceSummary.total = orderItems.reduce((sum, item) => sum + item.subTotal, 0);
            // return res.status(200).json({ status: "success", message: "Cart order preview fetched successfully", data: { orderItems, totalAmount } });

        } else if (type === "BUY_NOW") {
            // Handle buy now logic (similar to cart but for a single product)
            // Fetch product details, calculate total, and create order item
            let product = await Product.aggregate([
                { $match: { _id: new mongoose.Types.ObjectId(productId) } },
                { $limit: 1 },
                {
                    $project: {
                        title: 1,
                        price: 1,
                        mrp: 1,
                        description: 1,
                        images: 1,
                        category: 1,
                        colorGalleries: 1,
                        variant: {
                            $filter: {
                                input: "$variants",
                                as: "variant",
                                cond: {
                                    $eq: [
                                        "$$variant._id",
                                        { $toObjectId: variantId }
                                    ]
                                }
                            }
                        },
                    }
                },

                {
                    $unwind: "$variant"
                },
                {
                    $addFields: {
                        gallery: {
                            $filter: {
                                input: "$colorGalleries",
                                as: "gallery",
                                cond: {
                                    $eq: [
                                        "$$gallery.color",
                                        "$variant.color"
                                    ]
                                }
                            }
                        }
                    }
                },
                {
                    $unwind: { path: "$gallery", preserveNullAndEmptyArrays: true }
                },
                {
                    $project: {
                        colorGalleries: 0,
                    }
                },
                {
                    $lookup: {
                        from: "sizes",
                        let: { sizeId: "$variant.size" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$_id", { $toObjectId: "$$sizeId" }]
                                    }
                                }
                            },
                            {
                                $project: {
                                    sizeName: 1,
                                    sizeValue: 1
                                }
                            }
                        ],
                        as: "sizeDetails"
                    }
                },
                { $unwind: { path: "$sizeDetails", preserveNullAndEmptyArrays: true } },

                // {
                //     $lookup: {
                //         from: "sizes",
                //         let: { sizeId: "$variant.size" },
                //         pipeline: [
                //             {
                //                 $match: {
                //                     _id: "$$sizeId"
                //                 }
                //             },
                //             {
                //                 $project: {
                //                     sizeName: 1
                //                 }
                //             }
                //         ],
                //         as: "sizeDetails"
                //     }
                // },
            ]);

            product = product[0];

            if (!product) return res.status(404).json({ status: "failed", message: "Product not found" });
            const formattedGallery = product.gallery.gallery.map(img => ({
                public_id: img.public_id,
                url: img.url
            }));

            orderItems.push({
                product: product._id,
                title: product.title,
                price: product.variant.price,
                mrp: product.variant.mrp,
                gstRate: product.variant.gstRate,
                basePrice: product.variant.basePrice,
                gstAmount: product.variant.gstAmount,
                description: product.description,
                gallery: formattedGallery,
                categories: product.categories,
                size: product.sizeDetails.sizeName,
                quantity: buyNowQty,
                subTotal: product.variant.price * buyNowQty
            });
            priceSummary.subtotal += product.variant.price * buyNowQty;
            priceSummary.basePrice += product.variant.basePrice * buyNowQty;
            priceSummary.taxAmount += product.variant.gstAmount * buyNowQty;
            priceSummary.discount += (product.variant.mrp - product.variant.price) * buyNowQty;

            priceSummary.total = orderItems.reduce((sum, item) => sum + item.subTotal, 0);
        } else {
            return res.status(400).json({ status: "failed", message: "Invalid order type" });
        }

        priceSummary.deliveryCharge = await pricing.calculateDeliveryCharge(priceSummary.subtotal);
        priceSummary.finalTotal = priceSummary.total + priceSummary.deliveryCharge;


        // Snapshot address
        const address = await Address.findOne({ user: userId, isDefault: true });
        if (!address)
            return res.status(404).json({ status: "failed", message: "Invalid address provided" });

        const formatAddress = ({ fullName, phone, alternatePhone, addressLine1, addressLine2, landmark, city, state, country, pincode }) => ({
            fullName, phone, alternatePhone, addressLine1, addressLine2, landmark, city, state, country, pincode
        });

        const orderId = generateOrderId()
        let txId = null;

        if (paymentMethod !== "cod") {
            txId = crypto.randomUUID();
        }



        // Create order
        const order = await Order.create({
            user: userId,
            items: orderItems,
            orderId,
            address: formatAddress(address),
            status: "pending",
            priceSummary:{
                subTotal: priceSummary.subtotal,
                basePrice: priceSummary.basePrice,
                taxAmount: priceSummary.taxAmount,
                discount: priceSummary.discount,
                deliveryCharge: priceSummary.deliveryCharge,
                total: priceSummary.finalTotal
            },
            paymentDetails: {
                method: paymentMethod,
                transactionId: txId,
                payableAmount: priceSummary.finalTotal,
                status: "pending"
            }
        });

        // Clear cart only if order placed from cart
        if (type === "CART") {
            await CartItem.deleteMany({ user: userId });
            await Cart.updateOne({ user: userId }, { $set: { items: [] } });
        }


        res.status(201).json({
            status: "success",
            message: "Order created successfully",
            order: {
                orderId,
                paymentDetails: order.paymentDetails,
            }
        });
    } catch (err) {
        console.error("Error creating order:", err);
        res.status(500).json({ status: "failed", message: "Internal server error" });
    }
};

const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id; // user ID is available in req.user
        const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).select("orderId createdAt priceSummary paymentDetails status").lean();

        // if (orders.length) {
        //     return res.status(404).json({ status: "failed", message: "No orders found for this user" });
        // }

        res.status(200).json({ status: "success", message: "Orders fetched successfully", data: orders });
    } catch (error) {
        console.error("Error fetching user orders:", error);
        res.status(500).json({ status: "failed", message: "Internal server error" });
    }
};

const getOrderById = async (req, res) => {

    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        const order = await Order.findOne({
            _id: orderId,
            user: userId
        });

        if (!order) {
            return res.status(404).json({
                status: "failed",
                message: "Order not found"
            });
        }

        const orderSummary = {
            subtotal: order.items.reduce((sum, item) => sum + item.subTotal, 0),
            deliveryCharge: order.items.length > 0 ? 50 : 0, // Flat shipping rate
            total: order.items.reduce((sum, item) => sum + item.subTotal, 0) + (order.items.length > 0 ? 50 : 0),
            discount: 0, // Placeholder for any discounts applied
        };

        res.status(200).json({
            status: "success",
            message: "Order details fetched successfully",
            data: {
                order,
                orderSummary
            }
        });

    } catch (error) {
        console.error("Get order details error:", error);

        res.status(500).json({
            status: "failed",
            message: "Internal server error"
        });
    }

};


module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
};

