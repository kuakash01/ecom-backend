const express = require("express");
const {
  getAnnouncement,
} = require("../conrollers/announcement.controller");

const router = express.Router();

router.get("/", getAnnouncement);

module.exports = router;