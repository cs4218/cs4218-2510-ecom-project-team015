import React from "react";
import { render, screen } from "@testing-library/react";
import AdminDashboard from "./AdminDashboard";

// Mock the useAuth hook from the auth context
jest.mock("../../context/auth", () => ({
	useAuth: jest.fn(),
}));

// Mock the Layout component 
jest.mock("../../components/Layout", () => ({
	__esModule: true,
	default: ({ children }) => <div data-testid="mock-layout">{children}</div>,
}));

// Mock the AdminMenu component 
jest.mock("../../components/AdminMenu", () => ({
	__esModule: true,
	default: () => <nav data-testid="mock-admin-menu">Admin Menu</nav>,
}));

const { useAuth } = jest.requireMock("../../context/auth");

describe("Admin Dashboard Component", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		useAuth.mockReturnValue([
			{
				user: {
					name: "Sarah Jones",
					email: "sarahjones@admin.com",
					phone: "80809090",
				},
			},
			jest.fn(),
		]);
	});

	it("shows admin details after login", () => {
		render(<AdminDashboard />);
		expect(screen.getByText(/admin name\s*:\s*sarah jones/i)).toBeInTheDocument();
		expect(screen.getByText(/admin email\s*:\s*sarahjones@admin\.com/i)).toBeInTheDocument();
		expect(screen.getByText(/admin contact\s*:\s*80809090/i)).toBeInTheDocument();
	});

	it("renders Layout and AdminMenu", () => {
		render(<AdminDashboard />);
		expect(screen.getByTestId("mock-layout")).toBeInTheDocument();
		expect(screen.getByTestId("mock-admin-menu")).toBeInTheDocument();
	});

	it("handles any missing user", () => {
		useAuth.mockReturnValue([{}, jest.fn()]);
		render(<AdminDashboard />);
		expect(screen.getByText(/admin name\s*:/i)).toBeInTheDocument();
		expect(screen.getByText(/admin email\s*:/i)).toBeInTheDocument();
		expect(screen.getByText(/admin contact\s*:/i)).toBeInTheDocument();
		expect(screen.queryByText(/sarah/i)).toBeNull();
	});

	it("handles any partial user fields", () => {
		useAuth.mockReturnValue([{ user: { name: "Test Admin", email: "test@admin.com" } }, jest.fn()]);
		render(<AdminDashboard />);
		expect(screen.getByText(/admin name\s*:\s*test admin/i)).toBeInTheDocument();
		expect(screen.getByText(/admin email\s*:\s*bob@admin\.com/i)).toBeInTheDocument();
		expect(screen.getByText(/admin contact\s*:/i)).toBeInTheDocument();
		expect(screen.queryByText(/\d/)).toBeNull();
	});
});
