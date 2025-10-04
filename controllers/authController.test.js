import { registerController, loginController, forgotPasswordController, testController } from "../controllers/authController.js";
import { updateProfileController, getOrdersController, getAllOrdersController, orderStatusController } from "../controllers/authController.js";
import userModel from "../models/userModel.js";
import { hashPassword, comparePassword } from "../helpers/authHelper.js";
import orderModel from "../models/orderModel.js";
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

    it("should return error if user with given email does not exist", async () => {
        // The request body has email, answer and new password
        req.body = { email: "test@gmail.com", answer: "test answer", newPassword: "pass" };

        await forgotPasswordController(req, res);

        // Check it returns the correct status and message
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "New Password must be at least 6 characters long" });
    })

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
describe("testing updateProfileController", () => {
    let req, res;

    beforeEach(() => {
        req = {body: {}};   //req object has empty body
        res = {
            status: jest.fn().mockReturnThis(), //status fn is mocked to return mocked res object
            send: jest.fn() //mock the send fn
        };
        jest.clearAllMocks();
    })
    //This test was generated with help of ChatGPT
    it("should throw error for invalid name", async () => {
        req.body = { name: "john2", password: "password1234", address: "abcd", phone: "87872323" }; //new user details in req
        req.user = {_id: "randomUserId" };
        userModel.findById.mockResolvedValue({ name: "john", password: "password1234", address: "abcd", phone: "87872323"});    //old user details
        await updateProfileController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);    //client-side error
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Name can contain only letters and spaces!"
        }));
        expect(hashPassword).not.toHaveBeenCalled();    //error should be thrown from if, password should not be hashed
        expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();     //no update should have taken place.
    });
    
    it("should throw error for invalid password", async() => {
        req.body = { name: "john", password: "12345", address: "abcd", phone: "87872323" };   //password is only 5 chars long
        req.user = {_id: "randomUserId"};
        userModel.findById.mockResolvedValue({ name: "john", password: "password1234", address: "abcd", phone: "87872323"});    //old user details
        await updateProfileController(req, res);
        expect(res.status).toHaveBeenCalledWith(400); //client-side error
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Password has to be longer than 6 characters!"
        }));
        expect(hashPassword).not.toHaveBeenCalled();    //error should be thrown from if, password should not be hashed
        expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();     //no update should have taken place.
    })

    it("should throw error for invalid starting phone number", async() => {
        //arrange
        req.body = {name: "john", password: "password12345", phone: "56738902", address: "abcd"};
        req.user = {_id: "someRandomUser"};
        userModel.findById.mockResolvedValue({ name: "john", password: "password1234", address: "abcd", phone: "87872323"});

        //act
        await updateProfileController(req, res);

        //assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Invalid Singapore phone number"
        }));
        expect(hashPassword).not.toHaveBeenCalled();
        expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    })
    
    it("should throw error for invalid country code phone number", async() => {
        //arrange
        req.body = {name: "john", password: "password12345", phone: "+6666738902", address: "abcd"};
        req.user = {_id: "someRandomUser"};
        userModel.findById.mockResolvedValue({ name: "john", password: "password1234", address: "abcd", phone: "87872323"});

        //act
        await updateProfileController(req, res);

        //assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Invalid Singapore phone number"
        }));
        expect(hashPassword).not.toHaveBeenCalled();
        expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    })
        
    it("should throw error for invalid number of phone digits", async() => {
        //arrange
        req.body = {name: "john", password: "password12345", phone: "6857984", address: "abcd"};    //7 digits only
        req.user = {_id: "someRandomUser"};
        userModel.findById.mockResolvedValue({ name: "john", password: "password1234", address: "abcd", phone: "87872323"});

        //act
        await updateProfileController(req, res);

        //assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Invalid Singapore phone number"
        }));
        expect(hashPassword).not.toHaveBeenCalled();
        expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    })

    it("should update profile with original fields if update fields are empty", async() => {
        //arrange
        req.user = {_id: 'someRandomId'};
        const oldUserDetails = {
            name: "john",
            password: "password1234",
            address: "abcd",
            phone: "87872323"
        };
        userModel.findById.mockResolvedValue(oldUserDetails);
        //Code generated by ChatGPT
        userModel.findByIdAndUpdate.mockImplementation((id, updates) =>
            Promise.resolve(updates)
        );

        //act
        await updateProfileController(req, res);

        //assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            message: "Profile Updated Successfully",
            updatedUser: oldUserDetails
        }));
        expect(hashPassword).not.toHaveBeenCalled();
    });

    it("should update profile with new correct fields", async() => {
        //arrange
        req.body = {name: "jason", password: "password@123", phone: "87874534", address: "acbd"};
        req.user = {_id: "someRandomUserId"};
        userModel.findById.mockResolvedValue({ name: "john", password: "password1234", address: "abcd", phone: "87872323"});
        userModel.findByIdAndUpdate.mockImplementation((id, updates) =>
            Promise.resolve(updates)
        );
        hashPassword.mockResolvedValue("hashedPasswordValue");

        //act
        await updateProfileController(req, res);

        //assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            message: "Profile Updated Successfully",
            updatedUser: {
                name: req.body.name,
                password: "hashedPasswordValue",
                phone: req.body.phone,
                address: req.body.address
            }
        }));
        expect(hashPassword).toHaveBeenCalled();
    })
});

// Test cases for Get Orders controller
describe("When testing getOrdersController", () => {
    let req, res;
    beforeEach(() => {
        req = {
            user: {_id: "userId"},
            body: {}};
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            json: jest.fn(),
        }
        jest.clearAllMocks();
    })

    it("should return a json object populated when buyer and products exist", async() => {
        const mockedOrder = {
            _id: "orderId",   //order object id sample
            buyer: {_id: "userId", name: "mockedUser"}, 
            products: [{
                _id: "prodId",    //product object id sample
                name: "Jacket",
                slug: "jacket",
                description: "nice jacket",
                price: 12,
                category: "catId",
                quantity: 5,
            }],
            payment: {},
            status: "Not Processed"
        };

        
        const mockPopulate = jest.fn().mockReturnThis();
        // This chaining process was done with the help of ChatGPT
        const fakeQuery = {
            populate: mockPopulate,
            then: (resolve) => resolve(mockedOrder),
        };
        orderModel.find = jest.fn(() => fakeQuery);

        //act
        await getOrdersController(req, res);

        //assert
        expect(orderModel.find).toHaveBeenCalledWith({buyer: "userId"});
        expect(mockPopulate).toHaveBeenCalledWith("products", "-photo");
        expect(mockPopulate).toHaveBeenCalledWith("buyer", "name");
        expect(res.json).toHaveBeenCalledWith(mockedOrder);
    });

    it("should throw error 500 with message when there is an issue with getOrdersController", async () => {
        orderModel.find = jest.fn().mockImplementation(() => { 
            throw new Error("Server error");
        });
        consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        await getOrdersController(req, res);

        expect(orderModel.find).toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenLastCalledWith(new Error("Server error"));
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "Error while fetching orders",
        }));
    });
});

// Test cases for Get All Orders controller
describe("When testing getAllOrdersController", () => {
    let req, res;
    beforeEach(() => {
        req = {
            user:{_id: "mockedUser"},
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            json: jest.fn(),
        }
        jest.clearAllMocks();
    });

     it("should return a json object populated when buyer and products exist", async() => {
        const mockedOrder1 = {
            _id: "orderId1",   //order object id sample
            buyer: {_id: "userId", name: "mockedUser"}, 
            products: [{
                _id: "prodId",    //product object id sample
                name: "Jacket",
                slug: "jacket",
                description: "nice jacket",
                price: 12,
                category: "catId",
                quantity: 5,
            }],
            payment: {},
            status: "Not Processed",
            createdAt: 'time1'
        };

        const mockedOrder2 = {
            _id: "orderId2",
            buyer: {_id: "userId2", name: "anotherMockedUser"},
            products: [{
                _id: "prodId2",    //product object id sample
                name: "Pant",
                slug: "pant",
                description: "jeans pant",
                price: 112,
                category: "catId",
                quantity: 7,
            }],
            payment: {},
            status: "Not Processed",
            createdAt: "time2"
        };
        
        const mockPopulate = jest.fn().mockReturnThis();
        const mockSort = jest.fn().mockReturnThis();
        const fakeQuery = {
            populate: mockPopulate,
            sort: mockSort,
            then: (resolve) => resolve([
                mockedOrder1,
                mockedOrder2
            ]),
        };
        orderModel.find = jest.fn(() => fakeQuery);

        //act
        await getAllOrdersController(req, res);

        //assert
        expect(orderModel.find).toHaveBeenCalledWith({});
        expect(mockPopulate).toHaveBeenCalledWith("products", "-photo");
        expect(mockPopulate).toHaveBeenCalledWith("buyer", "name");
        expect(mockSort).toHaveBeenCalledWith({
            createdAt: -1
        });
        expect(res.json).toHaveBeenCalledWith([
            mockedOrder1,
            mockedOrder2
        ]);
    });

    it("should return error 500 response when there is an error in fetching all orders", async() => {
        orderModel.find = jest.fn().mockImplementation(() => {
            throw new Error("Server error");
        })
        consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

        await getAllOrdersController(req, res);
        
        expect(res.json).not.toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenLastCalledWith(new Error("Server error"));
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining(
            {
                success: false,
                message: "Error while fetching orders",
            }
        ));
    });
});

// Test cases for Order Status controller
describe("When testing orderStatusController", () => {
    let req, res;
    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            json: jest.fn(),
        };
    });

    it("should return back order with updated status if changed successfully", async() => {
        req.params = {
            orderId: "orderId123"
        };

        req.body = {
            status: "Processed"
        };
        const order = {
            _id: "orderId123",
            buyer: {_id: "userId2", name: "anotherMockedUser"},
            products: [{
                _id: "prodId2",    //product object id sample
                name: "Pant",
                slug: "pant",
                description: "jeans pant",
                price: 112,
                category: "catId",
                quantity: 7,
            }],
            payment: {},
            status: "Not Processed",
            createdAt: "time2"
        };
        
        orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue(order);
    
        await orderStatusController(req, res);

        expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
            req.params.orderId, 
            {status: req.body.status},
            {new: true}
        );
        expect(res.json).toHaveBeenCalledWith(order);
    });

    it("should return error 500 status if there was an error in finding order and updating", async() => {
        req.params = {
            orderId: "orderId123"
        };

        req.body = {
            status: "Not Processed"
        };
        const order = {
            _id: "orderId123",
            buyer: {_id: "userId2", name: "anotherMockedUser"},
            products: [{
                _id: "prodId2",    //product object id sample
                name: "Pant",
                slug: "pant",
                description: "jeans pant",
                price: 112,
                category: "catId",
                quantity: 7,
            }],
            payment: {},
            status: "Not Processed",
            createdAt: "time2"
        };

        orderModel.findByIdAndUpdate = jest.fn().mockImplementation(() => {
            throw new Error("Error when updating status");
        })
        consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

        await orderStatusController(req, res);

        expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
            req.params.orderId,
            {status: req.body.status},
            {new: true}
        );

        expect(res.json).not.toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(new Error("Error when updating status"));
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining(
            {
                success: false,
                message: "Error while fetching orders",
            }
        ));
    })
});