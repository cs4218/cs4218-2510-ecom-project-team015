import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    products: {
      type: [
        {
          type: mongoose.ObjectId,
          ref: "Products",
          required: true, //each product added has a mongoose object id
        },
      ],
      required: true, //the products field is required to be saved to db
      validate: {
        validator: (arr) => arr.length > 0,
        message: "Order must contain at least one product",
      }
    },
    
    payment: {
      type: Object,
      required: true,
    },
    buyer: {
      type: mongoose.ObjectId,
      ref: "users",
      required: true,
    },
    status: {
      type: String,
      default: "Not Processed",
      enum: ["Not Processed", "Processing", "Shipped", "Delivered", "Cancelled"],  //fixed spelling errors
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);