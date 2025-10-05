// CategoryForm.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import CategoryForm from "./CategoryForm";

describe("CategoryForm Component", () => {
	it("renders input with placeholder and submit button", () => {
		const handleSubmit = jest.fn();
		const setValue = jest.fn();

		render(<CategoryForm handleSubmit={handleSubmit} value="" setValue={setValue} />);

		const input = screen.getByPlaceholderText(/enter new category/i);
		const button = screen.getByRole("button", { name: /submit/i });

		expect(input).toBeInTheDocument();
		expect(button).toBeInTheDocument();

		expect(input).toHaveClass("form-control");
		expect(button).toHaveClass("btn", "btn-primary");
	});

	it("shows the current value in the category form", () => {
		const handleSubmit = jest.fn();
		const setValue = jest.fn();

		render(<CategoryForm handleSubmit={handleSubmit} value="Books" setValue={setValue} />);

		const input = screen.getByPlaceholderText(/enter new category/i);
		expect(input).toHaveValue("Books");
	});

	it("calls setValue when value in the field changes", () => {
		const handleSubmit = jest.fn();
		const setValue = jest.fn();

		render(<CategoryForm handleSubmit={handleSubmit} value="" setValue={setValue} />);

		const input = screen.getByPlaceholderText(/enter new category/i);
		fireEvent.change(input, { target: { value: "Garden" } });

		expect(setValue).toHaveBeenCalledTimes(1);
		expect(setValue).toHaveBeenCalledWith("Garden");
	});

	it("calls handleSubmit when the form is submitted through button click", () => {
		const handleSubmit = jest.fn((e) => e && e.preventDefault && e.preventDefault());
		const setValue = jest.fn();

		render(<CategoryForm handleSubmit={handleSubmit} value="Clothes" setValue={setValue} />);

		const button = screen.getByRole("button", { name: /submit/i });
		fireEvent.click(button);

		expect(handleSubmit).toHaveBeenCalledTimes(1);
	});

	// Created using ChatGPT
	it("calls handleSubmit when pressing Enter in the input", async () => {
		const handleSubmit = jest.fn((e) => e?.preventDefault?.());
		const setValue = jest.fn();

		render(<CategoryForm handleSubmit={handleSubmit} value="Toys" setValue={setValue} />);

		const input = screen.getByPlaceholderText(/enter new category/i);
		const submitBtn = screen.getByRole("button", { name: /submit/i });

		userEvent.type(input, "{enter}");
		fireEvent.submit(submitBtn.form);

		expect(handleSubmit).toHaveBeenCalled();
	});
});
