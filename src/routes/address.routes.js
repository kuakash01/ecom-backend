const express =  require('express');
const router = express.Router();

const verifyToken = require('../middlewares/verifyToken'); // Middleware to verify token

const {addAddress} = require('../conrollers/address.controller');

router.post('/', verifyToken, addAddress);

module.exports = router;