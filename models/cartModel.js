// This code has been written with the help of Claude.

import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.ObjectId,
      ref: "users",
      required: true,
      unique: true, // One cart per user
    },
    items: [
      {
        type: mongoose.ObjectId,
        ref: "Products",
        required: true,
      }
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Cart", cartSchema);