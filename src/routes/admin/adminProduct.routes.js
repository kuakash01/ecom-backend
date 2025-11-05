const express = require('express');
const router = express.Router();

const upload = require('../../config/multer');
const { addProduct, getAllProducts, getProductDetails, updateProduct, deleteProduct} = require('../../conrollers/admin/adminProduct.controller'); // path to your product controller
const verifyToken = require('../../middlewares/verifyToken'); // Middleware to verify token
const roleCheck = require("../../middlewares/roleCheck");


// Matches the key in your FormData → formData.append("productImage", file)
router.post('/',verifyToken, roleCheck("admin"), upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'gallery', maxCount: 5 }]), addProduct);
router.get('/', getAllProducts);
router.get('/:id', getProductDetails);
router.patch('/:id', verifyToken, roleCheck("admin"), upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'gallery', maxCount: 5 }]), updateProduct);
router.delete("/:id", verifyToken, roleCheck("admin"), deleteProduct);



module.exports = router;
