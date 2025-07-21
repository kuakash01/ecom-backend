const express = require('express');
const router = express.Router();
// const upload = require('../middleware/upload'); // path to your upload middleware
const upload = require('../config/multer');
const { addProduct, getAllProducts} = require('../conrollers/product.controller'); // path to your product controller
const verifyToken = require('../middleware/verifyToken'); // Middleware to verify token


// Matches the key in your FormData → formData.append("productImage", file)
router.post('/add',verifyToken, upload.single('productImage'), addProduct);
router.get('/all-products',verifyToken, getAllProducts);



module.exports = router;
