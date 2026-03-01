const mongoose = require("mongoose");

const taxSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    minPrice: {
        type: Number,
        default: 0
    },

    maxPrice: {
        type: Number,
        default: null // null = no upper limit
    },

    rate: {
        type: Number,
        required: true
    },

    isActive: {
        type: Boolean,
        default: true
    },



}, { timestamps: true });

module.exports = mongoose.model("tax", taxSchema);

