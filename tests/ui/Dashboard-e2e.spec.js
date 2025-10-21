import { test, expect } from "@playwright/test";
// Logs in -> Goes to dashboard -> Verifies values -> Clicks on profile button -> clicks on orders button
test.describe.configure({mode: "parallel"});

const userName = "Normal User";
const email = "cs4218@test.com";
const address = "1 Computing Drive";
const pwd = "cs4218@test.com"

test.beforeEach(async({page}) => {
    await page.goto("/login");
    const userNameInput = page.getByPlaceholder("Enter Your Email");
    const pwdInput = page.getByPlaceholder("Enter Your Password");
    const submitButton = page.getByText("LOGIN", { exact: true });

    await userNameInput.fill(email);
    await pwdInput.fill(pwd);
    await submitButton.click();
});

test("Check if dashboard page renders correctly with usermenu", async ({ page }) => {
    //arrange
    await page.goto("/dashboard/user");

    const sidebarTitle = page.getByRole('heading', { name: 'Dashboard' });
    const userNameDisplayed = page.getByRole('heading', { name: userName })
    const emailDisplayed = page.getByRole('heading', { name: email });
    const addressDisplayed = page.getByRole('heading', { name: address });
    const profileButton = page.getByRole("link", { name: "Profile" });
    const ordersButton = page.getByRole("link", {name: "Orders"});

    //assert
    await expect(sidebarTitle).toBeVisible();
    await expect(userNameDisplayed).toBeVisible();
    await expect(emailDisplayed).toBeVisible();
    await expect(addressDisplayed).toBeVisible();
    await expect(profileButton).toBeVisible();
    await expect(ordersButton).toBeVisible();
});

test("Check if usermenu buttons navigate correctly", async ({page}) => {
    //arrange
    await page.goto("/dashboard/user");
    const profileButton = page.getByRole("link", { name: "Profile" });
    const ordersButton = page.getByRole("link", {name: "Orders"});

    // act
    await profileButton.click();

    // assert
    const profileHeader = page.getByText("USER PROFILE");

    await expect(profileHeader).toBeVisible();

    // act again (aims to check if the switching between pages works when switching from profile to orders directly)
    await ordersButton.click();

    //assert again
    await expect(page.getByText("All Orders")).toBeVisible();
})