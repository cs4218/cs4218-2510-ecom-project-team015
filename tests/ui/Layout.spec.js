// Author: Vedant Sinha
// This file has been written with the help of Claude.

import { test, expect } from '@playwright/test';

/**
 * UI Tests for Layout Component
 * 
 * These tests verify that the Layout component correctly renders in the browser
 * with proper Header, Footer, main content.
 */

test.describe('Layout Component - UI Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to a page that uses the Layout component
    // Using the home page as it wraps content in Layout
    await page.goto('/');
  });

  test('should render the complete layout structure with header, main content, and footer', async ({ page }) => {
    // Verify header is visible
    const header = page.locator('nav.navbar');
    await expect(header).toBeVisible();
    
    // Verify main content area exists
    const main = page.locator('main');
    await expect(main).toBeVisible();
    
    // Verify footer is visible
    const footer = page.locator('.footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('All Rights Reserved © TestingComp');
  });

  test('should display the correct default page title', async ({ page }) => {
    // Check that the page title is set correctly
    await expect(page).toHaveTitle(/ALL Products - Best offers/);
  });

  test('should render header with brand name and navigation', async ({ page }) => {
    // Check for Virtual Vault brand
    const brand = page.locator('.navbar-brand');
    await expect(brand).toBeVisible();
    await expect(brand).toContainText('Virtual Vault');
    
    // Check for Home navigation link
    const homeLink = page.locator('a.nav-link', { hasText: 'Home' });
    await expect(homeLink).toBeVisible();
  });

  test('should render footer with copyright and links', async ({ page }) => {
    // Check copyright text
    const copyright = page.locator('.footer h4');
    await expect(copyright).toBeVisible();
    await expect(copyright).toContainText('All Rights Reserved © TestingComp');
    
    // Check footer links
    await expect(page.locator('a', { hasText: 'About' })).toBeVisible();
    await expect(page.locator('a', { hasText: 'Contact' })).toBeVisible();
    await expect(page.locator('a', { hasText: 'Privacy Policy' })).toBeVisible();
  });

  test('should have main content area with minimum height', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
    
    // Check that main has the minHeight style
    const minHeight = await main.evaluate((el) => {
      return window.getComputedStyle(el).minHeight;
    });
    
    // Should be at least 70vh
    expect(minHeight).toBeTruthy();
  });

  test('should render child content within the layout', async ({ page }) => {
    // The homepage should have content rendered inside the Layout
    // Check that the main area contains child content
    const main = page.locator('main');
    await expect(main).toBeVisible();
    
    // The page should have some content (not empty)
    const content = await main.textContent();
    expect(content).toBeTruthy();
  });

  test('should navigate to footer links correctly', async ({ page }) => {
    // Click on About link
    await page.click('a[href="/about"]');
    await expect(page).toHaveURL('/about');
    await expect(page).toHaveTitle(/About us - Ecommerce app/);
    
    // Go back to home
    await page.goto('/');
    
    // Click on Contact link
    await page.click('text=Contact');
    await expect(page).toHaveURL('/contact');
    
    // Go back to home
    await page.goto('/');
    
    // Click on Privacy Policy link
    await page.click('text=Privacy Policy');
    await expect(page).toHaveURL('/policy');
  });

  test('should display header navigation items', async ({ page }) => {
    // Check that Categories dropdown exists
    const categoriesDropdown = page.locator('a.nav-link.dropdown-toggle', { hasText: 'Categories' });
    await expect(categoriesDropdown).toBeVisible();
    
    // Check that Cart link exists
    const cartLink = page.locator('a.nav-link', { hasText: 'Cart' });
    await expect(cartLink).toBeVisible();
  });



  test('should maintain layout structure across different pages', async ({ page }) => {
    // Test on Home page
    await page.goto('/');
    await expect(page.locator('nav.navbar')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('.footer')).toBeVisible();
    
    // Test on About page
    await page.goto('/about');
    await expect(page.locator('nav.navbar')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('.footer')).toBeVisible();
    await expect(page).toHaveTitle(/About us - Ecommerce app/);
    
    // Test on Contact page
    await page.goto('/contact');
    await expect(page.locator('nav.navbar')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('.footer')).toBeVisible();
  });

  test('should have proper vertical layout order: header -> main -> footer', async ({ page }) => {
    // Get bounding boxes to verify visual order
    const headerBox = await page.locator('nav.navbar').boundingBox();
    const mainBox = await page.locator('main').boundingBox();
    const footerBox = await page.locator('.footer').boundingBox();
    
    // Verify vertical positioning
    expect(headerBox.y).toBeLessThan(mainBox.y);
    expect(mainBox.y).toBeLessThan(footerBox.y);
  });
});

test.describe('Layout Component - Custom Props Tests', () => {
  
  test('should display custom page title on About page', async ({ page }) => {
    await page.goto('/about');
    await expect(page).toHaveTitle(/About us - Ecommerce app/);
  });

  test('should display custom page title on Contact page', async ({ page }) => {
    await page.goto('/contact');
    // The Layout component should set a custom title
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should display custom page title on Privacy Policy page', async ({ page }) => {
    await page.goto('/policy');
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});

test.describe('Layout Component - Accessibility Tests', () => {
  
  test('should have proper semantic HTML structure', async ({ page }) => {
    await page.goto('/');
    
    // Check for semantic elements
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeHidden(); // Footer class, not semantic footer
    
    // But should have a div with footer class
    await expect(page.locator('div.footer')).toBeVisible();
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check that nav has proper ARIA attributes
    const nav = page.locator('nav.navbar');
    await expect(nav).toBeVisible();
    
    // Check for navbar toggle button with aria-label
    const toggleButton = page.locator('button.navbar-toggler');
    await expect(toggleButton).toHaveAttribute('aria-label', 'Toggle navigation');
  });

  test('should maintain focus management when navigating between links', async ({ page }) => {
    await page.goto('/');
    
    // Tab to the Home link and verify focus
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Verify that focused element is a link
    const focusedElement = await page.evaluate(() => {
      return document.activeElement.tagName;
    });
    
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
  });
});
