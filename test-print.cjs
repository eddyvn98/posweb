const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log("Navigating to sales page...");
    await page.goto('http://localhost:4011/app/sales');

    console.log("Waiting for products to load...");
    await page.waitForSelector('.card h3, .card div', { timeout: 10000 }).catch(() => {});

    console.log("Adding product to cart...");
    // Just click the first card
    const firstCard = await page.$('.card');
    if (firstCard) {
        await firstCard.click();
    }

    console.log("Waiting a bit...");
    await page.waitForTimeout(1000);

    console.log("Clicking Thanh toan...");
    await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Thanh toán') || b.textContent.includes('THANH TOÁN'));
        if (btn) btn.click();
    });

    console.log("Clicking Hoan tat...");
    await page.waitForTimeout(500);
    await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('HOÀN TẤT'));
        if (btn) btn.click();
    });

    console.log("Waiting for invoice modal...");
    await page.waitForTimeout(2000);

    console.log("Emulating print media...");
    await page.emulateMedia({ media: 'print' });

    console.log("Injecting printing-receipt class...");
    await page.evaluate(() => {
        document.body.classList.add('printing-receipt');
    });

    console.log("Taking screenshot of print layout...");
    await page.screenshot({ path: 'd:\\posweb-free\\print-proof.png', fullPage: true });

    console.log("Done! Saved to print-proof.png");
    await browser.close();
})();
