// Author: Ravi Kishore

import { test, expect } from '@playwright/test';
import { describe } from 'node:test';

test.describe.configure({ mode: 'parallel'});

describe('UI tests for login page', () => {
    const baseURL = 'http://localhost:3000';

    test.beforeEach(async({ page }) => {
        await page.goto(`${baseURL}/login`);
    });

    test('should display all essential UI components in the login form', async ({ page }) => {
        const formTitle = page.getByRole('heading', { name: /login form/i });
        const emailField = page.getByPlaceholder('Enter Your Email');
        const passwordField = page.getByPlaceholder('Enter your Password');
        const forgotPasswordButton = page.getByRole('button', { name: /forgot password/i});
        const loginButton = page.getByRole('button', { name: /login/i});

        await expect(formTitle).toBeVisible();
        await expect(emailField).toBeVisible();
        await expect(passwordField).toBeVisible();
        await expect(forgotPasswordButton).toBeVisible();
        await expect(loginButton).toBeVisible();
    });

    test('should have correct placeholder types for inputs', async ({ page }) => {
        const emailField = page.getByPlaceholder('Enter Your Email');
        const passwordField = page.getByPlaceholder('Enter your Password');

        await expect(emailField).toHaveAttribute('type', 'email');
        await expect(passwordField).toHaveAttribute('type', 'password');
    });

    test('should show validation errors when submitting form with empty fields', async ({ page }) => {
        const emailField = page.getByPlaceholder('Enter Your Email');
        const loginButton = page.getByRole('button', { name: /login/i });

        await loginButton.click();

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

    test('should show validation errors when you submit form with invalid email format', async ({ page }) => {
        const emailField = page.getByPlaceholder('Enter Your Email');
        const loginButton = page.getByRole('button', { name: /login/i });

        await emailField.fill('test');
        await loginButton.click();

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

    test('should verify the unregistered users cannot login', async ({ page }) => {
        const emailField = page.getByPlaceholder('Enter Your Email');
        const passwordField = page.getByPlaceholder('Enter your Password');
        const loginButton = page.getByRole('button', { name: /login/i});

        await emailField.fill('randomuser@gmail.com')
        await passwordField.fill('random');
        await loginButton.click();

        await expect(page.getByText(/Email is not registered/i)).toBeVisible();
        await expect(page).toHaveURL(/\/login$/);
    });

    test('should not allow users to login with invalid credentials', async ({ page }) => {
        const emailField = page.getByPlaceholder('Enter Your Email');
        const passwordField = page.getByPlaceholder('Enter your Password');
        const loginButton = page.getByRole('button', { name: /login/i});

        await emailField.fill('cs4218@test.com')
        await passwordField.fill('wrongpass');
        await loginButton.click();

        await expect(page.getByText(/Invalid Password/i)).toBeVisible();
        await expect(page).toHaveURL(/\/login$/);
    });

    test('should allow users with valid credentials to login successfully', async ({ page }) => {
        const emailField = page.getByPlaceholder('Enter Your Email');
        const passwordField = page.getByPlaceholder('Enter your Password');
        const loginButton = page.getByRole('button', { name: /login/i});

        await emailField.fill('cs4218@test.com')
        await passwordField.fill('cs4218@test.com');
        await loginButton.click();

        await expect(page.getByText(/Login Successful/i)).toBeVisible();
        await expect(page).toHaveURL(`${baseURL}/`);
        await expect(page.getByText(/normal user/i)).toBeVisible();
    });

    test('should allow users to navigate to forgot password page', async ({ page }) => {
        const forgotPasswordButton = page.getByRole('button', { name: /forgot password/i});

        await forgotPasswordButton.click();

        await expect(page).toHaveURL(/\/forgot-password$/);
    });

});
