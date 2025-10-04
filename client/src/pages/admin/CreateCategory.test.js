import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import toast from "react-hot-toast";
import CreateCategory from "./CreateCategory";

jest.mock("axios");

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

// Mock created Using ChatGPT
jest.mock("../../components/Form/CategoryForm", () => ({
	__esModule: true,
	default: ({ value, setValue, handleSubmit }) => (
		<form onSubmit={handleSubmit} data-testid="category-form">
			<input aria-label="category-input" value={value} onChange={(e) => setValue(e.target.value)} />
			<button type="submit">Submit</button>
		</form>
	),
}));

// Mock created Using ChatGPT
jest.mock("antd", () => {
	const React = require("react");
	const Modal = ({ visible, onCancel, children }) =>
		visible ? (
			<div data-testid="antd-modal">
				<button onClick={onCancel}>Close</button>
				{children}
			</div>
		) : null;
	return { Modal };
});

jest.mock("react-hot-toast", () => ({
	__esModule: true,
	default: { success: jest.fn(), error: jest.fn() },
}));

const categoriesPayload = {
	data: {
		success: true,
		category: [
			{ _id: "c1", name: "Books" },
			{ _id: "c2", name: "Electronics" },
		],
	},
};

function arrangeDefaultAxios() {
	axios.get.mockImplementation((url) => {
		if (url.includes("/api/v1/category/get-category")) return Promise.resolve(categoriesPayload);
		throw new Error("Unexpected GET " + url);
	});
}

let consoleSpy;

beforeEach(() => {
	jest.clearAllMocks();
	arrangeDefaultAxios();
	consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
	consoleSpy.mockRestore();
});

describe("CreateCategory Component", () => {

    // Helper created Using ChatGPT
	const findRowByCellText = async (text) => {
		const table = await screen.findByRole("table");
		const rows = within(table).getAllByRole("row");
		const match = rows.find((row) => within(row).queryByText(text));
		if (!match) throw new Error(`Row not found for: ${text}`);
		return match;
	};

	it("renders Layout, AdminMenu, heading, and passes the correct Layout title", () => {
		render(<CreateCategory />);
		const layout = screen.getByTestId("mock-layout");
		expect(layout).toBeInTheDocument();
		expect(screen.getByTestId("mock-admin-menu")).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: /manage category/i, level: 1 })).toBeInTheDocument();
		expect(layout).toHaveAttribute("data-title", "Dashboard - Manage Category");
	});

	it("prevents create when name is blank and shows a toast error", async () => {
		render(<CreateCategory />);

		const input = await screen.findByLabelText("category-input");
		fireEvent.change(input, { target: { value: "   " } });
		fireEvent.submit(screen.getByTestId("category-form"));

		expect(axios.post).not.toHaveBeenCalled();
		expect(toast.error).toHaveBeenCalledWith("Name is required");
	});

	it("prevents create when name duplicates (case-insensitive) and shows a toast error", async () => {
		render(<CreateCategory />);

		const input = await screen.findByLabelText("category-input");
		fireEvent.change(input, { target: { value: "  books  " } });
		fireEvent.submit(screen.getByTestId("category-form"));

		expect(axios.post).not.toHaveBeenCalled();
		expect(toast.error).toHaveBeenCalledWith("Category already exists");
	});

	it("shows a toast error when backend returns a status 409 on create", async () => {
		axios.post = jest.fn().mockRejectedValue({ response: { status: 409 } });

		render(<CreateCategory />);

		const input = await screen.findByLabelText("category-input");
		fireEvent.change(input, { target: { value: "Garden" } });
		fireEvent.submit(screen.getByTestId("category-form"));

		await waitFor(() => {
			expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", {
				name: "Garden",
			});
		});
		expect(toast.error).toHaveBeenCalledWith("Category already exists");
	});

	it("creates successfully for a new unique name and clears field", async () => {
		axios.post = jest.fn().mockResolvedValue({ data: { success: true } });

		render(<CreateCategory />);

		const input = await screen.findByLabelText("category-input");
		fireEvent.change(input, { target: { value: "Clothes" } });
		fireEvent.submit(screen.getByTestId("category-form"));

		await waitFor(() => expect(axios.post).toHaveBeenCalled());
		expect(toast.success).toHaveBeenCalledWith("Clothes is created");
		expect(axios.get).toHaveBeenCalledTimes(2);
	});

	it("prevents update to blank name and shows a toast error", async () => {
		render(<CreateCategory />);

		const booksRow = await findRowByCellText("Books");
		const editBtn = within(booksRow).getByRole("button", { name: /edit/i });
		fireEvent.click(editBtn);

		const modal = await screen.findByTestId("antd-modal");
		const modalInput = within(modal).getByLabelText("category-input");
		fireEvent.change(modalInput, { target: { value: "   " } });
		const modalForm = within(modal).getByTestId("category-form");
		fireEvent.submit(modalForm);

		expect(axios.put).not.toHaveBeenCalled();
		expect(toast.error).toHaveBeenCalledWith("Name is required");
	});

	it("prevents update to an existing category (case-insensitive) and shows a toast error", async () => {
		render(<CreateCategory />);

		const booksRow = await findRowByCellText("Books");
		const editBtn = within(booksRow).getByRole("button", { name: /edit/i });
		fireEvent.click(editBtn);

		const modal = await screen.findByTestId("antd-modal");
		const modalInput = within(modal).getByLabelText("category-input");
		fireEvent.change(modalInput, { target: { value: "  electronics " } });
		const modalForm = within(modal).getByTestId("category-form");
		fireEvent.submit(modalForm);

		expect(axios.put).not.toHaveBeenCalled();
		expect(toast.error).toHaveBeenCalledWith("Category already exists");
	});

	it("shows a toast error when backend returns 409 on update", async () => {
		axios.put = jest.fn().mockRejectedValue({ response: { status: 409 } });

		render(<CreateCategory />);

		const booksRow = await findRowByCellText("Books");
		const editBtn = within(booksRow).getByRole("button", { name: /edit/i });
		fireEvent.click(editBtn);

		const modal = await screen.findByTestId("antd-modal");
		const modalInput = within(modal).getByLabelText("category-input");
		fireEvent.change(modalInput, { target: { value: "Books & More" } });
		const modalForm = within(modal).getByTestId("category-form");
		fireEvent.submit(modalForm);

		await waitFor(() => expect(axios.put).toHaveBeenCalled());
		expect(toast.error).toHaveBeenCalledWith("Category already exists");
	});

	it("updates successfully with a unique new name and refetches", async () => {
		axios.put = jest.fn().mockResolvedValue({ data: { success: true } });

		render(<CreateCategory />);

		const booksRow = await findRowByCellText("Books");
		const editBtn = within(booksRow).getByRole("button", { name: /edit/i });
		fireEvent.click(editBtn);

		const modal = await screen.findByTestId("antd-modal");
		const modalInput = within(modal).getByLabelText("category-input");
		fireEvent.change(modalInput, { target: { value: "Books & Magazines" } });
		const modalForm = within(modal).getByTestId("category-form");
		fireEvent.submit(modalForm);

		await waitFor(() => expect(axios.put).toHaveBeenCalled());
		expect(toast.success).toHaveBeenCalledWith("Books & Magazines is updated");
		expect(axios.get).toHaveBeenCalledTimes(2);
	});

	it("loads categories and renders them in the table", async () => {
		render(<CreateCategory />);

		const table = await screen.findByRole("table");
		const rows = within(table).getAllByRole("row");

		expect(rows.length).toBe(3);
		expect(screen.getByText("Books")).toBeInTheDocument();
		expect(screen.getByText("Electronics")).toBeInTheDocument();
	});

	it("creates category successfully and refetches list", async () => {
		axios.post = jest.fn().mockResolvedValue({ data: { success: true } });

		render(<CreateCategory />);

		const input = screen.getByLabelText("category-input");
		fireEvent.change(input, { target: { value: "Clothes" } });
		fireEvent.submit(screen.getByTestId("category-form"));

		await waitFor(() =>
			expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", {
				name: "Clothes",
			})
		);

		await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Clothes is created"));
		expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
		expect(axios.get).toHaveBeenCalledTimes(2);
	});

	it("renders no data rows when API succeeds with an empty category list", async () => {
		axios.get.mockImplementation((url) => {
			if (url.includes("/api/v1/category/get-category")) {
				return Promise.resolve({ data: { success: true, category: [] } });
			}
			throw new Error("Unexpected GET " + url);
		});

		render(<CreateCategory />);

		const table = await screen.findByRole("table");
		const rows = within(table).getAllByRole("row");
		expect(rows.length).toBe(1);
	});

	it("opens modal on Edit, updates category successfully and refetches", async () => {
		axios.put = jest.fn().mockResolvedValue({ data: { success: true } });

		render(<CreateCategory />);

		const booksRow = await findRowByCellText("Books");
		const editBtn = within(booksRow).getByRole("button", { name: /edit/i });
		fireEvent.click(editBtn);

		const modal = await screen.findByTestId("antd-modal");
		const modalInput = within(modal).getByLabelText("category-input");
		fireEvent.change(modalInput, { target: { value: "Books & Magazines" } });

		const modalForm = within(modal).getByTestId("category-form");
		fireEvent.submit(modalForm);

		await waitFor(() => expect(axios.put).toHaveBeenCalled());
		expect(axios.put.mock.calls[0][0]).toBe("/api/v1/category/update-category/c1");
		expect(axios.put.mock.calls[0][1]).toEqual({ name: "Books & Magazines" });
		await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Books & Magazines is updated"));
		expect(axios.get).toHaveBeenCalledTimes(2);
	});

	it("closes the modal when onCancel is triggered", async () => {
		render(<CreateCategory />);

		const table = await screen.findByRole("table");
		const rows = within(table).getAllByRole("row");
		const booksRow = rows.find((r) => within(r).queryByText("Books"));
		const editBtn = within(booksRow).getByRole("button", { name: /edit/i });
		fireEvent.click(editBtn);

		const modal = await screen.findByTestId("antd-modal");
		expect(modal).toBeInTheDocument();

		const closeBtn = within(modal).getByRole("button", { name: /close/i });
		fireEvent.click(closeBtn);

		await waitFor(() => {
			expect(screen.queryByTestId("antd-modal")).not.toBeInTheDocument();
		});

		expect(axios.put).not.toHaveBeenCalled();
	});

	it("shows error toast when create throws error", async () => {
		axios.post = jest.fn().mockRejectedValue(new Error("network down"));

		render(<CreateCategory />);
		fireEvent.change(screen.getByLabelText("category-input"), { target: { value: "Garden" } });
		fireEvent.submit(screen.getByTestId("category-form"));

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith("Something went wrong creating category")
		);
	});

	it("shows API error when update returns success:false", async () => {
		axios.put = jest.fn().mockResolvedValue({ data: { success: false, message: "Nope" } });

		render(<CreateCategory />);

		const booksRow = await findRowByCellText("Books");
		const editBtn = within(booksRow).getByRole("button", { name: /edit/i });
		fireEvent.click(editBtn);

		const modal = await screen.findByTestId("antd-modal");
		const modalForm = within(modal).getByTestId("category-form");
		fireEvent.submit(modalForm);

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Nope"));
	});

	it("shows error toast when update throws error", async () => {
		axios.put = jest.fn().mockRejectedValue(new Error("fail"));

		render(<CreateCategory />);

		const booksRow = await findRowByCellText("Books");
		const editBtn = within(booksRow).getByRole("button", { name: /edit/i });
		fireEvent.click(editBtn);

		const modal = await screen.findByTestId("antd-modal");
		const modalForm = within(modal).getByTestId("category-form");
		fireEvent.submit(modalForm);

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith("Something went wrong updating category")
		);
	});

	it("deletes category successfully and refetches", async () => {
		axios.delete = jest.fn().mockResolvedValue({ data: { success: true } });

		render(<CreateCategory />);

		const booksRow = await findRowByCellText("Books");
		const delBtn = within(booksRow).getByRole("button", { name: /delete/i });
		fireEvent.click(delBtn);

		await waitFor(() =>
			expect(axios.delete).toHaveBeenCalledWith("/api/v1/category/delete-category/c1")
		);
		await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Category is deleted"));
		expect(axios.get).toHaveBeenCalledTimes(2); // initial + refetch
	});

	it("shows API error when delete returns success:false", async () => {
		axios.delete = jest.fn().mockResolvedValue({ data: { success: false, message: "Blocked" } });

		render(<CreateCategory />);

		const elecRow = await findRowByCellText("Electronics");
		const delBtn = within(elecRow).getByRole("button", { name: /delete/i });
		fireEvent.click(delBtn);

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Blocked"));
	});

	it("shows error toast when delete throws error", async () => {
		axios.delete = jest.fn().mockRejectedValue(new Error("oops"));

		render(<CreateCategory />);

		const deleteBtns = await screen.findAllByRole("button", { name: "Delete" });
		fireEvent.click(deleteBtns[0]);

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something went wrong"));
	});

	it("shows API error message when create returns success:false", async () => {
		arrangeDefaultAxios();

		axios.post = jest.fn().mockResolvedValue({
			data: { success: false, message: "Create failed (server)" },
		});

		render(<CreateCategory />);

		const input = await screen.findByLabelText("category-input");
		fireEvent.change(input, { target: { value: "UniqueCat" } });
		fireEvent.submit(screen.getByTestId("category-form"));

		await waitFor(() => expect(axios.post).toHaveBeenCalled());
		expect(toast.error).toHaveBeenCalledWith("Create failed (server)");
		expect(axios.get).toHaveBeenCalledTimes(1);
	});

	// Created using ChatGPT
	it("toasts when getAllCategory fails on mount", async () => {
		axios.get.mockImplementation((url) => {
			if (url.includes("/api/v1/category/get-category"))
				return Promise.reject(new Error("network down"));
			throw new Error("Unexpected GET " + url);
		});

		render(<CreateCategory />);

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith("Something went wrong in getting catgeory")
		);
	});

	// Created using ChatGPT
	it("does not set categories when getAllCategory returns success:false", async () => {
		axios.get.mockImplementation((url) => {
			if (url.includes("/api/v1/category/get-category")) {
				return Promise.resolve({ data: { success: false, category: [] } });
			}
			throw new Error("Unexpected GET " + url);
		});

		render(<CreateCategory />);

		const table = await screen.findByRole("table");
		const rows = within(table).getAllByRole("row");
		expect(rows.length).toBe(1);
	});

	// Created using ChatGPT
	it("handles categories with undefined names during duplicate check", async () => {
		axios.get.mockImplementation((url) => {
			if (url.includes("/get-category")) {
				return Promise.resolve({
					data: {
						success: true,
						category: [
							{ _id: "cx", name: undefined },
							{ _id: "c1", name: "Books" },
						],
					},
				});
			}
			throw new Error("Unexpected GET " + url);
		});

		render(<CreateCategory />);

		const input = await screen.findByLabelText("category-input");
		fireEvent.change(input, { target: { value: "Garden" } });

		axios.post = jest.fn().mockResolvedValue({ data: { success: true } });
		fireEvent.submit(screen.getByTestId("category-form"));

		await waitFor(() =>
			expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", {
				name: "Garden",
			})
		);
	});
});
