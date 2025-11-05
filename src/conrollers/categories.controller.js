const Categories = require("../models/categories.model");


const getCategories = async (req, res) => {
    try {
        const categories = await Categories.find();
        res.status(200).json({ status: "success", data: categories });
    } catch (error) {
        res.status(500).json({ status: "failed", error: error.message });
    }
};
const getCategoriesTree = async (req, res) => {
  try {
    const categories = await Categories.find();
    if (!categories || categories.length === 0) {
            return res.status(404).json({ status: "failed", message: "Category not found" });
        }

    const buildTree = (categories, parentId = null) => {
      return categories
        .filter(category => {
          if (parentId === null) {
            return category.parent === null; // root categories
          }
          return String(category.parent) === String(parentId); // compare as strings
        })
        .map(category => ({
          ...category._doc,
          children: buildTree(categories, category._id)
        }));
    };

    const categoriesTree = buildTree(categories);
    res.status(200).json({ status: "success", data: categoriesTree });
  } catch (error) {
    res.status(500).json({ status: "failed", error: error.message });
  }
};

const getCategory = async (req, res) => {
    try {
        const category = await Categories.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ status: "failed", message: "Category not found" });
        }
        res.status(200).json({ status: "success", data: category });
    } catch (error) {
        res.status(500).json({ status: "failed", error: error.message });
    }
};



module.exports = {getCategories, getCategoriesTree, getCategory};