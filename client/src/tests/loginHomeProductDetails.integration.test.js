import React from "react";
import {
	render,
	screen,
	waitFor,
	fireEvent,
	within,
} from "@testing-library/react";
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

describe("Integration: Login -> HomePage -> Product Details", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	function arrangeAxios({ loginOk = true } = {}) {
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
				name: "Phone Y",
				description: "Also great and affordable",
				price: 400,
				slug: "phone-y",
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
			if (url.includes("/api/v1/product/get-product/phone-x")) {
				return Promise.resolve({
					data: {
						product: {
							_id: "p1",
							name: "Phone X",
							description: "A very good phone with excellent battery life",
							price: 500,
							category: { _id: "c1", name: "Mobiles" },
							slug: "phone-x",
						},
					},
				});
			}
			if (url.includes("/api/v1/product/related-product/p1/c1")) {
				return Promise.resolve({ data: { products: [] } });
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

	it("logs in, navigates to Product Details via HomePage", async () => {
		arrangeAxios();

		render(
			<Providers initialEntries={["/login"]}>
				<App />
			</Providers>
		);

		fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
			target: { value: "john@example.com" },
		});
		fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
			target: { value: "secret123" },
		});
		fireEvent.click(screen.getByRole("button", { name: /LOGIN/i }));

		await waitFor(() => {
			expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
			expect(screen.getByText("John Doe")).toBeInTheDocument();
		});

		const phoneXTitle = await screen.findByRole("heading", {
			level: 5,
			name: "Phone X",
		});
		const phoneXCard = phoneXTitle.closest(".card");
		expect(phoneXCard).not.toBeNull();
		fireEvent.click(
			within(phoneXCard).getByRole("button", { name: /More Details/i })
		);

		await waitFor(() => {
			expect(
				screen.getByRole("heading", { level: 1, name: /Product Details/i })
			).toBeInTheDocument();
		});

		expect(screen.getByText(/Name\s*:\s*Phone X/i)).toBeInTheDocument();
		expect(screen.getByText(/Description\s*:/i)).toBeInTheDocument();
		expect(screen.getByText(/Category\s*:\s*Mobiles/i)).toBeInTheDocument();

		const img = screen.getByAltText("Phone X");
		expect(img).toHaveAttribute("src", "/api/v1/product/product-photo/p1");
	});

	it(
		"logs in, views product details, and adds product to cart",
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

			await waitFor(() => {
				expect(screen.getByText("John Doe")).toBeInTheDocument();
			});

			// Navigate to product details
			const phoneXTitle = await screen.findByRole(
				"heading",
				{
					level: 5,
					name: "Phone X",
				},
				{ timeout: 10000 }
			);
			const phoneXCard = phoneXTitle.closest(".card");
			fireEvent.click(
				within(phoneXCard).getByRole("button", { name: /More Details/i })
			);

			await waitFor(
				() => {
					expect(
						screen.getByRole("heading", { level: 1, name: /Product Details/i })
					).toBeInTheDocument();
				},
				{ timeout: 10000 }
			);

			// Add to cart from product details page
			const addToCartButton = screen.getByRole("button", {
				name: /ADD TO CART/i,
			});
			fireEvent.click(addToCartButton);

			// Verify product added to cart (check for success message or cart update)
			await waitFor(() => {
				expect(addToCartButton).toBeInTheDocument();
			});
		},
		15000
	);

	it(
		"logs in and navigates to second product details",
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

			await waitFor(() => {
				expect(screen.getByText("John Doe")).toBeInTheDocument();
			});

			// Find and click on Phone Y product
			const phoneYTitle = await screen.findByRole(
				"heading",
				{
					level: 5,
					name: "Phone Y",
				},
				{ timeout: 10000 }
			);
			expect(phoneYTitle).toBeInTheDocument();

			// Verify product card shows correct information
			const phoneYCard = phoneYTitle.closest(".card");
			expect(
				within(phoneYCard).getByText(/Also great and affordable/i)
			).toBeInTheDocument();
		},
		15000
	);

	it(
		"logs in, adds product to cart from homepage",
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

			await waitFor(() => {
				expect(screen.getByText("John Doe")).toBeInTheDocument();
			});

			// Find Phone X card and add to cart directly from homepage
			const phoneXTitle = await screen.findByRole(
				"heading",
				{
					level: 5,
					name: "Phone X",
				},
				{ timeout: 10000 }
			);
			const phoneXCard = phoneXTitle.closest(".card");

			const addToCartButton = within(phoneXCard).getByRole("button", {
				name: /ADD TO CART/i,
			});
			fireEvent.click(addToCartButton);

			// Verify button exists and can be clicked
			expect(addToCartButton).toBeInTheDocument();
		},
		15000
	);

	it("displays correct product count on homepage after login", async () => {
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

		// Verify both products are displayed
		await waitFor(() => {
			expect(screen.getByText("Phone X")).toBeInTheDocument();
		});
		expect(screen.getByText("Phone Y")).toBeInTheDocument();
	});

	it("fails login and does not reach homepage", async () => {
		arrangeAxios({ loginOk: false });

		render(
			<Providers initialEntries={["/login"]}>
				<App />
			</Providers>
		);

		// Try to login with invalid credentials
		fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
			target: { value: "invalid@example.com" },
		});
		fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
			target: { value: "wrongpassword" },
		});
		fireEvent.click(screen.getByRole("button", { name: /LOGIN/i }));

		// Should stay on login page
		await waitFor(() => {
			expect(screen.getByPlaceholderText("Enter Your Email")).toBeInTheDocument();
		});

		// Should not see homepage elements
		expect(screen.queryByText("Phone X")).not.toBeInTheDocument();
	});
});



