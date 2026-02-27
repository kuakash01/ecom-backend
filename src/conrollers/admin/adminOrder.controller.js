const Order = require("../../models/order.model")


// admin controllers
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().select("user priceSummary status createdAt paymentDetails").populate({ path: "user", select: "name email" }).sort({ createdAt: -1 });
        res.status(200).json({ status: "success", message: "All orders fetched successfully", data: orders });
    } catch (error) {
        res.status(500).json({ status: "failed", message: "Internal server error" });
    }
}

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      'pending','confirmed','processing',
      'shipped','delivered','cancelled','returned'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid status"
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        status: "failed",
        message: "Order not found"
      });
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      status: "success",
      message: "Order status updated"
    });

  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: "Server error"
    });
  }
};



const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id)
            .populate("user", "name email");

        if (!order) {
            return res.status(404).json({
                status: "failed",
                message: "Order not found"
            });
        }

        res.status(200).json({
            status: "success",
            data: order
        });

    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({
            status: "failed",
            message: "Failed to fetch order"
        });
    }
};

module.exports = { getAllOrders, updateOrderStatus, getOrderById };
