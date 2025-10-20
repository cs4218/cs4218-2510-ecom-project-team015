// Written by Ujjwal Gaurav
// This test file checks the product controller integration tests (create, update, delete)
import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import formidable from "express-formidable";
import path from "path";
import fs from "fs";
import bodyParser from "body-parser";
import categoryModel from "../../../models/categoryModel.js";
import productModel from "../../../models/productModel.js";
import {
	createProductController,
	updateProductController,
	deleteProductController,
} from "../../../controllers/productController.js";

function buildApp() {
	const app = express();
	app.use(bodyParser.json());

	app.post("/api/v1/product/create-product", formidable(), createProductController);
	app.put("/api/v1/product/update-product/:pid", formidable(), updateProductController);
	app.delete("/api/v1/product/delete-product/:pid", deleteProductController);

	return app;
}

let mongo, app;
const SMALL_JPG = path.join(__dirname, "small.jpg");
const BIG_JPG = path.join(__dirname, "big.jpg");

beforeAll(async () => {
	fs.writeFileSync(SMALL_JPG, Buffer.alloc(200_000, 0xff));
	fs.writeFileSync(BIG_JPG, Buffer.alloc(1_500_000, 0xaa));

	mongo = await MongoMemoryServer.create();
	await mongoose.connect(mongo.getUri());
	app = buildApp();

	if (categoryModel.createCollection) await categoryModel.createCollection();
	if (productModel.createCollection) await productModel.createCollection();
});

afterAll(async () => {
	try {
		fs.unlinkSync(SMALL_JPG);
		fs.unlinkSync(BIG_JPG);
	} catch (e) {}
	await mongoose.disconnect();
	await mongo.stop();
});

afterEach(async () => {
	const collections = await mongoose.connection.db.collections();
	await Promise.all(collections.map((c) => c.deleteMany({})));
});

async function seedCategory({ name = "Home", slug = "home" } = {}) {
	return categoryModel.create({ name, slug });
}

async function seedProduct(overrides = {}) {
	const cat = overrides.category
		? await categoryModel.findById(overrides.category)
		: await seedCategory();
	const doc = await productModel.create({
		name: "Lamp",
		slug: "lamp",
		description: "Metal lamp",
		price: 10,
		category: cat._id,
		quantity: 5,
		shipping: "1",
		...overrides,
	});
	return { product: doc, category: cat };
}

describe("createProductController", () => {
	test("send status 201 on valid input with ≤1MB photo", async () => {
		const cat = await seedCategory();

		// Valid input
		const res = await request(app)
			.post("/api/v1/product/create-product")
			.field("name", "Desk Lamp")
			.field("description", "Metal desk lamp")
			.field("price", "13.5")
			.field("category", String(cat._id))
			.field("quantity", "7")
			.field("shipping", "1")
			.attach("photo", SMALL_JPG);

		expect(res.status).toBe(201);
		expect(res.body.success).toBe(true);
		expect(res.body.products.slug).toBe("desk-lamp");

		const inDb = await productModel.findById(res.body.products._id);
		expect(inDb).toBeTruthy();
		expect(inDb.slug).toBe("desk-lamp");
		expect(inDb.photo?.data?.length).toBeGreaterThan(0);
	});

	test("sends status 500 for validations for missing fields and photo; 400 for numeric rules; 500 for photo > 1MB", async () => {
		const cat = await seedCategory();

		// Missing name
		let r = await request(app)
			.post("/api/v1/product/create-product")
			.field("description", "d")
			.field("price", "10")
			.field("category", String(cat._id))
			.field("quantity", "1")
			.field("shipping", "1")
			.attach("photo", SMALL_JPG);
		expect(r.status).toBe(500);
		expect(r.body.error).toMatch(/name is required/i);

		// Missing photo
		r = await request(app)
			.post("/api/v1/product/create-product")
			.field("name", "X")
			.field("description", "d")
			.field("price", "10")
			.field("category", String(cat._id))
			.field("quantity", "1")
			.field("shipping", "1");
		expect(r.status).toBe(500);
		expect(r.body.error).toMatch(/photo is required/i);

		// Price <= 0
		r = await request(app)
			.post("/api/v1/product/create-product")
			.field("name", "X")
			.field("description", "d")
			.field("price", "0")
			.field("category", String(cat._id))
			.field("quantity", "1")
			.field("shipping", "1")
			.attach("photo", SMALL_JPG);
		expect(r.status).toBe(400);
		expect(r.body.error).toMatch(/price must be > 0/i);

		// Quantity non-integer
		r = await request(app)
			.post("/api/v1/product/create-product")
			.field("name", "X")
			.field("description", "d")
			.field("price", "10")
			.field("category", String(cat._id))
			.field("quantity", "1.2")
			.field("shipping", "1")
			.attach("photo", SMALL_JPG);
		expect(r.status).toBe(400);
		expect(r.body.error).toMatch(/quantity must be an integer/i);

		// Photo > 1MB
		r = await request(app)
			.post("/api/v1/product/create-product")
			.field("name", "X")
			.field("description", "d")
			.field("price", "10")
			.field("category", String(cat._id))
			.field("quantity", "1")
			.field("shipping", "1")
			.attach("photo", BIG_JPG);
		expect(r.status).toBe(500);
		expect(r.body.error).toMatch(/less than 1mb|should be less than 1mb/i);
	});
});

describe("updateProductController", () => {
	test("send status 404 when product id not found; 201 on valid update with slug change", async () => {
		const { product, category } = await seedProduct({ name: "Old", slug: "old" });

		// Missing product id
		await request(app)
			.put(`/api/v1/product/update-product/${new mongoose.Types.ObjectId()}`)
			.field("name", "New")
			.field("description", "D")
			.field("price", "15")
			.field("category", String(category._id))
			.field("quantity", "3")
			.field("shipping", "0")
			.attach("photo", SMALL_JPG)
			.expect(404);

		// Valid update
		const res = await request(app)
			.put(`/api/v1/product/update-product/${product._id}`)
			.field("name", "New Name")
			.field("description", "Updated")
			.field("price", "15")
			.field("category", String(category._id))
			.field("quantity", "9")
			.field("shipping", "0")
			.attach("photo", SMALL_JPG);

		expect(res.status).toBe(201);
		expect(res.body.success).toBe(true);
		expect(res.body.products.slug).toBe("new-name");

		const inDb = await productModel.findById(product._id);
		expect(inDb.slug).toBe("new-name");
		expect(inDb.price).toBe(15);
		expect(inDb.quantity).toBe(9);
	});

	test("send status 400 for numeric validation (price/qty); 500 for photo > 1MB; 500 for missing fields", async () => {
		const { product, category } = await seedProduct();

		// Missing name
		let r = await request(app)
			.put(`/api/v1/product/update-product/${product._id}`)
			.field("description", "d")
			.field("price", "10")
			.field("category", String(category._id))
			.field("quantity", "1")
			.field("shipping", "1");
		expect(r.status).toBe(500);
		expect(r.body.error).toMatch(/name is required/i);

		// Price <= 0
		r = await request(app)
			.put(`/api/v1/product/update-product/${product._id}`)
			.field("name", "X")
			.field("description", "d")
			.field("price", "0")
			.field("category", String(category._id))
			.field("quantity", "1")
			.field("shipping", "1");
		expect(r.status).toBe(400);
		expect(r.body.error).toMatch(/price must be > 0/i);

		// Quantity non-integer
		r = await request(app)
			.put(`/api/v1/product/update-product/${product._id}`)
			.field("name", "X")
			.field("description", "d")
			.field("price", "10")
			.field("category", String(category._id))
			.field("quantity", "2.2")
			.field("shipping", "1");
		expect(r.status).toBe(400);
		expect(r.body.error).toMatch(/quantity must be an integer/i);

		// Photo > 1MB
		r = await request(app)
			.put(`/api/v1/product/update-product/${product._id}`)
			.field("name", "X")
			.field("description", "d")
			.field("price", "10")
			.field("category", String(category._id))
			.field("quantity", "2")
			.field("shipping", "1")
			.attach("photo", BIG_JPG);
		expect(r.status).toBe(500);
		expect(r.body.error).toMatch(/less than 1mb/i);
	});
});

describe("deleteProductController", () => {
	test("send status 200 on success; 404 when product id not found", async () => {
		const { product } = await seedProduct();
		await request(app).delete(`/api/v1/product/delete-product/${product._id}`).expect(200);
		await request(app).delete(`/api/v1/product/delete-product/${product._id}`).expect(404);
	});
});
