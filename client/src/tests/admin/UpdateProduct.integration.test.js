// Written by Ujjwal Gaurav
// This test file checks the update product functionality in admin dashboard
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import UpdateProduct from "../../pages/admin/UpdateProduct";
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
	default: { get: jest.fn(), put: jest.fn(), delete: jest.fn() },
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

function renderWithRoute(slug = "desk-lamp") {
	return render(
		<MemoryRouter initialEntries={[`/dashboard/admin/product/${slug}`]}>
			<Routes>
				<Route path="/dashboard/admin/product/:slug" element={<UpdateProduct />} />
				<Route path="/dashboard/admin/products" element={<div>All Products List</div>} />
			</Routes>
		</MemoryRouter>
	);
}

// Created using ChatGPT
function fileOf(sizeBytes, name = "photo.jpg", type = "image/jpeg") {
	const f = new File(["xx"], name, { type });
	Object.defineProperty(f, "size", { value: sizeBytes });
	return f;
}

const product = {
	_id: "p1",
	name: "Desk Lamp",
	description: "Metal lamp",
	price: 10,
	quantity: 7,
	shipping: "1",
	category: { _id: "c1", name: "Home" },
};

const categories = [
	{ _id: "c1", name: "Home" },
	{ _id: "c2", name: "Office" },
];

describe("Update Product", () => {
	test("load a product, make some changes, and verify if the changes have been successfully updated", async () => {
		axios.get
			.mockResolvedValueOnce({ data: { product } })
			.mockResolvedValueOnce({ data: { success: true, category: categories } });
		axios.put.mockResolvedValueOnce({ data: { success: true } });

		const user = userEvent.setup();
		renderWithRoute("desk-lamp");

		const priceInput = await screen.findByPlaceholderText(/write a price/i);
		expect(priceInput).toHaveValue(10);
		expect(screen.getByPlaceholderText(/write a name/i)).toHaveValue("Desk Lamp");
		expect(screen.getByPlaceholderText(/write a description/i)).toHaveValue("Metal lamp");
		expect(screen.getByPlaceholderText(/write a quantity/i)).toHaveValue(7);

		await user.clear(priceInput);
		await user.type(priceInput, "13.5"); // change price to 13.5
		await user.selectOptions(screen.getByLabelText(/select shipping/i), "0"); // change shipping to No
		const catSelect = await screen.findByLabelText(/select a category/i);
		await user.selectOptions(catSelect, "c2"); // change category to Office

		const fileInput = screen.getByLabelText(/upload photo/i, { selector: "input" });
		const okFile = fileOf(200_000);
		await user.upload(fileInput, okFile);

		await user.click(screen.getByRole("button", { name: /update product/i }));

		expect(axios.put).toHaveBeenCalledTimes(1);
		const [url, fd] = axios.put.mock.calls[0];

		expect(url).toBe(`/api/v1/product/update-product/${product._id}`);
		expect(fd instanceof FormData).toBe(true);
		const entries = Object.fromEntries(fd.entries());
		expect(entries).toMatchObject({
			name: "Desk Lamp",
			description: "Metal lamp",
			price: "13.5",
			quantity: "7",
			category: "c2",
		});
		expect(entries.photo).toBe(okFile);

		await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully"));
		expect(await screen.findByText(/all products list/i)).toBeInTheDocument();
	});

	test("check if updating a photo > 1MB, setting price and quantity to invalid numbers, throws an error", async () => {
		axios.get
			.mockResolvedValueOnce({ data: { product } })
			.mockResolvedValueOnce({ data: { success: true, category: categories } });

		const user = userEvent.setup();
		renderWithRoute();

		// Photo > 1MB
		const fileInput = await screen.findByLabelText(/upload photo/i, { selector: "input" });
		await user.upload(fileInput, fileOf(1_500_000));

		// Price = -1 and Quantity = 0
		await user.clear(screen.getByPlaceholderText(/write a price/i));
		await user.type(screen.getByPlaceholderText(/write a price/i), "-1");
		await user.clear(screen.getByPlaceholderText(/write a quantity/i));
		await user.type(screen.getByPlaceholderText(/write a quantity/i), "0");

		await user.click(screen.getByRole("button", { name: /update product/i }));
		expect(toast.error).toHaveBeenCalledWith("Photo must be ≤ 1MB");
		expect(axios.put).not.toHaveBeenCalled();
	});

	test("show a toast error when server returns {success:false}", async () => {
		axios.get
			.mockResolvedValueOnce({ data: { product } })
			.mockResolvedValueOnce({ data: { success: true, category: categories } });
		axios.put.mockResolvedValueOnce({ data: { success: false, message: "Bad update" } });

		const user = userEvent.setup();
		renderWithRoute();

		await user.clear(await screen.findByPlaceholderText(/write a price/i));
		await user.type(screen.getByPlaceholderText(/write a price/i), "12");
		await user.selectOptions(screen.getByLabelText(/select a category/i), "c1");
		await user.selectOptions(screen.getByLabelText(/select shipping/i), "1");
		await user.clear(screen.getByPlaceholderText(/write a quantity/i));
		await user.type(screen.getByPlaceholderText(/write a quantity/i), "8");

		await user.click(screen.getByRole("button", { name: /update product/i }));

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Bad update"));
		expect(screen.queryByText(/all products list/i)).not.toBeInTheDocument();
	});

	test("delete a product and check if it is successfully removed from the products list", async () => {
		axios.get
			.mockResolvedValueOnce({ data: { product } })
			.mockResolvedValueOnce({ data: { success: true, category: categories } });
		axios.delete.mockResolvedValueOnce({ data: { success: true } });

		const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
		const user = userEvent.setup();
		renderWithRoute();

		await user.click(await screen.findByRole("button", { name: /delete product/i }));
		expect(axios.delete).toHaveBeenCalledWith(`/api/v1/product/delete-product/${product._id}`);

		await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Product Deleted Successfully"));
		expect(await screen.findByText(/all products list/i)).toBeInTheDocument();

		confirmSpy.mockRestore();
	});

	test("cancel the delete confirmation and verify if we remain on update product page", async () => {
		axios.get
			.mockResolvedValueOnce({ data: { product } })
			.mockResolvedValueOnce({ data: { success: true, category: categories } });

		const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(false);
		const user = userEvent.setup();
		renderWithRoute();

		await user.click(await screen.findByRole("button", { name: /delete product/i }));
		expect(axios.delete).not.toHaveBeenCalled();
		confirmSpy.mockRestore();
	});

	test("show a toast erorr when loading a category fails due to some error", async () => {
		axios.get
			.mockResolvedValueOnce({ data: { product } })
			.mockImplementationOnce(() => Promise.reject(new Error("network down")));

		renderWithRoute();

		await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category"));
		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith("Something went wrong in getting category")
		);
	});
});
