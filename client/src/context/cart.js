// This file has been modified with the help of Claude.
import React from "react";
import { useState, useContext, createContext, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "./auth";

const CartContext = createContext();

// const CartProvider = ({ children }) => {
//   const [cart, setCart] = useState([]);

//   useEffect(() => {
//     let existingCartItem = localStorage.getItem("cart");
//     if (existingCartItem) setCart(JSON.parse(existingCartItem));
//   }, []);

//   return (
//     <CartContext.Provider value={[cart, setCart]}>
//       {children}
//     </CartContext.Provider>
//   );
// };

const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [auth] = useAuth();

  // Load cart on mount
  useEffect(() => {
    if (auth?.token) {
      // Load from database for logged-in users
      loadCartFromDB();
    } else {
      // Load from localStorage for guests
      loadCartFromLocalStorage();
    }
  }, [auth?.token]);

  // Load cart from database
  const loadCartFromDB = async () => {
    try {
      const { data } = await axios.get("/api/v1/cart");
      if (data?.success) {
        setCart(data.cart.items || []);
      }
    } catch (error) {
      console.log("Error loading cart from DB:", error);
    }
  };

  // Load cart from localStorage
  const loadCartFromLocalStorage = () => {
    try {
      const existingCart = localStorage.getItem("cart");
      if (existingCart) {
        setCart(JSON.parse(existingCart));
      } else {
        setCart([]);
      }
    } catch (error) {
      console.log("Error loading cart from localStorage:", error);
    }
  };

  // Merge cart on login
  const mergeCart = async () => {
    try {
      const guestCart = JSON.parse(localStorage.getItem("cart") || "[]");
      
      if (guestCart.length > 0) {
        // Extract product IDs from guest cart
        const productIds = guestCart.map(item => item._id);
        
        const { data } = await axios.post("/api/v1/cart/merge", {
          guestCart: productIds,
        });

        if (data?.success) {
          // Clear localStorage
          localStorage.removeItem("cart");
          
          // Update state with merged cart
          setCart(data.cart.items || []);
          
          toast.success("Cart merged successfully");
        }
      } else {
        // No guest cart, just load from DB
        loadCartFromDB();
      }
    } catch (error) {
      console.log("Error merging cart:", error);
      toast.error("Error merging cart");
      // Fallback to loading from DB
      loadCartFromDB();
    }
  };

  // Add item to cart
  const addToCart = async (product) => {
    try {
      if (auth?.token) {
        // Add to database
        const { data } = await axios.post("/api/v1/cart/add", {
          productId: product._id,
        });

        if (data?.success) {
          setCart(data.cart.items || []);
          toast.success("Item added to cart");
        } else {
          toast.error(data.message || "Error adding to cart");
        }
      } else {
        // Add to localStorage (allows duplicates)
        const updatedCart = [...cart, product];
        setCart(updatedCart);
        localStorage.setItem("cart", JSON.stringify(updatedCart));
        toast.success("Item added to cart");
      }
    } catch (error) {
      console.log("Error adding to cart:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Error adding to cart");
      }
    }
  };

  // Remove item from cart by index
  const removeFromCart = async (index) => {
    try {
      if (auth?.token) {
        // Remove from database
        const { data } = await axios.delete(`/api/v1/cart/remove/${index}`);
        
        if (data?.success) {
          setCart(data.cart.items || []);
          toast.success("Item removed from cart");
        }
      } else {
        // Remove from localStorage
        const updatedCart = [...cart];
        updatedCart.splice(index, 1);
        setCart(updatedCart);
        localStorage.setItem("cart", JSON.stringify(updatedCart));
        toast.success("Item removed from cart");
      }
    } catch (error) {
      console.log("Error removing from cart:", error);
      toast.error("Error removing from cart");
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      if (auth?.token) {
        await axios.delete("/api/v1/cart/clear");
      }
      setCart([]);
      localStorage.removeItem("cart");
    } catch (error) {
      console.log("Error clearing cart:", error);
    }
  };

  return (
    <CartContext.Provider 
      value={[
        cart, 
        setCart, 
        { 
          addToCart, 
          removeFromCart, 
          clearCart, 
          mergeCart,
        }
      ]}
    >
      {children}
    </CartContext.Provider>
  );
};

// custom hook
const useCart = () => useContext(CartContext);

export { useCart, CartProvider };