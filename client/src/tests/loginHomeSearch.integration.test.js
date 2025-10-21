import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import { AuthProvider } from "../context/auth";
import { SearchProvider } from "../context/search";
import { CartProvider } from "../context/cart";

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


//Created with the help of ChatGPT
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
		});
		expect(screen.getByText(/Found\s*2/i)).toBeInTheDocument();
	});

	it("logs in, searches with empty query", async () => {
		arrangeAxios();

		render(
			<Providers initialEntries={["/login"]}>
				<App />
			</Providers>
		);

		// Login
		fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
			target: { value: "john@example.com" },
		});
		fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
			target: { value: "secret123" },
		});
		fireEvent.click(screen.getByRole("button", { name: /LOGIN/i }));

		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		// Search with empty query
		const searchBox = screen.getByRole("searchbox", { name: /search/i });
		fireEvent.change(searchBox, { target: { value: "" } });
		fireEvent.click(screen.getByRole("button", { name: /^Search$/i }));

		// Should stay on homepage or handle empty search gracefully
		expect(searchBox).toBeInTheDocument();
	});

	it("logs in, performs search, and views search results", async () => {
		arrangeAxios();

		render(
			<Providers initialEntries={["/login"]}>
				<App />
			</Providers>
		);

		// Login
		fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
			target: { value: "john@example.com" },
		});
		fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
			target: { value: "secret123" },
		});
		fireEvent.click(screen.getByRole("button", { name: /LOGIN/i }));

		await waitFor(() => {
			expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
		});

		// Search from header
		const searchBox = screen.getByRole("searchbox", { name: /search/i });
		fireEvent.change(searchBox, { target: { value: "phone" } });
		fireEvent.click(screen.getByRole("button", { name: /^Search$/i }));

		// Verify Search page and results
		await waitFor(() => {
			expect(
				screen.getByRole("heading", { level: 1, name: /Search Results/i })
			).toBeInTheDocument();
		});

		// Verify search results are displayed
		await waitFor(() => {
			expect(screen.getByText(/Found\s*2/i)).toBeInTheDocument();
		});
		expect(screen.getByText("Phone X")).toBeInTheDocument();
		expect(screen.getByText("Phone Y")).toBeInTheDocument();
	});

	it("logs in with valid credentials and sees user dashboard", async () => {
		arrangeAxios();

		render(
			<Providers initialEntries={["/login"]}>
				<App />
			</Providers>
		);

		// Login
		fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
			target: { value: "john@example.com" },
		});
		fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
			target: { value: "secret123" },
		});
		fireEvent.click(screen.getByRole("button", { name: /LOGIN/i }));

		// Verify successful login and redirection
		await waitFor(() => {
			expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
		});
		expect(screen.getByText("John Doe")).toBeInTheDocument();

		// Verify we're on the homepage - "All Products" is in h1
		await waitFor(() => {
			expect(screen.getByText(/All Products/i)).toBeInTheDocument();
		});
	});

	it("fails login with incorrect credentials", async () => {
		arrangeAxios({ loginOk: false });

		render(
			<Providers initialEntries={["/login"]}>
				<App />
			</Providers>
		);

		// Try to login with invalid credentials
		fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
			target: { value: "wrong@example.com" },
		});
		fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
			target: { value: "wrongpass" },
		});
		fireEvent.click(screen.getByRole("button", { name: /LOGIN/i }));

		// Should stay on login page - verify login form still visible
		await waitFor(() => {
			expect(screen.getByPlaceholderText("Enter Your Email")).toBeInTheDocument();
			expect(screen.getByPlaceholderText("Enter Your Password")).toBeInTheDocument();
		});
	});

	it("logs in and search input is functional", async () => {
		arrangeAxios();

		render(
			<Providers initialEntries={["/login"]}>
				<App />
			</Providers>
		);

		// Login
		fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
			target: { value: "john@example.com" },
		});
		fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
			target: { value: "secret123" },
		});
		fireEvent.click(screen.getByRole("button", { name: /LOGIN/i }));

		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		// Verify search box is present and functional
		const searchBox = screen.getByRole("searchbox", { name: /search/i });
		expect(searchBox).toBeInTheDocument();

		// Type in search box
		fireEvent.change(searchBox, { target: { value: "phone" } });
		expect(searchBox).toHaveValue("phone");
	});

	it("logs in and header navigation links are visible", async () => {
		arrangeAxios();

		render(
			<Providers initialEntries={["/login"]}>
				<App />
			</Providers>
		);

		// Login
		fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
			target: { value: "john@example.com" },
		});
		fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
			target: { value: "secret123" },
		});
		fireEvent.click(screen.getByRole("button", { name: /LOGIN/i }));

		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		// Verify header navigation elements
		expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
		expect(screen.getByText(/Cart/i)).toBeInTheDocument();

		// Verify user dropdown menu is present
		const userDropdown = screen.getByText("John Doe");
		expect(userDropdown).toBeInTheDocument();
		expect(userDropdown).toHaveClass("dropdown-toggle");
	});

	it("displays cart badge with correct count", async () => {
		arrangeAxios();

		render(
			<Providers initialEntries={["/login"]}>
				<App />
			</Providers>
		);

		// Login
		fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
			target: { value: "john@example.com" },
		});
		fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
			target: { value: "secret123" },
		});
		fireEvent.click(screen.getByRole("button", { name: /LOGIN/i }));

		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		// Verify cart link exists
		const cartLink = screen.getByText(/Cart/i);
		expect(cartLink).toBeInTheDocument();

		// Verify cart badge shows 0 initially
		const cartBadge = screen.getByTitle("0");
		expect(cartBadge).toHaveTextContent("0");
	});
});
