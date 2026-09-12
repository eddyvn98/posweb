import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import api from '../lib/api'
import { getAllLocalProducts } from '../lib/db'
import { useCart } from './CartContext'

const ShopContext = createContext(null)
const ORDERS_KEY = 'pos_shop_orders'
const CATALOG_KEY = 'pos_shop_catalog'
const PROFILE_KEY = 'pos_shop_profile'
const ADDRESSES_KEY = 'pos_shop_addresses'
const THEME_KEY = 'pos_shop_theme'
const CUSTOMER_TOKEN_KEY = 'pos_shop_customer_token'
const VOUCHER_KEY = 'pos_shop_voucher'
const WISHLIST_KEY = 'pos_shop_wishlist'
const DEFAULT_SHOP = {
    name: 'Văn phòng phẩm 302 Vườn Lài',
    address: '302 Vườn Lài, An Phú Đông, Quận 12, TP.HCM',
    city: 'Hồ Chí Minh',
    phone: '',
    zalo_url: '',
    opening_hours: '',
    pickup_available: true,
    delivery_note: 'Giao quanh Quận 12 · Shop xác nhận phí theo khu vực',
    shipping_fee: null,
    free_shipping_threshold: null,
    bank_name: '',
    bank_account: '',
    bank_owner: '',
}

const getCustomerToken = () => {
    try {
        const saved = localStorage.getItem(CUSTOMER_TOKEN_KEY)
        if (saved) return saved
        const token = uuidv4()
        localStorage.setItem(CUSTOMER_TOKEN_KEY, token)
        return token
    } catch {
        return uuidv4()
    }
}

const demoProducts = [
    { id: 'demo-notebook', name: 'Sổ tay bìa mềm tối giản', category: 'Văn phòng phẩm', price: 39000, online_price: 45000, promo_price: 39000, badge: 'Mới', is_featured: true, stock_quantity: 24, unit: 'Cuốn', barcode: 'DEMO-001', image_url: null },
    { id: 'demo-pen', name: 'Bút gel mực đen 0.5mm', category: 'Văn phòng phẩm', price: 12000, badge: 'Bán chạy', is_featured: true, stock_quantity: 80, unit: 'Cây', barcode: 'DEMO-002', image_url: null },
    { id: 'demo-bottle', name: 'Bình nước giữ nhiệt 500ml', category: 'Vật dụng nhà cửa nhỏ', price: 159000, online_price: 179000, promo_price: 159000, badge: 'Bán chạy', is_featured: true, stock_quantity: 12, unit: 'Cái', barcode: 'DEMO-003', image_url: null },
    { id: 'demo-organizer', name: 'Khay đựng đồ đa năng mini', category: 'Vật dụng nhà cửa nhỏ', price: 69000, online_price: 79000, promo_price: 69000, badge: 'Tiện dụng', stock_quantity: 22, unit: 'Cái', barcode: 'DEMO-004', image_url: null },
    { id: 'demo-lamp', name: 'Đèn bàn LED cảm ứng', category: 'Vật dụng nhà cửa nhỏ', price: 249000, badge: 'Gần hết', stock_quantity: 9, unit: 'Cái', barcode: 'DEMO-005', image_url: null },
    { id: 'demo-sticker', name: 'Sticker trang trí set 20 miếng', category: 'Đồ chơi', price: 29000, badge: 'Mới', is_featured: true, stock_quantity: 40, unit: 'Set', barcode: 'DEMO-006', image_url: null },
]

export const storefrontVouchers = [
    { id: 'SAVE20K', code: 'SAVE20K', title: 'Giảm 20.000đ', description: 'Cho đơn từ 149.000đ', type: 'fixed', value: 20000, minSubtotal: 149000 },
    { id: 'SHOP10', code: 'SHOP10', title: 'Giảm 10%', description: 'Tối đa 30.000đ · Đơn từ 99.000đ', type: 'percent', value: 10, maxDiscount: 30000, minSubtotal: 99000 },
    { id: 'SAVE50K', code: 'SAVE50K', title: 'Giảm 50.000đ', description: 'Cho đơn từ 349.000đ', type: 'fixed', value: 50000, minSubtotal: 349000 },
]

const readJson = (key, fallback) => {
    try {
        const value = localStorage.getItem(key)
        return value ? JSON.parse(value) : fallback
    } catch {
        return fallback
    }
}

const mergeProducts = (remote, local) => {
    const merged = new Map()
    ;(local || []).forEach((product) => merged.set(product.id || product.barcode, product))
    // The inventory API is authoritative when an authenticated operator has
    // changed stock, price, or active state since the local cache was written.
    ;(remote || []).forEach((product) => merged.set(product.id || product.barcode, product))
    return [...merged.values()].filter((product) => product?.is_active !== false)
}

const getStorefrontPricing = (product) => {
    const apiOriginalPrice = Number(product?.original_price)
    if (apiOriginalPrice > Number(product?.price || 0)) {
        return {
            price: Number(product.price || 0),
            original_price: apiOriginalPrice,
            promo_price: Number(product.price || 0),
        }
    }
    const onlinePrice = Number(product?.online_price)
    const offlinePrice = Number(product?.price || 0)
    const originalPrice = onlinePrice > 0 ? onlinePrice : offlinePrice
    const promoPrice = Number(product?.promo_price)
    const hasPromotion = promoPrice > 0 && promoPrice < originalPrice
    return {
        price: hasPromotion ? promoPrice : originalPrice,
        original_price: hasPromotion ? originalPrice : null,
        promo_price: hasPromotion ? promoPrice : null,
    }
}

const toStorefrontProduct = (product) => ({
    ...product,
    ...getStorefrontPricing(product),
})

const calculateVoucherDiscount = (voucher, subtotal) => {
    if (!voucher || subtotal < Number(voucher.minSubtotal || 0)) return 0
    if (voucher.type === 'percent') {
        return Math.min(Math.round(subtotal * Number(voucher.value || 0) / 100), Number(voucher.maxDiscount || Infinity))
    }
    return Math.min(Number(voucher.value || 0), subtotal)
}

const calculateShippingFee = (shop, subtotal) => {
    const fee = Number(shop?.shipping_fee || 0)
    const threshold = Number(shop?.free_shipping_threshold || 0)
    if (!fee || (threshold > 0 && subtotal >= threshold)) return 0
    return fee
}

export const formatVnd = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}đ`

export function ShopProvider({ children }) {
    const { cart, addToCart, removeFromCart, updateQuantity, setQuantity, clearCart, totalAmount, totalItems } = useCart()
    const [products, setProducts] = useState(() => readJson(CATALOG_KEY, []).map(toStorefrontProduct))
    const [catalogLoading, setCatalogLoading] = useState(() => readJson(CATALOG_KEY, []).length === 0)
    const [catalogSource, setCatalogSource] = useState('demo')
    const [orders, setOrders] = useState(() => readJson(ORDERS_KEY, []))
    const [profile, setProfile] = useState(() => readJson(PROFILE_KEY, { name: '', phone: '', email: '' }))
    const [addresses, setAddresses] = useState(() => readJson(ADDRESSES_KEY, []))
    const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light')
    const [voucherSelection, setVoucherSelection] = useState(() => localStorage.getItem(VOUCHER_KEY) || '')
    const [wishlist, setWishlist] = useState(() => readJson(WISHLIST_KEY, []).map(String))
    const [shop, setShop] = useState(() => {
        const saved = readJson('pos_shop', null) || {}
        return { ...DEFAULT_SHOP, ...saved, address: saved.address || DEFAULT_SHOP.address }
    })
    const [customerToken] = useState(getCustomerToken)
    const publicShopId = useMemo(() => {
        if (import.meta.env.VITE_PUBLIC_SHOP_ID) return String(import.meta.env.VITE_PUBLIC_SHOP_ID)
        if (typeof window === 'undefined') return ''
        return new URLSearchParams(window.location.search).get('shop_id') || ''
    }, [])

    const publicApiConfig = useMemo(() => {
        const config = {
            headers: { 'X-Customer-Token': customerToken },
        }
        const effectiveShopId = publicShopId || shop?.id
        if (effectiveShopId) {
            config.params = { shop_id: effectiveShopId }
        }
        return config
    }, [customerToken, publicShopId, shop?.id])

    const loadCatalog = useCallback(async () => {
        setCatalogLoading(true)
        try {
            if (publicApiConfig) {
                try {
                    const response = await api.get('/storefront/products', publicApiConfig)
                    const remote = Array.isArray(response.data) ? response.data : []
                    setProducts(remote.length ? remote.map(toStorefrontProduct) : demoProducts)
                    setCatalogSource(remote.length ? 'inventory' : 'demo')
                } catch {
                    const cached = await getAllLocalProducts()
                    const nextProducts = cached.length ? cached.map(toStorefrontProduct) : demoProducts
                    setProducts(nextProducts)
                    setCatalogSource(cached.length ? 'cache' : 'demo')
                }
                return
            }

            const token = localStorage.getItem('pos_token')
            const local = await getAllLocalProducts()
            if (token) {
                try {
                    const response = await api.get('/products')
                    const remote = Array.isArray(response.data) ? response.data : []
                    const connected = mergeProducts(remote, local)
                    const nextProducts = connected.length ? connected : demoProducts
                    setProducts(nextProducts.map(toStorefrontProduct))
                    localStorage.setItem(CATALOG_KEY, JSON.stringify(nextProducts))
                    setCatalogSource(connected.length ? 'inventory' : 'demo')
                } catch {
                    const nextProducts = local.length ? local : demoProducts
                    setProducts(nextProducts.map(toStorefrontProduct))
                    localStorage.setItem(CATALOG_KEY, JSON.stringify(nextProducts))
                    setCatalogSource(local.length ? 'cache' : 'demo')
                }
            } else {
                const nextProducts = local.length ? local : demoProducts
                setProducts(nextProducts.map(toStorefrontProduct))
                localStorage.setItem(CATALOG_KEY, JSON.stringify(nextProducts))
                setCatalogSource(local.length ? 'cache' : 'demo')
            }
        } catch {
            setProducts(demoProducts)
            localStorage.setItem(CATALOG_KEY, JSON.stringify(demoProducts))
            setCatalogSource('demo')
        } finally {
            setCatalogLoading(false)
        }
    }, [publicApiConfig])

    useEffect(() => { loadCatalog() }, [loadCatalog])

    useEffect(() => {
        if (!publicApiConfig) return
        api.get('/storefront/shop', publicApiConfig)
            .then((response) => {
                if (response.data) setShop((current) => ({ ...current, ...response.data }))
            })
            .catch(() => { /* demo storefront keeps local defaults */ })
    }, [publicApiConfig])

    const loadOrders = useCallback(async () => {
        if (!publicApiConfig) return
        try {
            const response = await api.get('/storefront/orders', publicApiConfig)
            if (Array.isArray(response.data)) setOrders(response.data)
        } catch (error) {
            console.warn('[shop] online orders unavailable, keeping local orders', error?.message)
        }
    }, [publicApiConfig])

    useEffect(() => { loadOrders() }, [loadOrders])

    useEffect(() => {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
    }, [orders])

    useEffect(() => {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    }, [profile])

    useEffect(() => {
        localStorage.setItem(ADDRESSES_KEY, JSON.stringify(addresses))
    }, [addresses])

    useEffect(() => {
        localStorage.setItem(THEME_KEY, theme)
    }, [theme])

    useEffect(() => {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist))
    }, [wishlist])

    const vouchers = storefrontVouchers
    const voucherOptions = useMemo(() => vouchers.map((voucher) => ({
        ...voucher,
        discount: calculateVoucherDiscount(voucher, totalAmount),
        eligible: totalAmount >= Number(voucher.minSubtotal || 0),
    })), [totalAmount])
    const bestVoucher = useMemo(() => voucherOptions
        .filter((voucher) => voucher.eligible && voucher.discount > 0)
        .sort((a, b) => b.discount - a.discount)[0] || null, [voucherOptions])
    const selectedVoucher = useMemo(() => {
        if (voucherSelection === 'none') return null
        if (voucherSelection) {
            const selected = voucherOptions.find((voucher) => voucher.id === voucherSelection && voucher.eligible)
            if (selected) return selected
        }
        return bestVoucher
    }, [bestVoucher, voucherOptions, voucherSelection])
    const voucherDiscount = selectedVoucher?.discount || 0
    const shippingFee = calculateShippingFee(shop, totalAmount)
    const totalAfterVoucher = Math.max(0, totalAmount - voucherDiscount + shippingFee)

    useEffect(() => {
        localStorage.setItem(VOUCHER_KEY, voucherSelection)
    }, [voucherSelection])

    const selectVoucher = useCallback((id) => setVoucherSelection(id || 'none'), [])
    const useBestVoucher = useCallback(() => setVoucherSelection(''), [])

    const toggleWishlist = useCallback((productId) => {
        const id = String(productId)
        setWishlist((current) => current.includes(id) ? current.filter((item) => item !== id) : [id, ...current])
    }, [])
    const isWishlisted = useCallback((productId) => wishlist.includes(String(productId)), [wishlist])

    const saveProfile = useCallback((nextProfile) => setProfile((current) => ({ ...current, ...nextProfile })), [])
    const saveAddress = useCallback((address) => {
        setAddresses((current) => [{ ...address, id: address.id || uuidv4() }, ...current.filter((item) => item.id !== address.id)])
    }, [])
    const removeAddress = useCallback((id) => setAddresses((current) => current.filter((item) => item.id !== id)), [])

    const createOrder = useCallback(async ({ customer, address, paymentMethod, note, voucher }) => {
        const now = new Date().toISOString()
        const order = {
            id: uuidv4(),
            code: `DH${String(Date.now()).slice(-8)}`,
            createdAt: now,
            status: 'awaiting_shipment',
            paymentMethod,
            note: note || '',
            customer,
            address,
            items: cart.map((item) => ({
                product_id: item.product_id || item.id,
                product_name: item.name,
                quantity: item.quantity,
                price: item.price,
                image_url: item.image_url,
            })),
            subtotal: totalAmount,
            voucher: voucher || selectedVoucher ? { code: voucher?.code || selectedVoucher?.code, discount: voucher?.discount || selectedVoucher?.discount || 0 } : null,
            voucherDiscount: voucher?.discount || selectedVoucher?.discount || 0,
            shippingFee,
            total: totalAfterVoucher,
            synced: false,
        }

        if (publicApiConfig) {
            try {
                const response = await api.post('/storefront/orders', {
                    shop_id: publicShopId || shop?.id,
                    customer,
                    address,
                    payment_method: paymentMethod,
                    note: note || '',
                    voucher_code: voucher?.code || selectedVoucher?.code || '',
                    items: order.items.map(({ product_id, quantity }) => ({ product_id, quantity })),
                }, publicApiConfig)
                const remoteOrder = response.data
                setOrders((current) => [remoteOrder, ...current.filter((item) => item.id !== remoteOrder.id)])
                clearCart()
                return remoteOrder
            } catch (error) {
                console.warn('[shop] online order kept locally because public API is unavailable', error?.message)
            }
        }

        const token = localStorage.getItem('pos_token')
        const adminShopId = shop?.id
        if (!publicApiConfig && token && adminShopId && catalogSource === 'inventory') {
            try {
                const sale = {
                    id: order.id,
                    shop_id: adminShopId,
                    code: order.code,
                    total_amount: order.total,
                    payment_method: paymentMethod === 'bank_transfer' ? 'transfer' : 'cash',
                    sale_date: now,
                    items: order.items.map(({ product_id, product_name, quantity, price }) => ({ product_id, product_name, quantity, price })),
                }
                const response = await api.post('/sales', sale)
                order.synced = Boolean(response.data?.success)
                order.saleId = response.data?.id || order.id
            } catch (error) {
                console.warn('[shop] order kept locally because inventory sync failed', error?.message)
            }
        }

        setOrders((current) => [order, ...current])
        clearCart()
        return order
    }, [cart, catalogSource, clearCart, publicApiConfig, publicShopId, selectedVoucher, shippingFee, shop, totalAfterVoucher, totalAmount])

    const updateOrderStatus = useCallback(async (id, status) => {
        if (publicApiConfig && ['cancelled', 'completed'].includes(status)) {
            try {
                const endpoint = status === 'cancelled' ? `/storefront/orders/${id}/cancel` : `/storefront/orders/${id}/complete`
                const response = await api.post(endpoint, { shop_id: publicShopId || shop?.id }, publicApiConfig)
                const updated = response.data
                setOrders((current) => current.map((order) => order.id === id ? updated : order))
                return updated
            } catch (error) {
                console.warn('[shop] order status update unavailable', error?.message)
                return null
            }
        }
        setOrders((current) => current.map((order) => order.id === id ? { ...order, status, updatedAt: new Date().toISOString() } : order))
        return true
    }, [publicApiConfig, publicShopId])

    const value = {
        products, catalogLoading, catalogSource, loadCatalog, shop,
        cart, addToCart, removeFromCart, updateQuantity, setQuantity, clearCart, totalAmount, totalItems,
        shippingFee,
        orders, createOrder, updateOrderStatus, vouchers: voucherOptions, bestVoucher, selectedVoucher, voucherDiscount, totalAfterVoucher, selectVoucher, useBestVoucher,
        wishlist, toggleWishlist, isWishlisted,
        profile, saveProfile, addresses, saveAddress, removeAddress,
        theme, setTheme,
    }

    return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export const useShop = () => useContext(ShopContext)
