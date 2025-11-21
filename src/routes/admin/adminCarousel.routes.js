const express = require("express");
const router = express.Router();

const { getCarousel, addCarouselImage, updateImageStatus, updatePosition, deleteCarouselImage} = require("../../conrollers/admin/adminCarousel.controller");
const verifyToken = require("../../middlewares/verifyToken");
const roleCheck = require("../../middlewares/roleCheck");
const upload = require("../../config/multer");

router.get("/", verifyToken, roleCheck("admin"), getCarousel);
router.post("/", verifyToken, roleCheck("admin"), upload.single('image'), addCarouselImage);
router.post("/:carouselId/status", verifyToken, roleCheck("admin"), updateImageStatus);
router.post("/:carouselId/position", verifyToken, roleCheck("admin"), updatePosition);
router.delete("/:carouselId/", verifyToken, roleCheck("admin"), deleteCarouselImage);


module.exports = router;