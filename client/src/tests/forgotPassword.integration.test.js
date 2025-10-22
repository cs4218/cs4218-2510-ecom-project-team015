// Author: Ravi Kishore
// Some parts of this test are generated using ChatGPT

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import '@testing-library/jest-dom';
import toast from 'react-hot-toast';

// Import components and contexts
import ForgotPassword from '../pages/Auth/ForgotPassword';
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
const TestForgotPasswordComponent = () => (
  <AuthProvider>
    <CartProvider>
      <SearchProvider>
        <MemoryRouter initialEntries={['/forgot-password']}>
          <Routes>
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<HomePage />} />
          </Routes>
          <LocationDisplay />
        </MemoryRouter>
      </SearchProvider>
    </CartProvider>
  </AuthProvider>
);

describe('Frontend Integration Test: Forgot Password Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.localStorage.getItem.mockReset();
        window.localStorage.setItem.mockReset();
        window.localStorage.removeItem.mockReset();
    });

    it('should render forgot password form correctly', () => {
        const { getByPlaceholderText, getByText, getByTestId } = render(<TestForgotPasswordComponent />);

        expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter New Password')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your Favorite Sport')).toBeInTheDocument();
        expect(getByText('RESET PASSWORD')).toBeInTheDocument();
        expect(getByTestId('location-display')).toHaveTextContent('/forgot-password');
    });

    it('should successfully reset the password and navigate to login', async () => {
        const mockResponse = {
        data: {
            success: true,
            message: 'Password Reset Successfully',
        },
        };

        axios.post.mockResolvedValueOnce(mockResponse);

        const { getByPlaceholderText, getByText, getByTestId } = render(<TestForgotPasswordComponent />);

        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'cs4218@test.com' },});
        fireEvent.change(getByPlaceholderText('Enter New Password'), { target: { value: 'newpassword123' },});
        fireEvent.change(getByPlaceholderText('Enter Your Favorite Sport'), { target: { value: 'cricket' },});
        fireEvent.click(getByText('RESET PASSWORD'));

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Password Reset Successfully');
            expect(getByTestId('location-display')).toHaveTextContent('/login');
        });
    });

    it('should show error toast for invalid details', async () => {
        const mockErrorResponse = {
        data: {
            success: false,
            message: 'Invalid Email or Answer',
        },
        };

        axios.post.mockResolvedValueOnce(mockErrorResponse);

        const { getByPlaceholderText, getByText, getByTestId } = render(<TestForgotPasswordComponent />);

        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'wrong@test.com' },});
        fireEvent.change(getByPlaceholderText('Enter New Password'), {target: { value: 'wrongpass' },});
        fireEvent.change(getByPlaceholderText('Enter Your Favorite Sport'), { target: { value: 'football' },});
        fireEvent.click(getByText('RESET PASSWORD'));

        await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid Email or Answer');
        expect(getByTestId('location-display')).toHaveTextContent('/forgot-password');
        });
    });

    it('should handle API or network failure gracefully', async () => {
        axios.post.mockRejectedValueOnce({ message: 'Server Down' });

        const { getByPlaceholderText, getByText, getByTestId } = render(<TestForgotPasswordComponent />);

        fireEvent.change(getByPlaceholderText('Enter Your Email'), {target: { value: 'cs4218@test.com' },});
        fireEvent.change(getByPlaceholderText('Enter New Password'), {target: { value: 'password123' },});
        fireEvent.change(getByPlaceholderText('Enter Your Favorite Sport'), {target: { value: 'cricket' },});
        fireEvent.click(getByText('RESET PASSWORD'));

        await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Something went wrong');
        expect(getByTestId('location-display')).toHaveTextContent('/forgot-password');
        });
    });
});
