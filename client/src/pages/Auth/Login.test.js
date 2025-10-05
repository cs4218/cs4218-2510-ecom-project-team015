import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import toast from 'react-hot-toast';
import Login from './Login.js';

// Mocking axios.post
jest.mock('axios');
jest.mock('react-hot-toast');

const mockNavigate = jest.fn();
const mockLocation = { state: null };

// Mocking useNavigate and useLocation from react-router-dom
jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useNavigate: () => mockNavigate,
	useLocation: () => mockLocation
}));

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

Object.defineProperty(window, 'localStorage', {
    value: {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
    },
    writable: true,
  });

window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
    };
};

const setupLoginPage = () => {
	return render(
		<MemoryRouter initialEntries={['/login']}>
			<Routes>
				<Route path="/login" element={<Login />} />
			</Routes>
		</MemoryRouter>
	);
};

describe('Login Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders login form', () => {
		  const { getByText, getByPlaceholderText } = setupLoginPage();
    
        expect(getByText('LOGIN FORM')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
        expect(getByText('Forgot Password')).toBeInTheDocument();
        expect(getByText('LOGIN')).toBeInTheDocument();
    });

    it('inputs should be initially empty', () => {
      const { getByText, getByPlaceholderText } = setupLoginPage();
  
      	expect(getByPlaceholderText('Enter Your Email').value).toBe('');
      	expect(getByPlaceholderText('Enter Your Password').value).toBe('');
    });
    
    it('should allow typing email and password', () => {
        const { getByPlaceholderText } = setupLoginPage();

        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@gmail.com' } });
        fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password1234' } });
        expect(getByPlaceholderText('Enter Your Email').value).toBe('test@gmail.com');
        expect(getByPlaceholderText('Enter Your Password').value).toBe('password1234');
    });
      
    it('should login the user successfully', async () => {
      const fakeUser = { _id: "fakeUserId", name: "Test User", email: "test@gmail.com", phone: "12345678", address: "123 Test Street", role: "0" };
      const fakeToken = "fakeToken";
      const mockData = { success: true, message: 'Login Successful', user: fakeUser, token: fakeToken };
      axios.post.mockResolvedValueOnce({
              data: mockData
      });

          const { getByPlaceholderText, getByText } = setupLoginPage();

          fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@gmail.com' } });
          fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password1234' } });
          fireEvent.click(getByText('LOGIN'));

          await waitFor(() => expect(axios.post).toHaveBeenCalled());
          expect(toast.success).toHaveBeenCalledWith(mockData.message, {
              duration: 5000,
              icon: '🙏',
              style: {
                  background: 'green',
                  color: 'white'
              }
        });
      // expect(setauth)
      expect(window.localStorage.setItem).toHaveBeenCalledWith("auth", JSON.stringify({user: fakeUser, token: fakeToken}));
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });

	  it('should show error when email is not registered', async () => {
      const mockErrorResponse = { success: false, message: "Email is not registered" };

      axios.post.mockResolvedValueOnce({ data: mockErrorResponse });

      const { getByPlaceholderText, getByText } = setupLoginPage();

      fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'testemailnotregistered@gmail.com' } });
      fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password1234' } });
      fireEvent.click(getByText('LOGIN'));

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.error).toHaveBeenCalledWith(mockErrorResponse.message);
	  });

    it('should catch the error when the user cannot login in', async () => {
		    const mockErrorResponse = { success: false, message: "Login Error, please try again" };

        axios.post.mockRejectedValue({ response: { data: mockErrorResponse } });

        const { getByPlaceholderText, getByText } = setupLoginPage();

        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@gmail.com' } });
        fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password1234' } });
        fireEvent.click(getByText('LOGIN'));

        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        expect(toast.error).toHaveBeenCalledWith(mockErrorResponse.message);
    });

    it("should display default error message if the error is not defined", async () => {
      axios.post.mockRejectedValueOnce(new Error());

      const { getByPlaceholderText, getByText } = setupLoginPage();

      fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@gmail.com' } });
      fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password1234' } });
      fireEvent.click(getByText('LOGIN'));

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });

    it('should navigate to forgot-password page on when forgot password button is clicked', async () => {
      const { getByText } = setupLoginPage();

      fireEvent.click(getByText('Forgot Password'));	

      expect(mockNavigate).toHaveBeenCalledWith("/forgot-password");
    });
});
