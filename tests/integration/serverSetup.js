// Lightweight server setup for integration tests
import express from "express";
import { registerController, loginController, forgotPasswordController } from "../../controllers/authController.js";


const testApp = express();
testApp.use(express.json());
testApp.post("/api/v1/auth/register", registerController);
testApp.post("/api/v1/auth/login", loginController);
testApp.post("/api/v1/auth/forgot-password", forgotPasswordController);

export default testApp;