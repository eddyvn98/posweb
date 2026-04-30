import { test, expect } from '@playwright/test';

test.describe('Sales', () => {
  let timestamp;
  let testEmail;
  let testShop;

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER: ${msg.type()}: ${msg.text()}`));
    
    // Mock AudioContext to prevent hangs in headless mode
    await page.addInitScript(() => {
      window.AudioContext = window.webkitAudioContext = function() {
        return {
          createOscillator: () => ({ connect: () => {}, start: () => {}, stop: () => {}, frequency: { setValueAtTime: () => {} } }),
          createGain: () => ({ connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }),
          destination: {},
          currentTime: 0
        };
      };
    });

    timestamp = Date.now();
    testEmail = `test_sales_${timestamp}@example.com`;
    testShop = `Test Shop Sales ${timestamp}`;

    // Register
    await page.goto('/login?mode=register');
    await page.fill('input[placeholder="Cửa hàng của tôi"]', testShop);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'Password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/app\/sales/);
  });

  test('Complete Sales Flow', async ({ page }) => {
    // 1. Create Product
    await page.goto('/app/products');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: '+ Tạo mới' }).click();
    
    const productName = `Sale Product ${timestamp}`;
    await page.fill('input[placeholder="Ví dụ: Bia Heineken..."]', productName);
    // Fill price
    await page.locator('div:has(> label:has-text("Giá bán")) input').fill('100000');
    // Fill stock
    await page.locator('div:has(> label:has-text("Tồn kho ban đầu")) input').fill('20');
    await page.click('button:has-text("Lưu")');
    
    // Wait for modal to be hidden and sync to complete
    await expect(page.locator('text="Thêm sản phẩm mới"')).toBeHidden();
    await page.waitForTimeout(1000);
    
    // 2. Go to Sales and sell it
    await page.goto('/app/sales');
    await page.fill('input[placeholder="Mã/Tên SP..."]', productName);
    // Wait for search results and click it
    const searchResult = page.getByText(productName.toUpperCase());
    await searchResult.waitFor({ state: 'visible' });
    await searchResult.click();
    
    // Final click to checkout
    await page.click('button:has-text("THANH TOÁN")', { force: true, timeout: 5000 });
    
    // In Checkout Modal
    await page.click('button:has-text("HOÀN TẤT")', { force: true, timeout: 5000 });
    
    // Should show Invoice Modal
    await expect(page.getByText('PHIẾU THANH TOÁN')).toBeVisible({ timeout: 10000 });
    
    // Close invoice
    await page.click('button:has-text("Đóng")');
    
    // Check stock again
    await page.goto('/app/products');
    await expect(page.locator('.card', { hasText: productName.toUpperCase() })).toContainText('KHO: 19');
  });
});
