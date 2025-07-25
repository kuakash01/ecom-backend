const express = require("express");
const router = express.Router();
const { signup, signin, checkAuth, signout } = require("../conrollers/auth.controller");
const verifyToken = require("../middleware/verifyToken"); // Middleware to verify token

router.get("/admin/me", verifyToken, checkAuth);
router.post("/admin/signin", signin)
router.get("/admin/signout", signout)
router.get("/admin/signup", signup)


module.exports = router;