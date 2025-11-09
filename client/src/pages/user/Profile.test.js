import axios from 'axios';
import React, { useState, useEffect } from "react";
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from "@testing-library/user-event";
import {useAuth} from '../../context/auth';
import toast from "react-hot-toast";
import { MemoryRouter } from 'react-router-dom';
import Profile from './Profile';


jest.mock('axios');
jest.mock("../../context/auth");
jest.mock("react-hot-toast");
jest.mock("../../components/UserMenu");
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

        const nameInput = await screen.getByPlaceholderText("Enter Your Name");
        const passwordInput = await screen.getByPlaceholderText("Enter Your Password");
        const phoneInput = await screen.getByPlaceholderText("Enter Your Phone");
        const addressInput = await screen.getByPlaceholderText("Enter Your Address");
        const updateButton = await screen.getByRole("button", { name: /UPDATE/i });

        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, newUserData.name);
        await userEvent.clear(passwordInput);
        await userEvent.type(passwordInput, newUserData.password);
        await userEvent.clear(phoneInput);
        await userEvent.type(phoneInput, newUserData.phone);
        await userEvent.clear(addressInput);
        await userEvent.type(addressInput, newUserData.address);
        await userEvent.click(updateButton);

        //assert

        expect(nameInput).toHaveValue(newUserData.name);
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

    test("Logs error and shows predefined error toast msg if error.response is undefined", async() => {
        useAuth.mockReturnValue([{ token: "invalidToken", user: {name: "mockedUser" }}, jest.fn()]);   //invalid token
        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

        axios.put.mockRejectedValue({});

        //Act
        render(
            <MemoryRouter>
                <Profile />
            </MemoryRouter>
        );

        const updateButton = screen.getByRole("button", {name: /UPDATE/i});
        await userEvent.click(updateButton);
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenLastCalledWith({});
        });
        await waitFor(() => {
            expect(toast.error).toHaveBeenLastCalledWith("Something went wrong");
        });
    });
});