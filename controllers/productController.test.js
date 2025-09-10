// server/controllers/productController.test.js
import { jest } from "@jest/globals";

// ---- Mocks ----
// Mock Mongoose model với chuỗi method chain: find().populate().select().limit().sort()
const productModelMock = { find: jest.fn() };

// Mock braintree để tránh lỗi khi import controller (gateway được tạo ở top-level)
await jest.unstable_mockModule("../models/productModel.js", () => ({
	__esModule: true,
	default: productModelMock,
}));
await jest.unstable_mockModule("braintree", () => ({
	__esModule: true,
	BraintreeGateway: jest.fn().mockImplementation(() => ({
		clientToken: { generate: jest.fn() },
		transaction: { sale: jest.fn() },
	})),
	Environment: { Sandbox: {} },
}));

// Import sau khi mock xong
const { getProductController } = await import("./productController.js");

describe("getProductController", () => {
	let req, res;

	beforeEach(() => {
		req = {}; // không dùng gì trong hàm
		res = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
		};
		jest.clearAllMocks();
	});

	test("Given DB trả về products, Then response 200 + body đúng", async () => {
		// Arrange (Given)
		const productsMock = [
			{ _id: "1", name: "A" },
			{ _id: "2", name: "B" },
		];

		// Tạo object chain y như query của Mongoose
		const chain = {
			populate: jest.fn().mockReturnThis(),
			select: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			// sort là bước cuối cùng; await trên nó sẽ nhận giá trị này
			sort: jest.fn().mockResolvedValue(productsMock),
		};
		productModelMock.find.mockReturnValue(chain);

		// Act (When)
		await getProductController(req, res);

		// Assert (Then)
		expect(productModelMock.find).toHaveBeenCalledWith({});
		expect(chain.populate).toHaveBeenCalledWith("category");
		expect(chain.select).toHaveBeenCalledWith("-photo");
		expect(chain.limit).toHaveBeenCalledWith(12);
		expect(chain.sort).toHaveBeenCalledWith({ createdAt: -1 });

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.send).toHaveBeenCalledWith({
			success: true,
			counTotal: productsMock.length,
			message: "ALlProducts ",
			products: productsMock,
		});
	});

	test("Given lỗi DB, Then response 500 + message/lỗi đúng", async () => {
		// Arrange (Given)
		const boom = new Error("DB down");
		const chain = {
			// Cho nổ ngay tại populate để rơi vào catch
			populate: jest.fn(() => {
				throw boom;
			}),
			select: jest.fn(),
			limit: jest.fn(),
			sort: jest.fn(),
		};
		productModelMock.find.mockReturnValue(chain);

		// Act (When)
		await getProductController(req, res);

		// Assert (Then)
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.send).toHaveBeenCalledWith({
			success: false,
			message: "Erorr in getting products",
			error: "DB down",
		});
	});
});
