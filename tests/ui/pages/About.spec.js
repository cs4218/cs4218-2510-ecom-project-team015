// Author: Vedant Sinha
// This file has been written with the help of ChatGPT 
import { test, expect } from "@playwright/test";

test.describe("About Page - UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/about");
  });

  test("sets the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/About us - Ecommerce app/);
  });

  test("renders main about content (image and text)", async ({ page }) => {
    const container = page.locator(".contactus");
    await expect(container).toBeVisible();

    const aboutImg = page.locator('img[alt="contactus"]');
    await expect(aboutImg).toBeVisible();
    // Be explicit: read the attribute value and assert
    const src = await aboutImg.getAttribute('src');
    expect(src).toMatch(/\/images\/about\.jpeg$/);

    // Verify the actual image has loaded (rendered) in the browser
    const loaded = await aboutImg.evaluate((img) => img.complete && img.naturalWidth > 0);
    expect(loaded).toBeTruthy();

    await expect(page.getByText(/Add text/i)).toBeVisible();
  });

  test("has expected column layout classes", async ({ page }) => {
    await expect(page.locator(".contactus .col-md-6")).toBeVisible();
    await expect(page.locator(".contactus .col-md-4")).toBeVisible();
  });
});

test.describe("About Page - Asset Delivery", () => {
  test("about.jpeg is served successfully with 200", async ({ page }) => {
    const res = await page.request.get("/images/about.jpeg");
    expect(res.status()).toBe(200);
    const ct = res.headers()["content-type"] || "";
    expect(ct).toMatch(/image\/(jpeg|jpg)/i);
    const buf = await res.body();
    expect(buf.byteLength).toBeGreaterThan(0);
  });
});
