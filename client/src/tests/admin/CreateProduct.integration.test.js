// Written by Ujjwal Gaurav
// This test file checks the create product functionality in admin dashboard
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import CreateProduct from "../../pages/admin/CreateProduct";
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

// Created using ChatGPT
jest.mock("antd", () => {
	const React = require("react");
	const Select = ({ value, onChange, children, placeholder }) => (
		<select
			aria-label={placeholder || "select"}
			value={value ?? ""}
			onChange={(e) => onChange(e.target.value)}
		>
			<option value="" disabled>
				{placeholder || "Select"}
			</option>
			{React.Children.map(children, (c) => c)}
		</select>
	);
	Select.Option = ({ value, children }) => <option value={value}>{children}</option>;
	return { __esModule: true, Select };
});

jest.mock("axios", () => ({
	__esModule: true,
	default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock("react-hot-toast", () => ({
	__esModule: true,
	default: { success: jest.fn(), error: jest.fn() },
}));

beforeAll(() => {
	global.URL.createObjectURL = jest.fn(() => "blob:test");
});

afterEach(() => {
	jest.clearAllMocks();
});

function renderPage() {
	return render(
		<MemoryRouter initialEntries={["/dashboard/admin/create-product"]}>
			<Routes>
				<Route path="/dashboard/admin/create-product" element={<CreateProduct />} />
				<Route path="/dashboard/admin/products" element={<div>All Products List</div>} />
			</Routes>
		</MemoryRouter>
	);
}

// Created using ChatGPT
function makeFile(sizeBytes, name = "photo.jpg", type = "image/jpeg") {
	const f = new File(["x".repeat(10)], name, { type });
	Object.defineProperty(f, "size", { value: sizeBytes });
	return f;
}

describe("Create Product", () => {
	test("check if it creates a product with valid input and redirects to products page", async () => {
		axios.get.mockResolvedValueOnce({
			data: { success: true, category: [{ _id: "c1", name: "Home" }] },
		});
		axios.post.mockResolvedValueOnce({ data: { success: true } });

		const user = userEvent.setup();
		renderPage();

		const catSelect = await screen.findByLabelText(/select a category/i);
		await user.selectOptions(catSelect, "c1");

		await user.type(screen.getByPlaceholderText(/write a name/i), "Desk Lamp");
		await user.type(screen.getByPlaceholderText(/write a description/i), "Metal lamp");
		await user.clear(screen.getByPlaceholderText(/write a price/i));
		await user.type(screen.getByPlaceholderText(/write a price/i), "13.5");
		await user.clear(screen.getByPlaceholderText(/write a quantity/i));
		await user.type(screen.getByPlaceholderText(/write a quantity/i), "7");
		await user.selectOptions(screen.getByLabelText(/select shipping/i), "1");

		const fileInput = screen.getByLabelText(/upload photo/i, { selector: "input" });
		await user.upload(fileInput, makeFile(200_000));

		await user.click(screen.getByRole("button", { name: /create product/i }));

		expect(axios.post).toHaveBeenCalledTimes(1);
		const [url, fd] = axios.post.mock.calls[0];

		expect(url).toBe("/api/v1/product/create-product");
		expect(fd instanceof FormData).toBe(true);
		const entries = Object.fromEntries(fd.entries());
		expect(entries).toMatchObject({
			name: "Desk Lamp",
			description: "Metal lamp",
			price: "13.5",
			quantity: "7",
			category: "c1",
		});
		expect(entries.photo).toBeInstanceOf(File);

		await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Product Created Successfully"));
		expect(await screen.findByText(/all products list/i)).toBeInTheDocument();
	});

	test("show toast error when there is missing fields or validation error", async () => {
		axios.get.mockResolvedValueOnce({
			data: { success: true, category: [{ _id: "c1", name: "Home" }] },
		});

		const user = userEvent.setup();
		renderPage();

		await user.click(screen.getByRole("button", { name: /create product/i }));
		expect(toast.error).toHaveBeenCalledWith("Name is required");

		// invalid price and quantity
		await user.selectOptions(await screen.findByLabelText(/select a category/i), "c1");
		await user.type(screen.getByPlaceholderText(/write a name/i), "X");
		await user.type(screen.getByPlaceholderText(/write a description/i), "Y");
		await user.type(screen.getByPlaceholderText(/write a price/i), "0"); // invalid
		await user.type(screen.getByPlaceholderText(/write a quantity/i), "1.5"); // invalid

		await user.click(screen.getByRole("button", { name: /create product/i }));
		expect(axios.post).not.toHaveBeenCalled();
		expect(toast.error).toHaveBeenCalled(); 
	});

	test("shows a toast error when photo is > 1MB", async () => {
		axios.get.mockResolvedValueOnce({
			data: { success: true, category: [{ _id: "c1", name: "Home" }] },
		});

		const user = userEvent.setup();
		renderPage();

		const big = makeFile(1_500_000, "big.jpg");
		const fileInput = screen.getByLabelText(/upload photo/i, { selector: "input" });
		await user.upload(fileInput, big);

		await user.selectOptions(await screen.findByLabelText(/select a category/i), "c1");
		await user.type(screen.getByPlaceholderText(/write a name/i), "Desk");
		await user.type(screen.getByPlaceholderText(/write a description/i), "Desc");
		await user.type(screen.getByPlaceholderText(/write a price/i), "10");
		await user.type(screen.getByPlaceholderText(/write a quantity/i), "2");

		await user.click(screen.getByRole("button", { name: /create product/i }));
		expect(toast.error).toHaveBeenCalledWith("Photo must be ≤ 1MB");
		expect(axios.post).not.toHaveBeenCalled();
	});

	test("show a toast error when server return {success:false}", async () => {
		axios.get.mockResolvedValueOnce({
			data: { success: true, category: [{ _id: "c1", name: "Home" }] },
		});
		axios.post.mockResolvedValueOnce({ data: { success: false, message: "Bad data" } });

		const user = userEvent.setup();
		renderPage();

		await user.selectOptions(await screen.findByLabelText(/select a category/i), "c1");
		await user.type(screen.getByPlaceholderText(/write a name/i), "Desk");
		await user.type(screen.getByPlaceholderText(/write a description/i), "Desc");
		await user.type(screen.getByPlaceholderText(/write a price/i), "10");
		await user.type(screen.getByPlaceholderText(/write a quantity/i), "2");

		const fileInput = screen.getByLabelText(/upload photo/i, { selector: "input" });
		await user.upload(fileInput, makeFile(200_000));

		await user.click(screen.getByRole("button", { name: /create product/i }));
		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Bad data"));
		expect(screen.queryByText(/all products list/i)).not.toBeInTheDocument();
	});

	test("send status 409 when product already exists; 400 for invalid product", async () => {
		axios.get.mockResolvedValueOnce({
			data: { success: true, category: [{ _id: "c1", name: "Home" }] },
		});

		axios.post
			.mockRejectedValueOnce({ response: { status: 409, data: {} } })
			.mockRejectedValueOnce({ response: { status: 400, data: {} } });

		const user = userEvent.setup();
		renderPage();

		await user.selectOptions(await screen.findByLabelText(/select a category/i), "c1");
		await user.type(screen.getByPlaceholderText(/write a name/i), "Desk");
		await user.type(screen.getByPlaceholderText(/write a description/i), "Desc");
		await user.type(screen.getByPlaceholderText(/write a price/i), "10");
		await user.type(screen.getByPlaceholderText(/write a quantity/i), "2");
		const fileInput = screen.getByLabelText(/upload photo/i, { selector: "input" });
		await user.upload(fileInput, makeFile(200_000));

		await user.click(screen.getByRole("button", { name: /create product/i }));
		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Product already exists"));

		await user.click(screen.getByRole("button", { name: /create product/i }));
		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Invalid product data"));
	});

	test("show toast error when there is error in getting category", async () => {
		axios.get.mockRejectedValueOnce(new Error("network"));
		renderPage();
		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith("Something went wrong in getting category")
		);
	});
});
