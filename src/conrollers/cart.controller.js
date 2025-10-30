const Cart = require('../models/cart.model');
const CartItem = require('../models/cartItem.model');
const { listenerCount } = require('../models/order.model');
const Product = require('../models/product.model');


const addCartItem = async (req, res) => {
    try {
        const { id } = req.user;
        const { productId, quantity } = req.body;

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

        const existingCartItem = await CartItem.findOne({ cart: cart._id, product: productId });
        if (existingCartItem) {
            existingCartItem.quantity += quantity;
            existingCartItem.subTotal = existingCartItem.price * existingCartItem.quantity;
            await existingCartItem.save();
            return res.status(200).json({ status: "success", message: "Product Added successfully", cartItem: existingCartItem });
        }

        const cartItem = await CartItem.create({
            cart: cart._id,
            product: productId,
            quantity: quantity,
            price: product.price,
            subTotal: product.price * quantity,
            user: id
        });
        
        cart.items.push(cartItem._id);
        await cart.save();

        res.status(201).json({ status: "success", message: "Product Added successfully", cartItem });
    } catch (err) {
        return res.status(500).json({ status: "failed", message: "Server error" });
    }

}

const getCart = async (req, res) => {
    const { id } = req.user;
    try {
        let cart = await Cart.findOne({ user: id })
        .populate({
            path: 'items',
            populate: {
                path: 'product' 
            }
        });
        if (!cart) {
            res.status(404).json({ status: "failed", message: "Cart not found" });
        }

        res.json({
            status: "success",
            cart,
        });
    } catch (err) {
        return res.status(500).json({ status: "failed", message: "Server error" });
    }
}

const updateCartItem = async (req, res)=>{
    try{
        const { id } = req.user;
        const {quantity } = req.body;
        const itemId =  req.params.itemId;

        let cart  = await Cart.findOne({user: id}).populate({path: 'items', populate: {path: 'product'}});
        if(!cart){
            return res.status(404).json({ status: "failed", message: "Cart not found" });
        }

        let cartItem = await CartItem.findOne({cart: cart._id, _id: itemId});
        if(!cartItem){
            return res.status(404).json({ status: "failed", message: "Cart item not found" });
        }

        cartItem.quantity = quantity;
        cartItem.subTotal = cartItem.price * quantity;
        await cartItem.save();

        res.status(200).json({
            status: "success",
            message:"Cart updated successfully",
            cart: cart
        })


    } catch(err){
        return res.status(500).json({ status: "failed", message: "Server error" });
    }
}

const deleteItem = async (req, res) => {
    try{
        // const { id } = req.user;
        const itemId =  req.params.itemId;

        const cartItem = await CartItem.findByIdAndDelete({ _id: itemId });
        if(!cartItem){
            return res.status(404).json({ status: "failed", message: "Cart item not found" });
        }

        res.status(200).json({
            status: "success",
            message:"Cart item deleted successfully"
        });

    }catch(err){
        return res.status(500).json({ status: "failed", message: "Server error" });
    }
}

module.exports = { addCartItem, getCart, updateCartItem, deleteItem };