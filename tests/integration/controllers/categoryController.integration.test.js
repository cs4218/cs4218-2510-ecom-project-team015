// Author: Vedant Sinha
// This file has been written with the help of ChatGPT.

import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import JWT from "jsonwebtoken";

import categoryRoutes from "../../../routes/categoryRoutes.js";
import userModel from "../../../models/userModel.js";
import categoryModel from "../../../models/categoryModel.js";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/category", categoryRoutes);
  return app;
}

let mongo, app;
let admin, user, adminToken, userToken;

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = buildApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();

  admin = await userModel.create({
    name: "Admin",
    email: "admin@example.com",
    password: "hashed",
    phone: "91234567",
    address: "1 Admin Way",
    answer: "x",
    DOB: new Date("1990-01-01"),
    role: 1,
  });
  user = await userModel.create({
    name: "User",
    email: "user@example.com",
    password: "hashed",
    phone: "92345678",
    address: "2 User Road",
    answer: "y",
    DOB: new Date("1995-05-05"),
    role: 0,
  });

  adminToken = JWT.sign({ _id: admin._id }, process.env.JWT_SECRET);
  userToken = JWT.sign({ _id: user._id }, process.env.JWT_SECRET);
});

describe("Category - Happy Paths", () => {
  test("admin can create, list, get single, update and delete category", async () => {
    // Create
    const createRes = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", adminToken)
      .send({ name: "Electronics" });
    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.category.slug).toBe("electronics");

    const catId = createRes.body.category._id;
    const catSlug = createRes.body.category.slug;

    // List
    const listRes = await request(app)
      .get("/api/v1/category/get-category")
      .expect(200);
    expect(listRes.body.success).toBe(true);
    expect(Array.isArray(listRes.body.category)).toBe(true);
    expect(listRes.body.category.find(c => c._id === catId)).toBeTruthy();

    // Get single by slug
    const singleRes = await request(app)
      .get(`/api/v1/category/single-category/${catSlug}`)
      .expect(200);
    expect(singleRes.body.success).toBe(true);
    expect(singleRes.body.category.name).toBe("Electronics");

    // Update name
    const updateRes = await request(app)
      .put(`/api/v1/category/update-category/${catId}`)
      .set("Authorization", adminToken)
      .send({ name: "Gadgets" });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.category.name).toBe("Gadgets");
    expect(updateRes.body.category.slug).toBe("gadgets");

    // Delete
    const delRes = await request(app)
      .delete(`/api/v1/category/delete-category/${catId}`)
      .set("Authorization", adminToken);
    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    const afterDel = await request(app)
      .get("/api/v1/category/get-category")
      .expect(200);
    expect(afterDel.body.category.find(c => c._id === catId)).toBeFalsy();
  });
});

describe("Category - AuthZ", () => {
  test("protected endpoints require token", async () => {
    await request(app)
      .post("/api/v1/category/create-category")
      .send({ name: "Books" })
      .expect(401);

    const c = await categoryModel.create({ name: "Toys", slug: "toys" });
    await request(app)
      .put(`/api/v1/category/update-category/${c._id}`)
      .send({ name: "Kids" })
      .expect(401);

    await request(app)
      .delete(`/api/v1/category/delete-category/${c._id}`)
      .expect(401);
  });

  test("non-admin cannot create/update/delete", async () => {
    const create = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", userToken)
      .send({ name: "Books" });
    expect(create.status).toBe(401);

    const c = await categoryModel.create({ name: "Toys", slug: "toys" });

    const upd = await request(app)
      .put(`/api/v1/category/update-category/${c._id}`)
      .set("Authorization", userToken)
      .send({ name: "Kids" });
    expect(upd.status).toBe(401);

    const del = await request(app)
      .delete(`/api/v1/category/delete-category/${c._id}`)
      .set("Authorization", userToken);
    expect(del.status).toBe(401);
  });
});

describe("Category - Validation and Errors", () => {
  test("create requires name; duplicate name rejected", async () => {
    // Missing name
    const bad = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", adminToken)
      .send({});
    expect(bad.status).toBe(400);
    expect(bad.body.message).toMatch(/name is required/i);

    // Duplicate
    await categoryModel.create({ name: "Books", slug: "books" });
    const dup = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", adminToken)
      .send({ name: "Books" });
    expect(dup.status).toBe(409);
    expect(dup.body.message).toMatch(/already exists/i);
  });

  test("update requires non-empty name; changing to existing name rejected; 404 on missing id", async () => {
    const a = await categoryModel.create({ name: "Books", slug: "books" });
    const b = await categoryModel.create({ name: "Games", slug: "games" });

    // Empty name
    const empty = await request(app)
      .put(`/api/v1/category/update-category/${a._id}`)
      .set("Authorization", adminToken)
      .send({ name: "  " });
    expect(empty.status).toBe(400);
    expect(empty.body.message).toMatch(/name is required/i);

    // Duplicate to existing (case-insensitive in controller)
    const dup = await request(app)
      .put(`/api/v1/category/update-category/${a._id}`)
      .set("Authorization", adminToken)
      .send({ name: "games" });
    expect(dup.status).toBe(409);

    // Non-existent id
    const missing = await request(app)
      .put(`/api/v1/category/update-category/${new mongoose.Types.ObjectId()}`)
      .set("Authorization", adminToken)
      .send({ name: "New" });
    expect(missing.status).toBe(404);
  });

  test("single returns 404 for missing slug", async () => {
    const res = await request(app)
      .get("/api/v1/category/single-category/does-not-exist")
      .expect(404);
    expect(res.body.message).toMatch(/not found/i);
  });
});

