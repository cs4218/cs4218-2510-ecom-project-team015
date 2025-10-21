// Author: Adhitya
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import userModel from "../../models/userModel";
import productModel from "../../models/productModel";
import orderModel from "../../models/orderModel";
import testApp from "./serverSetup";
import { getOrdersController } from "../../controllers/authController";

let mongoServer;

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterEach(async () => {
  await userModel.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Validate response received from backend when accessing orders page", () => {
    test("Returns correct order for authenticated user", async () => {
      // Arrange
      const user = await userModel.create({
        name: "Adhitya",
        email: "adhi@example.com",
        password: "hashedPassword",
        phone: "98765432",
        address: "456 Street",
        DOB: new Date("2002-01-01"),
        answer: "test",
        role: 0,
      });

      const product = await productModel.create({
        name: "Laptop",
        slug: "laptop",
        description: "High performance testing laptop",
        price: 1500,
        category: new mongoose.Types.ObjectId(),
        quantity: 3,
        shipping: true,
      });

      await orderModel.create({
          products: [product._id],
          payment: { success: true },
          buyer: user._id,
          status: "Not Processed",
      });

      testApp.get("/api/v1/auth/orders", (req, res, next) => {
        req.user = { _id: user._id };
        next();
      }, getOrdersController);

      // Act
      const response = await request(testApp).get("/api/v1/auth/orders");

      // Assert
      expect(response.statusCode).toBe(200);

      const order = response.body[0];
      expect(order.status).toBe("Not Processed");
      expect(order.buyer.name).toBe("Adhitya");
      expect(order.payment.success).toBe(true);
      expect(order.products[0].name).toBe("Laptop");
      expect(order.products[0].price).toBe(1500);
    });

    test("does not throw error even if db is empty", async () => {
        //Arrange + Act
        const response = await request(testApp).get("/api/v1/auth/orders");

        //Assert
        expect(response.statusCode).toBe(200);
    });

    test("does not fail if user has no orders", async () => {
      const user = await userModel.create({
        name: "NoOrderUser",
        email: "noorder@example.com",
        password: "hashedPassword",
        phone: "90909090",
        address: "Singapore",
        DOB: new Date("2000-01-01"),
        answer: "none",
        role: 0,
      });

      testApp.get("/api/v1/auth/orders", (req, res, next) => {
        req.user = { _id: user._id };
        next();
      }, getOrdersController);

      const response = await request(testApp).get("/api/v1/auth/orders");

      expect(response.statusCode).toBe(200);
    });

    test("returns 500 and error message if database call fails", async () => {
      // Arrange 
      jest.spyOn(orderModel, "find").mockReturnValue({
        populate: () => {
          throw new Error("Database failure");
        }
      });

      testApp.get("/api/v1/auth/orders", (req, res, next) => {
        req.user = { _id: new mongoose.Types.ObjectId() };
        next();
      }, getOrdersController);

      // Act
      const response = await request(testApp).get("/api/v1/auth/orders");

      // Assert
      expect(response.statusCode).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Error while fetching orders");
      expect(response.body.error).toBeDefined();

      orderModel.find.mockRestore();
    });
});