import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// CRITICAL: Mock braintree BEFORE importing the controller
// Define everything inside the factory to avoid hoisting issues
jest.mock("braintree", () => {
  const mockSale = jest.fn();
  return {
    BraintreeGateway: jest.fn(function() {
      this.transaction = {
        sale: mockSale,
      };
    }),
    Environment: {
      Sandbox: "sandbox",
    },
    // Export the mock so tests can access it
    __mockTransactionSale: mockSale,
  };
});

// NOW import after mocking
import orderModel from "../../../models/orderModel.js";
import productModel from "../../../models/productModel.js";
import { brainTreePaymentController } from "../../../controllers/productController.js";
import braintree from "braintree";

// Get reference to the mock function
const mockTransactionSale = braintree.__mockTransactionSale;

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await orderModel.deleteMany({});
  await productModel.deleteMany({});
  mockTransactionSale.mockClear();
});

// Helper to create mock response
const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe("Payment and Order Database Integration Tests", () => {
  
  // Test 1: Successful Payment Creates Order in Database
  test("should create order in database when payment succeeds", async () => {
    const buyerId = new mongoose.Types.ObjectId();
    const product1 = new mongoose.Types.ObjectId();
    const product2 = new mongoose.Types.ObjectId();
    
    // Cart contains full product objects including _id
    const cart = [
      { _id: product1, name: "Product 1", price: 50.00 },
      { _id: product2, name: "Product 2", price: 30.00 },
    ];
    
    const req = {
      body: {
        nonce: "fake-valid-nonce",
        cart: cart,
      },
      user: { _id: buyerId },
    };
    const res = makeRes();
    
    const paymentResult = {
      success: true,
      transaction: {
        id: "txn_123456",
        amount: "80.00",
        status: "submitted_for_settlement",
      },
    };
    
    mockTransactionSale.mockImplementation((options, callback) => {
      callback(null, paymentResult);
    });
    
    await brainTreePaymentController(req, res);
    
    // Verify order was created in database
    const orders = await orderModel.find({});
    expect(orders).toHaveLength(1);
    
    const order = orders[0];
    expect(order.buyer.toString()).toBe(buyerId.toString());
    expect(order.products).toHaveLength(2);
    // Verify product references are stored correctly
    expect(order.products[0]._id.toString()).toBe(product1.toString());
    expect(order.products[1]._id.toString()).toBe(product2.toString());
    expect(order.payment).toEqual(paymentResult);
    expect(order.status).toBe("Not Processed");
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });
  
  // Test 2: Order Contains Correct Product References
  test("should store product IDs as ObjectId references in order", async () => {
    const buyerId = new mongoose.Types.ObjectId();
    const product1 = new mongoose.Types.ObjectId();
    const product2 = new mongoose.Types.ObjectId();
    
    const cart = [
      { _id: product1, name: "Product A", price: 100 },
      { _id: product2, name: "Product B", price: 200 },
    ];
    
    const req = {
      body: { nonce: "valid-nonce", cart: cart },
      user: { _id: buyerId },
    };
    const res = makeRes();
    
    mockTransactionSale.mockImplementation((options, callback) => {
      callback(null, { success: true, id: "txn_789" });
    });
    
    await brainTreePaymentController(req, res);
    
    const order = await orderModel.findOne({});
    
    // Verify products array contains the product references
    expect(order.products).toHaveLength(2);
    // The order schema stores products as an array - each element is an object with _id
    // When cart is saved, MongoDB extracts the ObjectIds based on the schema
    expect(order.products[0]._id.toString()).toBe(product1.toString());
    expect(order.products[1]._id.toString()).toBe(product2.toString());
    
    // Verify the products are stored as proper ObjectId references
    expect(order.products[0]._id).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(order.products[1]._id).toBeInstanceOf(mongoose.Types.ObjectId);
  });
  
  // Test 3: Payment Failure Does Not Create Order
  test("should not create order when payment fails", async () => {
    const buyerId = new mongoose.Types.ObjectId();
    const cart = [{ _id: new mongoose.Types.ObjectId(), price: 50 }];
    
    const req = {
      body: { nonce: "invalid-nonce", cart: cart },
      user: { _id: buyerId },
    };
    const res = makeRes();
    
    const paymentError = new Error("Payment declined");
    
    mockTransactionSale.mockImplementation((options, callback) => {
      callback(paymentError, null);
    });
    
    await brainTreePaymentController(req, res);
    
    // Verify no order was created
    const orders = await orderModel.find({});
    expect(orders).toHaveLength(0);
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error processing payment",
      })
    );
  });
  
  // Test 4: Order Save Failure Handles Transaction Properly
  test("should handle database error after successful payment", async () => {
    const buyerId = new mongoose.Types.ObjectId();
    const cart = [{ _id: new mongoose.Types.ObjectId(), price: 100 }];
    
    const req = {
      body: { nonce: "valid-nonce", cart: cart },
      user: { _id: buyerId },
    };
    const res = makeRes();
    
    mockTransactionSale.mockImplementation((options, callback) => {
      callback(null, { success: true, id: "txn_abc" });
    });
    
    // Force database error by disconnecting
    await mongoose.disconnect();
    
    await brainTreePaymentController(req, res);
    
    // Reconnect for cleanup
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error processing payment",
      })
    );
    
    // Verify no order exists
    const orders = await orderModel.find({});
    expect(orders).toHaveLength(0);
  });
  
  // Test 5: Order Timestamps Are Auto-Generated
  test("should auto-generate createdAt and updatedAt timestamps", async () => {
    const buyerId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();
    const cart = [{ _id: productId, name: "Product", price: 75 }];
    
    const req = {
      body: { nonce: "valid-nonce", cart: cart },
      user: { _id: buyerId },
    };
    const res = makeRes();
    
    mockTransactionSale.mockImplementation((options, callback) => {
      callback(null, { success: true, id: "txn_timestamp" });
    });
    
    const beforeTime = new Date();
    
    await brainTreePaymentController(req, res);
    
    const afterTime = new Date();
    
    const order = await orderModel.findOne({});
    
    expect(order.createdAt).toBeDefined();
    expect(order.updatedAt).toBeDefined();
    expect(order.createdAt).toBeInstanceOf(Date);
    expect(order.updatedAt).toBeInstanceOf(Date);
    
    // Verify timestamps are within reasonable range
    expect(order.createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(order.createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });
  
  // Test 6: Payment Object Stores Complete Transaction Data
  test("should store complete payment transaction data in order", async () => {
    const buyerId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();
    const cart = [{ _id: productId, name: "Premium Item", price: 150.50 }];
    
    const req = {
      body: { nonce: "valid-nonce", cart: cart },
      user: { _id: buyerId },
    };
    const res = makeRes();
    
    const completePaymentResult = {
      success: true,
      transaction: {
        id: "txn_complete_789",
        amount: "150.50",
        status: "submitted_for_settlement",
        type: "sale",
        currencyIsoCode: "USD",
        createdAt: new Date(),
        processorResponseCode: "1000",
        processorResponseText: "Approved",
      },
      creditCard: {
        last4: "1234",
        cardType: "Visa",
      },
    };
    
    mockTransactionSale.mockImplementation((options, callback) => {
      callback(null, completePaymentResult);
    });
    
    await brainTreePaymentController(req, res);
    
    const order = await orderModel.findOne({});
    
    // Verify entire payment object is stored
    expect(order.payment).toEqual(completePaymentResult);
    expect(order.payment.transaction.id).toBe("txn_complete_789");
    expect(order.payment.transaction.amount).toBe("150.50");
    expect(order.payment.creditCard.last4).toBe("1234");
  });
  
  // Test 7: Multiple Products in Cart Create Single Order
  test("should create single order with all products from cart", async () => {
    const buyerId = new mongoose.Types.ObjectId();
    const products = [
      { _id: new mongoose.Types.ObjectId(), name: "Item 1", price: 10 },
      { _id: new mongoose.Types.ObjectId(), name: "Item 2", price: 20 },
      { _id: new mongoose.Types.ObjectId(), name: "Item 3", price: 30 },
      { _id: new mongoose.Types.ObjectId(), name: "Item 4", price: 40 },
    ];
    
    const req = {
      body: { nonce: "valid-nonce", cart: products },
      user: { _id: buyerId },
    };
    const res = makeRes();
    
    mockTransactionSale.mockImplementation((options, callback) => {
      // Verify total is calculated correctly
      expect(options.amount).toBe(100); // 10+20+30+40
      callback(null, { success: true, id: "txn_multi" });
    });
    
    await brainTreePaymentController(req, res);
    
    // Verify only one order was created
    const orders = await orderModel.find({});
    expect(orders).toHaveLength(1);
    
    const order = orders[0];
    expect(order.products).toHaveLength(4);
    
    // Verify all product IDs are in the order (schema stores ObjectId references)
    products.forEach((product, index) => {
      expect(order.products[index]._id.toString()).toBe(product._id.toString());
    });
    
    expect(order.buyer.toString()).toBe(buyerId.toString());
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });
  
});