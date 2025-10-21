// Author: Adhitya
// This test simulates integration between frontend profile component and backend api to ensure it loads data correctly, updates page when successful, display toast when failed.
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import toast from "react-hot-toast";
import { MemoryRouter } from "react-router-dom";
import Profile from "../pages/user/Profile";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import { useSearch } from "../context/search";

jest.mock("../context/auth");
jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../context/cart");
jest.mock("../context/search");

// Tests generated with AI
describe("Profile Integration Tests", () => {
  let mockSetAuth;
  let oldMockedUser;
  beforeEach(() => {
    mockSetAuth = jest.fn();
    localStorage.clear();
    toast.success.mockClear();
    toast.error.mockClear();
    axios.put.mockReset();
    oldMockedUser = {
          name: "Alice",
          email: "alice@mail.com",
          phone: "98765432",
          address: "SG",
    };
    useAuth.mockReturnValue([
      {
        token: "mockToken",
        user: oldMockedUser,
      },
      mockSetAuth, // userAuth mocked to return mocked set fn and value
    ]);

    useCart.mockReturnValue([[], jest.fn()]); //mocked cart hook
    useSearch.mockReturnValue(["", jest.fn()]); //mocked search hook
      
  });
  const renderProfile = () => {
    const initialAuth =
      JSON.parse(
        JSON.stringify({
          token: "mockToken",
          user: oldMockedUser,
        })
      );
    localStorage.setItem("auth", JSON.stringify(initialAuth));

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );
  };

  test("loads user data from context and displays correctly", async () => {
    renderProfile();

    expect(await screen.findByDisplayValue("Alice")).toBeInTheDocument();
    expect(screen.getByDisplayValue("alice@mail.com")).toBeDisabled();
    expect(screen.getByDisplayValue("98765432")).toBeInTheDocument();
  });

  test("updates user profile successfully and syncs context", async () => {
    const updatedUser = {
      name: "Bob",
      email: "alice@mail.com",
      phone: "90000000",
      address: "Singapore",
    };

    axios.put.mockResolvedValueOnce({
      data: { updatedUser, success: true },
    });

    renderProfile();

    const nameInput = await screen.findByPlaceholderText("Enter Your Name");
    const phoneInput = screen.getByPlaceholderText("Enter Your Phone");
    const addressInput = screen.getByPlaceholderText("Enter Your Address");
    const updateButton = screen.getByRole("button", { name: /update/i });

    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, updatedUser.name);
    await userEvent.clear(phoneInput);
    await userEvent.type(phoneInput, updatedUser.phone);
    await userEvent.clear(addressInput);
    await userEvent.type(addressInput, updatedUser.address);
    await userEvent.click(updateButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/auth/profile",
        expect.objectContaining(updatedUser)
      );
    });

    // now mockSetAuth exists and can be asserted
    expect(mockSetAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        user: updatedUser,
      })
    );
    expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully");

    const stored = JSON.parse(localStorage.getItem("auth"));
    expect(stored.user).toEqual(updatedUser);
  });

  test("shows fallback toast if backend error has no response", async () => {
    axios.put.mockRejectedValueOnce({}); // simulate network error

    renderProfile();

    await userEvent.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });
});
