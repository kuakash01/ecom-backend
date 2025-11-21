const Categories = require("../../models/categories.model");
const cloudinary = require('../../config/cloudinary');
const streamifier = require('streamifier');

const uploadToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        streamifier.createReadStream(buffer).pipe(stream);
    });
};

const addCategory = async (req, res) => {
    const { name, description, parent } = req.body;
    const image = req.file;

    // res.status(200).json({status:"success", message:"ok", data: {...req.body, image}})
    try {
        const imageResult = await uploadToCloudinary(image.buffer, "categories");

        const parentId = parent || null;
        const categoryExists = await Categories.findOne({ name: name.trim(), parent: parentId });
        if (categoryExists) {
            return res.status(400).json({ status: "failed", message: "Category already exists" });
        }
        const newCategory = new Categories({
            name, description,
            parent: parent ? parent : null,
            image: {
                url: imageResult.url,
                public_id: imageResult.public_id
            }
        });
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
    const image = req.file;

    try {
        const category = await Categories.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                status: "failed",
                message: "Category not found"
            });
        }

        let newImageData = null;

        // Upload new image if provided
        if (image) {
            newImageData = await uploadToCloudinary(image.buffer, "categories");

            // Delete ONLY if upload success and old exists
            if (category.image?.public_id) {
                await cloudinary.uploader.destroy(category.image.public_id);
            }
        }

        // Update fields
        category.name = name;
        category.description = description;
        category.parent = parent ? parent : category.parent;

        // Update image field only if new image uploaded
        if (newImageData) {
            category.image = {
                url: newImageData.url,
                public_id: newImageData.public_id
            };
        }

        await category.save();

        res.status(200).json({
            status: "success",
            message: "Category updated successfully",
            data: category
        });

    } catch (error) {
        res.status(500).json({
            status: "failed",
            message: "Internal Server Error",
            error: error.message
        });
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
        const { categoryId } = req.params;
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
        if (rootCategories.length === 0) {
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
        res.status(500).json({ status: "failed", message: "Internal Server Error" });
    }
}

const checkCategoryExist = async (req, res) => {
    try {
        const { categoryId } = req.params;

        if (!categoryId) {
            return res.status(400).json({
                status: "failed",
                message: "Category ID is required",
                isPresent: false
            });
        }

        const exist = await Categories.findById(categoryId);

        if (!exist) {
            return res.status(404).json({
                status: "failed",
                message: "Category not found",
                isPresent: false
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Category exists",
            isPresent: true
        });
    } catch (error) {
        console.error("Error checking category existence:", error);
        return res.status(500).json({
            status: "failed",
            message: "Internal Server Error"
        });
    }
};


module.exports = { addCategory, getCategories, getCategory, editCategory, deleteCategory, getSubCategories, getRootCategories, getParentCategories, checkCategoryExist };