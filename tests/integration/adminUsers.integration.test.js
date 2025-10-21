// This test seeks to check integration of user registration with getting all users (by admin in the users.js)
// Author: Adhitya
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import userModel from "../../models/userModel";
import testApp from "./serverSetup";

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

describe("Validate response received from backend when user is admin and sends req to getAllUsersController through frontend", () => {
    test("frontend receives the correct response", async () => {
        //arrange
        const adminUser = await userModel.create({
            name: "admin",
            email: "john@example.com",
            password: "hashedPassword",
            phone: "91234567",
            address: "123 Street",
            DOB: new Date("2002-01-01"),
            answer: "test answer",
            role: 1
        });

        //act
        const response = await request(testApp).get("/api/v1/auth/all-users");

        //assert
        expect(response.statusCode).toBe(200);
        expect(response.body[0].name).toBe(adminUser.name);
        expect(response.body[0].email).toBe(adminUser.email);
        expect(response.body[0].password).toBe(adminUser.password);
        expect(response.body[0].phone).toBe(adminUser.phone);
        expect(response.body[0].address).toBe(adminUser.address);
        expect(new Date(response.body[0].DOB)).toEqual(new Date(adminUser.DOB));
        expect(response.body[0].answer).toBe(adminUser.answer);
        expect(response.body[0].role).toBe(adminUser.role);
    });

    test("does not throw error even if db is empty", async () => {
        const response = await request(testApp).get("/api/v1/auth/all-users");
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
    });

    test("returns error 500 if database call fails", async () => {
        // Arrange
        jest.spyOn(userModel, "find").mockImplementationOnce(() => {
          throw new Error("Database failure");
        });

        // Act
        const response = await request(testApp).get("/api/v1/auth/all-users");

        // Assert
        expect(response.statusCode).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Error while fetching users");
        expect(response.body.error).toBeDefined();

        userModel.find.mockRestore();
    });

    // Generated with AI
    test("handles malformed user data gracefully", async () => {
      jest.spyOn(userModel, "find").mockResolvedValueOnce([{ name: null, email: 12345 }]);

      const response = await request(testApp).get("/api/v1/auth/all-users");
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      userModel.find.mockRestore();
    });

    test("returns 500 if database connection is lost", async () => {
      await mongoose.disconnect(); // simulate failure
      const response = await request(testApp).get("/api/v1/auth/all-users");

      expect(response.statusCode).toBe(500);
      await mongoose.connect(mongoServer.getUri());
    });

});