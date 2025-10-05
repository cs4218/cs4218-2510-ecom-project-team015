// client/src/components/Form/SearchInput.test.js
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SearchInput from "./SearchInput";
import axios from "axios";

// mock axios
jest.mock("axios");

// mock useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
	...jest.requireActual("react-router-dom"),
	useNavigate: () => mockNavigate,
}));

// mock useSearch
const mockSetValues = jest.fn();
let mockValues = { keyword: "", results: [] };
jest.mock("../../context/search", () => ({
	useSearch: () => [mockValues, mockSetValues],
}));


describe("SearchInput", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockValues = { keyword: "", results: [] };
	});

	test("renders input and search button", () => {
		render(<SearchInput />);

		// check input
		const input = screen.getByPlaceholderText(/search/i);
		expect(input).toBeInTheDocument();

		// check button
		const button = screen.getByRole("button", { name: /search/i });
		expect(button).toBeInTheDocument();
	});


	test("input is empty initially", () => {
		render(<SearchInput />);
		const input = screen.getByPlaceholderText(/search/i);
		expect(input.value).toBe(""); // start with empty string
	});


	test("submit with empty keyword still call API with empty keyword", async () => {
		render(<SearchInput />);

		fireEvent.click(screen.getByRole("button", { name: /search/i }));

		await waitFor(() => {
			expect(axios.get).toHaveBeenCalled();
		});
	});


	test("type keyword + submit (simulate by pre-setting keyword): calls API with correct URL, updates setValues with results, navigates", async () => {
		// pre-set keyword BEFORE render (mock doesn't re-render)
		mockValues = { keyword: "iphone", results: [] };

		const fakeResults = [{ _id: "1", name: "iPhone 15" }];
		axios.get.mockResolvedValueOnce({ data: fakeResults });

		render(<SearchInput />);

		// submit by clicking the button
		fireEvent.click(screen.getByRole("button", { name: /search/i }));

		await waitFor(() => {
			expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/iphone");
			expect(mockSetValues).toHaveBeenCalledWith({
				...mockValues,
				results: fakeResults,
			});
			expect(mockNavigate).toHaveBeenCalledWith("/search");
		});
	});


	test("instead of checking the value that will be displayed, verify setValues is called correctly after typing", () => {
		render(<SearchInput />);

		const input = screen.getByPlaceholderText(/search/i);
		fireEvent.change(input, { target: { value: "samsung" } });

		// Since the mock doesn't re-render, assert the handler receives correct data
		expect(mockSetValues).toHaveBeenCalledWith({
			...mockValues,
			keyword: "samsung",
		});
	});


	test("error branch: API rejects -> logs error and does NOT navigate", async () => {
		mockValues = { keyword: "LAPTOP", results: [] };
		const err = new Error("Network down");
		axios.get.mockRejectedValueOnce(err);
		const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

		render(<SearchInput />);

		// submit by clicking the button
		fireEvent.click(screen.getByRole("button", { name: /search/i }));

		await waitFor(() => {
			expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/LAPTOP");
			expect(logSpy).toHaveBeenCalled(); // error logged
			expect(mockNavigate).not.toHaveBeenCalled(); // no navigation on error
		});

		logSpy.mockRestore();
	});
});
