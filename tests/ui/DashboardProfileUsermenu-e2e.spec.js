import { test, expect } from "@playwright/test";

const userName = "Normal User";
const email = "cs4218@test.com";
const address = "1 Computing Drive";
const pwd = "cs4218@test.com"

const ResetProfile = async (page) => {
    await page.goto("/dashboard/user/profile");

    const nameInput = page.locator("#exampleNameInput");
    const phoneInput = page.locator("#examplePhoneInput");
    const addressInput = page.locator("#exampleAddressInput");
    const pwdInput = page.getByPlaceholder("Enter Your Password")
    const updateButton = page.locator("#updateButton");

    // Act
    await nameInput.fill("Normal User");
    await phoneInput.fill("81234567");
    await addressInput.fill("1 Computing Drive");
    await pwdInput.fill("cs4218@test.com");
    await updateButton.click();
}

test.describe('e2e testing for dashboard, usermenu and profile update', () => {
    test.beforeEach(async({page}) => {
        await page.goto("/login");
        const userNameInput = page.getByPlaceholder("Enter Your Email");
        const pwdInput = page.getByPlaceholder("Enter Your Password");
        const submitButton = page.getByText("LOGIN", { exact: true });

        await userNameInput.fill(email);
        await pwdInput.fill(pwd);
        await submitButton.click();
    });

    test("Check if dashboard page renders with initial data", async ({ page }) => {
        //arrange
        await page.goto("/dashboard/user");

        const sidebarTitle = page.getByRole('heading', { name: 'Dashboard' });
        const userNameDisplayed = page.getByRole('heading', { name: userName })
        const emailDisplayed = page.getByRole('heading', { name: email });
        const addressDisplayed = page.getByRole('heading', { name: address });

        //assert
        await expect(sidebarTitle).toBeVisible();
        await expect(userNameDisplayed).toBeVisible();
        await expect(emailDisplayed).toBeVisible();
        await expect(addressDisplayed).toBeVisible();
    });

    test("Check if dashboard values change after updates to name and address are done", async ({page}) => {
        // Arrange
        await page.goto("/dashboard/user/profile");

        const nameInput = page.locator("#exampleNameInput");
        const addressInput = page.locator("#exampleAddressInput");
        const updateButton = page.locator("#updateButton");

        // Act
        await nameInput.fill("Test User Updated");
        await addressInput.fill("New Address, Singapore");

        await updateButton.click();
        await page.waitForTimeout(500); // The users objects take time to render.
        await page.goto("/dashboard/user");

        // Assert
        await expect(page.getByRole('heading', { name: "Test User Updated" })).toBeVisible();
        await expect(page.getByRole('heading', {name: "New Address, Singapore"})).toBeVisible();

        //Reset Profile
        await ResetProfile(page);
    });
});


