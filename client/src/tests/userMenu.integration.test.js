import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import UserMenu from "../components/UserMenu";

// Tests generated with help from AI

const renderUserMenu = () =>
	render(
		//Start at dashboard/user page (which displays the profile and orders buttons)
		<MemoryRouter initialEntries={["/dashboard/user"]}>
			<Routes>
				<Route path="/dashboard/user" element={<UserMenu />} />
				<Route path="/dashboard/user/profile" element={<div>This is a sample Profile Page</div>} />
				<Route path="/dashboard/user/orders" element={<div>Sample Orders page</div>} />
			</Routes>
		</MemoryRouter>
	);

describe("Testing interactions with user menu", () => {
	test("navigates correctly when clicking Profile link", async () => {
		// Arrange
		renderUserMenu();

		// Act
		await userEvent.click(screen.getByRole("link", { name: /profile/i }));

		// Assert
		expect(screen.getByText("This is a sample Profile Page")).toBeInTheDocument();
	});

	test("navigates correctly when clicking Orders link", async () => {
		// Arrange
		renderUserMenu();

		// Act
		await userEvent.click(screen.getByRole("link", { name: /orders/i }));

		//Assert
		expect(screen.getByText("Sample Orders page")).toBeInTheDocument();
	});
});
