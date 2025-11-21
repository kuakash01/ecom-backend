const mongoose = require("mongoose");

const carouselImageSchema = new mongoose.Schema({
    image :{
        url: {
            require: true,
            type: String
        },
        public_id:  {
            require: true,
            type: String
        }
    },
    position: {
        type: Number,
    },
    status:{
        type:Boolean,
        default: true,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("carouselImage", carouselImageSchema);