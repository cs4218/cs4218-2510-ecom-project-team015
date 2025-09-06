import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchProvider, useSearch } from "./search";

// Component nhỏ để "thăm dò" context
function Probe() {
	const [auth, setAuth] = useSearch(); // lấy từ context
	return (
		<div>
			<div data-testid="keyword">{auth.keyword}</div>
			<div data-testid="results">{auth.results.length}</div>
			<button
				onClick={() =>
					setAuth((prev) => ({ ...prev, keyword: "phone", results: [1, 2, 3] }))
				}>
				update
			</button>
		</div>
	);
}

test("cung cấp giá trị mặc định từ SearchProvider", () => {
	render(
		<SearchProvider>
			<Probe />
		</SearchProvider>
	);

	expect(screen.getByTestId("keyword").textContent).toBe(""); // keyword mặc định ""
	expect(screen.getByTestId("results").textContent).toBe("0"); // results mặc định []
});

test("cho phép cập nhật state qua setAuth", () => {
	render(
		<SearchProvider>
			<Probe />
		</SearchProvider>
	);

	fireEvent.click(screen.getByText(/update/i));

	expect(screen.getByTestId("keyword").textContent).toBe("phone");
	expect(screen.getByTestId("results").textContent).toBe("3");
});

test("dùng useSearch ngoài Provider sẽ lỗi (đúng kỳ vọng)", () => {
	const Broken = () => {
		const [auth] = useSearch(); // không có Provider bao quanh
		return <div>{auth.keyword}</div>;
	};

	// Render mà không bọc SearchProvider -> phải ném lỗi
	expect(() => render(<Broken />)).toThrow();
});
