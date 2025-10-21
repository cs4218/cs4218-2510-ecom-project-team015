// Lightweight server setup for integration tests
import express from "express";
import { registerController, loginController, forgotPasswordController, getAllUsersController } from "../../controllers/authController.js";
import { requireSignIn, isAdmin } from "../../middlewares/authMiddleware.js";
import { updateProfileController } from "../../controllers/authController.js";


const testApp = express();
testApp.use(express.json());
testApp.post("/api/v1/auth/register", registerController);
testApp.post("/api/v1/auth/login", loginController);
testApp.post("/api/v1/auth/forgot-password", forgotPasswordController);

testApp.get("/user-auth", requireSignIn, (req, res) => {
    res.status(200).send({ success: true, message: "User access granted", user: req.user });
});
testApp.get("/admin-auth", requireSignIn, isAdmin, (req, res) => {
    res.status(200).send({ success: true, message: "Admin access granted", user: req.user });
});

testApp.put("/api/v1/auth/profile", (req, res, next) => {
  req.user = { _id: req.body._id };
  next();
}, updateProfileController);

testApp.get("/api/v1/auth/all-users", (req, res, next) => {
  req.user = { _id: req.body._id};
  next();
}, getAllUsersController);

export default testApp;