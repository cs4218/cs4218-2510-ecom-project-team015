// search.test.js
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchProvider, useSearch } from "./search";

//! Created with the help of AI

/*This Probe's object is to test after clicking update button, 
keyword's value turns to phone and result's value turns to an array*/
function Probe() {
	const [auth, setAuth] = useSearch();
	return (
		<>
			<div data-testid="keyword">{auth.keyword}</div>
			<div data-testid="results">{auth.results.length}</div>
			<button
				onClick={() =>
					setAuth((p) => ({ ...p, keyword: "phone", results: [1, 2, 3] }))
				}>
				update
			</button>
		</>
	);
}

describe("SearchProvider", () => {
	test("Default value of state", () => {
		render(
			<SearchProvider>
				<Probe />
			</SearchProvider>
		);
		expect(screen.getByTestId("keyword").textContent).toBe("");
		expect(screen.getByTestId("results").textContent).toBe("0");
	});

	test("State is successfully updated, length is 3", () => {
		render(
			<SearchProvider>
				<Probe />
			</SearchProvider>
		);
		fireEvent.click(screen.getByText(/update/i));
		expect(screen.getByTestId("keyword").textContent).toBe("phone");
		expect(screen.getByTestId("results").textContent).toBe("3");
	});
});

describe("useSearch", () => {
	test("Throw an exception when using useSearch() outside of SearchProvider", () => {
		const Broken = () => {
			const [auth] = useSearch();
			return <div>{auth.keyword}</div>;
		};

		const spy = jest.spyOn(console, "error").mockImplementation(() => {});
		expect(() => render(<Broken />)).toThrow(/within SearchProvider/i);
		spy.mockRestore();
	});
});