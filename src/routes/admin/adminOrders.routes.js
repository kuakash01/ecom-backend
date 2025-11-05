const express = require("express");
const router = express.Router();

const verifyToken = require("../../middlewares/verifyToken")
const roleCheck = require("../../middlewares/roleCheck")
const {getAllOrders, updateOrderStatus} = require("../../conrollers/admin/adminOrder.controller")



router.get("/", verifyToken, roleCheck("admin"), getAllOrders)
router.patch("/:orderId/status", verifyToken, roleCheck("admin"), updateOrderStatus)

module.exports = router;