import mongoose, { Mongoose } from "mongoose";
import {MongoMemoryServer} from "mongodb-memory-server";    //Runs in-memory mongodb instance
import orderModel from "./orderModel.js";
import userModel from "./userModel.js";
import categoryModel from "./categoryModel.js";
import productModel from "./productModel.js";

let mongoServer;

beforeAll(async() => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();   //Get uri of in memory mongoserver
    await mongoose.connect(uri);
})

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await orderModel.deleteMany({});
  await userModel.deleteMany({});
  await productModel.deleteMany({});
  await categoryModel.deleteMany({});
});

describe("Given order model", () => {
    test("When user and product details are valid", async() => {
        //Create user
        const user = await userModel.create({
            name: "Correct Name",
            email:"correctEmail@email.com",
            password:"thisisavalidpassword",
            phone:"99879878",
            address: "validplace",
            DOB: new Date("2002-12-25"),
            answer: "Pilates"
        });

        //Create category
        const category = await categoryModel.create({
            name: "Cat1",
            slug: "cat1"
        });

        //Create products
        const prod1 = await productModel.create({
            name: "Prod1",
            slug: "prod1",
            description: "this is prod 1",
            price: 12,
            category: category._id,
            quantity: 2
        });

        const prod2 = await productModel.create({
            name: "Prod2",
            slug: "prod2",
            description: "this is prod 2",
            price: 12,
            category: category._id,
            quantity: 3
        });

        const order = await orderModel.create({
            products: [prod1._id, prod2._id],
            payment: {status: "Pending", amount: 12},
            buyer: user._id,
        });
        expect(order._id).toBeDefined();    //mongoose should automatically generate _id for the order created
        expect(order.products.length).toBe(2);  //2 product id are present in order
        expect(order.buyer).toEqual(user._id);  //id must match
        expect(order.payment.status).toBe("Pending");
        expect(order.status).toBe("Not Processed");
    });


    test("Error when buyer field is not sent in req", async() => {
        //Create category
        const category = await categoryModel.create({
            name: "Cat1",
            slug: "cat1"
        });
        
        //Create product
        const prod1 = await productModel.create({
            name: "Prod1",
            slug: "prod1",
            description: "this is prod 1",
            price: 12,
            category: category._id,
            quantity: 2
        });
        let err;
        try {
            await orderModel.create({
            products: [prod1._id],
            payment: {status: "Pending", amount: 12},
            })
        } catch (error) {
            err = error;
        }
        expect(err.errors.buyer.message).toBeDefined();
        expect(err.errors.buyer.message).toBe("Path `buyer` is required.")
    });

    test("Error when products field array does not have valid product ids", async() => {
        //Create user
        const user = await userModel.create({
            name: "Correct Name",
            email:"correctEmail@email.com",
            password:"thisisavalidpassword",
            phone:"99879878",
            address: "validplace",
            DOB: new Date("2002-12-25"),
            answer: "Pilates"
        });

        //Create category
        const category = await categoryModel.create({
            name: "Cat1",
            slug: "cat1"
        });
        
        let err;
        try {
            await orderModel.create({ buyer: user._id, 
                payment: {status: "Pending", amount: 12},
            });
        }  catch (error) {
            err = error;
        }
        expect(err.errors.products.message).toBeDefined();
        expect(err.errors.products.message).toBe("Order must contain at least one product");
    })

    test("Error when payment field array is not included", async() => {
        //Create user
        const user = await userModel.create({
            name: "Correct Name",
            email:"correctEmail@email.com",
            password:"thisisavalidpassword",
            phone:"99879878",
            address: "validplace",
            DOB: new Date("2002-12-25"),
            answer: "Pilates"
        });

        //Create category
        const category = await categoryModel.create({
            name: "Cat1",
            slug: "cat1"
        });

        //Create product
        const prod1 = await productModel.create({
            name: "Prod1",
            slug: "prod1",
            description: "this is prod 1",
            price: 12,
            category: category._id,
            quantity: 2
        });

        let err;
        try {
            await orderModel.create({ buyer: user._id, 
                products: [prod1._id],
            });
        }  catch (error) {
            err = error;
        }
        expect(err.errors.payment.message).toBeDefined();
        expect(err.errors.payment.message).toBe("Path `payment` is required.");
    })
});