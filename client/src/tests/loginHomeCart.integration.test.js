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
			delete: jest.fn(),
			defaults: { headers: { common: {} } },
		},
		get: jest.fn(),
		post: jest.fn(),
		delete: jest.fn(),
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

describe("Integration: Login -> HomePage -> Add to Cart", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		localStorage.clear();
	});

	function arrangeAxios({ loginOk = true, addToCartOk = true } = {}) {
		const products = [
			{
				_id: "p1",
				name: "Phone X",
				description: "A very good phone with excellent battery life",
				price: 500,
				slug: "phone-x",
			},
			{
				_id: "p2",
				name: "Laptop Pro",
				description: "High performance laptop",
				price: 1200,
				slug: "laptop-pro",
			},
		];

		axios.get.mockImplementation((url) => {
			if (url.includes("/api/v1/category/get-category")) {
				return Promise.resolve({ data: { success: true, category: [] } });
			}
			if (url.includes("/api/v1/product/product-count")) {
				return Promise.resolve({ data: { total: products.length } });
			}
			if (url.includes("/api/v1/product/product-list/")) {
				return Promise.resolve({ data: { products } });
			}
			if (url.includes("/api/v1/cart")) {
				return Promise.resolve({
					data: { success: true, cart: { items: [] } },
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
					data: { success: false, message: "Invalid credentials" },
				});
			}
			if (url.includes("/api/v1/cart/add")) {
				if (addToCartOk) {
					return Promise.resolve({
						data: {
							success: true,
							cart: {
								items: [
									{
										_id: "p1",
										name: "Phone X",
										price: 500,
										quantity: 1,
									},
								],
							},
						},
					});
				}
				return Promise.resolve({
					data: { success: false, message: "Error adding to cart" },
				});
			}
			if (url.includes("/api/v1/cart/merge")) {
				return Promise.resolve({
					data: {
						success: true,
						cart: { items: [] },
					},
				});
			}
			return Promise.resolve({ data: {} });
		});

		axios.delete.mockImplementation((url) => {
			if (url.includes("/api/v1/cart/remove/")) {
				return Promise.resolve({
					data: { success: true, cart: { items: [] } },
				});
			}
			if (url.includes("/api/v1/cart/clear")) {
				return Promise.resolve({ data: { success: true } });
			}
			return Promise.resolve({ data: {} });
		});
	}

	it(
		"logs in and adds product to cart from homepage (authenticated user)",
		async () => {
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

			// Wait for homepage
			await waitFor(() => {
				expect(screen.getByText("John Doe")).toBeInTheDocument();
			});

			// Wait for products to load
			const phoneXTitle = await screen.findByText("Phone X", {}, { timeout: 5000 });
			expect(phoneXTitle).toBeInTheDocument();

			// Find the card containing Phone X
			const phoneXCard = phoneXTitle.closest(".card");
			expect(phoneXCard).not.toBeNull();

			// Find and click Add to Cart button
			const addToCartButtons = screen.getAllByRole("button", {
				name: /ADD TO CART/i,
			});
			expect(addToCartButtons.length).toBeGreaterThan(0);

			// Click first Add to Cart button
			fireEvent.click(addToCartButtons[0]);

			// Verify axios.post was called with correct endpoint
			await waitFor(() => {
				expect(axios.post).toHaveBeenCalledWith(
					"/api/v1/cart/add",
					expect.objectContaining({
						productId: "p1",
					})
				);
			});
		},
		15000
	);

	it(
		"adds product to cart as guest user (localStorage)",
		async () => {
			arrangeAxios({ loginOk: false });

			render(
				<Providers initialEntries={["/"]}>
					<App />
				</Providers>
			);

			// Wait for homepage to load
			await waitFor(() => {
				expect(screen.getByText(/All Products/i)).toBeInTheDocument();
			});

			// Wait for products
			const phoneXTitle = await screen.findByText("Phone X", {}, { timeout: 5000 });
			expect(phoneXTitle).toBeInTheDocument();

			// Click Add to Cart as guest
			const addToCartButtons = screen.getAllByRole("button", {
				name: /ADD TO CART/i,
			});
			fireEvent.click(addToCartButtons[0]);

			// Verify localStorage was updated
			await waitFor(() => {
				const cartData = localStorage.getItem("cart");
				expect(cartData).toBeTruthy();
				const cart = JSON.parse(cartData);
				expect(cart.length).toBeGreaterThan(0);
			});
		},
		15000
	);

	it(
		"handles add to cart error for authenticated user",
		async () => {
			arrangeAxios({ addToCartOk: false });

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

			// Try to add to cart
			const phoneXTitle = await screen.findByText("Phone X", {}, { timeout: 5000 });
			const phoneXCard = phoneXTitle.closest(".card");
			const addToCartButtons = screen.getAllByRole("button", {
				name: /ADD TO CART/i,
			});

			fireEvent.click(addToCartButtons[0]);

			// Verify error handling
			await waitFor(() => {
				expect(axios.post).toHaveBeenCalledWith(
					"/api/v1/cart/add",
					expect.any(Object)
				);
			});
		},
		15000
	);

	it(
		"adds multiple products to cart as guest",
		async () => {
			arrangeAxios({ loginOk: false });

			render(
				<Providers initialEntries={["/"]}>
					<App />
				</Providers>
			);

			await waitFor(() => {
				expect(screen.getByText(/All Products/i)).toBeInTheDocument();
			});

			// Wait for products
			await screen.findByText("Phone X", {}, { timeout: 5000 });
			await screen.findByText("Laptop Pro", {}, { timeout: 5000 });

			// Add first product
			const addToCartButtons = screen.getAllByRole("button", {
				name: /ADD TO CART/i,
			});

			fireEvent.click(addToCartButtons[0]);

			// Wait a bit for first item to be added
			await waitFor(() => {
				const cartData = localStorage.getItem("cart");
				expect(cartData).toBeTruthy();
			});

			// Add second product
			fireEvent.click(addToCartButtons[1]);

			// Verify both items in localStorage
			await waitFor(() => {
				const cartData = localStorage.getItem("cart");
				const cart = JSON.parse(cartData);
				expect(cart.length).toBe(2);
			});
		},
		15000
	);

	it(
		"displays correct cart count badge",
		async () => {
			arrangeAxios({ loginOk: false });

			render(
				<Providers initialEntries={["/"]}>
					<App />
				</Providers>
			);

			await waitFor(() => {
				expect(screen.getByText(/All Products/i)).toBeInTheDocument();
			});

			// Initial cart count should be 0
			const cartBadge = screen.getByTitle("0");
			expect(cartBadge).toHaveTextContent("0");

			// Add product to cart
			const phoneXTitle = await screen.findByText("Phone X", {}, { timeout: 5000 });
			const addToCartButtons = screen.getAllByRole("button", {
				name: /ADD TO CART/i,
			});

			fireEvent.click(addToCartButtons[0]);

			// Cart count should increase
			await waitFor(() => {
				const updatedBadge = screen.getByTitle("1");
				expect(updatedBadge).toHaveTextContent("1");
			});
		},
		15000
	);

	it(
		"loads cart from localStorage on mount (guest user)",
		async () => {
			// Pre-populate localStorage
			const mockCart = [{ _id: "p1", name: "Phone X", price: 500 }];
			localStorage.setItem("cart", JSON.stringify(mockCart));

			arrangeAxios({ loginOk: false });

			render(
				<Providers initialEntries={["/"]}>
					<App />
				</Providers>
			);

			await waitFor(() => {
				expect(screen.getByText(/All Products/i)).toBeInTheDocument();
			});

			// Cart badge should show 1
			await waitFor(() => {
				const cartBadge = screen.getByTitle("1");
				expect(cartBadge).toHaveTextContent("1");
			});
		},
		15000
	);

	it(
		"handles error when adding to cart (network error)",
		async () => {
			arrangeAxios();

			// Mock network error
			axios.post.mockImplementation((url) => {
				if (url.includes("/api/v1/auth/login")) {
					return Promise.resolve({
						data: {
							success: true,
							token: "fake-token",
							user: { _id: "u1", name: "John Doe", role: 0 },
						},
					});
				}
				if (url.includes("/api/v1/cart/add")) {
					return Promise.reject({
						response: { data: { message: "Network error" } },
					});
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

			// Try adding to cart
			await screen.findByText("Phone X", {}, { timeout: 5000 });
			const addToCartButtons = screen.getAllByRole("button", {
				name: /ADD TO CART/i,
			});
			fireEvent.click(addToCartButtons[0]);

			// Error should be handled
			await waitFor(() => {
				expect(axios.post).toHaveBeenCalledWith(
					"/api/v1/cart/add",
					expect.any(Object)
				);
			});
		},
		15000
	);

	it(
		"merges guest cart on login",
		async () => {
			// Pre-populate guest cart
			const guestCart = [{ _id: "p1", name: "Phone X", price: 500 }];
			localStorage.setItem("cart", JSON.stringify(guestCart));

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

			// Verify merge was called
			await waitFor(() => {
				expect(axios.post).toHaveBeenCalledWith(
					"/api/v1/cart/merge",
					expect.objectContaining({ guestCart: ["p1"] })
				);
			});
		},
		15000
	);
});
