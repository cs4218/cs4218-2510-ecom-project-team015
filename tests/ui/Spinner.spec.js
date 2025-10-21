// Author: Vedant Sinha
// This file has been written with the help of ChatGPT 
import { test, expect } from "@playwright/test";

test.describe("Spinner Component - Protected Routes", () => {
  test("shows spinner and redirects to home from user dashboard when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard/user");

    // Spinner appears with countdown text
    const spinner = page.locator(".spinner-border[role='status']");
    await expect(spinner).toBeVisible();
    await expect(
      page.getByText(/redirecting to you in \d+ second/i)
    ).toBeVisible();

    // Wait for redirect to home (PrivateRoute passes path="" => "/")
    await expect(page).toHaveURL(/\/$/);

    // Sanity check we actually landed on the homepage content
    await expect(page.getByRole("heading", { name: /All Products/i })).toBeVisible();
  });

  test("shows spinner and redirects to login from admin dashboard when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard/admin");

    // Spinner appears with countdown text
    const spinner = page.locator(".spinner-border[role='status']");
    await expect(spinner).toBeVisible();
    await expect(
      page.getByText(/redirecting to you in \d+ second/i)
    ).toBeVisible();

    // Wait for redirect to login (default Spinner path is "login")
    await expect(page).toHaveURL(/\/login$/);

    // Sanity check: login page has email/password fields
    await expect(page.getByPlaceholder(/enter your email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/enter your password/i)).toBeVisible();
  });
});
