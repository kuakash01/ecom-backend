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
    image: {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
    },

}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);