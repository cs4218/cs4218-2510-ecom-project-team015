import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import validator from "validator";
import { comparePassword, hashPassword } from "./../helpers/authHelper.js";
import JWT from "jsonwebtoken";


export const registerController = async (req, res) => {
  try {
    const { name, email, password, phone, address, DOB, answer } = req.body;
    //Validate Name
    if (!name) {
      return res.status(400).send({
        success: false,
        message: "Name is Required",
      });
    }

    // Validate Email
    if (!email) {
      return res.status(400).send({ 
        success: false,
        message: "Email is Required" 
      });
    }

    // Validate Password
    if (!password) {
      return res.status(400).send({
        success: false,
        message: "Password is Required" 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).send({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Validate Phone
    if (!phone) {
      return res.status(400).send({
        success: false,
        message: "Phone no is Required" 
      });
    }

    // Validate Address
    if (!address) {
      return res.status(400).send({
        success: false,
        message: "Address is Required" 
      });
    }

    // Validate DOB
    if (!DOB) {
      return res.status(400).send({
        success: false,
        message: "DOB is Required" 
      });
    }
    // Validate Answer
    if (!answer) {
      return res.status(400).send({
        success: false,
        message: "Answer is Required" 
      });
    }

    //check user
    const exisitingUser = await userModel.findOne({ email });
    //exisiting user
    if (exisitingUser) {
      return res.status(200).send({
        success: false,
        message: "You have already registered with this email, please login",
      });
    }
    //register user
    const hashedPassword = await hashPassword(password);
    //save
    const user = await new userModel({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      DOB,
      answer,
    }).save();

    return res.status(201).send({
      success: true,
      message: "User Registered Successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    let errMessage = "Error in Registration";
    if (error.name === "ValidationError" && error.errors) {
      // Collect all validation error messages
      errMessage = Object.values(error.errors).map(e => e.message).join("\n");
    } else if (error.message) {
      errMessage = error.message;
    }
    return res.status(500).send({
      success: false,
      message: errMessage,
    });
  }
};

//POST LOGIN
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    //Validate email and password if not provided
    if (!email || !password) {
      return res.status(404).send({
        success: false,
        message: "Invalid email or password",
      });
    }
    //check user
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Email is not registerd",
      });
    }
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(401).send({
        success: false,
        message: "Invalid Password",
      });
    }
    //token
    const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    return res.status(200).send({
      success: true,
      message: "Login Successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Login Error, please try again",
      error,
    });
  }
};

//forgotPasswordController

export const forgotPasswordController = async (req, res) => {
  try {
    const { email, answer, newPassword } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).send({ 
        success: false, 
        message: "Email is required" 
      });
    }

    // Validate answer
    if (!answer) {
      return res.status(400).send({ 
        success: false, 
        message: "Answer is required" 
      });
    }

    // Validate newPassword
    if (!newPassword) {
      return res.status(400).send({ 
        success: false, 
        message: "New Password is required" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).send({
        success: false,
        message: "New Password must be at least 6 characters long",
      });
    }
    //check
    const user = await userModel.findOne({ email, answer });
    //validation
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Wrong Email Or Answer",
      });
    }

    // Hash the new password and update it in the database
    const hashed = await hashPassword(newPassword);
    await userModel.findByIdAndUpdate(user._id, { password: hashed });
    return res.status(200).send({
      success: true,
      message: "Password Reset Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Something went wrong, try again later",
      error,
    });
  }
};

//test controller
export const testController = (req, res) => {
  try {
    return res.send("Protected Routes");
  } catch (error) {
    console.log(error);
    return res.send({ error });
  }
};

//update profile
export const updateProfileController = async (req, res) => {
  try {
    const { name, password, address, phone } = req.body;
    const user = await userModel.findById(req.user._id);
    
    //handle name
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (name && !nameRegex.test(name)) {
      throw new Error("Name can contain only letters and spaces!");
    }

    //password
    if (password && password.length < 6) {
      throw new Error("Password has to be longer than 6 characters!");
    }

    if (phone && !validator.isMobilePhone(phone, "en-SG")) {
      throw new Error("Invalid Singapore phone number");
    }


    const hashedPassword = password ? await hashPassword(password) : undefined;
    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      {
        name: name || user.name,
        password: hashedPassword || user.password,
        phone: phone || user.phone,
        address: address || user.address,
      },
      { new: true,
        runValidators: true //including for last line of checks by model
       }
    );
    res.status(200).send({
      success: true,
      message: "Profile Updated Successfully",
      updatedUser,
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
      error,
    });
  }
};

//orders
export const getOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ buyer: req.user._id })
      .populate("products", "-photo")
      .populate("buyer", "name");
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while fetching orders",
      error,
    });
  }
};
//orders
export const getAllOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ buyer: req.user._id })
      .populate("products", "-photo")
      .populate("buyer", "name")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      // spelling mistake
      message: "Error while fetching orders",
      error,
    });
  }
};

//order status
export const orderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const orders = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      // spelling mistake
      message: "Error while fetching orders",
      error,
    });
  }
};