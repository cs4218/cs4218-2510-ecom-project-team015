import { registerController, updateProfileController } from "../controllers/authController.js";
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


