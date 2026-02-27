const express = require('express');
const router = express.Router();

const upload = require('../../config/multer');
const { addProduct, getAllProducts, getProductDetails, getProductVariations, updateProduct, deleteProduct, setNewArrival, addVariant, updateVariant, disableVariant, getColorWiseGallery, updateColorWiseGallery, getProductList } = require('../../conrollers/admin/adminProduct.controller'); // path to your product controller
const verifyToken = require('../../middlewares/verifyToken'); // Middleware to verify token
const roleCheck = require("../../middlewares/roleCheck");


// Matches the key in your FormData → formData.append("productImage", file)
router.post('/', verifyToken, roleCheck("admin"), addProduct);
router.get('/', getAllProducts);

//for carousel 
router.get("/list", getProductList);

router.get('/:id', getProductDetails);
router.patch('/:id', verifyToken, roleCheck("admin"), updateProduct);
router.patch('/:productId/newArrival', verifyToken, roleCheck("admin"), setNewArrival);
router.delete("/:id", verifyToken, roleCheck("admin"), deleteProduct);

// variants
router.post('/:productId/variants', addVariant);
router.get('/:productId/variants', getProductVariations);
router.patch('/:productId/variants/:variantId', updateVariant)
router.patch('/:productId/variants/:variantId/disable', disableVariant)
router.get('/:productId/color-gallery', getColorWiseGallery);
router.patch('/:productId/color-gallery/:colorId', upload.fields([{ name: 'newImages', maxCount: 5 }]), updateColorWiseGallery)




module.exports = router;
