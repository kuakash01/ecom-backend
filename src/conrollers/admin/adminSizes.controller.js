const Sizes = require("../../models/size.model");
const sizeValidation = require("../../validations/sizes.validation");

// ADD SIZE
const addSize = async (req, res) => {
    try {
        const { error } = sizeValidation.validate(req.body);
        if (error) {
            return res.status(400).json({
                status: "failed",
                message: error.details[0].message,
            });
        }

        const { sizeName, sizeValue } = req.body;

        // Check duplicates
        const existingSize = await Sizes.findOne({
            $or: [{ sizeName }, { sizeValue }],
        });

        if (existingSize) {
            return res.status(400).json({
                status: "failed",
                message: "Size name or size value already exists",
            });
        }

        const newSize = new Sizes({
            sizeName,
            sizeValue,
        });

        await newSize.save();

        res.status(201).json({
            status: "success",
            message: "Size added successfully",
        });
    } catch (error) {
        res.status(500).json({
            status: "failed",
            message: "Internal server error",
        });
    }
};

// GET ALL SIZES
// const getAllSizes = async (req, res) => {
//     try {
//         const sizes = await Sizes.find();

//         if (!sizes || sizes.length === 0) {
//             return res.status(404).json({
//                 status: "failed",
//                 message: "Sizes not found",
//             });
//         }

//         res.status(200).json({
//             status: "success",
//             message: "Sizes fetched successfully",
//             data: sizes,
//         });
//     } catch (error) {
//         res.status(500).json({
//             status: "failed",
//             message: "Internal server error",
//         });
//     }
// };
const getAllSizes = async (req, res) => {
  try {
    const sizes = await Sizes.find().sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      message: "Sizes fetched successfully",
      data: sizes || []
    });

  } catch (error) {
    console.error("Get Sizes Error:", error);

    res.status(500).json({
      status: "failed",
      message: "Internal server error"
    });
  }
};

// EDIT SIZE
const editSize = async (req, res) => {
    try {
        const { sizeId } = req.params;

        const { sizeName, sizeValue } = req.body;

        // Check duplicates only if user sends that field
        if (sizeName || sizeValue) {
            const duplicate = await Sizes.findOne({
                _id: { $ne: sizeId },
                $or: [
                    sizeName ? { sizeName } : null,
                    sizeValue ? { sizeValue } : null,
                ].filter(Boolean),
            });

            if (duplicate) {
                return res.status(400).json({
                    status: "failed",
                    message: "Size name or value already exists",
                });
            }
        }

        const updateData = {};
        if (sizeName) updateData.sizeName = sizeName;
        if (sizeValue) updateData.sizeValue = sizeValue;

        const updated = await Sizes.findByIdAndUpdate(
            sizeId,
            updateData,
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({
                status: "failed",
                message: "Size not found",
            });
        }

        res.status(200).json({
            status: "success",
            message: "Size updated successfully",
            data: updated,
        });
    } catch (error) {
        res.status(500).json({
            status: "failed",
            message: "Internal server error",
        });
    }
};

// DELETE SIZE
const deleteSize = async (req, res) => {
    try {
        const { sizeId } = req.params;

        const deleted = await Sizes.findByIdAndDelete(sizeId);

        if (!deleted) {
            return res.status(404).json({
                status: "failed",
                message: "Size not found",
            });
        }

        res.status(200).json({
            status: "success",
            message: "Size deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            status: "failed",
            message: "Internal server error",
        });
    }
};

module.exports = {
    addSize,
    getAllSizes,
    editSize,
    deleteSize,
};
