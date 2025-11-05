const express = require('express');
const router = express.Router();

const verifyToken = require('../middlewares/verifyToken'); // Middleware to verify token

const { createOrder, getUserOrders, getOrderById } = require('../conrollers/order.controller');

// Create a new order
router.post('/', verifyToken, createOrder);

// Get all orders for a user
router.get('/', verifyToken, getUserOrders);

// Get a specific order by ID
router.get('/:orderId', verifyToken, getOrderById);


module.exports = router;