const express = require("express");
const {
  saveAnnouncement,
  getAnnouncement,
} = require("../../conrollers/admin/adminAnnouncement.controller");

const router = express.Router();

router.get("/", getAnnouncement);
router.post("/save", saveAnnouncement);

module.exports = router;