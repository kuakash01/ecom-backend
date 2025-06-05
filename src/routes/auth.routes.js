const express = require("express");
const router = express.Router();


router.get("/signin", require("../conrollers/auth.controller").signin)
router.get("/signup", require("../conrollers/auth.controller").signup)

module.exports = router;