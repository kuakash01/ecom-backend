const Order = require("../../models/order.model")


// admin controllers
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().select("user totalAmount status createdAt paymentDetails").populate({ path: "user", select: "name email" }).sort({ createdAt: -1 });
        res.status(200).json({ status: "success", message: "All orders fetched successfully", data: orders });
    } catch (error) {
        res.status(500).json({ status: "failed", message: "Internal server error" });
    }   
}

const updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const { status } = req.body;
        const validStatuses = ['pending', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ status: "failed", message: "Invalid status value" });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ status: "failed", message: "Order not found" });
        }
        order.status = status;
        await order.save();

        res.status(200).json({ status: "success", message: "Order status updated successfully" });

    } catch (error) {
        res.status(500).json({ status: "failed", message: "Internal server error" });
    }
};

module.exports = {getAllOrders, updateOrderStatus};
