const express = require('express');
const router = express.Router();
// const upload = require('../middleware/upload'); // path to your upload middleware
const upload = require('../config/multer');
const { addProduct, getAllProducts} = require('../conrollers/product.controller'); // path to your product controller



// Matches the key in your FormData → formData.append("productImage", file)
router.post('/add', upload.single('productImage'), addProduct);
router.get('/all-products', getAllProducts);




module.exports = router;
