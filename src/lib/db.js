import { openDB } from 'idb'
import { matchProduct, sortSearchResults } from './searchUtils'

const DB_NAME = 'pos_db'
const DB_VERSION = 2

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Products store for offline search
            if (!db.objectStoreNames.contains('products')) {
                const productStore = db.createObjectStore('products', { keyPath: 'id' })
                productStore.createIndex('barcode', 'barcode', { unique: true })
                productStore.createIndex('name_search', 'search_normalize', { unique: false })
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
    const db = await initDB()
    const tx = db.transaction('products', 'readwrite')
    // We clear old cache to ensure data freshness on full sync
    await tx.store.clear()

    for (const product of products) {
        await tx.store.add({
            ...product,
            // Normalize name for simple search (lowercase, no accents if needed)
            search_normalize: product.name.toLowerCase()
        })
    }
    await tx.done
}

export const searchLocalProducts = async (query) => {
    const db = await initDB()

    // If query is empty or just whitespace, return recent products?
    // Or just all (limit 20)
    const isGetAll = !query || !query.trim()

    const all = await db.getAll('products')

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
    return db.getAll('products')
}

export const saveProductLocal = async (product) => {
    const db = await initDB()
    const tx = db.transaction('products', 'readwrite')
    const nextProduct = { ...product }
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
    const db = await initDB()
    await db.put('pending_products', {
        ...product,
        op: product.op || 'upsert',
        created_at: new Date().toISOString()
    })
}

export const getPendingProducts = async () => {
    const db = await initDB()
    return db.getAll('pending_products')
}

export const removePendingProduct = async (id) => {
    const db = await initDB()
    await db.delete('pending_products', id)
}

// === SALES (WRITE STORE) ===
export const saveOfflineSale = async (saleData) => {
    const db = await initDB()
    // synced is 0 (false) initially
    return db.add('sales_queue', {
        ...saleData,
        synced: 0,
        created_at: new Date().toISOString()
    })
}

export const getPendingSales = async () => {
    const db = await initDB()
    // Use index to get unsynced only
    return db.getAllFromIndex('sales_queue', 'synced', 0)
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
        sales.push(cursor.value)
        count++
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
    // Cleanup old synced sales to free space
    const db = await initDB()
    const tx = db.transaction('sales_queue', 'readwrite')
    const store = tx.objectStore('sales_queue')
    const index = store.index('synced')

    let cursor = await index.openCursor(1) // 1 = synced
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
        return product || null
    } catch (err) {
        console.warn('Barcode lookup error:', err)
        return null
    }
}
