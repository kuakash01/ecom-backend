const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product', // keep optional reference (for analytics/admin lookup)
            },
            title: { type: String, required: true },
            price: { type: Number, required: true },
            mrp: { type: Number, required: true },

            gstRate: { type: Number, required: true },
            basePrice: { type: Number, required: true },
            gstAmount: { type: Number, required: true },

            description: String,


            // store a copy of gallery images
            gallery: [
                {
                    url: { type: String, required: true },
                    public_id: { type: String, required: true },
                },
            ],

            category: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Category',
            },

            size: { type: String, required: true },
            quantity: { type: Number, required: true },
            subTotal: { type: Number, required: true },
        },
    ],

    status: {
        type: String,
        enum: ['pending','confirmed','processing','shipped','delivered','cancelled','returned'],
        default: 'pending'
    },
    address: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true, match: [/^[0-9]{10}$/, 'Phone number must be 10 digits'] },
        alternatePhone: { type: String, match: [/^[0-9]{10}$/, 'Phone number must be 10 digits'] },
        addressLine1: { type: String, required: true },
        addressLine2: { type: String, default: null },
        landmark: { type: String, default: null },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true },
        pincode: { type: String, required: true },
    },

    deliveryDate: {
        type: Date,
    },

    priceSummary: {
        mrpSubTotal: {
            type: Number,
            required: true, // inclusive
        },
        subTotal: {
            type: Number,
            required: true, // inclusive
        },
        basePriceSubTotal: {
            type: Number,
            required: true, // exclusive of GST
        },

        taxAmount: {
            type: Number,
            required: true, // total GST
        },

        discount: {
            type: Number,
            default: 0,
        },

        deliveryCharge: {
            type: Number,
            default: 0,
        },

        total: {
            type: Number,
            required: true,
        },
    },

    paymentDetails: {
        method: {
            type: String,
            enum: ['online', 'cod',],
            required: true
        },
        transactionId: {
            type: String,
            default: null
        },
        payableAmount: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
        },
        paidAt: {
            type: Date,
            default: null
        }

    }
}, { timestamps: true });


const Order = mongoose.model('Order', orderSchema);

module.exports = Order;