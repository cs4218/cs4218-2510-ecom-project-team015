import React from "react";
import { render, screen } from "@testing-library/react";
import { useAuth, AuthProvider } from "./auth.js";
import axios from "axios";

// Mock axios defaults
jest.mock("axios", () => ({
  defaults: { headers: { common: {} } },
}));

// Test component to be used in the AuthProvider context
const TestComponent = () => {
  const [auth] = useAuth();
  return (
    <div>
      <span data-testid="user">{auth.user ? auth.user.name : "no-user"}</span>
      <span data-testid="token">{auth.token}</span>
    </div>
  );
};

describe("AuthProvider", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // reset axios headers
    axios.defaults.headers.common["Authorization"] = "";
  });

  it("should provide default auth state when there is no auth in localStorage", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("user")).toHaveTextContent("no-user");
    expect(screen.getByTestId("token")).toHaveTextContent("");
    expect(axios.defaults.headers.common["Authorization"]).toBe("");
  });

  it("should read auth from localStorage when available", () => {
    const mockAuth = { user: { name: "Aiken" }, token: "mock-token" };
    localStorage.setItem("auth", JSON.stringify(mockAuth)); 

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("user")).toHaveTextContent("Aiken");
    expect(screen.getByTestId("token")).toHaveTextContent("mock-token");
    expect(axios.defaults.headers.common["Authorization"]).toBe("mock-token");
  });
});
