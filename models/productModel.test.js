import mongoose from "mongoose";
import Product from "../models/productModel"; // Adjust import based on file location
import { MongoMemoryServer } from "mongodb-memory-server"; // Import the correct package

// Setup MongoDB in-memory server for testing with ChatGPT
let mongoServer;

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create(); // Start an in-memory MongoDB instance
	const uri = mongoServer.getUri(); // Get the connection URI
	await mongoose.connect(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});
});

afterAll(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
});

describe("Product Model", () => {
	// Test 1: Create Product
	it("should create and save a product successfully", async () => {
		const category = new mongoose.Types.ObjectId(); // Mock Category ObjectId
		const productData = {
			name: "Sample Product",
			slug: "sample-product",
			description: "This is a test product.",
			price: 99.99,
			category: category,
			quantity: 100,
			shipping: true,
		};

		const product = new Product(productData);
		await product.save();

		const savedProduct = await Product.findOne({ name: "Sample Product" });
		expect(savedProduct).toBeDefined();
		expect(savedProduct.name).toBe("Sample Product");
		expect(savedProduct.price).toBe(99.99);
		expect(savedProduct.shipping).toBe(true);
		expect(savedProduct.category).toEqual(category); // check ObjectId reference
	});

	// Test 2: Validate missing required fields
	it("should fail to create a product without required fields", async () => {
		const productData = {
			slug: "no-name-product", // Missing name field
			description: "Missing name field.",
			price: 29.99,
			category: new mongoose.Types.ObjectId(),
			quantity: 10,
		};

		const product = new Product(productData);
		let error;
		try {
			await product.save();
		} catch (err) {
			error = err;
		}

		expect(error).toBeDefined();
		expect(error.errors.name).toBeDefined();
	});

	// Test 3: Validate price is a number
	it("should only accept a number for the price", async () => {
		const category = new mongoose.Types.ObjectId();
		const invalidProductData = {
			name: "Invalid Price Product",
			slug: "invalid-price",
			description: "Price is not a number.",
			price: "not-a-number", // Invalid price
			category: category,
			quantity: 20,
		};

		const product = new Product(invalidProductData);
		let error;
		try {
			await product.save();
		} catch (err) {
			error = err;
		}

		expect(error).toBeDefined();
		expect(error.errors.price).toBeDefined();
	});

	// Test 4: Validate category reference
	it("should validate category reference as ObjectId", async () => {
		const validCategoryId = new mongoose.Types.ObjectId();
		const productData = {
			name: "Product with Category",
			slug: "product-with-category",
			description: "Testing category reference.",
			price: 50.0,
			category: validCategoryId,
			quantity: 25,
		};

		const product = new Product(productData);
		const savedProduct = await product.save();

		expect(savedProduct.category).toEqual(validCategoryId); // Check that ObjectId is stored correctly
	});

	// Test 5: Check timestamps (createdAt & updatedAt)
	it("should have createdAt and updatedAt timestamps", async () => {
		const category = new mongoose.Types.ObjectId();
		const productData = {
			name: "Timestamps Test Product",
			slug: "timestamps-test-product",
			description: "This product checks timestamps.",
			price: 150.5,
			category: category,
			quantity: 15,
		};

		const product = new Product(productData);
		const savedProduct = await product.save();

		expect(savedProduct.createdAt).toBeDefined();
		expect(savedProduct.updatedAt).toBeDefined();
		expect(savedProduct.createdAt.getTime()).toBeLessThanOrEqual(
			savedProduct.updatedAt.getTime()
		);
	});

	// Test: missing compulsorry fields (table-driven)
	it("should fail when required fields are missing", async () => {
		const base = {
			name: "A",
			slug: "a",
			description: "desc",
			price: 1,
			category: new mongoose.Types.ObjectId(),
			quantity: 1,
		};

		const cases = [
			{ ...base, name: undefined, _miss: "name" },
			{ ...base, slug: undefined, _miss: "slug" },
			{ ...base, description: undefined, _miss: "description" },
			{ ...base, price: undefined, _miss: "price" },
			{ ...base, category: undefined, _miss: "category" },
			{ ...base, quantity: undefined, _miss: "quantity" },
		];

		for (const c of cases) {
			const p = new Product(c);
			let err;
			try {
				await p.save();
			} catch (e) {
				err = e;
			}
			expect(err).toBeDefined();
			expect(err.errors[c._miss]).toBeDefined();
		}
	});

	// Test: quantity is not a number
	it("should reject non-number quantity", async () => {
		const p = new Product({
			name: "Q",
			slug: "q",
			description: "d",
			price: 10,
			category: new mongoose.Types.ObjectId(),
			quantity: "ten", // sai kiểu
		});
		let err;
		try {
			await p.save();
		} catch (e) {
			err = e;
		}
		expect(err).toBeDefined();
		expect(err.errors.quantity).toBeDefined();
	});

	// Test: category wrong ObjectId type (CastError) made using ChatGPT
	it("should throw CastError when category is not ObjectId", async () => {
		const p = new Product({
			name: "Cast",
			slug: "cast",
			description: "d",
			price: 10,
			category: "not-an-objectid", // wrong
			quantity: 1,
		});
		await expect(p.save()).rejects.toThrow(/Cast to ObjectId failed/i);
	});

	// Test: shipping optional
	it("should allow missing optional field 'shipping'", async () => {
		const p = new Product({
			name: "NoShip",
			slug: "noship",
			description: "d",
			price: 5,
			category: new mongoose.Types.ObjectId(),
			quantity: 2,
		});
		const saved = await p.save();
		expect(saved.shipping).toBeUndefined();
	});

	// Test: photo subdocument (Buffer + contentType) made using ChatGPT
	it("should store photo buffer and contentType", async () => {
		const buf = Buffer.from("hello");
		const p = new Product({
			name: "WithPhoto",
			slug: "with-photo",
			description: "d",
			price: 20,
			category: new mongoose.Types.ObjectId(),
			quantity: 3,
			photo: { data: buf, contentType: "text/plain" },
		});
		const saved = await p.save();
		expect(saved.photo.data.equals(buf)).toBe(true);
		expect(saved.photo.contentType).toBe("text/plain");
	});

	// Test: updatedAt changes after update, made using ChatGPT
	it("should bump updatedAt on update", async () => {
		const p = await Product.create({
			name: "Upd",
			slug: "upd",
			description: "d",
			price: 10,
			category: new mongoose.Types.ObjectId(),
			quantity: 1,
		});
		const before = p.updatedAt;
		p.price = 11;
		await new Promise((r) => setTimeout(r, 5)); // 
		const afterSave = await p.save();
		expect(afterSave.updatedAt.getTime()).toBeGreaterThan(before.getTime());
	});
});
