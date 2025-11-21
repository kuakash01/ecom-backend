const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/verifyToken")
const roleCheck = require("../middlewares/roleCheck")



// controller
const { getCategories, getCategory, getCategoriesTree, getRootCategories} = require("../conrollers/categories.controller")


router.get("/",  getCategories);
router.get("/tree",  getCategoriesTree); // tree based for website
router.get("/root",  getRootCategories); // root categories
router.get("/:id",  getCategory);


module.exports = router;