import { openDB } from 'idb'
import { matchProduct, sortSearchResults } from './searchUtils'

const DB_NAME = 'pos_db'
const DB_VERSION = 3
const currentShopId = () => {
    try { return JSON.parse(localStorage.getItem('pos_shop') || 'null')?.id || null }
    catch { return null }
}

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db, _oldVersion, _newVersion, transaction) {
            // Products store for offline search
            if (!db.objectStoreNames.contains('products')) {
                const productStore = db.createObjectStore('products', { keyPath: 'id' })
                productStore.createIndex('shop_barcode', ['shop_id', 'barcode'], { unique: true })
                productStore.createIndex('name_search', 'search_normalize', { unique: false })
            } else {
                const products = transaction.objectStore('products')
                if (products.indexNames.contains('barcode')) products.deleteIndex('barcode')
                if (!products.indexNames.contains('shop_barcode')) {
                    products.createIndex('shop_barcode', ['shop_id', 'barcode'], { unique: true })
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
            }

            // Pending product updates for offline-first sync.
            if (!db.objectStoreNames.contains('pending_products')) {
                const productQueue = db.createObjectStore('pending_products', { keyPath: 'id' })
                productQueue.createIndex('created_at', 'created_at', { unique: false })
            }
        },
    })
}

// === PRODUCTS (READ STORE) ===
export const saveProductsToLocal = async (products) => {
    const shopId = currentShopId()
    if (!shopId) return
    const db = await initDB()
    const tx = db.transaction(['products', 'pending_products'], 'readwrite')
    const store = tx.objectStore('products')
    const pending = await tx.objectStore('pending_products').getAll()
    const pendingIds = new Set(pending.filter(p => p.shop_id === shopId).map(p => p.id))
    const previous = await store.getAll()
    for (const product of previous) {
        if (product.shop_id === shopId && !pendingIds.has(product.id)) await store.delete(product.id)
    }
    for (const product of (products || []).filter(p => p?.id && p.shop_id === shopId && (p.name || p.barcode))) {
        if (!pendingIds.has(product.id)) {
            await store.put({ ...product, search_normalize: String(product.name || '').toLowerCase() })
        }
    }
    await tx.done
}

export const upsertProductsToLocal = async (products) => {
    const shopId = currentShopId()
    if (!shopId) return
    const db = await initDB()
    const tx = db.transaction('products', 'readwrite')
    for (const product of (products || []).filter(p => p?.id && p.shop_id === shopId && (p.name || p.barcode))) {
        await tx.store.put({ ...product, search_normalize: String(product.name || '').toLowerCase() })
    }
    await tx.done
}

export const searchLocalProducts = async (query) => {
    const db = await initDB()

    // If query is empty or just whitespace, return recent products?
    // Or just all (limit 20)
    const isGetAll = !query || !query.trim()

    const shopId = currentShopId()
    if (!shopId) return []
    const all = (await db.getAll('products')).filter(p => p.shop_id === shopId)

    if (isGetAll) {
        // Return latest 20 (assuming auto-increment or similar order, 
        // but getAll usually returns by PK. If PK is UUID, order is random.
        // For now just return first 20 or slice.
        // better to reverse if we want newest? products usually don't have created_at index here yet.
        return all.slice(0, 50)
    }

    const results = all.filter(p => matchProduct(p, query))
    return sortSearchResults(results, query).slice(0, 50)
}

export const getAllLocalProducts = async () => {
    const db = await initDB()
    const shopId = currentShopId()
    if (!shopId) return []
    return (await db.getAll('products')).filter(p => p.shop_id === shopId)
}

export const saveProductLocal = async (product) => {
    const db = await initDB()
    const tx = db.transaction('products', 'readwrite')
    const shopId = currentShopId()
    if (!shopId || (product.shop_id && product.shop_id !== shopId)) throw new Error('Sai cửa hàng khi lưu sản phẩm')
    const nextProduct = { ...product, shop_id: shopId }
    const barcode = String(nextProduct.barcode || '').trim()
    nextProduct.barcode = barcode

    // Reject duplicate barcodes; never delete another product implicitly.
    if (barcode) {
        const ownerId = await tx.store.index('shop_barcode').getKey([shopId, barcode])
        if (ownerId && ownerId !== nextProduct.id) {
            const error = new Error('Mã vạch đã thuộc về sản phẩm khác')
            error.code = 'BARCODE_CONFLICT'
            throw error
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
    const existing = await db.get('products', id)
    if (existing?.shop_id === currentShopId()) await db.delete('products', id)
}

export const queuePendingProduct = async (product) => {
    const db = await initDB()
    const shopId = currentShopId()
    if (!shopId || (product.shop_id && product.shop_id !== shopId)) throw new Error('Sai cửa hàng khi xếp hàng sản phẩm')
    await db.put('pending_products', {
        ...product,
        shop_id: shopId,
        op: product.op || 'upsert',
        created_at: new Date().toISOString()
    })
}

export const getPendingProducts = async () => {
    const db = await initDB()
    const shopId = currentShopId()
    if (!shopId) return []
    return (await db.getAll('pending_products')).filter(p => p.shop_id === shopId)
}

export const removePendingProduct = async (id) => {
    const db = await initDB()
    const pending = await db.get('pending_products', id)
    if (pending?.shop_id === currentShopId()) await db.delete('pending_products', id)
}

// === SALES (WRITE STORE) ===
export const saveOfflineSale = async (saleData) => {
    const db = await initDB()
    const shopId = currentShopId()
    if (!shopId || saleData.shop_id !== shopId) throw new Error('Sai cửa hàng khi lưu hóa đơn')
    // Preserve synced status if already synced (e.g. 1 from online checkout)
    const isSynced = saleData.synced !== undefined ? Number(saleData.synced) : 0
    return db.add('sales_queue', {
        ...saleData,
        synced: isSynced,
        created_at: saleData.created_at || new Date().toISOString()
    })
}

export const getPendingSales = async () => {
    const db = await initDB()
    // Use index to get unsynced only
    const shopId = currentShopId()
    if (!shopId) return []
    return (await db.getAllFromIndex('sales_queue', 'synced', 0)).filter(s => s.shop_id === shopId)
}

export const getSalesHistory = async (limit = 50) => {
    const db = await initDB()
    const tx = db.transaction('sales_queue', 'readonly')
    const store = tx.objectStore('sales_queue')
    const index = store.index('created_at')

    // Get recent sales (descending)
    // Note: IDB 'prev' direction is needed for descending
    let cursor = await index.openCursor(null, 'prev')

    const sales = []
    let count = 0

    while (cursor && count < limit) {
        if (cursor.value.shop_id === currentShopId()) {
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
    if (sale?.shop_id === currentShopId()) {
        sale.synced = 1
        await store.put(sale)
    }
    await tx.done
}

export const voidSaleInLocal = async (identifier, reason = 'Bán nhầm') => {
    const db = await initDB()
    const tx = db.transaction('sales_queue', 'readwrite')
    const store = tx.objectStore('sales_queue')

    let sale = null
    if (typeof identifier === 'number') {
        sale = await store.get(identifier)
    }
    if (!sale) {
        const all = await store.getAll()
        sale = all.find(s => s.shop_id === currentShopId() && (s.local_id === identifier || s.id === identifier || s.code === identifier))
    }

    if (sale?.shop_id === currentShopId()) {
        sale.is_void = 1
        sale.void_reason = reason
        sale.void_at = new Date().toISOString()
        await store.put(sale)
    }
    await tx.done
    return sale
}

export const deleteSyncedSales = async () => {
    // Cleanup old synced sales to free space
    const db = await initDB()
    const tx = db.transaction('sales_queue', 'readwrite')
    const store = tx.objectStore('sales_queue')
    const index = store.index('synced')

    let cursor = await index.openCursor(1) // 1 = synced
    while (cursor) {
        if (cursor.value.shop_id === currentShopId()) await cursor.delete()
        cursor = await cursor.continue()
    }
    await tx.done
}

export const debugProducts = async () => {
    const db = await initDB()
    const all = (await db.getAll('products')).filter(p => p.shop_id === currentShopId())
    console.log('[DEBUG] Products in IndexedDB:', all)
    return all
}

export const findProductByBarcode = async (barcode) => {
    const db = await initDB()
    try {
        const shopId = currentShopId()
        if (!shopId) return null
        const product = await db.getFromIndex('products', 'shop_barcode', [shopId, barcode])
        return product || null
    } catch (err) {
        console.warn('Barcode lookup error:', err)
        return null
    }
}
