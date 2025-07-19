const express = require("express");
const router = express.Router();


router.post("/admin/signin", require("../conrollers/auth.controller").signin)
router.get("/admin/signup", require("../conrollers/auth.controller").signup)

module.exports = router;