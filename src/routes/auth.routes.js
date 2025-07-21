const express = require("express");
const router = express.Router();
const { signup, signin, checkAuth } = require("../conrollers/auth.controller");
const verifyToken = require("../middleware/verifyToken"); // Middleware to verify token

router.get("/admin/me", verifyToken, checkAuth);
router.post("/admin/signin", signin)
router.get("/admin/signup", signup)


module.exports = router;