// Author: Vedant Sinha
// This file has been written with the help of Claude.
import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const baseURL = "http://localhost:3000";
const adminEmail = "cs4218Admin@test.com";
const adminPassword = "cs4218@test.com";

// Login as admin before each test
test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(`${baseURL}/login`);

    // Fill in admin credentials
    const emailField = page.getByPlaceholder("Enter Your Email");
    const passwordField = page.getByPlaceholder("Enter Your Password");
    const loginButton = page.getByRole("button", { name: /login/i });

    await emailField.fill(adminEmail);
    await passwordField.fill(adminPassword);
    await loginButton.click();

  // Wait for successful login
  await expect(page.getByText(/login successful/i)).toBeVisible();
  await expect(page).toHaveURL(`${baseURL}/`);
});

// Logout after each test
test.afterEach(async ({ page }) => {
  // Click on user dropdown and logout
  await page.getByRole("button", { name: /admin user/i }).click();
  await page.getByRole("link", { name: /logout/i }).click();
});

test("should display create category page with all essential components", async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto(`${baseURL}/dashboard/admin`);

    // Click on "Create Category" link in AdminMenu
    await page.getByRole("link", { name: /create category/i }).click();

    // Verify URL
    await expect(page).toHaveURL(`${baseURL}/dashboard/admin/create-category`);

    // Verify page heading
    const heading = page.getByRole("heading", { name: /manage category/i, level: 1 });
    await expect(heading).toBeVisible();

    // Verify form elements are present
    const categoryInput = page.getByPlaceholder(/enter new category/i);
    const submitButton = page.getByRole("button", { name: /submit/i });

    await expect(categoryInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Verify table is present with headers
    const table = page.getByRole("table");
    await expect(table).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /name/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /actions/i })).toBeVisible();
  });

test("should create a new category successfully and display it in the list", async ({ page }) => {
    await page.goto(`${baseURL}/dashboard/admin/create-category`);

    // Wait for initial categories (seed data) to load
    await expect(page.getByRole("cell", { name: /electronics/i })).toBeVisible();

    const table = page.getByRole("table");
    const initialRows = await table.locator("tbody tr").count();

    const categoryInput = page.getByPlaceholder(/enter new category/i);
    const submitButton = page.getByRole("button", { name: /submit/i });
    const newCategoryName = `TestCategory${Date.now()}`;

    await categoryInput.fill(newCategoryName);
    await submitButton.click();

    await expect(page.getByText(new RegExp(`${newCategoryName} is created`, "i"))).toBeVisible();
    await expect(categoryInput).toHaveValue("");

    // Wait for new row to render
    await expect(page.getByRole("cell", { name: newCategoryName })).toBeVisible();

    // Validate count increased
    const updatedRows = await table.locator("tbody tr").count();
    expect(updatedRows).toBe(initialRows + 1);

    // Verify action buttons
    const categoryRow = page.locator(`tr:has-text("${newCategoryName}")`);
    await expect(categoryRow.getByRole("button", { name: /edit/i })).toBeVisible();
    await expect(categoryRow.getByRole("button", { name: /delete/i })).toBeVisible();
});

  test("should prevent creating category with empty name", async ({ page }) => {
    await page.goto(`${baseURL}/dashboard/admin/create-category`);

    const categoryInput = page.getByPlaceholder(/enter new category/i);
    const submitButton = page.getByRole("button", { name: /submit/i });

    // Try to submit with empty name
    await categoryInput.fill("   ");
    await submitButton.click();

    // Verify error toast
    await expect(page.getByText(/name is required/i)).toBeVisible();
  });

test("should prevent creating duplicate category (case-insensitive)", async ({ page }) => {
    await page.goto(`${baseURL}/dashboard/admin/create-category`);

    const categoryInput = page.getByPlaceholder(/enter new category/i);
    const submitButton = page.getByRole("button", { name: /submit/i });
    const categoryName = `UniqueCategory${Date.now()}`;

    // Create first category
    await categoryInput.fill(categoryName);
    await submitButton.click();
    await expect(page.getByText(new RegExp(`${categoryName} is created`, "i"))).toBeVisible();

    // Try duplicate with same case
    await categoryInput.fill(categoryName);
    await submitButton.click();
    await expect(page.getByText(/category already exists/i).first()).toBeVisible();

    // Wait for previous toast to disappear
    await page.waitForSelector('text=Category already exists', { state: 'hidden' });

    // Try duplicate with upper case
    await categoryInput.fill(categoryName.toUpperCase());
    await submitButton.click();
    await expect(page.getByText(/category already exists/i).first()).toBeVisible();
});

  test("should navigate from dashboard to create category page via AdminMenu", async ({ page }) => {
    // Start from homepage
    await page.goto(`${baseURL}/`);

    // Navigate to admin dashboard
    await page.getByRole("button", { name: /admin user/i }).click();
    await page.getByRole("link", { name: /dashboard/i }).click();

    // Verify we're on the admin dashboard
    await expect(page).toHaveURL(`${baseURL}/dashboard/admin`);

    // Click on "Create Category" in AdminMenu
    const createCategoryLink = page.getByRole("link", { name: /create category/i });
    await expect(createCategoryLink).toBeVisible();
    await createCategoryLink.click();

    // Verify navigation to create category page
    await expect(page).toHaveURL(`${baseURL}/dashboard/admin/create-category`);
    await expect(page.getByRole("heading", { name: /manage category/i })).toBeVisible();
  });

  test("should create multiple categories in sequence", async ({ page }) => {
    await page.goto(`${baseURL}/dashboard/admin/create-category`);

    const categoryInput = page.getByPlaceholder(/enter new category/i);
    const submitButton = page.getByRole("button", { name: /submit/i });
    const timestamp = Date.now();

    // Create multiple categories
    const categories = [
      `Electronics${timestamp}`,
      `Books${timestamp}`,
      `Clothing${timestamp}`,
    ];

    for (const categoryName of categories) {
      await categoryInput.fill(categoryName);
      await submitButton.click();
      
      // Wait for success message
      await expect(page.getByText(new RegExp(`${categoryName} is created`, "i"))).toBeVisible();
      
      // Verify the category appears in the table
      await expect(page.getByRole("cell", { name: categoryName })).toBeVisible();
      
      // Verify input is cleared
      await expect(categoryInput).toHaveValue("");
    }

    // Verify all categories are visible in the table
    for (const categoryName of categories) {
      await expect(page.getByRole("cell", { name: categoryName })).toBeVisible();
    }
  });

  test("should trim whitespace from category name", async ({ page }) => {
    await page.goto(`${baseURL}/dashboard/admin/create-category`);

    const categoryInput = page.getByPlaceholder(/enter new category/i);
    const submitButton = page.getByRole("button", { name: /submit/i });
    const categoryName = `TrimTest${Date.now()}`;

    // Enter category name with leading and trailing spaces
    await categoryInput.fill(`   ${categoryName}   `);
    await submitButton.click();

    // Verify success with trimmed name
    await expect(page.getByText(new RegExp(`${categoryName} is created`, "i"))).toBeVisible();

  // Verify the category appears without extra spaces
  await expect(page.getByRole("cell", { name: categoryName, exact: true })).toBeVisible();
});