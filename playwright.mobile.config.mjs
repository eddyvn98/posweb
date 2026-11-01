import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests',
  testMatch: '**/mobilePos.mobile.spec.js',
  timeout: 60000, expect: { timeout: 10000 }, retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-mobile-report' }]],
  use: { baseURL: 'http://127.0.0.1:5189', browserName: 'chromium',
    viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true,
    screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5189 --strictPort',
    url: 'http://127.0.0.1:5189', timeout: 120000, reuseExistingServer: false,
    env: { VITE_API_URL: '/api', VITE_ENABLE_TEST_CONSOLE: 'false' } }
})
