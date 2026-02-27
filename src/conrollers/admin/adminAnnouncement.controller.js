const Announcement = require("../../models/announcement.model");

// Create or Update Announcement (Single Document Logic)
const saveAnnouncement = async (req, res) => {
  try {
    const { message, backgroundColor, textColor, link, isActive } = req.body;

    let announcement = await Announcement.findOne();

    if (announcement) {
      announcement.message = message;
      announcement.backgroundColor = backgroundColor;
      announcement.textColor = textColor;
      announcement.link = link;
      announcement.isActive = isActive;

      await announcement.save();
    } else {
      announcement = await Announcement.create({
        message,
        backgroundColor,
        textColor,
        link,
        isActive,
      });
    }

    res.status(200).json({
      success: true,
      message: "Announcement saved successfully",
      data: announcement,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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
  saveAnnouncement,
  getAnnouncement,
};