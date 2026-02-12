const Setting = require("../models/setting.model");

exports.calculateDeliveryCharge = async (subTotal) => {

    const setting = await Setting.findOne();

    if (!setting) return 50; // fallback

    if (subTotal >= setting.freeDeliveryAbove) return 0;

    return setting.deliveryCharge;
};
