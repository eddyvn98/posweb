import { test, expect } from '@playwright/test';

const timestamp = Date.now();
const testEmail = `test_${timestamp}@example.com`;
const testPassword = 'Password123';
const testShop = `Test Shop ${timestamp}`;

test.describe('Authentication', () => {
  test('User Registration', async ({ page }) => {
    await page.goto('/login?mode=register');
    
    await page.fill('input[placeholder="Cửa hàng của tôi"]', testShop);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    await page.click('button[type="submit"]');
    
    // Should redirect to sales page
    await expect(page).toHaveURL(/\/app\/sales/);
    await expect(page.locator('h1')).toContainText('OpenPOS');
  });

  test('User Login', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    await page.click('button[type="submit"]');
    
    // Should redirect to sales page
    await expect(page).toHaveURL(/\/app\/sales/);
  });
});
