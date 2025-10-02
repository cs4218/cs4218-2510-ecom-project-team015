import { registerController, loginController, forgotPasswordController, testController } from "../controllers/authController.js";
import { updateProfileController, getOrdersController, getAllOrdersController, orderStatusController } from "../controllers/authController.js";
import userModel from "../models/userModel.js";
import { hashPassword, comparePassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";

// Mock the database model and helper functions
jest.mock("../models/userModel.js");
jest.mock("../helpers/authHelper.js");
jest.mock("jsonwebtoken");

// Test cases for Registration controller
describe("registerController", () => {
    let req, res;

    // Mock req, res and reset them before each test case
    beforeEach(() => {
        req = { body: {} };
        res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
        jest.clearAllMocks();
    });

    // Reset the mocks after each test case
    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should return error if name is missing", async () => {
        // The request body is empty to simulate missing name
        await registerController(req, res);

        // Check it returns the correct status and message 
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Name is Required" });
    });

    it("should return error if email is missing", async () => {
        // The request body has name but missing email
        req.body = { name: "Test User" };

        await registerController(req, res);

        // Check it returns the correct status and message
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Email is Required" });
    });

    it("should return error if password is missing", async () => {    
        // The request body has name and email but missing password
        req.body = { name: "Test User", email: "test@gmail.com" };

        await registerController(req, res);

        // Check it returns the correct status and message
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Password is Required" });
    });

    it("should return error if password is less than 6 characters", async () => {
        // The request body has name, email and password with less than 6 characters
        req.body = { name: "Test User", email: "test@gmail.com", password: "pass" };

        await registerController(req, res);

        // Check it returns the correct status and message
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Password must be at least 6 characters long" });
    });

    it("should return error if phone number is missing", async () => {
        // The request body has name, email and password but missing phone number
        req.body = { name: "Test User", email: "test@gmail.com", password: "password1234" };

        await registerController(req, res);

        // Check it returns the correct status and message
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Phone no is Required" });
    });

    it("should return error if address is missing", async () => {
        // The request body has name, email, password and phone number but missing address
        req.body = { name: "Test User", email: "test@gmail.com", password: "password1234", phone: "12345678" };

        await registerController(req, res);

        // Check it returns the correct status and message
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Address is Required" });
    });

    it("should return error if DOB is missing", async () => {
        // The request body has name, email, password and phone number but missing DOB
        req.body = { name: "Test User", email: "test@gmail.com", password: "password1234", phone: "12345678", address: "123 Test Street" };

        await registerController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "DOB is Required" });
    });

    it("should return error if answer is missing", async () => {
        // The request body has name, email, password, phone number and address but missing answer
        req.body = { name: "Test User", email: "test@gmail.com", password: "password1234", phone: "12345678", address: "123 Test Street", DOB: "01/01/2000" };

        await registerController(req, res);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Answer is Required" });
    });

    it("should return error if user already exists", async () => {
        // The request body has all required fields
        req.body = { name: "Test User", email: "test@gmail.com", password: "password1234", phone: "12345678", address: "123 Test Street", DOB: "01/01/2000", answer: "test" };

        // Mock the userModel.findOne method to return a user
        userModel.findOne.mockResolvedValue({ email: "test@gmail.com" });

        await registerController(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "You have already registered with this email, please login" });
    });

    it("should register user successfully", async () => {
        // The request body has all required fields
        req.body = { name: "Test User", email: "test@gmail.com", password: "password1234", phone: "12345678", address: "123 Test Street",DOB: "01/01/2000", answer: "test" };

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

    it("should catch validation errors during registration", async () => {
        // The request body has all required fields
        req.body = { name: "Test User", email: "invalidEmail", password: "password1234", phone: "12345678", address: "123 Test Street", DOB: "01/01/2000", answer: "test" };

        const validationError = {
            name: "ValidationError",
            errors: {
                email: { message: "Invalid email" }
            }
        };

        // Mock the userModel.findOne method to return validation error
        userModel.findOne.mockRejectedValue(validationError);

        await registerController(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Invalid email",
        }));
    });

    it("should catch the specifc errors during registration", async () => {
        // The request body has all required fields
        req.body = { name: "Test User", email: "test@gmail.com", password: "password1234", phone: "12345678", address: "123 Test Street", DOB: "01/01/2000", answer: "test" };

        const hashError = new Error("Password hashing failed");

        // Mock the hashPassword method to throw an error
        hashPassword.mockImplementation(() => { throw hashError; });

        await registerController(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Password hashing failed",
        }));
    });

    it("should return default error message if error has no message during registration", async () => {
        // The request body has all required fields
        req.body = { name: "Test User", email: "test@gmail.com", password: "password1234", phone: "12345678", address: "123 Test Street", DOB: "01/01/2000", answer: "test" };

        const unknownError = new Error();

        // Mock throwing an unknown error
        hashPassword.mockImplementation(() => { throw unknownError; });

        await registerController(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Error in Registration",
        }));
    });
});


// Test cases for Login controller
describe("loginController", () => {
    let req, res;

    // Mock req, res and reset them before each test case
    beforeEach(() => {
        req = { body: {} };
        res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
        jest.clearAllMocks();
    });

    it("should return error if email is missing", async () => {
        // The request body is empty to simulate missing email
        await loginController(req, res);

        // Check it returns the correct status and message
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Invalid email or password" });
    });

    it("should return error if password is missing", async () => {
        // The request body has email but missing password
        req.body = { email: "test@gmail.com" };

        await loginController(req, res);

        // Check it returns the correct status and message
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Invalid email or password" });
    });

    it("should return error if user does not exist", async () => {
        // The request body has wrong email and password
        req.body = { email: "test@gmail.com", password: "password1234" };

        // Mock the userModel.findOne method to return null
        userModel.findOne.mockResolvedValue(null);

        await loginController(req, res);

        // Check it returns the correct status and message
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Email is not registerd" });
    });

    it("should return error if password does not match", async () => {
        // The request body has corect email and wrong password
        req.body = { email: "test@gmail.com", password: "password1234" };

        // Mock the userModel.findOne method to return a user
        userModel.findOne.mockResolvedValue({ email: "test@gmail.com", password: "hashedPassword" });
        
        // Mock the comparePassword method to return false
        comparePassword.mockResolvedValue(false);

        await loginController(req, res);    

        // Check it returns the correct status and message
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Invalid Password" });
    });

    it("should login user successfully when the credentials are valid", async () => {
        // The request body has correct email and password
        req.body = { email: "test@gmail.com", password: "password1234" };

        // Mock the userModel.findOne method to return a user
        const fakeUser = { _id: "fakeUserId", name: "Test User", email: "test@gmail.com", password: "hashedPassword", phone: "12345678", address: "123 Test Street", role: "0" };
        userModel.findOne.mockResolvedValue(fakeUser);

        // Mock the comparePassword method to return true
        comparePassword.mockResolvedValue(true);

        // Mock JWT sign method to return a fake token and make sure it's called with correct parameters
        JWT.sign.mockReturnValue("fakeToken");

        await loginController(req, res);

        // Check it returns the correct status and message
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Login Successful",
            user: {
                _id: fakeUser._id,
                name: fakeUser.name,
                email: fakeUser.email,  
                phone: fakeUser.phone,                
                address: fakeUser.address,
                role: fakeUser.role,
            },
            token: "fakeToken",
        });
    });

    it("should handle the errors during login", async () => {
        // The request body has correct email and password
        req.body = { email: "test@gmail.com", password: "password1234" };

        // Mock the userModel.findOne method to return a database error
        userModel.findOne.mockRejectedValue(new Error("Database error"));

        await loginController(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Login Error, please try again",
            error: expect.any(Error),
        }));
    });
    
    it("should catch specific errors during login", async () => {
        // The request body has correct email and password
        req.body = { email: "test@gmail.com", password: "password1234" };

        // Mock the userModel.findOne method to return a user
        const fakeUser = { _id: "fakeUserId", name: "Test User", email: "test@gmail.com", password: "hashedPassword", phone: "12345678", address: "123 Test Street", role: "0" };
        userModel.findOne.mockResolvedValue(fakeUser);

        // Mock the comparePassword method to return true
        comparePassword.mockResolvedValue(true);

        // Mock JWT sign method to throw an error
        JWT.sign.mockImplementation(() => {
            throw new Error("Token generation error");
        });

        await loginController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Login Error, please try again",
            error: expect.objectContaining({ message: "Token generation error" }),
        }));
    });
});

// Test cases for Forgot Password controller
describe("forgotPasswordController", () => {
    let req, res;

    // Mock req, res and reset them before each test case
    beforeEach(() => {
        req = { body: {} };
        res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
        jest.clearAllMocks();
    });

    it("should return error if email is missing", async () => {
        // The request body is empty to simulate missing email
        await forgotPasswordController(req, res);

        // Check it returns the correct status and message
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Email is required" });
    });

    it("should return error if answer is missing", async () => {
        // The request body has email but missing answer
        req.body = { email: "test@gmail.com" };

        await forgotPasswordController(req, res);

        // Check it returns the correct status and message
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Answer is required" });
    });

    it("should return error if new password is missing", async () => {
        // The request body has email and answer but missing new password
        req.body = { email: "test@gmail.com", answer: "test answer" };

        await forgotPasswordController(req, res);

        // Check it returns the correct status and message
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "New Password is required" });
    });

    it("should return error if user with given email and answer does not exist", async () => {
        // The request body has email, answer and new password
        req.body = { email: "test@gmail.com", answer: "test answer", newPassword: "password1234" };

        // Mock the userModel.findOne method to return null
        userModel.findOne.mockResolvedValue(null);

        await forgotPasswordController(req, res);    

        // Check it returns the correct status and message
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Wrong Email Or Answer" });
    });

    it("should reset password successfully when the credentials are valid", async () => {
        // The request body has email, answer and new password
        req.body = { email: "test@gmail.com", answer: "test answer", newPassword: "password1234" };

        // Mock the userModel.findOne method to return a user
        const fakeUser = { _id: "fakeUserId", name: "Test User", email: "test@gmail.com", password: "hashedPassword", phone: "12345678", address: "123 Test Street", role: "0" };
        userModel.findOne.mockResolvedValue(fakeUser);

        // Mock the hashPassword method to return a hashed password
        hashPassword.mockResolvedValue("hashedPassword");

        await forgotPasswordController(req, res);

        // Check it returns the correct status and message
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({ success: true, message: "Password Reset Successfully" });
    });

    it("should catch the errors during password reset", async () => {
        // The request body has email, answer and new password
        req.body = { email: "test@gmail.com", answer: "test answer", newPassword: "password1234" };

        // Mock the hashPassword method to throw an error
        hashPassword.mockImplementation(() => { throw new Error("Hashing failed"); });

        await forgotPasswordController(req, res);    

        // Check it returns the correct status and message        
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Something went wrong, try again later",
            error: expect.any(Error),
        }));
    });
});

// Test cases for Test controller
describe("testController", () => {
    let req, res;

    // Mock req, res and reset them before each test case
    beforeEach(() => {
        req = {};
        res = { send: jest.fn() };
        jest.clearAllMocks();
    });

    it("should return protected routes successfully", async () => {
        testController(req, res);

        // Check it returns the responce with correct message
        expect(res.send).toHaveBeenCalledWith("Protected Routes");
    });

    it("should catch the errors during testController", async () => {
        // Mock res.send to throw an error
        res.send = jest.fn()
        .mockImplementationOnce(() => { throw new Error("Test Error"); })    // Firct call throws error to enter catch block
        .mockImplementation(() => {});                                  // Second call sends response

        testController(req, res);    

        // Check it returns error      
        expect(res.send).toHaveBeenCalledWith({ error: expect.any(Error) });
    });
});

// Test cases for Update Profile controller
// Test cases for Get Orders controller
// Test cases for Get All Orders controller
// Test cases for Order Status controller