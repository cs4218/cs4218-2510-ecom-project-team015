import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import ForgotPassword from "./ForgotPassword.js";

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

const setupFogotPasswordPage = () => {
    render(
        <MemoryRouter initialEntries={['/forgot-password']}>
            <Routes>
                <Route path="/forgot-password" element={<ForgotPassword />} />
            </Routes>
        </MemoryRouter>
    );
}

describe("ForgotPassword Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    it("should render the forgot password page", () => {
        setupFogotPasswordPage();
        
        expect(screen.getByText("FORGOT PASSWORD")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter Your Email")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter Your Favorite Sport")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter New Password")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "RESET PASSWORD" })).toBeInTheDocument();
    });

    it("should allow users to type in the required fields", () => {
        setupFogotPasswordPage();

        const emailInput = screen.getByPlaceholderText("Enter Your Email");
        const sportInput = screen.getByPlaceholderText("Enter Your Favorite Sport");
        const passwordInput = screen.getByPlaceholderText("Enter New Password");

        fireEvent.change(emailInput, { target: { value: "test@gmail.com" } });
        fireEvent.change(sportInput, {target: { value: "Football" }});
        fireEvent.change(passwordInput, {target: { value: "password1234" }});

        expect(emailInput).toHaveValue("test@gmail.com");
        expect(sportInput).toHaveValue("Football");
        expect(passwordInput).toHaveValue("password1234");
    });

    it("should allow users to reset their password", async () => {
        axios.post.mockResolvedValueOnce({ 
            data: {
                success: true,
                message: "Password Reset Successfully",
            }
        });

        setupFogotPasswordPage();

        const emailInput = screen.getByPlaceholderText("Enter Your Email");
        const sportInput = screen.getByPlaceholderText("Enter Your Favorite Sport");
        const passwordInput = screen.getByPlaceholderText("Enter New Password");

        fireEvent.change(emailInput, { target: { value: "test@gmail.com" } });
        fireEvent.change(sportInput, {target: { value: "Football" }});
        fireEvent.change(passwordInput, {target: { value: "password1234" }});

        fireEvent.click(screen.getByText("RESET PASSWORD"));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalled();
            expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/forgot-password",
                { email: "test@gmail.com", newPassword: "password1234", answer: "Football" }
            );
            expect(toast.success).toHaveBeenCalledWith("Password Reset Successfully");
            expect(mockNavigate).toHaveBeenCalledWith("/login");
        });
    });

    it("should display error message when password reset fails", async () => {
        axios.post.mockResolvedValueOnce({
            data: {
                success: false,
                message: "Wrong Email Or Answer",
            }
        });

        setupFogotPasswordPage();

        const emailInput = screen.getByPlaceholderText("Enter Your Email");
        const sportInput = screen.getByPlaceholderText("Enter Your Favorite Sport");
        const passwordInput = screen.getByPlaceholderText("Enter New Password");

        fireEvent.change(emailInput, { target: { value: "wrongemail@gmail.com" } });
        fireEvent.change(sportInput, {target: { value: "Football" }});
        fireEvent.change(passwordInput, {target: { value: "password1234" }});

        fireEvent.click(screen.getByText("RESET PASSWORD"));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalled();
            expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/forgot-password",
                { email: "wrongemail@gmail.com", newPassword: "password1234", answer: "Football" }
            );
            expect(toast.error).toHaveBeenCalledWith("Wrong Email Or Answer");
        });
    });

    it("should display default errors when password reset fails", async () => {
        axios.post.mockRejectedValueOnce(new Error());

        setupFogotPasswordPage();

        const emailInput = screen.getByPlaceholderText("Enter Your Email");
        const sportInput = screen.getByPlaceholderText("Enter Your Favorite Sport");
        const passwordInput = screen.getByPlaceholderText("Enter New Password");

        fireEvent.change(emailInput, { target: { value: "test@gmail.com" } });
        fireEvent.change(sportInput, {target: { value: "Football" }});
        fireEvent.change(passwordInput, {target: { value: "password1234" }});

        fireEvent.click(screen.getByText("RESET PASSWORD"));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalled();
            expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/forgot-password",
                { email: "test@gmail.com", newPassword: "password1234", answer: "Football" }
            );
            expect(toast.error).toHaveBeenCalledWith("Something went wrong");
        });
    });

    it("should display specific error message when password reset fails", async () => {
        const errorResponse = { response: { data: { message: "Network Error" } } };

        axios.post.mockRejectedValueOnce(errorResponse);

        setupFogotPasswordPage();

        const emailInput = screen.getByPlaceholderText("Enter Your Email");
        const sportInput = screen.getByPlaceholderText("Enter Your Favorite Sport");
        const passwordInput = screen.getByPlaceholderText("Enter New Password");

        fireEvent.change(emailInput, { target: { value: "test@gmail.com" } });
        fireEvent.change(sportInput, {target: { value: "Football" }});
        fireEvent.change(passwordInput, {target: { value: "password1234" }});

        fireEvent.click(screen.getByText("RESET PASSWORD"));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalled();
            expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/forgot-password",
                { email: "test@gmail.com", newPassword: "password1234", answer: "Football" }
            );
            expect(toast.error).toHaveBeenCalledWith("Network Error");
        });
    });
});