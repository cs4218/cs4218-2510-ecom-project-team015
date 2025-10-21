import { test, expect } from '@playwright/test';

test.describe('UI Tests for Contact Us Page', () => {
    const baseURL = 'http://localhost:3000';

    test.beforeEach(async ({ page }) => {
        await page.goto(`${baseURL}/contact`);
    });

    test('should display the correct page title', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Contact Us/i })).toBeVisible();
    });

    test('should display the customer support image', async ({ page }) => {
        const supportImage =  page.getByRole('img', { name: 'Contact Us Image' });
        await expect(supportImage).toBeVisible();
    });

    test('should display the contact info section', async ({ page }) => {
        const contactInfo = page.getByText(/For any query or info about product, feel free to call anytime. We are available 24X7./i);
        await expect(contactInfo).toBeVisible();
    });

    test('should contain correct contact details', async ({ page }) => {
        const email = page.getByText(/help@ecommerceapp\.com/i);
        const phone = page.getByText(/012-3456789/i);
        const tollFree = page.getByText(/1800-0000-0000 \(Toll Free\)/i);

        await expect(email).toBeVisible();
        await expect(phone).toBeVisible();
        await expect(tollFree).toBeVisible();
    });
});
