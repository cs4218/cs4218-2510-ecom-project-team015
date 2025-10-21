// tests/integration/payment-cart.integration.test.js

import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import cartModel from '../../../models/cartModel.js';
import productModel from '../../../models/productModel.js';
import orderModel from '../../../models/orderModel.js';
import userModel from '../../../models/userModel.js';
// Mock Braintree BEFORE importing controllers
jest.mock('braintree', () => {
  const mockSale = jest.fn();
  return {
    BraintreeGateway: jest.fn(() => ({
      transaction: {
        sale: mockSale
      }
    })),
    Environment: {
      Sandbox: 'sandbox'
    },
    // Export mockSale so we can access it later
    __mockSale: mockSale
  };
});

import { brainTreePaymentController } from '../../../controllers/productController.js';
import { clearCartController } from '../../../controllers/cartController.js';
import braintree from 'braintree';

// Get the mock sale function
const mockSale = braintree.__mockSale;

// Create test app
const app = express();
app.use(express.json());

// Mock auth middleware to inject user
const mockAuth = (req, res, next) => {
  req.user = { _id: req.headers.userid || 'test-user-id' };
  next();
};

// Setup routes
app.post('/api/v1/product/braintree/payment', mockAuth, brainTreePaymentController);
app.delete('/api/v1/cart/clear', mockAuth, clearCartController);

describe('Payment to Cart Integration Test', () => {
  let mongoServer;
  let testUser;
  let testProducts;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections
    await userModel.deleteMany({});
    await productModel.deleteMany({});
    await cartModel.deleteMany({});
    await orderModel.deleteMany({});

    // Create test user
    testUser = await userModel.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
      phone: '91234567', // Valid Singapore phone number
      address: '123 Test St',
      answer: 'test',
      DOB: '1990-01-01' // Required field
    });

    // Create test products
    testProducts = await productModel.create([
      {
        name: 'Laptop',
        slug: 'laptop',
        description: 'Gaming laptop',
        price: 1500,
        category: new mongoose.Types.ObjectId(),
        quantity: 10,
        shipping: true
      },
      {
        name: 'Mouse',
        slug: 'mouse',
        description: 'Wireless mouse',
        price: 50,
        category: new mongoose.Types.ObjectId(),
        quantity: 20,
        shipping: true
      }
    ]);

    // Create cart with items
    await cartModel.create({
      user: testUser._id,
      items: testProducts.map(p => p._id)
    });
  });

  test('successfully processes payment and clears cart from database', async () => {
    // Mock successful Braintree payment
    mockSale.mockImplementation((options, callback) => {
      callback(null, {
        success: true,
        id: 'transaction-123',
        amount: '1550.00'
      });
    });

    // Step 1: Process payment
    const paymentCart = testProducts.map(p => ({
      _id: p._id.toString(),
      name: p.name,
      price: p.price,
      description: p.description
    }));

    const paymentResponse = await request(app)
      .post('/api/v1/product/braintree/payment')
      .set('userid', testUser._id.toString())
      .send({
        nonce: 'fake-valid-nonce',
        cart: paymentCart
      });

    // Verify payment was processed
    expect(paymentResponse.status).toBe(200);
    expect(paymentResponse.body.ok).toBe(true);

    // Verify order was created
    const orders = await orderModel.find({ buyer: testUser._id });
    expect(orders).toHaveLength(1);
    expect(orders[0].products).toHaveLength(2);
    expect(orders[0].payment.id).toBe('transaction-123');

    // Step 2: Clear cart
    const clearResponse = await request(app)
      .delete('/api/v1/cart/clear')
      .set('userid', testUser._id.toString());

    // Verify cart was cleared
    expect(clearResponse.status).toBe(200);
    expect(clearResponse.body.success).toBe(true);

    // Verify cart is empty in database
    const cartAfterClear = await cartModel.findOne({ user: testUser._id });
    expect(cartAfterClear.items).toHaveLength(0);
  });
});