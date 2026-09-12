import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ShopProvider, formatVnd, useShop } from '../contexts/ShopContext'

const iconPaths = {
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    moon: <path d="M20 15.2A8.2 8.2 0 0 1 8.8 4 8.2 8.2 0 1 0 20 15.2Z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    cart: <><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 1.9-1.4L20 8H6" /><circle cx="9" cy="19" r="1.2" /><circle cx="17" cy="19" r="1.2" /></>,
    home: <><path d="m3 10 9-7 9 7v10H3Z" /><path d="M9 20v-6h6v6" /></>,
    orders: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 11h8M8 15h5" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
    package: <><path d="m4 7 8-4 8 4v10l-8 4-8-4Z" /><path d="m4 7 8 4 8-4M12 11v10M8 5l8 4" /></>,
    check: <path d="m5 12 4.2 4.2L19 6.5" />,
    rotate: <><path d="M4 10a8 8 0 1 1 2.3 5.7" /><path d="M4 4v6h6" /></>,
    wallet: <><path d="M4 6.5h15a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11" /><path d="M16 12h4M16 12a2 2 0 1 0 0 4h4v-4" /></>,
    bank: <><path d="m3 9 9-6 9 6M5 10v7m4-7v7m6-7v7m4-7v7M3 20h18M2 17h20" /></>,
    mapPin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    spark: <path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7Z" />,
    arrowDown: <path d="M12 4v15m-6-6 6 6 6-6" />,
    arrowLeft: <path d="m15 5-7 7 7 7M8 12h13" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    plus: <path d="M12 5v14M5 12h14" />,
    heart: <path d="M20.8 8.8c0 5.4-8.8 10.7-8.8 10.7S3.2 14.2 3.2 8.8A4.8 4.8 0 0 1 12 5.9a4.8 4.8 0 0 1 8.8 2.9Z" />,
    phone: <path d="M6.5 3.5 9 3l2 4.5-1.8 1.8a14 14 0 0 0 5.5 5.5l1.8-1.8 4.5 2-.5 2.5c-.2 1-1.1 1.7-2.1 1.6A16.5 16.5 0 0 1 4.9 5.6c-.1-1 .6-1.9 1.6-2.1Z" />,
    message: <><path d="M5 5h14v11H9l-4 4Z" /><path d="M8 9h8M8 12h5" /></>,
    gift: <><path d="M4 10h16v10H4Z" /><path d="M3 7h18v3H3Z" /><path d="M12 7v13M12 7c-2.8 0-5-1.2-5-3a2 2 0 0 1 2-2c2.1 0 3 2.7 3 5Zm0 0c2.8 0 5-1.2 5-3a2 2 0 0 0-2-2c-2.1 0-3 2.7-3 5Z" /></>,
    truck: <><path d="M3 6h11v10H3Z" /><path d="M14 10h4l3 3v3h-7Z" /><circle cx="7" cy="18" r="1.8" /><circle cx="18" cy="18" r="1.8" /></>,
    tag: <><path d="m3 12 9-9h7a2 2 0 0 1 2 2v7l-9 9Z" /><circle cx="16" cy="8" r="1.2" /></>,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z" />,
    chevronRight: <path d="m9 5 7 7-7 7" />,
}

function Icon({ name, size = 20, className = '' }) {
    return <svg className={`shop-icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>
}

const statusLabels = {
    awaiting_shipment: { label: 'Chờ vận chuyển', icon: 'package' },
    completed: { label: 'Đã hoàn thành', icon: 'check' },
    cancelled: { label: 'Đã hủy', icon: 'rotate' },
}
const lastPathSegment = (pathname) => pathname.split('/').filter(Boolean).pop() || ''

const productVisual = (product) => {
    const text = `${product.category || ''} ${product.name || ''}`.toLocaleLowerCase('vi')
    if (text.includes('đồ chơi') || text.includes('sticker')) return 'spark'
    if (text.includes('nhà cửa') || text.includes('nước') || text.includes('khay') || text.includes('đèn')) return 'home'
    if (text.includes('văn phòng') || text.includes('bút') || text.includes('sổ')) return 'orders'
    return 'package'
}

const productImage = (product, className = '') => product.image_url && !String(product.image_url).startsWith('tg_file_id:')
    ? <img src={product.image_url} alt={product.name} loading="lazy" decoding="async" className={`h-full w-full object-cover ${className}`} />
    : <div className={`shop-image-fallback shop-image-${productVisual(product)} ${className}`} aria-hidden="true"><span><Icon name={productVisual(product)} size={48} /></span><i /></div>

const categoryIcon = (label = '') => {
    const text = label.toLocaleLowerCase('vi')
    if (text.includes('đồ chơi')) return 'spark'
    if (text.includes('nhà cửa')) return 'home'
    if (text.includes('văn phòng')) return 'orders'
    return 'package'
}

const productPickNote = (product) => {
    if (product.shop_note) return product.shop_note
    const text = `${product.category || ''} ${product.name || ''}`.toLocaleLowerCase('vi')
    if (text.includes('đồ chơi') || text.includes('sticker')) return 'Món vui nhỏ · dễ làm quà'
    if (text.includes('nhà cửa') || text.includes('nước') || text.includes('khay') || text.includes('đèn')) return 'Gọn nhà hơn · dùng mỗi ngày'
    if (text.includes('văn phòng') || text.includes('bút') || text.includes('sổ')) return 'Hợp bàn học · dễ dùng'
    return 'Món nhỏ hữu ích · dễ chọn'
}

const curatedNeeds = [
    { key: 'desk', icon: 'orders', title: 'Bộ bàn học gọn', copy: 'Bút, sổ và món nhỏ cho góc học tập', category: 'Văn phòng phẩm' },
    { key: 'home', icon: 'home', title: 'Góc nhà gọn hơn', copy: 'Đồ dùng nhỏ giúp nhà dễ chịu hơn', category: 'Vật dụng nhà cửa nhỏ' },
    { key: 'play', icon: 'spark', title: 'Món vui cho bé', copy: 'Đồ chơi nhỏ, dễ chọn làm quà', category: 'Đồ chơi' },
    { key: 'budget', icon: 'wallet', title: 'Món nhỏ dưới 50K', copy: 'Dễ mua thêm, không cần cân nhắc lâu', collection: 'under_50k' },
]

const VIEW_SIGNALS_KEY = 'pos_shop_view_signals'
const INITIAL_PRODUCT_COUNT = 4
const PRODUCT_BATCH_SIZE = 4
const INTEREST_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

const readViewSignals = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(VIEW_SIGNALS_KEY) || '{}')
        return saved && typeof saved === 'object' ? saved : {}
    } catch {
        return {}
    }
}

const saveViewSignal = (productId, dwellMs) => {
    if (!productId || dwellMs < 6000) return
    try {
        const signals = readViewSignals()
        const previous = signals[String(productId)] || { dwellMs: 0, views: 0 }
        signals[String(productId)] = {
            dwellMs: Number(previous.dwellMs || 0) + Math.round(dwellMs),
            views: Number(previous.views || 0) + 1,
            lastViewedAt: Date.now(),
        }
        localStorage.setItem(VIEW_SIGNALS_KEY, JSON.stringify(signals))
    } catch { /* ignore storage errors */ }
}

function PriceView({ product, className = '' }) {
    const originalPrice = Number(product.original_price || 0)
    const currentPrice = Number(product.price || 0)
    const hasPromotion = originalPrice > currentPrice
    const discountPercent = hasPromotion ? Math.round((1 - currentPrice / originalPrice) * 100) : 0
    return <div className={`shop-price-view ${className}`}><strong>{formatVnd(product.price)}</strong>{hasPromotion && <><del>{formatVnd(originalPrice)}</del><span>-{discountPercent}%</span></>}</div>
}

function ShopShell({ children }) {
    const navigate = useNavigate()
    const location = useLocation()
    const { shop, totalItems, theme, setTheme } = useShop()
    const [query, setQuery] = useState('')
    const [searchOpen, setSearchOpen] = useState(false)
    const swipeStart = useRef(null)
    const storeName = shop?.name || 'Cửa hàng của bạn'

    useEffect(() => {
        document.title = `${storeName} · Mua sắm online`
        document.documentElement.lang = 'vi'
        const description = document.querySelector('meta[name="description"]') || document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'description' }))
        description.content = `Mua văn phòng phẩm, vật dụng nhà cửa nhỏ và đồ chơi tại ${storeName}. Đặt hàng nhanh, thanh toán COD hoặc chuyển khoản.`
        const structuredData = document.createElement('script')
        structuredData.type = 'application/ld+json'
        structuredData.dataset.shopSeo = 'true'
        structuredData.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Store',
            name: storeName,
            url: window.location.origin,
            telephone: shop.phone || undefined,
            openingHours: shop.opening_hours || undefined,
            address: {
                '@type': 'PostalAddress',
                streetAddress: shop.address,
                addressLocality: shop.city || 'Hồ Chí Minh',
                addressRegion: 'Hồ Chí Minh',
                addressCountry: 'VN',
            },
            areaServed: 'Quận 12, Thành phố Hồ Chí Minh',
        })
        document.head.querySelectorAll('script[data-shop-seo="true"]').forEach((node) => node.remove())
        document.head.appendChild(structuredData)
        let canonical = document.querySelector('link[data-shop-canonical]')
        if (!canonical) {
            canonical = document.createElement('link')
            canonical.rel = 'canonical'
            canonical.dataset.shopCanonical = 'true'
            document.head.appendChild(canonical)
        }
        canonical.href = `${window.location.origin}${location.pathname}`
        return () => structuredData.remove()
    }, [location.pathname, shop, storeName])

    const submitSearch = (event) => {
        event.preventDefault()
        const clean = query.trim()
        navigate(clean ? `/shop?search=${encodeURIComponent(clean)}` : '/shop')
        setSearchOpen(false)
    }

    const tabItems = [
        { to: '/shop', label: 'Shop', icon: 'spark' },
        { to: '/shop/products', label: 'Sản phẩm', icon: 'package' },
        { to: '/shop/categories', label: 'Danh mục', icon: 'home' },
    ]
    const activeTabIndex = tabItems.findIndex((item) => location.pathname === item.to)
    const isShopTab = activeTabIndex >= 0
    const handleGestureStart = (event) => {
        if (!isShopTab) return
        const point = event.changedTouches?.[0] || event
        if (point) swipeStart.current = { x: point.clientX, y: point.clientY }
    }
    const handleGestureEnd = (event) => {
        if (!isShopTab || !swipeStart.current) return
        const point = event.changedTouches?.[0] || event
        const start = swipeStart.current
        swipeStart.current = null
        if (!point) return
        const dx = point.clientX - start.x
        const dy = point.clientY - start.y
        if (Math.abs(dx) < 65 || Math.abs(dx) < Math.abs(dy) * 1.25) return
        const nextIndex = Math.max(0, Math.min(tabItems.length - 1, activeTabIndex + (dx < 0 ? 1 : -1)))
        if (nextIndex !== activeTabIndex) navigate(tabItems[nextIndex].to)
    }

    return (
        <div className={`shop-shell ${theme === 'dark' ? 'shop-dark' : ''}`}>
            <header className="shop-header">
                <div className="shop-container shop-header-inner">
                    <Link to="/shop" className="shop-brand" aria-label={`Về cửa hàng ${storeName}`}>
                        <span className="shop-brand-mark"><Icon name="spark" size={19} /></span>
                        <span className="hidden sm:block">{storeName}</span>
                    </Link>
                    <form onSubmit={submitSearch} className={`shop-search ${searchOpen ? 'shop-search-open' : ''}`} role="search">
                        <Icon name="search" size={18} />
                        <input aria-label="Tìm kiếm sản phẩm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm sản phẩm bạn cần..." />
                        <button className="shop-search-submit" type="submit">Tìm</button>
                    </form>
                    <div className="shop-header-actions">
                        <button className="shop-icon-button sm:hidden" onClick={() => setSearchOpen((open) => !open)} aria-label="Mở tìm kiếm"><Icon name="search" size={20} /></button>
                        <button className="shop-icon-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={19} /></button>
                        <Link to="/shop/cart" className="shop-cart-button" aria-label={`Giỏ hàng, ${totalItems} sản phẩm`}><Icon name="cart" size={19} /><b>{totalItems}</b></Link>
                    </div>
                    <div className="shop-utility-links"><Link to="/shop/orders" aria-label="Đơn mua"><Icon name="orders" size={17} /><span>Đơn mua</span></Link><Link to="/shop/profile" aria-label="Tài khoản"><Icon name="user" size={17} /><span>Tài khoản</span></Link></div>
                </div>
            </header>
            <div className="shop-top-note"><div className="shop-container shop-top-note-inner"><span><Icon name="tag" size={13} /> Giá online riêng</span><span><Icon name="truck" size={13} /> Giao gần Quận 12</span><span><Icon name="gift" size={13} /> Có quà cho đơn đầu</span></div></div>
            {isShopTab && <nav className="shop-top-tabs" aria-label="Điều hướng shop"><div className="shop-container shop-top-tabs-inner">{tabItems.map((item) => <Link key={item.to} to={item.to} className={location.pathname === item.to ? 'active' : ''}><Icon name={item.icon} size={16} />{item.label}</Link>)}</div></nav>}
            <main className={`shop-main ${isShopTab ? 'shop-main-swipeable' : ''}`} onTouchStart={handleGestureStart} onTouchEnd={handleGestureEnd} onPointerDown={handleGestureStart} onPointerUp={handleGestureEnd}>{children}</main>
            <footer className="shop-footer"><div className="shop-container"><span><Icon name="mapPin" size={14} /> {shop.address}</span><small>Mua sắm nhẹ nhàng · Giao hàng tận nơi · Hỗ trợ nhanh</small></div></footer>
        </div>
    )
}

function ProductTile({ product }) {
    const { addToCart, cart, toggleWishlist, isWishlisted } = useShop()
    const [added, setAdded] = useState(false)
    const navigate = useNavigate()
    const cardRef = useRef(null)
    const available = Number(product.stock_quantity) > 0
    const cartQuantity = cart.find((item) => String(item.product_id || item.id) === String(product.id))?.quantity || 0
    const badge = product.badge || (Number(product.stock_quantity) > 0 && Number(product.stock_quantity) <= 10 ? 'Gần hết' : '')
    useEffect(() => {
        if (!cardRef.current || typeof IntersectionObserver === 'undefined') return undefined
        let enteredAt = null
        const saveIfInterested = () => {
            if (!enteredAt) return
            saveViewSignal(product.id, Date.now() - enteredAt)
            enteredAt = null
        }
        const observer = new IntersectionObserver(([entry]) => {
            if (entry?.isIntersecting && entry.intersectionRatio >= .6) {
                if (!enteredAt) enteredAt = Date.now()
            } else {
                saveIfInterested()
            }
        }, { threshold: [.6] })
        observer.observe(cardRef.current)
        return () => {
            saveIfInterested()
            observer.disconnect()
        }
    }, [product.id])
    const add = (event) => {
        event.stopPropagation()
        if (!available || cartQuantity >= Number(product.stock_quantity)) return
        addToCart(product)
        setAdded(true)
        window.setTimeout(() => setAdded(false), 1200)
    }
    return <article ref={cardRef} className="shop-product-card">
        <div className="shop-product-image-wrap"><button className="shop-product-image" onClick={() => navigate(`/shop/product/${product.id}`)} aria-label={`Xem ${product.name}`}>{productImage(product)}</button><button type="button" className={`shop-wishlist-button ${isWishlisted(product.id) ? 'active' : ''}`} onClick={(event) => { event.stopPropagation(); toggleWishlist(product.id) }} aria-label={isWishlisted(product.id) ? `Bỏ yêu thích ${product.name}` : `Thêm ${product.name} vào yêu thích`}><Icon name="heart" size={17} /></button>{badge && <span className="shop-product-badge">{badge}</span>}<button type="button" className="shop-product-quick-add" onClick={add} disabled={!available || cartQuantity >= Number(product.stock_quantity)} aria-label={`Thêm ${product.name} vào giỏ`}>{added ? <Icon name="check" size={16} /> : <Icon name="plus" size={17} />}</button></div>
        <div className="shop-product-body">
            <div className="shop-product-label-row"><p className="shop-product-category">{product.category || 'Sản phẩm mới'}</p>{product.is_featured && <span className="shop-pick-label"><Icon name="spark" size={11} /> Shop chọn</span>}</div>
            <button className="shop-product-name" onClick={() => navigate(`/shop/product/${product.id}`)}>{product.name}</button>
            <p className="shop-product-note"><Icon name="check" size={12} /> {productPickNote(product)}</p>
            <div className="shop-product-meta"><PriceView product={product} /></div>
            <div className="shop-product-proof"><span><Icon name="package" size={12} /> {available ? `Còn ${product.stock_quantity}` : 'Hết hàng'}</span><span><Icon name="shield" size={12} /> Giá online</span></div>
        </div>
    </article>
}

function ShopHome() {
    const { products, catalogLoading, catalogSource, orders, shop } = useShop()
    const location = useLocation()
    const navigate = useNavigate()
    const query = new URLSearchParams(location.search).get('search') || ''
    const [category, setCategory] = useState('Tất cả')
    const [collection, setCollection] = useState('all')
    const [sort, setSort] = useState('featured')
    const [visibleCount, setVisibleCount] = useState(INITIAL_PRODUCT_COUNT)
    const [viewSignals, setViewSignals] = useState(() => readViewSignals())
    const loadMoreRef = useRef(null)
    const categoryLabels = useMemo(() => ['Tất cả', ...new Set(products.map((product) => product.category).filter(Boolean))], [products])
    const filtered = useMemo(() => {
        const normalized = query.toLocaleLowerCase('vi')
        const bestSellerProducts = products.filter((product) => product.badge === 'Bán chạy' || product.is_featured)
        const newProducts = products.filter((product) => product.badge === 'Mới' || product.is_new)
        const collectionProducts = collection === 'under_50k'
            ? products.filter((product) => Number(product.price) <= 50000)
            : collection === 'best_sellers'
                ? (bestSellerProducts.length ? bestSellerProducts : products).slice(0, 8)
                : collection === 'new'
                    ? (newProducts.length ? newProducts : products.slice(-8))
                    : products
        return collectionProducts.filter((product) => (category === 'Tất cả' || product.category === category) && (!normalized || `${product.name} ${product.category || ''}`.toLocaleLowerCase('vi').includes(normalized))).sort((a, b) => sort === 'price_asc' ? a.price - b.price : sort === 'price_desc' ? b.price - a.price : a.name.localeCompare(b.name, 'vi'))
    }, [category, collection, products, query, sort])
    const visibleProducts = filtered.slice(0, visibleCount)
    const hasMore = visibleCount < filtered.length
    const interest = useMemo(() => {
        const interested = Object.entries(viewSignals)
            .filter(([, signal]) => Number(signal?.dwellMs || 0) >= 6000 && Date.now() - Number(signal?.lastViewedAt || 0) <= INTEREST_WINDOW_MS)
            .sort(([, a], [, b]) => Number(b.lastViewedAt || 0) - Number(a.lastViewedAt || 0))
            .map(([id]) => products.find((product) => String(product.id) === String(id)))
            .filter((product) => product && Number(product.stock_quantity) > 0)
        const viewed = interested.slice(0, 2)
        const anchorCategory = viewed[0]?.category
        const related = products
            .filter((product) => !viewed.some((viewedProduct) => String(viewedProduct.id) === String(product.id)) && Number(product.stock_quantity) > 0)
            .sort((a, b) => Number(b.category === anchorCategory) - Number(a.category === anchorCategory))
            .slice(0, 3)
        return { viewed, related }
    }, [products, viewSignals])

    useEffect(() => {
        setVisibleCount(INITIAL_PRODUCT_COUNT)
        setViewSignals(readViewSignals())
    }, [category, collection, query, sort, products.length])

    useEffect(() => {
        if (!hasMore || catalogLoading || typeof IntersectionObserver === 'undefined') return undefined
        const node = loadMoreRef.current
        if (!node) return undefined
        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) setVisibleCount((current) => Math.min(current + PRODUCT_BATCH_SIZE, filtered.length))
        }, { rootMargin: '480px 0px' })
        observer.observe(node)
        return () => observer.disconnect()
    }, [catalogLoading, filtered.length, hasMore])
    const selectNeed = (need) => {
        if (query) navigate('/shop')
        if (need.category) {
            setCategory(need.category)
            setCollection('all')
        } else {
            setCategory('Tất cả')
            setCollection(need.collection || 'all')
        }
        window.requestAnimationFrame(() => document.querySelector('#products')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
    const selectCollection = (key) => {
        setCollection(key)
        setCategory('Tất cả')
        window.requestAnimationFrame(() => document.querySelector('#products')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
    const selectCategory = (label) => {
        setCategory(label)
        setCollection('all')
        window.requestAnimationFrame(() => document.querySelector('#products')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
    return <>
        <section className="shop-container shop-hero shop-hero-modern"><div className="shop-hero-campaign"><div className="shop-hero-copy"><div className="shop-hero-kicker"><Icon name="spark" size={13} /> 302 VƯỜN LÀI · AN PHÚ ĐÔNG</div><span className="shop-eyebrow">VĂN PHÒNG · NHÀ CỬA · ĐỒ CHƠI</span><h1>Món nhỏ,<br /><em>chọn rất kỹ.</em></h1><p>Đồ dùng thật sự hữu ích cho bàn học, góc nhà và những giờ chơi vui hơn. Có sẵn tại shop, giá online riêng.</p><div className="shop-local-note"><Icon name="mapPin" size={15} /> Giao quanh {shop.address || '302 Vườn Lài, Quận 12'}</div><div className="shop-hero-actions"><Link to="#products" className="shop-primary-button">Xem bộ sưu tập <Icon name="chevronRight" size={17} /></Link><Link to="#vouchers" className="shop-hero-voucher"><Icon name="gift" size={16} /> Nhận mã đơn đầu</Link></div><div className="shop-hero-proof"><span><Icon name="check" size={14} /> Shop tự chọn món</span><span><Icon name="package" size={14} /> Kho có sẵn hôm nay</span></div></div><HeroProductShowcase products={products} /></div></section>
        <CategoryShowcase labels={categoryLabels} products={products} activeCategory={category} onSelect={selectCategory} onExplore={() => navigate('/shop/products')} />
        <ShopInfoCard />
        <CuratedNeeds products={products} onSelect={selectNeed} />
        <CampaignShowcase onSelect={selectCollection} />
        <CategorySpotlights products={products} onSelect={selectNeed} />
        <section className="shop-container shop-quick-collections" aria-label="Bộ sưu tập mua nhanh">{[['all', 'Tất cả món'], ['under_50k', 'Dưới 50.000đ'], ['best_sellers', 'Bán chạy'], ['new', 'Mới về']].map(([key, label]) => <button key={key} className={collection === key ? 'active' : ''} onClick={() => { setCollection(key); if (key !== 'all') setCategory('Tất cả') }}>{label}</button>)}</section>
        <VoucherStrip />
        <OfferPopup />
        <section id="products" className="shop-container shop-catalog"><div className="shop-section-heading"><div><span className="shop-eyebrow">GỢI Ý CHO BẠN</span><h2>{query ? `Kết quả cho “${query}”` : 'Sản phẩm nổi bật'}</h2></div><label className="shop-sort">Sắp xếp <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Mới nhất</option><option value="price_asc">Giá thấp đến cao</option><option value="price_desc">Giá cao đến thấp</option></select></label></div>
            <div className="shop-source-note">{catalogSource === 'inventory' ? '● Đang hiển thị tồn kho quản trị' : catalogSource === 'cache' ? '● Đang hiển thị bản lưu offline' : '● Chế độ xem thử · Có thể kết nối kho quản trị'}</div>
            {catalogLoading ? <div className="shop-empty"><span className="shop-spinner" />Đang tải sản phẩm...</div> : filtered.length ? <><div className="shop-product-grid">{visibleProducts.map((product) => <ProductTile key={product.id || product.barcode} product={product} />)}</div>{hasMore && <div ref={loadMoreRef} className="shop-infinite-sentinel" aria-live="polite"><span className="shop-spinner" />Đang tìm thêm món hợp với bạn...</div>}{!hasMore && filtered.length > INITIAL_PRODUCT_COUNT && <div className="shop-catalog-end"><Icon name="check" size={15} /> Bạn đã xem hết danh sách này</div>}{interest.viewed.length > 0 && (visibleCount > INITIAL_PRODUCT_COUNT || !hasMore) && <InterestRecall viewed={interest.viewed} related={interest.related} />}</> : <div className="shop-empty"><Icon name="search" size={48} /><p>Chưa tìm thấy sản phẩm phù hợp.</p><button onClick={() => navigate('/shop')}>Xóa tìm kiếm</button></div>}
        </section><ReorderStrip orders={orders} products={products} /><RecentlyViewed products={products} />
    </>
}

function ShopProductsPage() {
    const { products, catalogLoading, catalogSource } = useShop()
    const location = useLocation()
    const navigate = useNavigate()
    const params = new URLSearchParams(location.search)
    const query = params.get('search') || ''
    const initialCategory = params.get('category') || 'Tất cả'
    const initialCollection = params.get('collection') || 'all'
    const [category, setCategory] = useState(initialCategory)
    const [collection, setCollection] = useState(initialCollection)
    const [sort, setSort] = useState('featured')
    const [visibleCount, setVisibleCount] = useState(INITIAL_PRODUCT_COUNT)
    const [viewSignals, setViewSignals] = useState(() => readViewSignals())
    const loadMoreRef = useRef(null)
    const categoryLabels = useMemo(() => ['Tất cả', ...new Set(products.map((product) => product.category).filter(Boolean))], [products])
    const filtered = useMemo(() => {
        const normalized = query.toLocaleLowerCase('vi')
        const bestSellerProducts = products.filter((product) => product.badge === 'Bán chạy' || product.is_featured)
        const newProducts = products.filter((product) => product.badge === 'Mới' || product.is_new)
        const collectionProducts = collection === 'under_50k'
            ? products.filter((product) => Number(product.price) <= 50000)
            : collection === 'best_sellers'
                ? (bestSellerProducts.length ? bestSellerProducts : products).slice(0, 8)
                : collection === 'new'
                    ? (newProducts.length ? newProducts : products.slice(-8))
                    : products
        return collectionProducts.filter((product) => (category === 'Tất cả' || product.category === category) && (!normalized || `${product.name} ${product.category || ''}`.toLocaleLowerCase('vi').includes(normalized))).sort((a, b) => sort === 'price_asc' ? a.price - b.price : sort === 'price_desc' ? b.price - a.price : a.name.localeCompare(b.name, 'vi'))
    }, [category, collection, products, query, sort])
    const visibleProducts = filtered.slice(0, visibleCount)
    const hasMore = visibleCount < filtered.length
    const interest = useMemo(() => {
        const interested = Object.entries(viewSignals).filter(([, signal]) => Number(signal?.dwellMs || 0) >= 6000 && Date.now() - Number(signal?.lastViewedAt || 0) <= INTEREST_WINDOW_MS).sort(([, a], [, b]) => Number(b.lastViewedAt || 0) - Number(a.lastViewedAt || 0)).map(([id]) => products.find((product) => String(product.id) === String(id))).filter((product) => product && Number(product.stock_quantity) > 0)
        const viewed = interested.slice(0, 2)
        const anchorCategory = viewed[0]?.category
        const related = products.filter((product) => !viewed.some((viewedProduct) => String(viewedProduct.id) === String(product.id)) && Number(product.stock_quantity) > 0).sort((a, b) => Number(b.category === anchorCategory) - Number(a.category === anchorCategory)).slice(0, 3)
        return { viewed, related }
    }, [products, viewSignals])
    useEffect(() => {
        setCategory(initialCategory === 'Tất cả' || categoryLabels.includes(initialCategory) ? initialCategory : 'Tất cả')
        setCollection(['all', 'under_50k', 'best_sellers', 'new'].includes(initialCollection) ? initialCollection : 'all')
    }, [initialCategory, initialCollection, categoryLabels])
    useEffect(() => {
        setVisibleCount(INITIAL_PRODUCT_COUNT)
        setViewSignals(readViewSignals())
    }, [category, collection, query, sort, products.length])
    useEffect(() => {
        if (!hasMore || catalogLoading || typeof IntersectionObserver === 'undefined') return undefined
        const node = loadMoreRef.current
        if (!node) return undefined
        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) setVisibleCount((current) => Math.min(current + PRODUCT_BATCH_SIZE, filtered.length))
        }, { rootMargin: '480px 0px' })
        observer.observe(node)
        return () => observer.disconnect()
    }, [catalogLoading, filtered.length, hasMore])
    const selectCategory = (label) => {
        setCategory(label)
        setCollection('all')
    }
    return <div className="shop-container shop-page-space shop-products-page"><div className="shop-products-intro"><div><span className="shop-eyebrow">KHO ĐANG CÓ SẴN</span><h1>{query ? `Tìm “${query}”` : 'Sản phẩm'}</h1><p>Giá online riêng, chọn nhanh theo nhóm và thêm vào giỏ chỉ một chạm.</p></div><div className="shop-products-intro-badge"><Icon name="package" size={18} /><span><b>{products.length} món</b><small>đang có trong kho</small></span></div></div><CategoryShowcase labels={categoryLabels} products={products} activeCategory={category} onSelect={selectCategory} onExplore={() => { setCategory('Tất cả'); setCollection('all') }} /><section className="shop-products-results" id="products"><div className="shop-section-heading"><div><span className="shop-eyebrow">GỢI Ý CHO BẠN</span><h2>{category === 'Tất cả' ? 'Tất cả sản phẩm' : category}</h2></div><label className="shop-sort">Sắp xếp <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Mới nhất</option><option value="price_asc">Giá thấp đến cao</option><option value="price_desc">Giá cao đến thấp</option></select></label></div><section className="shop-quick-collections" aria-label="Bộ sưu tập mua nhanh">{[['all', 'Tất cả món'], ['under_50k', 'Dưới 50.000đ'], ['best_sellers', 'Bán chạy'], ['new', 'Mới về']].map(([key, label]) => <button key={key} className={collection === key ? 'active' : ''} onClick={() => { setCollection(key); if (key !== 'all') setCategory('Tất cả') }}>{label}</button>)}</section><div className="shop-source-note">{catalogSource === 'inventory' ? '● Đang hiển thị tồn kho quản trị' : catalogSource === 'cache' ? '● Đang hiển thị bản lưu offline' : '● Chế độ xem thử · Có thể kết nối kho quản trị'}</div>{catalogLoading ? <div className="shop-empty"><span className="shop-spinner" />Đang tải sản phẩm...</div> : filtered.length ? <><div className="shop-product-grid">{visibleProducts.map((product) => <ProductTile key={product.id || product.barcode} product={product} />)}</div>{hasMore && <div ref={loadMoreRef} className="shop-infinite-sentinel" aria-live="polite"><span className="shop-spinner" />Đang tìm thêm món hợp với bạn...</div>}{!hasMore && filtered.length > INITIAL_PRODUCT_COUNT && <div className="shop-catalog-end"><Icon name="check" size={15} /> Bạn đã xem hết danh sách này</div>}{interest.viewed.length > 0 && (visibleCount > INITIAL_PRODUCT_COUNT || !hasMore) && <InterestRecall viewed={interest.viewed} related={interest.related} />}</> : <div className="shop-empty"><Icon name="search" size={48} /><p>Chưa tìm thấy sản phẩm phù hợp.</p><button onClick={() => navigate('/shop/products')}>Xóa bộ lọc</button></div>}</section></div>
}

function ShopCategoriesPage() {
    const { products } = useShop()
    const navigate = useNavigate()
    const selectCategory = (label) => navigate(label === 'Tất cả' ? '/shop/products' : `/shop/products?category=${encodeURIComponent(label)}`)
    const selectNeed = (need) => navigate(need.category ? `/shop/products?category=${encodeURIComponent(need.category)}` : '/shop/products?collection=under_50k')
    return <div className="shop-page-space shop-categories-page"><div className="shop-container shop-page-lead"><span className="shop-eyebrow">DANH MỤC GỌN, CHỌN DỄ</span><h1>Mua theo nơi bạn muốn sắp xếp</h1><p>Không phải lướt qua hàng nghìn món. Chọn một góc nhỏ, shop gom đúng nhóm sản phẩm cho bạn.</p></div><CategoryShowcase labels={['Tất cả', ...new Set(products.map((product) => product.category).filter(Boolean))]} products={products} activeCategory="" onSelect={selectCategory} onExplore={() => navigate('/shop/products')} /><CuratedNeeds products={products} onSelect={selectNeed} /><CampaignShowcase onSelect={(key) => navigate(`/shop/products?collection=${key}`)} /><CategorySpotlights products={products} onSelect={selectNeed} /></div>
}

function HeroProductShowcase({ products = [] }) {
    const featured = products.filter((product) => Number(product.stock_quantity) > 0).slice(0, 3)
    return <div className="shop-hero-showcase" aria-label="Sản phẩm shop chọn"><div className="shop-hero-showcase-top"><span><Icon name="star" size={12} /> SHOP CHỌN</span><small>mua nhanh · dùng thật</small></div><div className="shop-hero-product-stack">{featured.map((product, index) => <Link key={product.id} to={`/shop/product/${product.id}`} className={`shop-hero-product shop-hero-product-${index}`}><div className="shop-hero-product-image">{productImage(product)}</div><span><b>{product.name}</b><small>{formatVnd(product.price)}</small></span></Link>)}{featured.length === 0 && <div className="shop-hero-empty-art"><Icon name="package" size={62} /><b>Kho nhỏ, chọn kỹ</b></div>}</div><div className="shop-hero-showcase-bottom"><span><Icon name="check" size={14} /> Giá online tốt hơn</span><span><Icon name="mapPin" size={14} /> Giao gần {shortLocation()}</span></div></div>
}

function shortLocation() {
    return 'Quận 12'
}

function CategoryShowcase({ labels = [], products = [], activeCategory, onSelect, onExplore }) {
    const industryLabels = labels.filter((label) => label !== 'Tất cả')
    return <section className="shop-container shop-category-showcase" aria-label="Ngành hàng"><div className="shop-category-showcase-heading"><div><span className="shop-eyebrow">KHÁM PHÁ SHOP 302 VƯỜN LÀI</span><h2>Ngành hàng</h2></div><button className="shop-category-explore" onClick={onExplore || (() => onSelect('Tất cả'))}>Xem tất cả <Icon name="chevronRight" size={16} /></button></div><div className="shop-category-grid">{industryLabels.map((label, index) => { const categoryProducts = products.filter((product) => product.category === label); const preview = categoryProducts.find((product) => Number(product.stock_quantity) > 0) || categoryProducts[0]; const count = categoryProducts.filter((product) => Number(product.stock_quantity) > 0).length; return <button key={label} className={`shop-category-card shop-category-tone-${index % 4} ${activeCategory === label ? 'active' : ''}`} onClick={() => onSelect(label)}><span className="shop-category-product-art">{preview ? productImage(preview) : <span className="shop-category-icon"><Icon name={categoryIcon(label)} size={25} /></span>}</span><span className="shop-category-copy"><b>{label}</b><small>{count} món có sẵn</small></span></button> })}</div></section>
}

function CampaignShowcase({ onSelect }) {
    return <section className="shop-container shop-campaign-grid" aria-label="Ưu đãi nổi bật"><button className="shop-campaign-card shop-campaign-blue" onClick={() => onSelect('under_50k')}><span className="shop-campaign-icon"><Icon name="gift" size={25} /></span><span className="shop-campaign-copy"><small>ĐƠN NHỎ, VUI LỚN</small><b>Thêm món dưới 50K</b><span>Mua thêm một món hữu ích, không cần cân nhắc lâu.</span><em>Xem bộ sưu tập <Icon name="chevronRight" size={14} /></em></span><span className="shop-campaign-shape shop-campaign-shape-one" /><span className="shop-campaign-shape shop-campaign-shape-two" /></button><button className="shop-campaign-card shop-campaign-light" onClick={() => onSelect('best_sellers')}><span className="shop-campaign-icon"><Icon name="star" size={24} /></span><span className="shop-campaign-copy"><small>SHOP ĐÃ THỬ VÀ CHỌN</small><b>Món được mua nhiều</b><span>Những lựa chọn dễ dùng cho lần ghé đầu tiên.</span><em>Xem món bán chạy <Icon name="chevronRight" size={14} /></em></span><span className="shop-campaign-shape shop-campaign-shape-three" /></button></section>
}

const spotlightGroups = [
    { key: 'office', match: 'văn phòng', icon: 'orders', eyebrow: 'GÓC BÀN HỌC', title: 'Làm việc gọn hơn mỗi ngày', copy: 'Bút, sổ và đồ nhỏ dễ dùng' },
    { key: 'home', match: 'nhà cửa', icon: 'home', eyebrow: 'GÓC NHÀ', title: 'Nhà gọn, ngày nhẹ hơn', copy: 'Vật dụng nhỏ nhưng dùng rất thường xuyên' },
    { key: 'toy', match: 'đồ chơi', icon: 'spark', eyebrow: 'GÓC VUI CHO BÉ', title: 'Món vui dễ chọn làm quà', copy: 'Đồ chơi nhỏ, vui và vừa túi tiền' },
]

function CategorySpotlights({ products = [], onSelect }) {
    const groups = spotlightGroups.map((group) => ({ ...group, products: products.filter((product) => `${product.category || ''} ${product.name || ''}`.toLocaleLowerCase('vi').includes(group.match) && Number(product.stock_quantity) > 0).slice(0, 4) })).filter((group) => group.products.length > 0)
    if (!groups.length) return null
    return <div className="shop-spotlights">{groups.map((group) => <section className="shop-container shop-spotlight" key={group.key}><div className="shop-spotlight-head"><div><span className="shop-eyebrow"><Icon name={group.icon} size={12} /> {group.eyebrow}</span><h2>{group.title}</h2><p>{group.copy}</p></div><button className="shop-spotlight-link" onClick={() => onSelect({ category: group.match === 'nhà cửa' ? 'Vật dụng nhà cửa nhỏ' : group.match === 'đồ chơi' ? 'Đồ chơi' : 'Văn phòng phẩm' })}>Xem tất cả <Icon name="chevronRight" size={15} /></button></div><div className="shop-spotlight-grid">{group.products.map((product) => <SpotlightCard key={product.id} product={product} />)}</div></section>)}</div>
}

function SpotlightCard({ product }) {
    const { addToCart, cart } = useShop()
    const [added, setAdded] = useState(false)
    const inCart = cart.find((item) => String(item.product_id || item.id) === String(product.id))?.quantity || 0
    const available = Number(product.stock_quantity) > 0 && inCart < Number(product.stock_quantity)
    const add = () => {
        if (!available) return
        addToCart(product)
        setAdded(true)
        window.setTimeout(() => setAdded(false), 1200)
    }
    return <article className="shop-spotlight-card"><Link to={`/shop/product/${product.id}`} className="shop-spotlight-card-link"><div className="shop-spotlight-image">{productImage(product)}</div><div className="shop-spotlight-body">{product.is_featured && <span className="shop-spotlight-picked"><Icon name="star" size={10} /> Shop chọn</span>}<b>{product.name}</b><PriceView product={product} /><small>{available ? `Còn ${product.stock_quantity} món` : 'Hết hàng'}</small></div></Link><button className="shop-spotlight-add" onClick={add} disabled={!available} aria-label={`Thêm ${product.name} vào giỏ`}>{added ? <Icon name="check" size={15} /> : <Icon name="plus" size={15} />}</button></article>
}

function CuratedNeeds({ products = [], onSelect }) {
    const { addToCart } = useShop()
    const [addedKey, setAddedKey] = useState('')
    if (!products.length) return null
    const getProducts = (need) => products.filter((product) => {
        if (Number(product.stock_quantity) <= 0) return false
        if (need.category) return product.category === need.category
        return Number(product.price) <= 50000
    })
    const addBundle = (event, need) => {
        event.stopPropagation()
        const bundle = getProducts(need).slice(0, 3)
        bundle.forEach((product) => addToCart(product))
        if (!bundle.length) return
        setAddedKey(need.key)
        window.setTimeout(() => setAddedKey(''), 1200)
    }
    return <section className="shop-container shop-needs" aria-label="Mua theo nhu cầu"><div className="shop-needs-heading"><div><span className="shop-eyebrow">CHỌN NHANH THEO VIỆC</span><h2>Không cần tìm lâu</h2></div><p>Shop gom sẵn vài món hợp nhau để bạn chọn nhanh hơn.</p></div><div className="shop-needs-grid">{curatedNeeds.map((need) => { const bundle = getProducts(need); const count = bundle.length; const preview = bundle[0]; const lowestPrice = bundle.reduce((lowest, product) => Math.min(lowest, Number(product.price) || 0), Infinity); return <article className={`shop-need-card shop-need-${need.key}`} key={need.key}><button className="shop-need-main" onClick={() => onSelect(need)}><span className="shop-need-image">{preview ? productImage(preview) : <span className="shop-need-image-empty"><Icon name={need.icon} size={48} /></span>}<span className="shop-need-image-badge"><Icon name={need.icon} size={12} /> {count ? `${count} món` : 'Sắp có'}</span></span><span className="shop-need-content"><span className="shop-need-kicker"><Icon name="spark" size={11} /> CHỌN NHANH</span><span className="shop-need-copy"><b>{need.title}</b><small>{need.copy}</small><em>{count ? `${count} món có sẵn` : 'Đang bổ sung'}</em></span>{Number.isFinite(lowestPrice) && lowestPrice > 0 && <strong className="shop-need-price">Từ {formatVnd(lowestPrice)}</strong>}</span><Icon name="arrowLeft" size={17} className="shop-need-arrow" /></button><button type="button" className="shop-need-add" onClick={(event) => addBundle(event, need)} disabled={!count}>{addedKey === need.key ? <><Icon name="check" size={13} /> Đã thêm bộ</> : <><Icon name="plus" size={13} /> Thêm bộ</>}</button></article> })}</div></section>
}

function ShopInfoCard() {
    const { shop } = useShop()
    const phone = String(shop.phone || '').replace(/[^+\d]/g, '')
    return <section className="shop-container shop-info-card shop-local-trust-card" aria-label="Thông tin giao nhận của shop"><div className="shop-local-signature"><span><Icon name="shield" size={14} /> SHOP ĐỊA PHƯƠNG</span><i /><b>302 VƯỜN LÀI</b></div><div className="shop-local-metrics"><div className="shop-local-metric"><strong>302</strong><b>VƯỜN LÀI</b><small>An Phú Đông · Quận 12</small></div><div className="shop-local-metric"><strong className="shop-local-metric-icon"><Icon name="truck" size={36} /></strong><b>GIAO GẦN</b><small>Ưu tiên khu vực Quận 12</small></div></div><div className="shop-local-divider" /><div className="shop-local-bottom"><div className="shop-local-address"><span className="shop-eyebrow">SHOP NHỎ, CHỌN KỸ</span><h2>{shop.name}</h2><p><Icon name="mapPin" size={13} /> {shop.address}</p><div className="shop-local-badges"><span><Icon name="spark" size={12} /> Đồ nhỏ hữu ích</span><span><Icon name="wallet" size={12} /> COD tiện lợi</span></div></div><div className="shop-local-details"><div><Icon name="clock" size={17} /><span><b>{shop.opening_hours || 'Phản hồi nhanh'}</b><small>{shop.opening_hours ? 'Giờ mở cửa' : 'Shop xác nhận đơn trong ngày'}</small></span></div><div><Icon name="package" size={17} /><span><b>{shop.pickup_available ? 'Có nhận tại shop' : 'Giao tận nơi'}</b><small>{shop.delivery_note || 'Giao theo khu vực'}</small></span></div></div><div className="shop-info-actions">{phone && <a href={`tel:${phone}`} className="shop-ghost-button"><Icon name="phone" size={16} /> Gọi shop</a>}{shop.zalo_url && <a href={shop.zalo_url} target="_blank" rel="noreferrer" className="shop-ghost-button"><Icon name="message" size={16} /> Chat Zalo</a>}<a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`} target="_blank" rel="noreferrer" className="shop-ghost-button"><Icon name="mapPin" size={16} /> Xem bản đồ</a></div></div></section>
}

function WishlistButton({ product }) {
    const { toggleWishlist, isWishlisted } = useShop()
    const active = isWishlisted(product.id)
    return <button type="button" className={`shop-detail-wishlist ${active ? 'active' : ''}`} onClick={() => toggleWishlist(product.id)} aria-label={active ? `Bỏ yêu thích ${product.name}` : `Thêm ${product.name} vào yêu thích`}><Icon name="heart" size={17} /> {active ? 'Đã lưu yêu thích' : 'Lưu yêu thích'}</button>
}

function RecommendationCard({ product, actionLabel = 'Thêm' }) {
    const { addToCart } = useShop()
    const [added, setAdded] = useState(false)
    const add = () => {
        addToCart(product)
        setAdded(true)
        window.setTimeout(() => setAdded(false), 1200)
    }
    return <article className="shop-reco-card"><Link to={`/shop/product/${product.id}`} className="shop-reco-card-main"><div className="shop-reco-image">{productImage(product)}</div><div className="shop-reco-copy"><b>{product.name}</b><PriceView product={product} /></div></Link><button onClick={add}>{added ? <><Icon name="check" size={14} /> Đã thêm</> : <><Icon name="plus" size={14} /> {actionLabel}</>}</button></article>
}

function ReorderStrip({ orders = [], products = [] }) {
    const reorderable = useMemo(() => {
        const seen = new Set()
        return orders.flatMap((order) => order.items || []).filter((item) => {
            const id = String(item.product_id || item.id || '')
            if (!id || seen.has(id)) return false
            seen.add(id)
            return true
        }).map((item) => products.find((product) => String(product.id) === String(item.product_id || item.id))).filter(Boolean).slice(0, 4)
    }, [orders, products])
    if (!reorderable.length) return null
    return <section className="shop-container shop-reco-section" aria-label="Mua lại nhanh"><div className="shop-section-heading"><div><span className="shop-eyebrow">ĐÃ MUA TRƯỚC ĐÂY</span><h2>Mua lại nhanh</h2></div><span className="shop-voucher-hint"><Icon name="rotate" size={15} /> Không cần tìm lại</span></div><div className="shop-reco-grid">{reorderable.map((product) => <RecommendationCard key={product.id} product={product} actionLabel="Mua lại" />)}</div></section>
}

function RecentlyViewed({ products = [] }) {
    const [recentIds, setRecentIds] = useState([])
    useEffect(() => {
        try { setRecentIds(JSON.parse(localStorage.getItem('pos_shop_recent_products') || '[]')) } catch { setRecentIds([]) }
    }, [products.length])
    const recentProducts = recentIds.map((id) => products.find((product) => String(product.id) === String(id))).filter(Boolean).slice(0, 4)
    if (!recentProducts.length) return null
    return <section className="shop-container shop-reco-section" aria-label="Sản phẩm vừa xem"><div className="shop-section-heading"><div><span className="shop-eyebrow">GỢI Ý CỦA BẠN</span><h2>Vừa xem</h2></div></div><div className="shop-reco-grid">{recentProducts.map((product) => <RecommendationCard key={product.id} product={product} />)}</div></section>
}

function InterestRecall({ viewed = [], related = [] }) {
    const anchor = viewed[0]
    if (!anchor) return null
    return <section className="shop-container shop-interest-recall" aria-label="Gợi ý theo sản phẩm đã xem lâu"><div className="shop-interest-recall-head"><div><span className="shop-eyebrow">DÀNH RIÊNG CHO BẠN</span><h2>Vẫn còn quan tâm?</h2><p>Bạn đã dành thời gian xem kỹ món này. Mình giữ lại để bạn không phải tìm lại.</p></div><span className="shop-interest-recall-icon"><Icon name="heart" size={22} /></span></div><div className="shop-interest-viewed">{viewed.map((product) => <Link key={product.id} to={`/shop/product/${product.id}`} className="shop-interest-anchor"><div className="shop-interest-image">{productImage(product)}</div><span><small>Đã xem lâu</small><b>{product.name}</b><PriceView product={product} /></span><Icon name="arrowLeft" size={18} className="shop-interest-arrow" /></Link>)}</div>{related.length > 0 && <div className="shop-interest-related"><div className="shop-interest-related-title"><span><Icon name="spark" size={15} /> Có thể hợp với món bạn vừa xem</span><small>Gợi ý liên quan</small></div><div className="shop-interest-related-grid">{related.map((product) => <RecommendationCard key={product.id} product={product} />)}</div></div>}</section>
}

function VoucherStrip() {
    const { vouchers, selectedVoucher, selectVoucher } = useShop()
    return <section id="vouchers" className="shop-container shop-voucher-section" aria-label="Voucher ưu đãi"><div className="shop-section-heading"><div><span className="shop-eyebrow">ƯU ĐÃI HÔM NAY</span><h2>Chọn voucher, mua tiết kiệm hơn</h2></div><span className="shop-voucher-hint"><Icon name="spark" size={15} /> Tự chọn voucher tốt nhất</span></div><div className="shop-voucher-row">{vouchers.map((voucher) => <article className={`shop-voucher-card ${selectedVoucher?.id === voucher.id ? 'selected' : ''}`} key={voucher.id}><div className="shop-voucher-ticket"><Icon name="spark" size={19} /></div><div><b>{voucher.title}</b><small>{voucher.description}</small></div><button onClick={() => selectVoucher(voucher.id)}>{selectedVoucher?.id === voucher.id ? 'Đã lưu' : 'Lưu mã'}</button></article>)}</div></section>
}

function OfferPopup() {
    const { selectVoucher, totalItems } = useShop()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    useEffect(() => {
        if (totalItems > 0) return undefined
        try {
            if (sessionStorage.getItem('pos_shop_offer_seen') === '1') return undefined
        } catch { /* ignore storage errors */ }
        const timer = window.setTimeout(() => setOpen(true), 4500)
        return () => window.clearTimeout(timer)
    }, [totalItems])
    if (!open) return null
    const close = () => {
        try { sessionStorage.setItem('pos_shop_offer_seen', '1') } catch { /* ignore storage errors */ }
        setOpen(false)
    }
    const claim = () => {
        selectVoucher('SHOP10')
        close()
        navigate('/shop#vouchers')
    }
    return <div className="shop-offer-backdrop" role="presentation" onClick={close}><section className="shop-offer-popup" role="dialog" aria-modal="true" aria-labelledby="shop-offer-title" onClick={(event) => event.stopPropagation()}><button className="shop-offer-close" onClick={close} aria-label="Đóng ưu đãi"><Icon name="close" size={18} /></button><span className="shop-offer-icon"><Icon name="spark" size={24} /></span><span className="shop-eyebrow">QUÀ TẶNG CHO BẠN</span><h2 id="shop-offer-title">Giảm 10% cho đơn đầu tiên</h2><p>Lưu mã SHOP10 để mua văn phòng phẩm, đồ gia dụng nhỏ và đồ chơi với giá tốt hơn.</p><button className="shop-primary-button shop-full-button" onClick={claim}>Nhận voucher SHOP10</button><small>Đơn tối thiểu 99.000đ · Giảm tối đa 30.000đ</small></section></div>
}

function ProductDetail() {
    const id = lastPathSegment(useLocation().pathname)
    const navigate = useNavigate()
    const { products, addToCart, catalogLoading, shop, shippingFee } = useShop()
    const product = products.find((item) => String(item.id) === String(id))
    const [quantity, setQuantity] = useState(1)
    useEffect(() => {
        if (!product?.id) return
        try {
            const recent = JSON.parse(localStorage.getItem('pos_shop_recent_products') || '[]')
            const next = [product.id, ...recent.filter((recentId) => String(recentId) !== String(product.id))].slice(0, 6)
            localStorage.setItem('pos_shop_recent_products', JSON.stringify(next))
        } catch { /* ignore storage errors */ }
    }, [product?.id])
    useEffect(() => {
        if (!product?.id) return undefined
        let activeSince = document.visibilityState === 'visible' ? Date.now() : null
        let dwellMs = 0
        let saved = false
        const pause = () => {
            if (activeSince) {
                dwellMs += Date.now() - activeSince
                activeSince = null
            }
        }
        const resume = () => {
            if (!activeSince) activeSince = Date.now()
        }
        const persist = () => {
            if (saved) return
            pause()
            saveViewSignal(product.id, dwellMs)
            saved = true
        }
        const onVisibilityChange = () => document.visibilityState === 'hidden' ? pause() : resume()
        const dwellTimer = window.setTimeout(() => {
            if (document.visibilityState === 'visible') persist()
        }, 6000)
        document.addEventListener('visibilitychange', onVisibilityChange)
        return () => {
            window.clearTimeout(dwellTimer)
            document.removeEventListener('visibilitychange', onVisibilityChange)
            persist()
        }
    }, [product?.id])
    useEffect(() => {
        if (!product) return undefined
        const previousTitle = document.title
        const description = document.querySelector('meta[name="description"]')
        const previousDescription = description?.content
        document.title = `${product.name} · ${shop.name}`
        if (description) description.content = `${product.name}. Giá online ${formatVnd(product.price)}. Đặt hàng tại ${shop.name}, giao quanh ${shop.city || 'TP.HCM'}.`
        const structuredData = document.createElement('script')
        structuredData.type = 'application/ld+json'
        structuredData.dataset.shopProductSeo = 'true'
        structuredData.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description || `${product.name} tại ${shop.name}`,
            image: product.image_url ? [product.image_url] : undefined,
            category: product.category || undefined,
            sku: product.barcode || product.id,
            offers: {
                '@type': 'Offer',
                priceCurrency: 'VND',
                price: Number(product.price || 0),
                availability: Number(product.stock_quantity) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                url: `${window.location.origin}/shop/product/${product.id}`,
                seller: { '@type': 'Organization', name: shop.name },
            },
        })
        document.head.querySelectorAll('script[data-shop-product-seo="true"]').forEach((node) => node.remove())
        document.head.appendChild(structuredData)
        return () => {
            structuredData.remove()
            document.title = previousTitle
            if (description && previousDescription !== undefined) description.content = previousDescription
        }
    }, [product, shop])
    if (catalogLoading) return <div className="shop-container shop-empty shop-page-space"><span className="shop-spinner" />Đang tải sản phẩm...</div>
    if (!product) return <div className="shop-container shop-empty shop-page-space"><Icon name="package" size={48} /><p>Không tìm thấy sản phẩm.</p><Link to="/shop" className="shop-primary-button">Về trang sản phẩm</Link></div>
    const available = Number(product.stock_quantity) > 0
    const add = () => { for (let index = 0; index < quantity; index += 1) addToCart(product); navigate('/shop/cart') }
    const buyNow = () => { for (let index = 0; index < quantity; index += 1) addToCart(product); navigate('/shop/checkout') }
    const relatedProducts = products.filter((item) => String(item.id) !== String(product.id) && item.category === product.category && Number(item.stock_quantity) > 0).slice(0, 3)
    return <div className="shop-container shop-detail shop-page-space"><button className="shop-back-button" onClick={() => navigate(-1)}><Icon name="arrowLeft" size={17} /> Quay lại</button><div className="shop-detail-card"><div className="shop-detail-image-wrap shop-detail-image-wrap-main"><div className="shop-detail-image">{productImage(product)}</div><WishlistButton product={product} /></div><div className="shop-detail-info"><p className="shop-product-category">{product.category || 'Sản phẩm mới'}</p><h1>{product.name}</h1><PriceView product={product} className="shop-detail-price-view" /><div className="shop-detail-choice-note"><Icon name="spark" size={16} /><span><b>{product.is_featured ? 'Shop chọn món này' : 'Gợi ý nhanh từ shop'}</b><small>{productPickNote(product)}</small></span></div><p className="shop-detail-stock">{available ? `Còn ${product.stock_quantity} ${product.unit || 'sản phẩm'} trong kho` : 'Sản phẩm tạm hết hàng'}</p>{product.description && <p className="shop-detail-description">{product.description}</p>}<div className="shop-detail-perks"><span><Icon name="check" size={14} /> Hàng có sẵn</span><span><Icon name="shield" size={14} /> Đổi trả dễ dàng</span><span><Icon name="mapPin" size={14} /> Giao quanh Quận 12</span></div><div className="shop-quantity-row"><span>Số lượng</span><div className="shop-quantity"><button onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Giảm số lượng">−</button><b>{quantity}</b><button onClick={() => setQuantity((value) => Math.min(Number(product.stock_quantity) || 1, value + 1))} aria-label="Tăng số lượng">+</button></div></div><div className="shop-detail-actions"><button className="shop-primary-button shop-full-button" disabled={!available} onClick={add}>{available ? 'Thêm vào giỏ' : 'Hết hàng'}</button><button className="shop-ghost-button shop-full-button" disabled={!available} onClick={buyNow}>Mua ngay</button></div><p className="shop-detail-delivery"><Icon name="package" size={16} /> {shop.delivery_note || 'Shop xác nhận phí giao theo khu vực'}{shippingFee > 0 ? ` · Phí dự kiến ${formatVnd(shippingFee)}` : ''}</p></div></div>{relatedProducts.length > 0 && <section className="shop-reco-section shop-detail-related"><div className="shop-section-heading"><div><span className="shop-eyebrow">MUA KÈM THÔNG MINH</span><h2>Có thể bạn cũng thích</h2></div></div><div className="shop-reco-grid">{relatedProducts.map((item) => <RecommendationCard key={item.id} product={item} />)}</div></section>}</div>
}

function CartPage() {
    const navigate = useNavigate()
    const { cart, totalAmount, totalAfterVoucher, voucherDiscount, shippingFee, shop, totalItems, selectedVoucher, vouchers, updateQuantity, removeFromCart, selectVoucher } = useShop()
    const [showVouchers, setShowVouchers] = useState(false)
    const shippingLabel = shippingFee > 0 ? formatVnd(shippingFee) : Number(shop.shipping_fee || 0) > 0 ? 'Miễn phí' : 'Shop xác nhận'
    return <div className="shop-container shop-page-space"><div className="shop-section-heading"><div><span className="shop-eyebrow">GIỎ HÀNG CỦA BẠN</span><h1>Kiểm tra lại đơn</h1></div><Link to="/shop" className="shop-ghost-button">← Tiếp tục mua</Link></div>{cart.length ? <div className="shop-cart-layout"><div className="shop-cart-list">{cart.map((item) => <div className="shop-cart-item" key={item.product_id || item.id}><div className="shop-cart-thumb">{productImage(item)}</div><div className="shop-cart-item-content"><Link to={`/shop/product/${item.product_id || item.id}`}>{item.name}</Link><PriceView product={item} className="shop-cart-price" /><div className="shop-cart-item-actions"><div className="shop-quantity"><button onClick={() => updateQuantity(item.product_id || item.id, -1)} aria-label="Giảm số lượng">−</button><b>{item.quantity}</b><button onClick={() => updateQuantity(item.product_id || item.id, 1)} aria-label="Tăng số lượng">+</button></div><button className="shop-remove-button" onClick={() => removeFromCart(item.product_id || item.id)}>Xóa</button></div></div><div className="shop-cart-line-total"><strong>{formatVnd(item.price * item.quantity)}</strong>{item.original_price && <del>{formatVnd(item.original_price * item.quantity)}</del>}</div></div>)}<BundleSuggestions cart={cart} /></div><aside className="shop-summary-card"><h2>Tóm tắt đơn hàng</h2><div><span>Tạm tính ({totalItems} sản phẩm)</span><b>{formatVnd(totalAmount)}</b></div><button className="shop-voucher-preview-toggle" onClick={() => setShowVouchers((value) => !value)}><span><Icon name="spark" size={16} /> {selectedVoucher ? `Đã chọn ${selectedVoucher.code}` : 'Xem voucher đang có'}</span><Icon name="arrowDown" size={15} className={showVouchers ? 'shop-chevron-open' : ''} /></button>{showVouchers && <div className="shop-voucher-preview-list">{vouchers.map((voucher) => <button key={voucher.id} disabled={!voucher.eligible} className={selectedVoucher?.id === voucher.id ? 'active' : ''} onClick={() => selectVoucher(voucher.id)}><span><b>{voucher.code}</b><small>{voucher.title}</small></span><strong>{voucher.eligible ? `-${formatVnd(voucher.discount)}` : voucher.description}</strong></button>)}</div>}{selectedVoucher && <div className="shop-discount-row"><span><Icon name="check" size={15} /> Voucher {selectedVoucher.code}</span><b>-{formatVnd(voucherDiscount)}</b></div>}<div><span>Phí vận chuyển</span><b className={shippingFee ? '' : 'shop-free'}>{shippingLabel}</b></div><hr /><div className="shop-summary-total"><span>Thanh toán dự kiến</span><b>{formatVnd(totalAfterVoucher)}</b></div><button className="shop-primary-button shop-full-button" onClick={() => navigate('/shop/checkout')}>Tiến hành đặt hàng <Icon name="arrowDown" size={17} className="rotate-[-90deg]" /></button><small>{shop.delivery_note || 'Phí giao được xác nhận theo khu vực trước khi giao.'}</small></aside></div> : <div className="shop-empty"><Icon name="cart" size={48} /><p>Giỏ hàng đang trống.</p><Link to="/shop" className="shop-primary-button">Xem sản phẩm</Link></div>}</div>
}

function BundleSuggestions({ cart = [] }) {
    const { products } = useShop()
    const cartIds = new Set(cart.map((item) => String(item.product_id || item.id)))
    const suggestions = products.filter((product) => !cartIds.has(String(product.id)) && Number(product.stock_quantity) > 0).slice(0, 3)
    if (!suggestions.length) return null
    return <section className="shop-bundle-suggestions" aria-label="Gợi ý mua kèm"><div><span className="shop-eyebrow">MUA KÈM THÔNG MINH</span><h2>Thêm một món cho đủ đơn</h2></div><div className="shop-reco-grid">{suggestions.map((product) => <RecommendationCard key={product.id} product={product} />)}</div></section>
}

function CheckoutPage() {
    const navigate = useNavigate()
    const { cart, totalAmount, totalAfterVoucher, voucherDiscount, shippingFee, shop, selectedVoucher, vouchers, selectVoucher, useBestVoucher, profile, addresses, saveProfile, saveAddress, createOrder, lastPhone, profilesByPhone } = useShop()
    const initialPhone = profile.phone || lastPhone || ''
    const cachedProfile = profilesByPhone[initialPhone] || {}
    const [form, setForm] = useState({
        name: profile.name || cachedProfile.name || '',
        phone: initialPhone,
        address: addresses[0]?.address || cachedProfile.address || '',
        ward: addresses[0]?.ward || cachedProfile.ward || '',
        city: addresses[0]?.city || cachedProfile.city || '',
        note: '',
    })
    const [payment, setPayment] = useState('cod')
    const [saving, setSaving] = useState(false)
    const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

    const handleSelectPhone = (phoneKey) => {
        const p = profilesByPhone[phoneKey]
        if (!p) return
        setForm((prev) => ({
            ...prev,
            phone: p.phone || phoneKey,
            name: p.name || prev.name,
            address: p.address || prev.address,
            ward: p.ward || prev.ward,
            city: p.city || prev.city,
        }))
    }

    const handlePhoneChange = (event) => {
        const val = event.target.value
        const clean = val.replace(/[^\d+]/g, '').trim()
        const matched = profilesByPhone[clean] || (clean.startsWith('+84') ? profilesByPhone['0' + clean.slice(3)] : null)
        if (matched) {
            setForm((prev) => ({
                ...prev,
                phone: val,
                name: prev.name || matched.name || '',
                address: prev.address || matched.address || '',
                ward: prev.ward || matched.ward || '',
                city: prev.city || matched.city || '',
            }))
        } else {
            setForm((prev) => ({ ...prev, phone: val }))
        }
    }

    if (!cart.length) return <div className="shop-container shop-empty shop-page-space"><Icon name="cart" size={48} /><p>Giỏ hàng đang trống.</p><Link to="/shop" className="shop-primary-button">Về cửa hàng</Link></div>
    const submit = async (event) => { event.preventDefault(); if (!form.name.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim()) return; setSaving(true); saveProfile({ name: form.name, phone: form.phone }); saveAddress({ name: form.name, phone: form.phone, address: form.address, ward: form.ward, city: form.city }); const order = await createOrder({ customer: { name: form.name, phone: form.phone }, address: { address: form.address, ward: form.ward, city: form.city }, paymentMethod: payment, note: form.note, voucher: selectedVoucher }); setSaving(false); navigate(`/shop/order-success/${order.id}`) }
    const shippingLabel = shippingFee > 0 ? formatVnd(shippingFee) : Number(shop.shipping_fee || 0) > 0 ? 'Miễn phí' : 'Shop xác nhận'
    const savedPhoneKeys = Object.keys(profilesByPhone || {})
    return <div className="shop-container shop-page-space"><button className="shop-back-button" onClick={() => navigate('/shop/cart')}>← Giỏ hàng</button><div className="shop-checkout-layout"><form className="shop-form-card" onSubmit={submit}><div className="shop-form-heading"><span className="shop-step">1</span><div><span className="shop-eyebrow">GIAO HÀNG</span><h1>Thông tin nhận hàng</h1></div></div><p className="shop-guest-note"><Icon name="check" size={15} /> Mua không cần tạo tài khoản · Trình duyệt tự động lưu và gợi ý thông tin theo Số điện thoại cho lần sau.</p><div className="shop-form-grid"><label className="shop-span-2">Số điện thoại nhận hàng<input required type="tel" name="phone" value={form.phone} onChange={handlePhoneChange} placeholder="09xx xxx xxx" inputMode="tel" autoComplete="tel" list="saved-phones" /><datalist id="saved-phones">{savedPhoneKeys.map((key) => <option key={key} value={key}>{profilesByPhone[key]?.name || ''}</option>)}</datalist>{savedPhoneKeys.length > 0 && <div className="shop-phone-chips"><span style={{ fontSize: '11px', color: 'var(--shop-muted)' }}>Gợi ý đã lưu:</span>{savedPhoneKeys.map((key) => <button type="button" key={key} className="shop-phone-chip" onClick={() => handleSelectPhone(key)}>{key} {profilesByPhone[key]?.name ? `(${profilesByPhone[key].name})` : ''}</button>)}</div>}</label><label>Họ và tên<input required value={form.name} onChange={set('name')} placeholder="Nguyễn Văn An" autoComplete="name" /></label><label>Tỉnh / thành phố<input required value={form.city} onChange={set('city')} placeholder="Tỉnh / thành phố" autoComplete="address-level1" /></label><label className="shop-span-2">Địa chỉ nhận hàng<input required value={form.address} onChange={set('address')} placeholder="Số nhà, tên đường" autoComplete="street-address" /></label><label className="shop-span-2">Phường / xã<input value={form.ward} onChange={set('ward')} placeholder="Phường, xã" /></label><label className="shop-span-2">Ghi chú cho người bán<textarea value={form.note} onChange={set('note')} placeholder="Ví dụ: Giao giờ hành chính" rows="3" /></label></div><div className="shop-delivery-card"><Icon name="mapPin" size={18} /><span><b>{shop.pickup_available ? 'Giao tận nơi hoặc nhận tại shop' : 'Giao tận nơi'}</b><small>{shop.delivery_note || 'Shop xác nhận khu vực và phí giao trước khi giao hàng.'}</small></span></div><div className="shop-form-heading shop-payment-heading"><span className="shop-step">2</span><div><span className="shop-eyebrow">THANH TOÁN</span><h2>Chọn phương thức</h2></div></div><div className="shop-payment-options"><button type="button" className={payment === 'cod' ? 'active' : ''} onClick={() => setPayment('cod')}><span><Icon name="wallet" size={24} /></span><div><b>Thanh toán khi nhận hàng</b><small>Thanh toán COD cho shipper</small></div>{payment === 'cod' && <i><Icon name="check" size={14} /></i>}</button><button type="button" className={payment === 'bank_transfer' ? 'active' : ''} onClick={() => setPayment('bank_transfer')}><span><Icon name="bank" size={24} /></span><div><b>Chuyển khoản ngân hàng</b><small>Shop xác nhận sau khi nhận được tiền</small></div>{payment === 'bank_transfer' && <i><Icon name="check" size={14} /></i>}</button></div>{payment === 'bank_transfer' && <div className="shop-bank-note">{shop.bank_name || shop.bank_account ? <><b>{shop.bank_name || 'Ngân hàng'}</b><br />Số tài khoản: <strong>{shop.bank_account || 'Shop sẽ gửi sau'}</strong>{shop.bank_owner && <><br />Chủ tài khoản: <strong>{shop.bank_owner}</strong></>}</> : 'Sau khi đặt hàng, shop sẽ gửi thông tin tài khoản để bạn chuyển khoản.'}</div>}<div className="shop-voucher-picker"><div className="shop-voucher-picker-head"><div><span className="shop-eyebrow">VOUCHER</span><h2>Ưu đãi cho đơn hàng</h2></div><button type="button" onClick={useBestVoucher}><Icon name="spark" size={14} /> Tự chọn tốt nhất</button></div><div className="shop-voucher-options">{vouchers.map((voucher) => <button type="button" key={voucher.id} disabled={!voucher.eligible} className={selectedVoucher?.id === voucher.id ? 'active' : ''} onClick={() => selectVoucher(voucher.id)}><span className="shop-voucher-radio">{selectedVoucher?.id === voucher.id && <Icon name="check" size={13} />}</span><span><b>{voucher.code} · {voucher.title}</b><small>{voucher.description}</small></span><strong>{voucher.eligible ? `-${formatVnd(voucher.discount)}` : 'Chưa đủ điều kiện'}</strong></button>)}</div>{selectedVoucher ? <p className="shop-voucher-applied"><Icon name="check" size={15} /> Đang giảm {formatVnd(voucherDiscount)} với mã {selectedVoucher.code}</p> : <p className="shop-voucher-muted">Thêm sản phẩm để mở khóa voucher tốt nhất.</p>}</div><button className="shop-primary-button shop-full-button shop-submit-mobile" disabled={saving}>{saving ? 'Đang tạo đơn...' : 'Đặt hàng ngay'}</button></form><aside className="shop-summary-card shop-checkout-summary"><h2>Đơn hàng ({cart.length})</h2>{cart.map((item) => <div className="shop-mini-item" key={item.product_id || item.id}><span>{item.name} <b>×{item.quantity}</b><PriceView product={item} className="shop-mini-price" /></span><strong>{formatVnd(item.price * item.quantity)}</strong></div>)}<div><span>Tạm tính</span><b>{formatVnd(totalAmount)}</b></div>{selectedVoucher && <div className="shop-discount-row"><span><Icon name="check" size={15} /> {selectedVoucher.code}</span><b>-{formatVnd(voucherDiscount)}</b></div>}<div><span>Phí vận chuyển</span><b className={shippingFee ? '' : 'shop-free'}>{shippingLabel}</b></div><hr /><div className="shop-summary-total"><span>Tổng thanh toán</span><b>{formatVnd(totalAfterVoucher)}</b></div><small><Icon name="lock" size={14} /> Thông tin được lưu an toàn trên thiết bị này.</small></aside></div></div>
}

function OrderSuccess() {
    const id = lastPathSegment(useLocation().pathname)
    const { orders } = useShop()
    const order = orders.find((item) => item.id === id)
    return <div className="shop-container shop-success shop-page-space"><div className="shop-success-icon"><Icon name="check" size={38} /></div><span className="shop-eyebrow">ĐẶT HÀNG THÀNH CÔNG</span><h1>Cảm ơn bạn đã mua hàng!</h1><p>Đơn <strong>{order?.code || id}</strong> đã được ghi nhận. Shop sẽ liên hệ để xác nhận và chuẩn bị giao.</p><div className="shop-success-actions"><Link to={`/shop/orders/${id}`} className="shop-primary-button">Theo dõi đơn hàng</Link><Link to="/shop" className="shop-ghost-button">Tiếp tục mua sắm</Link></div></div>
}

function OrdersPage({ detail = false }) {
    const id = lastPathSegment(useLocation().pathname)
    const { orders, updateOrderStatus, lastPhone, lookupOrdersByPhone } = useShop()
    const [tab, setTab] = useState('all')
    const [phoneInput, setPhoneInput] = useState(lastPhone || '')
    const [searching, setSearching] = useState(false)
    const [searchedPhone, setSearchedPhone] = useState(lastPhone || '')
    const selected = orders.find((order) => order.id === id)
    if (detail) return <OrderDetail order={selected} onCancel={() => updateOrderStatus(id, 'cancelled')} onComplete={() => updateOrderStatus(id, 'completed')} />

    const handleSearchPhone = async (e) => {
        if (e) e.preventDefault()
        const clean = phoneInput.trim()
        if (!clean) return
        setSearching(true)
        await lookupOrdersByPhone(clean)
        setSearchedPhone(clean)
        setSearching(false)
    }

    const tabs = [['all', 'Tất cả'], ['awaiting_shipment', 'Chờ vận chuyển'], ['completed', 'Hoàn thành'], ['cancelled', 'Đã hủy']]
    const shown = orders.filter((order) => tab === 'all' || order.status === tab)
    return <div className="shop-container shop-page-space"><div className="shop-section-heading"><div><span className="shop-eyebrow">ĐƠN MUA</span><h1>Theo dõi đơn hàng</h1></div><Link to="/shop" className="shop-ghost-button">Mua thêm</Link></div><div className="shop-phone-lookup-card"><form onSubmit={handleSearchPhone} className="shop-phone-lookup-form"><label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--shop-text)' }}>Tra cứu đơn hàng bằng Số điện thoại (không cần mật khẩu)</label><div className="shop-phone-lookup-row"><input type="tel" inputMode="tel" autoComplete="tel" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="Nhập số điện thoại đặt hàng (VD: 09xx xxx xxx)" /><button type="submit" disabled={searching}>{searching ? 'Đang tìm...' : 'Tra cứu đơn'}</button></div>{searchedPhone && <span className="shop-phone-lookup-hint">Đang hiển thị đơn hàng của số: <b>{searchedPhone}</b></span>}</form></div><div className="shop-order-tabs">{tabs.map(([key, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}{key === 'all' ? ` (${orders.length})` : ''}</button>)}</div>{shown.length ? <div className="shop-orders-list">{shown.map((order) => <OrderCard key={order.id} order={order} />)}</div> : <div className="shop-empty"><Icon name="package" size={48} /><p>Chưa có đơn hàng nào{searchedPhone ? ` cho số ${searchedPhone}` : ''}.</p><Link to="/shop" className="shop-primary-button">Mua sắm ngay</Link></div>}</div>
}

function OrderCard({ order }) {
    const status = statusLabels[order.status] || statusLabels.awaiting_shipment
    return <Link className="shop-order-card" to={`/shop/orders/${order.id}`}><div className="shop-order-card-head"><span>Đơn {order.code}</span><b><Icon name={status.icon} size={15} /> {status.label}</b></div><div className="shop-order-card-body">{order.items.slice(0, 2).map((item) => <div className="shop-mini-item" key={`${order.id}-${item.product_id}`}><div className="shop-cart-thumb">{productImage(item, 'text-2xl')}</div><span>{item.product_name} <b>×{item.quantity}</b></span><strong>{formatVnd(item.price * item.quantity)}</strong></div>)}</div><div className="shop-order-card-foot"><span>{order.items.length} sản phẩm · {new Date(order.createdAt).toLocaleDateString('vi-VN')}</span><strong>{formatVnd(order.total)}</strong></div></Link>
}

function OrderDetail({ order, onCancel, onComplete }) {
    const navigate = useNavigate()
    if (!order) return <div className="shop-container shop-empty shop-page-space"><Icon name="search" size={48} /><p>Không tìm thấy đơn hàng.</p><Link to="/shop/orders" className="shop-primary-button">Về đơn mua</Link></div>
    const status = statusLabels[order.status] || statusLabels.awaiting_shipment
    const timeline = [['awaiting_shipment', 'Đã đặt hàng', 'Shop đã nhận được đơn'], ['completed', 'Hoàn thành', 'Cảm ơn bạn đã mua hàng']]
    return <div className="shop-container shop-page-space"><button className="shop-back-button" onClick={() => navigate('/shop/orders')}>← Đơn mua</button><div className="shop-order-detail"><div className="shop-order-status"><span><Icon name={status.icon} size={38} /></span><div><h1>{status.label}</h1><p>Đơn {order.code} · {new Date(order.createdAt).toLocaleString('vi-VN')}</p></div></div>{order.status === 'cancelled' ? <div className="shop-bank-note">Đơn hàng này đã được hủy. Bạn có thể quay lại cửa hàng để đặt đơn mới.</div> : <div className="shop-timeline">{timeline.map(([key, label, copy], index) => <div className={order.status === key || (order.status === 'completed' && index === 0) ? 'active' : ''} key={key}><span>{index === 0 ? <Icon name="check" size={14} /> : <Icon name="spark" size={10} />}</span><div><b>{label}</b><small>{copy}</small></div></div>)}</div>}<section className="shop-detail-section"><h2>Sản phẩm</h2>{order.items.map((item) => <div className="shop-mini-item" key={`${order.id}-${item.product_id}`}><span>{item.product_name} <b>×{item.quantity}</b></span><strong>{formatVnd(item.price * item.quantity)}</strong></div>)}</section><section className="shop-detail-section"><h2>Người nhận</h2><p><strong>{order.customer.name}</strong> · {order.customer.phone}<br />{order.address.address}, {order.address.ward}{order.address.ward ? ', ' : ''}{order.address.city}</p></section><section className="shop-detail-section"><h2>Thanh toán</h2><p>{order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng'} · <strong>{formatVnd(order.total)}</strong></p>{order.voucher && <p className="shop-discount-row"><span><Icon name="check" size={14} /> {order.voucher.code}</span><b>-{formatVnd(order.voucherDiscount)}</b></p>}{Number(order.shippingFee || 0) > 0 && <p className="shop-discount-row"><span>Phí vận chuyển</span><b>{formatVnd(order.shippingFee)}</b></p>}</section>{order.status === 'awaiting_shipment' && <div className="shop-success-actions"><button className="shop-primary-button" onClick={onComplete}>Đã nhận hàng</button><button className="shop-danger-button" onClick={onCancel}>Hủy đơn hàng</button></div>}</div></div>
}

function ProfilePage() {
    const { profile, saveProfile, addresses, saveAddress, removeAddress, products, wishlist, lastPhone, profilesByPhone } = useShop()
    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState(profile)
    const [addressForm, setAddressForm] = useState({ name: profile.name || '', phone: profile.phone || '', address: '', ward: '', city: '' })
    const set = (key, target = setForm) => (event) => target((current) => ({ ...current, [key]: event.target.value }))
    const wishlistProducts = wishlist.map((id) => products.find((product) => String(product.id) === String(id))).filter(Boolean)
    return <div className="shop-container shop-page-space"><div className="shop-section-heading"><div><span className="shop-eyebrow">TÀI KHOẢN & SỐ ĐIỆN THOẠI</span><h1>Xin chào{profile.name ? `, ${profile.name}` : ''}</h1></div><span className="shop-profile-avatar">{(profile.name || 'B').charAt(0).toUpperCase()}</span></div><p className="shop-guest-note" style={{ marginBottom: '16px' }}><Icon name="check" size={15} /> Mua sắm tiện lợi: Không cần tài khoản & mật khẩu. Lịch sử đơn hàng, địa chỉ và thông tin nhận hàng được tự động lưu trên trình duyệt và nhận diện theo Số điện thoại của bạn.</p><section className="shop-profile-card"><div className="shop-profile-card-head"><h2>Thông tin người nhận</h2><button className="shop-ghost-button" onClick={() => setEditing((value) => !value)}>{editing ? 'Đóng' : 'Chỉnh sửa'}</button></div>{editing ? <form className="shop-form-grid" onSubmit={(event) => { event.preventDefault(); saveProfile(form); setEditing(false) }}><label>Họ và tên<input value={form.name || ''} onChange={set('name')} /></label><label>Số điện thoại<input value={form.phone || ''} onChange={set('phone')} inputMode="tel" /></label><label className="shop-span-2">Email<input value={form.email || ''} onChange={set('email')} type="email" /></label><button className="shop-primary-button" type="submit">Lưu thông tin</button></form> : <div className="shop-profile-read"><p><b>{profile.name || 'Chưa cập nhật tên'}</b></p><p>{profile.phone || (lastPhone ? `Số điện thoại gần nhất: ${lastPhone}` : 'Chưa cập nhật số điện thoại')}</p><p>{profile.email || 'Thông tin được ghi nhớ tự động khi bạn đặt hàng.'}</p></div>}</section><section className="shop-profile-card"><div className="shop-profile-card-head"><h2>Địa chỉ nhận hàng</h2><span className="shop-count-badge">{addresses.length}</span></div>{addresses.map((address) => <div className="shop-address-row" key={address.id}><div><b>{address.name}</b><span>{address.phone}</span><p>{address.address}, {address.ward}{address.ward ? ', ' : ''}{address.city}</p></div><button className="shop-remove-button" onClick={() => removeAddress(address.id)}>Xóa</button></div>)}<form className="shop-address-form" onSubmit={(event) => { event.preventDefault(); if (!addressForm.address || !addressForm.city) return; saveAddress(addressForm); setAddressForm({ name: profile.name || '', phone: profile.phone || '', address: '', ward: '', city: '' }) }}><h3>+ Thêm địa chỉ mới</h3><div className="shop-form-grid"><label>Người nhận<input required value={addressForm.name} onChange={set('name', setAddressForm)} /></label><label>Số điện thoại<input required value={addressForm.phone} onChange={set('phone', setAddressForm)} inputMode="tel" /></label><label className="shop-span-2">Địa chỉ<input required value={addressForm.address} onChange={set('address', setAddressForm)} /></label><label>Phường / xã<input value={addressForm.ward} onChange={set('ward', setAddressForm)} /></label><label>Tỉnh / thành phố<input required value={addressForm.city} onChange={set('city', setAddressForm)} /></label></div><button className="shop-primary-button" type="submit">Lưu địa chỉ</button></form></section><section className="shop-profile-card shop-wishlist-section"><div className="shop-profile-card-head"><div><span className="shop-eyebrow">ĐỂ DÀNH SAU</span><h2>Sản phẩm yêu thích</h2></div><span className="shop-count-badge">{wishlistProducts.length}</span></div>{wishlistProducts.length ? <div className="shop-reco-grid">{wishlistProducts.map((product) => <RecommendationCard key={product.id} product={product} />)}</div> : <div className="shop-profile-empty"><Icon name="heart" size={28} /><p>Lưu sản phẩm bạn thích để quay lại mua nhanh hơn.</p><Link to="/shop" className="shop-ghost-button">Khám phá sản phẩm</Link></div>}</section></div>
}


export default function Shop() {
    return <ShopProvider><ShopRouterView /></ShopProvider>
}

export function ShopRouterView() {
    const location = useLocation()
    let content = <ShopHome />
    if (location.pathname === '/shop/products') content = <ShopProductsPage />
    else if (location.pathname === '/shop/categories') content = <ShopCategoriesPage />
    if (location.pathname === '/shop/cart') content = <CartPage />
    else if (location.pathname === '/shop/checkout') content = <CheckoutPage />
    else if (location.pathname === '/shop/orders') content = <OrdersPage />
    else if (location.pathname.startsWith('/shop/orders/')) content = <OrdersPage detail />
    else if (location.pathname === '/shop/profile') content = <ProfilePage />
    else if (location.pathname.startsWith('/shop/order-success/')) content = <OrderSuccess />
    else if (location.pathname.startsWith('/shop/product/')) content = <ProductDetail />
    return <ShopShell>{content}</ShopShell>
}
