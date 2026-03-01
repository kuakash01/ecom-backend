const Tax = require("../../models/tax.model");

// Create Tax
exports.createTax = async (req, res) => {
  try {
    const { name, minPrice, maxPrice, rate } = req.body;

    const tax = await Tax.create({
      name,
      minPrice,
      maxPrice: maxPrice || null,
      rate
    });

    res.status(201).json({
      success: true,
      message: "Tax created successfully",
      tax
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Get All Taxes
exports.getAllTaxes = async (req, res) => {
  try {
    const taxes = await Tax.find().sort({ minPrice: 1 });

    res.status(200).json({
      success: true,
      taxes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Get Single Tax
exports.getSingleTax = async (req, res) => {
  try {
    const tax = await Tax.findById(req.params.id);

    if (!tax) {
      return res.status(404).json({ success: false, message: "Tax not found" });
    }

    res.status(200).json({ success: true, tax });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Update Tax
exports.updateTax = async (req, res) => {
  try {

    const tax = await Tax.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!tax) {
      return res.status(404).json({ success: false, message: "Tax not found" });
    }

    res.status(200).json({
      success: true,
      message: "Tax updated successfully",
      tax
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// Delete Tax
exports.deleteTax = async (req, res) => {
  try {
    const tax = await Tax.findByIdAndDelete(req.params.id);

    if (!tax) {
      return res.status(404).json({ success: false, message: "Tax not found" });
    }

    res.status(200).json({
      success: true,
      message: "Tax deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Toggle Active
exports.toggleTaxStatus = async (req, res) => {
  try {
    const tax = await Tax.findById(req.params.id);

    if (!tax) {
      return res.status(404).json({ success: false, message: "Tax not found" });
    }

    tax.isActive = !tax.isActive;
    await tax.save();

    res.status(200).json({
      success: true,
      message: "Tax status updated",
      tax
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};