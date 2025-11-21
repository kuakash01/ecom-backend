const mongoose = require("mongoose");

const sizeSchema = new mongoose.Schema(
    {
        sizeName: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        sizeValue: {
            type: String,
            required: true,
            trim: true
        }
    },
    { timestamps: true }
);

const Sizes = mongoose.model("Size", sizeSchema);
module.exports = Sizes;
