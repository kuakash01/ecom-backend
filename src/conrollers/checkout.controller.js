const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const Address = require('../models/address.model');
const Size = require("../models/size.model");
const Color = require("../models/colors.model");
const pricing = require('../utils/pricing');

const checkoutPreview = async (req, res) => {
    const { id } = req.user;
    const { type, productId, variantId, buyNowQty } = req.body; // 'CART' or 'BUY_NOW'
    try {
        const detailedItems = [];
        let cartSummary = {
            subtotal: 0,
            discount: 0,
            deliveryCharge: 0,
            total: 0,
            finalTotal: 0
        };

        let address = await Address.findOne({ user: id, isDefault: true });

        // Handle checkout preview based on type
        if (type === "CART") {
            let cart = await Cart.findOne({ user: id }).populate("items", "_id product variant quantity mrp price");


            if (!cart) {
                res.status(404).json({ status: "failed", message: "Cart not found" });
            }


            for (const item of cart.items) {
                const product = await Product.findById(item.product);
                if (!product) continue;

                const variant = product.variants.find(v => v._id.toString() === item.variant.toString());
                if (!variant) continue;

                const variantGallery = product.colorGalleries.find(g => g.color.toString() === variant.color.toString()).gallery || [];

                const variantColor = await Color.findById(variant.color);
                const variantSize = await Size.findById(variant.size);
                let cartItem = {
                    _id: item._id,
                    productId: product._id,
                    variantId: variant._id,

                    title: product.title,
                    mainImage: variantGallery[0].url || product.mainImage,
                    price: variant.price,
                    mrp: variant.mrp,
                    stock: variant.quantity,

                    attributes: {
                        color: variantColor,
                        size: variantSize
                    },

                    quantity: item.quantity,
                }
                detailedItems.push(cartItem);

                cartSummary.subtotal += cartItem.mrp * cartItem.quantity;
                cartSummary.total += cartItem.price * cartItem.quantity;
                cartSummary.discount += (cartItem.mrp * cartItem.quantity) - (cartItem.price * cartItem.quantity);
            }


            cartSummary.deliveryCharge = await pricing.calculateDeliveryCharge(cartSummary.total);
            cartSummary.finalTotal = cartSummary.total + cartSummary.deliveryCharge;


        } else if (type === 'BUY_NOW') {
            // For BUY_NOW, you would typically get product and variant details from the request body
            const { productId, variantId, quantity } = req.body;

            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ status: "failed", message: "Product not found" });
            }
            const variant = product.variants.find(v => v._id.toString() === variantId);
            if (!variant) {
                return res.status(404).json({ status: "failed", message: "Variant not found" });
            }

            const variantGallery = product.colorGalleries.find(g => g.color.toString() === variant.color.toString()).gallery || [];

            const variantColor = await Color.findById(variant.color);
            const variantSize = await Size.findById(variant.size);

            let cartitem = {
                productId: product._id,
                variantId: variant._id,

                title: product.title,
                mainImage: variantGallery[0].url || product.mainImage,
                price: variant.price,
                mrp: variant.mrp,
                stock: variant.quantity,

                attributes: {
                    color: variantColor,
                    size: variantSize
                },

                quantity: buyNowQty,
            }
            detailedItems.push(cartitem);

            cartSummary.subtotal = variant.mrp * buyNowQty;
            cartSummary.discount = (variant.mrp * buyNowQty) - (variant.price * buyNowQty);

            cartSummary.total = variant.price * buyNowQty;
            cartSummary.deliveryCharge = await pricing.calculateDeliveryCharge(cartSummary.total);
            cartSummary.finalTotal = cartSummary.total + cartSummary.deliveryCharge;
        }

        detailedItems.reverse();

        res.status(200).json({
            status: "success",
            message: "Checkout details fetched successfully",
            data: {
                address,
                cartItems: detailedItems,
                cartSummary,
                type
            },

        });
    } catch (err) {
        console.error("Error in checkout preview:", err);
        return res.status(500).json({ status: "failed", message: "Server error" });
    }
}

module.exports = {
    checkoutPreview,
};