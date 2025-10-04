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

const validForm = async ({
	name = "Prod A",
	description = "Nice",
	price = 10,
	quantity = 2,
	category = "cat1",
	shipping = "1",
	photoBytes = 500_000,
} = {}) => {
	// text inputs
	fireEvent.change(screen.getByPlaceholderText(/write a name/i), { target: { value: name } });
	fireEvent.change(screen.getByPlaceholderText(/write a description/i), {
		target: { value: description },
	});
	fireEvent.change(screen.getByPlaceholderText(/write a price/i), { target: { value: price } });
	fireEvent.change(screen.getByPlaceholderText(/write a quantity/i), {
		target: { value: quantity },
	});

	// category
	const catSelect = await screen.findByTestId("antd-select-Select a category");
	fireEvent.change(catSelect, { target: { value: category } });

	// shipping
	const shipSelect = screen.getByTestId(/antd-select-Select Shipping\s*$/);
	fireEvent.change(shipSelect, { target: { value: String(shipping) } });

	// photo
	const file = new File(["x".repeat(photoBytes)], "pic.jpg", { type: "image/jpeg" });
	const fileInput = screen.getByLabelText("Upload Photo", { selector: "input[type='file']" });
	fireEvent.change(fileInput, { target: { files: [file] } });
};

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

	it("blocks submit when name is blank", async () => {
		render(<CreateProduct />);

		await validForm({ name: "   " });
		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Name is required"));
		expect(axios.post).not.toHaveBeenCalled();
	});

	it("blocks submit when description is blank", async () => {
		render(<CreateProduct />);

		await validForm({ description: " " });
		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Description is required"));
		expect(axios.post).not.toHaveBeenCalled();
	});

	it("blocks submit when category is missing", async () => {
		render(<CreateProduct />);

		await validForm({ category: " " });

		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Category is required"));
		expect(axios.post).not.toHaveBeenCalled();
	});

	it("blocks submit when price is missing", async () => {
		render(<CreateProduct />);

		await validForm({ price: "" });

		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Price is Required"));
		expect(axios.post).not.toHaveBeenCalled();
	});

	it("blocks submit when quantity is missing", async () => {
		render(<CreateProduct />);

		await validForm({ quantity: "" });

		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Quantity is Required"));
		expect(axios.post).not.toHaveBeenCalled();
	});

	it("blocks submit when photo is missing", async () => {
		render(<CreateProduct />);

		fireEvent.change(screen.getByPlaceholderText(/write a name/i), { target: { value: "P" } });
		fireEvent.change(screen.getByPlaceholderText(/write a description/i), {
			target: { value: "D" },
		});
		fireEvent.change(screen.getByPlaceholderText(/write a price/i), { target: { value: 10 } });
		fireEvent.change(screen.getByPlaceholderText(/write a quantity/i), { target: { value: 2 } });
		const catSelect = await screen.findByTestId("antd-select-Select a category");
		fireEvent.change(catSelect, { target: { value: "cat1" } });

		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Photo is required"));
		expect(axios.post).not.toHaveBeenCalled();
	});

	it("blocks submit when photo size > 1MB", async () => {
		render(<CreateProduct />);

		await validForm({ photoBytes: 1_000_001 });
		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Photo must be ≤ 1MB"));
		expect(axios.post).not.toHaveBeenCalled();
	});

	it("blocks submit when quantity is not an integer", async () => {
		render(<CreateProduct />);

		await validForm({ quantity: 2.5 });
		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith("Quantity must be an integer > 0 and ≤ 100000")
		);
		expect(axios.post).not.toHaveBeenCalled();
	});

	it("blocks submit when price ≤ 0", async () => {
		render(<CreateProduct />);

		await validForm({ price: 0 });
		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith("Price must be > 0 and ≤ 1000000")
		);
		expect(axios.post).not.toHaveBeenCalled();
	});

	it("blocks submit when quantity ≤ 0", async () => {
		render(<CreateProduct />);

		await validForm({ quantity: "0" });
		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith("Quantity must be an integer > 0 and ≤ 100000")
		);
		expect(axios.post).not.toHaveBeenCalled();
	});

	it("blocks submit when price is too large", async () => {
		render(<CreateProduct />);

		await validForm({ price: "1000001" });
		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith("Price must be > 0 and ≤ 1000000")
		);
		expect(axios.post).not.toHaveBeenCalled();
	});

	it("blocks submit when quantity is too large", async () => {
		render(<CreateProduct />);

		await validForm({ quantity: "100001" });
		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith("Quantity must be an integer > 0 and ≤ 100000")
		);
		expect(axios.post).not.toHaveBeenCalled();
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

	it("successfully creates product and then navigates to products page", async () => {
		axios.post = jest.fn().mockResolvedValue({ data: { success: true } });

		render(<CreateProduct />);

		await validForm();

		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
		expect(toast.success).toHaveBeenCalledWith("Product Created Successfully");
		expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
	});

	it("shows error toast when create throws error", async () => {
		axios.post = jest.fn().mockRejectedValue(new Error("network down"));

		render(<CreateProduct />);
		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Name is required"));
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("shows error toast when category fetch fails", async () => {
		axios.get.mockImplementation((url) => {
			if (url.includes("/get-category")) return Promise.reject(new Error("network down"));
			return Promise.reject(new Error("Unexpected GET " + url));
		});

		render(<CreateProduct />);
		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith("Something went wrong in getting category")
		);
	});

	it("shows conflict message when backend returns 409", async () => {
		axios.post = jest.fn().mockRejectedValue({ response: { status: 409 } });

		render(<CreateProduct />);
		await validForm();
		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Product already exists"));
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("shows invalid data message when backend returns 400", async () => {
		axios.post = jest.fn().mockRejectedValue({ response: { status: 400 } });

		render(<CreateProduct />);
		await validForm();
		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Invalid product data"));
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("surfaces backend response message", async () => {
		axios.post = jest
			.fn()
			.mockRejectedValue({ response: { data: { message: "Backend rejects payload" } } });

		render(<CreateProduct />);
		await validForm();
		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Backend rejects payload"));
	});

	it("surfaces backend response error string", async () => {
		axios.post = jest.fn().mockRejectedValue({ response: { data: { error: "Bad payload" } } });

		render(<CreateProduct />);
		await validForm();
		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Bad payload"));
	});

	it("does not set categories when API returns that create is unsuccessful", async () => {
		axios.get.mockImplementation((url) => {
			if (url.includes("/get-category"))
				return Promise.resolve({ data: { success: false, category: [] } });
			return Promise.reject(new Error("Unexpected GET " + url));
		});

		render(<CreateProduct />);
		const categorySelect = await screen.findByTestId("antd-select-Select a category");
		expect(within(categorySelect).queryAllByRole("option")).toHaveLength(0);
	});

	it("navigates on success when API returns that create is successful", async () => {
		axios.post = jest.fn().mockResolvedValue({ data: { success: true } });
		render(<CreateProduct />);
		await validForm();
		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
		expect(toast.success).toHaveBeenCalledWith("Product Created Successfully");
		expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
	});

	it("shows API error message when create is unsuccessful", async () => {
		axios.post = jest
			.fn()
			.mockResolvedValue({ data: { success: false, message: "Create failed" } });
		render(<CreateProduct />);
		await validForm();
		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
		expect(toast.error).toHaveBeenCalledWith("Create failed");
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("shows generic error when create rejects without response", async () => {
		axios.post = jest.fn().mockRejectedValue(new Error("network down"));

		render(<CreateProduct />);
		await validForm();
		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
		expect(toast.error).toHaveBeenCalledWith("Something went wrong");
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("does not render preview image before any photo is uploaded", () => {
		render(<CreateProduct />);
		expect(screen.queryByAltText("product_photo")).toBeNull();
	});

	it("shows default error when create is unsuccessful without a message", async () => {
		axios.post = jest.fn().mockResolvedValue({ data: { success: false } });

		render(<CreateProduct />);
		await validForm();
		fireEvent.click(screen.getByRole("button", { name: /create product/i }));

		await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
		expect(toast.error).toHaveBeenCalledWith("Create failed");
		expect(mockNavigate).not.toHaveBeenCalled();
	});

});
