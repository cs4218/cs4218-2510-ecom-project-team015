// Author: Vedant Sinha
// This file has been written with the help of ChatGPT
import { test, expect } from "@playwright/test";

async function mockCategories(page) {
  await page.route("**/api/v1/category/get-category", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        category: [
          { _id: "c1", name: "Electronics", slug: "electronics" },
          { _id: "c2", name: "Books", slug: "books" },
        ],
      }),
    });
  });
}

test.describe("Header - UI", () => {
  test.beforeEach(async ({ page }) => {
    await mockCategories(page);
  });

  test("renders brand and primary nav links (guest)", async ({ page }) => {
    await page.goto("/");

    const navbar = page.locator("nav.navbar");
    await expect(navbar).toBeVisible();

    const brand = page.locator(".navbar-brand");
    await expect(brand).toBeVisible();
    await expect(brand).toContainText("Virtual Vault");

    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Categories" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Cart" })).toBeVisible();

    // Guest sees Register/Login
    await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();

    // Search form presence
    await expect(page.getByPlaceholder("Search")).toBeVisible();
    await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
  });

  test("search submits and navigates to /search", async ({ page }) => {
    // Mock search API
    await page.route("**/api/v1/product/search/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ results: [] }),
      });
    });

    await page.goto("/");
    await page.getByPlaceholder("Search").fill("phone");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL("/search");
  });

  test("shows user menu and allows logout when authenticated", async ({ page }) => {
    // Seed auth before load so context picks it up
    await page.addInitScript(() => {
      localStorage.setItem(
        "auth",
        JSON.stringify({ token: "token123", user: { name: "John Doe", role: 0 } })
      );
    });

    await page.goto("/");

    // User dropdown toggle renders as an <a role="button"> per Header.js
    const userToggle = page.getByRole("button", { name: /John Doe/i });
    await expect(userToggle).toBeVisible();

    // Open dropdown and click Logout
    await userToggle.click();
    await page.getByRole("link", { name: "Logout" }).click();

    // After logout, redirected to login and guest links reappear
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
  });

  test("cart badge reflects item count from localStorage (guest)", async ({ page }) => {
    // Seed cart in localStorage to show a non-zero badge
    await page.addInitScript(() => {
      localStorage.setItem(
        "cart",
        JSON.stringify([
          { _id: "p1", name: "Phone", price: 100 },
          { _id: "p2", name: "Book", price: 10 },
          { _id: "p3", name: "Mouse", price: 25 },
        ])
      );
    });

    await page.goto("/");

    // Badge comes from antd; verify displayed count text
    const badge = page.locator(".ant-badge .ant-badge-count");
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText("3");
  });
});
