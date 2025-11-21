const express = require('express');
const router = express.Router();

const { addColor, getAllColors, editColor, deleteColor } = require('../../conrollers/admin/adminColors.controller'); // path to your product controller
const verifyToken = require('../../middlewares/verifyToken'); // Middleware to verify token
const roleCheck = require("../../middlewares/roleCheck");


// Matches the key in your FormData → formData.append("productImage", file)
router.post('/', verifyToken, roleCheck("admin"), addColor);
router.get('/', verifyToken, roleCheck("admin"), getAllColors);
router.patch('/:colorId', verifyToken, roleCheck("admin"), editColor);
router.delete('/:colorId', verifyToken, roleCheck("admin"), deleteColor);



module.exports = router;
