const express = require('express');
const router = express.Router();

const verifyToken = require('../middlewares/verifyToken'); // Middleware to verify token
const {checkoutPreview} = require('../conrollers/checkout.controller');

// router.post('/items', verifyToken, addCartItem);
router.post('/preview', verifyToken, checkoutPreview);
// router.post('/guest', getCartGuest);
// router.post('/guest/sync', verifyToken, syncGuestCart);
// router.patch('/items/:itemId', verifyToken, updateCartItem);
// router.delete('/items/:itemId', verifyToken, deleteItem);

module.exports = router; 