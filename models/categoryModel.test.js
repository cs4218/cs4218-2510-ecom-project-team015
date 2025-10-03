import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Category from "../models/categoryModel";

describe("Category Model Unit Tests", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await Category.deleteMany({});
  });

  describe("Schema Validation Tests", () => {

    test("should create a category with valid name and slug", async () => {
      const categoryData = {
        name: "Electronics",
        slug: "electronics",
      };

      const category = new Category(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory._id).toBeDefined();
      expect(savedCategory.name).toBe(categoryData.name);
      expect(savedCategory.slug).toBe(categoryData.slug);
    });

    test("should create a category with only name field", async () => {

      const categoryData = {
        name: "Fashion",
      };

      const category = new Category(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory._id).toBeDefined();
      expect(savedCategory.name).toBe(categoryData.name);
      expect(savedCategory.slug).toBeUndefined();
    });

    test("should create a category with only slug field", async () => {

      const categoryData = {
        slug: "sports",
      };

      const category = new Category(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory._id).toBeDefined();
      expect(savedCategory.slug).toBe(categoryData.slug);
      expect(savedCategory.name).toBeUndefined();
    });

    test("should create a category with empty object", async () => {

      const categoryData = {};

      const category = new Category(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory._id).toBeDefined();
      expect(savedCategory.name).toBeUndefined();
      expect(savedCategory.slug).toBeUndefined();
    });
  });

  describe("Slug Lowercase Transformation Tests", () => {
    test("should convert slug to lowercase automatically", async () => {

      const categoryData = {
        name: "Home & Garden",
        slug: "HOME-GARDEN",
      };

      const category = new Category(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory.slug).toBe("home-garden");
      expect(savedCategory.slug).not.toBe("HOME-GARDEN");
    });

    test("should convert mixed case slug to lowercase", async () => {

      const categoryData = {
        name: "Books",
        slug: "BooKs-AnD-MaGaZiNeS",
      };

      const category = new Category(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory.slug).toBe("books-and-magazines");
    });
  });

  describe("Field Type Validation Tests", () => {

    test("should handle number type for name field", async () => {

      const categoryData = {
        name: 12345,
        slug: "number-category",
      };

      const category = new Category(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory.name).toBe("12345"); 
    });

    test("should handle boolean type for name field", async () => {

      const categoryData = {
        name: true,
        slug: "boolean-category",
      };

      const category = new Category(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory.name).toBe("true"); 
    });
  });

  describe("Boundary Value Tests", () => {

    test("should accept empty string for name", async () => {
      
      const categoryData = {
        name: "",
        slug: "empty-name",
      };

      const category = new Category(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory.name).toBe("");
      expect(savedCategory.slug).toBe("empty-name");
    });

    test("should accept very long name string", async () => {

      const longName = "A".repeat(1000);
      const categoryData = {
        name: longName,
        slug: "long-name",
      };

      const category = new Category(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory.name).toBe(longName);
      expect(savedCategory.name.length).toBe(1000);
    });

  });

});