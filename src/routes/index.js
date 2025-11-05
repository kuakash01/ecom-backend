const express = require('express');
const router = express.Router();


// user routes
router.use('/auth', require('./auth.routes'));
router.use('/products', require('./products.routes'));
router.use('/categories', require('./categories.routes'));
router.use('/cart', require('./cart.routes'));
router.use('/address', require('./address.routes'));
router.use('/orders', require('./order.routes'));



// admin routes
router.use('/admin/products', require("./admin/adminProduct.routes"));
router.use('/admin/categories', require("./admin/adminCategories.routes"));
router.use('/admin/orders', require("./admin/adminOrders.routes"));

module.exports = router;
