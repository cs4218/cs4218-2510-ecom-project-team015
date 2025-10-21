import { test, expect } from '@playwright/test';
import { describe } from 'node:test';

test.describe.configure({ mode: 'parallel' });

describe('UI tests for Forgot Password page', () => {
    const baseURL = 'http://localhost:3000';

    test.beforeEach(async ({ page }) => {
        await page.goto(`${baseURL}/forgot-password`);
    });

    test('should display all essential UI components in the forgot password form', async ({ page }) => {
        const formTitle = page.getByRole('heading', { name: /forgot password/i });
        const emailField = page.getByPlaceholder('Enter Your Email');
        const newPasswordField = page.getByPlaceholder('Enter New Password');
        const answerField = page.getByPlaceholder('Enter Your Favorite Sport');
        const resetButton = page.getByRole('button', { name: /reset password/i });

        await expect(formTitle).toBeVisible();
        await expect(emailField).toBeVisible();
        await expect(newPasswordField).toBeVisible();
        await expect(answerField).toBeVisible();
        await expect(resetButton).toBeVisible();
    });

    test('should have correct placeholder types for inputs', async ({ page }) => {
        const emailField = page.getByPlaceholder('Enter Your Email');
        const newPasswordField = page.getByPlaceholder('Enter New Password');
        const answerField = page.getByPlaceholder('Enter Your Favorite Sport');

        await expect(emailField).toHaveAttribute('type', 'email');
        await expect(newPasswordField).toHaveAttribute('type', 'password');
        await expect(answerField).toHaveAttribute('type', 'text');
    });

    test('should show validation errors when submitting with empty fields', async ({ page }) => {
        const emailField = page.getByPlaceholder('Enter Your Email');
        const resetButton = page.getByRole('button', { name: /reset password/i });

        await resetButton.click();

        const { validity, validationMessage } = await emailField.evaluate(el => {
            el.checkValidity();
            return {
                validity: {
                    valueMissing: el.validity.valueMissing,
                    typeMismatch: el.validity.typeMismatch,
                    valid: el.validity.valid,
                },
                validationMessage: el.validationMessage,
            };
        });

        expect(validity.valueMissing).toBe(true);
        expect(validity.valid).toBe(false);
        expect(validationMessage.toLowerCase()).toContain('fill');
    });

    test('should show validation errors for invalid email format', async ({ page }) => {
        const emailField = page.getByPlaceholder('Enter Your Email');
        const resetButton = page.getByRole('button', { name: /reset password/i });

        await emailField.fill('invalidEmail');
        await resetButton.click();

        const { validity, validationMessage } = await emailField.evaluate(el => {
            el.checkValidity();
            return {
                validity: {
                    valueMissing: el.validity.valueMissing,
                    typeMismatch: el.validity.typeMismatch,
                    valid: el.validity.valid,
                },
                validationMessage: el.validationMessage,
            };
        });

        expect(validity.typeMismatch).toBe(true);
        expect(validity.valid).toBe(false);
        expect(validationMessage).toMatch(/include an '@'/i);
    });

    test('should show error when email is not registered', async ({ page }) => {
        const emailField = page.getByPlaceholder('Enter Your Email');
        const newPasswordField = page.getByPlaceholder('Enter New Password');
        const answerField = page.getByPlaceholder('Enter Your Favorite Sport');
        const resetButton = page.getByRole('button', { name: /reset/i });

        await emailField.fill('randomuser@gmail.com');
        await newPasswordField.fill('random');
        await answerField.fill('random');
        await resetButton.click();

        await expect(page.getByText(/wrong email or answer/i)).toBeVisible();
        await expect(page).toHaveURL(/\/forgot-password$/);
    });

    test('should show error when answer is incorrect', async ({ page }) => {
        const emailField = page.getByPlaceholder('Enter Your Email');
        const newPasswordField = page.getByPlaceholder('Enter New Password');
        const answerField = page.getByPlaceholder('Enter Your Favorite Sport');
        const resetButton = page.getByRole('button', { name: /reset/i });

        await emailField.fill('cs4218@test.com');
        await newPasswordField.fill('newpassword123');
        await answerField.fill('wrong answer');
        await resetButton.click();

        await expect(page.getByText(/wrong email or answer/i)).toBeVisible();
        await expect(page).toHaveURL(/\/forgot-password$/);
    });

    test('should show error when the new password is weak', async ({ page }) => {
        const emailField = page.getByPlaceholder('Enter Your Email');
        const newPasswordField = page.getByPlaceholder('Enter New Password');
        const answerField = page.getByPlaceholder('Enter Your Favorite Sport');
        const resetButton = page.getByRole('button', { name: /reset password/i });

        await emailField.fill('cs4218@test.com');
        await newPasswordField.fill('123');
        await answerField.fill('password is cs4218@test.com');
        await resetButton.click();

        await expect(page.getByText(/new Password must be at least 6 characters long/i)).toBeVisible();
        await expect(page).toHaveURL(/\/forgot-password$/);
    });

    test('should successfully reset password with valid details', async ({ page }) => {
        const emailField = page.getByPlaceholder('Enter Your Email');
        const newPasswordField = page.getByPlaceholder('Enter New Password');
        const answerField = page.getByPlaceholder('Enter Your Favorite Sport');
        const resetButton = page.getByRole('button', { name: /reset password/i });

        await emailField.fill('cs4218@test.com');
        await newPasswordField.fill('cs4218@test.com');
        await answerField.fill('password is cs4218@test.com');
        await resetButton.click();

        await expect(page.getByText(/password reset successfully/i)).toBeVisible();
        await expect(page).toHaveURL(`${baseURL}/login`);
    });

});
