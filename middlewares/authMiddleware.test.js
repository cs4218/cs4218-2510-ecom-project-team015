import { requireSignIn, isAdmin } from "./authMiddleware.js";
import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

// Mock dpendencies
jest.mock("jsonwebtoken");
jest.mock("../models/userModel.js");

describe("Auth Middleware", () => {
    let req, res, next;

    // Mock req, res, next and reset them before each test case
    beforeEach(() => { 
        req = { headers: {authorization: "mockToken"},
                user: null, };
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    // Tests for requireSignIn middleware
    describe("requireSignIn", () => {
        it("should decode token and call next on success", async () => {
            const mockDecoded = { _id: "mockUserId", role: 1 };
            JWT.verify.mockReturnValue(mockDecoded);

            await requireSignIn(req, res, next);

            expect(JWT.verify).toHaveBeenCalledWith("mockToken", process.env.JWT_SECRET);
            expect(req.user).toEqual(mockDecoded);
            expect(next).toHaveBeenCalled();
        });

        it("should log error if token verification fails", async () => {
            const mockError = new Error("Invalid token");
            JWT.verify.mockImplementation(() => {
                throw mockError;
            });

            await requireSignIn(req, res, next);

            expect(JWT.verify).toHaveBeenCalled();
            expect(req.user).toBeNull();
            expect(next).not.toHaveBeenCalled();
        });
    });

    // Tests for isAdmin middleware
    describe("isAdmin", () => {
        it("should call next if user is admin", async () => {
            req.user = { _id: "mockAdminUserId" };
            const mockUser = { role: 1 };
            userModel.findById.mockResolvedValue(mockUser);

            await isAdmin(req, res, next);

            expect(userModel.findById).toHaveBeenCalledWith("mockAdminUserId");
            expect(next).toHaveBeenCalled();
        });

        it("should return 401 and unauthorized message if user is not admin", async () => {
            req.user = { _id: "mockUserId" };
            const mockUser = { role: 0 };
            userModel.findById.mockResolvedValue(mockUser);

            await isAdmin(req, res, next);       

            expect(userModel.findById).toHaveBeenCalledWith("mockUserId");
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({ 
                    success: false, 
                    message: "UnAuthorized Access" });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 401 and error message if an error occurs", async () => {
            req.user = { _id: "mockUserId" };
            const mockError = new Error("Unexpected error occurred");
            userModel.findById.mockRejectedValue(mockError);

            await isAdmin(req, res, next);

            expect(userModel.findById).toHaveBeenCalledWith("mockUserId");
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({ 
                    success: false, 
                    error: mockError, 
                    message: "Error in admin middleware" });
            expect(next).not.toHaveBeenCalled();
        });
    });
});