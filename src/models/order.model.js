const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product', // keep optional reference (for analytics/admin lookup)
            },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            mrp: { type: Number, required: true },
            description: String,

            // store a copy of thumbnail
            thumbnail: {
                url: { type: String, required: true },
                public_id: { type: String, required: true },
            },

            // store a copy of gallery images
            gallery: [
                {
                    url: { type: String, required: true },
                    public_id: { type: String, required: true },
                },
            ],

            categories: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Category',
                },
            ],

            size: { type: String, required: true },
            quantity: { type: Number, required: true },
            subTotal: { type: Number, required: true },
        },
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    shippingAddress: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true },
        pincode: { type: String, required: true },
    },
    billingAddress: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true, match: [/^[0-9]{10}$/, 'Phone number must be 10 digits'] },
        alternatePhone: { type: String, match: [/^[0-9]{10}$/, 'Phone number must be 10 digits'] },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true },
        pincode: { type: String, required: true },
    },
    deliveryDate: {
        type: Date,
    },

    paymentDetails: {
        method: {
            type: String,
            enum: ['credit_card', 'debit_card', 'net_banking', 'cod', 'upi'],
            required: true
        },
        transactionId: {
            type: String,
        },
        amount: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending'
        },

    }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;