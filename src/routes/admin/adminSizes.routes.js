const express = require('express');
const router = express.Router();

const { addSize, getAllSizes, editSize, deleteSize, } = require('../../conrollers/admin/adminSizes.controller'); // path to your product controller
const verifyToken = require('../../middlewares/verifyToken'); // Middleware to verify token
const roleCheck = require("../../middlewares/roleCheck");


// Matches the key in your FormData → formData.append("productImage", file)
router.post('/', verifyToken, roleCheck("admin"), addSize);
router.get('/', verifyToken, roleCheck("admin"), getAllSizes);
router.patch('/:sizeId', verifyToken, roleCheck("admin"), editSize);
router.delete('/:sizeId', verifyToken, roleCheck("admin"), deleteSize);



module.exports = router;
