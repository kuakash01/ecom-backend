const Joi = require('joi');

const colorsValidation = Joi.object({
    colorName: Joi.string().required().pattern(/^[a-zA-Z\s]+$/).messages({
        'string.empty': 'Color name is required',
        'string.pattern.base': 'Color name can only contain letters'
    }),
    colorHex: Joi.string()
        .required()
        .messages({
            'string.empty': 'Color Hex is required',
        }),


})

module.exports = colorsValidation;
