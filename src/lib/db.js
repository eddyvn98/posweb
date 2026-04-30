import { openDB } from 'idb'
import { matchProduct, sortSearchResults } from './searchUtils'

const DB_NAME = 'pos_db'
const DB_VERSION = 3  // bump version to add shop_id index

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
        },
    })
}

// === PRODUCTS (READ STORE) ===
export const saveProductsToLocal = async (products) => {
    if (!_currentShopId) return
    const shopId = _currentShopId
    const db = await initDB()
    const tx = db.transaction('products', 'readwrite')

    // Only clear products belonging to THIS shop — never touch other shops' data
    const existingKeys = await tx.store.index('shop_id').getAllKeys(shopId)
    for (const key of existingKeys) {
        await tx.store.delete(key)
    }

    for (const product of products) {
        await tx.store.put({
            ...product,
            shop_id: product.shop_id || shopId,
            search_normalize: product.name.toLowerCase()
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

export const markSaleSynced = async (localId) => {
    const db = await initDB()
    const tx = db.transaction('sales_queue', 'readwrite')
    const store = tx.objectStore('sales_queue')

    const sale = await store.get(localId)
    if (sale) {
        sale.synced = 1
        await store.put(sale)
    }
    await tx.done
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
