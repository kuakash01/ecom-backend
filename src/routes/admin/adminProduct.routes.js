const express = require('express');
const router = express.Router();

const upload = require('../../config/multer');
const { addProduct, getAllProducts, getProductDetails, getProductVariations, updateProduct, deleteProduct, setNewArrival, updateVariant, getColorWiseGallery,updateColorWiseGallery } = require('../../conrollers/admin/adminProduct.controller'); // path to your product controller
const verifyToken = require('../../middlewares/verifyToken'); // Middleware to verify token
const roleCheck = require("../../middlewares/roleCheck");


// Matches the key in your FormData → formData.append("productImage", file)
router.post('/', verifyToken, roleCheck("admin"), upload.single('thumbnail'), addProduct);
router.get('/', getAllProducts);
router.get('/:id', getProductDetails);
router.patch('/:id', verifyToken, roleCheck("admin"), upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'gallery', maxCount: 5 }]), updateProduct);
router.patch('/:productId/newArrival', verifyToken, roleCheck("admin"), setNewArrival);
router.delete("/:id", verifyToken, roleCheck("admin"), deleteProduct);

// variants
router.get('/:productId/variants', getProductVariations);
router.patch('/:productId/variants/:variantId', updateVariant)
router.get('/:productId/color-gallery', getColorWiseGallery);
router.patch('/:productId/color-gallery/:colorId', upload.fields([{ name: 'newImages', maxCount: 5 }]), updateColorWiseGallery)




module.exports = router;
