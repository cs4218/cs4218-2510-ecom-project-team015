import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import toast from "react-hot-toast";
import UpdateProduct from "./UpdateProduct";

jest.mock("axios");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
	...jest.requireActual("react-router-dom"),
	useNavigate: () => mockNavigate,
	useParams: () => ({ slug: "test-slug" }),
}));

jest.mock("react-hot-toast", () => ({
	__esModule: true,
	default: {
		success: jest.fn(),
		error: jest.fn(),
	},
}));

jest.mock("./../../components/Layout", () => ({
	__esModule: true,
	default: ({ title, children }) => (
		<div data-testid="mock-layout" data-title={title}>
			{children}
		</div>
	),
}));

jest.mock("../../components/AdminMenu", () => ({
	__esModule: true,
	default: () => <div data-testid="mock-admin-menu">AdminMenu</div>,
}));

// Mock created using ChatGPT
jest.mock("antd", () => {
	const React = require("react");
	const Select = ({ children, value, onChange, placeholder, className, ...rest }) => {
		const testId = rest["data-testid"] ?? `antd-select-${(placeholder || "select").trim()}`;
		const normalized = value === "yes" ? "1" : value === "No" ? "0" : value;

		return (
			<select
				data-testid={testId}
				className={className}
				value={normalized !== undefined ? normalized : undefined}
				onChange={(e) => onChange && onChange(e.target.value)}
			>
				{children}
			</select>
		);
	};
	const Option = ({ value, children }) => <option value={value}>{children}</option>;
	Select.Option = Option;
	return { Select };
});

global.URL.createObjectURL = jest.fn(() => "blob:preview-url");
const originalPrompt = window.prompt;

const productPayload = {
	data: {
		product: {
			_id: "prod123",
			name: "Test Product",
			description: "A product for testing",
			price: 99,
			quantity: 7,
			shipping: "1",
			category: { _id: "cat1", name: "Cat One" },
		},
	},
};

const categoriesPayload = {
	data: {
		success: true,
		category: [
			{ _id: "cat1", name: "Cat One" },
			{ _id: "cat2", name: "Cat Two" },
		],
	},
};

function arrangeDefaultAxios() {
	axios.get.mockImplementation((url) => {
		if (url.includes("/api/v1/product/get-product/")) return Promise.resolve(productPayload);
		if (url.includes("/api/v1/category/get-category")) return Promise.resolve(categoriesPayload);
		return Promise.reject(new Error("Unexpected GET " + url));
	});
}

let consoleSpy;

beforeEach(() => {
	jest.clearAllMocks();
	arrangeDefaultAxios();
	consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
	window.prompt = originalPrompt;
});

afterEach(() => {
	consoleSpy.mockRestore();
});

describe("UpdateProduct Component", () => {
	it("renders Layout, AdminMenu, page heading and passes the correct Layout title", async () => {
		render(<UpdateProduct />);
		const layout = screen.getByTestId("mock-layout");
		expect(layout).toBeInTheDocument();
		expect(screen.getByTestId("mock-admin-menu")).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: /update product/i, level: 1 })).toBeInTheDocument();
		expect(layout).toHaveAttribute("data-title", "Dashboard - Update Product");
	});

	it("loads product and category and pre-fills the form", async () => {
		render(<UpdateProduct />);

		await waitFor(() => {
			expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
		});

		expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product/test-slug");

		// Inputs values
		expect(screen.getByPlaceholderText("write a name")).toHaveValue("Test Product");
		expect(screen.getByPlaceholderText("write a description")).toHaveValue("A product for testing");
		expect(screen.getByPlaceholderText("write a Price")).toHaveValue(99);
		expect(screen.getByPlaceholderText("write a quantity")).toHaveValue(7);

		// Category options
		const categorySelect = screen.getByTestId("antd-select-Select a category");
		const catOptions = within(categorySelect).getAllByRole("option");
		expect(categorySelect).toBeInTheDocument();
		expect(categorySelect).toHaveValue("cat1");
		expect(catOptions.map((o) => o.textContent)).toEqual(["Cat One", "Cat Two"]);

		// Product image
		expect(screen.getAllByAltText("product_photo")[0]).toHaveAttribute(
			"src",
			"/api/v1/product/product-photo/prod123"
		);
	});

	it("shows preview image when a photo is uploaded", async () => {
		render(<UpdateProduct />);
		await screen.findByPlaceholderText("write a name");

		const file = new File(["data"], "pic.png", { type: "image/png" });
		const fileInput = screen.getByLabelText("Upload Photo", { selector: "input[type='file']" });

		fireEvent.change(fileInput, { target: { files: [file] } });

		const imgs = screen.getAllByAltText("product_photo");
		expect(imgs[0]).toHaveAttribute("src", "blob:preview-url");
	});

	it("submits update and shows success then navigates to products page on success", async () => {
		axios.put = jest.fn().mockResolvedValue({ data: { success: true } });

		render(<UpdateProduct />);

		await screen.findByPlaceholderText("write a name");

		// Form changes
		fireEvent.change(screen.getByPlaceholderText("write a name"), {
			target: { value: "Updated Name" },
		});
		fireEvent.change(screen.getByPlaceholderText("write a description"), {
			target: { value: "Updated Description" },
		});
		fireEvent.change(screen.getByPlaceholderText("write a Price"), {
			target: { value: "120" },
		});
		fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
			target: { value: "10" },
		});
		fireEvent.change(screen.getByTestId("antd-select-Select a category"), {
			target: { value: "cat2" },
		});

		// Photo upload
		const file = new File(["img"], "photo.png", { type: "image/png" });
		const fileInput = screen.getByLabelText("Upload Photo", { selector: "input[type='file']" });
		fireEvent.change(fileInput, { target: { files: [file] } });

		// Submit form
		fireEvent.click(screen.getByRole("button", { name: /update product/i }));

		await waitFor(() => expect(axios.put).toHaveBeenCalledTimes(1));
		await waitFor(() => {
			expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
		});

		expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
	});

	it("shows error toast when update fails", async () => {
		axios.put = jest.fn().mockResolvedValue({ data: { success: false, message: "Update failed" } });

		render(<UpdateProduct />);
		await waitFor(() => screen.findByPlaceholderText("write a name"));

		fireEvent.click(screen.getByRole("button", { name: /update product/i }));
		await waitFor(() => expect(axios.put).toHaveBeenCalledTimes(1));
		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith("Update failed");
		});
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("deletes a product after confirming prompt", async () => {
		axios.delete = jest.fn().mockResolvedValue({ data: { success: true } });
		window.prompt = jest.fn().mockReturnValue("yes");

		render(<UpdateProduct />);
		await waitFor(() => screen.findByPlaceholderText("write a name"));

		fireEvent.click(screen.getByRole("button", { name: /delete product/i }));

		await waitFor(() => {
			expect(axios.delete).toHaveBeenCalledWith("/api/v1/product/delete-product/prod123");
		});

		expect(toast.success).toHaveBeenCalledWith("Product Deleted Successfully");
		expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
	});

	it("does not delete when user cancels the prompt", async () => {
		axios.delete = jest.fn();
		window.prompt = jest.fn().mockReturnValue("");

		render(<UpdateProduct />);
		await waitFor(() => screen.findByPlaceholderText("write a name"));

		fireEvent.click(screen.getByRole("button", { name: /delete product/i }));

		await waitFor(() => {
			expect(axios.delete).not.toHaveBeenCalled();
		});
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("shows error toast when category fetch fails", async () => {
		axios.get.mockImplementation((url) => {
			if (url.includes("/get-product/")) return Promise.resolve(productPayload);
			if (url.includes("/get-category")) return Promise.reject(new Error("boom"));
			return Promise.reject(new Error("unexpected"));
		});

		render(<UpdateProduct />);

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith("Something went wrong in getting catgeory");
		});
	});

	it("logs when getSingleProduct fails", async () => {
		axios.get.mockImplementation((url) => {
			if (url.includes("/get-product/")) return Promise.reject(new Error("boom"));
			if (url.includes("/get-category")) return Promise.resolve(categoriesPayload);
		});
		const log = jest.spyOn(console, "log").mockImplementation(() => {});
		render(<UpdateProduct />);
		await waitFor(() => expect(log).toHaveBeenCalled());
		log.mockRestore();
	});

	it("toasts when getAllCategory fails", async () => {
		axios.get.mockImplementation((url) => {
			if (url.includes("/get-product/")) return Promise.resolve(productPayload);
			if (url.includes("/get-category")) return Promise.reject(new Error("nope"));
		});
		render(<UpdateProduct />);
		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith("Something went wrong in getting catgeory")
		);
	});

	it("shows error toast when update throws error", async () => {
		axios.put = jest.fn().mockRejectedValue(new Error("network down"));

		render(<UpdateProduct />);

		await screen.findByPlaceholderText("write a name");
		fireEvent.click(screen.getByRole("button", { name: /update product/i }));

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something went wrong"));

		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("shows error toast when delete throws error", async () => {
		axios.delete = jest.fn().mockRejectedValue(new Error("delete failed"));
		window.prompt = jest.fn().mockReturnValue("yes");

		render(<UpdateProduct />);

		await screen.findByPlaceholderText("write a name");

		fireEvent.click(screen.getByRole("button", { name: /delete product/i }));

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something went wrong"));
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	// Created using ChatGPT
	it("does not set categories when API returns success: false", async () => {
		axios.get.mockImplementation((url) => {
			if (url.includes("/get-product/")) return Promise.resolve(productPayload);
			if (url.includes("/get-category"))
				return Promise.resolve({ data: { success: false, category: [] } });
			return Promise.reject(new Error("unexpected"));
		});

		render(<UpdateProduct />);
		const catSelect = await screen.findByTestId("antd-select-Select a category");

		const options = within(catSelect).queryAllByRole("option");
		expect(options.length).toBe(0);
	});
});
