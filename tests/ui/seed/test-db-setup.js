import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import userModel from "../../../models/userModel.js";
import categoryModel from "../../../models/categoryModel.js"
import productModel from "../../../models/productModel.js"
import orderModel from "../../../models/orderModel.js"
import cartModel from "../../../models/cartModel.js"


import { userSeed } from "./userSeed.js";
import { productSeed } from "./productSeed.js";
import { categorySeed } from "./categorySeed.js";
import { orderSeed } from "./orderSeed.js";
import { cartSeed } from "./cartSeed.js";

//Written with help of AI

let mongoServer;

export const connectTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGO_TEST_URI = uri;
  await mongoose.connect(uri);
  return uri;
};

export const seedTestDB = async () => {
  await userModel.insertMany(userSeed);
  await categoryModel.insertMany(categorySeed);
  await productModel.insertMany(productSeed);
  await cartModel.insertMany(cartSeed);
  await orderModel.insertMany(orderSeed);
};

export const removeSeedDataDB = async() => {
  await userModel.deleteMany({});
  await categoryModel.deleteMany({});
  await productModel.deleteMany({});
  await cartModel.deleteMany({});
  await orderModel.deleteMany({});

}
export const disconnectTestDB = async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
};
