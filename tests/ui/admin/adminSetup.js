// Written by Ujjwal Gaurav
// This is written so that it can be reused in multiple admin tests
import { expect } from "@playwright/test";
import path from "path";

export async function loginAsAdmin(
	page,
	{ email = "admin@gmail.com", password = "Admin12345" } = {}
) {
	await page.goto("/");
	await page.getByRole("link", { name: /login/i }).click();
	await page.getByRole("textbox", { name: /enter your email/i }).fill(email);
	await page.getByRole("textbox", { name: /enter your password/i }).fill(password);
	await page.getByRole("button", { name: /^login$/i }).click();
	await expect(page).toHaveURL(/\/$/);
}

export async function openAdminDashboard(page) {
	await page.getByRole("button", { name: /admin user/i }).click();
	await page.getByRole("link", { name: /dashboard/i }).click();
	await expect(page).toHaveURL(/\/dashboard\/admin/i);
}

export async function logoutFromNavbar(page) {
	await page.getByRole("button", { name: /admin user/i }).click();
	await page.getByRole("link", { name: /logout/i }).click();
	await expect(page).not.toHaveURL(/\/dashboard\/admin/i);
}

export async function loginAsUser(page, { email = "user@gmail.com", password = "User12345" } = {}) {
	await page.goto("/");
	await page.getByRole("link", { name: /login/i }).click();
	await page.getByRole("textbox", { name: /enter your email/i }).fill(email);
	await page.getByRole("textbox", { name: /enter your password/i }).fill(password);
	await page.getByRole("button", { name: /^login$/i }).click();
	await expect(page).toHaveURL(/\/$/);
}

// Created using ChatGPT
export async function expectToast(page, regex) {
	const alert = page.getByRole("alert");
	if (await alert.count()) {
		await expect(alert).toContainText(regex);
	} else {
		await expect(page.locator("body")).toContainText(regex);
	}
}

export async function openAntdDropdown(page, trigger) {
	await trigger.scrollIntoViewIfNeeded();
	await trigger.click();
	const dd = page.locator(".ant-select-dropdown:visible").last();
	await expect(dd).toBeVisible();
	return dd;
}

// Created using ChatGPT
export async function antdSelectByText(dd, text) {
	const byTitle = dd.getByTitle(text).first();
	if (await byTitle.count()) {
		await byTitle.click();
		return;
	}
	const byRole = dd.getByRole("option", { name: new RegExp(`^${text}$`, "i") }).first();
	if (await byRole.count()) {
		await byRole.click();
		return;
	}
	await dd
		.getByText(new RegExp(`^${text}$`, "i"))
		.first()
		.click();
}

// Created using ChatGPT
function categoryCell(page, label) {
  return page.getByRole('cell', { name: new RegExp(`^${label}$`, 'i') });
}

// Created using ChatGPT
export async function createCategoryIfNeeded(page, label) {
  await page.getByRole('link', { name: /create category/i }).click();
  await expect(page.getByRole('heading', { name: /manage category/i })).toBeVisible();

  if (await categoryCell(page, label).count()) return;

  await page.getByRole('textbox', { name: /enter new category/i }).fill(label);
  await page.getByRole('button', { name: /^submit$/i }).click();

  try {
    await expectToast(page, /exist|duplicate|already/i, { timeout: 1500 });
  } catch {
    await expect(categoryCell(page, label)).toBeVisible({ timeout: 7000 });
  }
}

// Created using ChatGPT
export async function selectOrCreateCategoryOnCreateProduct(page, label) {
  const categoryTrigger = page.locator('.ant-select').first();

  await categoryTrigger.click();
  let dd = page.locator('.ant-select-dropdown:visible').last();
  const hasAny = await dd.locator('.ant-select-item-option').count();
  const hasTarget = await dd.getByText(new RegExp(`^${label}$`, 'i')).count();
  await page.keyboard.press('Escape');

  if (!hasAny || !hasTarget) {
    await page.getByRole('link', { name: /create category/i }).click();
    await createCategoryIfNeeded(page, label);
    await page.getByRole('link', { name: /create product/i }).click();
    await expect(page.getByRole('heading', { name: /create product/i })).toBeVisible();
  }

  await categoryTrigger.click();
  dd = page.locator('.ant-select-dropdown:visible').last();
  const byTitle = dd.getByTitle(label).first();
  if (await byTitle.count()) { await byTitle.click(); return; }
  await dd.getByText(new RegExp(`^${label}$`, 'i')).first().click();
}

export async function chooseShippingYes(page) {
	const shippingTrigger = page.locator(".mb-3 > .ant-select").first(); 
	const dd = await openAntdDropdown(page, shippingTrigger);
	await antdSelectByText(dd, "Yes"); 
}

export async function uploadPhoto(page, relativePath = "tests/assets/sample.jpeg") {
	const fileInput = page.locator('input[type="file"]'); 
	const absolute = path.join(process.cwd(), relativePath);
	await fileInput.setInputFiles(absolute);
}

// Created using ChatGPT
export async function uploadVirtualImage(
	page,
	{ bytes, name = "test.jpg", mimeType = "image/jpeg" }
) {
	const fileInput = page.locator('input[type="file"]');
	const buffer = Buffer.alloc(bytes, 0x41);
	await fileInput.setInputFiles([{ name, mimeType, buffer }]);
}