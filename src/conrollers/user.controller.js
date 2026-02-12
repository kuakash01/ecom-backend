const User = require("../models/user.model"); // your model path
const uploadToCloudinary = require("../utils/uploadToCloudinary");


const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .select("-password -tokens");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });

  } catch (error) {
    console.error("Get Profile Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


const updateProfile = async (req, res) => {
  try {

    const { name } = req.body;
    const image = req.file;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // UPDATE NAME
    if (name) {
      user.name = name;
    }

    // UPDATE IMAGE
    if (image) {

      const imageResult = await uploadToCloudinary(
        image.buffer,
        "profile"
      );

      user.profilePicture = imageResult.secure_url;
      user.profilePublicId = imageResult.public_id;
    }

    await user.save();

    // ✅ SAME FORMAT AS getProfile
    res.status(200).json({
      success: true,
      data: user,
    });

  } catch (err) {

    console.log("Profile Update Error:", err);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


module.exports = { getProfile, updateProfile };