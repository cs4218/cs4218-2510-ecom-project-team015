// This code has been written with the help of Claude.
import express from "express";
import {
  getUserCartController,
  addToCartController,
  removeFromCartController,
  clearCartController,
  mergeCartController,
} from "../controllers/cartController.js";
import { requireSignIn } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.get("/", requireSignIn, getUserCartController);
router.post("/add", requireSignIn, addToCartController);
router.delete("/remove/:itemIndex", requireSignIn, removeFromCartController);
router.delete("/clear", requireSignIn, clearCartController);
router.post("/merge", requireSignIn, mergeCartController);

export default router;