import { registerController } from "../controllers/authController.js";
import userModel from "../models/userModel.js";
import { hashPassword, comparePassword } from "../helpers/authHelper.js";

// Mock the database model and helper functions
jest.mock("../models/userModel.js");
jest.mock("../helpers/authHelper.js");

describe("registerController", () => {
    let req, res;

    // Mock req, res and reset them before each test case
    beforeEach(() => {
        req = { body: {} };
        res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
        jest.clearAllMocks();
    });

    it("should return error if name is missing", async () => {
        // The request body is empty to simulate missing name
        await registerController(req, res);

        // Check it returns the correct status and message 
        expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
    });

    it("should return error if email is missing", async () => {
        // The request body has name but missing email
        req.body = { name: "Test User" };

        await registerController(req, res);
        expect(res.send).toHaveBeenCalledWith({ message: "Email is Required" });
    });

    it("should return error if password is missing", async () => {    
        // The request body has name and email but missing password
        req.body = { name: "Test User", email: "test@gmail.com" };

        await registerController(req, res);
        expect(res.send).toHaveBeenCalledWith({ message: "Password is Required" });
    });

    it("should return error if phone number is missing", async () => {
        // The request body has name, email and password but missing phone number
        req.body = { name: "Test User", email: "test@gmail.com", password: "password1234" };

        await registerController(req, res);
        expect(res.send).toHaveBeenCalledWith({ message: "Phone no is Required" });
    });

    it("should return error if address is missing", async () => {
        // The request body has name, email, password and phone number but missing address
        req.body = { name: "Test User", email: "test@gmail.com", password: "password1234", phone: "12345678" };

        await registerController(req, res);
        expect(res.send).toHaveBeenCalledWith({ message: "Address is Required" });
    });

    it("should return error if answer is missing", async () => {
        // The request body has name, email, password, phone number and address but missing answer
        req.body = { name: "Test User", email: "test@gmail.com", password: "password1234", phone: "12345678", address: "123 Test Street" };

        await registerController(req, res);
        expect(res.send).toHaveBeenCalledWith({ message: "Answer is Required" });
    });

    it("should return error if user already exists", async () => {
        // The request body has all required fields
        req.body = { name: "Test User", email: "test@gmail.com", password: "password1234", phone: "12345678", address: "123 Test Street", answer: "test" };

        // Mock the userModel.findOne method to return a user
        userModel.findOne.mockResolvedValue({ email: "test@gmail.com" });

        await registerController(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "You have already registered with this email, please login" });
    });

    it("should register user successfully", async () => {
        // The request body has all required fields
        req.body = { name: "Test User", email: "test@gmail.com", password: "password1234", phone: "12345678", address: "123 Test Street", answer: "test" };

        // Mock the userModel.findOne method to return null
        userModel.findOne.mockResolvedValue(null);

        // Mock the hashPassword method to return a hashed password
        hashPassword.mockResolvedValue("hashedPassword");

        // Mock the userModel to create and save the user
        const fakeUser = { _id: "fakeUserId", ...req.body, password: "hashedPassword" }
        userModel.mockImplementation(() => ({ 
            save: jest.fn().mockResolvedValue(fakeUser),
        }));

        await registerController(req, res);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            message: "User Registered Successfully",
            user: fakeUser,
        }));
    });

    it("should catch the errors during registration", async () => {
        // The request body has all required fields
        req.body = { name: "Test User", email: "test@gmail.com", password: "password1234", phone: "12345678", address: "123 Test Street", answer: "test" };

        // Mock the userModel.findOne method to return a database error
        userModel.findOne.mockRejectedValue(new Error("Database error"));

        await registerController(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Error in Registration",
            error: expect.any(Error),
        }));
    });
});
