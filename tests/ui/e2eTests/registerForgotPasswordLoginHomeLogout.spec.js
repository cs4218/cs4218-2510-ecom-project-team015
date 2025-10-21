import { test, expect } from '@playwright/test';
import { describe } from 'node:test';

test.describe.configure({ mode: 'parallel' });

describe('End to End UI test flow: Homepage -> Register -> Forgot Password -> Login -> Homepage -> Logout', () => {
    const baseURL = 'http://localhost:3000';

    test.beforeEach(async ({ page }) => {
        await page.goto(`${baseURL}`);
    });

    test('should allow new user to register, change password, login and logout on the application', async ({ page }) => {
        const registerButtonHeader = page.getByRole('link', { name: 'Register' });

        // Go to register page and check the url
        await registerButtonHeader.click();
        await expect(page).toHaveURL(/\/register$/);

        // Fill in the register form with valid fields and register successfully
        const nameField = page.getByPlaceholder('Enter Your Name');
        const emailField = page.getByPlaceholder('Enter Your Email');
        const passwordField = page.getByPlaceholder('Enter Your Password');
        const phoneField = page.getByPlaceholder('Enter Your Phone Number(SG)');
        const addressField = page.getByPlaceholder('Enter Your Address');
        const dobField = page.getByPlaceholder('Enter your DOB');
        const answerField = page.getByPlaceholder('What is Your Favorite sports');
        const registerButton = page.getByRole('button', { name: /register/i });

        await nameField.fill('New User');
        await emailField.fill('newuser@gmail.com');
        await passwordField.fill('password');
        await phoneField.fill('91234567');
        await addressField.fill('10 Anson Road, Singapore');
        await dobField.fill('2000-01-01');
        await answerField.fill('football');
        await registerButton.click();

        await expect(page.getByText(/user registered successfully/i)).toBeVisible();
        await expect(page).toHaveURL(`${baseURL}/login`);

        // Navigate to forgot password page
        const forgotPasswordButton = page.getByRole('button', { name: /forgot password/i });
        await forgotPasswordButton.click();
        await expect(page).toHaveURL(/\/forgot-password$/)

        // Fill in the forgot password page fields and reset the password
        const emailFieldFP = page.getByPlaceholder('Enter Your Email');
        const newPasswordFieldFP = page.getByPlaceholder('Enter New Password');
        const answerFieldFP = page.getByPlaceholder('Enter Your Favorite Sport');
        const resetButton = page.getByRole('button', { name: /reset password/i });

        await emailFieldFP.fill('newuser@gmail.com');
        await newPasswordFieldFP.fill('newpassword');
        await answerFieldFP.fill('football');
        await resetButton.click();

        await expect(page.getByText(/password reset successfully/i)).toBeVisible();
        await expect(page).toHaveURL(`${baseURL}/login`);

        // Fill in the login form with email and new password and login
        const emailFieldLP = page.getByPlaceholder('Enter Your Email');
        const passwordFieldLP = page.getByPlaceholder('Enter your Password');
        const loginButton = page.getByRole('button', { name: /login/i});

        await emailFieldLP.fill('newuser@gmail.com')
        await passwordFieldLP.fill('newpassword');
        await loginButton.click();

        await expect(page.getByText(/Login Successful/i)).toBeVisible();
        await expect(page).toHaveURL(`${baseURL}/`);

        // Check that you are in home page and user name is displayed
        await expect(page.getByText(/normal user/i)).toBeVisible();

        // Click on the user name and logout

    });
});