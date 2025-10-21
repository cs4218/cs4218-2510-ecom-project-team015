// Author: Ravi Kishore

import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import JWT from "jsonwebtoken";
import userModel from "../../../models/userModel.js";
import { hashPassword } from '../../../helpers/authHelper.js';
import testApp from "../serverSetup.js";

describe("Auth Middleware Integration Tests", () => {
    let mongoServer;
    let consoleSpy;
    let adminToken;
    let userToken;
    let adminUser;
    let normalUser;
    process.env.JWT_SECRET = 'test-secret-key';


    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    });

    beforeEach(async () => {
        consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        await userModel.deleteMany({});
        const adminUserData = {
            name: "Admin",
            email: "admin@gmail.com",
            password: "admin123",
            phone: "88776655",
            address: "Admin Street",
            DOB: "01/01/2000",
            answer: "Admin Answer",
            role: 1
        };
        const normalUserData= {
            name: "Normal User",
            email: "normaluser@gmail.com",
            password: "normalUser123",
            phone: "88776644",
            address: "Normal Street",
            DOB: "01/01/2000",
            answer: "Normal Answer",
            role: 0
        };

        // Create Admin and Normal User
        const hashedPasswordAdmin = await hashPassword(adminUserData.password);
        const hashedPasswordNormal = await hashPassword(normalUserData.password);

        adminUser = await userModel.create({...adminUserData, password: hashedPasswordAdmin });
        normalUser = await userModel.create({...normalUserData, password: hashedPasswordNormal });

        // Manually generate valid JWTs to simulate that the users have logged in
        adminToken = JWT.sign({ _id: adminUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        userToken = JWT.sign({ _id: normalUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    });

    afterEach(async () => {

        consoleSpy.mockRestore();         
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    describe("requireSignIn Middleware", () => {
        it("should allow access to /user-auth with valid user token", async () => {
            const res = await request(testApp)
                .get("/user-auth")
                .set("Authorization", userToken);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("User access granted");
            expect(res.body.user._id).toBeDefined();
            expect(res.body.user._id).toBe(normalUser._id.toString());
        });

        it("should block access to /user-auth with expired token", async () => {
            const setTokenexpiry = JWT.sign({ _id: normalUser._id }, process.env.JWT_SECRET, { expiresIn: '1ms' });
            await new Promise(res => setTimeout(res, 5));

            const res = await request(testApp)
                .get("/user-auth")
                .set("Authorization", setTokenexpiry);

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Invalid token");
            expect(consoleSpy).toHaveBeenCalled(); 
        });

        it("should block access to /user-auth with invalid token", async () => {
            const res = await request(testApp)
                .get("/user-auth")
                .set("Authorization", "invalidToken");

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Invalid token");
            expect(consoleSpy).toHaveBeenCalled();
        });

        it("should block access to /user-auth with no token", async () => {
            const res = await request(testApp)
                .get("/user-auth");

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Invalid token");
            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe("isAdmin Middleware", () => {
        it("should allow access to /admin-auth for admin users", async () => {
            const res = await request(testApp)
                .get("/admin-auth")
                .set("Authorization", adminToken);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Admin access granted");
            expect(res.body.user._id).toBeDefined();
            expect(res.body.user._id).toBe(adminUser._id.toString());
        });

        it("should block access to /admin-auth for non-admin users", async () => {
            const res = await request(testApp)
                .get("/admin-auth")
                .set("Authorization", userToken);

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("UnAuthorized Access");
        });

        it("should handle errors", async () => {
            const findByIdSpy = jest.spyOn(userModel, "findById").mockRejectedValue(new Error());

            const res = await request(testApp)
                .get("/admin-auth")
                .set("Authorization", adminToken);

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Error in admin middleware");

            findByIdSpy.mockRestore();
        });
    });

});
