import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import App from "../../client/src/App";
import { AuthProvider } from "../../client/src/context/auth";
import { SearchProvider } from "../../client/src/context/search";
import { CartProvider } from "../../client/src/context/cart";

// Provide a virtual axios mock so components can import it
jest.mock(
	"axios",
	() => ({
		__esModule: true,
		default: {
			get: jest.fn(),
			post: jest.fn(),
			defaults: { headers: { common: {} } },
		},
		get: jest.fn(),
		post: jest.fn(),
	}),
	{ virtual: true }
);

const Providers = ({ children, initialEntries = ["/"] }) => (
	<AuthProvider>
		<SearchProvider>
			<CartProvider>
				<MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
			</CartProvider>
		</SearchProvider>
	</AuthProvider>
);

describe("Integration: Login -> HomePage -> Search", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	function arrangeAxios({ loginOk = true } = {}) {
		// categories for Header/useCategory
		axios.get.mockImplementation((url) => {
			if (url.includes("/api/v1/category/get-category")) {
				return Promise.resolve({ data: { success: true, category: [] } });
			}
			if (url.includes("/api/v1/product/product-count")) {
				return Promise.resolve({ data: { total: 0 } });
			}
			if (url.includes("/api/v1/product/product-list/")) {
				return Promise.resolve({ data: { products: [] } });
			}
			if (url.includes("/api/v1/product/search/phone")) {
				return Promise.resolve({
					data: [
						{ _id: "p1", name: "Phone X", description: "Great", price: 500 },
						{
							_id: "p2",
							name: "Phone Y",
							description: "Also great",
							price: 400,
						},
					],
				});
			}
			return Promise.resolve({ data: {} });
		});

		axios.post.mockImplementation((url, body) => {
			if (url.includes("/api/v1/auth/login")) {
				if (loginOk) {
					return Promise.resolve({
						data: {
							success: true,
							message: "Login success",
							token: "fake-token",
							user: { _id: "u1", name: "John Doe", role: 0 },
						},
					});
				}
				return Promise.resolve({
					data: { success: false, message: "Invalid" },
				});
			}
			return Promise.resolve({ data: {} });
		});
	}

	it("logs in, lands on HomePage, performs search and sees results", async () => {
		arrangeAxios();

		render(
			<Providers initialEntries={["/login"]}>
				<App />
			</Providers>
		);

		// Fill login form
		fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
			target: { value: "john@example.com" },
		});
		fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
			target: { value: "secret123" },
		});
		fireEvent.click(screen.getByRole("button", { name: /LOGIN/i }));

		// After login we expect to be on home; Header should include user name
		await waitFor(() => {
			expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		// Search from header
		const searchBox = screen.getByRole("searchbox", { name: /search/i });
		fireEvent.change(searchBox, { target: { value: "phone" } });
		fireEvent.click(screen.getByRole("button", { name: /^Search$/i }));

		// Verify Search page
		await waitFor(() => {
			expect(
				screen.getByRole("heading", { level: 1, name: /Search Results/i })
			).toBeInTheDocument();
			expect(screen.getByText(/Found\s*2/i)).toBeInTheDocument();
		});
	});
});
