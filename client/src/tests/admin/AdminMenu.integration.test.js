// Written by Ujjwal Gaurav
// This test file checks the admin menu component in admin dashboard
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AdminMenu from "../../components/AdminMenu";

// Created using ChatGPT
function Target({ label }) {
	return <div aria-label={`target:${label}`}>{label}</div>;
}

function renderWithRouter() {
	return render(
		<MemoryRouter initialEntries={["/dashboard/admin"]}>
			<Routes>
				<Route path="/dashboard/admin" element={<AdminMenu />} />
				<Route
					path="/dashboard/admin/create-category"
					element={<Target label="create-category" />}
				/>
				<Route path="/dashboard/admin/create-product" element={<Target label="create-product" />} />
				<Route path="/dashboard/admin/products" element={<Target label="products" />} />
				<Route path="/dashboard/admin/orders" element={<Target label="orders" />} />
				<Route path="/dashboard/admin/users" element={<Target label="users" />} />
			</Routes>
		</MemoryRouter>
	);
}

describe("Admin Menu", () => {
	test("verify if it renders all the 5 links with correct href in the admin panel", () => {
		renderWithRouter();

		const checks = [
			{ text: /create category/i, href: "/dashboard/admin/create-category" },
			{ text: /create product/i, href: "/dashboard/admin/create-product" },
			{ text: /^products$/i, href: "/dashboard/admin/products" },
			{ text: /^orders$/i, href: "/dashboard/admin/orders" },
			{ text: /^users$/i, href: "/dashboard/admin/users" },
		];

		checks.forEach(({ text, href }) => {
			const link = screen.getByRole("link", { name: text });
			expect(link).toBeInTheDocument();
			expect(link).toHaveAttribute("href", href);
		});

		expect(screen.getByRole("heading", { name: /admin panel/i })).toBeInTheDocument();
	});
});
