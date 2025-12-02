const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/verifyToken")
const { checkAuth, sendOtp, verifyOtp } = require("../conrollers/auth.controller");

router.get("/me", verifyToken, checkAuth);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

module.exports = router;