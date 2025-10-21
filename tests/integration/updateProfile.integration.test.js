// Author: Adhitya
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import userModel from "../../models/userModel";
import testApp from "./serverSetup";

let mongoServer;
let testUserId;
let user;
// Some of the tests have been written with help of AI
const simulateFrontendRequest = async (updatedProfile) => {
  return await request(testApp)
    .put("/api/v1/auth/profile")
    .send(updatedProfile);
};

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

beforeEach(async() => {
  // Create test login user
  user = await userModel.create({
    name: "John",
    email: "john@example.com",
    password: "hashedPassword",
    phone: "91234567",
    address: "123 Street",
    DOB: new Date("2002-01-01"),
    answer: "test answer",
  });

  testUserId = user._id;
});

afterEach(async () => {
  await userModel.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("testing frontend interaction with updateProfileController and DB", () => {
  test("frontend successfully updates user profile when some fields are provided", async () => {
    const newUserData = {
      _id: testUserId,
      name: "Jane Doe",
      phone: "97898767",
      address: "New Address",
    };

    const response = await simulateFrontendRequest(newUserData);

    // console.log("Response to frontend:", response.body);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);

    // Verify DB changed
    const updatedUser = await userModel.findById(testUserId);
    expect(updatedUser.name).toBe(newUserData.name);
  });


  test("frontend fails to update user profile due to wrong new name", async() => {
    const newUserData = {
      _id: testUserId,
      name: "John 2",
    };
    const response = await simulateFrontendRequest(newUserData);

    // console.log("Response to frontend:", response.body);

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Name can contain only letters and spaces!");

    // Verify no change was made to db
    const updatedUser = await userModel.findById(testUserId);
    expect(updatedUser.name).toBe(user.name);
  });

  test("frontend fails to update user profile due to incorrect password", async() => {
    const newUserData = {
      _id: testUserId,
      password: "short",
    };
    const response = await simulateFrontendRequest(newUserData);

    // console.log("Response to frontend:", response.body);

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Password has to be longer than 6 characters!");

    // Verify no change was made to db
    const updatedUser = await userModel.findById(testUserId);
    expect(updatedUser.password).toBe(user.password);
  });

  test("frontend fails to update user profile due to incorrect phone number", async() => {
    const newUserData = {
      _id: testUserId,
      phone: "9898989"
    };
    const response = await simulateFrontendRequest(newUserData);

    // console.log("Response to frontend:", response.body);

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid Singapore phone number");

    // Verify no change was made to db
    const updatedUser = await userModel.findById(testUserId);
    expect(updatedUser.phone).toBe(user.phone);
  });

  test("frontend fails to update profile when some fields are invalid and some are valid", async () => {
    const newUserData = {
      _id: testUserId,
      name: "Jane",
      password:"Good password",
      phone: 123,
      address: "New Street"
    };

    const response = await simulateFrontendRequest(newUserData);

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);

    const updatedUser = await userModel.findById(testUserId);
    expect(updatedUser.name).toBe(user.name);
    expect(updatedUser.password).toBe(user.password);
    expect(updatedUser.phone).toBe(user.phone);
    expect(updatedUser.address).toBe(user.address);
  });
  
  test("Ignores unexpected fields sent", async () => {
    const newUserData = {
      _id: testUserId,
      name: "Jane",
      randomField: "unexpected"
    };

    const response = await simulateFrontendRequest(newUserData);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);

    const updatedUser = await userModel.findById(testUserId);
    expect(updatedUser.name).toBe(newUserData.name);
  });


  test("handles unexpected DB failure", async () => {
    jest.spyOn(userModel, "findByIdAndUpdate")
        .mockRejectedValue(new Error("DB error"));

    const newUserData = { _id: testUserId, name: "Jane" };
    const response = await simulateFrontendRequest(newUserData);

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/DB error/);

    jest.restoreAllMocks();
  });

  test("returns original user details if all fields empty", async () => {
    const newUserData = {
      _id: testUserId,
      name: "",
      phone: "",
      address: "",
      password: "",
    };

    const response = await simulateFrontendRequest(newUserData);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);

    const updatedUser = await userModel.findById(testUserId);
    expect(updatedUser.name).toBe(user.name);
    expect(updatedUser.phone).toBe(user.phone);
    expect(updatedUser.address).toBe(user.address);
    expect(updatedUser.password).toBe(user.password);
  })
});
