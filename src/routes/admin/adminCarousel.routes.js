const express = require("express");
const router = express.Router();

const { getCarousel, addCarouselImage, updateImageStatus, updatePosition, deleteCarouselImage, updateRedirectType, updateRedirectValue } = require("../../conrollers/admin/adminCarousel.controller");
const verifyToken = require("../../middlewares/verifyToken");
const roleCheck = require("../../middlewares/roleCheck");
const upload = require("../../config/multer");

router.get("/", verifyToken, roleCheck("admin"), getCarousel);
router.post("/", verifyToken, roleCheck("admin"), upload.fields([
    { name: 'mobileImage', maxCount: 1 },
    { name: 'desktopImage', maxCount: 1 }
]), addCarouselImage);
router.post("/:carouselId/status", verifyToken, roleCheck("admin"), updateImageStatus);
router.post("/:carouselId/position", verifyToken, roleCheck("admin"), updatePosition);
router.delete("/:carouselId/", verifyToken, roleCheck("admin"), deleteCarouselImage);

router.post("/:id/redirect-type", updateRedirectType);
router.post("/:id/redirect-value", updateRedirectValue);



module.exports = router;