const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/verifyToken")
const roleCheck = require("../middlewares/roleCheck")

const Categories = require("../models/categories.model");


// controller
const {addCategory, getCategories, getCategory, editCategory, getCategoriesTree, deleteCategory} = require("../conrollers/categories.controller")

router.post("/", verifyToken, roleCheck("admin"), addCategory);
router.get("/", verifyToken, roleCheck(["admin", "user"]), getCategories);
router.get("/tree", verifyToken, roleCheck(["admin", "user"]), getCategoriesTree); // tree based for website
router.get("/:id", verifyToken, roleCheck(["admin", "user"]), getCategory);
router.patch("/:id", verifyToken, roleCheck("admin"), editCategory);
router.delete("/:id", verifyToken, roleCheck("admin"), deleteCategory);

module.exports = router;