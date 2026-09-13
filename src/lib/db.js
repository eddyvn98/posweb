import { openDB } from 'idb'
import { matchProduct, sortSearchResults } from './searchUtils'
import { MOCK_PRODUCTS, MOCK_SALES, MOCK_CASHFLOWS } from './mockData'

const DB_NAME = 'pos_db'
const DB_VERSION = 8

let _currentShopId = null

export function setCurrentShopId(shopId) {
    _currentShopId = shopId
}

export function clearCurrentShopId() {
    _currentShopId = null
}

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, _newVersion, tx) {
            if (!db.objectStoreNames.contains('products')) {
                const productStore = db.createObjectStore('products', { keyPath: 'id' })
                productStore.createIndex('barcode', 'barcode', { unique: false })
                productStore.createIndex('shop_barcode', ['shop_id', 'barcode'], { unique: false })
                productStore.createIndex('name_search', 'search_normalize', { unique: false })
                productStore.createIndex('shop_id', 'shop_id', { unique: false })
                productStore.createIndex('parent_id', 'parent_id', { unique: false })
            } else {
                const store = tx.objectStore('products')
                if (oldVersion < 8) {
                    if (store.indexNames.contains('barcode')) store.deleteIndex('barcode')
                    store.createIndex('barcode', 'barcode', { unique: false })
                }
                if (!store.indexNames.contains('shop_id')) store.createIndex('shop_id', 'shop_id', { unique: false })
                if (!store.indexNames.contains('parent_id')) store.createIndex('parent_id', 'parent_id', { unique: false })
                if (store.indexNames.contains('shop_barcode')) store.deleteIndex('shop_barcode')
                store.createIndex('shop_barcode', ['shop_id', 'barcode'], { unique: false })
            }

            if (!db.objectStoreNames.contains('sales_queue')) {
                const salesStore = db.createObjectStore('sales_queue', { keyPath: 'local_id', autoIncrement: true })
                salesStore.createIndex('synced', 'synced', { unique: false })
                salesStore.createIndex('created_at', 'created_at', { unique: false })
                salesStore.createIndex('shop_id', 'shop_id', { unique: false })
            }

            if (!db.objectStoreNames.contains('pending_products')) {
                const productQueue = db.createObjectStore('pending_products', { keyPath: 'id' })
                productQueue.createIndex('created_at', 'created_at', { unique: false })
                productQueue.createIndex('shop_id', 'shop_id', { unique: false })
            }

            if (!db.objectStoreNames.contains('cash_flows')) {
                const cashStore = db.createObjectStore('cash_flows', { keyPath: 'local_id', autoIncrement: true })
                cashStore.createIndex('created_at', 'created_at', { unique: false })
                cashStore.createIndex('shop_id', 'shop_id', { unique: false })
                cashStore.createIndex('synced', 'synced', { unique: false })
            }

            if (!db.objectStoreNames.contains('reports_cache')) {
                const reportStore = db.createObjectStore('reports_cache', { keyPath: 'cache_key' })
                reportStore.createIndex('shop_id', 'shop_id', { unique: false })
            }

            if (!db.objectStoreNames.contains('attribute_presets')) {
                const presetStore = db.createObjectStore('attribute_presets', { keyPath: 'id', autoIncrement: true })
                presetStore.createIndex('shop_id', 'shop_id', { unique: false })
            }
        },
    })
}

// 180 Local Image Mapping based on A-Z Name sorting
const LOCAL_IMAGE_MAPPING = {
  "sport_p7": "1.jpg", "fashion_p8": "2.jpg", "fashion_p4": "3.jpg", "fashion_p1": "4.jpg",
  "fashion_p6": "5.jpg", "auto_p6": "6.jpg", "home_p10": "7.jpg", "furniture_p6": "8.jpg",
  "furniture_p2": "9.jpg", "tech_p5": "10.jpg", "home_p8": "11.jpg", "food_p3": "12.jpg",
  "pet_p10": "13.jpg", "office_p4": "14.jpg", "office_p9": "15.jpg", "baby_p1": "16.jpg",
  "sport_p6": "17.jpg", "agri_p4": "18.jpg", "baby_p3": "19.jpg", "flower_p1": "20.jpg",
  "toy_p3": "21.jpg", "hardware_p6": "22.jpg", "toy_p8": "23.jpg", "fashion_p10": "24.jpg",
  "home_p3": "25.jpg", "hardware_p2": "26.jpg", "bake_p1": "27.jpg", "bake_p5": "28.jpg",
  "hardware_p9": "29.jpg", "auto_p4": "30.jpg", "food_p1": "31.jpg", "toy_p4": "32.jpg",
  "office_p2": "33.jpg", "office_p7": "34.jpg", "food_p5": "35.jpg", "tech_p9": "36.jpg",
  "music_p8": "37.jpg", "pet_p2": "38.jpg", "bake_p7": "39.jpg", "flower_p9": "40.jpg",
  "music_p9": "41.jpg", "fashion_p5": "42.jpg", "agri_p10": "43.jpg", "pet_p4": "44.jpg",
  "tech_p4": "45.jpg", "food_p11": "46.jpg", "health_p5": "47.jpg", "food_p2": "48.jpg",
  "health_p1": "49.jpg", "beauty_p7": "50.jpg", "auto_p5": "51.jpg", "pet_p5": "52.jpg",
  "music_p7": "53.jpg", "hardware_p5": "54.jpg", "sport_p9": "55.jpg", "music_p1": "56.jpg",
  "music_p2": "57.jpg", "music_p5": "58.jpg", "fashion_p9": "59.jpg", "agri_p6": "60.jpg",
  "toy_p6": "61.jpg", "auto_p7": "62.jpg", "home_p5": "63.jpg", "baby_p5": "64.jpg",
  "pet_p6": "65.jpg", "bake_p9": "66.jpg", "food_p7": "67.jpg", "flower_p3": "68.jpg",
  "furniture_p1": "69.jpg", "furniture_p7": "70.jpg", "office_p8": "71.jpg", "furniture_p10": "72.jpg",
  "sport_p1": "73.jpg", "office_p3": "74.jpg", "bake_p8": "75.jpg", "flower_p6": "76.jpg",
  "furniture_p5": "77.jpg", "auto_p9": "78.jpg", "furniture_p8": "79.jpg", "pet_p1": "80.jpg",
  "agri_p1": "81.jpg", "flower_p10": "82.jpg", "flower_p7": "83.jpg", "flower_p8": "84.jpg",
  "tech_p1": "85.jpg", "beauty_p9": "86.jpg", "beauty_p2": "87.jpg", "music_p3": "88.jpg",
  "agri_p7": "89.jpg", "health_p9": "90.jpg", "office_p5": "91.jpg", "home_p7": "92.jpg",
  "furniture_p3": "93.jpg", "agri_p9": "94.jpg", "baby_p4": "95.jpg", "bake_p3": "96.jpg",
  "hardware_p3": "97.jpg", "sport_p8": "98.jpg", "tech_p2": "99.jpg", "flower_p2": "100.jpg",
  "food_p10": "101.jpg", "toy_p1": "102.jpg", "tech_p8": "103.jpg", "auto_p2": "104.jpg",
  "pet_p9": "105.jpg", "agri_p8": "106.jpg", "auto_p3": "107.jpg", "tech_p7": "108.jpg",
  "bake_p4": "109.jpg", "music_p10": "110.jpg", "home_p2": "111.jpg", "baby_p9": "112.jpg",
  "hardware_p1": "113.jpg", "home_p4": "114.jpg", "office_p6": "115.jpg", "home_p9": "116.jpg",
  "beauty_p6": "117.jpg", "bake_p2": "118.jpg", "toy_p2": "119.jpg", "toy_p9": "120.jpg",
  "flower_p4": "121.jpg", "auto_p10": "122.jpg", "auto_p1": "123.jpg", "auto_p8": "124.jpg",
  "home_p1": "125.jpg", "baby_p10": "126.jpg", "beauty_p4": "127.jpg", "hardware_p10": "128.jpg",
  "tech_p10": "129.jpg", "pet_p8": "130.jpg", "hardware_p4": "131.jpg", "pet_p3": "132.jpg",
  "agri_p2": "133.jpg", "beauty_p5": "134.jpg", "food_p6": "135.jpg", "food_p8": "136.jpg",
  "sport_p2": "137.jpg", "baby_p7": "138.jpg", "fashion_p3": "139.jpg", "fashion_p7": "140.jpg",
  "toy_p7": "141.jpg", "tech_p6": "142.jpg", "music_p6": "143.jpg", "health_p4": "144.jpg",
  "beauty_p3": "145.jpg", "bake_p10": "146.jpg", "beauty_p1": "147.jpg", "office_p1": "148.jpg",
  "hardware_p7": "149.jpg", "food_p9": "150.jpg", "baby_p2": "151.jpg", "health_p8": "152.jpg",
  "beauty_p8": "153.jpg", "pet_p7": "154.jpg", "sport_p5": "155.jpg", "furniture_p9": "156.jpg",
  "tech_p3": "157.jpg", "health_p3": "158.jpg", "beauty_p10": "159.jpg", "home_p6": "160.jpg",
  "sport_p4": "161.jpg", "flower_p5": "162.jpg", "agri_p3": "163.jpg", "hardware_p8": "164.jpg",
  "office_p10": "download.jpg", "baby_p8": "166.jpg", "food_p4": "167.jpg", "health_p7": "168.jpg",
  "music_p4": "169.jpg", "furniture_p4": "170.jpg", "bake_p6": "171.jpg", "fashion_p2": "172.jpg",
  "health_p10": "173.jpg", "health_p6": "174.jpg", "health_p2": "175.jpg", "sport_p3": "176.jpg",
  "sport_p10": "177.jpg", "baby_p6": "178.jpg", "toy_p5": "179.jpg", "agri_p5": "180.jpg",
  "toy_p10": "180.jpg"
};

const buildLocalImageMappingByDisplayOrder = (products) => {
    const mapping = {};
    const parents = products
        .filter(p => !p.parent_id)
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

    parents.forEach((product, index) => {
        const imageNo = index + 1;
        if (imageNo === 46) {
            mapping[product.id] = 'coca cola.jpg';
            return;
        }
        if (imageNo === 166) {
            mapping[product.id] = 'download.jpg';
            return;
        }
        const fileNo = imageNo > 46 ? imageNo - 1 : imageNo;
        mapping[product.id] = fileNo <= 180 ? `${fileNo}.jpg` : '180.jpg';
    });

    return mapping;
};

const normalizeMockProducts = (products) => {
    const normalized = [];
    const seen = new Set();
    const localImageMapping = buildLocalImageMappingByDisplayOrder(products);
    
    for (const raw of products) {
        const p = { ...raw };
        
        // Fix barcode templates
        if (typeof p.barcode === 'string' && p.barcode.includes('${baseProduct.barcode}')) {
            const base = String(p.parent_id || '').replace(/_v\d+$/i, '').toUpperCase();
            const variantNo = (String(p.id || '').match(/_v(\d+)$/i) || [])[1] || '1';
            p.barcode = `${base}-V${variantNo}`;
        }
        if (typeof p.attributes === 'string' && p.attributes.includes('${v}')) {
            const variantNo = (String(p.id || '').match(/_v(\d+)$/i) || [])[1] || '1';
            p.attributes = p.attributes.replaceAll('${v}', variantNo);
        }

        // Apply Local Image Mapping
        const mappingId = p.parent_id || p.id;
        if (localImageMapping[mappingId]) {
            p.image_url = `/mocking/mocking/${localImageMapping[mappingId]}`;
        } else {
            // Fallback for any missed products
            p.image_url = 'https://images.unsplash.com/photo-1586880244406-556ebe35f282?q=80&w=500';
        }

        const key = `${p.shop_id || 'guest_shop_v4'}::${String(p.barcode || '').trim()}`;
        if (p.barcode && seen.has(key)) continue;
        if (p.barcode) seen.add(key);
        normalized.push(p);
    }
    return normalized;
};

export const seedGuestData = async (force = false) => {
    if (_currentShopId !== 'guest_shop_v4') return

    const SEED_VERSION = 'v2.1'
    const currentVersion = localStorage.getItem('pos_guest_seed_version')
    if (currentVersion === SEED_VERSION && !force) return

    const db = await initDB()
    console.log('[DB] Refreshing guest data to ' + SEED_VERSION)

    const storesToClear = ['products', 'sales_queue', 'cash_flows'].filter(s => db.objectStoreNames.contains(s))
    const txClear = db.transaction(storesToClear, 'readwrite')
    for (const storeName of storesToClear) {
        const store = txClear.objectStore(storeName)
        // Clear all previous guest shop data
        const oldShops = ['guest_shop', 'guest_shop_v2', 'guest_shop_v3', 'guest_shop_v4']
        for (const shopId of oldShops) {
            const keys = await store.index('shop_id').getAllKeys(shopId)
            for (const key of keys) await store.delete(key)
        }
    }
    await txClear.done

    // Seed Products
    const txProd = db.transaction('products', 'readwrite')
    const normalizedProducts = normalizeMockProducts(MOCK_PRODUCTS)
    for (const p of normalizedProducts) {
        await txProd.store.put({
            ...p,
            shop_id: 'guest_shop_v4',
            search_normalize: String(p.name || '').toLowerCase()
        })
    }
    await txProd.done

    // Seed Sales
    const txSales = db.transaction('sales_queue', 'readwrite')
    for (const s of MOCK_SALES) {
        await txSales.store.put({ ...s, shop_id: 'guest_shop_v4' })
    }
    await txSales.done

    // Seed Cash Flows
    const txCash = db.transaction('cash_flows', 'readwrite')
    for (const c of MOCK_CASHFLOWS) {
        await txCash.store.put({ ...c, shop_id: 'guest_shop_v4', synced: 1 })
    }
    await txCash.done

    localStorage.setItem('pos_guest_seed_version', SEED_VERSION)
    console.log('[DB] Guest data refresh complete.')
    window.location.reload()
}

// === GENERIC STORE HELPERS ===
export const saveProductsToLocal = async (products) => {
    if (!_currentShopId) return
    const db = await initDB()
    const tx = db.transaction('products', 'readwrite')
    const store = tx.objectStore('products')
    for (const product of products) {
        await store.put({
            ...product,
            shop_id: product.shop_id || _currentShopId,
            search_normalize: String(product.name || '').toLowerCase()
        })
    }
    await tx.done
}

export const searchLocalProducts = async (query) => {
    if (!_currentShopId) return []
    const db = await initDB()
    const all = await db.getAllFromIndex('products', 'shop_id', _currentShopId)
    if (!query || !query.trim()) return all.slice(0, 50)
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

export const findProductByBarcode = async (barcode) => {
    if (!barcode) return null
    const db = await initDB()
    const product = await db.getFromIndex('products', 'barcode', barcode)
    if (product?.shop_id && _currentShopId && product.shop_id !== _currentShopId) return null
    return product || null
}

export const getVariantsByParentId = async (parentId) => {
    if (!parentId) return []
    const db = await initDB()
    return db.getAllFromIndex('products', 'parent_id', parentId)
}

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
    const all = await db.getAllFromIndex('sales_queue', 'synced', 0)
    return all.filter(s => s.shop_id === _currentShopId)
}

export const markSaleSynced = async (localId, serverId) => {
    const db = await initDB()
    const tx = db.transaction('sales_queue', 'readwrite')
    const sale = await tx.store.get(localId)
    if (sale) {
        sale.synced = 1
        if (serverId) sale.id = serverId
        await tx.store.put(sale)
    }
    await tx.done
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
    const all = await db.getAll('pending_products')
    return all.filter(p => !p.shop_id || p.shop_id === _currentShopId)
}

export const removePendingProduct = async (id) => {
    const db = await initDB()
    await db.delete('pending_products', id)
}

export const getSalesHistory = async (limit = 50) => {
    if (!_currentShopId) return []
    const db = await initDB()
    const all = await db.getAllFromIndex('sales_queue', 'shop_id', _currentShopId)
    return all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, limit)
}

export const getAllLocalSales = async () => {
    if (!_currentShopId) return []
    const db = await initDB()
    return db.getAllFromIndex('sales_queue', 'shop_id', _currentShopId)
}

export const getAllLocalCashFlows = async () => {
    if (!_currentShopId) return []
    const db = await initDB()
    return db.getAllFromIndex('cash_flows', 'shop_id', _currentShopId)
}

export const getTodayStatsFromLocal = async () => {
    if (!_currentShopId) return { revenue: 0, orders: 0 }
    const db = await initDB()
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const sales = await db.getAllFromIndex('sales_queue', 'shop_id', _currentShopId)
    const todaySales = sales.filter(s => !s.is_void && new Date(s.created_at) >= start)
    return {
        revenue: todaySales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0),
        orders: todaySales.length
    }
}

export const searchSalesHistory = async ({ query, startDate, endDate, barcode } = {}) => {
    let sales = await getAllLocalSales()
    if (startDate) {
        const start = new Date(startDate).toISOString()
        sales = sales.filter(s => s.created_at >= start)
    }
    if (endDate) {
        const end = new Date(endDate).toISOString()
        sales = sales.filter(s => s.created_at <= end)
    }
    if (query) {
        const q = String(query).toLowerCase()
        sales = sales.filter(s =>
            String(s.code || '').toLowerCase().includes(q) ||
            String(s.local_id || '').includes(q)
        )
    }
    if (barcode) {
        const product = await findProductByBarcode(barcode)
        const q = String(barcode).toLowerCase()
        sales = sales.filter(s => (s.items || []).some(item =>
            (product && item.product_id === product.id) ||
            String(item.product_name || item.name || '').toLowerCase().includes(q)
        ))
    }
    return sales.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export const voidSaleLocal = async (localId, reason) => {
    const db = await initDB()
    const tx = db.transaction(['sales_queue', 'products', 'cash_flows'], 'readwrite')
    const sale = await tx.objectStore('sales_queue').get(localId)
    if (!sale || sale.is_void) {
        await tx.done
        return null
    }
    sale.is_void = true
    sale.void_reason = reason
    sale.void_at = new Date().toISOString()
    sale.synced = 0
    await tx.objectStore('sales_queue').put(sale)

    for (const item of (sale.items || [])) {
        const product = await tx.objectStore('products').get(item.product_id)
        if (product) {
            product.stock_quantity = Number(product.stock_quantity || 0) + Number(item.quantity || 0)
            await tx.objectStore('products').put(product)
        }
    }

    await tx.objectStore('cash_flows').add({
        shop_id: sale.shop_id || _currentShopId,
        type: 'OUT',
        amount: Number(sale.total_amount),
        category: 'void',
        description: `[HUỶ] Hoàn tiền đơn hàng #${sale.code || localId}`,
        created_at: new Date().toISOString(),
        synced: 0
    })
    await tx.done
    return sale
}

export const returnSaleLocal = async (localId, { reason, amount, paymentMethod } = {}) => {
    const db = await initDB()
    const tx = db.transaction(['sales_queue', 'products', 'cash_flows'], 'readwrite')
    const sale = await tx.objectStore('sales_queue').get(localId)
    if (!sale || sale.is_void) {
        await tx.done
        return null
    }
    sale.is_void = true
    sale.void_reason = reason || 'Trả hàng'
    sale.void_at = new Date().toISOString()
    sale.synced = 0
    await tx.objectStore('sales_queue').put(sale)

    for (const item of (sale.items || [])) {
        const product = await tx.objectStore('products').get(item.product_id)
        if (product) {
            product.stock_quantity = Number(product.stock_quantity || 0) + Number(item.quantity || 0)
            await tx.objectStore('products').put(product)
        }
    }

    await tx.objectStore('cash_flows').add({
        shop_id: sale.shop_id || _currentShopId,
        type: 'OUT',
        amount: Number(amount || sale.total_amount || 0),
        category: 'return',
        description: `Trả tiền đơn hàng #${sale.code || localId}`,
        ref_id: sale.id || String(localId),
        payment_method: paymentMethod || sale.payment_method || 'cash',
        created_at: new Date().toISOString(),
        synced: 0
    })
    await tx.done
    return sale
}

export const getCachedReport = async (shopId, type, year, month) => {
    const db = await initDB()
    return db.get('reports_cache', `${shopId}_${type}_${year}_${month}`)
}

export const setCachedReport = async (shopId, type, year, month, data) => {
    const db = await initDB()
    await db.put('reports_cache', {
        cache_key: `${shopId}_${type}_${year}_${month}`,
        shop_id: shopId, type, year, month, data,
        cached_at: new Date().toISOString()
    })
}

export const getAttributePresets = async () => {
    if (!_currentShopId) return []
    const db = await initDB()
    return db.getAllFromIndex('attribute_presets', 'shop_id', _currentShopId)
}

export const saveAttributePreset = async (name, attributes) => {
    if (!_currentShopId) return
    const db = await initDB()
    return db.put('attribute_presets', { name, attributes, shop_id: _currentShopId, created_at: new Date().toISOString() })
}

export const deleteAttributePreset = async (id) => {
    const db = await initDB()
    await db.delete('attribute_presets', id)
}
