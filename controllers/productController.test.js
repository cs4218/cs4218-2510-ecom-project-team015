import {
	createProductController,
	updateProductController,
	deleteProductController,
	braintreeTokenController,
	brainTreePaymentController,
} from "./productController.js";
import { __mockGateway, __mockGenerate } from "braintree";
import dotenv from "dotenv";
import fs from "fs";

jest.mock("../models/orderModel.js", () => {
    const mockSave = jest.fn();
    const MockOrder = function (doc) {
        this.doc = doc;
        this.save = mockSave;
    };
    return {
        __esModule: true,
        default: MockOrder,
        __mockSave: mockSave,
    };
});

import orderModel from "../models/orderModel.js";
import { __mockSave as mockOrderModelSave } from "../models/orderModel.js";

jest.mock("slugify", () => ({
	__esModule: true,
	default: (s) => `slug-${String(s)}`,
}));

jest.mock("dotenv", () => ({
	__esModule: true,
	default: { config: jest.fn() },
}));

// Mock Created using ChatGPT
jest.mock("fs", () => {
	const rfs = jest.fn(() => Buffer.from("fake-bytes"));
	return {
		__esModule: true,
		default: { readFileSync: rfs },
		readFileSync: rfs,
	};
});

jest.mock("braintree", () => {
	const mockGenerate = jest.fn();
	const mockTransactionSale = jest.fn();
	const mockGateway = {
		clientToken: { generate: mockGenerate },
		transaction: { sale: mockTransactionSale }
	};
	
	return {
		__esModule: true,
		default: {
			BraintreeGateway: jest.fn(() => mockGateway),
			Environment: { Sandbox: "sandbox" }
		},
		__mockGateway: mockGateway,
		__mockGenerate: mockGenerate
	};
});

jest.mock("../models/categoryModel.js", () => ({ __esModule: true, default: {} }));

jest.mock("../models/productModel.js", () => {
	const save = jest.fn();
	const findByIdAndUpdate = jest.fn();
	const findByIdAndDelete = jest.fn();

	const Mock = function (doc) {
		this.doc = doc;
		this.photo = {};
		this.save = save;
	};

	Mock.findByIdAndUpdate = findByIdAndUpdate;
	Mock.findByIdAndDelete = findByIdAndDelete;
	return {
		__esModule: true,
		default: Mock,
		__mockFns: { save, findByIdAndUpdate, findByIdAndDelete },
	};
});

// Created using ChatGPT
import { __mockFns } from "../models/productModel.js";
const { save, findByIdAndUpdate, findByIdAndDelete } = __mockFns;


const makeRes = () => ({
	status: jest.fn().mockReturnThis(),
	send: jest.fn(),
	json: jest.fn(),
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

			// rows created using ChatGPT
			// Each row is: label, fields override, expected error
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
					{ name: "Product", description: "Good", price: 10, category: undefined },
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
					{ name: "Product", description: "Good", price: 10, category: "Books", quantity: "" },
					"Quantity is Required",
				],
			];

			test.each(rows)("sends a status 500 when %s", async (_label, overrides, expectedMsg) => {
				const fields = { ...base, ...overrides };
				const res = makeRes();
				await createProductController(
					{
						fields,
						files: { photo: { size: 1000, path: "/public/img.jpg", type: "image/jpg" } },
					},
					res
				);

				expect(res.status).toHaveBeenCalledWith(500);
				expect(res.send).toHaveBeenCalledWith({ error: expectedMsg });
			});
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
			expect(res.send).toHaveBeenCalledWith({
				error: "Photo is required",
			});
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
				files: { photo: { size: 2000000, path: "/public/img.jpg", type: "image/jpg" } },
			};
			const res = makeRes();

			await createProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.send).toHaveBeenCalledWith({
				error: "Photo should be less than 1MB",
			});
			expect(fs.readFileSync).not.toHaveBeenCalled();
		});

		it("sends a status 201 on success for products that have all the required fields filled and contain an image", async () => {
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
				files: { photo: { size: 1000, path: "/public/phone.jpg", type: "image/jpg" } },
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

			beforeEach(() => {
				save.mockResolvedValue({ _id: "1" });
			});

			// rows is created using ChatGPT
			// Each row is: label, price, quantity, expectedStatus, expectedMsg
			const rows = [
				["sends a status 400 when price=0", 0, 10, 400, "Price must be > 0 and ≤ 1000000"],
				[
					"sends a status 400 when price>max",
					1_000_001,
					10,
					400,
					"Price must be > 0 and ≤ 1000000",
				],
				[
					"sends a status 400 when qty=0",
					200,
					0,
					400,
					"Quantity must be an integer > 0 and ≤ 100000",
				],
				[
					"sends a status 400 qty is decimal",
					200,
					2.5,
					400,
					"Quantity must be an integer > 0 and ≤ 100000",
				],
				[
					"sends a status 400 when qty>max",
					200,
					100_001,
					400,
					"Quantity must be an integer > 0 and ≤ 100000",
				],
				["sends a status 201 when lower boundary is OK", 1, 1, 201, null],
				["sends a status 201 when upper boundary is OK", 1_000_000, 100_000, 201, null],
			];

			test.each(rows)("%s", async (_label, price, quantity, expected, msg) => {
				const req = {
					fields: { ...base, price, quantity },
					files: { photo: { size: 1000, path: "/public/img.jpg", type: "image/jpg" } },
				};
				const res = makeRes();

				await createProductController(req, res);

				expect(res.status).toHaveBeenCalledWith(expected);
				if (expected === 400) {
					expect(res.send).toHaveBeenCalledWith({ error: msg });
				} else {
					expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
				}
			});
		});

		it("sends a status 500 if an unexpected error happens and logs it", async () => {
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
				files: { photo: { size: 1000, path: "/public/img.jpg", type: "image/jpg" } },
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

			// rows created using ChatGPT
			// Each row is: label, fields override, expected error
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
					{ name: "Product", description: "Good", price: 10, category: undefined },
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
					{ name: "Product", description: "Good", price: 10, category: "Books", quantity: "" },
					"Quantity is Required",
				],
			];

			test.each(rows)("sends a status 500 when %s", async (_label, overrides, expectedMsg) => {
				const fields = { ...base, ...overrides };
				const res = makeRes();
				await updateProductController(
					{
						params: { pid: "1" },
						fields,
						files: { photo: { size: 1000, path: "/public/img.jpg", type: "image/jpg" } },
					},
					res
				);

				expect(res.status).toHaveBeenCalledWith(500);
				expect(res.send).toHaveBeenCalledWith({ error: expectedMsg });
			});
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

			await updateProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.send).toHaveBeenCalledWith({
				error: "Photo is required",
			});
			expect(fs.readFileSync).not.toHaveBeenCalled();
			expect(findByIdAndUpdate).not.toHaveBeenCalled();
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
				files: { photo: { size: 2000000, path: "/src/img.jpg", type: "image/jpg" } },
			};
			const res = makeRes();

			await updateProductController(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.send).toHaveBeenCalledWith({
				error: "Photo should be less than 1MB",
			});
			expect(fs.readFileSync).not.toHaveBeenCalled();
			expect(findByIdAndUpdate).not.toHaveBeenCalled();
		});

		it("sends a status 201 on success for products that have all the required fields filled and contain an image", async () => {
			const doc = { _id: "1", photo: {}, save: jest.fn().mockResolvedValue({ _id: "1" }) };
			findByIdAndUpdate.mockResolvedValue(doc);

			const fields = {
				name: "Phone",
				description: "Great",
				price: 299,
				category: "c1",
				quantity: 2,
				shipping: 1,
			};

			const files = { photo: { size: 1000, path: "/public/phone.jpg", type: "image/jpeg" } };

			const res = makeRes();

			await updateProductController({ params: { pid: "1" }, fields, files }, res);

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

			beforeEach(() => {
				save.mockResolvedValue({ _id: "1" });
			});

			// rows is created using ChatGPT
			// Each row is: label, price, quantity, expectedStatus, expectedMsg
			const rows = [
				["sends a status 400 when price=0", 0, 10, 400, "Price must be > 0 and ≤ 1000000"],
				[
					"sends a status 400 when price>max",
					1_000_001,
					10,
					400,
					"Price must be > 0 and ≤ 1000000",
				],
				[
					"sends a status 400 when qty=0",
					200,
					0,
					400,
					"Quantity must be an integer > 0 and ≤ 100000",
				],
				[
					"sends a status 400 qty is decimal",
					200,
					2.5,
					400,
					"Quantity must be an integer > 0 and ≤ 100000",
				],
				[
					"sends a status 400 when qty>max",
					200,
					100_001,
					400,
					"Quantity must be an integer > 0 and ≤ 100000",
				],
				["sends a status 201 when lower boundary is OK", 1, 1, 201, null],
				["sends a status 201 when upper boundary is OK", 1_000_000, 100_000, 201, null],
			];

			test.each(rows)("%s", async (_label, price, quantity, expected, msg) => {
				if (expected === 201) {
					findByIdAndUpdate.mockResolvedValue({
						_id: "1",
						photo: { photo: { size: 1000, path: "/public/img.jpg", type: "image/jpg" } },
						save,
					});
				}

				const res = makeRes();
				await updateProductController(
					{
						params: { pid: "1" },
						fields: { ...base, price, quantity },
						files: { photo: { size: 1000, path: "/public/img.jpg", type: "image/jpg" } },
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
						expect.objectContaining({ success: true, message: "Product Updated Successfully" })
					);
				}
			});
		});

		it("sends a status 404 when product id is not found", async () => {
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
					files: { photo: { size: 1000, path: "/public/img.jpg", type: "image/jpg" } },
				},
				res
			);

			expect(findByIdAndUpdate).toHaveBeenCalledWith("1", expect.any(Object), { new: true });
			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				message: "Product not found",
			});
		});

		it("sends a status 500 if an unexpected error happens and logs it", async () => {
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
					files: { photo: { size: 1000, path: "/public/img.jpg", type: "image/jpg" } },
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

	// DELETE PRODUCT
	describe("deleteProductController", () => {
		it("sends a status 200 when the product is successfully deleted", async () => {
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

		it("sends a status 404 when the product id is not found", async () => {
			const select = jest.fn().mockResolvedValue(null);
			findByIdAndDelete.mockReturnValue({ select });

			const req = { params: { pid: "1" } };
			const res = makeRes();

			await deleteProductController(req, res);

			expect(findByIdAndDelete).toHaveBeenCalledWith("1");
			expect(select).toHaveBeenCalledWith("-photo");
			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				message: "Product not found",
			});
		});

		it("sends a status 500 when an unexpected error happens", async () => {
			const error = new Error("network issue");
			const select = jest.fn().mockRejectedValue(error);
			findByIdAndDelete.mockReturnValue({ select });

			const req = { params: { pid: "1" } };
			const res = makeRes();

			await deleteProductController(req, res);

			expect(findByIdAndDelete).toHaveBeenCalledWith("1");
			expect(select).toHaveBeenCalledWith("-photo");
			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				message: "Error while deleting product",
				error: error,
			});
			expect(logSpy).toHaveBeenCalled();
		});
	});

	describe("braintreeTokenController", () => {

		describe("Successful token generation", () => {
			it("should generate and send client token when gateway responds successfully", async () => {
				const req = {};
				const res = makeRes();
				const mockResponse = {
					clientToken: "fake_client_token_12345",
				};

				__mockGenerate.mockImplementation((options, callback) => {
					callback(null, mockResponse);
				});

				await braintreeTokenController(req, res);

				expect(__mockGenerate).toHaveBeenCalledTimes(1);
				expect(__mockGenerate).toHaveBeenCalledWith({}, expect.any(Function));
				expect(res.send).toHaveBeenCalledWith(mockResponse);
				expect(res.send).toHaveBeenCalledWith(
					expect.objectContaining({
						clientToken: "fake_client_token_12345",
					})
				);
			});
		});

		describe("Error handling", () => {
			it("should send status 500 with error when gateway.clientToken.generate fails", async () => {
				const req = {};
				const res = makeRes();
				const mockError = new Error("Gateway connection failed");

				__mockGenerate.mockImplementation((options, callback) => {
					callback(mockError, null);
				});

				await braintreeTokenController(req, res);

				expect(__mockGenerate).toHaveBeenCalledTimes(1);
				expect(res.status).toHaveBeenCalledWith(500);
				expect(res.send).toHaveBeenCalledWith(mockError);
			});

			it("should send status 500 with error message when gateway returns error object", async () => {
				const req = {};
				const res = makeRes();
				const mockError = {
					message: "Invalid credentials",
					type: "authenticationError",
				};

				__mockGenerate.mockImplementation((options, callback) => {
					callback(mockError, null);
				});

				await braintreeTokenController(req, res);

				expect(res.status).toHaveBeenCalledWith(500);
				expect(res.send).toHaveBeenCalledWith(mockError);
				expect(res.send).toHaveBeenCalledWith(
					expect.objectContaining({
						message: "Invalid credentials",
						type: "authenticationError",
					})
				);
			});

			it("should handle network timeout errors from gateway", async () => {
				const req = {};
				const res = makeRes();
				const timeoutError = new Error("Request timeout");
				timeoutError.code = "ETIMEDOUT";

				__mockGenerate.mockImplementation((options, callback) => {
					callback(timeoutError, null);
				});

				await braintreeTokenController(req, res);

				expect(res.status).toHaveBeenCalledWith(500);
				expect(res.send).toHaveBeenCalledWith(timeoutError);
			});
		});

		describe("Edge cases and boundary conditions", () => {
			it("should handle when gateway returns null response with no error", async () => {
				const req = {};
				const res = makeRes();

				__mockGenerate.mockImplementation((options, callback) => {
					callback(null, null);
				});

				await braintreeTokenController(req, res);

				expect(res.send).toHaveBeenCalledWith(null);
				expect(res.status).not.toHaveBeenCalled();
			});

			it("should handle when gateway returns undefined response with no error", async () => {
				const req = {};
				const res = makeRes();

				__mockGenerate.mockImplementation((options, callback) => {
					callback(null, undefined);
				});

				await braintreeTokenController(req, res);

				expect(res.send).toHaveBeenCalledWith(undefined);
				expect(res.status).not.toHaveBeenCalled();
			});

			it("should handle when gateway returns empty object", async () => {
				const req = {};
				const res = makeRes();

				__mockGenerate.mockImplementation((options, callback) => {
					callback(null, {});
				});

				await braintreeTokenController(req, res);

				expect(res.send).toHaveBeenCalledWith({});
				expect(res.status).not.toHaveBeenCalled();
			});
		});

		describe("Exception handling in try-catch block", () => {
			it("should log error when an unexpected exception occurs in try block", async () => {
				const req = {};
				const res = makeRes();
				const unexpectedError = new Error("Unexpected error");

				__mockGenerate.mockImplementation(() => {
					throw unexpectedError;
				});

				await braintreeTokenController(req, res);

				expect(logSpy).toHaveBeenCalledWith(unexpectedError);
			});
		});

		describe("Request object validation", () => {
			
			it("should ignore request data and always pass empty options to gateway", async () => {
				const req = {
					params: { id: "123" },
					body: { someData: "value" },
					query: { filter: "active" },
				};
				const res = makeRes();
				const mockResponse = { clientToken: "token_123" };

				__mockGenerate.mockImplementation((options, callback) => {
					callback(null, mockResponse);
				});

				await braintreeTokenController(req, res);

				expect(res.send).toHaveBeenCalledWith(mockResponse);
				expect(__mockGenerate).toHaveBeenCalledWith({}, expect.any(Function));
			});
		});
	});

	describe("brainTreePaymentController", () => {

		beforeEach(() => {
			mockOrderModelSave.mockClear();
			__mockGateway.transaction.sale.mockClear();
		});

		it("should successfully process payment and create order when all data is valid", async () => {
			const cart = [
				{ _id: "prod1", name: "Laptop", price: 999.99 },
				{ _id: "prod2", name: "Mouse", price: 29.99 },
			];

			const req = {
				body: {
					nonce: "fake-valid-nonce",
					cart: cart,
				},
				user: { _id: "buyer123" },
			};
			const res = makeRes();

			const paymentResult = {
				success: true,
				id: "transaction123",
				amount: "1029.98",
			};

			__mockGateway.transaction.sale.mockImplementation((options, callback) => {
				callback(null, paymentResult);
			});

			mockOrderModelSave.mockResolvedValue({
				_id: "order123",
				products: cart,
				payment: paymentResult,
				buyer: "buyer123",
			});

			await brainTreePaymentController(req, res);

			expect(__mockGateway.transaction.sale).toHaveBeenCalledWith(
				{
					amount: 1029.98,
					paymentMethodNonce: "fake-valid-nonce",
					options: {
						submitForSettlement: true,
					},
				},
				expect.any(Function)
			);

			expect(mockOrderModelSave).toHaveBeenCalledTimes(1);
			expect(res.json).toHaveBeenCalledWith({ ok: true });
			expect(res.status).not.toHaveBeenCalled(); 
		});

	
		it("should send status 400 when nonce is missing", async () => {
			const req = {
				body: {
					cart: [{ price: 100 }],
				},
				user: { _id: "user123" },
			};
			const res = makeRes();

			await brainTreePaymentController(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith({ error: "Nonce required" });
			expect(__mockGateway.transaction.sale).not.toHaveBeenCalled();
			expect(mockOrderModelSave).not.toHaveBeenCalled();
		});

		it("should send status 500 when payment gateway returns error", async () => {
			const req = {
				body: {
					nonce: "invalid-nonce",
					cart: [{ price: 100 }],
				},
				user: { _id: "user123" },
			};
			const res = makeRes();

			const gatewayError = new Error("Payment declined - insufficient funds");

			__mockGateway.transaction.sale.mockImplementation((options, callback) => {
				callback(gatewayError, null);
			});

		
			await brainTreePaymentController(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.send).toHaveBeenCalledWith(
				expect.objectContaining({
					success: false,
					message: "Error processing payment",
					error: "Payment declined - insufficient funds",
				})
			);

			expect(mockOrderModelSave).not.toHaveBeenCalled();
		});

		it("should send status 500 when order save fails after successful payment", async () => {
	
			const req = {
				body: {
					nonce: "valid-nonce",
					cart: [{ price: 100 }],
				},
				user: { _id: "user123" },
			};
			const res = makeRes();

			const saveError = new Error("Database connection failed");

			__mockGateway.transaction.sale.mockImplementation((options, callback) => {
				callback(null, { success: true, id: "txn123" });
			});

			mockOrderModelSave.mockRejectedValue(saveError);

			await brainTreePaymentController(req, res);

			expect(__mockGateway.transaction.sale).toHaveBeenCalled();

			expect(mockOrderModelSave).toHaveBeenCalled();

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.send).toHaveBeenCalledWith(
				expect.objectContaining({
					success: false,
					message: "Error processing payment",
					error: "Database connection failed",
				})
			);

			expect(res.json).not.toHaveBeenCalled();

			expect(logSpy).toHaveBeenCalledWith(saveError);
		});

		it("should calculate correct total for multiple cart items with decimal prices", async () => {
			const req = {
				body: {
					nonce: "nonce-123",
					cart: [
						{ price: 10.99 },
						{ price: 20.50 },
						{ price: 5.75 },
					],
				},
				user: { _id: "user123" },
			};
			const res = makeRes();

			__mockGateway.transaction.sale.mockImplementation((options, callback) => {
				callback(null, { success: true });
			});

			mockOrderModelSave.mockResolvedValue({ _id: "order123" });

		
			await brainTreePaymentController(req, res);

			const callArgs = __mockGateway.transaction.sale.mock.calls[0][0];

			// Total should be 37.24 (10.99 + 20.50 + 5.75)
			expect(callArgs.amount).toBeCloseTo(37.24, 2);
		});

		it("should only send success response after order is successfully saved", async () => {
			const req = {
				body: {
					nonce: "nonce-123",
					cart: [{ price: 100 }],
				},
				user: { _id: "user123" },
			};
			const res = makeRes();

			let saveResolved = false;

			__mockGateway.transaction.sale.mockImplementation((options, callback) => {
				callback(null, { success: true });
			});

			mockOrderModelSave.mockImplementation(() => {
				return new Promise(resolve => {
					setTimeout(() => {
						saveResolved = true;
						resolve({ _id: "order123" });
					}, 20);
				});
			});

			await brainTreePaymentController(req, res);

			expect(saveResolved).toBe(true);
			expect(res.json).toHaveBeenCalledWith({ ok: true });
		});

		it("should handle minimum valid price (0.01)", async () => {

			const req = {
				body: {
					nonce: "nonce-123",
					cart: [{ price: 0.01 }],
				},
				user: { _id: "user123" },
			};
			const res = makeRes();

			__mockGateway.transaction.sale.mockImplementation((options, callback) => {
				callback(null, { success: true });
			});

			mockOrderModelSave.mockResolvedValue({ _id: "order123" });

			await brainTreePaymentController(req, res);

			expect(__mockGateway.transaction.sale).toHaveBeenCalledWith(
				expect.objectContaining({ amount: 0.01 }),
				expect.any(Function)
			);
			expect(res.json).toHaveBeenCalledWith({ ok: true });
		});

		it("should catch and handle unexpected exceptions properly", async () => {
			
			const req = {
				body: {
					nonce: "nonce-123",
					cart: [{ price: 100 }],
				},
				user: { _id: "user123" },
			};
			const res = makeRes();

			const unexpectedError = new Error("Unexpected server error");

			__mockGateway.transaction.sale.mockImplementation(() => {
				throw unexpectedError;
			});

			await brainTreePaymentController(req, res);
			expect(logSpy).toHaveBeenCalledWith(unexpectedError);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.send).toHaveBeenCalledWith(
				expect.objectContaining({
					success: false,
					message: "Error processing payment",
					error: "Unexpected server error",
				})
			);

			expect(res.json).not.toHaveBeenCalled();
		});
	});
});
