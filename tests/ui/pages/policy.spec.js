import { test, expect } from '@playwright/test';

test.describe('UI Tests for Contact Us Page', () => {
    const baseURL = 'http://localhost:3000';

    test.beforeEach(async ({ page }) => {
        await page.goto(`${baseURL}/policy`);
    });

    test('should display the correct page title', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Privacy Policy/i })).toBeVisible();
    });

    test('should display the effective date for the policies', async ({ page }) => {
        const effectiveDate =  page.getByRole('heading', { name: 'Effective Date: 4 October' });
        await expect(effectiveDate).toBeVisible();
    });

    test('should display the policy info section', async ({ page }) => {
        const policyInfo = page.getByText(/We value your privacy. This Privacy Policy explains how we collect, use, and protect your personal information when you use our e-commerce application./i);
        await expect(policyInfo).toBeVisible();
    });

    test('should display the policy headings', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Information We Collect' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'How We Use Your Information' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Sharing of Information' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Data Security' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Your Rights' })).toBeVisible();
    });

    test('should display the policy explanation', async ({ page}) => {
        await expect(page.getByText('We may collect personal details like name, email, phone number, address, date of birth, and payment information.')).toBeVisible();
        await expect(page.getByText('We use your information to process orders, provide customer support, improve services, send updates, and ensure secure payments.')).toBeVisible();
        await expect(page.getByText('We do not sell your data. We only share it with service providers (payment, shipping) or when legally required.')).toBeVisible();
        await expect(page.getByText('We use reasonable measures to protect your data but cannot guarantee complete security.')).toBeVisible();
        await expect(page.getByText('You can access, update, or delete your information, and request a copy of your data.')).toBeVisible();
    });
});
