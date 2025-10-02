// client/src/components/Form/SearchInput.test.js
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SearchInput from "./SearchInput";
import axios from "axios";

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

// mock axios
jest.mock("axios");

describe("SearchInput", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockValues = { keyword: "", results: [] };
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

	test("controlled input: instead of checking displayed value, verify setValues is called correctly on typing", () => {
		render(<SearchInput />);

		const input = screen.getByPlaceholderText(/search/i);
		fireEvent.change(input, { target: { value: "samsung" } });

		// Since the mock doesn't re-render, assert the handler receives correct data
		expect(mockSetValues).toHaveBeenCalledWith({
			...mockValues,
			keyword: "samsung",
		});
	});

	test("error branch: API rejects → logs error and does NOT navigate", async () => {
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
