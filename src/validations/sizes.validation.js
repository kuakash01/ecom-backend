const Joi = require("joi");

const sizeValidation = Joi.object({
    sizeName: Joi.string()
        .required()
        .pattern(/^[a-zA-Z0-9\s\-\/]+$/)
        .messages({
            "string.empty": "Size name is required",
            "string.pattern.base":
                "Size name can only contain letters, numbers, spaces, hyphens, and slashes",
        }),

    sizeValue: Joi.string()
        .required()
        .messages({
            "string.empty": "Size value is required",
        }),
});

module.exports = sizeValidation;
