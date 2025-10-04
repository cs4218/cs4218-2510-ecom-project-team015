import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import { useAuth } from "../../context/auth";
import AdminOrders from "./AdminOrders";

jest.mock("axios");

jest.mock("../../context/auth");

jest.mock("./../../components/Layout", () => ({
	__esModule: true,
	default: ({ title, children }) => (
		<div data-testid="mock-layout" data-title={title}>
			{children}
		</div>
	),
}));

jest.mock("../../components/AdminMenu", () => ({
	__esModule: true,
	default: () => <nav data-testid="mock-admin-menu">Admin Menu</nav>,
}));

jest.mock("moment", () => () => ({ fromNow: () => "3 hours ago" }));

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

const withToken = (token = "token123") => useAuth.mockReturnValue([{ token }, jest.fn()]);

describe("Admin Orders component", () => {
	it("renders Layout, AdminMenu, page heading and the correct Layout title", () => {
		withToken();
		axios.get.mockResolvedValue({ data: [] });

		render(<AdminOrders />);

		const layout = screen.getByTestId("mock-layout");
		expect(layout).toBeInTheDocument();
		expect(layout).toHaveAttribute("data-title", "All Orders Data");
		expect(screen.getByTestId("mock-admin-menu")).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: /all orders/i, level: 1 })).toBeInTheDocument();
	});

	it("fetches orders when auth token is present", async () => {
		withToken();
		axios.get.mockResolvedValue({ data: [] });
		render(<AdminOrders />);
		await waitFor(() => {
			expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
		});
	});

	it("does not fetch orders when auth token is missing", async () => {
		withToken("");
		render(<AdminOrders />);
		await waitFor(() => {
			expect(axios.get).not.toHaveBeenCalled();
		});
	});

	it("displays order data in the table", async () => {
		withToken();

		axios.get.mockResolvedValue({
			data: [
				{
					_id: "order1",
					status: "Processing",
					buyer: { name: "Sarah Jones" },
					createdAt: new Date().toISOString(),
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

	it("updates order status via PUT and then refetches once", async () => {
		withToken();
		axios.get.mockResolvedValueOnce({
			data: [
				{
					_id: "order1",
					status: "Processing",
					buyer: { name: "Sarah" },
					createdAt: new Date().toISOString(),
					payment: { success: true },
					products: [],
				},
			],
		});
		axios.put.mockResolvedValue({ data: {} });

		axios.get.mockResolvedValueOnce({ data: [] });

		render(<AdminOrders />);

		const select = await screen.findByDisplayValue("Processing");
		fireEvent.change(select, { target: { value: "Shipped" } });

		await waitFor(() =>
			expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/order-status/order1", {
				status: "Shipped",
			})
		);

		await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
	});

	it("shows Failed when payment is unsuccessful", async () => {
		withToken();
		axios.get.mockResolvedValue({
			data: [
				{
					_id: "o1",
					status: "Processing",
					buyer: { name: "Kieta" },
					createdAt: new Date().toISOString(),
					payment: { success: false },
					products: [],
				},
			],
		});

		render(<AdminOrders />);

		expect(await screen.findByText("Failed")).toBeInTheDocument();
	});

	it("shows quantity 0 when products are empty", async () => {
		withToken();
		axios.get.mockResolvedValue({
			data: [
				{
					_id: "o1",
					status: "Processing",
					buyer: { name: "Alice" },
					createdAt: new Date().toISOString(),
					payment: { success: true },
					products: [],
				},
			],
		});

		render(<AdminOrders />);
		expect(await screen.findByText("0")).toBeInTheDocument();
	});

	it("updates the correct order when multiple orders are present", async () => {
		withToken();
		axios.get.mockResolvedValue({
			data: [
				{
					_id: "o1",
					status: "Processing",
					buyer: { name: "A" },
					createdAt: new Date().toISOString(),
					payment: { success: true },
					products: [],
				},
				{
					_id: "o2",
					status: "Not Processed",
					buyer: { name: "B" },
					createdAt: new Date().toISOString(),
					payment: { success: false },
					products: [],
				},
			],
		});
		axios.put.mockResolvedValue({ data: {} });

		render(<AdminOrders />);

		const selectO1 = await screen.findByDisplayValue("Processing");
		const selectO2 = screen.getByDisplayValue("Not Processed");

		fireEvent.change(selectO2, { target: { value: "Cancelled" } });

		await waitFor(() =>
			expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/order-status/o2", {
				status: "Cancelled",
			})
		);

		expect(axios.put).not.toHaveBeenCalledWith("/api/v1/auth/order-status/o1", expect.anything());
	});

	// Created Using ChatGPT
	it("GET failure: page remains stable without crashing", async () => {
		const spy = jest.spyOn(console, "log").mockImplementation(() => {});
		withToken();
		axios.get.mockRejectedValue(new Error("network down"));

		render(<AdminOrders />);

		expect(screen.getByRole("heading", { name: /all orders/i })).toBeInTheDocument();
		spy.mockRestore();
	});

	// Created Using ChatGPT
	it("PUT failure: page remains stable without crashing", async () => {
		withToken();
		axios.get.mockResolvedValue({
			data: [
				{
					_id: "order1",
					status: "Processing",
					buyer: { name: "Sarah Jones" },
					createdAt: new Date().toISOString(),
					payment: { success: true },
					products: [],
				},
			],
		});
		axios.put.mockRejectedValue(new Error("server error"));

		render(<AdminOrders />);

		const select = await screen.findByDisplayValue("Processing");
		fireEvent.change(select, { target: { value: "Cancelled" } });
		await waitFor(() => {
			expect(axios.put).toHaveBeenCalled();
		});
		expect(screen.getByRole("heading", { name: /all orders/i })).toBeInTheDocument();
	});

	// Created using ChatGPT
	it("is resilient to missing fields (no buyer / products undefined)", async () => {
		withToken();
		axios.get.mockResolvedValue({
			data: [
				{
					_id: "o1",
					status: "Processing",
					buyer: undefined,
					createdAt: new Date().toISOString(),
					payment: { success: true },
					products: undefined,
				},
			],
		});

		render(<AdminOrders />);

		expect(await screen.findByDisplayValue("Processing")).toBeInTheDocument();
		expect(screen.getByText("3 hours ago")).toBeInTheDocument();
	});

});
