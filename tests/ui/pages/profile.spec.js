import { test, expect } from "@playwright/test";
// test.describe.configure({mode: "parallel"});

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

test.describe("UI tests for profile page", () => {
    test.beforeEach(async({page}) => {
        await page.goto("/login");
        const userNameInput = page.getByPlaceholder("Enter Your Email");
        const pwdInput = page.getByPlaceholder("Enter Your Password");
        const submitButton = page.getByText("LOGIN", { exact: true });

        await userNameInput.fill("cs4218@test.com");
        await pwdInput.fill("cs4218@test.com");
        await submitButton.click();
    });

    test.afterEach(async({page}) => {
        await page.getByRole("button", { name: "Normal User" }).click();
        await page.getByRole("link", { name: "Logout" }).click();
    })


    test("Check if profile page renders", async ({ page }) => {
        await page.goto("/dashboard/user/profile");
        await expect(page.getByText("USER PROFILE")).toBeVisible();
    });

    test("Check if user data is populated correctly", async ({ page }) => {
        //Arrange + Act
        await page.goto("/dashboard/user/profile");

        const nameInput = page.locator("#exampleNameInput");
        const emailInput = page.locator("#exampleEmailInput");

        // Act
        await expect(nameInput).toHaveValue("Normal User");
        await expect(emailInput).toBeDisabled();
        await expect(emailInput).toHaveValue("cs4218@test.com");
    });

    test("Check if profile update form works", async ({ page }) => {
        // Arrange
        await page.goto("/dashboard/user/profile");

        const nameInput = page.locator("#exampleNameInput");
        const phoneInput = page.locator("#examplePhoneInput");
        const addressInput = page.locator("#exampleAddressInput");
        const updateButton = page.locator("#updateButton");

        // Act
        await nameInput.fill("Test User Updated");
        await phoneInput.fill("98765432");
        await addressInput.fill("New Address, Singapore");

        await updateButton.click();

        // Assert
        await expect(page.getByText("Profile Updated Successfully")).toBeVisible();
        await expect(nameInput).toHaveValue("Test User Updated");
        await expect(phoneInput).toHaveValue("98765432");
        await expect(addressInput).toHaveValue("New Address, Singapore");

        //Reset Profile
        await ResetProfile(page);
    });

    test("Check if password input updates", async ({ page }) => {
        // Arrange
        await page.goto("/dashboard/user/profile");
        const passwordInput = page.locator("#examplePasswordInput");
        const updateButton = page.locator("#updateButton");
        
        // Act
        await passwordInput.fill("newsecurepassword");
        await updateButton.click();
        
        // Assert
        await expect(page.getByText("Profile Updated Successfully")).toBeVisible();

        //Reset Profile
        await ResetProfile(page);
    });

    test("Check validation for invalid name", async ({ page }) => {
        // Arrange
        await page.goto("/dashboard/user/profile");
        const nameInput = page.locator("#exampleNameInput");
        const updateButton = page.locator("#updateButton");

        // Act
        await nameInput.fill("23");
        await updateButton.click();

        // Assert
        await expect(page.getByText("Name can contain only letters and spaces!")).toBeVisible();
    });

    test("Check validation for invalid pwd", async ({ page }) => {
        // Arrange
        await page.goto("/dashboard/user/profile");
        const pwdInput = page.locator("#examplePasswordInput");
        const updateButton = page.locator("#updateButton");

        // Act
        await pwdInput.fill(" ");
        await updateButton.click();

        // Assert
        await expect(page.getByText("Password has to be longer than 6 characters!")).toBeVisible();
    });

    test("Check validation for invalid phone", async ({ page }) => {
        // Arrange
        await page.goto("/dashboard/user/profile");
        const phoneInput = page.locator("#examplePhoneInput");
        const updateButton = page.locator("#updateButton");

        // Act
        await phoneInput.fill("909099");
        await updateButton.click();

        // Assert
        await expect(page.getByText("Invalid Singapore phone number")).toBeVisible();
    });

    test("Test if all fields reappear if updated with empty values", async ({ page }) => {
        // Arrange
        await page.goto("/dashboard/user/profile");
        const nameInput = page.locator("#exampleNameInput");
        const phoneInput = page.locator("#examplePhoneInput");
        const pwdInput = page.locator("#examplePasswordInput");
        const addressInput = page.locator("#exampleAddressInput");

        const updateButton = page.locator("#updateButton");

        // Act
        await nameInput.fill("");
        await phoneInput.fill("");
        await pwdInput.fill("");
        await addressInput.fill("");

        await updateButton.click();

        // Assert
        await expect(page.getByText("Profile Updated Successfully")).toBeVisible();
        await expect(nameInput).toHaveValue("Normal User");
        await expect(phoneInput).toHaveValue("81234567");
        await expect(addressInput).toHaveValue("1 Computing Drive");
    });
})