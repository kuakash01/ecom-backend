const express = require('express');
const router = express.Router();

const { getAllProducts, getProductDetails, getNewArrivals, getBestSeller, getColorGallery } = require('../conrollers/product.controller'); // path to your product controller



// Matches the key in your FormData → formData.append("productImage", file)

router.get('/', getAllProducts);
router.get('/newArrivals', getNewArrivals);
router.get('/bestSeller', getBestSeller);
router.get('/:productId', getProductDetails);
router.get('/:productId/color-gallery/:colorId', getColorGallery);



module.exports = router;
