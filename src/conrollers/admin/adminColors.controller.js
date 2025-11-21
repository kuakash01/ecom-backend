const Colors = require("../../models/colors.model");
const colorsValidation = require("../../validations/colors.validation");


const addColor = async (req, res) => {
    try {
        // Validate request body
        const { error } = colorsValidation.validate(req.body);
        if (error) {
            return res.status(400).json({
                status: 'failed',
                message: error.details[0].message
            });
        }

        const { colorName, colorHex } = req.body;

        // Duplicate check for colorName
        const nameExists = await Colors.findOne({ colorName });
        if (nameExists) {
            return res.status(400).json({
                status: "failed",
                message: "Color name already exists"
            });
        }

        // Duplicate check for colorHex
        const hexExists = await Colors.findOne({ colorHex });
        if (hexExists) {
            return res.status(400).json({
                status: "failed",
                message: "Color hex code already exists"
            });
        }

        const newColor = new Colors({
            colorName,
            colorHex
        });

        await newColor.save();

        res.status(201).json({
            status: "success",
            message: "Color added successfully"
        });

    } catch (error) {
        res.status(500).json({
            status: "failed",
            message: "Internal server error"
        });
    }
};


const getAllColors = async (req, res) => {
    try {
        const colors = await Colors.find();

        if (!colors || colors.length === 0) {
            return res.status(404).json({
                status: "failed",
                message: "No colors found"
            });
        }

        res.status(200).json({
            status: "success",
            message: "Colors fetched successfully",
            data: colors
        });

    } catch (error) {
        res.status(500).json({
            status: "failed",
            message: "Internal server error"
        });
    }
};



const editColor = async (req, res) => {
    try {
        const { colorId } = req.params;
        const { colorName, colorHex } = req.body;

        // Build update object only with provided fields
        const updates = {};
        if (colorName) updates.colorName = colorName;
        if (colorHex) updates.colorHex = colorHex;

        // If nothing is being updated
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ status: "failed", message: "No fields provided to update" });
        }

        // Check duplicates (excluding the current color itself)
        if (colorName) {
            const exists = await Colors.findOne({ colorName, _id: { $ne: colorId } });
            if (exists) {
                return res.status(400).json({ status: "failed", message: "Color name already exists" });
            }
        }

        if (colorHex) {
            const exists = await Colors.findOne({ colorHex, _id: { $ne: colorId } });
            if (exists) {
                return res.status(400).json({ status: "failed", message: "Color hex already exists" });
            }
        }

        // Update the document
        const updatedColor = await Colors.findByIdAndUpdate(
            colorId,
            { $set: updates },
            { new: true }
        );

        if (!updatedColor) {
            return res.status(404).json({ status: "failed", message: "Color not found" });
        }

        res.status(200).json({
            status: "success",
            message: "Color updated successfully",
            data: updatedColor
        });

    } catch (error) {
        res.status(500).json({
            status: "failed",
            message: "Internal server error"
        });
    }
};


const deleteColor = async (req, res) => {
  try {
    const { colorId } = req.params;

    // Check if color exists
    const color = await Colors.findById(colorId);

    if (!color) {
      return res.status(404).json({
        status: "failed",
        message: "Color not found"
      });
    }

    // Delete it
    await Colors.findByIdAndDelete(colorId);

    res.status(200).json({
      status: "success",
      message: "Color deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: "Internal server error"
    });
  }
};


module.exports = { addColor, getAllColors, editColor, deleteColor };