// client/src/pages/ProductDetails.test.js
import React from "react";
import {
	render,
	screen,
	within,
	waitFor,
	fireEvent,
} from "@testing-library/react";
import ProductDetails from "./ProductDetails";
import axios from "axios";

// ---- Mocks ----

// Mock axios
jest.mock("axios");


// Mock react-router hooks: useParams (slug) + useNavigate using Chat GPT
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
	...jest.requireActual("react-router-dom"),
	useParams: jest.fn(),
	useNavigate: () => mockNavigate,
}));

// Mock Layout to avoid external UI details using Chat GPT
jest.mock("./../components/Layout", () => ({
	__esModule: true,
	default: ({ children, title }) => (
		<div data-testid="layout">
			{title && <h1>{title}</h1>}
			{children}
		</div>
	),
}));

// Mock cart context using ChatGPT
jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [[], jest.fn(), { addToCart: jest.fn() }]),
}));


// Silence console.error for warning noises (optional) using ChatGPT
let consoleErrorSpy;
beforeAll(() => {
	consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => {
	consoleErrorSpy.mockRestore();
});

beforeEach(() => {
	jest.clearAllMocks();
});

// Helper: set up API mocks for product + related calls using ChatGPT
function mockProductAndRelated({ product, related }) {
	axios.get
		.mockResolvedValueOnce({ data: { product } }) // /get-product/:slug
		.mockResolvedValueOnce({ data: { products: related } }); // /related-product/:pid/:cid
}

describe("Product details", () => {
	test("fetches product by slug and renders product details", async () => {
		const product = {
			_id: "p123",
			name: "MacBook Pro",
			description: "Powerful laptop",
			price: 3333,
			category: { _id: "c9", name: "Laptops" },
		};
		const related = [
			{
				_id: "r1",
				name: "MacBook Air",
				description: "Light and thin",
				price: 1299,
				slug: "macbook-air",
			},
		];


		// useParams returns slug
		const { useParams } = jest.requireMock("react-router-dom");
		useParams.mockReturnValue({ slug: "macbook-pro" });

		// axios mocks
		mockProductAndRelated({ product, related });

		render(<ProductDetails />);

		// Wait for product to load
		expect(await screen.findByText(/Product Details/i)).toBeInTheDocument();

		const mainImg = await screen.findByAltText("MacBook Pro");
		expect(mainImg).toHaveAttribute(
			"src",
			"/api/v1/product/product-photo/p123"
		);

		expect(
			await screen.findByText(/Name\s*:\s*MacBook Pro/)
		).toBeInTheDocument();
		expect(
			await screen.findByText(/Description\s*:\s*Powerful laptop/)
		).toBeInTheDocument();
		expect(
			await screen.findByText(/Price\s*:\s*\$3,333\.00/)
		).toBeInTheDocument();
		expect(
			await screen.findByText(/Category\s*:\s*Laptops/)
		).toBeInTheDocument();


		// Similar products header
		expect(screen.getByText(/Similar Products/i)).toBeInTheDocument();

		// One related product card
		const relatedHeading = await screen.findByRole("heading", {
			level: 5,
			name: "MacBook Air",
		});
		const relatedCard = relatedHeading.closest(".card");
		expect(relatedCard).not.toBeNull();

		// Related card image src/alt
		const relatedImg = within(relatedCard).getByAltText("MacBook Air");
		expect(relatedImg).toHaveAttribute(
			"src",
			"/api/v1/product/product-photo/r1"
		);

		// Description truncated to 60 + "..."
		expect(
			within(relatedCard).getByText(/Light and thin\.{3}$/)
		).toBeInTheDocument();

		// Price in USD
		expect(within(relatedCard).getByText(/\$\s*1,299\.00/)).toBeInTheDocument();

		// "More Details" button navigates to /product/:slug
		const detailsBtn = within(relatedCard).getByRole("button", {
			name: /More Details/i,
		});
		fireEvent.click(detailsBtn);
		expect(mockNavigate).toHaveBeenCalledWith("/product/macbook-air");

		// axios called with correct endpoints
		await waitFor(() => {
			expect(axios.get).toHaveBeenNthCalledWith(
				1,
				"/api/v1/product/get-product/macbook-pro"
			);
			expect(axios.get).toHaveBeenNthCalledWith(
				2,
				"/api/v1/product/related-product/p123/c9"
			);
		});
	});


	test("shows no similar products message when related list empty", async () => {
		const product = {
			_id: "p1",
			name: "Pen",
			description: "Blue pen",
			price: 2,
			category: { _id: "c1", name: "Stationery" },
		};
		const { useParams } = jest.requireMock("react-router-dom");
		useParams.mockReturnValue({ slug: "pen" });

		axios.get.mockResolvedValueOnce({ data: { product } });
		axios.get.mockResolvedValueOnce({ data: { products: [] } });

		render(<ProductDetails />);
		expect(
			await screen.findByText(/No Similar Products found/i)
		).toBeInTheDocument();
	});


	test("renders main product image with correct src and alt", async () => {
		const product = {
			_id: "p99",
			name: "Water Bottle",
			description: "Reusable bottle",
			price: 10,
			category: { _id: "c2", name: "Accessories" },
		};

		const { useParams } = jest.requireMock("react-router-dom");
		useParams.mockReturnValue({ slug: "water-bottle" });

		axios.get.mockResolvedValueOnce({ data: { product } });
		axios.get.mockResolvedValueOnce({ data: { products: [] } });

		render(<ProductDetails />);

		const img = await screen.findByAltText("Water Bottle");
		expect(img).toHaveAttribute("src", "/api/v1/product/product-photo/p99");
	});


	test("renders Add to Cart button", async () => {
		const product = {
			_id: "p2",
			name: "Backpack",
			description: "Durable backpack",
			price: 50,
			category: { _id: "c7", name: "Bags" },
		};

		const { useParams } = jest.requireMock("react-router-dom");
		useParams.mockReturnValue({ slug: "backpack" });

		axios.get.mockResolvedValueOnce({ data: { product } });
		axios.get.mockResolvedValueOnce({ data: { products: [] } });

		render(<ProductDetails />);

		expect(
			await screen.findByRole("button", { name: /add to cart/i })
		).toBeInTheDocument();
	});


	test("renders product price formatted in USD", async () => {
		const product = {
			_id: "p3",
			name: "Notebook",
			description: "Simple notebook",
			price: 1234,
			category: { _id: "c8", name: "Stationery" },
		};

		const { useParams } = jest.requireMock("react-router-dom");
		useParams.mockReturnValue({ slug: "notebook" });

		axios.get.mockResolvedValueOnce({ data: { product } });
		axios.get.mockResolvedValueOnce({ data: { products: [] } });

		render(<ProductDetails />);

		expect(
			await screen.findByText(/Price\s*:\s*\$1,234\.00/)
		).toBeInTheDocument();
	});


	test("renders without crashing", () => {
		render(<ProductDetails />);
		expect(screen.getByTestId("layout")).toBeInTheDocument();
	});


	test("shows empty state when there are no related products", async () => {
		const product = {
			_id: "p1",
			name: "iPhone",
			description: "A phone",
			price: 666,
			category: { _id: "c1", name: "Phones" },
		};
		const related = []; // no similar products

		const { useParams } = jest.requireMock("react-router-dom");
		useParams.mockReturnValue({ slug: "iphone" });

		mockProductAndRelated({ product, related });

		render(<ProductDetails />);

		// Product details load
		expect(await screen.findByText(/Product Details/i)).toBeInTheDocument();

		// Empty related message
		expect(screen.getByText(/No Similar Products found/i)).toBeInTheDocument();
	});


	// made using ChatGPT
	test("does nothing if no slug is present (does not call axios)", async () => {
		// No slug provided
		const { useParams } = jest.requireMock("react-router-dom");
		useParams.mockReturnValue({});

		render(<ProductDetails />);

		// Wait a tick to ensure no fetch attempt
		await waitFor(() => {
			expect(axios.get).not.toHaveBeenCalled();
		});

		// The page still renders the wrapper, but product-specific content may be incomplete
		// We just assert that layout wrapper is present
		expect(screen.getByTestId("layout")).toBeInTheDocument();
	});


	test("logs error if fetching fails (product call rejects)", async () => {
		const errorSpy = jest.spyOn(console, "log").mockImplementation(() => {});
		const { useParams } = jest.requireMock("react-router-dom");
		useParams.mockReturnValue({ slug: "bad-slug" });

		axios.get.mockRejectedValueOnce(new Error("network error"));

		render(<ProductDetails />);

		await waitFor(() => {
			// getProduct() catches and console.log(error)
			expect(errorSpy).toHaveBeenCalled();
		});

		errorSpy.mockRestore();
	});
});
 