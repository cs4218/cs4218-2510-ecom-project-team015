// Written by Ujjwal Gaurav
// This test file checks the admin orders workflow
import { test, expect } from "@playwright/test";
import { loginAsAdmin, openAdminDashboard, logoutFromNavbar } from "../admin/adminSetup";

const STATUSES = ["Not Processed", "Processing", "Shipped", "Delivered", "Cancelled"];

function firstRow(page) {
	return page.locator("table tbody tr").first();
}

function statusValue(row) {
	return row.locator(".ant-select-selection-item").first();
}

function statusSelector(row) {
	return row.locator(".ant-select-selector").first();
}

async function openAdminOrders(page) {
	await loginAsAdmin(page);
	await openAdminDashboard(page);
	await page.getByRole("link", { name: /^orders$/i }).click();
	await expect(page.getByRole("heading", { name: /all orders/i })).toBeVisible();
}

// Created using ChatGPT
async function chooseStatus(row, label) {
	await statusSelector(row).click();
	const dd = row.page().locator(".ant-select-dropdown").last();
	await expect(dd).toBeVisible();
	await dd.locator(".ant-select-item-option", { hasText: new RegExp(`^${label}$`, "i") }).click();
}

test.describe("Admin Orders", () => {
	test("verify if it loads the headers, status, product cards, and other info", async ({
		page,
	}) => {
		openAdminOrders(page);

		await expect(page.getByRole("columnheader", { name: "#" })).toBeVisible();
		await expect(page.getByRole("columnheader", { name: /status/i })).toBeVisible();
		await expect(page.getByRole("columnheader", { name: /buyer/i })).toBeVisible();
		await expect(page.getByRole("columnheader", { name: /date/i })).toBeVisible();
		await expect(page.getByRole("columnheader", { name: /payment/i })).toBeVisible();
		await expect(page.getByRole("columnheader", { name: /quantity/i })).toBeVisible();

		const buyerCell = firstRow(page).locator("td").nth(2);
		const paymentCell = firstRow(page).locator("td").nth(4);
		const qtyCell = firstRow(page).locator("td").nth(5);

		await expect(buyerCell).toHaveText(/test user/i);
		await expect(paymentCell).toHaveText(/success/i);
		await expect(qtyCell).toHaveText(/^\s*2\s*$/);

		const cards = page.locator(".container .card");
		await expect(cards).toHaveCount(2);
		await expect(cards.first().getByText(/^Textbook$/)).toBeVisible();
		await expect(cards.first().getByText(/price\s*:\s*79\.99/i)).toBeVisible();
	});

	test("verify if changing order status persists after reloading and re-login", async ({
		page,
	}) => {
		await openAdminOrders(page);

		const row = firstRow(page);
		const value = statusValue(row);
		const current = (await value.innerText()).trim();
		const next = STATUSES.find((s) => s.toLowerCase() !== current.toLowerCase()) || "Shipped";

		await chooseStatus(row, next);
		await expect(value).toHaveText(new RegExp(`^${next}$`, "i"));

		await page.reload();
		await expect(page.getByRole("heading", { name: /all orders/i })).toBeVisible();
		await expect(statusValue(firstRow(page))).toHaveText(new RegExp(`^${next}$`, "i"));

		await logoutFromNavbar(page);
		await openAdminOrders(page);
		await expect(statusValue(firstRow(page))).toHaveText(new RegExp(`^${next}$`, "i"));

		await chooseStatus(firstRow(page), current);
		await expect(statusValue(firstRow(page))).toHaveText(new RegExp(`^${current}$`, "i"));
	});

	test("verify if status dropdown lists all options", async ({ page }) => {
		await openAdminOrders(page);

		const row = firstRow(page);
		await statusSelector(row).click();
		const dd = page.locator(".ant-select-dropdown").last();
		await expect(dd).toBeVisible();

		const options = dd.locator(".ant-select-item-option");
		await expect(options).toHaveCount(5);
		const texts = await options.allTextContents();
		expect(new Set(texts.map((t) => t.trim()))).toEqual(
			new Set(["Not Processed", "Processing", "Shipped", "Delivered", "Cancelled"])
		);

		await page.mouse.click(0, 0);
	});

	test("verify if cards count equals quantity cell", async ({ page }) => {
		await openAdminOrders(page);

		const row = firstRow(page);
		const qtyText = await row.locator("td").nth(5).innerText(); // Quantity cell
		const qty = Number(qtyText.trim());

		const cards = page.locator(".container .card");
		await expect(cards).toHaveCount(qty);
	});
});
