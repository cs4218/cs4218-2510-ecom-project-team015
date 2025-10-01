import {
	createCategoryController,
	updateCategoryController,
	deleteCategoryController,
} from "./categoryController.js";

jest.mock("slugify", () => ({
	__esModule: true,
	default: (s) => `slug-${String(s)}`,
}));

// Created using ChatGPT
jest.mock("../models/categoryModel.js", () => {
	const save = jest.fn();
	const findOne = jest.fn();
	const findByIdAndUpdate = jest.fn();
	const findByIdAndDelete = jest.fn();

	const MockModel = function (doc) {
		this.doc = doc;
		this.save = save;
	};

	MockModel.findOne = findOne;
	MockModel.findByIdAndUpdate = findByIdAndUpdate;
	MockModel.findByIdAndDelete = findByIdAndDelete;

	return {
		__esModule: true,
		default: MockModel,
		__mockFns: { save, findOne, findByIdAndUpdate, findByIdAndDelete },
	};
});

// Created using ChatGPT
import { __mockFns } from "../models/categoryModel.js";
const { save, findOne, findByIdAndUpdate, findByIdAndDelete } = __mockFns;

// Created using ChatGPT
const makeRes = () => ({
	status: jest.fn().mockReturnThis(),
	send: jest.fn(),
	end: jest.fn(),
});

let logSpy;

beforeEach(() => {
	jest.clearAllMocks();
	logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
	logSpy.mockRestore();
});

describe("categoryController Component", () => {
	// CREATE CATEGORY
	describe("createCategoryController", () => {
		it("sends a status 400 when name is missing in the input form", async () => {
			const req = { body: {} };
			const res = makeRes();

			await createCategoryController(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				message: "Name is required",
			});
		});

		it("sends a status 409 when category already exists", async () => {
			findOne.mockResolvedValue({ _id: "1", name: "Gadgets" });

			const req = { body: { name: "Gadgets" } };
			const res = makeRes();

			await createCategoryController(req, res);

			expect(findOne).toHaveBeenCalledWith({ name: "Gadgets" });
			expect(res.status).toHaveBeenCalledWith(409);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				message: "Category Already Exists",
			});
			expect(save).not.toHaveBeenCalled();
		});

		it("sends a status 201 on success and creates category with slugified name", async () => {
			findOne.mockResolvedValue(null);

			const savedDoc = { _id: "1", name: "Books", slug: "slug-Books" };
			save.mockResolvedValue(savedDoc);

			const req = { body: { name: "Books" } };
			const res = makeRes();

			await createCategoryController(req, res);

			expect(save).toHaveBeenCalledTimes(1);
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.send).toHaveBeenCalledWith({
				success: true,
				message: "New Category created",
				category: savedDoc,
			});
		});

		it("sends status 500 if an unexpected error happens", async () => {
			findOne.mockRejectedValue(new Error("db down"));

			const req = { body: { name: "Books" } };
			const res = makeRes();

			await createCategoryController(req, res);

			expect(res.status).toHaveBeenCalledWith(500);

			const payload = res.send.mock.calls[0][0];
			expect(payload.success).toBe(false);
			expect(payload.message).toBe("Error in Category");
			expect("error" in payload).toBe(true);
		});
	});

	// UPDATE CATEGORY
	describe("updateCategoryController", () => {
		it("sends status 400 when name is missing in the input form", async () => {
			const req = { params: { id: "1" }, body: { name: "  " } };
			const res = makeRes();

			await updateCategoryController(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				message: "Name is required",
			});
			expect(findOne).not.toHaveBeenCalled();
			expect(findByIdAndUpdate).not.toHaveBeenCalled();
		});

		it("sends status 409 when updating to a category name that already exists", async () => {
			findOne.mockResolvedValue({ _id: "1", name: "Electronics" });

			const req = { params: { id: "2" }, body: { name: "electronics" } };
			const res = makeRes();

			await updateCategoryController(req, res);

			expect(res.status).toHaveBeenCalledWith(409);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				message: "Category Already Exists",
			});
			expect(findByIdAndUpdate).not.toHaveBeenCalled();
		});

		it("sends status 200 on success and updates category with slugified name", async () => {
			findOne.mockResolvedValue(null);

			const updatedCategory = { _id: "1", name: "Iphone", slug: "slug-Iphone" };
			findByIdAndUpdate.mockResolvedValue(updatedCategory);

			const req = { params: { id: "1" }, body: { name: "Iphone" } };
			const res = makeRes();

			await updateCategoryController(req, res);

			expect(findByIdAndUpdate).toHaveBeenCalledWith(
				"1",
				{ name: "Iphone", slug: "slug-Iphone" },
				{ new: true }
			);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.send).toHaveBeenCalledWith({
				success: true,
				message: "Category Updated Successfully",
				category: updatedCategory,
			});
		});

		it("sends a status 404 when the category id is not found", async () => {
			findOne.mockResolvedValue(null);
			findByIdAndUpdate.mockResolvedValue(null);

			const req = { params: { id: "1" }, body: { name: "Electronics" } };
			const res = makeRes();

			await updateCategoryController(req, res);

			expect(findByIdAndUpdate).toHaveBeenCalledWith(
				"1",
				{ name: "Electronics", slug: "slug-Electronics" },
				{ new: true }
			);
			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				message: "Category not found",
			});
		});

		it("sends status 500 if an unexpected error happens", async () => {
			findOne.mockRejectedValue(new Error("db fail"));

			const req = { params: { id: "1" }, body: { name: "Novel" } };
			const res = makeRes();

			await updateCategoryController(req, res);

			expect(res.status).toHaveBeenCalledWith(500);

			const payload = res.send.mock.calls[0][0];
			expect(payload.success).toBe(false);
			expect(payload.message).toBe("Error while updating category");
			expect("error" in payload).toBe(true);
		});
	});

	// DELETE CATEGORY
	describe("deleteCategoryController", () => {
		it("sends status 200 on successful deletion", async () => {
			findByIdAndDelete.mockResolvedValue({ _id: "1", name: "Books" });

			const req = { params: { id: "1" } };
			const res = makeRes();

			await deleteCategoryController(req, res);

			expect(findByIdAndDelete).toHaveBeenCalledWith("1");
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.send).toHaveBeenCalledWith({
				success: true,
				message: "Category Deleted Successfully",
			});
			expect(res.end).not.toHaveBeenCalled();
		});

		it("sends status 500 if an unexpected error happens", async () => {
			findByIdAndDelete.mockRejectedValue(new Error("network down"));

			const req = { params: { id: "1" } };
			const res = makeRes();

			await deleteCategoryController(req, res);

			expect(res.status).toHaveBeenCalledWith(500);

			const payload = res.send.mock.calls[0][0];
			expect(payload.success).toBe(false);
			expect(payload.message).toBe("Error while deleting category");
			expect("error" in payload).toBe(true);
		});
	});
});
