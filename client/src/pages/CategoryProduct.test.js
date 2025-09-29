// client/src/pages/CategoryProduct.test.js
import React from "react";
import {
	render,
	screen,
	within,
	fireEvent,
	waitFor,
} from "@testing-library/react";
import CategoryProduct from "./CategoryProduct";
import axios from "axios";

// ---- Mocks ----

// Mock react-router: useParams (slug) + useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
	...jest.requireActual("react-router-dom"),
	useParams: jest.fn(),
	useNavigate: () => mockNavigate,
}));

// Mock Layout to avoid external UI dependencies using Chat GPT
jest.mock("../components/Layout", () => ({
	__esModule: true,
	default: ({ children, title }) => (
		<div data-testid="layout">
			{title && <h1>{title}</h1>}
			{children}
		</div>
	),
}));

// Mock axios
jest.mock("axios");

beforeEach(() => {
	jest.clearAllMocks();
});

describe("CategoryProduct", () => {
	const { useParams } = jest.requireMock("react-router-dom");

	function mockCategoryAndProducts({ slug = "laptops", category, products }) {
		useParams.mockReturnValue({ slug });
		axios.get.mockResolvedValueOnce({
			data: { category, products },
		});
	}

	test("fetches by slug and renders category title, count, and product cards", async () => {
		const category = { _id: "c9", name: "Laptops" };
		const products = [
			{
				_id: "p1",
				name: "MacBook Air",
				description: "Light and thin ultrabook",
				price: 6666,
				slug: "macbook-air",
			},
			{
				_id: "p2",
				name: "ThinkPad X1",
				description: "Business laptop",
				price: 1899,
				slug: "thinkpad-x1",
			},
		];

		mockCategoryAndProducts({ category, products });

		render(<CategoryProduct />);

		// Category title (wait for async data)
		expect(
			await screen.findByText(/Category\s*-\s*Laptops/i)
		).toBeInTheDocument();

		// Result count
		expect(screen.getByText(/2 result found/i)).toBeInTheDocument();

		// Two h5 headings per card (name and price)
		const headings = screen.getAllByRole("heading", { level: 5 });
		expect(headings).toHaveLength(4);
		// Check specific product names (h5)
		expect(
			screen.getByRole("heading", { level: 5, name: "MacBook Air" })
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { level: 5, name: "ThinkPad X1" })
		).toBeInTheDocument();

		// MacBook Air card
		const mbaTitle = screen.getByRole("heading", {
			level: 5,
			name: "MacBook Air",
		});
		const mbaCard = mbaTitle.closest(".card");
		expect(mbaCard).not.toBeNull();

		// Image has correct src/alt
		const mbaImg = within(mbaCard).getByAltText("MacBook Air");
		expect(mbaImg).toHaveAttribute("src", "/api/v1/product/product-photo/p1");

		// Description truncated to 60 + "..."
		expect(
			within(mbaCard).getByText(/Light and thin ultrabook\.{3}$/)
		).toBeInTheDocument();

		// USD price (toLocaleString)
		expect(within(mbaCard).getByText(/\$\s*6,666\.00/)).toBeInTheDocument();

		// "More Details" button → navigate to correct slug
		const detailsBtn = within(mbaCard).getByRole("button", {
			name: /More Details/i,
		});
		fireEvent.click(detailsBtn);
		expect(mockNavigate).toHaveBeenCalledWith("/product/macbook-air");

		// Axios hits the correct endpoint
		await waitFor(() => {
			expect(axios.get).toHaveBeenCalledWith(
				"/api/v1/product/product-category/laptops"
			);
		});
	});

	test("renders empty state message when there are no products", async () => {
		const category = { _id: "c1", name: "Accessories" };
		const products = [];

		mockCategoryAndProducts({ category, products });

		render(<CategoryProduct />);

		// Category header and 0 result
		expect(
			await screen.findByText(/Category\s*-\s*Accessories/i)
		).toBeInTheDocument();
		expect(screen.getByText(/0 result found/i)).toBeInTheDocument();

		// No product cards
		const cardsContainer = screen
			.getByText(/0 result found/i)
			.closest(".container");
		expect(cardsContainer).not.toBeNull();

		// In the container below there’s a d-flex flex-wrap; simply assert no h5 product name exists
		expect(screen.queryByRole("heading", { level: 5, name: /.+/ })).toBeNull();
	});

	test("does not fetch when slug is missing", async () => {
		useParams.mockReturnValue({}); // no slug

		render(<CategoryProduct />);

		await waitFor(() => {
			expect(axios.get).not.toHaveBeenCalled();
		});

		expect(screen.getByTestId("layout")).toBeInTheDocument();
	});

	test("logs error when fetch fails", async () => {
		useParams.mockReturnValue({ slug: "phones" });
		const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
		axios.get.mockRejectedValueOnce(new Error("network error"));

		render(<CategoryProduct />);

		await waitFor(() => {
			// getProductsByCat catch -> console.log(error)
			expect(logSpy).toHaveBeenCalled();
		});

		logSpy.mockRestore();
	});
});
