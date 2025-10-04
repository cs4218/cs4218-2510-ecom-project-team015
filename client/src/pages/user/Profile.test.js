import axios from 'axios';
import React, { useState, useEffect } from "react";
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from "@testing-library/user-event";
import {useAuth} from '../../context/auth';
import userMenu from "../../components/UserMenu";
import Layout from "./../../components/Layout";
import toast from "react-hot-toast";
import { MemoryRouter } from 'react-router-dom';
import Profile from './Profile';


jest.mock('axios');
jest.mock("../../context/auth");
jest.mock("react-hot-toast");
toast.success = jest.fn();
toast.error = jest.fn();

// Mocks generated from ChatGPT
jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="mock-layout">{children}</div>
));

Object.defineProperty(window, "localStorage", {
    value: {
        getItem: jest.fn(),
        setItem: jest.fn()
    },
    writable: true
});

describe("Rendering user profile page", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("renders page correctly before any updating is done", async() => {
        
        //arrange
        const auth = {token: "validToken", user: {
            name: "validName",
            email: "valid@email.com",
            phone: "98989898",
            password: "oldHashedPwd",
            address: "example address"}};
        
        useAuth.mockReturnValue([auth, jest.fn()]);
        // act
        render(
            <MemoryRouter>
                <Profile />
            </MemoryRouter>
        );

        //assert
        expect(screen.getByText("USER PROFILE")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter Your Name")).toHaveValue(auth.user.name);
        expect(screen.getByPlaceholderText("Enter Your Email")).toHaveValue(auth.user.email);
        expect(screen.getByPlaceholderText("Enter Your Password")).toHaveValue("");
        expect(screen.getByPlaceholderText("Enter Your Phone")).toHaveValue(auth.user.phone);
        expect(screen.getByPlaceholderText("Enter Your Address")).toHaveValue(auth.user.address);
        expect((screen.getByRole("button"))).toHaveTextContent("UPDATE");
    });
    
    test("returns successful toast message when all updated details are correctly", async() => {
        //arrange
        const auth = {token: "validToken", user: {
            name: "validName",
            email: "valid@email.com",
            phone: "98989898",
            password: "oldHashedPwd",
            address: "example address"}};
        useAuth.mockReturnValue([auth, jest.fn()]);
        
        const newUserData = { 
                name: "newName",
                email: "valid@email.com",
                phone: "97898767",
                password: "newHashedPwd",
                address: "new address"
        };

        axios.put.mockResolvedValue({data: {    //simulates updated values returned from DB
            success: true,
            message: "Profile Updated Successfully",
            updatedUser: newUserData
        }});

        window.localStorage.getItem.mockReturnValue(JSON.stringify(auth));

        // act
        render(
            <MemoryRouter>
                <Profile />
            </MemoryRouter>
        );

        const nameInput = screen.getByPlaceholderText("Enter Your Name");
        const emailInput = screen.getByPlaceholderText("Enter Your Email");
        const passwordInput = screen.getByPlaceholderText("Enter Your Password");
        const phoneInput = screen.getByPlaceholderText("Enter Your Phone");
        const addressInput = screen.getByPlaceholderText("Enter Your Address");
        const updateButton = screen.getByRole("button", { name: /UPDATE/i });

        userEvent.clear(nameInput);
        userEvent.type(nameInput, newUserData.name);
        userEvent.clear(emailInput);
        userEvent.type(emailInput, newUserData.email);
        userEvent.clear(passwordInput);
        userEvent.type(passwordInput, newUserData.password);
        userEvent.clear(phoneInput);
        userEvent.type(phoneInput, newUserData.phone);
        userEvent.clear(addressInput);
        userEvent.type(addressInput, newUserData.address);
        await userEvent.click(updateButton);

        //assert

        expect(nameInput).toHaveValue(newUserData.name);
        expect(emailInput).toHaveValue(newUserData.email);
        expect(phoneInput).toHaveValue(newUserData.phone);
        expect(addressInput).toHaveValue(newUserData.address);
        expect(window.localStorage.getItem).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalled();
    });

    test("displays error toast message if backend rejects", async() => {
        //arrange
        const auth = {token: "invalidToken", user: {
            name: "validName",
            email: "valid@email.com",
            phone: "98989898",
            password: "oldHashedPwd",
            address: "example address"}};
        useAuth.mockReturnValue([auth, jest.fn()]);
        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        const newUserData = { 
                name: "newName",
                email: "valid@email.com",
                phone: "97898767",
                password: "newHashedPwd",
                address: "new address"
        };

        axios.put.mockRejectedValue({
            response: { status: 401, data: { message: "Unauthorized" } }
        });


        // act
        render(
            <MemoryRouter>
                <Profile />
            </MemoryRouter>
        );

        //assert

        const updateButton = screen.getByRole("button", { name: /UPDATE/i });

        await userEvent.click(updateButton);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenLastCalledWith({
                response: { status: 401, data: { message: "Unauthorized" } }
            });
        });
        await waitFor(() => {
            expect(toast.error).toHaveBeenLastCalledWith("Unauthorized");
        });
    });
});