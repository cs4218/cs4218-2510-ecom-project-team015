// tests/ui/admin/updateProductWorkflow.spec.js
import { test, expect } from "@playwright/test";
import {
	loginAsAdmin,
	openAdminDashboard,
	selectOrCreateCategoryOnCreateProduct,
	chooseShippingYes,
	uploadPhoto,
	expectToast, // if you have it
} from "./adminSetup.js";

/* ---------- tiny local helpers ---------- */

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

/** Open Update for product by exact title attribute; page through if needed */
async function openUpdateForProduct(page, name) {
	for (let i = 0; i < 10; i++) {
		const card = page.locator(".card").filter({
			has: page.locator(`h5.card-title[title="${name}"]`),
		});
		if (await card.count()) {
			// Prefer a real link within the card if present; else fall back to Edit button.
			const titleLink = card.getByRole("link").first();
			if (await titleLink.count()) {
				await titleLink.click();
			} else {
				await card.getByRole("button", { name: /edit/i }).first().click();
			}
			await expect(page.getByRole("heading", { name: /update product/i })).toBeVisible();
			return;
		}
		// try next page if pagination exists
		const next = page.getByRole("button", { name: /next|›/i }).first();
		if (!(await next.count()) || !(await next.isEnabled())) break;
		await next.click();
	}
	throw new Error(`Product "${name}" not found on Products grid.`);
}

/** Change price in a way that reliably fires onChange for number inputs */
async function setPrice(page, value) {
	const price = page.getByPlaceholder(/write a price/i);
	await price.click();
	await page.keyboard.press("ControlOrMeta+A");
	await price.press("Backspace");
	await price.type(value);
	// blur to commit
	await page.getByRole("heading", { name: /update product/i }).click();
}

/* ------------------------ tests ------------------------ */

test.describe("Update Product Workflow (lean)", () => {
	test.setTimeout(30_000);

	test("update price and verify it persisted", async ({ page }) => {
		await gotoProducts(page);

		const name = `Update Product ${Date.now()}`;
		await createSampleProduct(page, { name, price: "10", desc: "Update Product" });

		// 1) Open Update
		await openUpdateForProduct(page, name);

		// 2) Change price and click UPDATE
		await setPrice(page, "13.49");
		await page.getByRole("button", { name: /update product/i }).click();

		// Optional: if your UI shows a toast, this makes the wait deterministic
		try {
			await expectToast(page, /updated|success|saved/i, { timeout: 1500 });
		} catch {}

		// 3) Go back to Products grid explicitly
		await page.getByRole("link", { name: /^products$/i }).click();
		await expect(page).toHaveURL(/\/dashboard\/admin\/products/i);

		// 4) Re-open the same product and assert the price input (source of truth)
		await openUpdateForProduct(page, name);

		// eventual assertion tolerates slow hydration
		const priceInput = page.getByPlaceholder(/write a price/i);
		await expect
			.poll(async () => priceInput.inputValue(), {
				timeout: 8000,
				message: "price did not settle to updated value",
			})
			.toMatch(/13\.49|13\.5/);
	});

	test("bad price shows validation and stays on the Update form", async ({ page }) => {
		await gotoProducts(page);

		const name = `Update Product ${Date.now()}`;
		await createSampleProduct(page, { name, price: "10.00", desc: "Update Product" });

		await openUpdateForProduct(page, name);

		await setPrice(page, "-10");
		await page.getByRole("button", { name: /update product/i }).click();

		await expectToast(page, /price|invalid|positive|greater than/i);
		await expect(page.getByRole("heading", { name: /update product/i })).toBeVisible();
	});

	test("delete a product (confirm) removes it from grid", async ({ page }) => {
		await gotoProducts(page);

		const name = `Delete Product ${Date.now()}`;
		await createSampleProduct(page, { name, price: "9.99", desc: "Delete Product" });

		await openUpdateForProduct(page, name);

		page.once("dialog", (d) => d.accept());
		await page.getByRole("button", { name: /delete product/i }).click();

		await expect(page).toHaveURL(/\/dashboard\/admin\/products/i);
		await expect(page.getByRole("heading", { name })).toHaveCount(0);
	});
});
