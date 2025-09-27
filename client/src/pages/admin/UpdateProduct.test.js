import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";
import toast from "react-hot-toast";
import UpdateProduct from "./UpdateProduct";

jest.mock("axios");

jest.mock("react-hot-toast", () => ({
	success: jest.fn(),
	error: jest.fn(),
}));

jest.mock("../../components/Layout", () => ({
	__esModule: true,
	default: ({ children }) => <div data-testid="mock-layout">{children}</div>,
}));

jest.mock("../../components/AdminMenu", () => ({
	__esModule: true,
	default: () => <div data-testid="mock-admin-menu">AdminMenu</div>,
}));

const mockNavigate = jest.fn();
const mockParams = { slug: "test-slug" };

jest.mock("react-router-dom", () => ({
	...jest.requireActual("react-router-dom"),
	useNavigate: () => mockNavigate,
	useParams: () => mockParams,
}));

const productResponse = {
	product: {
		_id: "p123",
		name: "Test Product",
		description: "Great product",
		price: 50,
		quantity: 10,
		shipping: 1,
		category: { _id: "c1", name: "Category1" },
	},
};

const categoriesResponse = {
	success: true,
	category: [
		{ _id: "c1", name: "Category1" },
		{ _id: "c2", name: "Category2" },
	],
};

describe("UpdateProduct Component", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	function renderWithRouter(ui) {
		return render(<MemoryRouter>{ui}</MemoryRouter>);
	}

	it("fetches single product and categories on mount", async () => {
		axios.get
			.mockResolvedValueOnce({ data: productResponse })
			.mockResolvedValueOnce({ data: categoriesResponse });

		renderWithRouter(<UpdateProduct />);

		// wait until product name appears in input
		const nameInput = await screen.findByDisplayValue("Test Product");
		expect(nameInput).toBeInTheDocument();

		expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product/test-slug");
		expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");

		// category select populated
		expect(await screen.findByText("Category1")).toBeInTheDocument();
		expect(await screen.findByText("Category2")).toBeInTheDocument();
	});

	it("updates product successfully on button click", async () => {
		axios.get
			.mockResolvedValueOnce({ data: productResponse })
			.mockResolvedValueOnce({ data: categoriesResponse });
		axios.put = jest.fn().mockResolvedValueOnce({ data: { success: false } });

		renderWithRouter(<UpdateProduct />);

		// wait for initial state
		await screen.findByDisplayValue("Test Product");

		const updateButton = screen.getByRole("button", { name: /update product/i });
		fireEvent.click(updateButton);

		await waitFor(() => {
			expect(axios.put).toHaveBeenCalled();
		});
		expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
		expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
	});

	it("shows error toast when update fails", async () => {
		axios.get
			.mockResolvedValueOnce({ data: productResponse })
			.mockResolvedValueOnce({ data: categoriesResponse });
		axios.put = jest.fn().mockRejectedValueOnce(new Error("Network error"));

		renderWithRouter(<UpdateProduct />);

		await screen.findByDisplayValue("Test Product");

		fireEvent.click(screen.getByRole("button", { name: /update product/i }));

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith("something went wrong");
		});
	});

	it("deletes product successfully when confirmed", async () => {
		axios.get
			.mockResolvedValueOnce({ data: productResponse })
			.mockResolvedValueOnce({ data: categoriesResponse });
		axios.delete = jest.fn().mockResolvedValueOnce({});

		// simulate confirm
		jest.spyOn(window, "prompt").mockImplementation(() => "yes");

		renderWithRouter(<UpdateProduct />);
		await screen.findByDisplayValue("Test Product");

		fireEvent.click(screen.getByRole("button", { name: /delete product/i }));

		await waitFor(() => {
			expect(axios.delete).toHaveBeenCalledWith("/api/v1/product/delete-product/p123");
			expect(toast.success).toHaveBeenCalledWith("Product DEleted Succfully");
			expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
		});
	});

	it("does not delete product if prompt is cancelled", async () => {
		axios.get
			.mockResolvedValueOnce({ data: productResponse })
			.mockResolvedValueOnce({ data: categoriesResponse });
		axios.delete = jest.fn();

		jest.spyOn(window, "prompt").mockImplementation(() => null);

		renderWithRouter(<UpdateProduct />);
		await screen.findByDisplayValue("Test Product");

		fireEvent.click(screen.getByRole("button", { name: /delete product/i }));

		expect(axios.delete).not.toHaveBeenCalled();
		expect(toast.success).not.toHaveBeenCalled();
	});
});
