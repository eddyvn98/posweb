import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Inventory', () => {
  let timestamp;
  let testEmail;
  let testShop;

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER: ${msg.type()}: ${msg.text()}`));
    timestamp = Date.now();
    testEmail = `test_inv_${timestamp}@example.com`;
    testShop = `Test Shop Inv ${timestamp}`;

    console.log(`Registering user: ${testEmail}`);
    // Register
    await page.goto('/login?mode=register');
    await page.fill('input[placeholder="Cửa hàng của tôi"]', testShop);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'Password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/app\/sales/, { timeout: 10000 });
    console.log('Redirected to sales');
  });

  test('Create Product and Import', async ({ page }) => {
    // 1. Create Product
    await page.goto('/app/products');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: '+ Tạo mới' }).click();
    
    const productName = `Product ${timestamp}`;
    await page.fill('input[placeholder="Ví dụ: Bia Heineken..."]', productName);
    // Fill price
    await page.locator('div:has(> label:has-text("Giá bán")) input').fill('100000');
    // Fill stock
    await page.locator('div:has(> label:has-text("Tồn kho ban đầu")) input').fill('10');
    await page.click('button:has-text("Lưu")');
    
    await expect(page.locator('.card')).toContainText(productName);

    // 2. Import (Nhập kho)
    await page.goto('/app/imports');
    await page.click('button:has-text("Ghi nhận")');
    
    // Select supplier if any, or just fill name
    await page.fill('input[name="supplier_name"]', 'Supplier Test');
    
    // Add product to import
    await page.locator('section:has-text("B. Danh sách sản phẩm") button:has-text("+")').click();
    await page.fill('input[placeholder="Gõ tên hoặc mã vạch sản phẩm"]', productName);
    await page.click(`button:has-text("${productName}")`);
    
    // Set quantity
    await page.locator('div:has(> label:has-text("Số lượng")) input').fill('5');
    await page.locator('div:has(> label:has-text("Đơn giá")) input').fill('80000');
    
    // Confirm import
    await page.click('button:has-text("Xác nhận")');
    
    // Verify in history or products
    await page.goto('/app/products');
    await expect(page.locator('.card', { hasText: productName.toUpperCase() })).toContainText('KHO: 15');
  });
});
