import { test, expect } from '@playwright/test';
import { describe } from 'node:test';

test.describe.configure({ mode: 'parallel' });

describe('UI tests for Register Page', () => {
    const baseURL = 'http://localhost:3000';

    test.beforeEach(async ({ page }) => {
        await page.goto(`${baseURL}/register`);
    });

    test('should display all essential UI components in the register form', async ({ page }) => {
        const formTitle = page.getByRole('heading', { name: /register form/i });
        const nameField = page.getByPlaceholder('Enter Your Name');
        const emailField = page.getByPlaceholder('Enter Your Email');
        const passwordField = page.getByPlaceholder('Enter Your Password');
        const phoneField = page.getByPlaceholder('Enter Your Phone Number(SG)');
        const addressField = page.getByPlaceholder('Enter Your Address');
        const dobField = page.getByPlaceholder('Enter your DOB');
        const answerField = page.getByPlaceholder('What is Your Favorite sports');
        const registerButton = page.getByRole('button', { name: /register/i });

        await expect(formTitle).toBeVisible();
        await expect(nameField).toBeVisible();
        await expect(emailField).toBeVisible();
        await expect(passwordField).toBeVisible();
        await expect(phoneField).toBeVisible();
        await expect(addressField).toBeVisible();
        await expect(dobField).toBeVisible();
        await expect(answerField).toBeVisible();
        await expect(registerButton).toBeVisible();
    });

    test('should have correct input types for fields', async ({ page }) => {
        const nameField = page.getByPlaceholder('Enter Your Name');
        const emailField = page.getByPlaceholder('Enter Your Email');
        const passwordField = page.getByPlaceholder('Enter Your Password');
        const phoneField = page.getByPlaceholder('Enter Your Phone Number(SG)');
        const addressField = page.getByPlaceholder('Enter Your Address');
        const dobField = page.getByPlaceholder('Enter your DOB');
        const answerField = page.getByPlaceholder('What is Your Favorite sports');

        await expect(nameField).toHaveAttribute('type', 'text');
        await expect(emailField).toHaveAttribute('type', 'email');
        await expect(passwordField).toHaveAttribute('type', 'password');
        await expect(phoneField).toHaveAttribute('type', 'tel');
        await expect(addressField).toHaveAttribute('type', 'text');
        await expect(dobField).toHaveAttribute('type', 'Date');
        await expect(answerField).toHaveAttribute('type', 'text');
    });

    test('should allow all fields to be filled with user input', async ({ page }) => {
        const nameField = page.getByPlaceholder('Enter Your Name');
        const emailField = page.getByPlaceholder('Enter Your Email');
        const passwordField = page.getByPlaceholder('Enter Your Password');
        const phoneField = page.getByPlaceholder('Enter Your Phone Number(SG)');
        const addressField = page.getByPlaceholder('Enter Your Address');
        const dobField = page.getByPlaceholder('Enter Your DOB');
        const answerField = page.getByPlaceholder('What is Your Favorite sports');

        await nameField.fill('Test User');
        await emailField.fill('testuser@example.com');
        await passwordField.fill('StrongPass123!');
        await phoneField.fill('91234567');
        await addressField.fill('123 Orchard Road, Singapore');
        await dobField.fill('2000-01-01');
        await answerField.fill('Football');

        await expect(nameField).toHaveValue('Test User');
        await expect(emailField).toHaveValue('testuser@example.com');
        await expect(passwordField).toHaveValue('StrongPass123!');
        await expect(phoneField).toHaveValue('91234567');
        await expect(addressField).toHaveValue('123 Orchard Road, Singapore');
        await expect(dobField).toHaveValue('2000-01-01');
        await expect(answerField).toHaveValue('Football');
    });


    test('should show validation errors when submitting empty form', async ({ page }) => {
        const nameField = page.getByPlaceholder('Enter Your Name');
        const registerButton = page.getByRole('button', { name: /register/i });

        await registerButton.click();

        const { validity, validationMessage } = await nameField.evaluate(el => {
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

    test('should show validation error for invalid email format', async ({ page }) => {
        const nameField = page.getByPlaceholder('Enter Your Name');
        const emailField = page.getByPlaceholder('Enter Your Email');
        const passwordField = page.getByPlaceholder('Enter Your Password');
        const phoneField = page.getByPlaceholder('Enter Your Phone Number(SG)');
        const addressField = page.getByPlaceholder('Enter Your Address');
        const dobField = page.getByPlaceholder('Enter your DOB');
        const answerField = page.getByPlaceholder('What is Your Favorite sports');
        const registerButton = page.getByRole('button', { name: /register/i });

        await nameField.fill('Normal User');
        await emailField.fill('invalidemail');
        await passwordField.fill('testpassword');
        await phoneField.fill('98765432');
        await addressField.fill('Singapore');
        await dobField.fill('2000-01-01'); 
        await answerField.fill('football');
        await registerButton.click();       

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

    test('show show error when the email is not valid', async ({ page }) => {
        const nameField = page.getByPlaceholder('Enter Your Name');
        const emailField = page.getByPlaceholder('Enter Your Email');
        const passwordField = page.getByPlaceholder('Enter Your Password');
        const phoneField = page.getByPlaceholder('Enter Your Phone Number(SG)');
        const addressField = page.getByPlaceholder('Enter Your Address');
        const dobField = page.getByPlaceholder('Enter your DOB');
        const answerField = page.getByPlaceholder('What is Your Favorite sports');
        const registerButton = page.getByRole('button', { name: /register/i });

        await nameField.fill('New User');
        await emailField.fill('newuser@newuser');
        await passwordField.fill('password123');
        await phoneField.fill('91234567');
        await addressField.fill('10 Anson Road, Singapore');
        await dobField.fill('2000-01-01');
        await answerField.fill('football');
        await registerButton.click();

        await expect(page.getByText(/invalid email/i)).toBeVisible();
        await expect(page).toHaveURL(/\/register$/);
    });

    test('should show error when the password is weak', async ({ page }) => {
        const nameField = page.getByPlaceholder('Enter Your Name');
        const emailField = page.getByPlaceholder('Enter Your Email');
        const passwordField = page.getByPlaceholder('Enter Your Password');
        const phoneField = page.getByPlaceholder('Enter Your Phone Number(SG)');
        const addressField = page.getByPlaceholder('Enter Your Address');
        const dobField = page.getByPlaceholder('Enter your DOB');
        const answerField = page.getByPlaceholder('What is Your Favorite sports');
        const registerButton = page.getByRole('button', { name: /register/i });

        const randomEmail = `testuser${Date.now()}@gmail.com`;

        await nameField.fill('New User');
        await emailField.fill(randomEmail);
        await passwordField.fill('weak');
        await phoneField.fill('91234567');
        await addressField.fill('10 Anson Road, Singapore');
        await dobField.fill('2000-01-01');
        await answerField.fill('football');
        await registerButton.click();

        await expect(page.getByText(/password must be at least 6 characters long/i)).toBeVisible();
        await expect(page).toHaveURL(/\/register$/);
    });

    test('should show error when the phone number is invalid ', async ({ page }) => {
        const nameField = page.getByPlaceholder('Enter Your Name');
        const emailField = page.getByPlaceholder('Enter Your Email');
        const passwordField = page.getByPlaceholder('Enter Your Password');
        const phoneField = page.getByPlaceholder('Enter Your Phone Number(SG)');
        const addressField = page.getByPlaceholder('Enter Your Address');
        const dobField = page.getByPlaceholder('Enter your DOB');
        const answerField = page.getByPlaceholder('What is Your Favorite sports');
        const registerButton = page.getByRole('button', { name: /register/i });

        const randomEmail = `testuser${Date.now()}@gmail.com`;

        await nameField.fill('New User');
        await emailField.fill(randomEmail);
        await passwordField.fill('password123');
        await phoneField.fill('abcdefgh');
        await addressField.fill('10 Anson Road, Singapore');
        await dobField.fill('2000-01-01');
        await answerField.fill('football');
        await registerButton.click();

        await expect(page.getByText(/Invalid phone number: Must be a valid Singapore phone number/i)).toBeVisible();
        await expect(page).toHaveURL(/\/register$/);
    });

    test('should show error when the dob is invalid ', async ({ page }) => {
        const nameField = page.getByPlaceholder('Enter Your Name');
        const emailField = page.getByPlaceholder('Enter Your Email');
        const passwordField = page.getByPlaceholder('Enter Your Password');
        const phoneField = page.getByPlaceholder('Enter Your Phone Number(SG)');
        const addressField = page.getByPlaceholder('Enter Your Address');
        const dobField = page.getByPlaceholder('Enter your DOB');
        const answerField = page.getByPlaceholder('What is Your Favorite sports');
        const registerButton = page.getByRole('button', { name: /register/i });

        const randomEmail = `testuser${Date.now()}@gmail.com`;

        await nameField.fill('New User');
        await emailField.fill(randomEmail);
        await passwordField.fill('password123');
        await phoneField.fill('91234567');
        await addressField.fill('10 Anson Road, Singapore');
        await dobField.fill('2030-01-01');
        await answerField.fill('football');
        await registerButton.click();

        await expect(page.getByText(/DOB must be between 1 day and 120 years old/i)).toBeVisible();
        await expect(page).toHaveURL(/\/register$/);
    });

    test('should show error when email is already registered', async ({ page }) => {
        const nameField = page.getByPlaceholder('Enter Your Name');
        const emailField = page.getByPlaceholder('Enter Your Email');
        const passwordField = page.getByPlaceholder('Enter Your Password');
        const phoneField = page.getByPlaceholder('Enter Your Phone Number(SG)');
        const addressField = page.getByPlaceholder('Enter Your Address');
        const dobField = page.getByPlaceholder('Enter your DOB');
        const answerField = page.getByPlaceholder('What is Your Favorite sports');
        const registerButton = page.getByRole('button', { name: /register/i });

        await nameField.fill('Existing User');
        await emailField.fill('cs4218@test.com');
        await passwordField.fill('testpassword');
        await phoneField.fill('98765432');
        await addressField.fill('Singapore');
        await dobField.fill('2000-01-01'); 
        await answerField.fill('football');
        await registerButton.click();

        await expect(page.getByText(/you have already registered with this email, please login/i)).toBeVisible();
        await expect(page).toHaveURL(/\/register$/);
    });

    test('should successfully register a new user with valid details', async ({ page }) => {
        const nameField = page.getByPlaceholder('Enter Your Name');
        const emailField = page.getByPlaceholder('Enter Your Email');
        const passwordField = page.getByPlaceholder('Enter Your Password');
        const phoneField = page.getByPlaceholder('Enter Your Phone Number(SG)');
        const addressField = page.getByPlaceholder('Enter Your Address');
        const dobField = page.getByPlaceholder('Enter your DOB');
        const answerField = page.getByPlaceholder('What is Your Favorite sports');
        const registerButton = page.getByRole('button', { name: /register/i });

        const randomEmail = `testuser${Date.now()}@gmail.com`;

        await nameField.fill('New User');
        await emailField.fill(randomEmail);
        await passwordField.fill('password123');
        await phoneField.fill('91234567');
        await addressField.fill('10 Anson Road, Singapore');
        await dobField.fill('2000-01-01');
        await answerField.fill('football');
        await registerButton.click();

        await expect(page.getByText(/user registered successfully/i)).toBeVisible();
        await expect(page).toHaveURL(`${baseURL}/login`);
    });
});
