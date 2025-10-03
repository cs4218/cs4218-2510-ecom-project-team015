import mongoose from "mongoose";
import validator from "validator";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      match: [/^[a-zA-Z\s]+$/, "Name should only contain letters and spaces"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: (value) => validator.isEmail(value),
        message: "Invalid email",
      },
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      validate: {
        validator: (value) => validator.isMobilePhone(value, "en-SG"), 
        message: "Invalid phone number: Must be a valid Singapore phone number",
      },
    },
    address: {
      type: {},
      required: true,
    },
    DOB: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          const now = new Date() //Get just the date without time
          const ageInMs = now - value;
          const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
          const ageInYrs = ageInDays/365.25;

          return ageInDays >= 1 && ageInYrs <= 120 ;    //User cannot be born in the future and user cannot be > 120 yrs old
        },
        message: "DOB must be between 1 day and 120 years old",
      },
    },

    answer: {
      type: String,
      required: true,
    },
    role: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("users", userSchema);