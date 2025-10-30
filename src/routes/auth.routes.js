const express = require("express");
const router = express.Router();
const { signup, signin, checkAuth, signout } = require("../conrollers/auth.controller");
const verifyToken = require("../middlewares/verifyToken"); // Middleware to verify token

router.get("/me", verifyToken, checkAuth);
router.post("/signin", signin)
router.get("/signout", verifyToken, signout)
router.post("/signup", signup)


module.exports = router;