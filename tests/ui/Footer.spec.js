import { test, expect } from "@playwright/test";

test.describe("Footer Component - UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders footer with copyright text", async ({ page }) => {
    const footer = page.locator(".footer");
    await expect(footer).toBeVisible();
    await expect(footer.locator("h4")).toContainText(
      "All Rights Reserved © TestingComp"
    );
  });

  test("shows expected footer links with correct hrefs", async ({ page }) => {
    const about = page.getByRole("link", { name: "About" });
    const contact = page.getByRole("link", { name: "Contact" });
    const policy = page.getByRole("link", { name: "Privacy Policy" });

    await expect(about).toBeVisible();
    await expect(contact).toBeVisible();
    await expect(policy).toBeVisible();

    await expect(about).toHaveAttribute("href", "/about");
    await expect(contact).toHaveAttribute("href", "/contact");
    await expect(policy).toHaveAttribute("href", "/policy");
  });

  test("navigates via footer links and footer persists", async ({ page }) => {
    // About
    await page.getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL("/about");
    await expect(page).toHaveTitle(/About us - Ecommerce app/);
    await expect(page.locator(".footer")).toBeVisible();

    // Contact
    await page.getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL("/contact");
    await expect(page).toHaveTitle(/Contact Us - Ecommerce app/);
    await expect(page.locator(".footer")).toBeVisible();

    // Policy
    await page.getByRole("link", { name: "Privacy Policy" }).click();
    await expect(page).toHaveURL("/policy");
    await expect(page).toHaveTitle(/Privacy Policy - Ecommerce app/);
    await expect(page.locator(".footer")).toBeVisible();
  });
});

