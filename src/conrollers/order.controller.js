const Cart = require('../models/cart.model');
const Order = require('../models/order.model'); // Order Model
const Address = require('../models/address.model'); // Address Model


const createOrder = async (req, res) => {
    try {
        const { billingAddressId, shippingAddressId, paymentMethod } = req.body;
        const userId = req.user.id;



        const cart = await Cart.findOne({ user: userId })
            .populate({
                path: "items",
                populate: {
                    path: "product",
                    model: "Product",
                },
            });

        if (!cart?.items?.length) return res.status(400).json({ status: "failed", message: "Cart is empty", cart });

        // Snapshot products
        const orderItems = cart.items.map(item => ({
            product: item.product._id,
            name: item.product.name,
            price: item.product.price,
            mrp: item.product.mrp,
            description: item.product.description,
            thumbnail: item.product.thumbnail,
            gallery: item.product.gallery,
            categories: item.product.categories,
            size: item.product.size,
            quantity: item.quantity,
            subTotal: item.subTotal,
        }));

        const totalAmount = orderItems.reduce((sum, item) => sum + item.subTotal, 0);

        // Snapshot addresses
        const [billing, shipping] = await Promise.all([
            Address.findById(billingAddressId),
            Address.findById(shippingAddressId)
        ]);

        if (!billing || !shipping)
            return res.status(404).json({ status: "failed", message: "Invalid address provided" });

        const formatAddress = ({ fullName, phone, alternatePhone, street, city, state, country, pincode }) => ({
            fullName, phone, alternatePhone, street, city, state, country, pincode
        });

        // Create order
        const order = await Order.create({
            user: userId,
            items: orderItems,
            totalAmount,
            billingAddress: formatAddress(billing),
            shippingAddress: formatAddress(shipping),
            paymentDetails: {
                method: paymentMethod,
                transactionId: null,
                amount: totalAmount,
                status: "pending"
            }
        });

        // Clear cart
        await Cart.updateOne({ user: userId }, { $set: { items: [] } });

        res.status(201).json({
            status: "success",
            message: "Order created successfully"
        });
    } catch (err) {
        console.error("Error creating order:", err);
        res.status(500).json({ status: "failed", message: "Internal server error" });
    }
};

const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id; // user ID is available in req.user
        const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

        if(orders.length === 0) {
            return res.status(404).json({ status: "failed", message: "No orders found for this user" });
        }

        res.status(200).json({ status: "success", message:"Orders fetched successfully", data: orders });
    } catch (error) {
        res.status(500).json({ status: "failed", message: "Internal server error" });
    }
};

const getOrderById = async (req, res) => {
    try {
        const userId = req.user.id; // user ID is available in req.user
        const orderId = req.params.orderId;

        const order = await Order.findOne({ _id: orderId, user: userId });

        if (!order) {
            return res.status(404).json({ status: "failed", message: "Order not found" });
        }

        res.status(200).json({ status: "success", message: "Order fetched successfully", data: order });
    } catch (error) {
        res.status(500).json({ status: "failed", message: "Internal server error" });
    }
};


module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
};

