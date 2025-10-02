import mongoose from "mongoose";
import {MongoMemoryServer} from "mongodb-memory-server";    //Runs in-memory mongodb instance
import userModel from "./userModel.js";

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
  await userModel.deleteMany({});
});

describe("Given user model", () => {
    test("When user details are correct", async() => {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const yesterdayISOString = yesterday.toISOString();
        const validUser = new userModel({
            name: "validName",
            email: "valid@mail.com",
            password: "password",
            phone: "+6566382738",
            address: "NUS",
            DOB: new Date(yesterdayISOString),
            answer: "Soccer"
        });

        const savedUser = await validUser.save();

        expect(savedUser._id).toBeDefined();
        expect(savedUser.name).toBe("validName");
        expect(savedUser.email).toBe("valid@mail.com");
        expect(savedUser.phone).toBe("+6566382738");
        expect(savedUser.address).toBe("NUS");
        expect(savedUser.DOB.toISOString()).toBe(yesterdayISOString);
        expect(savedUser.answer).toBe("Soccer");
        expect(savedUser.role).toBe(0);
    });

    test("When user name is non-alphabet characters", async() => {
        const invalidUser = new userModel({
            name: "'validName",
            email: "valid@mail.com",
            password: "password",
            phone: "65382738",
            address: "NUS",
            DOB: new Date(Date.now() - 5* 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 5 days old
            answer: "Soccer"
        });
        let err;
        try {
            await invalidUser.save();
        } catch (error) {
            err = error;
        }
        expect(err.errors.name).toBeDefined();
        expect(err.errors.name.message).toBe("Name should only contain letters and spaces");
    })

    test("When user email end extension invalid", async() => {
         const invalidUser = new userModel({
            name: "validName",
            email: "invalid@mail.c",
            password: "password",
            phone: "65382738",
            address: "NUS",
            DOB: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 5 days old
            answer: "Soccer"
        });
        let err;
        try {
            await invalidUser.save();
        } catch (error) {
            err = error;
        }
        expect(err.errors.email).toBeDefined();
        expect(err.errors.email.message).toBe("Invalid email");
    })

    test("When user email does not have @", async() => {
         const invalidUser = new userModel({
            name: "validName",
            email: "invalidmail.com",
            password: "password",
            phone: "65382738",
            address: "NUS",
            DOB: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 5 days old
            answer: "Soccer"
        });
        let err;
        try {
            await invalidUser.save();
        } catch (error) {
            err = error;
        }
        expect(err.errors.email).toBeDefined();
        expect(err.errors.email.message).toBe("Invalid email");
    })

    test("When user phone number contains alphabets", async() => {
        const invalidUser = new userModel({
            name: "validName",
            email: "valid@mail.com",
            password: "password",
            phone: "65382738a",
            address: "NUS",
            DOB: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 5 days old
            answer: "Soccer"
        });
        let err;
        try {
            await invalidUser.save();
        } catch (error) {
            err = error;
        }
        expect(err.errors.phone).toBeDefined();
        expect(err.errors.phone.message).toBe("Invalid phone number: Must be a valid Singapore phone number");
    })

    test("When mandatory fields not filled", async() => {
        const invalidUser = new userModel({name: "validName"});
        let err;
        try {
            await invalidUser.save();
        } catch (error) {
            err = error;
        }
        expect(err.errors.email).toBeDefined();
        expect(err.errors.password).toBeDefined();
        expect(err.errors.phone).toBeDefined();
        expect(err.errors.address).toBeDefined();
        expect(err.errors.DOB).toBeDefined();
        expect(err.errors.answer).toBeDefined();
    });

    test("Should reject when duplicate emails", async() => {
        const validUser = new userModel({
            name: "validName",
            email: "valid@mail.com",
            password: "password",
            phone: "+6566382738",
            address: "NUS",
            DOB: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 5 days old
            answer: "Soccer"
        });

        const savedUser = await validUser.save();

        const duplicateEmail = new userModel({
            name: "validNames",
            email: "valid@mail.com",
            password: "password3",
            phone: "+6566382728",
            address: "NU1S",
            DOB: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 5 days old
            answer: "Football"
        });

        await expect(duplicateEmail.save()).rejects.toThrow(/duplicate key/);
    })

    const invalidDOBs = [
        new Date(Date.now()),                   // today
        new Date(Date.now() - 120 * 365.25 * 24 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000), // 120 years, 1 day old
    ];
    test.each(invalidDOBs)("Should reject invalid DOB: %s", async(invalidDob) => {
        const invalidDobDateOnlyString = invalidDob.toISOString().split("T")[0];
        const invalidUser = new userModel({
            name: "validName",
            email: "valid@mail.com",
            password: "password",
            phone: "65382738",
            address: "NUS",
            DOB: new Date(`${invalidDobDateOnlyString}T00:00:00:000Z`),
            answer: "Soccer"
        });
        expect(invalidUser.save()).rejects.toThrowError(/DOB/);
    });


    const validDOBs = [
        new Date(Date.now() - 24 * 60 * 60 * 1000), //1 day old, prints time in UTC
        new Date(Date.now() - 120 * 365.25 * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000), // 119 years, 364 days old, UTC
    ]

    test.each(validDOBs)("Should accept valid DOB: %s", async(validDob) => {
        const validDobDateOnlyString = validDob.toISOString().split("T")[0];
        const validUser = new userModel({
            name: "validName",
            email: "valid@mail.com",
            password: "password",
            phone: "65382738",
            address: "NUS",
            DOB: new Date(`${validDobDateOnlyString}T00:00:00.000Z`),
            answer: "Soccer"
        });
        const savedUser = await validUser.save();

        expect(savedUser._id).toBeDefined();
        expect(savedUser.name).toBe("validName");
        expect(savedUser.email).toBe("valid@mail.com");
        expect(savedUser.phone).toBe("65382738");
        expect(savedUser.address).toBe("NUS");
        expect(savedUser.DOB.toISOString().split("T")[0]).toEqual(validDobDateOnlyString);
        expect(savedUser.answer).toBe("Soccer");
        expect(savedUser.role).toBe(0); // not admin by default
    });

});