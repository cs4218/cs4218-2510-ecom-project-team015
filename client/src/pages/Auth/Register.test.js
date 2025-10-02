import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import toast from 'react-hot-toast';
import Register from './Register.js';

// Mocking axios amd toast
jest.mock('axios');
jest.mock('react-hot-toast');

// Mocking useNavigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
    const originalModule = jest.requireActual('react-router-dom');
    return {    
        ...originalModule,
        useNavigate: () => mockNavigate,
    };
});

jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
  }));

  jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
  }));
    
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
  }));  

jest.mock("../../hooks/useCategory", () => jest.fn(() =>[])); // Mock useCategory to return null state and a mock function
const setupRegisterPage = () => {
    return render(
        <MemoryRouter initialEntries={['/register']}>
        <Routes>
            <Route path="/register" element={<Register />} />
        </Routes>
        </MemoryRouter>
    );
};

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    // To test that all the required fields are present
    it('should render the Register component with required fields', () => {
        setupRegisterPage();

        expect(screen.getByText('REGISTER FORM')).toBeInTheDocument();

        expect(screen.getByPlaceholderText('Enter Your Name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter Your Phone')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter Your Address')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter Your DOB')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('What is Your Favorite sports')).toBeInTheDocument();

        expect(screen.getByRole('button', { name: 'REGISTER' })).toBeInTheDocument();
    });


    // // To test that all the required fields are present
    // it('should throw validation errors when fields are empty', async () => {
    //     setupRegisterPage();


    //     fireEvent.click(screen.getByText('REGISTER'));

    //     await waitFor(() => {
    //         expect(toast.error).toHaveBeenCalledWith('Please fill in this field.');
    //     });
    // });

    // To test that the user is registered successfully
    it('should register the user successfully', async () => {
        axios.post.mockResolvedValueOnce({ data: { success: true } });

        const { getByText, getByPlaceholderText } = setupRegisterPage();

        fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
        fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
        fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
        fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
        fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
        fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

        fireEvent.click(getByText('REGISTER'));

        // To test that axios.post was called
        expect(axios.post).toHaveBeenCalled();

        // To test that axios.post was called with correct data
        await waitFor(() =>{
            expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/register", {
                name: 'John Doe',
                email: 'test@example.com',
                password: 'password123',
                phone: '1234567890',
                address: '123 Street',
                DOB: '2000-01-01',
                answer: 'Football'
            });
        });

        // To test that toast.success was called
        expect(toast.success).toHaveBeenCalledWith('Registered Successfully, please login');

        // To test that navigation to login page was attempted using mocked useNavigate
        expect(mockNavigate).toHaveBeenCalledWith('/login');

    });

    it('should display error message on failed registration', async () => {
        axios.post.mockResolvedValueOnce({ 
            data: { 
                success: false, 
                message: 'Email already exists: Proceed to login',
            },
        });

        const { getByText, getByPlaceholderText } = setupRegisterPage();

        fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
        fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
        fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
        fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
        fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
        fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

        fireEvent.click(getByText('REGISTER'));

        // To test that axios.post was called 
        await waitFor(() => expect(axios.post).toHaveBeenCalled());

        // To test that toast.error was called with the error message upon failed registration
        expect(toast.error).toHaveBeenCalledWith('Email already exists: Proceed to login');

        // To test that navigation to login page was not attempted
        expect(mockNavigate).not.toHaveBeenCalledWith('/login');
    });

        it('should display error message on failed registration', async () => {
        axios.post.mockRejectedValueOnce(new Error('Network Error'));

        const { getByText, getByPlaceholderText } = setupRegisterPage();

        fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
        fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
        fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
        fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
        fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
        fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

        fireEvent.click(getByText('REGISTER'));

        // To test that axios.post was called 
        await waitFor(() => expect(axios.post).toHaveBeenCalled());

        // To test that toast.error was called with the error message upon failed registration
        expect(toast.error).toHaveBeenCalledWith('Something went wrong');

        // To test that navigation to login page was not attempted
        expect(mockNavigate).not.toHaveBeenCalledWith('/login');
    });
});
