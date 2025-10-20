// Written by Ujjwal Gaurav
// This test file checks the create product functionality in admin dashboard
import { test, expect } from "@playwright/test";
import {
	loginAsAdmin,
	openAdminDashboard,
	selectOrCreateCategoryOnCreateProduct,
	chooseShippingYes,
	uploadPhoto,
	expectToast,
	uploadVirtualImage
} from "./adminSetup.js";

async function gotoCreateProduct(page) {
	await loginAsAdmin(page);
	await openAdminDashboard(page);
	await page.getByRole("link", { name: /create product/i }).click();
	await expect(page.getByRole("heading", { name: /create product/i })).toBeVisible();
}

test.describe("Create Product Workflow", () => {
	test.setTimeout(30_000);

	test("create product with valid inputs and check if it is added on products page", async ({
		page,
	}) => {
		await gotoCreateProduct(page);

		const category = "Sample Category";
		await selectOrCreateCategoryOnCreateProduct(page, category);
		await uploadPhoto(page);

		const name = `Sample Product ${Date.now()}`;
		await page.getByRole("textbox", { name: /write a name/i }).fill(name);
		await page.getByRole("textbox", { name: /write a description/i }).fill("Test product");
		await page.getByPlaceholder(/write a price/i).fill("78.99");
		await page.getByPlaceholder(/write a quantity/i).fill("12");

		await chooseShippingYes(page);

		await page.getByRole("button", { name: /create product/i }).click();

		await expect(page).toHaveURL(/\/dashboard\/admin\/products/i);
		await expect(page.locator(`text=${name}`)).toBeVisible();
	});

	test("check if missing fields show a toast error and stays on create product form", async ({
		page,
	}) => {
		await gotoCreateProduct(page);
		await page.getByRole("button", { name: /create product/i }).click();
		await expectToast(page, /required|name|price|category|shipping/i);
		await expect(page.getByRole("heading", { name: /create product/i })).toBeVisible();
	});

	test("shows toast error when category is not selected and stays on form", async ({ page }) => {
		await gotoCreateProduct(page);

		await page.getByRole("textbox", { name: /write a name/i }).fill(`Sample ${Date.now()}`);
		await page.getByRole("textbox", { name: /write a description/i }).fill("No category selected");
		await page.getByPlaceholder(/write a price/i).fill("11.00");
		await page.getByPlaceholder(/write a quantity/i).fill("1");
		await chooseShippingYes(page);

		await page.getByRole("button", { name: /create product/i }).click();
		await expectToast(page, /category|select.*category|required/i);
		await expect(page.getByRole("heading", { name: /create product/i })).toBeVisible();
	});

	test("shows toast error when shipping is not selected and stays on form", async ({ page }) => {
		await gotoCreateProduct(page);

		await selectOrCreateCategoryOnCreateProduct(page, "Sample Category");
		await page.getByRole("textbox", { name: /write a name/i }).fill(`Sample ${Date.now()}`);
		await page.getByRole("textbox", { name: /write a description/i }).fill("No shipping selected");
		await page.getByPlaceholder(/write a price/i).fill("9.50");
		await page.getByPlaceholder(/write a quantity/i).fill("2");

		await page.getByRole("button", { name: /create product/i }).click();
		await expectToast(page, /shipping|select.*shipping|required/i);
		await expect(page.getByRole("heading", { name: /create product/i })).toBeVisible();
	});

	test("shows a toast error when price is not a positive number", async ({ page }) => {
		await gotoCreateProduct(page);

		await selectOrCreateCategoryOnCreateProduct(page, "Sample Category");
		await page.getByRole("textbox", { name: /write a name/i }).fill(`Sample ${Date.now()}`);
		await page.getByRole("textbox", { name: /write a description/i }).fill("Bad price");
		await page.getByPlaceholder(/write a price/i).fill("-10.00");
		await page.getByPlaceholder(/write a quantity/i).fill("5");
		await chooseShippingYes(page);

		await page.getByRole("button", { name: /create product/i }).click();
		await expectToast(page, /price|invalid|positive|greater than/i);
		await expect(page.getByRole("heading", { name: /create product/i })).toBeVisible();
	});

	test("shows a toast error when quantity is not a positive integer", async ({ page }) => {
		await gotoCreateProduct(page);

		await selectOrCreateCategoryOnCreateProduct(page, "Sample Category");
		await page.getByRole("textbox", { name: /write a name/i }).fill(`Sample ${Date.now()}`);
		await page.getByRole("textbox", { name: /write a description/i }).fill("Bad quantity");
		await page.getByPlaceholder(/write a price/i).fill("10.00");
		await page.getByPlaceholder(/write a quantity/i).fill("-5"); 
		await chooseShippingYes(page);

		await page.getByRole("button", { name: /create product/i }).click();
		await expectToast(page, /quantity|invalid|positive|greater than/i);
		await expect(page.getByRole("heading", { name: /create product/i })).toBeVisible();
	});

	test("shows a toast error when photo is greater than 1MB", async ({ page }) => {
		await gotoCreateProduct(page);
		await selectOrCreateCategoryOnCreateProduct(page, "Sample Category");

		const name = `Sample ${Date.now()}`;
		await page.getByRole("textbox", { name: /write a name/i }).fill(name);
		await page.getByRole("textbox", { name: /write a description/i }).fill("Big image rejected");
		await page.getByPlaceholder(/write a price/i).fill("12.00");
		await page.getByPlaceholder(/write a quantity/i).fill("2");
		await chooseShippingYes(page);

		await uploadVirtualImage(page, { bytes: Math.ceil(1.2 * 1024 * 1024) });

		await page.getByRole("button", { name: /create product/i }).click();
		await expectToast(page, /(1\s*mb|1\s*mi?b|size|too large|exceeds)/i);
		await expect(page.getByRole("heading", { name: /create product/i })).toBeVisible();
	});

	test("check if photo less than 1MB is accepted", async ({ page }) => {
		await gotoCreateProduct(page);
		await selectOrCreateCategoryOnCreateProduct(page, "Sample Category");

		const name = `Sample ${Date.now()}`;
		await page.getByRole("textbox", { name: /write a name/i }).fill(name);
		await page.getByRole("textbox", { name: /write a description/i }).fill("Small image ok");
		await page.getByPlaceholder(/write a price/i).fill("10.00");
		await page.getByPlaceholder(/write a quantity/i).fill("1");
		await chooseShippingYes(page);

		await uploadVirtualImage(page, { bytes: 900 * 1024 });

		await page.getByRole("button", { name: /create product/i }).click();
		await expect(page).toHaveURL(/\/dashboard\/admin\/products/i);
		await expect(page.getByRole("heading", { name })).toBeVisible();
	});
});
