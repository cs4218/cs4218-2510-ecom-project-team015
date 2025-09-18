import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import toast from "react-hot-toast";
import Header from "./Header";

// Context & hooks
jest.mock("../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));

jest.mock("../hooks/useCategory", () => jest.fn());

// ✅ Mock useSearch because Header → SearchInput uses it
jest.mock("../context/search", () => ({
  useSearch: jest.fn(),
}));

jest.mock("react-hot-toast");

describe("Header Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Always provide a safe mock for useSearch
    const { useSearch } = require("../context/search");
    useSearch.mockReturnValue([
      { keyword: "", results: [] }, // values
      jest.fn(), // setValues
    ]);
  });

  it("renders brand name and Home link", () => {
    const { useAuth } = require("../context/auth");
    const { useCart } = require("../context/cart");
    const useCategory = require("../hooks/useCategory");

    useAuth.mockReturnValue([null, jest.fn()]);
    useCart.mockReturnValue([[], jest.fn()]);
    useCategory.mockReturnValue([]);

    const { getByText } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(getByText("🛒 Virtual Vault")).toBeInTheDocument();
    expect(getByText("Home")).toBeInTheDocument();
  });

  it("renders Register and Login when no user is logged in", () => {
    const { useAuth } = require("../context/auth");
    const { useCart } = require("../context/cart");
    const useCategory = require("../hooks/useCategory");

    useAuth.mockReturnValue([null, jest.fn()]);
    useCart.mockReturnValue([[], jest.fn()]);
    useCategory.mockReturnValue([]);

    const { getByText } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(getByText("Register")).toBeInTheDocument();
    expect(getByText("Login")).toBeInTheDocument();
  });

  it("renders user dropdown when user is logged in", () => {
    const { useAuth } = require("../context/auth");
    const { useCart } = require("../context/cart");
    const useCategory = require("../hooks/useCategory");

    useAuth.mockReturnValue([
      { user: { name: "John Doe", role: 0 }, token: "mockToken" },
      jest.fn(),
    ]);
    useCart.mockReturnValue([[], jest.fn()]);
    useCategory.mockReturnValue([]);

    const { getByText } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(getByText("John Doe")).toBeInTheDocument();
    expect(getByText("Dashboard")).toBeInTheDocument();
    expect(getByText("Logout")).toBeInTheDocument();
  });

  it("renders categories from useCategory hook", () => {
    const { useAuth } = require("../context/auth");
    const { useCart } = require("../context/cart");
    const useCategory = require("../hooks/useCategory");

    useAuth.mockReturnValue([null, jest.fn()]);
    useCart.mockReturnValue([[], jest.fn()]);
    useCategory.mockReturnValue([{ slug: "electronics", name: "Electronics" }]);

    const { getByText } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(getByText("Electronics")).toBeInTheDocument();
  });

  it("logs out user and shows success toast", () => {
    const setAuth = jest.fn();
    const { useAuth } = require("../context/auth");
    const { useCart } = require("../context/cart");
    const useCategory = require("../hooks/useCategory");

    // Mock auth with a logged-in user
    useAuth.mockReturnValue([
      { user: { name: "Jane Doe", role: 0 }, token: "mockToken" },
      setAuth,
    ]);
    useCart.mockReturnValue([[], jest.fn()]);
    useCategory.mockReturnValue([]);

    // Mock localStorage.removeItem so we can assert on it
    Storage.prototype.removeItem = jest.fn();

    const { getByText } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    fireEvent.click(getByText("Logout"));

    expect(setAuth).toHaveBeenCalledWith({
      user: null,
      token: "",
    });
    expect(localStorage.removeItem).toHaveBeenCalledWith("auth");
    expect(toast.success).toHaveBeenCalledWith("Logout Successfully");
  });
});
