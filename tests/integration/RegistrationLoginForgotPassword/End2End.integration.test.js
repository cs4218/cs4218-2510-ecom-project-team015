// Author: Ravi Kishore

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import testApp from '../serverSetup.js';
import User from '../../../models/userModel.js';
import { hashPassword, comparePassword } from '../../../helpers/authHelper.js';
import JWT from 'jsonwebtoken';

describe('Integration tests for AuthController', () => {
    let mongoServer;
    process.env.JWT_SECRET = 'test-secret-key';

    // Use an in-memory MongoDB server for testing
    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    });

    beforeEach(() => {
        consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    // Clear the database after each test
    afterEach(async () => {
        consoleSpy.mockRestore();
        jest.restoreAllMocks();
    });

    // Delete all users and stop the in-memory MongoDB server after all tests
    afterAll(async () => {
        await User.deleteMany({});
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    it('should allows users to register, change password and login with new password successfully', async () => {
        const newUser = {
            name: "Test User",
            email: "testuser@gmail.com",
            password: "Test@1234",
            phone: "88776655",
            address: "123 Test St",
            DOB: "01/01/2000",
            answer: "Test Answer"
        };

        const forgotPasswordUser = {
            email: "testuser@gmail.com",
            answer: "Test Answer",
            newPassword: "NewPass@1234"
        };

        const loginUser = {
            email: "testuser@gmail.com",
            password: "NewPass@1234"
        };

        const registrationResponse = await request(testApp)
            .post('/api/v1/auth/register')
            .send(newUser);

        const forgotPasswordResponse = await request(testApp)
            .post('/api/v1/auth/forgot-password')
            .send(forgotPasswordUser);

        const loginResponse = await request(testApp)
            .post('/api/v1/auth/login')
            .send(loginUser);

        expect(registrationResponse.status).toBe(201);
        expect(registrationResponse.body.success).toBe(true);
        expect(registrationResponse.body.message).toBe("User Registered Successfully");

        expect(forgotPasswordResponse.status).toBe(200);
        expect(forgotPasswordResponse.body.success).toBe(true);
        expect(forgotPasswordResponse.body.message).toBe("Password Reset Successfully");

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.success).toBe(true);
        expect(loginResponse.body.message).toBe("Login Successful");
    });
});



        

