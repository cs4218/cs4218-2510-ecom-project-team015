// Written by Ujjwal Gaurav
// This test file checks the admin orders functionality in admin dashboard
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AdminOrders from "../../pages/admin/AdminOrders";
import axios from "axios";
import toast from "react-hot-toast";

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

// Created using ChatGPT
jest.mock("antd", () => {
	const React = require("react");
	const Select = ({ value, defaultValue, onChange, children, placeholder }) => {
		const props =
			value !== undefined
				? { value }
				: { defaultValue: defaultValue !== undefined ? defaultValue : "" };
		return (
			<select
				aria-label={placeholder || "select"}
				onChange={(e) => onChange(e.target.value)}
				{...props}
			>
				{React.Children.map(children, (c) => c)}
			</select>
		);
	};
	Select.Option = ({ value, children }) => <option value={value}>{children}</option>;
	return { __esModule: true, Select };
});

jest.mock("axios", () => ({
	__esModule: true,
	default: { get: jest.fn(), put: jest.fn() },
}));

jest.mock("react-hot-toast", () => ({
	__esModule: true,
	default: { success: jest.fn(), error: jest.fn() },
}));

// Created sample data using ChatGPT
const orders = [
	{
		_id: "o1",
		status: "Processing",
		buyer: { name: "User1" },
		createdAt: "2024-01-01T00:00:00.000Z",
		payment: { success: true },
		products: [{ _id: "p1", name: "Lamp", description: "Bright metal lamp", price: 10 }],
	},
	{
		_id: "o2",
		status: "Not Processed",
		buyer: { name: "User2" },
		createdAt: "2024-01-02T00:00:00.000Z",
		payment: { success: false },
		products: [
			{ _id: "p2", name: "Chair", description: "Wood chair lorem ipsum", price: 20 },
			{ _id: "p3", name: "Desk", description: "Desk abcdefghijklmnop", price: 50 },
		],
	},
];

function renderPage() {
	return render(
		<MemoryRouter initialEntries={["/dashboard/admin/orders"]}>
			<Routes>
				<Route path="/dashboard/admin/orders" element={<AdminOrders />} />
			</Routes>
		</MemoryRouter>
	);
}

afterEach(() => {
	jest.clearAllMocks();
});

describe("AdminOrders", () => {
	test("load all the orders in rows when auth token exists", async () => {
		mockUseAuth = jest.fn().mockReturnValue([{ token: "t", user: { name: "Admin" } }]);
		axios.get.mockResolvedValueOnce({ data: orders });

		renderPage();

		await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders"));

		expect(await screen.findByRole("heading", { name: /all orders/i })).toBeInTheDocument();
		expect(screen.getByText("User1")).toBeInTheDocument();
		expect(screen.getByText("User2")).toBeInTheDocument();

		expect(screen.getByText("Success")).toBeInTheDocument();
		expect(screen.getByText("Failed")).toBeInTheDocument();
		expect(screen.getAllByRole("row").length).toBeGreaterThan(1);

		const selects = screen.getAllByLabelText(/select/i);
		expect(selects[0]).toHaveValue("Processing");
		expect(selects[1]).toHaveValue("Not Processed");

		expect(screen.getByText("Lamp")).toBeInTheDocument();
		expect(screen.getByText("Chair")).toBeInTheDocument();
		expect(screen.getByText("Desk")).toBeInTheDocument();
	});

	test("verify if changing order status calls PUT request and refetches all the orders", async () => {
		mockUseAuth = jest.fn().mockReturnValue([{ token: "t", user: { name: "Admin" } }]);
		axios.get.mockResolvedValueOnce({ data: orders }).mockResolvedValueOnce({ data: orders });
		axios.put.mockResolvedValueOnce({ data: { success: true } });

		const user = userEvent.setup();
		renderPage();

		const selects = await screen.findAllByLabelText(/select/i);
		await user.selectOptions(selects[1], "Shipped");

		expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/order-status/o2", {
			status: "Shipped",
		});
		await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
	});

	test("show a toast error when updating order status fails", async () => {
		mockUseAuth = jest.fn().mockReturnValue([{ token: "t", user: { name: "Admin" } }]);
		axios.get.mockResolvedValueOnce({ data: orders });
		axios.put.mockRejectedValueOnce(new Error("boom"));

		const user = userEvent.setup();
		renderPage();

		const selects = await screen.findAllByLabelText(/select/i);
		await user.selectOptions(selects[0], "Shipped"); 

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith("Something went wrong while updating order status")
		);
		expect(axios.get).toHaveBeenCalledTimes(1);
	});

	test("verify that it doesn't fetch any order when auth token doesn't exist", async () => {
		mockUseAuth = jest.fn().mockReturnValue([{ token: undefined }]);

		renderPage();
		await new Promise((r) => setTimeout(r, 0));
		expect(axios.get).not.toHaveBeenCalled();
	});

	test("show a toast error when we have unexpected error such as network or server down", async () => {
		mockUseAuth.mockReturnValue([{ token: "t", user: { name: "Admin" } }]);
		axios.get.mockRejectedValueOnce(new Error("down"));

		renderPage();

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith("Something went wrong while fetching orders")
		);
	});
});
