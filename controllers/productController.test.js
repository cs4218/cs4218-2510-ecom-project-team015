// productController.test.js
import {
	createProductController,
	updateProductController,
	deleteProductController,
	getProductController,
	getSingleProductController,
	productPhotoController,
	productFiltersController,
	productCountController,
	productListController,
	searchProductController,
	realtedProductController,
	productCategoryController,
	braintreeTokenController,
	brainTreePaymentController,
} from "./productController.js";

import dotenv from "dotenv";
import fs from "fs";
import braintree from "braintree";
import categoryModel from "../models/categoryModel.js";


// ---- Mocks (compact & all-in-one) ----

// Slugify → deterministic
jest.mock("slugify", () => ({
	__esModule: true,
	default: (s) => `slug-${String(s)}`,
}));

// dotenv.config no-op
jest.mock("dotenv", () => ({
	__esModule: true,
	default: { config: jest.fn() },
}));

// fs.readFileSync returns fake buffer
jest.mock("fs", () => {
	const rfs = jest.fn(() => Buffer.from("fake-bytes"));
	return {
		__esModule: true,
		default: { readFileSync: rfs },
		readFileSync: rfs,
	};
});

// productModel mock: constructor + chainable statics (find/findOne/findById/...) created using the help of ChatGPT
jest.mock("../models/productModel.js", () => {
	const save = jest.fn();
	const find = jest.fn();
	const findOne = jest.fn();
	const findById = jest.fn();
	const findByIdAndUpdate = jest.fn();
	const findByIdAndDelete = jest.fn();

	const chain = (value) => ({
		populate: jest.fn().mockReturnThis(),
		select: jest.fn().mockReturnThis(),
		limit: jest.fn().mockReturnThis(),
		sort: jest.fn().mockReturnThis(),
		skip: jest.fn().mockReturnThis(),
		then: (res, rej) => Promise.resolve(value).then(res, rej),
	});

	const Mock = function (doc) {
		this.doc = doc;
		this.photo = {};
		this.save = save;
	};

	Mock.find = (...args) => find(...args);
	Mock.findOne = (...args) => findOne(...args);
	Mock.findById = (...args) => findById(...args);
	Mock.findByIdAndUpdate = findByIdAndUpdate;
	Mock.findByIdAndDelete = findByIdAndDelete;

	const _setFind = (value) => find.mockImplementation(() => chain(value));
	const _setFindOne = (value) => findOne.mockImplementation(() => chain(value));
	const _setFindById = (value) =>
		findById.mockImplementation(() => ({
			select: jest.fn().mockReturnThis(),
			then: (res, rej) => Promise.resolve(value).then(res, rej),
		}));

	return {
		__esModule: true,
		default: Mock,
		__mockFns: {
			save,
			find,
			findOne,
			findById,
			findByIdAndUpdate,
			findByIdAndDelete,
			_setFind,
			_setFindOne,
			_setFindById,
		},
	};
});

// categoryModel: findOne
jest.mock("../models/categoryModel.js", () => ({
	__esModule: true,
	default: { findOne: jest.fn() },
}));

// orderModel: constructor with save()
jest.mock("../models/orderModel.js", () => {
	const Ctor = jest
		.fn()
		.mockImplementation((doc) => ({ save: jest.fn(), __doc: doc }));
	return { __esModule: true, default: Ctor, __mockFns: { Ctor } };
});

// mock braintree with the help of ChatGPT
jest.mock("braintree", () => {
	const mockGenerate = jest.fn();
	const mockSale = jest.fn();

	const gatewayInstance = {
		clientToken: { generate: mockGenerate },
		transaction: { sale: mockSale },
	};

	const BraintreeGateway = jest.fn().mockImplementation(() => gatewayInstance);

	return {
		__esModule: true,
		default: {
			BraintreeGateway,
			Environment: { Sandbox: "sandbox" },
			__gatewayInstance: gatewayInstance, // 👈 giúp test truy cập instance
		},
	};
});

// Access productModel mock helpers
import productModel, { __mockFns as PM } from "../models/productModel.js";
const { save, findByIdAndUpdate, findByIdAndDelete } = PM;

// Test utils 
const makeRes = () => ({
	status: jest.fn().mockReturnThis(),
	send: jest.fn(),
	json: jest.fn(),
	set: jest.fn(),
});

let logSpy;
beforeEach(() => {
	jest.clearAllMocks();
	logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => {
	logSpy.mockRestore();
});

//  CRUD
describe("productController Component", () => {
	// CREATE PRODUCT 
	describe("createProductController", () => {
		describe("Presence Validation for Input fields", () => {
			const base = {
				description: "Good",
				price: 10,
				category: "Books",
				quantity: 1,
				shipping: 0,
			};

			const rows = [
				["name is missing", {}, "Name is Required"],
				["name field is empty", { name: "" }, "Name is Required"],
				[
					"description is missing",
					{ name: "Product", description: undefined },
					"Description is Required",
				],
				[
					"description field is empty",
					{ name: "Product", description: "" },
					"Description is Required",
				],
				[
					"missing price",
					{ name: "Product", description: "Good", price: undefined },
					"Price is Required",
				],
				[
					"price field is empty",
					{ name: "Product", description: "Good", price: "" },
					"Price is Required",
				],
				[
					"category is missing",
					{
						name: "Product",
						description: "Good",
						price: 10,
						category: undefined,
					},
					"Category is Required",
				],
				[
					"category field is empty",
					{ name: "Product", description: "Good", price: 10, category: "" },
					"Category is Required",
				],
				[
					"quantity is missing",
					{
						name: "Product",
						description: "Good",
						price: 10,
						category: "Books",
						quantity: undefined,
					},
					"Quantity is Required",
				],
				[
					"quantity field is empty",
					{
						name: "Product",
						description: "Good",
						price: 10,
						category: "Books",
						quantity: "",
					},
					"Quantity is Required",
				],
			];

			test.each(rows)(
				"sends a status 500 when %s",
				async (_label, overrides, expectedMsg) => {
					const fields = { ...base, ...overrides };
					const res = makeRes();
					await createProductController(
						{
							fields,
							files: {
								photo: {
									size: 1000,
									path: "/public/img.jpg",
									type: "image/jpg",
								},
							},
						},
						res
					);

					expect(res.status).toHaveBeenCalledWith(500);
					expect(res.send).toHaveBeenCalledWith({ error: expectedMsg });
				}
			);
		});

		it("sends a status 500 when photo is missing", async () => {
			const req = {
				fields: {
					name: "Product",
					description: "Product is Good",
					price: 10,
					category: "Books",
					quantity: 1,
					shipping: 0,
				},
				files: {},
			};
			const res = makeRes();
			await createProductController(req, res);
			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.send).toHaveBeenCalledWith({ error: "Photo is required" });
			expect(fs.readFileSync).not.toHaveBeenCalled();
		});

		it("sends a status 500 when photo size is greater than 1MB", async () => {
			const req = {
				fields: {
					name: "Product",
					description: "Product is Good",
					price: 10,
					category: "Books",
					quantity: 1,
					shipping: 0,
				},
				files: {
					photo: { size: 2000000, path: "/public/img.jpg", type: "image/jpg" },
				},
			};
			const res = makeRes();
			await createProductController(req, res);
			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.send).toHaveBeenCalledWith({
				error: "Photo should be less than 1MB",
			});
			expect(fs.readFileSync).not.toHaveBeenCalled();
		});

		it("sends 201 when all required fields provided + image", async () => {
			const savedDoc = { _id: "1" };
			save.mockResolvedValue(savedDoc);

			const req = {
				fields: {
					name: "Phone",
					description: "Nice phone",
					price: 999,
					category: "Electronics",
					quantity: 2,
					shipping: 1,
				},
				files: {
					photo: { size: 1000, path: "/public/phone.jpg", type: "image/jpg" },
				},
			};
			const res = makeRes();

			await createProductController(req, res);

			expect(fs.readFileSync).toHaveBeenCalledWith("/public/phone.jpg");
			expect(save).toHaveBeenCalledTimes(1);
			expect(res.status).toHaveBeenCalledWith(201);

			const payload = res.send.mock.calls[0][0];
			expect(payload.success).toBe(true);
			expect(payload.message).toBe("Product Created Successfully");
			expect(payload.products).toBeDefined();
			expect(payload.products.doc.slug).toBe("slug-Phone");
			expect(payload.products.photo.contentType).toBe("image/jpg");
			expect(Buffer.isBuffer(payload.products.photo.data)).toBe(true);
		});

		describe("Boundary Analysis for Price and Quantity", () => {
			const base = {
				name: "Sample Product",
				description: "Good",
				category: "Books",
				shipping: 1,
			};
			beforeEach(() => save.mockResolvedValue({ _id: "1" }));

			const rows = [
				[
					"sends 400 when price=0",
					0,
					10,
					400,
					"Price must be > 0 and ≤ 1000000",
				],
				[
					"sends 400 when price>max",
					1_000_001,
					10,
					400,
					"Price must be > 0 and ≤ 1000000",
				],
				[
					"sends 400 when qty=0",
					200,
					0,
					400,
					"Quantity must be an integer > 0 and ≤ 100000",
				],
				[
					"sends 400 when qty is decimal",
					200,
					2.5,
					400,
					"Quantity must be an integer > 0 and ≤ 100000",
				],
				[
					"sends 400 when qty>max",
					200,
					100_001,
					400,
					"Quantity must be an integer > 0 and ≤ 100000",
				],
				["sends 201 when lower boundary OK", 1, 1, 201, null],
				["sends 201 when upper boundary OK", 1_000_000, 100_000, 201, null],
			];

			test.each(rows)("%s", async (_label, price, quantity, expected, msg) => {
				const req = {
					fields: { ...base, price, quantity },
					files: {
						photo: { size: 1000, path: "/public/img.jpg", type: "image/jpg" },
					},
				};
				const res = makeRes();

				await createProductController(req, res);

				expect(res.status).toHaveBeenCalledWith(expected);
				if (expected === 400) {
					expect(res.send).toHaveBeenCalledWith({ error: msg });
				} else {
					expect(res.send).toHaveBeenCalledWith(
						expect.objectContaining({ success: true })
					);
				}
			});
		});

		it("sends 500 on unexpected error and logs it", async () => {
			const error = new Error("network issue");
			save.mockRejectedValue(error);
			const req = {
				fields: {
					name: "Tablet",
					description: "Nice product",
					price: 50,
					category: "Electronics",
					quantity: 4,
					shipping: 0,
				},
				files: {
					photo: { size: 1000, path: "/public/img.jpg", type: "image/jpg" },
				},
			};
			const res = makeRes();

			await createProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.send).toHaveBeenCalledWith(
				expect.objectContaining({
					success: false,
					error: error,
					message: "Error in creating product",
				})
			);
			expect(logSpy).toHaveBeenCalled();
		});
	});

	// UPDATE PRODUCT 
	describe("updateProductController", () => {
		describe("Presence Validation for Input fields", () => {
			const base = {
				description: "Good",
				price: 10,
				category: "Books",
				quantity: 1,
				shipping: 0,
			};

			const rows = [
				["name is missing", {}, "Name is Required"],
				["name field is empty", { name: "" }, "Name is Required"],
				[
					"description is missing",
					{ name: "Product", description: undefined },
					"Description is Required",
				],
				[
					"description field is empty",
					{ name: "Product", description: "" },
					"Description is Required",
				],
				[
					"missing price",
					{ name: "Product", description: "Good", price: undefined },
					"Price is Required",
				],
				[
					"price field is empty",
					{ name: "Product", description: "Good", price: "" },
					"Price is Required",
				],
				[
					"category is missing",
					{
						name: "Product",
						description: "Good",
						price: 10,
						category: undefined,
					},
					"Category is Required",
				],
				[
					"category field is empty",
					{ name: "Product", description: "Good", price: 10, category: "" },
					"Category is Required",
				],
				[
					"quantity is missing",
					{
						name: "Product",
						description: "Good",
						price: 10,
						category: "Books",
						quantity: undefined,
					},
					"Quantity is Required",
				],
				[
					"quantity field is empty",
					{
						name: "Product",
						description: "Good",
						price: 10,
						category: "Books",
						quantity: "",
					},
					"Quantity is Required",
				],
			];

			test.each(rows)(
				"sends 500 when %s",
				async (_label, overrides, expectedMsg) => {
					const fields = { ...base, ...overrides };
					const res = makeRes();
					await updateProductController(
						{
							params: { pid: "1" },
							fields,
							files: {
								photo: {
									size: 1000,
									path: "/public/img.jpg",
									type: "image/jpg",
								},
							},
						},
						res
					);
					expect(res.status).toHaveBeenCalledWith(500);
					expect(res.send).toHaveBeenCalledWith({ error: expectedMsg });
				}
			);
		});

		it("sends 500 when photo is missing", async () => {
			const req = {
				fields: {
					name: "Product",
					description: "Product is Good",
					price: 10,
					category: "Books",
					quantity: 1,
					shipping: 0,
				},
				files: {},
			};
			const res = makeRes();
			await updateProductController(req, res);
			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.send).toHaveBeenCalledWith({ error: "Photo is required" });
			expect(fs.readFileSync).not.toHaveBeenCalled();
			expect(findByIdAndUpdate).not.toHaveBeenCalled();
		});
		// it("sends a status 500 when photo is missing", async () => {
		// 	const req = {
		// 		fields: {
		// 			name: "Product",
		// 			description: "Product is Good",
		// 			price: 10,
		// 			category: "Books",
		// 			quantity: 1,
		// 			shipping: 0,
		// 		},
		// 		files: {},
		// 	};
		// 	const res = makeRes();

		// 	await updateProductController(req, res);

		// 	expect(res.status).toHaveBeenCalledWith(500);
		// 	expect(res.send).toHaveBeenCalledWith({
		// 		error: "Photo is required",
		// 	});
		// 	expect(fs.readFileSync).not.toHaveBeenCalled();
		// 	expect(findByIdAndUpdate).not.toHaveBeenCalled();
		// });

		it("sends 500 when photo size > 1MB", async () => {
			const req = {
				fields: {
					name: "Product",
					description: "Product is Good",
					price: 10,
					category: "Books",
					quantity: 1,
					shipping: 0,
				},
				files: {
					photo: { size: 2000000, path: "/src/img.jpg", type: "image/jpg" },
				},
			};
			const res = makeRes();

			await updateProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.send).toHaveBeenCalledWith({
				error: "Photo is required and should be less than 1MB",
			});
			expect(fs.readFileSync).not.toHaveBeenCalled();
			expect(findByIdAndUpdate).not.toHaveBeenCalled();
		});

		it("sends 201 on success with image", async () => {
			const doc = {
				_id: "1",
				photo: {},
				save: jest.fn().mockResolvedValue({ _id: "1" }),
			};
			findByIdAndUpdate.mockResolvedValue(doc);

			const fields = {
				name: "Phone",
				description: "Great",
				price: 299,
				category: "c1",
				quantity: 2,
				shipping: 1,
			};
			const files = {
				photo: { size: 1000, path: "/public/phone.jpg", type: "image/jpeg" },
			};
			const res = makeRes();

			await updateProductController(
				{ params: { pid: "1" }, fields, files },
				res
			);

			expect(findByIdAndUpdate).toHaveBeenCalledWith(
				"1",
				expect.objectContaining({ name: "Phone", slug: "slug-Phone" }),
				{ new: true }
			);
			expect(fs.readFileSync).toHaveBeenCalledWith("/public/phone.jpg");
			expect(doc.save).toHaveBeenCalledTimes(1);
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.send).toHaveBeenCalledWith({
				success: true,
				message: "Product Updated Successfully",
				products: doc,
			});
		});

		describe("Boundary Analysis for Price and Quantity", () => {
			const base = {
				name: "Sample Product",
				description: "Good",
				category: "Books",
				shipping: 1,
			};
			beforeEach(() => save.mockResolvedValue({ _id: "1" }));

			const rows = [
				[
					"sends 400 when price=0",
					0,
					10,
					400,
					"Price must be > 0 and ≤ 1000000",
				],
				[
					"sends 400 when price>max",
					1_000_001,
					10,
					400,
					"Price must be > 0 and ≤ 1000000",
				],
				[
					"sends 400 when qty=0",
					200,
					0,
					400,
					"Quantity must be an integer > 0 and ≤ 100000",
				],
				[
					"sends 400 when qty decimal",
					200,
					2.5,
					400,
					"Quantity must be an integer > 0 and ≤ 100000",
				],
				[
					"sends 400 when qty>max",
					200,
					100_001,
					400,
					"Quantity must be an integer > 0 and ≤ 100000",
				],
				["sends 201 when lower boundary OK", 1, 1, 201, null],
				["sends 201 when upper boundary OK", 1_000_000, 100_000, 201, null],
			];

			test.each(rows)("%s", async (_label, price, quantity, expected, msg) => {
				if (expected === 201) {
					findByIdAndUpdate.mockResolvedValue({ _id: "1", photo: {}, save });
				}
				const res = makeRes();
				await updateProductController(
					{
						params: { pid: "1" },
						fields: { ...base, price, quantity },
						files: {
							photo: { size: 1000, path: "/public/img.jpg", type: "image/jpg" },
						},
					},
					res
				);

				expect(res.status).toHaveBeenCalledWith(expected);
				if (expected === 400) {
					expect(res.send).toHaveBeenCalledWith({ error: msg });
				} else {
					expect(findByIdAndUpdate).toHaveBeenCalledWith(
						"1",
						expect.objectContaining({ slug: expect.any(String) }),
						{ new: true }
					);
					expect(save).toHaveBeenCalled();
					expect(res.send).toHaveBeenCalledWith(
						expect.objectContaining({
							success: true,
							message: "Product Updated Successfully",
						})
					);
				}
			});
		});

		it("sends 404 when product id not found", async () => {
			findByIdAndUpdate.mockResolvedValue(null);
			const fields = {
				name: "Product",
				description: "Nice Product",
				price: 10,
				category: "Books",
				quantity: 1,
				shipping: 0,
			};
			const res = makeRes();

			await updateProductController(
				{
					params: { pid: "1" },
					fields,
					files: {
						photo: { size: 1000, path: "/public/img.jpg", type: "image/jpg" },
					},
				},
				res
			);

			expect(findByIdAndUpdate).toHaveBeenCalledWith("1", expect.any(Object), {
				new: true,
			});
			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				message: "Product not found",
			});
		});

		it("sends 500 on unexpected error and logs it", async () => {
			const error = new Error("network issue");
			findByIdAndUpdate.mockRejectedValue(error);

			const fields = {
				name: "Prod",
				description: "Good",
				price: 10,
				category: "Books",
				quantity: 1,
				shipping: 0,
			};
			const res = makeRes();

			await updateProductController(
				{
					params: { pid: "1" },
					fields,
					files: {
						photo: { size: 1000, path: "/public/img.jpg", type: "image/jpg" },
					},
				},
				res
			);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				error: error,
				message: "Error in updating product",
			});
			expect(logSpy).toHaveBeenCalled();
		});
	});




	//  DELETE PRODUCT 
	describe("deleteProductController", () => {
		it("sends 200 when deleted", async () => {
			const select = jest.fn().mockResolvedValue({ _id: "1" });
			findByIdAndDelete.mockReturnValue({ select });

			const req = { params: { pid: "1" } };
			const res = makeRes();

			await deleteProductController(req, res);

			expect(findByIdAndDelete).toHaveBeenCalledWith("1");
			expect(select).toHaveBeenCalledWith("-photo");
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.send).toHaveBeenCalledWith({
				success: true,
				message: "Product Deleted successfully",
			});
		});

		it("sends 404 when id not found", async () => {
			const select = jest.fn().mockResolvedValue(null);
			findByIdAndDelete.mockReturnValue({ select });

			const res = makeRes();
			await deleteProductController({ params: { pid: "1" } }, res);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				message: "Product not found",
			});
		});

		it("sends 500 on unexpected error", async () => {
			const error = new Error("network issue");
			const select = jest.fn().mockRejectedValue(error);
			findByIdAndDelete.mockReturnValue({ select });

			const res = makeRes();
			await deleteProductController({ params: { pid: "1" } }, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				message: "Error while deleting product",
				error: error,
			});
			expect(logSpy).toHaveBeenCalled();
		});
	});
});

// READ / SEARCH / COUNTS / PAYMENT
describe("READ/SEARCH controllers (compact pack)", () => {
	afterEach(() => jest.clearAllMocks());

	test("getProductController: success", async () => {
		PM._setFind([{ _id: "1" }, { _id: "2" }]);
		const res = makeRes();
		await getProductController({}, res);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.send).toHaveBeenCalledWith(
			expect.objectContaining({ success: true, counTotal: 2 })
		);
	});

	test("getProductController: error -> 500", async () => {
		PM.find.mockImplementation(() => ({
			then: (_r, rej) => rej(new Error("x")),
		}));
		const res = makeRes();
		await getProductController({}, res);
		expect(res.status).toHaveBeenCalledWith(500);
	});

	test("getSingleProductController: success", async () => {
		PM._setFindOne({ _id: "p1", slug: "mac" });
		const res = makeRes();
		await getSingleProductController({ params: { slug: "mac" } }, res);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.send).toHaveBeenCalledWith(
			expect.objectContaining({
				success: true,
				product: { _id: "p1", slug: "mac" },
			})
		);
	});

	test("getSingleProductController: error -> 500", async () => {
		PM.findOne.mockImplementation(() => ({
			then: (_r, rej) => rej(new Error("x")),
		}));
		const res = makeRes();
		await getSingleProductController({ params: { slug: "mac" } }, res);
		expect(res.status).toHaveBeenCalledWith(500);
	});

	test("productPhotoController: sends photo", async () => {
		PM._setFindById({
			photo: { data: Buffer.from("hi"), contentType: "image/png" },
		});
		const res = makeRes();
		await productPhotoController({ params: { pid: "p1" } }, res);
		expect(res.set).toHaveBeenCalledWith("Content-type", "image/png");
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.send).toHaveBeenCalled();
	});

	test("productPhotoController: no data -> no send", async () => {
		PM._setFindById({ photo: { data: null, contentType: null } });
		const res = makeRes();
		await productPhotoController({ params: { pid: "p1" } }, res);
		expect(res.send).not.toHaveBeenCalled();
	});

	test("productPhotoController: error -> 500", async () => {
		PM.findById.mockImplementation(() => ({
			select: jest.fn().mockReturnThis(),
			then: (_r, rej) => rej(new Error("x")),
		}));
		const res = makeRes();
		await productPhotoController({ params: { pid: "p1" } }, res);
		expect(res.status).toHaveBeenCalledWith(500);
	});

	test("productFiltersController: checked only", async () => {
		PM._setFind([{ _id: "1" }]);
		const res = makeRes();
		await productFiltersController(
			{ body: { checked: ["c1"], radio: [] } },
			res
		);
		expect(PM.find).toHaveBeenCalledWith({ category: ["c1"] });
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.send).toHaveBeenCalledWith({
			success: true,
			products: [{ _id: "1" }],
		});
	});

	test("productFiltersController: radio only", async () => {
		PM._setFind([{ _id: "1" }]);
		const res = makeRes();
		await productFiltersController(
			{ body: { checked: [], radio: [10, 20] } },
			res
		);
		expect(PM.find).toHaveBeenCalledWith({ price: { $gte: 10, $lte: 20 } });
		expect(res.status).toHaveBeenCalledWith(200);
	});

	test("productFiltersController: both provided / error -> 400", async () => {
		PM.find.mockImplementation(() => ({
			then: (_r, rej) => rej(new Error("x")),
		}));
		const res = makeRes();
		await productFiltersController(
			{ body: { checked: ["c1"], radio: [1, 2] } },
			res
		);
		expect(res.status).toHaveBeenCalledWith(400);
	});

	test("productCountController: success", async () => {
		PM.find.mockReturnValue({
			estimatedDocumentCount: () => ({
				then: (r) => Promise.resolve(7).then(r),
			}),
		});
		const res = makeRes();
		await productCountController({}, res);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.send).toHaveBeenCalledWith({ success: true, total: 7 });
	});

	test("productCountController: error -> 400", async () => {
		PM.find.mockReturnValue({
			estimatedDocumentCount: () => ({
				then: (_r, rej) => rej(new Error("x")),
			}),
		});
		const res = makeRes();
		await productCountController({}, res);
		expect(res.status).toHaveBeenCalledWith(400);
	});

	test("productListController: default page=1", async () => {
		PM.find.mockImplementation(() => ({
			select: jest.fn().mockReturnThis(),
			skip: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			sort: jest.fn().mockReturnThis(),
			then: (r) => Promise.resolve([{ _id: "1" }]).then(r),
		}));
		const res = makeRes();
		await productListController({ params: {} }, res);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.send).toHaveBeenCalledWith({
			success: true,
			products: [{ _id: "1" }],
		});
	});

	test("productListController: page=3 paginates", async () => {
		PM.find.mockImplementation(() => ({
			select: jest.fn().mockReturnThis(),
			skip: jest.fn().mockReturnThis(), // should be called with 12 internally
			limit: jest.fn().mockReturnThis(),
			sort: jest.fn().mockReturnThis(),
			then: (r) => Promise.resolve([{ _id: "x" }]).then(r),
		}));
		const res = makeRes();
		await productListController({ params: { page: 3 } }, res);
		expect(res.status).toHaveBeenCalledWith(200);
	});

	test("searchProductController: success -> res.json", async () => {
		PM.find.mockImplementation(() => ({
			select: jest.fn().mockReturnThis(),
			then: (r) => Promise.resolve([{ _id: "1" }]).then(r),
		}));
		const res = makeRes();
		await searchProductController({ params: { keyword: "mac" } }, res);
		expect(res.json).toHaveBeenCalledWith([{ _id: "1" }]);
	});

	test("searchProductController: error -> 400", async () => {
		PM.find.mockImplementation(() => ({
			then: (_r, rej) => rej(new Error("x")),
		}));
		const res = makeRes();
		await searchProductController({ params: { keyword: "mac" } }, res);
		expect(res.status).toHaveBeenCalledWith(400);
	});

	test("realtedProductController: success", async () => {
		PM.find.mockImplementation(() => ({
			select: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			populate: jest.fn().mockReturnThis(),
			then: (r) => Promise.resolve([{ _id: "2" }]).then(r),
		}));
		const res = makeRes();
		await realtedProductController({ params: { pid: "p1", cid: "c1" } }, res);
		expect(PM.find).toHaveBeenCalledWith({
			category: "c1",
			_id: { $ne: "p1" },
		});
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.send).toHaveBeenCalledWith({
			success: true,
			products: [{ _id: "2" }],
		});
	});

	test("realtedProductController: error -> 400", async () => {
		PM.find.mockImplementation(() => ({
			then: (_r, rej) => rej(new Error("x")),
		}));
		const res = makeRes();
		await realtedProductController({ params: { pid: "p1", cid: "c1" } }, res);
		expect(res.status).toHaveBeenCalledWith(400);
	});

	test("productCategoryController: success", async () => {
		categoryModel.findOne.mockImplementation(() => ({
			then: (r) => Promise.resolve({ _id: "c1" }).then(r),
		}));
		PM.find.mockImplementation(() => ({
			populate: jest.fn().mockReturnThis(),
			then: (r) => Promise.resolve([{ _id: "p1" }]).then(r),
		}));
		const res = makeRes();
		await productCategoryController({ params: { slug: "laptops" } }, res);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.send).toHaveBeenCalledWith(
			expect.objectContaining({
				success: true,
				category: { _id: "c1" },
				products: [{ _id: "p1" }],
			})
		);
	});

	test("productCategoryController: error -> 400", async () => {
		categoryModel.findOne.mockImplementation(() => ({
			then: (_r, rej) => rej(new Error("x")),
		}));
		const res = makeRes();
		await productCategoryController({ params: { slug: "oops" } }, res);
		expect(res.status).toHaveBeenCalledWith(400);
	});
});


// created using ChatGPT
describe("Braintree controllers (compact)", () => {
	afterEach(() => jest.clearAllMocks());

	test("braintreeTokenController: success", async () => {
		const res = makeRes();
		const gateway = braintree.__gatewayInstance;
		gateway.clientToken.generate.mockImplementation((_, cb) =>
			cb(null, { token: "t" })
		);
		await braintreeTokenController({}, res);
		expect(res.send).toHaveBeenCalledWith({ token: "t" });
	});

	test("braintreeTokenController: error -> 500", async () => {
		const res = makeRes();
		const gateway = braintree.__gatewayInstance;
		gateway.clientToken.generate.mockImplementation((_, cb) =>
			cb(new Error("x"))
		);
		await braintreeTokenController({}, res);
		expect(res.status).toHaveBeenCalledWith(500);
	});

	test("brainTreePaymentController: success saves order", async () => {
		const res = makeRes();
		const gateway = braintree.__gatewayInstance;
		gateway.transaction.sale.mockImplementation((_payload, cb) =>
			cb(null, { id: "txn1" })
		);
		const req = {
			body: { nonce: "n", cart: [{ price: 10 }, { price: 20.5 }] },
			user: { _id: "u1" },
		};

		await brainTreePaymentController(req, res);

		expect(gateway.transaction.sale).toHaveBeenCalledWith(
			expect.objectContaining({
				amount: 30.5,
				paymentMethodNonce: "n",
				options: { submitForSettlement: true },
			}),
			expect.any(Function)
		);
		expect(res.json).toHaveBeenCalledWith({ ok: true });
	});

	test("brainTreePaymentController: error -> 500", async () => {
		const res = makeRes();
		const gateway = braintree.__gatewayInstance;
		gateway.transaction.sale.mockImplementation((_payload, cb) =>
			cb(new Error("fail"))
		);
		await brainTreePaymentController(
			{ body: { nonce: "n", cart: [] }, user: { _id: "u" } },
			res
		);
		expect(res.status).toHaveBeenCalledWith(500);
	});
});
