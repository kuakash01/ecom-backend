const mongoose  = require('mongoose');

const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,   
        ref: 'User',
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    alternatePhone: {
        type: String,
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
        required: true
    }
});

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;
