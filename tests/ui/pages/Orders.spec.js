// Author: Adhitya
import { test, expect } from "@playwright/test";

// Logs in -> Adds item to cart -> Place order -> Verify if order shows up on orders page
// test.describe.configure({ mode: "parallel" });

const email = "cs4218order@test.com";
const pwd = "cs4218@test.com";

test.describe("Test if orders page renders correctly with user's order details", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/login");
		const userNameInput = page.getByPlaceholder("Enter Your Email");
		const pwdInput = page.getByPlaceholder("Enter Your Password");
		const submitButton = page.getByText("LOGIN", { exact: true });

		await userNameInput.fill(email);
		await pwdInput.fill(pwd);
		await submitButton.click(); // we navigate to homepage
	});

	test("Check if orders page displays details", async ({ page }) => {
		await page.goto("/dashboard/user/orders");
		await page.getByText("All Orders");

		await expect(page.getByTestId("order-number-1")).toHaveText("1");
		await expect(page.getByTestId("order-status-1")).toHaveText("Not Processed");
		await expect(page.getByTestId("order-buyer-1")).toHaveText("Test User with one order");
		await expect(page.getByTestId("order-payment-1")).toHaveText("Success");
		await expect(page.getByTestId("order-date-1")).toHaveText("a month ago");
		await expect(page.getByTestId("product-name-66db427fdb0119d9234b27f1")).toHaveText("Textbook");
		await expect(page.getByTestId("product-desc-66db427fdb0119d9234b27f1")).toHaveText(
			"A comprehensive textbook"
		);
		await expect(page.getByTestId("product-price-66db427fdb0119d9234b27f1")).toHaveText(
			"Price : 79.99"
		);
	});
});
