import { openDB } from 'idb'
import { matchProduct, sortSearchResults } from './searchUtils'

const DB_NAME = 'pos_db'
const DB_VERSION = 5  // bump version to add reports_cache

// Current shop_id injected at login, cleared at logout.
// This prevents product cache leakage across different shops.
let _currentShopId = null

export function setCurrentShopId(shopId) {
    _currentShopId = shopId
}

export function clearCurrentShopId() {
    _currentShopId = null
}

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion) {
            // Products store for offline search
            if (!db.objectStoreNames.contains('products')) {
                const productStore = db.createObjectStore('products', { keyPath: 'id' })
                productStore.createIndex('barcode', 'barcode', { unique: true })
                productStore.createIndex('name_search', 'search_normalize', { unique: false })
                productStore.createIndex('shop_id', 'shop_id', { unique: false })
            } else if (oldVersion < 3) {
                // Add shop_id index to existing store
                const tx = db.transaction('products', 'readwrite')
                const store = tx.objectStore('products')
                if (!store.indexNames.contains('shop_id')) {
                    store.createIndex('shop_id', 'shop_id', { unique: false })
                }
            }

            // Offline sales store
            if (!db.objectStoreNames.contains('sales_queue')) {
                const salesStore = db.createObjectStore('sales_queue', {
                    keyPath: 'local_id',
                    autoIncrement: true
                })
                salesStore.createIndex('synced', 'synced', { unique: false })
                salesStore.createIndex('created_at', 'created_at', { unique: false })
                salesStore.createIndex('shop_id', 'shop_id', { unique: false })
            }

            // Pending product updates for offline-first sync.
            if (!db.objectStoreNames.contains('pending_products')) {
                const productQueue = db.createObjectStore('pending_products', { keyPath: 'id' })
                productQueue.createIndex('created_at', 'created_at', { unique: false })
                productQueue.createIndex('shop_id', 'shop_id', { unique: false })
            }

            // Manual cash flows (offline-first)
            if (!db.objectStoreNames.contains('cash_flows')) {
                const cashStore = db.createObjectStore('cash_flows', { keyPath: 'local_id', autoIncrement: true })
                cashStore.createIndex('created_at', 'created_at', { unique: false })
                cashStore.createIndex('shop_id', 'shop_id', { unique: false })
                cashStore.createIndex('synced', 'synced', { unique: false })
            }

            // Report Cache (Offline-first viewing)
            if (!db.objectStoreNames.contains('reports_cache')) {
                const reportStore = db.createObjectStore('reports_cache', { keyPath: 'cache_key' })
                reportStore.createIndex('shop_id', 'shop_id', { unique: false })
            }
        },
    })
}

// === PRODUCTS (READ STORE) ===
export const saveProductsToLocal = async (products) => {
    if (!_currentShopId) return
    const shopId = _currentShopId
    const db = await initDB()
    
    // Get all pending changes for this shop to avoid overwriting them
    const pendingStore = db.transaction('pending_products', 'readonly').objectStore('pending_products')
    const pendingKeys = await pendingStore.getAllKeys()
    const pendingSet = new Set(pendingKeys)

    const tx = db.transaction('products', 'readwrite')
    const store = tx.objectStore('products')

    // Instead of deleting all, we update or add. 
    // We only delete products that are NOT in the new server list AND not pending.
    const existingKeys = await store.index('shop_id').getAllKeys(shopId)
    const serverProductIds = new Set(products.map(p => p.id))

    for (const key of existingKeys) {
        if (!serverProductIds.has(key) && !pendingSet.has(key)) {
            await store.delete(key)
        }
    }

    for (const product of products) {
        // Skip updating if there's a local pending change for this product
        if (pendingSet.has(product.id)) continue

        await store.put({
            ...product,
            shop_id: product.shop_id || shopId,
            search_normalize: String(product.name || '').toLowerCase()
        })
    }
    await tx.done
}

export const searchLocalProducts = async (query) => {
    if (!_currentShopId) return []
    const shopId = _currentShopId
    const db = await initDB()

    // Get only products for current shop
    const all = await db.getAllFromIndex('products', 'shop_id', shopId)

    const isGetAll = !query || !query.trim()
    if (isGetAll) {
        return all.slice(0, 50)
    }

    const results = all.filter(p => matchProduct(p, query))
    return sortSearchResults(results, query).slice(0, 50)
}

export const getAllLocalProducts = async () => {
    if (!_currentShopId) return []
    const db = await initDB()
    return db.getAllFromIndex('products', 'shop_id', _currentShopId)
}

export const saveProductLocal = async (product) => {
    if (!_currentShopId) return
    const db = await initDB()
    const tx = db.transaction('products', 'readwrite')
    const nextProduct = { ...product, shop_id: product.shop_id || _currentShopId }
    const barcode = String(nextProduct.barcode || '').trim()

    // IndexedDB enforces unique barcode. If an old draft with another id exists,
    // replace it so "save from edit modal" does not crash on constraint errors.
    if (barcode) {
        const existingKey = await tx.store.index('barcode').getKey(barcode)
        if (!nextProduct.id && existingKey) {
            nextProduct.id = existingKey
        }
        if (existingKey && nextProduct.id && existingKey !== nextProduct.id) {
            await tx.store.delete(existingKey)
        }
    }

    await tx.store.put({
        ...nextProduct,
        search_normalize: String(nextProduct.name || '').toLowerCase()
    })
    await tx.done
}

export const deleteProductLocal = async (id) => {
    const db = await initDB()
    await db.delete('products', id)
}

export const queuePendingProduct = async (product) => {
    if (!_currentShopId) return
    const db = await initDB()
    await db.put('pending_products', {
        ...product,
        shop_id: product.shop_id || _currentShopId,
        op: product.op || 'upsert',
        created_at: new Date().toISOString()
    })
}

export const getPendingProducts = async () => {
    if (!_currentShopId) return []
    const db = await initDB()
    // Get pending only for current shop
    const all = await db.getAll('pending_products')
    return all.filter(p => !p.shop_id || p.shop_id === _currentShopId)
}

export const removePendingProduct = async (id) => {
    const db = await initDB()
    await db.delete('pending_products', id)
}

// === SALES (WRITE STORE) ===
export const saveOfflineSale = async (saleData) => {
    const db = await initDB()
    return db.add('sales_queue', {
        ...saleData,
        shop_id: saleData.shop_id || _currentShopId,
        synced: 0,
        created_at: new Date().toISOString()
    })
}

export const getPendingSales = async () => {
    if (!_currentShopId) return []
    const db = await initDB()
    const allUnsynced = await db.getAllFromIndex('sales_queue', 'synced', 0)
    // Filter by shop to avoid processing other shops' queued sales
    return allUnsynced.filter(s => !s.shop_id || s.shop_id === _currentShopId)
}

export const getSalesHistory = async (limit = 50) => {
    const db = await initDB()
    const tx = db.transaction('sales_queue', 'readonly')
    const store = tx.objectStore('sales_queue')
    const index = store.index('created_at')

    let cursor = await index.openCursor(null, 'prev')
    const sales = []
    let count = 0

    while (cursor && count < limit) {
        // Only include current shop's sales
        if (!cursor.value.shop_id || cursor.value.shop_id === _currentShopId) {
            sales.push(cursor.value)
            count++
        }
        cursor = await cursor.continue()
    }

    return sales
}

export const searchSalesHistory = async ({ query, startDate, endDate, barcode }) => {
    const db = await initDB()
    const allSales = await db.getAllFromIndex('sales_queue', 'shop_id', _currentShopId)
    
    let results = allSales

    // Filter by date
    if (startDate) {
        const start = new Date(startDate).toISOString()
        results = results.filter(s => s.created_at >= start)
    }
    if (endDate) {
        const end = new Date(endDate).toISOString()
        results = results.filter(s => s.created_at <= end)
    }

    // Filter by query (order code)
    if (query) {
        const q = query.toLowerCase()
        results = results.filter(s => 
            (s.code && s.code.toLowerCase().includes(q)) || 
            (s.local_id && s.local_id.toString().includes(q))
        )
    }

    // Filter by barcode
    if (barcode) {
        const product = await findProductByBarcode(barcode)
        if (product) {
            results = results.filter(s => s.items?.some(item => item.product_id === product.id))
        } else {
            // If barcode doesn't match a product, check item names
            const q = barcode.toLowerCase()
            results = results.filter(s => s.items?.some(item => item.product_name?.toLowerCase().includes(q)))
        }
    }

    return results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export const markSaleSynced = async (localId, serverId) => {
    const db = await initDB()
    const tx = db.transaction('sales_queue', 'readwrite')
    const store = tx.objectStore('sales_queue')

    const sale = await store.get(localId)
    if (sale) {
        sale.synced = 1
        if (serverId) sale.id = serverId
        await store.put(sale)
    }
    await tx.done
}


export const voidSaleLocal = async (localId, reason) => {
    const db = await initDB()
    
    // 1. Mark Sale as Voided
    const txSale = db.transaction('sales_queue', 'readwrite')
    const store = txSale.objectStore('sales_queue')
    const sale = await store.get(localId)
    
    if (!sale || sale.is_void) {
        await txSale.done
        return null
    }

    sale.is_void = true
    sale.void_reason = reason
    sale.void_at = new Date().toISOString()
    sale.synced = 0 // Needs sync if previously synced or newly voided
    await store.put(sale)
    await txSale.done

    // 2. Restore Stock
    const txProd = db.transaction(['products', 'pending_products'], 'readwrite')
    const productStore = txProd.objectStore('products')
    const pendingStore = txProd.objectStore('pending_products')
    
    for (const item of (sale.items || [])) {
        if (!item.product_id) continue
        const product = await productStore.get(item.product_id)
        if (product) {
            product.stock_quantity = Number(product.stock_quantity || 0) + Number(item.quantity || 0)
            await productStore.put(product)
            
            // Queue stock update for sync
            await pendingStore.put({
                ...product,
                op: 'upsert',
                created_at: new Date().toISOString()
            })
        }
    }
    await txProd.done

    // 3. Record Cash Reversal (OUT flow to negate the IN flow)
    const txCash = db.transaction('cash_flows', 'readwrite')
    await txCash.store.add({
        shop_id: sale.shop_id || _currentShopId,
        type: 'OUT',
        amount: Number(sale.total_amount),
        category: 'void',
        description: `[HUỶ] Hoàn tiền đơn hàng #${sale.code || localId}`,
        ref_id: sale.id || localId.toString(),
        payment_method: sale.payment_method || 'cash',
        created_at: new Date().toISOString(),
        synced: 0
    })
    await txCash.done

    return sale
}


export const returnSaleLocal = async (localId, { reason, amount, paymentMethod }) => {
    const db = await initDB()
    
    // 1. Mark Sale as Voided
    const txSale = db.transaction('sales_queue', 'readwrite')
    const sale = await txSale.store.get(localId)
    if (!sale || sale.is_void) {
        await txSale.done
        return null
    }
    sale.is_void = true
    sale.void_reason = reason || 'Trả hàng'
    sale.void_at = new Date().toISOString()
    sale.synced = 0 
    await txSale.store.put(sale)
    await txSale.done

    // 2. Restore Stock
    const txProd = db.transaction(['products', 'pending_products'], 'readwrite')
    const productStore = txProd.objectStore('products')
    const pendingStore = txProd.objectStore('pending_products')
    
    for (const item of (sale.items || [])) {
        if (!item.product_id) continue
        const product = await productStore.get(item.product_id)
        if (product) {
            product.stock_quantity = Number(product.stock_quantity || 0) + Number(item.quantity || 0)
            await productStore.put(product)
            
            // Queue stock update for sync
            await pendingStore.put({
                ...product,
                op: 'upsert',
                created_at: new Date().toISOString()
            })
        }
    }
    await txProd.done

    // 3. Record Cash Outflow
    const txCash = db.transaction('cash_flows', 'readwrite')
    await txCash.store.add({
        shop_id: sale.shop_id || _currentShopId,
        type: 'OUT',
        amount: Number(amount || sale.total_amount),
        category: 'return',
        description: `Trả tiền đơn hàng #${sale.code || localId}`,
        ref_id: sale.id || localId.toString(),
        payment_method: paymentMethod || sale.payment_method || 'cash',
        created_at: new Date().toISOString(),
        synced: 0
    })
    await txCash.done

    return sale
}

export const deleteSyncedSales = async () => {
    const db = await initDB()
    const tx = db.transaction('sales_queue', 'readwrite')
    const store = tx.objectStore('sales_queue')
    const index = store.index('synced')

    let cursor = await index.openCursor(1)
    while (cursor) {
        await cursor.delete()
        cursor = await cursor.continue()
    }
    await tx.done
}

export const getTodayStatsFromLocal = async () => {
    if (!_currentShopId) return { revenue: 0, orders: 0 }
    
    const db = await initDB()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    const allSales = await db.getAllFromIndex('sales_queue', 'shop_id', _currentShopId)
    const todaySales = allSales.filter(s => !s.is_void && s.created_at >= todayISO)

    const revenue = todaySales.reduce((sum, s) => sum + s.total_amount, 0)
    return {
        revenue,
        orders: todaySales.length
    }
}

export const debugProducts = async () => {
    const db = await initDB()
    const all = await db.getAll('products')
    console.log('[DEBUG] Products in IndexedDB:', all)
    return all
}

export const findProductByBarcode = async (barcode) => {
    const db = await initDB()
    try {
        const product = await db.getFromIndex('products', 'barcode', barcode)
        // Verify product belongs to current shop
        if (product && _currentShopId && product.shop_id && product.shop_id !== _currentShopId) {
            return null
        }
        return product || null
    } catch (err) {
        console.warn('Barcode lookup error:', err)
        return null
    }
}

export const seedGuestData = async () => {
    if (_currentShopId !== 'guest_shop') return

    const db = await initDB()
    
    // Clear existing guest data safely
    console.log('[DB] Refreshing guest data...')
    const { MOCK_PRODUCTS, MOCK_SALES, MOCK_CASHFLOWS } = await import('./mockData')

    const storesToClear = ['products', 'sales_queue', 'cash_flows'].filter(s => db.objectStoreNames.contains(s))
    
    if (storesToClear.length > 0) {
        const txClear = db.transaction(storesToClear, 'readwrite')
        for (const storeName of storesToClear) {
            const store = txClear.objectStore(storeName)
            const keys = await store.index('shop_id').getAllKeys('guest_shop')
            for (const key of keys) await store.delete(key)
        }
        await txClear.done
    }

    // Seed Products
    console.log('[DB] Seeding products...')
    const txProd = db.transaction('products', 'readwrite')
    for (const p of MOCK_PRODUCTS) {
        await txProd.store.put({
            ...p,
            shop_id: 'guest_shop',
            search_normalize: p.name.toLowerCase()
        })
    }
    await txProd.done
    console.log('[DB] Products seeded.')

    // Seed Sales
    console.log('[DB] Seeding sales...')
    const txSales = db.transaction('sales_queue', 'readwrite')
    for (const s of MOCK_SALES) {
        await txSales.store.put({
            ...s,
            shop_id: 'guest_shop'
        })
    }
    await txSales.done
    console.log('[DB] Sales seeded.')

    // Seed Cash Flows
    console.log('[DB] Seeding cash flows...')
    const txCash = db.transaction('cash_flows', 'readwrite')
    for (const c of MOCK_CASHFLOWS) {
        await txCash.store.put({
            ...c,
            shop_id: 'guest_shop',
            synced: 1
        })
    }
    await txCash.done
    console.log('[DB] Guest data refresh complete.')
}

export const getCachedReport = async (shopId, type, year, month) => {
    const db = await initDB()
    const cache_key = `${shopId}_${type}_${year}_${month}`
    return db.get('reports_cache', cache_key)
}

export const setCachedReport = async (shopId, type, year, month, data) => {
    const db = await initDB()
    const cache_key = `${shopId}_${type}_${year}_${month}`
    await db.put('reports_cache', {
        cache_key,
        shop_id: shopId,
        type,
        year,
        month,
        data,
        cached_at: new Date().toISOString()
    })
}

export const getAllLocalSales = async (shopId) => {
    const db = await initDB()
    return db.getAllFromIndex('sales_queue', 'shop_id', shopId)
}

export const getAllLocalCashFlows = async (shopId) => {
    const db = await initDB()
    return db.getAllFromIndex('cash_flows', 'shop_id', shopId)
}
