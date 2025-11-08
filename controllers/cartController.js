// This code has been written with the help of Claude.
import cartModel from "../models/cartModel.js";
import productModel from "../models/productModel.js";


export const getUserCartController = async (req, res) => {
  try {
    const cart = await cartModel
      .findOne({ user: req.user._id })
      .populate("items", "name price description slug");
    
    if (!cart) {
      return res.status(200).send({
        success: true,
        cart: { items: [] },
      });
    }

    // Filter out items where product no longer exists (deleted products)
    const validItems = cart.items.filter(item => item !== null);
    
    // Update cart if any items were removed
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    res.status(200).send({
      success: true,
      cart,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error fetching cart",
      error,
    });
  }
};

// Add item to cart (allows duplicates)
export const addToCartController = async (req, res) => {
  try {
    const { productId } = req.body;

    // Verify product exists
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    let cart = await cartModel.findOne({ user: req.user._id });

    if (!cart) {
      // Create new cart
      cart = new cartModel({
        user: req.user._id,
        items: [],
      });
    }

    // Ensure product has stock
    if (product.quantity <= 0) {
      return res.status(400).send({
        success: false,
        message: "Out of stock",
      });
    }

    // Count how many of this product are already in the cart
    const pidStr = productId.toString();
    const currentQty = cart.items.reduce(
      (n, id) => n + (id.toString() === pidStr ? 1 : 0),
      0
    );

    // Enforce cap based on product.quantity
    if (currentQty >= product.quantity) {
      return res.status(400).send({
        success: false,
        message: `Only ${product.quantity} in stock`,
      });
    }

    // Add one unit
    cart.items.push(productId);

    await cart.save();

    // Populate and return
    await cart.populate("items", "name price description slug");

    res.status(200).send({
      success: true,
      message: "Item added to cart",
      cart,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error adding to cart",
      error,
    });
  }
};

// Remove single item from cart by index
export const removeFromCartController = async (req, res) => {
  try {
    const { itemIndex } = req.params;

    const cart = await cartModel.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).send({
        success: false,
        message: "Cart not found",
      });
    }

    // Remove item at specific index
    if (itemIndex >= 0 && itemIndex < cart.items.length) {
      cart.items.splice(itemIndex, 1);
    } else {
      return res.status(400).send({
        success: false,
        message: "Invalid item index",
      });
    }

    await cart.save();
    await cart.populate("items", "name price description slug");

    res.status(200).send({
      success: true,
      message: "Item removed from cart",
      cart,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error removing item",
      error,
    });
  }
};

// Clear cart
export const clearCartController = async (req, res) => {
  try {
    const cart = await cartModel.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).send({
      success: true,
      message: "Cart cleared",
      cart: { items: [] },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error clearing cart",
      error,
    });
  }
};

// Merge guest cart with user cart (called after login)
export const mergeCartController = async (req, res) => {
  try {
    const { guestCart } = req.body; // Array of product IDs

    if (!guestCart || !Array.isArray(guestCart)) {
      return res.status(400).send({
        success: false,
        message: "Invalid cart data",
      });
    }

    let cart = await cartModel.findOne({ user: req.user._id });

    if (!cart) {
      cart = new cartModel({
        user: req.user._id,
        items: [],
      });
    }

    // Merge guest cart with stock-aware limits
    const desiredCounts = new Map();
    for (const productId of guestCart) {
      const id = productId.toString();
      desiredCounts.set(id, (desiredCounts.get(id) || 0) + 1);
    }

    for (const [id, desired] of desiredCounts.entries()) {
      const product = await productModel.findById(id).select("quantity");
      if (!product || product.quantity <= 0) continue;

      const currentQty = cart.items.reduce(
        (n, pid) => n + (pid.toString() === id ? 1 : 0),
        0
      );

      const canAdd = Math.max(0, Math.min(desired, product.quantity - currentQty));
      if (canAdd > 0) {
        for (let i = 0; i < canAdd; i++) {
          cart.items.push(id); // string will be cast to ObjectId
        }
      }
    }

    await cart.save();
    await cart.populate("items", "name price description slug");

    res.status(200).send({
      success: true,
      message: "Cart merged successfully",
      cart,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error merging cart",
      error,
    });
  }
};
