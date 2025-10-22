// Author: Ravi Kishore
// Some parts of this test are generated using ChatGPT

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import '@testing-library/jest-dom';
import toast from 'react-hot-toast';

// Import components and contexts
import Register from '../pages/Auth/Register';
import Login from '../pages/Auth/Login';
import HomePage from '../pages/HomePage';
import { AuthProvider } from '../context/auth';
import { CartProvider } from '../context/cart';
import { SearchProvider } from '../context/search';

// Mock dependencies
jest.mock('axios');
jest.mock('react-hot-toast');

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

// Mock matchMedia to prevent Jest environment errors
window.matchMedia = window.matchMedia || function () {
  return {
    matches: false,
    addListener: function () {},
    removeListener: function () {},
  };
};

const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname}</div>;
};

// Helper wrapper component for full context + routes
const TestRegisterComponent = () => (
  <AuthProvider>
    <CartProvider>
      <SearchProvider>
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<HomePage />} />
          </Routes>
          <LocationDisplay />
        </MemoryRouter>
      </SearchProvider>
    </CartProvider>
  </AuthProvider>
);

describe('Frontend Integration Test: Register Component', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      window.localStorage.getItem.mockReset();
      window.localStorage.setItem.mockReset();
      window.localStorage.removeItem.mockReset();
    });

    it('should render register form correctly', () => {
        const { getByPlaceholderText, getByText, getByTestId } = render(<TestRegisterComponent />);

        expect(getByPlaceholderText('Enter Your Name')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your Phone Number(SG)')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your Address')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your DOB')).toBeInTheDocument();
        expect(getByPlaceholderText('What is Your Favorite sports')).toBeInTheDocument();
        expect(getByText('REGISTER')).toBeInTheDocument();
        expect(getByTestId('location-display')).toHaveTextContent('/register');
    });

    it('should register user successfully and navigate to login page', async () => {
        const mockResponse = {
        data: {
            success: true,
            message: 'User Registered Successfully',
        },
        };

        axios.post.mockResolvedValueOnce(mockResponse);

        const { getByPlaceholderText, getByText, getByTestId } = render(<TestRegisterComponent />);

        fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'Test User' } });
        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'cs4218@test.com' } });
        fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
        fireEvent.change(getByPlaceholderText('Enter Your Phone Number(SG)'), { target: { value: '98765432' } });
        fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Main Street' } });
        fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01'}});
        fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'cricket' } });

        fireEvent.click(getByText('REGISTER'));

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('User Registered Successfully');
            expect(getByTestId('location-display')).toHaveTextContent('/login');
        });
    });

    it('should show error toast when email already exists', async () => {
        const mockErrorResponse = {
        data: {
            success: false,
            message: 'Email Already Registered',
        },
        };

        axios.post.mockResolvedValueOnce(mockErrorResponse);

        const { getByPlaceholderText, getByText, getByTestId } = render(<TestRegisterComponent />);

        fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'Test User' } });
        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'existing@test.com' } });
        fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
        fireEvent.change(getByPlaceholderText('Enter Your Phone Number(SG)'), { target: { value: '98765432' } });
        fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Main Street' } });
        fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01'}});
        fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'football' } });

        fireEvent.click(getByText('REGISTER'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Email Already Registered');
            expect(getByTestId('location-display')).toHaveTextContent('/register');
        });
    });

    it('should handle API failure gracefully', async () => {
        axios.post.mockRejectedValueOnce({ message: 'Server Error' });

        const { getByPlaceholderText, getByText, getByTestId } = render(<TestRegisterComponent />);

        fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'Test User' } });
        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'cs4218@test.com' } });
        fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
        fireEvent.change(getByPlaceholderText('Enter Your Phone Number(SG)'), { target: { value: '98765432' } });
        fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Main Street' } });
        fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01'}});
        fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'cricket' } });

        fireEvent.click(getByText('REGISTER'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Something went wrong');
            expect(getByTestId('location-display')).toHaveTextContent('/register');
        });
    });
});
