// Written by Ujjwal Gaurav
// This test file checks the admin products functionality in admin dashboard
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Products from "../../pages/admin/Products";
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

jest.mock("axios", () => ({
	__esModule: true,
	default: { get: jest.fn() },
}));

jest.mock("react-hot-toast", () => ({
	__esModule: true,
	default: { success: jest.fn(), error: jest.fn() },
}));

afterEach(() => jest.clearAllMocks());

function renderPage() {
	return render(
		<MemoryRouter initialEntries={["/dashboard/admin/products"]}>
			<Routes>
				<Route path="/dashboard/admin/products" element={<Products />} />
				<Route path="/dashboard/admin/product/:slug" element={<div>Update Page</div>} />
			</Routes>
		</MemoryRouter>
	);
}

const sampleProducts = [
	{ _id: "p1", slug: "desk-lamp", name: "Desk Lamp", description: "Metal lamp", price: 10 },
	{ _id: "p2", slug: "wood-chair", name: "Wood Chair", description: "Chair desc", price: 25 },
];

describe("Products", () => {
	test("verify if it fetches all products and links each to update product page", async () => {
		axios.get.mockResolvedValueOnce({ data: { products: sampleProducts } });

		renderPage();

		await waitFor(() =>
			expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product", {
				params: { page: 1, perPage: 1000 },
			})
		);

		expect(await screen.findByRole("heading", { name: /all products list/i })).toBeInTheDocument();
		expect(screen.getByText("Desk Lamp")).toBeInTheDocument();
		expect(screen.getByText("Wood Chair")).toBeInTheDocument();

		const deskLink = screen.getByRole("link", { name: /desk lamp/i });
		const chairLink = screen.getByRole("link", { name: /wood chair/i });
		expect(deskLink).toHaveAttribute("href", "/dashboard/admin/product/desk-lamp");
		expect(chairLink).toHaveAttribute("href", "/dashboard/admin/product/wood-chair");
	});

	test("show a toast error when fetching products fail", async () => {
		axios.get.mockRejectedValueOnce(new Error("network error"));
		renderPage();
		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something Went Wrong"));
	});
});
