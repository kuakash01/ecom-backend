const express = require('express');
const router = express.Router();

const verifyToken = require('../middlewares/verifyToken'); // Middleware to verify token
const {addCartItem, getCart, updateCartItem, deleteItem} = require('../conrollers/cart.controller');

router.post('/items', verifyToken, addCartItem);
router.get('/', verifyToken, getCart);
router.patch('/items/:itemId', verifyToken, updateCartItem);
router.delete('/items/:itemId', verifyToken, deleteItem);

module.exports = router; 