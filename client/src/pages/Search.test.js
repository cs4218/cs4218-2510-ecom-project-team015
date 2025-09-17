// client/src/pages/Search.test.js
import React from "react";
import { render, screen, within } from "@testing-library/react";
import Search from "./Search";

// Mock useSearch to inject arbitrary state per test
jest.mock("../context/search", () => ({
	useSearch: jest.fn(),
}));

// Mock Layout so tests don't depend on external UI
jest.mock("./../components/Layout", () => ({
	__esModule: true,
	default: ({ children, title }) => (
		<div data-testid="layout">
			{title && <h1>{title}</h1>}
			{children}
		</div>
	),
}));

const { useSearch } = jest.requireMock("../context/search");

// (optional) mute the "each child should have a unique key" warning
// because the map code in Search.jsx has no key
let consoleErrorSpy;
beforeAll(() => {
	consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => {
	consoleErrorSpy.mockRestore();
});

describe("Search page", () => {
	test("shows 'No Products Found' when there are no results", () => {
		useSearch.mockReturnValue([{ keyword: "", results: [] }, jest.fn()]);

		render(<Search />);

		// Title has a typo in the component: "Search Resuts"
		expect(screen.getByText(/Search Resuts/i)).toBeInTheDocument();
		expect(screen.getByText(/No Products Found/i)).toBeInTheDocument();
	});

	test("shows 'Found N' and renders the correct number of cards", () => {
		const products = [
			{
				_id: "p1",
				name: "iPhone",
				description: "A".repeat(50),
				price: 999,
			},
			{
				_id: "p2",
				name: "Pixel",
				description: "B".repeat(10),
				price: 499,
			},
		];
		useSearch.mockReturnValue([
			{ keyword: "phone", results: products },
			jest.fn(),
		]);

		render(<Search />);

		// Header
		expect(screen.getByText(/Found 2/i)).toBeInTheDocument();

		// There should be 2 product titles (h5 => heading level 5)
		const headings = screen.getAllByRole("heading", { level: 5 });
		expect(headings).toHaveLength(2);
		expect(
			screen.getByRole("heading", { level: 5, name: "iPhone" })
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { level: 5, name: "Pixel" })
		).toBeInTheDocument();

		// iPhone card
		const iphoneTitle = screen.getByRole("heading", {
			level: 5,
			name: "iPhone",
		});
		const iphoneCard = iphoneTitle.closest(".card");
		expect(iphoneCard).not.toBeNull();

		// Image should have correct src and alt
		const iphoneImg = within(iphoneCard).getByAltText("iPhone");
		expect(iphoneImg).toHaveAttribute(
			"src",
			"/api/v1/product/product-photo/p1"
		);

		// Description is truncated to 30 characters + "..."
		const iphoneDesc = "A".repeat(30) + "...";
		expect(within(iphoneCard).getByText(iphoneDesc)).toBeInTheDocument();

		// Price
		expect(within(iphoneCard).getByText(/\$\s*999/)).toBeInTheDocument();

		// Two buttons
		expect(
			within(iphoneCard).getByRole("button", { name: /More Details/i })
		).toBeInTheDocument();
		expect(
			within(iphoneCard).getByRole("button", { name: /ADD TO CART/i })
		).toBeInTheDocument();

		// Pixel card
		const pixelTitle = screen.getByRole("heading", { level: 5, name: "Pixel" });
		const pixelCard = pixelTitle.closest(".card");
		expect(pixelCard).not.toBeNull();

		const pixelImg = within(pixelCard).getByAltText("Pixel");
		expect(pixelImg).toHaveAttribute("src", "/api/v1/product/product-photo/p2");

		// Pixel description is only 10 chars => substring(0,30) still 10 + "..."
		expect(
			within(pixelCard).getByText("B".repeat(10) + "...")
		).toBeInTheDocument();

		expect(within(pixelCard).getByText(/\$\s*499/)).toBeInTheDocument();
		expect(
			within(pixelCard).getByRole("button", { name: /More Details/i })
		).toBeInTheDocument();
		expect(
			within(pixelCard).getByRole("button", { name: /ADD TO CART/i })
		).toBeInTheDocument();
	});
});
