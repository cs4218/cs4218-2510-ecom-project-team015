import express from "express";
import { requireSignIn } from "../../middlewares/authMiddleware.js";
import { updateProfileController } from "../../controllers/authController.js";

const testapp = express();
testapp.use(express.json());

testapp.put("/api/v1/auth/profile", (req, res, next) => {
  req.user = { _id: req.body._id };
  next();
}, updateProfileController);

export default testapp;
