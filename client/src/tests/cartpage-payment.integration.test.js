// Author: Vedant Sinha
// This file has been written with the help of Claude.

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import CartPage from '../pages/CartPage';
import { AuthProvider } from '../context/auth';
import { CartProvider } from '../context/cart';

// Mock axios
jest.mock('axios');

// Mock router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock Layout
jest.mock('../components/Layout', () => {
  return ({ children }) => <div>{children}</div>;
});

// Mock Braintree - simple with payment method
jest.mock('braintree-web-drop-in-react', () => {
  return function MockDropIn({ onInstance }) {
    // Immediately call onInstance if provided
    if (onInstance) {
      onInstance({
        requestPaymentMethod: jest.fn().mockResolvedValue({
          nonce: 'fake-nonce-abc'
        })
      });
    }
    return <div data-testid="braintree-dropin">Payment Form</div>;
  };
});

describe('CartPage Payment Integration - Simple', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('fetches payment token when user has cart items and address', async () => {
    // Setup user with address
    const authUser = {
      user: { 
        _id: 'user1',
        name: 'Test User', 
        address: '123 Street' 
      },
      token: 'token123',
    };

    const cartItems = [
      { _id: 'p1', name: 'Product', price: 100, description: 'Test' }
    ];

    localStorage.setItem('auth', JSON.stringify(authUser));
    localStorage.setItem('cart', JSON.stringify(cartItems));

    // Mock the token API call
    axios.get.mockResolvedValue({
      data: { clientToken: 'test-token-123' }
    });

    // Render
    render(
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <CartPage />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    // Verify token was fetched
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/braintree/token');
    });

    // Verify Braintree renders
    expect(screen.getByTestId('braintree-dropin')).toBeInTheDocument();
  });

  test('renders payment button when user has address and cart items', async () => {
    // Setup authenticated user with address
    const authUser = {
      user: { 
        _id: 'user123',
        name: 'Jane Smith', 
        address: '456 Main St' 
      },
      token: 'auth-token',
    };

    const cartItems = [
      { _id: 'prod1', name: 'Laptop', price: 1000, description: 'Gaming laptop' }
    ];

    localStorage.setItem('auth', JSON.stringify(authUser));
    localStorage.setItem('cart', JSON.stringify(cartItems));

    // Mock token API
    axios.get.mockResolvedValue({
      data: { clientToken: 'token-xyz' }
    });

    // Render
    render(
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <CartPage />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    // Wait for Braintree and payment button to appear
    await waitFor(() => {
      expect(screen.getByTestId('braintree-dropin')).toBeInTheDocument();
    });

    // Verify payment button exists and is enabled (ready for payment)
    const payButton = screen.getByText('Make Payment');
    expect(payButton).toBeInTheDocument();
    expect(payButton).toBeEnabled();
    
    // Verify cart items are displayed
    expect(screen.getByText('Laptop')).toBeInTheDocument();
  });

  test('disables payment button when user has no address', async () => {
    // User WITHOUT address
    const authUser = {
      user: { 
        _id: 'user456',
        name: 'Bob Jones', 
        address: null  // No address
      },
      token: 'auth-token',
    };

    const cartItems = [
      { _id: 'prod1', name: 'Keyboard', price: 80, description: 'Mechanical' }
    ];

    localStorage.setItem('auth', JSON.stringify(authUser));
    localStorage.setItem('cart', JSON.stringify(cartItems));

    // Mock token API
    axios.get.mockResolvedValue({
      data: { clientToken: 'token-xyz' }
    });

    // Render
    render(
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <CartPage />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    // Wait for Braintree to load
    await waitFor(() => {
      expect(screen.getByTestId('braintree-dropin')).toBeInTheDocument();
    });

    // Payment button should be DISABLED because user has no address
    const payButton = screen.getByText('Make Payment');
    expect(payButton).toBeDisabled();
  });
});