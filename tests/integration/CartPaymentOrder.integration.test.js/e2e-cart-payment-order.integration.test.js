// End-to-end style integration test: cart -> payment -> order -> cart clear
// Author: Vedant Sinha
// This file has been written with the help of ChatGPT.

import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import JWT from "jsonwebtoken";

// Mock Braintree gateway end-to-end at module level
jest.mock("braintree", () => {
  const mockSale = jest.fn();
  return {
    BraintreeGateway: jest.fn(() => ({
      transaction: {
        sale: mockSale,
      },
    })),
    Environment: { Sandbox: "sandbox" },
    __mockSale: mockSale,
  };
});

import braintree from "braintree";
import authRoutes from "../../../routes/authRoute.js";
import productRoutes from "../../../routes/productRoutes.js";
import cartRoutes from "../../../routes/cartRoutes.js";
import userModel from "../../../models/userModel.js";
import productModel from "../../../models/productModel.js";
import orderModel from "../../../models/orderModel.js";
import cartModel from "../../../models/cartModel.js";

describe("E2E: Cart → Payment → Order → Clear Cart", () => {
  let mongoServer;
  let app;
  let token;
  let user;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    app = express();
    app.use(express.json());
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/product", productRoutes);
    app.use("/api/v1/cart", cartRoutes);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await userModel.deleteMany({});
    await productModel.deleteMany({});
    await orderModel.deleteMany({});
    await cartModel.deleteMany({});

    user = await userModel.create({
      name: "Buyer One",
      email: "buyer@example.com",
      password: "hashed",
      phone: "91234567",
      address: "123 Test Ave",
      answer: "x",
      DOB: new Date("1990-01-01"),
      role: 0,
    });
    token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET);
  });

  test("full flow succeeds and persists order while clearing cart", async () => {
    const p1 = await productModel.create({
      name: "Laptop",
      slug: "laptop",
      description: "Gaming",
      price: 1500,
      category: new mongoose.Types.ObjectId(),
      quantity: 10,
      shipping: true,
    });
    const p2 = await productModel.create({
      name: "Mouse",
      slug: "mouse",
      description: "Wireless",
      price: 50,
      category: new mongoose.Types.ObjectId(),
      quantity: 20,
      shipping: true,
    });

    // Add both products to cart via API
    await request(app)
      .post("/api/v1/cart/add")
      .set("Authorization", token)
      .send({ productId: p1._id.toString() })
      .expect(200);

    await request(app)
      .post("/api/v1/cart/add")
      .set("Authorization", token)
      .send({ productId: p2._id.toString() })
      .expect(200);

    // Verify cart contains two items
    const cartRes = await request(app)
      .get("/api/v1/cart/")
      .set("Authorization", token)
      .expect(200);
    expect(cartRes.body.success).toBe(true);
    expect(cartRes.body.cart.items).toHaveLength(2);

    // Mock Braintree sale success
    const mockSale = braintree.__mockSale;
    mockSale.mockImplementation((options, cb) => {
      cb(null, { success: true, id: "txn_test_1" });
    });

    // Build cart payload with prices (as client would send)
    const cartPayload = [
      { _id: p1._id, price: p1.price },
      { _id: p2._id, price: p2.price },
    ];

    // Pay
    const payRes = await request(app)
      .post("/api/v1/product/braintree/payment")
      .set("Authorization", token)
      .send({ nonce: "fake-nonce", cart: cartPayload })
      .expect(200);
    expect(payRes.body).toEqual({ ok: true });

    // Order created with two products and correct buyer
    const orders = await orderModel.find({}).lean();
    expect(orders).toHaveLength(1);
    expect(orders[0].buyer.toString()).toBe(user._id.toString());
    expect(orders[0].products).toHaveLength(2);

    // Clear cart
    await request(app)
      .delete("/api/v1/cart/clear")
      .set("Authorization", token)
      .expect(200);

    // Cart should be empty now
    const postClear = await request(app)
      .get("/api/v1/cart/")
      .set("Authorization", token)
      .expect(200);
    expect(postClear.body.cart.items).toHaveLength(0);
  });
});

