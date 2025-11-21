const carouselImage = require("../models/carouselImage.model");

const getCarousel = async (req, res) => {
    try {
        const carousel = await carouselImage.find({status: true});
        if (!carousel)
            res.status(400).json({ status: "failed", message: "Images not found" });

        res.status(200).json({ status: "success", message: "Carousel Fetch successfully", data: carousel });


    } catch (err) {
        res.status(500).json({ status: "failed", message: "Internal Server Error" })
    }
}


module.exports = {getCarousel};