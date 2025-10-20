import { test, expect } from "@playwright/test";
import {
	loginAsAdmin,
	openAdminDashboard,
	selectOrCreateCategoryOnCreateProduct,
	chooseShippingYes,
	uploadPhoto,
} from "./adminSetup.js";

async function gotoProducts(page) {
	await loginAsAdmin(page);
	await openAdminDashboard(page);
	await page.getByRole("link", { name: /^products$/i }).click();
	await expect(page.getByRole("heading", { name: /all products list/i })).toBeVisible();
}

async function createSampleProduct(page, { name, price = "10", desc = "Sample Product" }) {
	await page.getByRole("link", { name: /create product/i }).click();
	await expect(page.getByRole("heading", { name: /create product/i })).toBeVisible();

	await selectOrCreateCategoryOnCreateProduct(page, "Sample Category");
	await uploadPhoto(page);
	await page.getByRole("textbox", { name: /write a name/i }).fill(name);
	await page.getByRole("textbox", { name: /write a description/i }).fill(desc);
	await page.getByPlaceholder(/write a price/i).fill(price);
	await page.getByPlaceholder(/write a quantity/i).fill("1");
	await chooseShippingYes(page);

	await page.getByRole("button", { name: /create product/i }).click();
	await expect(page).toHaveURL(/\/dashboard\/admin\/products/i);
	await expect(page.getByRole("heading", { name })).toBeVisible();
}

async function openUpdateByTitle(page, name) {
	await page.getByRole("link", { name }).click();
	await expect(page.getByRole("heading", { name: /update product/i })).toBeVisible();
}

async function setPrice(page, value) {
	const price = page.getByPlaceholder(/write a price/i);
	await price.click();
	await page.keyboard.press("ControlOrMeta+A");
	await price.type(value);
}

test.describe("Update Product Workflow", () => {
	test.setTimeout(30_000);

	test("edit a product: change price and verify on grid", async ({ page }) => {
		await gotoProducts(page);

		const name = `Update Product ${Date.now()}`;
		await createSampleProduct(page, { name, price: "10", desc: "Update Product" });

		await openUpdateByTitle(page, name);

		await setPrice(page, "13.49");
		await page.getByRole("button", { name: /update product/i }).click();

		await page.getByRole("link", { name: /^products$/i }).click();
		await expect(page).toHaveURL(/\/dashboard\/admin\/products/i);

		await openUpdateByTitle(page, name);
		await expect(page.getByPlaceholder(/write a price/i)).toHaveValue(/13\.49|13\.5/);
	});

	test("delete a product from Update page removes it from grid", async ({ page }) => {
		await gotoProducts(page);

		const name = `Delete Product ${Date.now()}`;
		await createSampleProduct(page, { name, price: "9.99", desc: "Delete product" });

		await openUpdateByTitle(page, name);

		page.once("dialog", (d) => d.accept());
		await page.getByRole("button", { name: /delete product/i }).click();

		await page.getByRole("link", { name: /^products$/i }).click();
		await expect(page).toHaveURL(/\/dashboard\/admin\/products/i);
		await expect(page.getByRole("heading", { name })).toHaveCount(0);
	});
});
