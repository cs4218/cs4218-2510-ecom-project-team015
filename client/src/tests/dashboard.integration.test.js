import React from 'react';
import { render, screen } from "@testing-library/react";
import Dashboard from "../pages/user/Dashboard";
import { AuthProvider } from "../context/auth";
import { MemoryRouter } from "react-router-dom";


//Mock the entire layout and place children in the mock
jest.mock("../components/Layout", () => ({ children }) => (
  <div data-testid="mock-layout">{children}</div>
));

describe("Dashboard integration test", () => {
  const fakeAuth = {
    user: {
      name: "Adhitya",
      email: "adhitya@example.com",
      address: "Singapore",
    },
    token: "valid-token",
  };

  beforeEach(() => {
    localStorage.setItem("auth", JSON.stringify(fakeAuth));
  });

  afterEach(() => {
    localStorage.clear();
  });

  test("loads user data from AuthProvider and renders UserMenu", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </MemoryRouter>
    );

    // checks integration between context and Dashboard
    expect(screen.getByText("Adhitya")).toBeInTheDocument();
    expect(screen.getByText("adhitya@example.com")).toBeInTheDocument();
    expect(screen.getByText("Singapore")).toBeInTheDocument();

    // ensures UserMenu renders
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();

    // layout mock is present, proving wrapper works
    expect(screen.getByTestId("mock-layout")).toBeInTheDocument();
  });
});