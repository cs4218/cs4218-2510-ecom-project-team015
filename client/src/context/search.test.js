// search.test.js
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchProvider, useSearch } from "./search";

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
	test("có giá trị mặc định", () => {
		render(
			<SearchProvider>
				<Probe />
			</SearchProvider>
		);
		expect(screen.getByTestId("keyword").textContent).toBe("");
		expect(screen.getByTestId("results").textContent).toBe("0");
	});

	test("update state được", () => {
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
	test("ném lỗi khi dùng ngoài Provider", () => {
		const Broken = () => {
			const [auth] = useSearch();
			return <div>{auth.keyword}</div>;
		};

		// (tùy chọn) mute console.error cho đỡ ồn
		const spy = jest.spyOn(console, "error").mockImplementation(() => {});
		expect(() => render(<Broken />)).toThrow(/within SearchProvider/i);
		spy.mockRestore();
	});
});