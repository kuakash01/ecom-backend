const express = require('express');
const router = express.Router();

const { getProducts, getProductDetails, getNewArrivals, getBestSeller, getColorGallery, getProductFilters } = require('../conrollers/product.controller'); // path to your product controller



// Matches the key in your FormData → formData.append("productImage", file)

router.get('/newArrivals', getNewArrivals);
router.get('/bestSeller', getBestSeller);
router.get('/:productId', getProductDetails);
router.get('/:slug/list', getProducts);
router.get('/:slug/filters', getProductFilters);
router.get('/:productId/color-gallery/:colorId', getColorGallery);



module.exports = router;
