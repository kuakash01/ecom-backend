const Joi = require('joi');

const addressValidation = Joi.object({
    addressType: Joi.string()
        .valid("home", "work", "other")
        .default("home"),

    fullName: Joi.string().required().pattern(/^[a-zA-Z\s]+$/).messages({
        'string.empty': 'Full name is required',
        'string.pattern.base': 'Full name can only contain letters'
    }),
    phone: Joi.string()
        .pattern(/^[6-9]\d{9}$/)
        .required()
        .messages({
            'string.empty': 'Phone number is required',
            'string.pattern.base': 'Enter a valid 10-digit Indian phone number starting with 6–9'
        }),

    alternatePhone: Joi.string()
        .trim()
        .empty("")              // ✅ convert "" to undefined
        .pattern(/^[6-9]\d{9}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Enter a valid 10-digit Indian phone number starting with 6–9'
        }),

    addressLine1: Joi.string().required().messages({
        "string.empty": "Address Line 1 is required",
    }),

    addressLine2: Joi.string()
        .empty("")
        .optional(),

    landmark: Joi.string()
        .empty("")
        .optional(),

    city: Joi.string().required().pattern(/^[a-zA-Z\s]+$/).messages({
        'string.pattern.base': 'City name can only contain letters'
    }),
    state: Joi.string().required().pattern(/^[a-zA-Z\s]+$/).messages({
        'string.pattern.base': 'State name can only contain letters'
    }),
    country: Joi.string().default('India').pattern(/^[a-zA-Z\s]+$/).messages({
        'string.pattern.base': 'Country name can only contain letters'
    }),
    pincode: Joi.string().pattern(/^\d{6}$/).required().messages({
        'string.empty': 'Pincode is required',
        'string.pattern.base': 'Enter a valid 6-digit Indian pincode'
    }),

})

module.exports = addressValidation;
