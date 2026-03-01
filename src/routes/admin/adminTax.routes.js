const express = require("express");
const router = express.Router();

const {
  createTax,
  getAllTaxes,
  getSingleTax,
  updateTax,
  deleteTax,
  toggleTaxStatus
} = require("../../conrollers/admin/adminTax.controller");

router.post("/", createTax);
router.get("/", getAllTaxes);
router.get("/:id", getSingleTax);
router.put("/:id", updateTax);
router.delete("/:id", deleteTax);
router.patch("/toggle/:id", toggleTaxStatus);

module.exports = router;