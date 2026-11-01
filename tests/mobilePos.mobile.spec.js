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
  test('barcode API fallback upserts without erasing offline inventory', async ({ page }) => {
    await setup(page)
    await page.goto('/sales')
    await expect.poll(async () => (await dbRows(page, 'products')).length).toBeGreaterThanOrEqual(2)
    const input = page.getByPlaceholder('Mã/Tên SP... (Esc để thoát)')
    await input.fill('QA-C')
    await input.press('Enter')
    await expect.poll(async () => (await dbRows(page, 'products')).some(p => p.id === 'qa-c')).toBe(true)
    expect((await dbRows(page, 'products')).map(p => p.id).sort()).toEqual(['qa-a', 'qa-b', 'qa-c'])
  })

  test('editing product barcode to another item is rejected without deletion', async ({ page }) => {
    await setup(page)
    await page.goto('/products')
    await expect(page.getByText('Notebook A').first()).toBeVisible()
    await page.getByText('Notebook A').first().click()
    await page.locator('#barcode-input').fill('QA-B')
    await page.getByRole('button', { name: 'Lưu sản phẩm', exact: true }).click()
    await expect.poll(async () => (await dbRows(page, 'products')).filter(p => p.id === 'qa-b').length).toBe(1)
    expect((await dbRows(page, 'products')).find(p => p.id === 'qa-a').barcode).toBe('QA-A')
  })

  test('clearing quantity is non-destructive until user confirms', async ({ page }) => {
    await setup(page, { withCart: true })
    await page.goto('/sales')
    const item = page.locator('#cart-item-qa-a')
    await expect(item).toBeVisible()
    await item.locator('input[inputmode="numeric"]').fill('')
    await expect(item).toBeVisible()
    const b = await item.getByRole('button', { name: 'Giảm số lượng' }).boundingBox()
    expect(b.width).toBeGreaterThanOrEqual(44)
    expect(b.height).toBeGreaterThanOrEqual(44)
  })

  test('quick sale without saving to catalog does not create product', async ({ page }) => {
    const posted = await setup(page)
    await page.goto('/sales')
    await page.getByRole('button', { name: /Nhanh/i }).click()
    await page.locator('input[inputmode="numeric"]').first().fill('18')
    await page.locator('#saveCatalog').uncheck()
    await page.getByRole('button', { name: /Tiếp tục/i }).click()
    await page.getByRole('button', { name: /Tiếp tục/i }).click()
    await page.getByRole('button', { name: /Xác nhận bán/i }).click()
    await expect(page.locator('[id^="cart-item-"]')).toHaveCount(1)
    expect(posted.products).toHaveLength(0)
  })

  test('320-430px viewports have no page-level horizontal scrolling', async ({ page }) => {
    await setup(page)
    for (const width of [320, 360, 390, 430]) {
      await page.setViewportSize({ width, height: 780 })
      for (const route of ['/sales', '/products']) {
        await page.goto(route)
        await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(2)
      }
    }
  })

  test('P0: ten offline sales survive reload and sync exactly once after reconnect', async ({ page }) => {
    await setup(page)
    const captured = new Map()
    let attempt = 0
    await page.route('**/api/sales', async route => {
      if (route.request().method() !== 'POST') return route.continue()
      attempt++
      const sale = route.request().postDataJSON()
      const previous = captured.get(sale.id)
      if (previous) expect(previous).toEqual(sale)
      captured.set(sale.id, sale)
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ success: true, id: sale.id }) })
    })
    await page.goto('/sales')
    await page.evaluate(async () => {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('pos_db')
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      await new Promise((resolve, reject) => {
        const tx = db.transaction('sales_queue', 'readwrite')
        const store = tx.objectStore('sales_queue')
        for (let i = 0; i < 10; i++) {
          store.add({
            id: 'offline-p0-' + i, code: 'P0-' + i, shop_id: 'qa-shop-a',
            total_amount: 15000, payment_method: 'cash',
            items: [{ product_id: 'qa-a', product_name: 'Notebook A', quantity: 1, price: 15000 }],
            synced: 0, created_at: new Date().toISOString(), sale_date: new Date().toISOString()
          })
        }
        tx.oncomplete = resolve
        tx.onerror = () => reject(tx.error)
      })
      db.close()
    })
    await page.reload()
    await expect(page.getByPlaceholder('Mã/Tên SP... (Esc để thoát)')).toBeVisible()
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await expect.poll(async () => (await dbRows(page, 'sales_queue')).filter(s => s.synced === 1).length,
      { timeout: 20000 }).toBe(10)
    expect(captured.size).toBe(10)
    expect(attempt).toBe(10)
    await page.reload()
    await page.waitForTimeout(350)
    expect(attempt).toBe(10)
  })

  test('legacy IndexedDB v2 survives upgrade to v3 without losing offline product or sale', async ({ page }) => {
    await setup(page)
    await page.route('**/__qa_seed_v2', route => route.fulfill({
      status: 200, contentType: 'text/html', body: '<!doctype html><title>QA seed</title>'
    }))
    await page.goto('/__qa_seed_v2')
    await page.evaluate(() => new Promise((resolve, reject) => {
      const req = indexedDB.open('pos_db', 2)
      req.onupgradeneeded = () => {
        const db = req.result
        const products = db.createObjectStore('products', { keyPath: 'id' })
        products.createIndex('barcode', 'barcode', { unique: true })
        products.createIndex('name_search', 'search_normalize', { unique: false })
        const sales = db.createObjectStore('sales_queue', { keyPath: 'local_id', autoIncrement: true })
        sales.createIndex('synced', 'synced', { unique: false })
        sales.createIndex('created_at', 'created_at', { unique: false })
        const pending = db.createObjectStore('pending_products', { keyPath: 'id' })
        pending.createIndex('created_at', 'created_at', { unique: false })
      }
      req.onerror = () => reject(req.error)
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction(['products', 'sales_queue', 'pending_products'], 'readwrite')
        tx.objectStore('products').put({
          id: 'legacy-product', shop_id: 'qa-shop-a', barcode: 'LEGACY1',
          name: 'Legacy product', price: 10000, stock_quantity: 2
        })
        tx.objectStore('sales_queue').add({
          id: 'legacy-sale', shop_id: 'qa-shop-a', code: 'LEGACY-SALE',
          total_amount: 10000, synced: 0, created_at: new Date().toISOString()
        })
        tx.objectStore('pending_products').put({
          id: 'legacy-pending', shop_id: 'qa-shop-a', name: 'Unsynced',
          barcode: 'PENDING1', op: 'upsert', created_at: new Date().toISOString()
        })
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => { db.close(); reject(tx.error) }
      }
    }))
    await page.unroute('**/__qa_seed_v2')
    await page.goto('/products')
    await expect.poll(async () => page.evaluate(() => new Promise((resolve, reject) => {
      const req = indexedDB.open('pos_db')
      req.onsuccess = () => { const db = req.result; resolve(db.version); db.close() }
      req.onerror = () => reject(req.error)
    }))).toBe(3)
    expect((await dbRows(page, 'sales_queue')).some(s => s.id === 'legacy-sale')).toBe(true)
    expect((await dbRows(page, 'pending_products')).some(p => p.id === 'legacy-pending')).toBe(true)
  })

  test('two browser tabs reconciling same pending sale preserve one logical server receipt', async ({ page }) => {
    await setup(page)
    const second = await page.context().newPage()
    await setup(second)
    const receipts = new Map()
    let delivered = 0
    for (const tab of [page, second]) {
      await tab.route('**/api/sales', async route => {
        if (route.request().method() !== 'POST') return route.continue()
        const payload = route.request().postDataJSON()
        delivered++
        if (!receipts.has(payload.id)) receipts.set(payload.id, payload)
        await new Promise(resolve => setTimeout(resolve, 80))
        return route.fulfill({ status: 200, contentType: 'application/json',
          body: JSON.stringify({ success: true, id: payload.id }) })
      })
    }
    await page.goto('/sales')
    await second.goto('/sales')
    await page.evaluate(async () => {
      const req = indexedDB.open('pos_db')
      const db = await new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
      await new Promise((resolve, reject) => {
        const tx = db.transaction('sales_queue', 'readwrite')
        tx.objectStore('sales_queue').add({
          id: 'multi-tab-qa', shop_id: 'qa-shop-a', code: 'MULTITAB-1',
          total_amount: 15000, payment_method: 'cash', synced: 0,
          sale_date: new Date().toISOString(), created_at: new Date().toISOString(),
          items: [{ product_id: 'qa-a', product_name: 'Notebook A', quantity: 1, price: 15000 }]
        })
        tx.oncomplete = resolve
        tx.onerror = () => reject(tx.error)
      })
      db.close()
    })
    await Promise.all([page, second].map(tab =>
      tab.evaluate(() => window.dispatchEvent(new Event('online')))))
    await expect.poll(async () => (await dbRows(page, 'sales_queue'))
      .filter(s => s.id === 'multi-tab-qa' && s.synced === 1).length,
      { timeout: 15000 }).toBe(1)
    expect(receipts.size).toBe(1)
    expect(delivered).toBeGreaterThanOrEqual(1)
    await second.close()
  })

  test('thumb reach: mobile product primary actions stay in bottom half', async ({ page }) => {
    await setup(page)
    await page.goto('/products')
    const toolbar = page.getByTestId('mobile-product-toolbar')
    await expect(toolbar).toBeVisible()
    for (const name of ['Tìm sản phẩm', 'Quét mã sản phẩm', 'Bộ lọc sản phẩm', 'Quét lô', 'Tạo mới']) {
      const element = name === 'Tạo mới' || name === 'Quét lô'
        ? toolbar.getByRole('button', { name, exact: true })
        : name === 'Tìm sản phẩm'
          ? toolbar.getByRole('textbox', { name })
          : toolbar.getByRole('button', { name })
      const box = await element.boundingBox()
      expect(box).not.toBeNull()
      expect(box.y + box.height / 2).toBeGreaterThan(page.viewportSize().height / 2)
      expect(box.y + box.height).toBeLessThan(page.viewportSize().height - 55)
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
    const create = toolbar.getByRole('button', { name: 'Tạo mới' })
    await create.click()
    await expect(page.getByPlaceholder(/Bia Heineken/i)).toBeVisible()
  })

  test('mobile product filter and sort open next to thumb controls', async ({ page }) => {
    await setup(page)
    await page.goto('/products')
    await page.getByRole('button', { name: 'Bộ lọc sản phẩm' }).click()
    const dialog = page.getByRole('dialog', { name: 'Lọc và sắp xếp sản phẩm' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Lọc hàng sắp hết' }).click()
    await dialog.getByRole('button', { name: 'Xem kết quả' }).click()
    await expect(dialog).toHaveCount(0)
    await expect(page.getByText('Notebook A').first()).toBeVisible()
  })

  test('thumb reach: sales search, scan and quick actions above bottom navigation', async ({ page }) => {
    await setup(page, { withCart: true })
    await page.goto('/sales')
    const bar = page.getByTestId('mobile-sales-actions')
    await expect(bar).toBeVisible()
    for (const name of ['Quét mã bằng camera', 'Bán nhanh', 'Lịch sử']) {
      const button = bar.getByRole('button', { name })
      const rect = await button.boundingBox()
      expect(rect).not.toBeNull()
      expect(rect.y + rect.height / 2).toBeGreaterThan(page.viewportSize().height / 2)
      expect(rect.y + rect.height).toBeLessThan(page.viewportSize().height - 55)
      expect(rect.height).toBeGreaterThanOrEqual(44)
    }
    const search = bar.getByRole('textbox', { name: '' })
    await expect(search).toBeVisible()
    const box = await search.boundingBox()
    expect(box.y + box.height / 2).toBeGreaterThan(page.viewportSize().height / 2)
  })

})
