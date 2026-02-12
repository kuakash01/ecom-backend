const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
    freeDeliveryAbove: {
        type: Number,
        default: 500
    },

    deliveryCharge: {
        type: Number,
        default: 50
    },

    maxDiscount: {
        type: Number,
        default: 200
    }
});

module.exports = mongoose.model("setting", settingSchema);
