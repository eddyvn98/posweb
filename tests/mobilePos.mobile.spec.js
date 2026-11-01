import { test, expect } from '@playwright/test'

const A = { id: 'qa-a', shop_id: 'qa-shop-a', barcode: 'QA-A', name: 'Notebook A', price: 15000, stock_quantity: 10, unit: 'Cái', is_active: true }
const B = { id: 'qa-b', shop_id: 'qa-shop-a', barcode: 'QA-B', name: 'Pen B', price: 7000, stock_quantity: 10, unit: 'Cái', is_active: true }
const C = { id: 'qa-c', shop_id: 'qa-shop-a', barcode: 'QA-C', name: 'Fallback C', price: 13000, stock_quantity: 9, unit: 'Cái', is_active: true }
const cart = [{ ...A, product_id: 'qa-a', quantity: 1 }]

async function setup(page, { withCart = false } = {}) {
  const posted = { sales: [], products: [] }
  await page.addInitScript((withCart) => {
    if (localStorage.getItem('__qa_ready')) return
    localStorage.setItem('__qa_ready', 'true')
    localStorage.setItem('pos_token', 'qa-token')
    localStorage.setItem('pos_user', JSON.stringify({ id: 'user-qa', shop_id: 'qa-shop-a' }))
    localStorage.setItem('pos_shop', JSON.stringify({ id: 'qa-shop-a', name: 'QA Shop' }))
    if (withCart) localStorage.setItem('pos_cart:qa-shop-a', JSON.stringify([{
      id: 'qa-a', product_id: 'qa-a', shop_id: 'qa-shop-a',
      barcode: 'QA-A', name: 'Notebook A', price: 15000, stock_quantity: 10, quantity: 1
    }]))
  }, withCart)
  await page.route('**/api/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    const respond = body => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    if (url.pathname === '/api/products' && request.method() === 'GET') {
      return respond(url.searchParams.has('search') ? [C] : [A, B])
    }
    if (url.pathname === '/api/units' || url.pathname === '/api/categories') return respond([])
    if (url.pathname === '/api/sales' && request.method() === 'POST') {
      posted.sales.push(request.postDataJSON())
      return respond({ success: true, id: request.postDataJSON().id })
    }
    if (url.pathname === '/api/products/upsert' && request.method() === 'POST') {
      posted.products.push(request.postDataJSON())
      return respond({ success: true })
    }
    return respond([])
  })
  return posted
}

async function dbRows(page, store) {
  return page.evaluate(store => new Promise((resolve, reject) => {
    const req = indexedDB.open('pos_db')
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(store)) { db.close(); resolve([]); return }
      const tx = db.transaction(store, 'readonly')
      const read = tx.objectStore(store).getAll()
      read.onsuccess = () => { resolve(read.result); db.close() }
      read.onerror = () => { reject(read.error); db.close() }
    }
  }), store)
}

test.describe('POS mobile regression (mocked API, no real customer data)', () => {
  test.use({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true })
  test('cart is persistent and belongs only to its shop', async ({ page }) => {
    await setup(page, { withCart: true })
    await page.goto('/sales')
    await expect(page.locator('#cart-item-qa-a')).toBeVisible()
    await page.reload()
    await expect(page.locator('#cart-item-qa-a')).toBeVisible()
    await page.evaluate(() => {
      localStorage.setItem('pos_shop', JSON.stringify({ id: 'qa-shop-b', name: 'Other shop' }))
      localStorage.setItem('pos_user', JSON.stringify({ id: 'qa-b', shop_id: 'qa-shop-b' }))
    })
    await page.reload()
    await expect(page.locator('#cart-item-qa-a')).toHaveCount(0)
  })

  test('online sale retains synced status and stable UUID', async ({ page }) => {
    const posted = await setup(page, { withCart: true })
    await page.goto('/sales')
    await page.getByRole('button', { name: /THANH TOÁN/i }).click()
    await page.getByRole('button', { name: /Hoàn tất thanh toán/i }).click()
    await expect.poll(() => posted.sales.length).toBe(1)
    await expect.poll(async () => (await dbRows(page, 'sales_queue')).length).toBe(1)
    const queued = await dbRows(page, 'sales_queue')
    expect(queued[0].synced).toBe(1)
    expect(queued[0].id).toBe(posted.sales[0].id)
  })

  test('underpayment is blocked', async ({ page }) => {
    const posted = await setup(page, { withCart: true })
    page.on('dialog', dialog => dialog.accept())
    await page.goto('/sales')
    await page.getByRole('button', { name: /THANH TOÁN/i }).click()
    await page.locator('form input[inputmode="numeric"]').fill('5')
    await page.getByRole('button', { name: /Hoàn tất thanh toán/i }).click()
    expect(posted.sales.length).toBe(0)
  })

  test('offline products remain visible on failed API and shop isolation', async ({ page }) => {
    await setup(page)
    await page.goto('/products')
    await expect(page.getByText('Notebook A').first()).toBeVisible()
    await expect.poll(async () => (await dbRows(page, 'products')).length).toBeGreaterThanOrEqual(2)
    await page.route('**/api/products*', route => route.abort('failed'))
    await page.reload()
    await expect(page.getByText('Notebook A').first()).toBeVisible()
    await page.evaluate(() => {
      localStorage.setItem('pos_shop', JSON.stringify({ id: 'qa-shop-b', name: 'Other shop' }))
      localStorage.setItem('pos_user', JSON.stringify({ id: 'qa-b', shop_id: 'qa-shop-b' }))
    })
    await page.reload()
    await expect(page.getByText('Notebook A')).toHaveCount(0)
  })

  test('product form Cancel has no local side effect', async ({ page }) => {
    await setup(page)
    await page.goto('/products')
    await page.getByRole('button', { name: /Tạo mới/i }).click()
    await page.getByPlaceholder(/Bia Heineken/i).fill('DRAFT-ONLY-QA')
    await page.getByRole('button', { name: 'Hủy', exact: true }).click()
    expect((await dbRows(page, 'products')).filter(p => p.name === 'DRAFT-ONLY-QA')).toHaveLength(0)
  })

  test('quick sale saved to catalog is sent to API; item keeps ad-hoc identity', async ({ page }) => {
    const posted = await setup(page)
    await page.goto('/sales')
    await page.getByRole('button', { name: /Nhanh/i }).click()
    await page.locator('input[inputmode="numeric"]').first().fill('12')
    await page.getByRole('button', { name: /Tiếp tục/i }).click()
    await page.getByRole('button', { name: /Tiếp tục/i }).click()
    await page.getByRole('button', { name: /Xác nhận bán/i }).click()
    await expect.poll(() => posted.products.length).toBe(1)
    expect(posted.products[0].is_quick_sale).toBe(true)
    await expect(page.locator('[id^="cart-item-"]')).toHaveCount(1)
  })

  test('product add control and scanner modal remain usable above navigation', async ({ page }) => {
    await setup(page)
    await page.goto('/products')
    const plus = page.getByRole('button', { name: /Thêm Notebook A vào giỏ hàng/ })
    await expect(plus).toBeVisible()
    const b = await plus.boundingBox()
    expect(b.width).toBeGreaterThanOrEqual(40)
    expect(b.height).toBeGreaterThanOrEqual(40)
    await page.getByRole('button', { name: /Quét mã/i }).first().click()
    const overlays = await page.locator('div.fixed.inset-0').evaluateAll(nodes =>
      nodes.map(el => Number.parseInt(getComputedStyle(el).zIndex) || 0))
    expect(Math.max(...overlays)).toBeGreaterThan(100)
  })
})
