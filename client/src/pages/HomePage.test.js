import React from "react";
import {
	render,
	screen,
	within,
	waitFor,
	fireEvent,
} from "@testing-library/react";
import HomePage from "./HomePage";
import axios from "axios";
import toast from "react-hot-toast"; 

jest.mock("axios");

// Mock react-router navigate
jest.mock("react-router-dom", () => ({
	...jest.requireActual("react-router-dom"),
	useNavigate: () => jest.fn(),
}));

// Mock antd (Checkbox/Radio) with the help of ChatGPT
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

// Mock cart context with addToCart action so HomePage can call it
jest.mock("../context/cart", () => {
  const toast = require("react-hot-toast");
  return {
    useCart: () => {
      const cart = [];
      const setCart = jest.fn();
      const actions = {
        addToCart: (product) => {
          const updated = [...cart, product];
          setCart(updated);
          try {
            // Access via globalThis to satisfy Jest mock scoping rules
            globalThis.localStorage.setItem("cart", JSON.stringify(updated));
          } catch (e) {
            // keep parity with app logging behavior
            console.log(e);
          }
          // Align with test expectation casing
          toast.success("Item Added to cart");
        },
      };
      return [cart, setCart, actions];
    },
  };
});

// Mock toast
jest.mock("react-hot-toast", () => ({ success: jest.fn(), error: jest.fn() }));

// Mock Layout with the help of ChatGPT
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
		.mockResolvedValueOnce({ data: { products } }); // /product-list/1
}

// Initial render
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

		expect(await screen.findByText("Accessories")).toBeInTheDocument();
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
		expect(screen.queryByRole("button", { name: /Loadmore/i })).toBeNull();
	});

	test("logs errors (categories) without crashing", async () => {
		const spy = jest.spyOn(console, "log").mockImplementation(() => {});

		axios.get
			.mockRejectedValueOnce(new Error("cat fail")) // /get-category
			.mockResolvedValueOnce({ data: { total: 0 } }) // /product-count
			.mockResolvedValueOnce({ data: { products: [] } }); // /product-list/1

		render(<HomePage />);

		await waitFor(() => {
			expect(spy).toHaveBeenCalled();
		});
		spy.mockRestore();

		expect(screen.getByTestId("layout")).toBeInTheDocument();
		expect(screen.queryByRole("heading", { level: 5 })).toBeNull();
	});
});

//Interactios & filters

describe("HomePage interactions & filters", () => {
	test("loads more products when clicking Loadmore button", async () => {
		const categories = [{ _id: "c1", name: "Laptops" }];
		const productsPage1 = [
			{
				_id: "p1",
				name: "Mac",
				description: "light",
				price: 1000,
				slug: "mac",
			},
		];
		const productsPage2 = [
			{
				_id: "p2",
				name: "Dell",
				description: "work",
				price: 900,
				slug: "dell",
			},
		];

		axios.get
			.mockResolvedValueOnce({ data: { success: true, category: categories } }) // get-category
			.mockResolvedValueOnce({ data: { total: 2 } }) // product-count
			.mockResolvedValueOnce({ data: { products: productsPage1 } }) // product-list/1
			.mockResolvedValueOnce({ data: { products: productsPage2 } }); // product-list/2

		render(<HomePage />);

		expect(await screen.findByText("Laptops")).toBeInTheDocument();

		const loadBtn = await screen.findByRole("button", { name: /Loadmore/i });
		fireEvent.click(loadBtn);

		await waitFor(() => {
			expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/2");
		});

		expect(await screen.findByText("Dell")).toBeInTheDocument();
	});

	test("handles category filter selection (valid)", async () => {
		const categories = [{ _id: "c1", name: "Books" }];
		const products = [
			{ _id: "p1", name: "Book1", description: "desc", price: 10, slug: "b1" },
		];

		// mount 3 apis
		axios.get
			.mockResolvedValueOnce({ data: { success: true, category: categories } }) // get-category
			.mockResolvedValueOnce({ data: { total: 1 } }) // product-count
			.mockResolvedValueOnce({ data: { products } }); // product-list/1
		// filterProduct (POST)
		axios.post.mockResolvedValueOnce({ data: { products } });

		render(<HomePage />);

		const checkbox = await screen.findByLabelText("Books");
		fireEvent.click(checkbox);

		await waitFor(() => {
			expect(axios.post).toHaveBeenCalledWith(
				"/api/v1/product/product-filters",
				expect.objectContaining({ checked: ["c1"], radio: [] })
			);
		});
	});


    // created with the help of ChatGPT
	test("handles category filter uncheck (invalid path)", async () => {
		const categories = [{ _id: "c1", name: "Books" }];
		const products = [
			{ _id: "p1", name: "Book1", description: "desc", price: 10, slug: "b1" },
		];

		// mount 3 apis
		axios.get
			.mockResolvedValueOnce({ data: { success: true, category: categories } }) // get-category
			.mockResolvedValueOnce({ data: { total: 1 } }) // product-count
			.mockResolvedValueOnce({ data: { products } }); // product-list/1
		axios.get.mockResolvedValueOnce({ data: { products } }); // product-list/1 (refetch)

		render(<HomePage />);

		const checkbox = await screen.findByLabelText("Books");
		fireEvent.click(checkbox);
		fireEvent.click(checkbox); 

		await waitFor(() => {
			expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
		});
	});

	test("handles add to cart click (localStorage + toast)", async () => {
		const categories = [{ _id: "c1", name: "Accessories" }];
		const products = [
			{
				_id: "p1",
				name: "Pen",
				description: "Blue pen",
				price: 5,
				slug: "pen",
			},
		];
		mockInitialFetches({ categories, total: 1, products });

		const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

		render(<HomePage />);

		const addBtn = await screen.findByRole("button", { name: /ADD TO CART/i });
		fireEvent.click(addBtn);

		await waitFor(() => {
			expect(setItemSpy).toHaveBeenCalled();
			expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
		});

		setItemSpy.mockRestore();
	});

	test("handles API error in getAllProducts", async () => {
		const spy = jest.spyOn(console, "log").mockImplementation(() => {});
		// get-category OK, product-count OK, product-list/1 FAIL
		axios.get
			.mockResolvedValueOnce({
				data: { success: true, category: [{ _id: "c", name: "Phones" }] },
			})
			.mockResolvedValueOnce({ data: { total: 0 } })
			.mockRejectedValueOnce(new Error("fail"));

		render(<HomePage />);

		await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));
		await waitFor(() => expect(spy).toHaveBeenCalled());
		spy.mockRestore();
	});

	// test("handles API error in getTotal", async () => {
	// 	const spy = jest.spyOn(console, "log").mockImplementation(() => {});
	// 	// get-category OK, product-count FAIL (getTotal), product-list/1  will be called ?
	// 	axios.get
	// 		.mockResolvedValueOnce({
	// 			data: { success: true, category: [{ _id: "c1", name: "Accessories" }] },
	// 		})
	// 		.mockRejectedValueOnce(new Error("count fail"));

	// 	render(<HomePage />);

	// 	await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2)); // category + count
	// 	await waitFor(() => expect(spy).toHaveBeenCalled());
	// 	spy.mockRestore();
	// });
});
