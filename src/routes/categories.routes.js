const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/verifyToken")
const roleCheck = require("../middlewares/roleCheck")



// controller
const { getCategories, getCategory, getCategoriesTree} = require("../conrollers/categories.controller")


router.get("/", verifyToken, roleCheck(["admin", "user"]), getCategories);
router.get("/tree", verifyToken, roleCheck(["admin", "user"]), getCategoriesTree); // tree based for website
router.get("/:id", verifyToken, roleCheck(["admin", "user"]), getCategory);


module.exports = router;