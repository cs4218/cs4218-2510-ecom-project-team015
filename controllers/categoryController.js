import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js"
import slugify from "slugify";

export const createCategoryController = async (req, res) => {
	try {
		const { name } = req.body;

		// Bug Fix: Changed status code from 401 to 400 for bad request
		// and added success: false in response
		if (!name) {
			return res.status(400).send({ success: false, message: "Name is required" });
		}
		const existingCategory = await categoryModel.findOne({ name });

		// Bug Fix: Changed status code from 200 to 409 for duplicate category,
		// added success: false in response
		// and corrected spelling of "Exisits" to "Exists"
		if (existingCategory) {
			return res.status(409).send({
				success: false,
				message: "Category Already Exists",
			});
		}
		const category = await new categoryModel({
			name,
			slug: slugify(name),
		}).save();
		res.status(201).send({
			success: true,
			// Bug Fix: Captialization of "new" to "New"
			message: "New Category created",
			category,
		});
	} catch (error) {
		console.log(error);
		res.status(500).send({
			success: false,
			// Bug Fix: Corrected typo from "errro" to "error"
			error,
			message: "Error in Category",
		});
	}
};

//update category
export const updateCategoryController = async (req, res) => {
	try {
		const rawName = req.body?.name ?? "";
		const name = rawName.trim();
		const { id } = req.params;

		// Bug Fix: Added check for name to avoid updating with empty name
		if (!name) {
			return res.status(400).send({ success: false, message: "Name is required" });
		}

		// Bug Fix: Added check to prevent updating to an existing category name
		// Helper function to escape special characters in regex
		// Created using ChatGPT
		const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const existingCategory = await categoryModel.findOne({
			_id: { $ne: id },
			name: new RegExp(`^${escapeRegExp(name)}$`, "i"),
		});

		if (existingCategory) {
			return res.status(409).send({ success: false, message: "Category Already Exists" });
		}

		const category = await categoryModel.findByIdAndUpdate(
			id,
			{ name, slug: slugify(name) },
			{ new: true }
		);

		if (!category) {
			return res.status(404).send({ success: false, message: "Category not found" });
		}

		res.status(200).send({
			// Bug Fix: Corrected spelling of "messsage" to "message"
			success: true,
			message: "Category Updated Successfully",
			category,
		});
	} catch (error) {
		console.log(error);
		res.status(500).send({
			success: false,
			error,
			message: "Error while updating category",
		});
	}
};

// get all cat
export const categoryController = async (req, res) => {
	try {
		const category = await categoryModel.find({});
		res.status(200).send({
			success: true,
			message: "All Categories List",
			category,
		});
	} catch (error) {
		console.log(error);
		res.status(500).send({
			success: false,
			error,
			message: "Error while getting all categories",
		});
	}
};

// single category
export const singleCategoryController = async (req, res) => {
	try {
		const category = await categoryModel.findOne({ slug: req.params.slug });

		if (!category) {
			return res.status(404).send({
				success: false,
				message: "Category not found",
			});
		}
		
		res.status(200).send({
			success: true,
			// Bug Fix: Corrected spelling of "SUccessfully" to "Successfull"
			// and "SIngle" to "Single"
			message: "Get Single Category Successfully",
			category,
		});
	} catch (error) {
		console.log(error);
		res.status(500).send({
			success: false,
			error,
			// Bug Fix: Corrected spelling mistake in error message
			message: "Error while getting Single Category",
		});
	}
};

// delete category
// Bug Fix: Fixed function name from "deleteCategoyCOntroller" to "deleteCategoryController"
export const deleteCategoryController = async (req, res) => {
	try {
		const { id } = req.params;

		const category = await categoryModel.findById(id);
		if (category.slug === "uncategorized") {
			return res.status(400).send({
				success: false,
				message: "Default 'Uncategorized' category cannot be deleted",
			});
		}
		
		let defaultCategory = await categoryModel.findOne({ slug: "uncategorized" });
		if (!defaultCategory) {
			defaultCategory = await categoryModel.create({
				name: "Uncategorized",
				slug: slugify("Uncategorized"),
			});
		}

		await productModel.updateMany(
			{ category: id },
			{ $set: { category: defaultCategory._id } }
    	);

		await categoryModel.findByIdAndDelete(id);
		res.status(200).send({
			success: true,
			// Bug Fix: Corrected spelling of "Categry" to "Category"
			message: "Category Deleted Successfully",
		});
	} catch (error) {
		console.log(error);
		res.status(500).send({
			success: false,
			// Bug Fix: Capitalization of "error"
			message: "Error while deleting category",
			error,
		});
	}
};
