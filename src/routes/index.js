const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/products', require('./products.routes'));
router.use('/categories', require('./categories.routes'));
router.use('/cart', require('./cart.routes'));
router.use('/address', require('./address.routes'));
// router.use('/orders', require('./orders.routes'));

module.exports = router;
