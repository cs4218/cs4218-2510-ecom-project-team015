// Author: Ravi Kishore

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import testApp from '../serverSetup.js';
import User from '../../../models/userModel.js';
import { hashPassword } from '../../../helpers/authHelper.js';
import JWT from 'jsonwebtoken';

describe('Integration tests for Login feature', () => {
    let mongoServer;
    let consoleSpy;
    process.env.JWT_SECRET = 'test-secret-key';
    const savedUser = {
        name: "Test User",
        email: "testuser@gmail.com",
        password: "Test@1234",
        phone: "88776655",
        address: "123 Test St",
        DOB: "01/01/2000",
        answer: "Test Answer"
    };

    // Use an in-memory MongoDB server for testing
    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

        // First, register a user to test the login feature
        const hashedPassword = await hashPassword(savedUser.password);
        await User.create({ ...savedUser, password: hashedPassword });
    });

    beforeEach(() => {
        consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {}); // prevent actual logs
    });

    // Clear the database after each test
    afterEach(async () => {
        consoleSpy.mockRestore();
    });

    // Stop the in-memory MongoDB server after all tests
    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    it('should allow user with correct credentials to login successfully', async () => {
        const validUser = {
            email: "testuser@gmail.com",
            password: "Test@1234"
        };

        const res = await request(testApp)
            .post('/api/v1/auth/login')
            .send({ email: validUser.email, password: validUser.password });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Login Successful");
        expect(res.body.user._id).toBeDefined();
        expect(res.body.user.name).toBe(savedUser.name);
        expect(res.body.user.email).toBe(savedUser.email);
        expect(res.body.user.phone).toBe(savedUser.phone);
        expect(res.body.user.address).toBe(savedUser.address);
        expect(res.body.user.role).toBe(0);
    });

    it('should issue a valid JWT token upon successful login', async () => {
        const validUser = {
            email: "testuser@gmail.com",
            password: "Test@1234"
        };

        const res = await request(testApp)
            .post('/api/v1/auth/login')
            .send(validUser);

        const verfiedToken = JWT.verify(res.body.token, process.env.JWT_SECRET);

        expect(res.body.token).toBeDefined();
        expect(verfiedToken._id).toBeDefined();
    });

    it('should reject login attempt with for missing credentials', async () => {
        const invalidEmailUser = {
            email: "",
            password: "Test@1234"
        };
        const invalidPasswordUser = {
            email: "testuser@gmail.com",
            password: ""
        };

        const res1 = await request(testApp)
            .post('/api/v1/auth/login')
            .send(invalidEmailUser);     

        const res2 = await request(testApp)
            .post('/api/v1/auth/login')
            .send(invalidPasswordUser);

        expect(res1.status).toBe(404);
        expect(res1.body.success).toBe(false);
        expect(res1.body.message).toBe("Invalid email or password");

        expect(res2.status).toBe(404);
        expect(res2.body.success).toBe(false);
        expect(res2.body.message).toBe("Invalid email or password");
    });

    it('should reject login attempt with unregistered email', async () => {
        const unregisteredUser = {
            email: "unregistermail@gmail.com",
            password: "SomePassword@123"
        };

        const res = await request(testApp)
            .post('/api/v1/auth/login')
            .send(unregisteredUser);

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Email is not registerd");
    });

    it('should reject login attempt with incorrect password', async () => {
        const wrongPasswordUser = {
            email: "testuser@gmail.com",
            password: "WrongPassword@123"
        };  

        const res = await request(testApp)
            .post('/api/v1/auth/login')
            .send(wrongPasswordUser);

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Invalid Password");
    });

    it('should handle server errors gracefully during login', async () => {
        const validUser = {
            email: "testuser@gmail.com",
            password: "Test@1234"
        };

        // Mock User.findOne to throw an error
        jest.spyOn(User, 'findOne').mockImplementation(() => {
            throw new Error('Database error');
        });
        jest.spyOn(console, 'log').mockImplementation(() => {});

        const res = await request(testApp)
            .post('/api/v1/auth/login')
            .send(validUser);

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Login Error, please try again");
        expect(res.body.error).toBeDefined();
        expect(console.log.mock.calls[0][0].message).toBe('Database error');

        // Restore the original implementation
        User.findOne.mockRestore();
        console.log.mockRestore();
    });
});
