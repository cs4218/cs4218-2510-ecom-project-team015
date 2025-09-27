import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import CreateProduct from "./CreateProduct";
import toast from "react-hot-toast";

jest.mock("axios");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
	...jest.requireActual("react-router-dom"),
	useNavigate: () => mockNavigate,
}));

// Mock created Using ChatGPT
jest.mock("antd", () => {
	const React = require("react");
	const Select = ({ children, value, onChange, placeholder, className, ...rest }) => {
		const testId = rest["data-testid"] ?? `antd-select-${(placeholder || "select").trim()}`;
		return (
			<select
				data-testid={testId}
				className={className}
				value={value ?? ""}
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

jest.mock("./../../components/Layout", () => ({
	__esModule: true,
	default: ({ title, children }) => (
		<div data-testid="mock-layout" data-title={title}>
			{children}
		</div>
	),
}));

jest.mock("./../../components/AdminMenu", () => ({
	__esModule: true,
	default: () => <nav data-testid="mock-admin-menu">AdminMenu</nav>,
}));

jest.mock("react-hot-toast", () => ({
	__esModule: true,
	default: { success: jest.fn(), error: jest.fn() },
}));

global.URL.createObjectURL = jest.fn(() => "blob:preview-url");

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
		if (url.includes("/api/v1/category/get-category")) return Promise.resolve(categoriesPayload);
		return Promise.reject(new Error("Unexpected GET " + url));
	});
}

beforeEach(() => {
	jest.clearAllMocks();
	arrangeDefaultAxios();
});

describe("CreateProduct Component", () => {
	it("renders Layout, AdminMenu, page heading and passes the correct Layout title", () => {
		render(<CreateProduct />);
		const layout = screen.getByTestId("mock-layout");
		expect(layout).toBeInTheDocument();
		expect(layout).toHaveAttribute("data-title", "Dashboard - Create Product");
		expect(screen.getByTestId("mock-admin-menu")).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: /create product/i, level: 1 })).toBeInTheDocument();
	});

	it("loads categories and lets user pick a category", async () => {
		render(<CreateProduct />);

		const categorySelect = await screen.findByTestId("antd-select-Select a category");
		const options = within(categorySelect).getAllByRole("option");

		expect(options.map((o) => o.textContent)).toEqual(["Cat One", "Cat Two"]);

		fireEvent.change(categorySelect, { target: { value: "cat2" } });
		expect(categorySelect).toHaveValue("cat2");
	});

	it("shows preview image when a photo is uploaded", async () => {
		render(<CreateProduct />);

		const input = await screen.findByLabelText("Upload Photo", { selector: "input[type='file']" });
		const file = new File(["x"], "pic.png", { type: "image/png" });
		fireEvent.change(input, { target: { files: [file] } });

		const img = screen.getByAltText("product_photo");
		expect(img).toHaveAttribute("src", "blob:preview-url");
	});

	it("creates product and shows success then navigates to products page", async () => {
		axios.post = jest.fn().mockResolvedValue({ data: { success: true } });

		render(<CreateProduct />);

		fireEvent.change(screen.getByPlaceholderText("write a name"), {
			target: { value: "Prod A" },
		});
		fireEvent.change(screen.getByPlaceholderText("write a description"), {
			target: { value: "Desc" },
		});
		fireEvent.change(screen.getByPlaceholderText("write a Price"), {
			target: { value: "10" },
		});
		fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
			target: { value: "3" },
		});
		fireEvent.change(await screen.findByTestId("antd-select-Select a category"), {
			target: { value: "cat1" },
		});

		// Shipping select
		const shipSelect = screen.getByTestId(/antd-select-Select Shipping\s*$/);
		fireEvent.change(shipSelect, { target: { value: "1" } });

		// Photo upload
		const file = new File(["img"], "photo.png", { type: "image/png" });
		const fileInput = screen.getByLabelText("Upload Photo", { selector: "input[type='file']" });
		fireEvent.change(fileInput, { target: { files: [file] } });

		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
		await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Product Created Successfully"));
		expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
	});

	it("shows error toast when create throws error", async () => {
		axios.post = jest.fn().mockRejectedValue(new Error("network down"));

		render(<CreateProduct />);
		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something went wrong"));
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("shows error toast when category fetch fails", async () => {
		axios.get.mockImplementation((url) => {
			if (url.includes("/get-category")) return Promise.reject(new Error("network down"));
			return Promise.reject(new Error("Unexpected GET " + url));
		});

		render(<CreateProduct />);
		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith("Something went wrong in getting catgeory")
		);
	});

	it("does not set categories when API returns success: false", async () => {
		axios.get.mockImplementation((url) => {
			if (url.includes("/get-category"))
				return Promise.resolve({ data: { success: false, category: [] } });
			return Promise.reject(new Error("Unexpected GET " + url));
		});

		render(<CreateProduct />);
		const categorySelect = await screen.findByTestId("antd-select-Select a category");
		expect(within(categorySelect).queryAllByRole("option")).toHaveLength(0);
	});

	it("navigates on success when API returns success: true", async () => {
		axios.post = jest.fn().mockResolvedValue({ data: { success: true } });

		render(<CreateProduct />);

		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
		await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Product Created Successfully"));
		expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
	});

	it("shows API error message when success: false", async () => {
		axios.post = jest
			.fn()
			.mockResolvedValue({ data: { success: false, message: "Create failed" } });

		render(<CreateProduct />);

		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Create failed"));
		expect(mockNavigate).not.toHaveBeenCalled();
	});
});
