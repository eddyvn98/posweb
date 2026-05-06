import { test, expect } from '@playwright/test';

test.describe('Imports Sheet Flow', () => {
  test('navigate, help, upload file and preview', async ({ page }) => {
    await page.goto('/app/imports');
    if (page.url().includes('/login')) {
      const guestBtn = page.getByRole('button', { name: /dùng thử|khách|guest/i });
      if (await guestBtn.count()) {
        await guestBtn.first().click();
      }
      await page.goto('/app/imports');
    }
    await page.getByRole('button', { name: 'Nhập file/sheet' }).click();
    await page.waitForURL(/\/app\/imports-sheet/);

    await page.getByRole('button', { name: 'Thông tin' }).click();
    await expect(page.getByText('Hướng dẫn nhanh')).toBeVisible();
    await page.getByRole('button', { name: 'Đã hiểu' }).click();

    const csv = [
      '8938505962022,Bim bim Oishi,5,75000',
      '8931234567890,Nuoc ngot lon,12,144000',
    ].join('\n');

    await page.locator('input[type="file"]').setInputFiles({
      name: 'import.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csv, 'utf8'),
    });

    await expect(page.getByText('Dòng hợp lệ: 2')).toBeVisible();
    await expect(page.getByText('Tổng SL: 17')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nhập vào hệ thống' })).toBeEnabled();

    await page.getByRole('button', { name: '← Quay lại' }).click();
    await page.waitForURL(/\/app\/imports/);
  });
});
