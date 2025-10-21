import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import { AuthProvider } from "../context/auth";
import { SearchProvider } from "../context/search";
import { CartProvider } from "../context/cart";

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

describe("Integration: Login -> HomePage -> Filter by Category", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	function arrangeAxios({ loginOk = true } = {}) {
		const allProducts = [
			{
				_id: "p1",
				name: "Phone X",
				description: "A very good phone with excellent battery life",
				price: 500,
				slug: "phone-x",
				category: { _id: "c1", name: "Electronics" },
			},
			{
				_id: "p2",
				name: "Laptop Pro",
				description: "High performance laptop for professionals",
				price: 1200,
				slug: "laptop-pro",
				category: { _id: "c1", name: "Electronics" },
			},
			{
				_id: "p3",
				name: "T-Shirt",
				description: "Comfortable cotton t-shirt",
				price: 25,
				slug: "t-shirt",
				category: { _id: "c2", name: "Clothing" },
			},
		];

		const categories = [
			{ _id: "c1", name: "Electronics", slug: "electronics" },
			{ _id: "c2", name: "Clothing", slug: "clothing" },
		];

		axios.get.mockImplementation((url) => {
			if (url.includes("/api/v1/category/get-category")) {
				return Promise.resolve({ data: { success: true, category: categories } });
			}
			if (url.includes("/api/v1/product/product-count")) {
				return Promise.resolve({ data: { total: allProducts.length } });
			}
			if (url.includes("/api/v1/product/product-list/")) {
				return Promise.resolve({ data: { products: allProducts } });
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
					data: { success: false, message: "Invalid credentials" },
				});
			}
			if (url.includes("/api/v1/product/product-filters")) {
				const { checked, radio } = body;
				let filtered = [...allProducts];

				// Filter by category
				if (checked && checked.length > 0) {
					filtered = filtered.filter((p) => checked.includes(p.category._id));
				}

				// Filter by price (if implemented)
				if (radio && radio.length === 2) {
					const [min, max] = radio;
					filtered = filtered.filter((p) => p.price >= min && p.price <= max);
				}

				return Promise.resolve({ data: { products: filtered } });
			}
			return Promise.resolve({ data: {} });
		});
	}

	it("logs in, navigates to HomePage, filters by Electronics category", async () => {
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

		// Verify on HomePage
		await waitFor(() => {
			expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
		});
		expect(screen.getByText("John Doe")).toBeInTheDocument();

		// Verify all products are displayed
		await waitFor(() => {
			expect(screen.getByText("Phone X")).toBeInTheDocument();
		});
		expect(screen.getByText("Laptop Pro")).toBeInTheDocument();
		expect(screen.getByText("T-Shirt")).toBeInTheDocument();

		// Filter by Electronics category - wait for checkbox to be available
		const electronicsCheckbox = await waitFor(() => {
			const checkbox = screen.getByRole("checkbox", {
				name: /Electronics/i,
			});
			expect(checkbox).toBeInTheDocument();
			return checkbox;
		});
		fireEvent.click(electronicsCheckbox);

		// Verify filtered products (only Electronics)
		await waitFor(() => {
			expect(screen.getByText("Phone X")).toBeInTheDocument();
		});
		expect(screen.getByText("Laptop Pro")).toBeInTheDocument();
		expect(screen.queryByText("T-Shirt")).not.toBeInTheDocument();
	});

	it("logs in, filters by Clothing category, then resets filters", async () => {
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

		// Verify on HomePage
		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		// Filter by Clothing category - wait for checkbox to be available
		const clothingCheckbox = await waitFor(() => {
			const checkbox = screen.getByRole("checkbox", {
				name: /Clothing/i,
			});
			expect(checkbox).toBeInTheDocument();
			return checkbox;
		});
		fireEvent.click(clothingCheckbox);

		// Verify filtered products (only Clothing)
		await waitFor(() => {
			expect(screen.getByText("T-Shirt")).toBeInTheDocument();
		});
		expect(screen.queryByText("Phone X")).not.toBeInTheDocument();
		expect(screen.queryByText("Laptop Pro")).not.toBeInTheDocument();

		// Reset filters
		const resetButton = screen.getByRole("button", { name: /RESET FILTERS/i });
		fireEvent.click(resetButton);

		// Note: Reset button calls window.location.reload(), which in test environment
		// would require mocking. This test verifies the button exists and can be clicked.
	});

	it("logs in and filters by multiple categories", async () => {
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

		// Select both categories - wait for checkboxes to be available
		const electronicsCheckbox = await waitFor(() => {
			const checkbox = screen.getByRole("checkbox", {
				name: /Electronics/i,
			});
			expect(checkbox).toBeInTheDocument();
			return checkbox;
		});
		const clothingCheckbox = screen.getByRole("checkbox", {
			name: /Clothing/i,
		});

		fireEvent.click(electronicsCheckbox);
		fireEvent.click(clothingCheckbox);

		// Should show all products since both categories are selected
		await waitFor(() => {
			expect(screen.getByText("Phone X")).toBeInTheDocument();
		});
		expect(screen.getByText("Laptop Pro")).toBeInTheDocument();
		expect(screen.getByText("T-Shirt")).toBeInTheDocument();
	});

	it("fails to login with invalid credentials", async () => {
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
			target: { value: "wrongpassword" },
		});
		fireEvent.click(screen.getByRole("button", { name: /LOGIN/i }));

		// Should stay on login page
		await waitFor(() => {
			expect(screen.getByPlaceholderText("Enter Your Email")).toBeInTheDocument();
		});
	});

	it("logs in and unselects a category filter", async () => {
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

		// Wait for all products
		await waitFor(() => {
			expect(screen.getByText("Phone X")).toBeInTheDocument();
		});
		expect(screen.getByText("Laptop Pro")).toBeInTheDocument();
		expect(screen.getByText("T-Shirt")).toBeInTheDocument();

		// Select Electronics filter
		const electronicsCheckbox = await waitFor(() => {
			const checkbox = screen.getByRole("checkbox", {
				name: /Electronics/i,
			});
			expect(checkbox).toBeInTheDocument();
			return checkbox;
		});
		fireEvent.click(electronicsCheckbox);

		// Verify filtered (only Electronics)
		await waitFor(() => {
			expect(screen.getByText("Phone X")).toBeInTheDocument();
		});
		expect(screen.getByText("Laptop Pro")).toBeInTheDocument();
		expect(screen.queryByText("T-Shirt")).not.toBeInTheDocument();

		// Unselect Electronics filter
		fireEvent.click(electronicsCheckbox);

		// Should show all products again
		await waitFor(() => {
			expect(screen.getByText("Phone X")).toBeInTheDocument();
		});
		expect(screen.getByText("Laptop Pro")).toBeInTheDocument();
		expect(screen.getByText("T-Shirt")).toBeInTheDocument();
	});

	it("logs in and filters show no products when no match", async () => {
		// Mock axios to return empty filtered results
		const allProducts = [
			{
				_id: "p1",
				name: "Phone X",
				description: "A very good phone",
				price: 500,
				slug: "phone-x",
				category: { _id: "c1", name: "Electronics" },
			},
		];

		const categories = [
			{ _id: "c1", name: "Electronics", slug: "electronics" },
			{ _id: "c2", name: "Clothing", slug: "clothing" },
		];

		axios.get.mockImplementation((url) => {
			if (url.includes("/api/v1/category/get-category")) {
				return Promise.resolve({ data: { success: true, category: categories } });
			}
			if (url.includes("/api/v1/product/product-count")) {
				return Promise.resolve({ data: { total: 1 } });
			}
			if (url.includes("/api/v1/product/product-list/")) {
				return Promise.resolve({ data: { products: allProducts } });
			}
			return Promise.resolve({ data: {} });
		});

		axios.post.mockImplementation((url, body) => {
			if (url.includes("/api/v1/auth/login")) {
				return Promise.resolve({
					data: {
						success: true,
						token: "fake-token",
						user: { _id: "u1", name: "John Doe", role: 0 },
					},
				});
			}
			if (url.includes("/api/v1/product/product-filters")) {
				const { checked } = body;
				// If filtering by Clothing but only Electronics products exist
				if (checked.includes("c2")) {
					return Promise.resolve({ data: { products: [] } });
				}
				return Promise.resolve({ data: { products: allProducts } });
			}
			return Promise.resolve({ data: {} });
		});

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

		// Wait for product to load
		await waitFor(() => {
			expect(screen.getByText("Phone X")).toBeInTheDocument();
		});

		// Filter by Clothing (no products match)
		const clothingCheckbox = await waitFor(() => {
			const checkbox = screen.getByRole("checkbox", {
				name: /Clothing/i,
			});
			return checkbox;
		});
		fireEvent.click(clothingCheckbox);

		// No products should be displayed
		await waitFor(() => {
			expect(screen.queryByText("Phone X")).not.toBeInTheDocument();
		});
	});

	it("logs in and filter section displays correct category count", async () => {
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

		// Verify filter heading
		await waitFor(() => {
			expect(screen.getByText(/Filter By Category/i)).toBeInTheDocument();
		});

		// Verify category checkboxes are displayed
		const electronicsCheckbox = await waitFor(() => {
			return screen.getByRole("checkbox", { name: /Electronics/i });
		});
		const clothingCheckbox = screen.getByRole("checkbox", { name: /Clothing/i });

		expect(electronicsCheckbox).toBeInTheDocument();
		expect(clothingCheckbox).toBeInTheDocument();
	});

	it("logs in as guest and filters products without authentication", async () => {
		arrangeAxios({ loginOk: false });

		render(
			<Providers initialEntries={["/"]}>
				<App />
			</Providers>
		);

		// Should be on homepage without login
		await waitFor(() => {
			expect(screen.getByText(/All Products/i)).toBeInTheDocument();
		});

		// Wait for products
		await waitFor(() => {
			expect(screen.getByText("Phone X")).toBeInTheDocument();
		});

		// Try to filter as guest user
		const electronicsCheckbox = await waitFor(() => {
			return screen.getByRole("checkbox", { name: /Electronics/i });
		});

		fireEvent.click(electronicsCheckbox);

		// Should still work for guest users
		await waitFor(() => {
			expect(screen.getByText("Phone X")).toBeInTheDocument();
		});
	});
});

