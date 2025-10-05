import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Products from "./Products";

jest.mock("axios");

jest.mock("react-hot-toast", () => ({
	error: jest.fn(),
}));

// Layout mock
jest.mock("./../../components/Layout", () => ({
	__esModule: true,
	default: ({ title, children }) => (
		<div data-testid="mock-layout" data-title={title}>
			{children}
		</div>
	),
}));

// AdminMenu mock
jest.mock("../../components/AdminMenu", () => ({
	__esModule: true,
	default: () => <div data-testid="mock-admin-menu">AdminMenu</div>,
}));

const API_URL = "/api/v1/product/get-product";

describe("Products Component", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	function renderWithRouter(component) {
		return render(<MemoryRouter>{component}</MemoryRouter>);
	}

	it("renders Layout, AdminMenu, page heading and passes the correct Layout title", () => {
		render(<Products />);
		const layout = screen.getByTestId("mock-layout");
		expect(layout).toBeInTheDocument();
		expect(layout).toHaveAttribute("data-title", "Dashboard - Products");
		expect(screen.getByTestId("mock-admin-menu")).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: /all products list/i, level: 1 })
		).toBeInTheDocument();
	});

	it("calls the products API and shows the Product heading", async () => {
		axios.get.mockResolvedValueOnce({ data: { products: [] } });

		renderWithRouter(<Products />);

		expect(screen.getByText("All Products List")).toBeInTheDocument();
		expect(screen.getByTestId("mock-layout")).toBeInTheDocument();
		expect(screen.getByTestId("mock-admin-menu")).toBeInTheDocument();

		await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
		expect(axios.get).toHaveBeenCalledWith(API_URL);
	});

	it("renders product cards with correct links and images", async () => {
		const products = [
			{ _id: "p1", name: "Apple Watch", description: "Series 9", slug: "apple-watch" },
			{ _id: "p2", name: "Kindle", description: "Paperwhite", slug: "kindle" },
		];

		axios.get.mockResolvedValueOnce({ data: { products } });

		renderWithRouter(<Products />);

		const card1 = await screen.findByRole("heading", { name: "Apple Watch" });
		const card2 = await screen.findByRole("heading", { name: "Kindle" });
		expect(card1).toBeInTheDocument();
		expect(card2).toBeInTheDocument();

		const link1 = screen.getByRole("link", { name: /Apple Watch/i });
		const link2 = screen.getByRole("link", { name: /Kindle/i });
		expect(link1).toHaveAttribute("href", "/dashboard/admin/product/apple-watch");
		expect(link2).toHaveAttribute("href", "/dashboard/admin/product/kindle");

		const img1 = within(link1).getByRole("img", { name: "Apple Watch" });
		const img2 = within(link2).getByRole("img", { name: "Kindle" });
		expect(img1).toHaveAttribute("src", "/api/v1/product/product-photo/p1");
		expect(img2).toHaveAttribute("src", "/api/v1/product/product-photo/p2");

		expect(within(link1).getByText("Series 9")).toBeInTheDocument();
		expect(within(link2).getByText("Paperwhite")).toBeInTheDocument();
	});

	it("handles empty product list", async () => {
		axios.get.mockResolvedValueOnce({ data: { products: [] } });

		renderWithRouter(<Products />);

		await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
	});

	it("handles any undefined products from API", async () => {
		axios.get.mockResolvedValueOnce({ data: { products: undefined } });

		renderWithRouter(<Products />);

		await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
	});

	it("logs and toasts on error", async () => {
		const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
		axios.get.mockRejectedValueOnce(new Error("Network Error"));

		renderWithRouter(<Products />);

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something Went Wrong"));
		expect(logSpy).toHaveBeenCalledTimes(1);
		expect(screen.queryByRole("link")).not.toBeInTheDocument();

		logSpy.mockRestore();
	});
});
