import React from "react";
import { render, screen, within, waitFor } from "@testing-library/react";
import HomePage from "./HomePage";
import axios from "axios";

jest.mock("axios");

// Mock react-router navigate
jest.mock("react-router-dom", () => ({
	...jest.requireActual("react-router-dom"),
	useNavigate: () => jest.fn(),
}));

// Mock antd pieces with the help of ChatGPT
jest.mock("antd", () => {
	const Checkbox = ({ children, onChange, ...rest }) => (
		<label>
			<input type="checkbox" onChange={onChange} {...rest} />
			{children}
		</label>
	);
	const Radio = ({ children, value }) => (
		<label>
			<input type="radio" value={value} />
			{children}
		</label>
	);
	Radio.Group = ({ children, onChange }) => (
		<div onChange={onChange} data-testid="radio-group">
			{children}
		</div>
	);
	return { Checkbox, Radio };
});

// Mock cart context
jest.mock("../context/cart", () => ({
	useCart: () => [[], jest.fn()],
}));

// Mock toast
jest.mock("react-hot-toast", () => ({ success: jest.fn(), error: jest.fn() }));

// Mock Layout with the help of ChaatGPT
jest.mock("../components/Layout", () => ({
	__esModule: true,
	default: ({ children, title }) => (
		<section data-testid="layout">
			{title ? <h1>{title}</h1> : null}
			{children}
		</section>
	),
}));

beforeEach(() => {
	jest.clearAllMocks();
});

function mockInitialFetches({ categories, total, products }) {
	axios.get
		.mockResolvedValueOnce({ data: { success: true, category: categories } }) // /get-category
		.mockResolvedValueOnce({ data: { total } }) // /product-count
		.mockResolvedValueOnce({ data: { products } }); // /product-list/n
}

describe("initial data fetch (categories, products, total)", () => {
	test("calls the 3 endpoints on mount and renders categories + products", async () => {
		const categories = [
			{ _id: "c1", name: "Laptops" },
			{ _id: "c2", name: "Phones" },
		];
		const products = [
			{
				_id: "p1",
				name: "MacBook Air",
				description: "Light and thin",
				price: 1299,
				slug: "macbook-air",
			},
			{
				_id: "p2",
				name: "iPhone",
				description: "A phone",
				price: 999,
				slug: "iphone",
			},
		];


        //components created with the help of ChatGPT
		mockInitialFetches({ categories, total: 10, products });

		render(<HomePage />);

		expect(screen.getByTestId("layout")).toBeInTheDocument();

		expect(await screen.findByText("Laptops")).toBeInTheDocument();
		expect(screen.getByText("Phones")).toBeInTheDocument();

        
		const mba = screen.getByRole("heading", { level: 5, name: "MacBook Air" });
		const iphone = screen.getByRole("heading", { level: 5, name: "iPhone" });
		expect(mba).toBeInTheDocument();
		expect(iphone).toBeInTheDocument();

		const mbaCard = mba.closest(".card");
		const mbaImg = within(mbaCard).getByAltText("MacBook Air");
		expect(mbaImg).toHaveAttribute("src", "/api/v1/product/product-photo/p1");

		// Verify 3 endpoints
		await waitFor(() => {
			expect(axios.get).toHaveBeenNthCalledWith(
				1,
				"/api/v1/category/get-category"
			);
			expect(axios.get).toHaveBeenNthCalledWith(
				2,
				"/api/v1/product/product-count"
			);
			expect(axios.get).toHaveBeenNthCalledWith(
				3,
				"/api/v1/product/product-list/1"
			);
		});
	});

	test("renders Loadmore button when total products > products.length", async () => {
		const categories = [{ _id: "c1", name: "Accessories" }];
		const products = [
			{
				_id: "p1",
				name: "Bottle",
				description: "Reusable",
				price: 10,
				slug: "b",
			},
		];

		mockInitialFetches({ categories, total: 5, products });

		render(<HomePage />);

		// Wait for category to appear 
		expect(await screen.findByText("Accessories")).toBeInTheDocument();

		// a total of 5 > 1 -> Loadmore button appears
		expect(
			screen.getByRole("button", { name: /Loadmore/i })
		).toBeInTheDocument();
	});

	test("does not show Loadmore when total <= products.length", async () => {
		const categories = [{ _id: "c1", name: "Stationery" }];
		const products = [
			{ _id: "p1", name: "Pen", description: "Blue", price: 2, slug: "pen" },
			{
				_id: "p2",
				name: "Notebook",
				description: "Simple",
				price: 4,
				slug: "notebook",
			},
		];

		mockInitialFetches({ categories, total: 2, products });

		render(<HomePage />);

		expect(await screen.findByText("Stationery")).toBeInTheDocument();

		// total = products.length -> no Loadmore button
		expect(screen.queryByRole("button", { name: /Loadmore/i })).toBeNull();
	});

	test("logs errors (categories) without crashing", async () => {
		const spy = jest.spyOn(console, "log").mockImplementation(() => {});

		// Fail get-category; still proceed to next calls to avoid breaking UI
		axios.get
			.mockRejectedValueOnce(new Error("cat fail")) // /get-category
			.mockResolvedValueOnce({ data: { total: 0 } }) // /product-count
			.mockResolvedValueOnce({ data: { products: [] } }); // /product-list/1

		render(<HomePage />);

		await waitFor(() => {
			expect(spy).toHaveBeenCalled();
		});
		spy.mockRestore();

		// page shell still present
		expect(screen.getByTestId("layout")).toBeInTheDocument();
		// no products rendered
		expect(screen.queryByRole("heading", { level: 5 })).toBeNull();
	});


});
