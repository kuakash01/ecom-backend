const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    image: {
        url: { type: String},
        public_id: { type: String},
    },

}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);