

const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload'); // path to your upload middleware
const { addProduct } = require('../conrollers/product.controller'); // path to your product controller

// Matches the key in your FormData → formData.append("productImage", file)
router.post('/add', upload.single('productImage'), addProduct);

module.exports = router;
