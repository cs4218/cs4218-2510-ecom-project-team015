// Author: Ravi Kishore

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import testApp from './serverSetup.js';
import User from '../../models/userModel.js';
import { comparePassword } from '../../helpers/authHelper.js';

describe('Integration tests for Registration feature', () => {
    let mongoServer;

    // Use an in-memory MongoDB server for testing
    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    });

    beforeEach(() => {
    // 🕵️‍♂️ Spy on console.log
        consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {}); // prevent actual logs
    });

    // Clear the database after each test
    afterEach(async () => {
        await User.deleteMany({});
        consoleSpy.mockRestore();
    });

    // Stop the in-memory MongoDB server after all tests
    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    it("should register a new user successfully", async () => {
        const validUser = {
            name: "Test User",
            email: "testuser@gmail.com",
            password: "Test@1234",
            phone: "88776655",
            address: "123 Test St",
            DOB: "01/01/2000",
            answer: "Test Answer"
        };

        const res = await request(testApp)
            .post("/api/v1/auth/register")
            .send(validUser);

        const savedUser = await User.findOne({ email: validUser.email });
        const isPasswordMatch = await comparePassword(validUser.password, savedUser.password);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("User Registered Successfully");
        expect(res.body.user.email).toBe(validUser.email);

        expect(savedUser).not.toBeNull();
        expect(savedUser.email).toBe(validUser.email);
        expect(savedUser.password).not.toBe(validUser.password);

        expect(isPasswordMatch).toBe(true);
    });

    it("should not register a user with an existing email", async () => {
        const existingUser = {
            name: "Existing User",
            email: "existinguser@gmail.com",
            password: "Existing@1234",
            phone: "99887766",
            address: "456 Existing St",
            DOB: "02/02/2000",
            answer: "Existing Answer"
        };

        await User.create(existingUser);

        const res = await request(testApp)
            .post("/api/v1/auth/register")
            .send(existingUser);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("You have already registered with this email, please login");
    });

    it("should return validation error for missing fields", async () => {
        const validUser = {
            name: "Test User",
            email: "testuser@gmail.com",
            password: "Test@1234",
            phone: "88776655",
            address: "123 Test St",
            DOB: "01/01/2000",
            answer: "Test Answer"
        };

        const missingUsername = { ...validUser, name: "" };
        const missingEmail = { ...validUser, email: "" };
        const missingPassword = { ...validUser, password: "" };
        const missingPhone = { ...validUser, phone: "" };
        const missingAddress = { ...validUser, address: "" };
        const missingDOB = { ...validUser, DOB: "" };
        const missingAnswer = { ...validUser, answer: "" };

        const res1 = await request(testApp).post("/api/v1/auth/register").send(missingUsername);
        const res2 = await request(testApp).post("/api/v1/auth/register").send(missingEmail);
        const res3 = await request(testApp).post("/api/v1/auth/register").send(missingPassword);
        const res4 = await request(testApp).post("/api/v1/auth/register").send(missingPhone);
        const res5 = await request(testApp).post("/api/v1/auth/register").send(missingAddress);
        const res6 = await request(testApp).post("/api/v1/auth/register").send(missingDOB);
        const res7 = await request(testApp).post("/api/v1/auth/register").send(missingAnswer);

        expect(res1.status).toBe(400);
        expect(res1.body.success).toBe(false);
        expect(res1.body.message).toBe("Name is Required");

        expect(res2.status).toBe(400);
        expect(res2.body.success).toBe(false);
        expect(res2.body.message).toBe("Email is Required");

        expect(res3.status).toBe(400);
        expect(res3.body.success).toBe(false);
        expect(res3.body.message).toBe("Password is Required");

        expect(res4.status).toBe(400);
        expect(res4.body.success).toBe(false);
        expect(res4.body.message).toBe("Phone no is Required");

        expect(res5.status).toBe(400);
        expect(res5.body.success).toBe(false);
        expect(res5.body.message).toBe("Address is Required");

        expect(res6.status).toBe(400);
        expect(res6.body.success).toBe(false);
        expect(res6.body.message).toBe("DOB is Required");

        expect(res7.status).toBe(400);
        expect(res7.body.success).toBe(false);
        expect(res7.body.message).toBe("Answer is Required");
    });

    it("should return validation error for weak password", async () => {
        const weakPasswordUser = {
            name: "Weak Password User",
            email: "weakpassworduser@gmail.com",
            password: "123",
            phone: "88776655",
            address: "123 Weak St",
            DOB: "01/01/2000",
            answer: "Weak Answer"
        };

        const res = await request(testApp)
            .post("/api/v1/auth/register")
            .send(weakPasswordUser);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Password must be at least 6 characters long");
    });

    it("should validate the invalid email format", async () => {
        const invalidEmailUser = {
            name: "Test User",
            email: "invalidemail",
            password: "Test@1234",
            phone: "88776655",
            address: "123 Test St",
            DOB: "01/01/2000",
            answer: "Test Answer"
        }

        const res = await request(testApp)
            .post("/api/v1/auth/register")
            .send(invalidEmailUser);

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain("Invalid email");

        expect(consoleSpy.mock.calls[0][0].name).toBe("ValidationError");
    });

    it("should validate the invalid phone format", async () => {
        const invalidPhoneNoUser = {
            name: "Test User",
            email: "testuser@gmail.com",
            password: "Test@1234",
            phone: "123456789",
            address: "123 Test St",
            DOB: "01/01/2000",
            answer: "Test Answer"
        }

        const res = await request(testApp)
            .post("/api/v1/auth/register")
            .send(invalidPhoneNoUser);

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain("Invalid phone number: Must be a valid Singapore phone number");

        expect(consoleSpy.mock.calls[0][0].name).toBe("ValidationError");
    });

    it("should validate the invalid phone format", async () => {
        const invalidDOBUser = {
            name: "Test User",
            email: "testuser@gmail.com",
            password: "Test@1234",
            phone: "88776655",
            address: "123 Test St",
            DOB: "01/01/2030",
            answer: "Test Answer"
        }

        const res = await request(testApp)
            .post("/api/v1/auth/register")
            .send(invalidDOBUser);

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain("DOB must be between 1 day and 120 years old");

        expect(consoleSpy.mock.calls[0][0].name).toBe("ValidationError");
    });

    it("should handle other server errors", async () => {
        const validUser = {
            name: "Test User",
            email: "testuser@gmail.com",
            password: "Test@1234",
            phone: "88776655",
            address: "123 Test St",
            DOB: "01/01/2000",
            answer: "Test Answer"
        };

        const mockError = new Error();
        jest.spyOn(User.prototype, "save").mockImplementationOnce(() => {
            throw mockError;
        });

        const res = await request(testApp)
            .post("/api/v1/auth/register")
            .send(validUser);
        
        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Error in Registration");

        jest.restoreAllMocks();
    });
});
