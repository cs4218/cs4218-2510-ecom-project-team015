// Written by Ujjwal Gaurav
// This test file checks the admin login and permissions workflow
import { test, expect } from "@playwright/test";
import {
	loginAsAdmin,
	loginAsUser,
	openAdminDashboard,
	logoutFromNavbar,
	expectToast,
} from "./adminSetup.js";

test("admin can login and open Dashboard from navbar dropdown", async ({ page }) => {
	await loginAsAdmin(page);
	await openAdminDashboard(page);

	await expect(page.getByRole("heading", { name: /admin name\s*:/i })).toBeVisible();
	await expect(page.getByRole("heading", { name: /admin email\s*:/i })).toBeVisible();
	await expect(page.getByRole("heading", { name: /admin contact\s*:/i })).toBeVisible();

	await expect(page.getByRole("link", { name: /create category/i })).toBeVisible();
	await expect(page.getByRole("link", { name: /create product/i })).toBeVisible();
	await expect(page.getByRole("link", { name: /products/i })).toBeVisible();
	await expect(page.getByRole("link", { name: /orders/i })).toBeVisible();
	await expect(page.getByRole("link", { name: /users/i })).toBeVisible();
});

test("invalid email id shows a toast error and stays on login page", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("link", { name: /login/i }).click();
	await page.getByRole("textbox", { name: /enter your email/i }).fill("wrongEmail@gmail.com");
	await page.getByRole("textbox", { name: /enter your password/i }).fill("Admin12345");
	await page.getByRole("button", { name: /^login$/i }).click();

	await expectToast(page, /email\s+is\s+not\s+registere?d/i);
	await expect(page).not.toHaveURL(/\/$/);
});

test("invalid password shows a toast error and stays on login page", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("link", { name: /login/i }).click();
	await page.getByRole("textbox", { name: /enter your email/i }).fill("admin@gmail.com");
	await page.getByRole("textbox", { name: /enter your password/i }).fill("WrongPass12345");
	await page.getByRole("button", { name: /^login$/i }).click();

	await expectToast(page, /invalid password|incorrect/i);
	await expect(page).not.toHaveURL(/\/$/);
});

test("logout from navbar and protect admin routes from accessing after logging out", async ({
	page,
}) => {
	await loginAsAdmin(page);
	await openAdminDashboard(page);
	await logoutFromNavbar(page);

	await page.goto("/dashboard/admin");
	await expect(page).toHaveURL(/login|signin/i);
});

test("non-admin users cannot access Admin Dashboard", async ({ page }) => {
	await loginAsUser(page);
	await page.goto("/dashboard/admin");
	await expect(page).toHaveURL(/\/login/i);

	await page.goto("/");
	await expect(page.getByRole("button", { name: /user/i })).toBeVisible();
});

test("non-admin users should not have access to Admin controls", async ({ page }) => {
	await loginAsUser(page);
	await page.getByRole("button", { name: /user/i }).click();
	await page.getByRole("link", { name: /dashboard/i }).click();
	await expect(page).toHaveURL(/\/dashboard\/user/i);

	await expect(page.getByRole("link", { name: /create product/i })).toHaveCount(0);
	await expect(page.getByRole("link", { name: /create category/i })).toHaveCount(0);
	await expect(page.getByRole("link", { name: /products/i })).toHaveCount(0);
	await expect(page.getByRole("link", { name: /users/i })).toHaveCount(0);
});
