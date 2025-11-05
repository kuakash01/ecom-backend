const express =  require('express');
const router = express.Router();

const verifyToken = require('../middlewares/verifyToken'); // Middleware to verify token

const {addAddress, getAddress, updateAddress,deleteAddress} = require('../conrollers/address.controller');

router.post('/', verifyToken, addAddress);
router.get('/', verifyToken, getAddress);
router.patch('/:addressId', verifyToken, updateAddress);
router.delete('/:addressId', verifyToken, deleteAddress);

module.exports = router;