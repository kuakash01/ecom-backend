const mongoose  = require('mongoose');

const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,   
        ref: 'User',
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        match: [/^[0-9]{10}$/, 'Phone number must be 10 digits']
    },
    alternatePhone: {
        type: String,
        match: [/^[0-9]{10}$/, 'Phone number must be 10 digits']
    },
    street: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true,
        default: 'India'
    },
    pincode: {
        type: String,
        required: true,
        match: [/^\d{6}$/, 'Invalid Indian pincode'],
    },
    isDefault: {
        type: Boolean,
        default: false
    }
});

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;
