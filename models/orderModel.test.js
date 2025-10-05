import mongoose, { Mongoose } from "mongoose";
import {MongoMemoryServer} from "mongodb-memory-server";    //Runs in-memory mongodb instance
import orderModel from "./orderModel.js";

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
});

describe("Given order model", () => {
    test("When user and product details are valid", async() => {
        //Create user
        const user = new mongoose.Types.ObjectId();

        //Create category
        const category = new mongoose.Types.ObjectId();

        //Create products
        const prod1 = new mongoose.Types.ObjectId();

        const prod2 = new mongoose.Types.ObjectId();

        const order = await orderModel.create({
            products: [prod1._id, prod2._id],
            payment: {status: "Pending", amount: 12},
            buyer: user._id,
            status: "Processing"
        });
        expect(order._id).toBeDefined();    //mongoose should automatically generate _id for the order created
        expect(order.products.length).toBe(2);  //2 product id are present in order
        expect(order.buyer).toEqual(user._id);  //id must match
        expect(order.payment.status).toBe("Pending");
        expect(order.status).toBe("Processing");
    });


    test("Error when buyer field is not sent in req", async() => {
        //Create category
        const category = new mongoose.Types.ObjectId();
        
        //Create product
        const prod1 = new mongoose.Types.ObjectId();
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

    test("Error when products field is not sent in req", async() => {
        //Create user
        const user = new mongoose.Types.ObjectId();

        //Create category
        const category = new mongoose.Types.ObjectId();
        
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
    });

    test("Error when products array is empty", async() => {
        //Create user
        const user = new mongoose.Types.ObjectId();

        //Create category
        const category = new mongoose.Types.ObjectId();
        
        let err;
        try {
            await orderModel.create({ buyer: user._id, 
                products: [],
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
        const user = new mongoose.Types.ObjectId();

        //Create category
        const category = new mongoose.Types.ObjectId();

        //Create product
        const prod1 = new mongoose.Types.ObjectId();

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
    });

    test("should default status to 'Not Processed'", async () => {
        //Create user
        const user = new mongoose.Types.ObjectId();

        const order = await orderModel.create({
            products: [new mongoose.Types.ObjectId()],
            payment: { method: "Card", amount: 100 },
            buyer: user._id,
        });

        expect(order.status).toBe("Not Processed");
    });

    test("should fail if status is not in allowed enum", async () => {
        const user = new mongoose.Types.ObjectId();
        let err;
        try {
            const order = await orderModel.create({
                products: [new mongoose.Types.ObjectId()],
                payment: { method: "Card", amount: 100 },
                buyer: user._id,
                status: "In Transit",
            });
        } catch (error) {
            err = error;
        }
        expect(err.errors.status.message).toBeDefined();
        expect(err.errors.status.message).toBe("`In Transit` is not a valid enum value for path `status`.");
    });

    test("should allow duplicate product IDs in products array", async () => {
        const productId = new mongoose.Types.ObjectId();

        const order = await orderModel.create({
            products: [productId, productId], // same product twice
            payment: { method: "Card", amount: 100 },
            buyer: new mongoose.Types.ObjectId(),
        });

        expect(order.products.length).toBe(2);
        expect(order.products[0].toString()).toBe(productId.toString());
        expect(order.products[1].toString()).toBe(productId.toString());
    });
    
    //Tests generated with ChatGPT
    test("should allow manually setting createdAt timestamp", async () => {
        const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // +1 day

        const order = await orderModel.create({
            products: [new mongoose.Types.ObjectId()],
            payment: { status: "Pending", amount: 100 },
            buyer: new mongoose.Types.ObjectId(),
            createdAt: futureDate,
        });

        expect(order.createdAt.toISOString()).toBe(futureDate.toISOString());
    });

    test("should ignore extra fields if passed in order req", async () => {
        const order = await orderModel.create({
            products: [new mongoose.Types.ObjectId()],
            payment: { status: "Pending", amount: 100 },
            buyer: new mongoose.Types.ObjectId(),
            extraField: "unexpected field",
        });

        expect(order.extraField).toBeUndefined(); // default behavior
    });

    
});