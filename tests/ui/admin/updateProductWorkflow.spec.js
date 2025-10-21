// Written by Ujjwal Gaurav
// This test file checks the update product workflow in admin dashboard
import { test, expect } from "@playwright/test";
import {
	loginAsAdmin,
	openAdminDashboard,
	selectOrCreateCategoryOnCreateProduct,
	chooseShippingYes,
	uploadPhoto,
	expectToast,
} from "./adminSetup.js";

async function gotoProducts(page) {
	await loginAsAdmin(page);
	await openAdminDashboard(page);
	await page.getByRole("link", { name: /^products$/i }).click();
	await expect(page.getByRole("heading", { name: /all products list/i })).toBeVisible();
}

// Created using ChatGPT
async function createSampleProduct(page, { name, price = "10.00", desc = "Sample Product" }) {
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

function cardFor(page, name) {
	return page.locator(".card", { has: page.getByRole("heading", { name }) }).first();
}

// Created using ChatGPT
function slugify(s) {
	return s
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

// Created using ChatGPT
async function openUpdate(page, name) {
	const card = cardFor(page, name);
	await expect(card).toBeVisible();
	const link = card.getByRole("link").first();
	if (await link.count()) await link.click();
	else
		await card
			.getByRole("button", { name: /update|edit/i })
			.first()
			.click();
	await expect(page.getByRole("heading", { name: /update product/i })).toBeVisible();
}

// Created using ChatGPT
async function setPrice(page, value) {
	const price = page.getByPlaceholder(/write a price/i);
	await price.fill(String(value));
	await page.getByRole("heading", { name: /update product/i }).click();
}

// Created using ChatGPT
async function reopenAndAssertPrice(page, name, expected) {
	await page.getByRole("link", { name: /^products$/i }).click();
	await expect(page).toHaveURL(/\/dashboard\/admin\/products/i);
	await openUpdate(page, name);
	const priceInput = page.getByPlaceholder(/write a price/i);
	await expect.poll(() => priceInput.inputValue(), { timeout: 8000 }).toMatch(expected);
}

test.describe("Update Product Workflow", () => {
	test.setTimeout(30_000);

	test("update price of a product and check if it is updated", async ({ page }) => {
		await gotoProducts(page);
		const name = `Update Product ${Date.now()}`;
		await createSampleProduct(page, { name, price: "10.00", desc: "Update Product" });
		await openUpdate(page, name);
		await setPrice(page, "13.49");
		await page.getByRole("button", { name: /update product/i }).click();
		await reopenAndAssertPrice(page, name, /13\.49|13\.5/);
	});

	test("verify if updating to a bad price remains on Update Product form", async ({ page }) => {
		await gotoProducts(page);
		const name = `Update Product ${Date.now()}`;
		await createSampleProduct(page, { name, price: "10.00", desc: "Update Product" });
		await openUpdate(page, name);
		await setPrice(page, "0");
		await page.getByRole("button", { name: /update product/i }).click();
		await expectToast(page, /price\s*must\s*be\s*>\s*0/i);
		await expect(page.getByRole("heading", { name: /update product/i })).toBeVisible();
	});

	test("update quantity of a product and verify it is updated", async ({ page }) => {
		await gotoProducts(page);

		const name = `Update Product ${Date.now()}`;
		await createSampleProduct(page, { name, price: "10.00", desc: "Qty Persist" });

		await openUpdate(page, name);

		const qty = page.getByPlaceholder(/write a quantity/i);
		await qty.fill("2");
		await page.getByRole("heading", { name: /update product/i }).click();
		await page.getByRole("button", { name: /update product/i }).click();

		await page.getByRole("link", { name: /^products$/i }).click();
		await openUpdate(page, name);
		await expect(page.getByPlaceholder(/write a quantity/i)).toHaveValue("2");
	});

	test("delete a product and verify if it is removed from product list", async ({ page }) => {
		await gotoProducts(page);
		const name = `Delete Product ${Date.now()}`;
		await createSampleProduct(page, { name, price: "9.99", desc: "Delete Product" });
		await openUpdate(page, name);
		page.once("dialog", (d) => d.accept());
		await page.getByRole("button", { name: /delete product/i }).click();
		await expect(page).toHaveURL(/\/dashboard\/admin\/products/i);
		await expect(cardFor(page, name)).toHaveCount(0);
	});

	test("verify if cancelling delete keeps the product in the product list", async ({ page }) => {
		await gotoProducts(page);

		const name = `Delete Cancel ${Date.now()}`;
		await createSampleProduct(page, { name, price: "9.99", desc: "Cancel Delete" });

		await openUpdate(page, name);

		page.once("dialog", (d) => d.dismiss());
		await page.getByRole("button", { name: /delete product/i }).click();

		const expectedSlug = slugify(name);
		await expect(page).toHaveURL(new RegExp(`/dashboard/admin/product/${expectedSlug}$`, "i"));

		await page.getByRole("link", { name: /^products$/i }).click();
		await expect(cardFor(page, name)).toBeVisible();
	});
});
