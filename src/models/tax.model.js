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

    effectiveFrom: {
        type: Date,
        required: true
    },

    effectiveTo: {
        type: Date,
        default: null
    }

}, { timestamps: true });

module.exports = mongoose.model("tax", taxSchema);

