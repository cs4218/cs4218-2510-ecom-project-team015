import React from "react";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Search from "./Search";

// Mock the useSearch hook so we can inject state per test
jest.mock("../context/search", () => ({
	useSearch: jest.fn(),
}));

// Simplify Layout to reduce UI dependencies
jest.mock("./../components/Layout", () => ({
	__esModule: true,
	default: ({ children, title }) => (
		<section data-testid="shell">
			{title ? <header>{title}</header> : null}
			{children}
		</section>
	),
}));

// Mock cart context using ChatGPT
jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [[], jest.fn(), { addToCart: jest.fn() }]),
}));

const { useSearch } = jest.requireMock("../context/search");

// (optional) mute irrelevant warnings (like missing key in map)
let muteConsole;
beforeAll(() => {
	muteConsole = jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => {
	muteConsole.mockRestore();
});

describe("Search page (alt suite)", () => {
	it("when there are no results: show title and message 'No Products Found'", () => {
		useSearch.mockReturnValue([{ keyword: "", results: [] }, jest.fn()]);

		render(
			<MemoryRouter>
			<Search />
			</MemoryRouter>
		);

		// Check for the h1 heading "Search Results"
		expect(screen.getByRole("heading", { level: 1, name: /Search Results/i })).toBeInTheDocument();
		expect(screen.getByText(/No Products Found/i)).toBeInTheDocument();
	});

	it("when there are results: display 'Found N' and render correct number of cards", () => {
		const data = [
			{ _id: "a1", name: "OnePlus", description: "X".repeat(80), price: 299 },
			{ _id: "b2", name: "Moto", description: "Short", price: 159 },
			{ _id: "c3", name: "Nokia", description: "Legacy".repeat(6), price: 89 },
		];
		useSearch.mockReturnValue([{ keyword: "phone", results: data }, jest.fn()]);

		const { container } = render(
			<MemoryRouter>
			<Search />
			</MemoryRouter>
		);

		// Shows 'Found 3'
		expect(screen.getByText(/Found\s*3/i)).toBeInTheDocument();

		// Count cards using CSS class .card (instead of getAllByRole)
		const cards = container.querySelectorAll(".card");
		expect(cards.length).toBe(3);

		// --------- Box-driven check for a specific item (OnePlus) ----------
		const onePlusHeading = screen.getByRole("heading", {
			level: 5,
			name: "OnePlus",
		});
		const onePlusCard = onePlusHeading.closest(".card");
		expect(onePlusCard).not.toBeNull();

		// Image: alt matches name, src ends with _id
		const onePlusImg = within(onePlusCard).getByAltText("OnePlus");
		expect(onePlusImg).toHaveAttribute(
			"src",
			"/api/v1/product/product-photo/a1"
		);

		// Description truncated to 30 chars + "..."
		const expectedDesc = "X".repeat(30) + "...";
		expect(within(onePlusCard).getByText(expectedDesc)).toBeInTheDocument();

		// Price: formatted as `$ <number>`
		expect(within(onePlusCard).getByText(/\$\s*299/)).toBeInTheDocument();

		// Two action buttons exist
		expect(
			within(onePlusCard).getByRole("button", { name: /More Details/i })
		).toBeInTheDocument();
		expect(
			within(onePlusCard).getByRole("button", { name: /ADD TO CART/i })
		).toBeInTheDocument();
	});

	it("description shorter than 30 chars still adds '...'", () => {
		const short = [{ _id: "s1", name: "Tiny", description: "abc", price: 10 }];
		useSearch.mockReturnValue([{ keyword: "t", results: short }, jest.fn()]);

		render(
			<MemoryRouter>
			<Search />
			</MemoryRouter>
		);

		const tiny = screen.getByRole("heading", { level: 5, name: "Tiny" });
		const tinyCard = tiny.closest(".card");
		expect(tinyCard).not.toBeNull();

		// substring(0,30) of "abc" is "abc", component still adds "..."
		expect(within(tinyCard).getByText("abc...")).toBeInTheDocument();

		// Image alt/src follows expected pattern
		const img = within(tinyCard).getByAltText("Tiny");
		expect(img).toHaveAttribute("src", "/api/v1/product/product-photo/s1");
	});
});
