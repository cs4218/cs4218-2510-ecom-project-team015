// Author: Ravi Kishore
// Some parts of this test are generated using ChatGPT

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import '@testing-library/jest-dom';
import toast from 'react-hot-toast';

// Import components and contexts
import Login from '../pages/Auth/Login';
import ForgotPassword from '../pages/Auth/ForgotPassword';
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

// Helper wrapper component for testing full context + routes
const TestLoginComponent = () => (
<AuthProvider>
    <CartProvider>
    <SearchProvider>
        <MemoryRouter initialEntries={['/login']}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/" element={<HomePage />} />
            </Routes>
            <LocationDisplay /> 
        </MemoryRouter>
    </SearchProvider>
    </CartProvider>
</AuthProvider>
);

describe('Frontend Integration Test: Login Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.localStorage.getItem.mockReset();
        window.localStorage.setItem.mockReset();
        window.localStorage.removeItem.mockReset();
    });

  
    it('should render login form correctly', () => {
        const { getByPlaceholderText, getByText, getByTestId } = render(<TestLoginComponent />);
        expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
        expect(getByText('Forgot Password')).toBeInTheDocument();
        expect(getByText('LOGIN')).toBeInTheDocument();
        expect(getByTestId('location-display')).toHaveTextContent('/login');
    });


    it('should navigate to forgot password page', async () => {
        const { getByText, getByTestId } = render(<TestLoginComponent />);
        fireEvent.click(getByText('Forgot Password'));
        await waitFor(() => {
            expect(getByTestId('location-display')).toHaveTextContent('/forgot-password');
        });
    });


    it('should allow user to log in successfully and redirects to home page', async () => {
        const mockResponse = { data: {
                success: true,
                message: 'Login Successful',
                user: { name: 'Test user', email: 'cs4218@test.com' },
                token: 'mockToken',
            },
        };
        axios.post.mockResolvedValueOnce(mockResponse);

        const { getByPlaceholderText, getByText, getByTestId} = render(<TestLoginComponent />);

        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'cs4218@test.com' },});
        fireEvent.change(getByPlaceholderText('Enter Your Password'), {target: { value: 'cs4218@test.com' },});
        fireEvent.click(getByText('LOGIN'));

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith(
                'Login Successful',
                expect.any(Object)
            );
            expect(window.localStorage.setItem).toHaveBeenCalledWith(
                'auth',
                JSON.stringify({
                    user: mockResponse.data.user,
                    token: mockResponse.data.token,
                })
            );
            expect(getByTestId('location-display')).toHaveTextContent('/');
        });
    });


    it('should handle error when the login credentials are invalid', async () => {
        const mockErrorResponse = { data: {
                success: false,
                message: 'Invalid credentials',
            },
        };
        axios.post.mockResolvedValueOnce(mockErrorResponse);

        const { getByPlaceholderText, getByText, getByTestId } = render(<TestLoginComponent />);

        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'wrongemail@gmail.com' },});
        fireEvent.change(getByPlaceholderText('Enter Your Password'), {target: { value: 'wrongpass' },});
        fireEvent.click(getByText('LOGIN'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
            expect(window.localStorage.setItem).not.toHaveBeenCalled();
            expect(getByTestId('location-display')).toHaveTextContent('/login');
        });
    });

    it('should handle default errors when you login', async () => {
        axios.post.mockRejectedValueOnce({ message: 'Database Error' });

        const { getByPlaceholderText, getByText, getByTestId } = render(<TestLoginComponent />);

        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'cs4218@test.com' },});
        fireEvent.change(getByPlaceholderText('Enter Your Password'), {target: { value: 'cs4218@test.com' },});
        fireEvent.click(getByText('LOGIN'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Something went wrong');
            expect(window.localStorage.setItem).not.toHaveBeenCalled();
            expect(getByTestId('location-display')).toHaveTextContent('/login');
        });
    });

});
