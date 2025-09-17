import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, NavLink } from "react-router-dom";
import AdminMenu from "./AdminMenu";

// Helper function to render AdminMenu within a MemoryRouter
const setup = (subPath = "") => {
	const base = "/dashboard/admin";
	render(
		<MemoryRouter initialEntries={[`${base}${subPath}`]}>
			<AdminMenu />
		</MemoryRouter>
	);
};

describe("Admin Menu Component", () => {
	it("renders the Admin Panel heading", () => {
		setup();
		expect(screen.getByRole("heading", { name: /admin panel/i })).toBeInTheDocument();
	});

	it("renders all the expected links", () => {
		setup();
		expect(screen.getByRole("link", { name: /create category/i })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /create product/i })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /products/i })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /orders/i })).toBeInTheDocument();
	});

	it("links have the correct hrefs", () => {
		setup();
		expect(screen.getByRole("link", { name: /create category/i })).toHaveAttribute(
			"href",
			"/dashboard/admin/create-category"
		);
		expect(screen.getByRole("link", { name: /create product/i })).toHaveAttribute(
			"href",
			"/dashboard/admin/create-product"
		);
		expect(screen.getByRole("link", { name: /products/i })).toHaveAttribute(
			"href",
			"/dashboard/admin/products"
		);
		expect(screen.getByRole("link", { name: /orders/i })).toHaveAttribute(
			"href",
			"/dashboard/admin/orders"
		);
	});

	it("does not mark any link active on the base admin path", () => {
		setup();
		expect(screen.getByRole("link", { name: /create category/i })).not.toHaveClass("active");
		expect(screen.getByRole("link", { name: /create product/i })).not.toHaveClass("active");
		expect(screen.getByRole("link", { name: /products/i })).not.toHaveClass("active");
		expect(screen.getByRole("link", { name: /orders/i })).not.toHaveClass("active");
	});

	// We will use a data-driven approach to test the active link logic
	// for each of the admin routes. This avoids duplicating similar test
	// logic for each route.
	describe("Active Link", () => {
		const links = [
			{
				path: "/create-category",
				active: /create category/i,
				inactive: [/create product/i, /products/i, /orders/i],
			},
			{
				path: "/create-product",
				active: /create product/i,
				inactive: [/create category/i, /products/i, /orders/i],
			},
			{
				path: "/products",
				active: /products/i,
				inactive: [/create category/i, /create product/i, /orders/i],
			},
			{
				path: "/orders",
				active: /orders/i,
				inactive: [/create category/i, /create product/i, /products/i],
			},
		];

        // iterate through each link scenario
		it.each(links)(
			"applies active class only to the matching route -> %s",
			({ path, active, inactive }) => {
				setup(path);

				// assert the active link
				const activeLink = screen.getByRole("link", { name: active });
				expect(activeLink).toHaveClass("active");
				expect(activeLink).toHaveAttribute("aria-current", "page");

				// assert that all other links are not active
				for (const name of inactive) {
					const inactiveLink = screen.getByRole("link", { name });
					expect(inactiveLink).not.toHaveClass("active");
					expect(inactiveLink).not.toHaveAttribute("aria-current", "page");
				}
			}
		);
	});
});
