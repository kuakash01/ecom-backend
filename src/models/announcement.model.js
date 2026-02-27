const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
    {
        message: {
            type: String,
            required: true,
            trim: true,
        },
        backgroundColor: {
            type: String,
            default: "#000000",
        },
        textColor: {
            type: String,
            default: "#ffffff",
        },
        link: {
            type: String,
            default: "",
        },
        isActive: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const Announcement = mongoose.model("Announcement", announcementSchema);

module.exports = Announcement;