// These test cases have been written with the help of Claude.
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import CartPage from './CartPage';
import { useCart } from '../context/cart';
import { useAuth } from '../context/auth';
import { useNavigate } from 'react-router-dom';

jest.mock('axios');
jest.mock('react-hot-toast');
jest.mock('../context/cart');
jest.mock('../context/auth');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));
jest.mock('./../components/Layout', () => ({ children }) => <div>{children}</div>);
jest.mock('braintree-web-drop-in-react', () => {
  return function MockDropIn({ onInstance }) {
    const React = require('react');
    
    React.useEffect(() => {
      if (onInstance) {
        const mockInstance = {
          requestPaymentMethod: jest.fn().mockResolvedValue({ nonce: 'fake-nonce' })
        };
        onInstance(mockInstance);
      }
    }, []);
    
    return React.createElement('div', { 'data-testid': 'braintree-dropin' }, 'Braintree DropIn');
  };
});

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

// Helper to provide cart actions that mirror production behavior for tests
const makeCartActions = (cart, setCart) => ({
  removeFromCart: (index) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
    try {
      localStorage.setItem('cart', JSON.stringify(updated));
    } catch (e) {
      // CartPage logs errors; keep parity
      console.log(e);
    }
  },
  clearCart: async () => {
    setCart([]);
    try {
      localStorage.removeItem('cart');
    } catch (e) {
      console.log(e);
    }
  },
});

describe('CartPage Component', () => {
  let mockNavigate;
  let mockSetCart;
  let mockSetAuth;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate = jest.fn();
    mockSetCart = jest.fn();
    mockSetAuth = jest.fn();
    
    useNavigate.mockReturnValue(mockNavigate);
    toast.success = jest.fn();
    
    axios.get.mockResolvedValue({ data: {} });
    axios.post.mockResolvedValue({ data: {} });
    
    localStorage.clear();
  });


  describe('Component Rendering', () => {
    test('should render greeting for guest user when not authenticated', () => {
      useAuth.mockReturnValue([{ user: null, token: null }, mockSetAuth]);
      useCart.mockReturnValue([[], mockSetCart]);

      renderWithRouter(<CartPage />);

      expect(screen.getByText('Hello Guest')).toBeInTheDocument();
    });

    test('should render greeting with user name when authenticated', () => {
      useAuth.mockReturnValue([
        { user: { name: 'John Doe' }, token: 'valid-token' },
        mockSetAuth
      ]);
      useCart.mockReturnValue([[], mockSetCart]);

      renderWithRouter(<CartPage />);

      expect(screen.getByText(/Hello\s+John Doe/)).toBeInTheDocument();
    });

    test('should display empty cart message when cart is empty', () => {
      useAuth.mockReturnValue([{ user: null, token: null }, mockSetAuth]);
      useCart.mockReturnValue([[], mockSetCart]);

      renderWithRouter(<CartPage />);

      expect(screen.getByText('Your Cart Is Empty')).toBeInTheDocument();
    });

    test('should display cart item count when cart has items', () => {
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Test product 1' }
      ];
      useAuth.mockReturnValue([{ user: null, token: null }, mockSetAuth]);
      useCart.mockReturnValue([mockCart, mockSetCart]);

      renderWithRouter(<CartPage />);

      expect(screen.getByText(/You Have 1 items in your cart/)).toBeInTheDocument();
    });

    test('should prompt login when guest has items in cart', () => {
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Test product' }
      ];
      useAuth.mockReturnValue([{ user: null, token: null }, mockSetAuth]);
      useCart.mockReturnValue([mockCart, mockSetCart]);

      renderWithRouter(<CartPage />);

      expect(screen.getByText(/please login to checkout !/)).toBeInTheDocument();
    });
  });


  describe('Cart Items Display', () => {
    test('should render all cart items with correct details', () => {
    
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Description for product 1' },
        { _id: '2', name: 'Product 2', price: 200, description: 'Description for product 2' }
      ];
      useAuth.mockReturnValue([{ user: null, token: null }, mockSetAuth]);
      useCart.mockReturnValue([mockCart, mockSetCart]);

    
      renderWithRouter(<CartPage />);

      
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
      expect(screen.getByText(/Price : 100/)).toBeInTheDocument();
      expect(screen.getByText(/Price : 200/)).toBeInTheDocument();
    });

    test('should truncate description to 30 characters', () => {
      
      const mockCart = [
        { 
          _id: '1', 
          name: 'Product 1', 
          price: 100, 
          description: 'This is a very long description that should be truncated to thirty characters'
        }
      ];
      useAuth.mockReturnValue([{ user: null, token: null }, mockSetAuth]);
      useCart.mockReturnValue([mockCart, mockSetCart]);

      renderWithRouter(<CartPage />);

      expect(screen.getByText('This is a very long descriptio')).toBeInTheDocument();
    });
  });


  describe('Total Price Calculation', () => {
    test('should calculate and display correct total for single item', () => {
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Test' }
      ];
      useAuth.mockReturnValue([{ user: null, token: null }, mockSetAuth]);
      useCart.mockReturnValue([mockCart, mockSetCart]);

      renderWithRouter(<CartPage />);

      expect(screen.getByText(/Total : \$100.00/)).toBeInTheDocument();
    });

    test('should calculate and display correct total for multiple items', () => {
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Test' },
        { _id: '2', name: 'Product 2', price: 250.50, description: 'Test' },
        { _id: '3', name: 'Product 3', price: 49.50, description: 'Test' }
      ];
      useAuth.mockReturnValue([{ user: null, token: null }, mockSetAuth]);
      useCart.mockReturnValue([mockCart, mockSetCart]);

      renderWithRouter(<CartPage />);

      expect(screen.getByText(/Total : \$400.00/)).toBeInTheDocument();
    });

    test('should display $0.00 when cart is empty', () => {
      useAuth.mockReturnValue([{ user: null, token: null }, mockSetAuth]);
      useCart.mockReturnValue([[], mockSetCart]);

      renderWithRouter(<CartPage />);

      expect(screen.getByText(/Total : \$0.00/)).toBeInTheDocument();
    });

    test('should handle error in totalPrice calculation and log to console', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Test' }
      ];
      
      useAuth.mockReturnValue([{ user: null, token: null }, mockSetAuth]);
      useCart.mockReturnValue([mockCart, mockSetCart]);

      const originalToLocaleString = Number.prototype.toLocaleString;
      Number.prototype.toLocaleString = jest.fn(() => {
        throw new Error('toLocaleString error');
      });

      renderWithRouter(<CartPage />);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error));

      Number.prototype.toLocaleString = originalToLocaleString;
      consoleLogSpy.mockRestore();
    });
  });


  describe('Remove Cart Item Functionality', () => {
    test('should remove item from cart when remove button is clicked', () => {
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Test 1' },
        { _id: '2', name: 'Product 2', price: 200, description: 'Test 2' }
      ];
      useAuth.mockReturnValue([{ user: null, token: null }, mockSetAuth]);
      useCart.mockReturnValue([mockCart, mockSetCart, makeCartActions(mockCart, mockSetCart)]);

      renderWithRouter(<CartPage />);
      const removeButtons = screen.getAllByText('Remove');

      fireEvent.click(removeButtons[0]);

      expect(mockSetCart).toHaveBeenCalledWith([
        { _id: '2', name: 'Product 2', price: 200, description: 'Test 2' }
      ]);
    });

    test('should update localStorage when item is removed', () => {
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Test 1' }
      ];
      useAuth.mockReturnValue([{ user: null, token: null }, mockSetAuth]);
      useCart.mockReturnValue([mockCart, mockSetCart, makeCartActions(mockCart, mockSetCart)]);
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

      renderWithRouter(<CartPage />);
      const removeButton = screen.getByText('Remove');

      fireEvent.click(removeButton);

      expect(setItemSpy).toHaveBeenCalledWith('cart', JSON.stringify([]));
    });

    test('should remove correct item when multiple items exist', () => {
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Test 1' },
        { _id: '2', name: 'Product 2', price: 200, description: 'Test 2' },
        { _id: '3', name: 'Product 3', price: 300, description: 'Test 3' }
      ];
      useAuth.mockReturnValue([{ user: null, token: null }, mockSetAuth]);
      useCart.mockReturnValue([mockCart, mockSetCart, makeCartActions(mockCart, mockSetCart)]);

      renderWithRouter(<CartPage />);
      const removeButtons = screen.getAllByText('Remove');

      // Act - Remove middle item
      fireEvent.click(removeButtons[1]);

      expect(mockSetCart).toHaveBeenCalledWith([
        { _id: '1', name: 'Product 1', price: 100, description: 'Test 1' },
        { _id: '3', name: 'Product 3', price: 300, description: 'Test 3' }
      ]);
    });

    test('should handle error in removeCartItem and log to console', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Test 1' }
      ];
      useAuth.mockReturnValue([{ user: null, token: null }, mockSetAuth]);
      useCart.mockReturnValue([mockCart, mockSetCart, makeCartActions(mockCart, mockSetCart)]);

      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage error');
      });

      renderWithRouter(<CartPage />);
      const removeButton = screen.getByText('Remove');

      fireEvent.click(removeButton);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error));

      setItemSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });

  describe('Address Handling', () => {
    test('should display current address when user has address', () => {
      
      useAuth.mockReturnValue([
        { 
          user: { name: 'John', address: '123 Main St, New York' }, 
          token: 'valid-token' 
        },
        mockSetAuth
      ]);
      useCart.mockReturnValue([[], mockSetCart]);

      renderWithRouter(<CartPage />);

      expect(screen.getByText('Current Address')).toBeInTheDocument();
      expect(screen.getByText('123 Main St, New York')).toBeInTheDocument();
    });

    test('should navigate to profile when Update Address is clicked for user with address', () => {
    
      useAuth.mockReturnValue([
        { 
          user: { name: 'John', address: '123 Main St' }, 
          token: 'valid-token' 
        },
        mockSetAuth
      ]);
      useCart.mockReturnValue([[], mockSetCart]);

      renderWithRouter(<CartPage />);
      const updateButton = screen.getByText('Update Address');

      fireEvent.click(updateButton);

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/user/profile');
    });

    test('should navigate to profile when authenticated user without address clicks Update Address', () => {
      useAuth.mockReturnValue([
        { 
          user: { name: 'John', address: null }, 
          token: 'valid-token' 
        },
        mockSetAuth
      ]);
      useCart.mockReturnValue([[], mockSetCart]);

      renderWithRouter(<CartPage />);
      const updateButton = screen.getByText('Update Address');

      fireEvent.click(updateButton);

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/user/profile');
    });

    test('should show login button when guest user has no address', () => {
      
      useAuth.mockReturnValue([{ user: null, token: null }, mockSetAuth]);
      useCart.mockReturnValue([[], mockSetCart]);

    
      renderWithRouter(<CartPage />);


      expect(screen.getByText('Please Login to checkout')).toBeInTheDocument();
    });

    test('should navigate to login page with cart state when guest clicks login', () => {
      useAuth.mockReturnValue([{ user: null, token: null }, mockSetAuth]);
      useCart.mockReturnValue([[], mockSetCart]);

      renderWithRouter(<CartPage />);
      const loginButton = screen.getByText('Please Login to checkout');

      fireEvent.click(loginButton);

      expect(mockNavigate).toHaveBeenCalledWith('/login', { state: '/cart' });
    });
  });


  describe('Payment Gateway Integration', () => {
    test('should fetch client token on component mount when user is authenticated', async () => {
      axios.get.mockResolvedValue({ data: { clientToken: 'test-token' } });
      useAuth.mockReturnValue([
        { user: { name: 'John' }, token: 'valid-token' },
        mockSetAuth
      ]);
      useCart.mockReturnValue([
        [{ _id: '1', name: 'Product', price: 100, description: 'Test' }],
        mockSetCart
      ]);

      renderWithRouter(<CartPage />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/product/braintree/token');
      });
    });

    test('should handle error when fetching client token fails', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const tokenError = new Error('Network error');
      axios.get.mockRejectedValue(tokenError);
      
      useAuth.mockReturnValue([
        { user: { name: 'John' }, token: 'valid-token' },
        mockSetAuth
      ]);
      useCart.mockReturnValue([
        [{ _id: '1', name: 'Product', price: 100, description: 'Test' }],
        mockSetCart
      ]);

      renderWithRouter(<CartPage />);

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(tokenError);
      });

      consoleLogSpy.mockRestore();
    });

    test('should not display payment dropdown when client token is not available', () => {
      useAuth.mockReturnValue([
        { user: { name: 'John', address: '123 Main' }, token: 'valid-token' },
        mockSetAuth
      ]);
      useCart.mockReturnValue([
        [{ _id: '1', name: 'Product', price: 100, description: 'Test' }],
        mockSetCart
      ]);
    
      renderWithRouter(<CartPage />);

      expect(screen.queryByTestId('braintree-dropin')).not.toBeInTheDocument();
    });

    test('should not display payment dropdown when user is not authenticated', () => {
      
      useAuth.mockReturnValue([{ user: null, token: null }, mockSetAuth]);
      useCart.mockReturnValue([
        [{ _id: '1', name: 'Product', price: 100, description: 'Test' }],
        mockSetCart
      ]);

      renderWithRouter(<CartPage />);

      expect(screen.queryByTestId('braintree-dropin')).not.toBeInTheDocument();
    });

    test('should not display payment dropdown when cart is empty', () => {
      useAuth.mockReturnValue([
        { user: { name: 'John' }, token: 'valid-token' },
        mockSetAuth
      ]);
      useCart.mockReturnValue([[], mockSetCart]);

      renderWithRouter(<CartPage />);

      expect(screen.queryByTestId('braintree-dropin')).not.toBeInTheDocument();
    });
  });

  describe('Payment Processing', () => {
    test('should process payment successfully and navigate to orders', async () => {
      const mockCart = [
        { _id: '1', name: 'Product', price: 100, description: 'Test' }
      ];
      
      axios.get.mockResolvedValue({ data: { clientToken: 'test-token' } });
      axios.post.mockResolvedValue({ data: { success: true } });
      
      useAuth.mockReturnValue([
        { user: { name: 'John', address: '123 Main' }, token: 'valid-token' },
        mockSetAuth
      ]);
      useCart.mockReturnValue([mockCart, mockSetCart, makeCartActions(mockCart, mockSetCart)]);

      renderWithRouter(<CartPage />);

      await waitFor(() => {
        expect(screen.getByTestId('braintree-dropin')).toBeInTheDocument();
      }, { timeout: 3000 });

      const paymentButton = screen.getByText('Make Payment');

      fireEvent.click(paymentButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          '/api/v1/product/braintree/payment',
          { nonce: 'fake-nonce', cart: mockCart }
        );
      }, { timeout: 3000 });
      
      expect(mockSetCart).toHaveBeenCalledWith([]);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/user/orders');
      expect(toast.success).toHaveBeenCalledWith('Payment Completed Successfully ');
    });

    test('should clear cart from localStorage after successful payment', async () => {
      const mockCart = [
        { _id: '1', name: 'Product', price: 100, description: 'Test' }
      ];
      
      axios.get.mockResolvedValue({ data: { clientToken: 'test-token' } });
      axios.post.mockResolvedValue({ data: { success: true } });
      
      useAuth.mockReturnValue([
        { user: { name: 'John', address: '123 Main' }, token: 'valid-token' },
        mockSetAuth
      ]);
      useCart.mockReturnValue([mockCart, mockSetCart, makeCartActions(mockCart, mockSetCart)]);

      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');

      renderWithRouter(<CartPage />);

      await waitFor(() => {
        expect(screen.getByTestId('braintree-dropin')).toBeInTheDocument();
      }, { timeout: 3000 });

      const paymentButton = screen.getByText('Make Payment');

      fireEvent.click(paymentButton);

      await waitFor(() => {
        expect(removeItemSpy).toHaveBeenCalledWith('cart');
      }, { timeout: 3000 });
    });

    test('should handle payment failure and log error', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockCart = [
        { _id: '1', name: 'Product', price: 100, description: 'Test' }
      ];
      
      const paymentError = new Error('Payment failed');
      axios.get.mockResolvedValue({ data: { clientToken: 'test-token' } });
      axios.post.mockRejectedValue(paymentError);
      
      useAuth.mockReturnValue([
        { user: { name: 'John', address: '123 Main' }, token: 'valid-token' },
        mockSetAuth
      ]);
      useCart.mockReturnValue([mockCart, mockSetCart, makeCartActions(mockCart, mockSetCart)]);

      renderWithRouter(<CartPage />);

      await waitFor(() => {
        expect(screen.getByTestId('braintree-dropin')).toBeInTheDocument();
      }, { timeout: 3000 });

      const paymentButton = screen.getByText('Make Payment');

      fireEvent.click(paymentButton);

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(paymentError);
      }, { timeout: 3000 });

      expect(screen.getByText('Make Payment')).toBeInTheDocument();
      expect(screen.queryByText('Processing ....')).not.toBeInTheDocument();

      consoleLogSpy.mockRestore();
    });

    test('should disable payment button when user has no address', async () => {
      const mockCart = [
        { _id: '1', name: 'Product', price: 100, description: 'Test' }
      ];
      
      axios.get.mockResolvedValue({ data: { clientToken: 'test-token' } });
      
      useAuth.mockReturnValue([
        { user: { name: 'John', address: null }, token: 'valid-token' },
        mockSetAuth
      ]);
      useCart.mockReturnValue([mockCart, mockSetCart, makeCartActions(mockCart, mockSetCart)]);

      renderWithRouter(<CartPage />);

      await waitFor(() => {
        const paymentButton = screen.getByText('Make Payment');
        expect(paymentButton).toBeDisabled();
      }, { timeout: 3000 });
    });

    test('should show processing state during payment', async () => {
      const mockCart = [
        { _id: '1', name: 'Product', price: 100, description: 'Test' }
      ];
      
      axios.get.mockResolvedValue({ data: { clientToken: 'test-token' } });
      axios.post.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 100))
      );
      
      useAuth.mockReturnValue([
        { user: { name: 'John', address: '123 Main' }, token: 'valid-token' },
        mockSetAuth
      ]);
      useCart.mockReturnValue([mockCart, mockSetCart, makeCartActions(mockCart, mockSetCart)]);

      renderWithRouter(<CartPage />);

      await waitFor(() => {
        expect(screen.getByTestId('braintree-dropin')).toBeInTheDocument();
      }, { timeout: 3000 });

      const paymentButton = screen.getByText('Make Payment');

      fireEvent.click(paymentButton);

      await waitFor(() => {
        expect(screen.getByText('Processing ....')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
});
