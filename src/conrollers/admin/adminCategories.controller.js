const Categories = require("../../models/categories.model");

const addCategory = async (req, res) => {
    const { name, description, parent } = req.body;

    try {
        const categoryExists = await Categories.findOne({ name });
        if (categoryExists) {
            return res.status(400).json({ status: "failed", message: "Category already exists" });
        }
        const newCategory = new Categories({ name, description, parent });
        await newCategory.save();
        res.status(201).json({ status: "success", message: "Category added successfully", data: newCategory });
    } catch (error) {
        res.status(500).json({ status: "failed", message: "Internal Server Error", error: error.message });
    }
}

const getCategories = async (req, res) => {
    try {
        const categories = await Categories.find();
        res.status(200).json({ status: "success", message: "Categories fetched successfully", data: categories });
    } catch (error) {
        res.status(500).json({ status: "failed", message: "Internal Server Error", error: error.message });
    }
};

const getCategory = async (req, res) => {
    try {
        const category = await Categories.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ status: "failed", message: "Category not found" });
        }
        res.status(200).json({ status: "success", message: "Category fetched successfully", data: category });
    } catch (error) {
        res.status(500).json({ status: "failed", message: "Internal Server Error", error: error.message });
    }
};


const editCategory = async (req, res) => {
    const { name, description, parent } = req.body;

    try {
        const category = await Categories.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ status: "failed", message: "Category not found" });
        }
        category.name = name;
        category.description = description;
        category.parent = parent;
        await category.save();
        res.status(200).json({ status: "success", message: "Category updated successfully", data: category });
    } catch (error) {
        res.status(500).json({ status: "failed", message: "Internal Server Error", error: error.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const category = await Categories.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ status: "failed", message: "Category not found" });
        }
        res.status(200).json({ status: "success", message: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ status: "failed", message: "Internal Server Error", error: error.message });
    }
};


const getSubCategories = async (req, res) => {
    try {
        const {categoryId} = req.params;
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
                    // children: buildTree(categories, category._id)
                }));
        };

        const categoriesTree = buildTree(categories, categoryId);
        res.status(200).json({ status: "success", data: categoriesTree });
    } catch (error) {
        res.status(500).json({ status: "failed", error: error.message });
    }
};


const getRootCategories = async (req, res) => {
    try {
        const rootCategories = await Categories.find({ parent: null });
        if(rootCategories.length === 0){
            return res.status(404).json({ status: "failed", message: "No root categories found" });
        }
        res.status(200).json({ status: "success", message: "Root categories fetched successfully", data: rootCategories });
    } catch (error) {
        res.status(500).json({ status: "failed", message: "Internal Server Error", error: error.message });
    }
};


const getParentCategories = async (req, res) => {
     try {
    let { categoryId } = req.params;
    const chain = [];

    let current = await Categories.findById(categoryId);
    while (current) {
      chain.unshift(current);
      current = current.parent ? await Categories.findById(current.parent) : null;
    }

    res.json({ status: "success", data: chain });
  } catch (err) {
    res.status(500).json({ status: "failed", message: "Error building category chain" });
  }
}

module.exports = { addCategory, getCategories, getCategory, editCategory, deleteCategory, getSubCategories, getRootCategories, getParentCategories };