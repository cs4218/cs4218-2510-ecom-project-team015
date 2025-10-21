// Written by Ujjwal Gaurav
// This test file checks the admin dashboard page integration
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminDashboard from "../../pages/admin/AdminDashboard";

jest.mock("../../components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));

jest.mock("../../components/AdminMenu", () => ({
  __esModule: true,
  default: () => <div aria-label="admin-menu">AdminMenu</div>,
}));

let mockUseAuth;

jest.mock("../../context/auth", () => ({
  __esModule: true,
  useAuth: (...args) => mockUseAuth?.(...args),
}));

afterEach(() => jest.clearAllMocks());

describe("Admin Dashboard", () => {
  test("verify if it renders the admin details on the dashboard", () => {
    mockUseAuth = jest.fn().mockReturnValue([
      { user: { name: "Ada Admin", email: "ada@example.com", phone: "81234567" }, token: "t" },
    ]);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(screen.getByTestId("layout")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /admin name : ada admin/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /admin email : ada@example\.com/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /admin contact : 81234567/i })).toBeInTheDocument();
  });

  test("verify if it tolerates any missing user details", () => {
    mockUseAuth = jest.fn().mockReturnValue([{}]);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/admin name/i)).toBeInTheDocument();
    expect(screen.getByText(/admin email/i)).toBeInTheDocument();
    expect(screen.getByText(/admin contact/i)).toBeInTheDocument();
  });
});
