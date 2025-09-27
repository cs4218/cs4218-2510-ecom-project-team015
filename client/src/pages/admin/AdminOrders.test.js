import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import { useAuth } from "../../context/auth";
import AdminOrders from "./AdminOrders";

jest.mock("axios");

jest.mock("../../context/auth");

jest.mock("../../components/Layout", () => ({
	__esModule: true,
	default: ({ children }) => <div data-testid="mock-layout">{children}</div>,
}));

jest.mock("../../components/AdminMenu", () => ({
	__esModule: true,
	default: () => <nav data-testid="mock-admin-menu">Admin Menu</nav>,
}));

// Mock created Using ChatGPT
jest.mock("antd", () => {
	const React = require("react");
	const Select = ({ defaultValue, onChange, children, bordered, ...rest }) => (
		<select
			aria-label="status-select"
			defaultValue={defaultValue}
			onChange={(e) => onChange(e.target.value)}
			data-bordered={bordered}
			{...rest}
		>
			{children}
		</select>
	);
	const Option = ({ value, children }) => <option value={value}>{children}</option>;
	Select.Option = Option;
	return { Select, Option };
});

beforeEach(() => {
	jest.clearAllMocks();
});

describe("Admin Orders component", () => {
	it("renders the All Orders heading", () => {
		useAuth.mockReturnValue([{ token: "abcd12345" }, jest.fn()]);
		axios.get.mockResolvedValue({ data: [] });
		render(<AdminOrders />);
		expect(screen.getByRole("heading", { name: /all orders/i })).toBeInTheDocument();
	});

	it("renders Layout and AdminMenu component", () => {
		useAuth.mockReturnValue([{ token: "abcd12345" }, jest.fn()]);
		axios.get.mockResolvedValue({ data: [] });
		render(<AdminOrders />);
		expect(screen.getByTestId("mock-layout")).toBeInTheDocument();
		expect(screen.getByTestId("mock-admin-menu")).toBeInTheDocument();
	});

	it("calls GET when token exists", async () => {
		useAuth.mockReturnValue([{ token: "abcd12345" }, jest.fn()]);
		axios.get.mockResolvedValue({ data: [] });

		render(<AdminOrders />);

		await waitFor(() => {
			expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
		});
	});

	it("does not call GET when token is missing", async () => {
		useAuth.mockReturnValue([{}, jest.fn()]);
		render(<AdminOrders />);
		await waitFor(() => {
			expect(axios.get).not.toHaveBeenCalled();
		});
	});

	it("displays order data in the table", async () => {
		useAuth.mockReturnValue([{ token: "abcd12345" }, jest.fn()]);
		axios.get.mockResolvedValue({
			data: [
				{
					_id: "order1",
					status: "Processing",
					buyer: { name: "Sarah Jones" },
					createAt: new Date().toISOString(),
					payment: { success: true },
					products: [
						{
							_id: "p1",
							name: "Novel",
							description: "A bestselling novel",
							price: 15,
						},
						{ _id: "p2", name: "Smartphone", description: "A high-end smartphone", price: 999 },
					],
				},
			],
		});

		render(<AdminOrders />);

		expect(await screen.findByText("Sarah Jones")).toBeInTheDocument();
		expect(screen.getByText("Success")).toBeInTheDocument();
		expect(screen.getByText("Novel")).toBeInTheDocument();
		expect(screen.getByText("Smartphone")).toBeInTheDocument();
		expect(screen.getByText("2")).toBeInTheDocument();
		expect(screen.getByDisplayValue("Processing")).toBeInTheDocument();
	});

	it("updates status via PUT and refetches orders", async () => {
		useAuth.mockReturnValue([{ token: "abc123" }, jest.fn()]);
		axios.get.mockResolvedValue({
			data: [
				{
					_id: "order1",
					status: "Processing",
					buyer: { name: "Sarah Jones" },
					createAt: new Date().toISOString(),
					payment: { success: true },
					products: [],
				},
			],
		});
		axios.put.mockResolvedValue({ data: {} });

		render(<AdminOrders />);

		const select = await screen.findByDisplayValue("Processing");

		fireEvent.change(select, { target: { value: "Shipped" } });
		await waitFor(() => {
			expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/order-status/order1", {
				status: "Shipped",
			});
		});

		await waitFor(() => {
			expect(axios.get).toHaveBeenCalledTimes(2);
		});
	});

	it("renders Failed when payment.success is false", async () => {
		useAuth.mockReturnValue([{ token: "abc123" }, jest.fn()]);
		axios.get.mockResolvedValue({
			data: [
				{
					_id: "o1",
					status: "Processing",
					buyer: { name: "Kieta" },
					createAt: new Date().toISOString(),
					payment: { success: false },
					products: [],
				},
			],
		});

		render(<AdminOrders />);

		expect(await screen.findByText("Failed")).toBeInTheDocument();
	});

	it("shows quantity 0 when there are no products", async () => {
		useAuth.mockReturnValue([{ token: "abcd123" }, jest.fn()]);
		axios.get.mockResolvedValue({
			data: [
				{
					_id: "o1",
					status: "Processing",
					buyer: { name: "Alice" },
					createAt: new Date().toISOString(),
					payment: { success: true },
					products: [],
				},
			],
		});

		render(<AdminOrders />);
		expect(await screen.findByText("0")).toBeInTheDocument();
	});

	it("swallows errors on GET without crashing", async () => {
		useAuth.mockReturnValue([{ token: "abcd12345" }, jest.fn()]);
		axios.get.mockRejectedValue(new Error("network down"));
		render(<AdminOrders />);
		expect(screen.getByRole("heading", { name: /all orders/i })).toBeInTheDocument();
	});

	// Created Using ChatGPT
	// Tests error handling paths to ensure no crashes occur
	// when the API calls fail.
	it("swallows errors on PUT without crashing", async () => {
		useAuth.mockReturnValue([{ token: "abc123" }, jest.fn()]);
		axios.get.mockResolvedValue({
			data: [
				{
					_id: "order1",
					status: "Processing",
					buyer: { name: "Sarah Jones" },
					createAt: new Date().toISOString(),
					payment: { success: true },
					products: [],
				},
			],
		});
		axios.put.mockRejectedValue(new Error("server error"));

		render(<AdminOrders />);

		const select = await screen.findByDisplayValue("Processing");
		fireEvent.change(select, { target: { value: "cancel" } });
		await waitFor(() => {
			expect(axios.put).toHaveBeenCalled();
		});
		expect(screen.getByRole("heading", { name: /all orders/i })).toBeInTheDocument();
	});
});
