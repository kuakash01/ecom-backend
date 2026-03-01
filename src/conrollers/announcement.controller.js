const Announcement = require("../models/announcement.model");

// Get Announcement
const getAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findOne();

    res.status(200).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


module.exports = {
  getAnnouncement,
};