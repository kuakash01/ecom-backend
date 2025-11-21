const express = require("express");
const router = express.Router();
const upload = require('../../config/multer');

const verifyToken = require("../../middlewares/verifyToken")
const roleCheck = require("../../middlewares/roleCheck")
const { addCategory, getCategories, getCategory, editCategory, deleteCategory, getSubCategories, getRootCategories, getParentCategories, checkCategoryExist } = require("../../conrollers/admin/adminCategories.controller")



router.get("/:categoryId/children", verifyToken, roleCheck("admin"), getSubCategories); // tree based for website
router.get("/:categoryId/chain", verifyToken, roleCheck("admin"), getParentCategories);
router.get("/:categoryId/exist", verifyToken, roleCheck("admin"), checkCategoryExist);
router.get("/root", verifyToken, roleCheck("admin"), getRootCategories); // only root categories
router.get("/", verifyToken, roleCheck("admin"), getCategories)
router.get("/:id", verifyToken, roleCheck("admin"), getCategory)
router.post("/", verifyToken, roleCheck("admin"), upload.single('image'), addCategory)
router.patch("/:id", verifyToken, roleCheck("admin"), upload.single('image'), editCategory)
router.delete("/:id", verifyToken, roleCheck("admin"), deleteCategory)

module.exports = router;