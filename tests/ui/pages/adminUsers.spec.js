// Author: Adhitya
import { test, expect } from "@playwright/test";
import { userSeed } from "../seed/userSeed";
// e2e test which involves: register as new user -> log in as admin user -> navigate to dashboard/admin/users -> validate new user created

// test.describe.configure({ mode: "parallel" });

test.describe("Test admin users page", () => {
    test("Check if all users displays correctly", async ({ page }) => {
        // Arrange
        await page.goto("/login");
        const adminUserEmail = "cs4218Admin@test.com";
        const adminUserPwd = "cs4218@test.com";
        const newEmailInput = page.getByPlaceholder("Enter Your Email");
        const pwdInput = page.getByPlaceholder("Enter Your Password");
        const submitButton = page.getByText("LOGIN", { exact: true });
        const homePageHeading = page.getByRole("heading", {name: "All Products"});
        const allUsersButton = "dashboard/admin/users";
        const allUsersInDB = [...userSeed]; //gets all objects from in memory db

        // Act and assert
        await newEmailInput.fill(adminUserEmail);
        await pwdInput.fill(adminUserPwd);
        await submitButton.click();     // we navigate to homepage
        await expect(homePageHeading).toBeVisible();
        await page.goto(allUsersButton);
        await expect(page.getByText("All Users")).toBeVisible();
        await page.waitForTimeout(500); // The users objects take time to render.
        for (let i = 0; i < allUsersInDB.length; i++) {
            await expect(page.getByTestId(`user-number-${i+1}`)).toHaveText(String(i+1));
            await expect(page.getByTestId(`user-name-${i+1}`)).toHaveText(allUsersInDB[i].name);
            await expect(page.getByTestId(`user-email-${i+1}`)).toHaveText(allUsersInDB[i].email.toLowerCase());
            await expect(page.getByTestId(`account-created-${i+1}`)).toHaveText(/ago$/);
            await expect(page.getByTestId(`user-phone-${i+1}`)).toHaveText(allUsersInDB[i].phone);
            await expect(page.getByTestId(`user-address-${i+1}`)).toHaveText(allUsersInDB[i].address);
            const formattedDate = new Date(allUsersInDB[i].DOB).toLocaleDateString("en-GB");
            await expect(page.getByTestId(`user-dob-${i+1}`)).toHaveText(formattedDate);
        }
    });
});