const express = require('express');
const router = express.Router();

const verifyToken = require('../middlewares/verifyToken'); // Middleware to verify token

const { addAddress, getAddresses, updateAddress, deleteAddress, setDefaultAddress } = require('../conrollers/address.controller');

router.post('/', verifyToken, addAddress);
router.get('/', verifyToken, getAddresses);
router.put('/:addressId', verifyToken, updateAddress);
router.delete('/:addressId', verifyToken, deleteAddress);
router.put(
    "/default/:addressId",
    verifyToken,
    setDefaultAddress
);

module.exports = router;