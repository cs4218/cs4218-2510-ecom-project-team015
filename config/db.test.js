// These test cases have been written with the help of Claude.
import mongoose from "mongoose";
import connectDB from "./db.js";

jest.mock("mongoose");

beforeAll(() => {
  const originalBgMagenta = Object.getOwnPropertyDescriptor(String.prototype, 'bgMagenta');
  const originalBgRed = Object.getOwnPropertyDescriptor(String.prototype, 'bgRed');
  
  Object.defineProperty(String.prototype, 'bgMagenta', {
    get() {
      const str = this.valueOf();
      return {
        get white() {
          return str; 
        }
      };
    },
    configurable: true
  });
  
  Object.defineProperty(String.prototype, 'bgRed', {
    get() {
      const str = this.valueOf();
      return {
        get white() {
          return str; 
        }
      };
    },
    configurable: true
  });
  
  global.originalBgMagenta = originalBgMagenta;
  global.originalBgRed = originalBgRed;
});

afterAll(() => {
  if (global.originalBgMagenta) {
    Object.defineProperty(String.prototype, 'bgMagenta', global.originalBgMagenta);
  } else {
    delete String.prototype.bgMagenta;
  }
  
  if (global.originalBgRed) {
    Object.defineProperty(String.prototype, 'bgRed', global.originalBgRed);
  } else {
    delete String.prototype.bgRed;
  }
});

describe("connectDB", () => {
  let consoleLogSpy;
  let originalEnv;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    originalEnv = process.env.MONGO_URL;
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (consoleLogSpy) {
      consoleLogSpy.mockRestore();
    }
    process.env.MONGO_URL = originalEnv;
  });

  describe("Successful connection scenarios", () => {
    test("should connect successfully with MongoDB Atlas connection string", async () => {
     
      const mockHost = "cluster0.mongodb.net";
      const mockConnection = {
        connection: {
          host: mockHost,
        },
      };
      process.env.MONGO_URL =
        "mongodb+srv://user:password@cluster0.mongodb.net/mydb";
      mongoose.connect.mockResolvedValue(mockConnection);

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith(
        "mongodb+srv://user:password@cluster0.mongodb.net/mydb"
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Connected To Mongodb Database ${mockHost}`
      );
    });
  });

  describe("Connection failure scenarios", () => {
    test("should handle connection error with network failure", async () => {
    
      const networkError = new Error("connect ECONNREFUSED 127.0.0.1:27017");
      networkError.name = "MongoNetworkError";
      process.env.MONGO_URL = "mongodb://localhost:27017/testdb";
      mongoose.connect.mockRejectedValue(networkError);

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URL);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Error in Mongodb ${networkError}`
      );
    });

    test("should handle authentication error", async () => {
      const authError = new Error("Authentication failed");
      authError.name = "MongoServerError";
      authError.code = 18;
      process.env.MONGO_URL =
        "mongodb://wronguser:wrongpass@localhost:27017/testdb";
      mongoose.connect.mockRejectedValue(authError);

      
      await connectDB();

     
      expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URL);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Error in Mongodb ${authError}`
      );
    });

    test("should handle invalid connection string error", async () => {
     
      const invalidURIError = new Error("Invalid connection string");
      process.env.MONGO_URL = "invalid-connection-string";
      mongoose.connect.mockRejectedValue(invalidURIError);

      
      await connectDB();

      
      expect(mongoose.connect).toHaveBeenCalledWith("invalid-connection-string");
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Error in Mongodb ${invalidURIError}`
      );
    });

    test("should handle timeout error", async () => {
      
      const timeoutError = new Error("connection timed out");
      timeoutError.name = "MongoNetworkTimeoutError";
      process.env.MONGO_URL = "mongodb://slow-server:27017/testdb";
      mongoose.connect.mockRejectedValue(timeoutError);

      
      await connectDB();

      
      expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URL);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Error in Mongodb ${timeoutError}`
      );
    });

    test("should handle DNS resolution error", async () => {
     
      const dnsError = new Error("getaddrinfo ENOTFOUND unknown-host");
      process.env.MONGO_URL = "mongodb://unknown-host:27017/testdb";
      mongoose.connect.mockRejectedValue(dnsError);

      
      await connectDB();

      
      expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URL);
      expect(consoleLogSpy).toHaveBeenCalledWith(`Error in Mongodb ${dnsError}`);
    });

    test("should handle generic Error object", async () => {
      
      const genericError = new Error("Something went wrong");
      process.env.MONGO_URL = "mongodb://localhost:27017/testdb";
      mongoose.connect.mockRejectedValue(genericError);

     
      await connectDB();

      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Error in Mongodb ${genericError}`
      );
    });
  });
});