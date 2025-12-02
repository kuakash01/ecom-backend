const Cart = require('../models/cart.model');
const CartItem = require('../models/cartItem.model');
const Product = require('../models/product.model');
const Size = require("../models/size.model");
const Color = require("../models/colors.model");


const addCartItem = async (req, res) => {
    try {
        const { id } = req.user;
        const { productId, variantId, quantity } = req.body;

        // Find or create cart
        let cart = await Cart.findOne({ user: id });
        if (!cart) {
            cart = await Cart.create({ user: id, items: [] });
        }


        // Check product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ status: "failed", message: "Product not found" });
        }

        let variant = product.variants.find(v => v._id.toString() === variantId.toString());
        if (!variant) {
            return res.status(404).json({ status: "failed", message: "Variant not found" });
        }



        const existingCartItem = await CartItem.findOne({ cart: cart._id, product: productId, variant: variantId });
        if (existingCartItem) {
            existingCartItem.quantity += quantity;
            existingCartItem.subTotal = variant.price * existingCartItem.quantity;
            await existingCartItem.save();
            return res.status(200).json({ status: "success", message: "Product Added successfully", existingCartItem: true });
        }

        const cartItem = await CartItem.create({
            cart: cart._id,
            product: productId,
            variant: variantId,
            quantity: quantity,
            price: variant.price,
            subTotal: variant.price * quantity,
            user: id
        });

        cart.items.push(cartItem._id);
        await cart.save();

        res.status(201).json({ status: "success", message: "Product Added successfully", existingCartItem: false });
    } catch (err) {
        console.log("error", err);
        return res.status(500).json({ status: "failed", message: "Server error" });
    }

}

const getCart = async (req, res) => {
    const { id } = req.user;
    try {
        let cart = await Cart.findOne({ user: id }).populate("items", "_id product variant quantity");

        if (!cart) {
            res.status(404).json({ status: "failed", message: "Cart not found" });
        }

        const detailedItems = [];

        for (const item of cart.items) {
            const product = await Product.findById(item.product);
            if (!product) continue;

            const variant = product.variants.find(v => v._id.toString() === item.variant.toString());
            if (!variant) continue;

            const variantGallery = product.colorGalleries.find(g => g.color.toString() === variant.color.toString()).gallery || [];

            const variantColor = await Color.findById(variant.color);
            const variantSize = await Size.findById(variant.size);
            detailedItems.push({
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
                subtotal: variant.price * item.quantity
            });
        }

        detailedItems.reverse();

        res.json({
            status: "success",
            message: "Cart fetched successfully",
            data: {
                cart: detailedItems,
                cartSummary: null
            },

        });
    } catch (err) {
        return res.status(500).json({ status: "failed", message: "Server error" });
    }
}

const updateCartItem = async (req, res) => {
    try {
        const { id } = req.user;
        const { quantity, type } = req.body;
        const itemId = req.params.itemId;

        let cart = await Cart.findOne({ user: id }).populate({ path: 'items', populate: { path: 'product' } });
        if (!cart) {
            return res.status(404).json({ status: "failed", message: "Cart not found" });
        }

        let cartItem = await CartItem.findOne({ cart: cart._id, _id: itemId });
        if (!cartItem) {
            return res.status(404).json({ status: "failed", message: "Cart item not found" });
        }

        if (type === "increment") {
            cartItem.quantity += quantity;
        } else if (type === "decrement") {
            cartItem.quantity -= quantity;
        } else {
            cartItem.quantity = quantity;
        }
        cartItem.subTotal = cartItem.price * cartItem.quantity;
        await cartItem.save();

        res.status(200).json({
            status: "success",
            message: "Cart updated successfully",
            cart: cart
        })


    } catch (err) {
        return res.status(500).json({ status: "failed", message: "Server error" });
    }
}

const deleteItem = async (req, res) => {
    try {
        const { id } = req.user;
        const itemId = req.params.itemId;

        const cartItem = await CartItem.findByIdAndDelete({ _id: itemId, user: id });
        if (!cartItem) {
            return res.status(404).json({ status: "failed", message: "Cart item not found" });
        }

        res.status(200).json({
            status: "success",
            message: "Cart item deleted successfully"
        });

    } catch (err) {
        return res.status(500).json({ status: "failed", message: "Server error" });
    }
}


const getCartGuest = async (req, res) => {
    try {
        const { items } = req.body;

        const detailedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId).lean();
            if (!product) continue;

            const variant = product.variants.find(v => v._id.toString() === item.variantId);
            if (!variant) continue;

            const variantGallery = product.colorGalleries.find(g => g.color.toString() === variant.color.toString()).gallery || [];

            const variantColor = await Color.findById(variant.color);
            const variantSize = await Size.findById(variant.size);
            detailedItems.push({
                productId: item.productId,
                variantId: item.variantId,

                title: product.title,
                mainImage: variantGallery[0].url || product.mainImage,
                price: variant.price,
                mrp: variant.mrp,
                stock: variant.quantity,

                attributes: {
                    color: variantColor.colorHex,
                    size: variantSize.sizeValue
                },

                quantity: item.quantity,
                subtotal: variant.price * item.quantity
            });
        }

        res.status(200).json({
            status: "success",
            message: "Guest cart fetched successfully",
            data: {
                cart: detailedItems,
                cartSummary: null,
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
};

const syncGuestCart = async (req, res) => {
    try {
        const { id } = req.user;
        const { items } = req.body;

        // Find or create cart
        let cart = await Cart.findOne({ user: id });
        if (!cart) {
            cart = await Cart.create({ user: id, items: [] });
        }


        for (const item of items) {
            const product = await Product.findById(item.productId).lean();
            if (!product) continue;

            const variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
            if (!variant) continue;


            const existingCartItem = await CartItem.findOne({ cart: cart._id, product: item.productId, variant: item.variantId });
            if (existingCartItem) {
                existingCartItem.quantity += item.quantity;
                existingCartItem.subTotal = variant.price * existingCartItem.quantity;
                await existingCartItem.save();
                return res.status(200).json({ status: "success", message: "Local cart sync to user successfully", existing: true });
            }



            const cartItem = await CartItem.create({
                cart: cart._id,
                product: item.productId,
                variant: item.variantId,
                quantity: item.quantity,
                price: variant.price,
                subTotal: variant.price * item.quantity,
                user: id
            });

            cart.items.push(cartItem._id);
            await cart.save();

        }

        res.status(200).json({ status: "success", message: "Local cart sync to user successfully", existing: false });

    } catch (error) {
        console.log("error", error);
        res.status(500).json({ status: "failed", message: "Internal server error" });
    }
}


module.exports = { addCartItem, getCart, updateCartItem, deleteItem, getCartGuest, syncGuestCart };