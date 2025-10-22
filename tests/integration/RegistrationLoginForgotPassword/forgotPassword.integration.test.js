// Author: Ravi Kishore

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import testApp from '../serverSetup.js';
import User from '../../../models/userModel.js';
import { hashPassword, comparePassword } from '../../../helpers/authHelper.js';

describe('Integration tests for Forgot Password feature', () => {
    let mongoServer;
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

    it('should allow existing users to reset their password using correct answer', async () => {
        const userData = {
            email: "testuser@gmail.com",
            answer: "Test Answer",
            newPassword: "NewPass@1234"
        }

        const res = await request(testApp)
            .post('/api/v1/auth/forgot-password')
            .send(userData);

        const updatedUser = await User.findOne({ email: userData.email });
        const isPasswordMatched = await comparePassword(userData.newPassword, updatedUser.password);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Password Reset Successfully");

        expect(isPasswordMatched).toBe(true);
    });

    it('should not allow password reset with incorrect email or answer', async () => {
        const wrongAnswerUserData = {
            email: "testuser@gmail.com",
            answer: "Wrong Answer",
            newPassword: "NewPass@1234"
        }
        const wrongEmailUserData = {
            email: "unregisteredmail@gmail.com",
            answer: "Test Answer",
            newPassword: "NewPass@1234"
        }
        
        const res1 = await request(testApp)
            .post('/api/v1/auth/forgot-password')
            .send(wrongAnswerUserData);
        
        const res2 = await request(testApp)
            .post('/api/v1/auth/forgot-password')
            .send(wrongEmailUserData);
        
        expect(res1.status).toBe(404);
        expect(res1.body.success).toBe(false);
        expect(res1.body.message).toBe("Wrong Email Or Answer");

        expect(res2.status).toBe(404);
        expect(res2.body.success).toBe(false);
        expect(res2.body.message).toBe("Wrong Email Or Answer");
    });

    it('should return validation error for missing fields', async () => {
        const missingEmailUser = {
            email: "",
            answer: "Test Answer",
            newPassword: "NewPass@1234"
        };
        const missingAnswerUser = {
            email: "testuser@gmail.com",
            answer: "",
            newPassword: "NewPass@1234"
        };
        const missingNewPasswordUser = {
            email: "testuser@gmail.com",
            answer: "Test Answer",
            newPassword: ""
        };

        const res1 = await request(testApp)
            .post('/api/v1/auth/forgot-password')
            .send(missingEmailUser);

        const res2 = await request(testApp)
            .post('/api/v1/auth/forgot-password')
            .send(missingAnswerUser);

        const res3 = await request(testApp)
            .post('/api/v1/auth/forgot-password')
            .send(missingNewPasswordUser);

        expect(res1.status).toBe(400);
        expect(res1.body.success).toBe(false);
        expect(res1.body.message).toBe("Email is required");

        expect(res2.status).toBe(400);
        expect(res2.body.success).toBe(false);
        expect(res2.body.message).toBe("Answer is required");

        expect(res3.status).toBe(400);
        expect(res3.body.success).toBe(false);
        expect(res3.body.message).toBe("New Password is required");
    });

    it('should return validation error for new password less than 6 characters', async () => {
        const shortPasswordUser = {
            email: "testuser@gmail.com",
            answer: "Test Answer",
            newPassword: "123"
        };

        const res = await request(testApp)
            .post('/api/v1/auth/forgot-password')
            .send(shortPasswordUser);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("New Password must be at least 6 characters long");
    });

    it('should handle server errors gracefully', async () => {
        const userData = {
            email: "testuser@gmail.com",
            answer: "Test Answer",
            newPassword: "NewPass@1234"
        };

        // Mock User.findOne to throw an error
        const findOneSpy = jest.spyOn(User, 'findOne').mockImplementation(() => {
            throw new Error('Database error');
        });

        const res = await request(testApp)
            .post('/api/v1/auth/forgot-password')
            .send(userData);

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Something went wrong, try again later");
        expect(res.body.error).toBeDefined();
        expect(consoleSpy.mock.calls[0][0].message).toBe('Database error');

        // Restore the original implementation
        findOneSpy.mockRestore();
    });
});
