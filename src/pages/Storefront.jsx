import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../lib/api'
import SEO from '../components/SEO'
import { Check, Heart, Minus, Package, Plus, Search, ShoppingCart, Trash2, User } from '../components/Icons'
import { getProductImageUrl } from '../lib/imageUtils'
import { getAllLocalProducts } from '../lib/db'
import './Storefront.css'

const money = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'd'
const fallbackHero = '/mocking/mocking/4.jpg'
const GUEST_STORE_SETTINGS_KEY = 'posweb:guest_storefront_settings'

const safeJson = (value, fallback) => {
    if (!value) return fallback
    if (typeof value !== 'string') return value
    try {
        return JSON.parse(value)
    } catch {
        return fallback
    }
}

const getCatalog = (product = {}) => product.online_catalog || safeJson(product.attributes, {})?.online_catalog || {}
const getDisplayName = (product = {}) => getCatalog(product).title || product.display_name || product.name || ''
const getGallery = (product = {}) => [product.image_url, ...((getCatalog(product).gallery_images) || [])].filter(Boolean)

const parseGuestSettings = () => {
    try {
        return JSON.parse(localStorage.getItem(GUEST_STORE_SETTINGS_KEY) || '{}')
    } catch {
        return {}
    }
}

const normalizeProduct = (product) => {
    const attributes = safeJson(product.attributes, {})
    const online_catalog = product.online_catalog || attributes.online_catalog || {}
    return {
        id: product.id,
        name: product.name,
        display_name: online_catalog.title || product.display_name || product.name,
        barcode: product.barcode,
        unit: product.unit,
        category: product.category || '',
        price: Number(product.price || 0),
        stock_quantity: Number(product.stock_quantity || 0),
        image_url: product.image_url || null,
        parent_id: product.parent_id || null,
        attributes,
        online_catalog,
        is_sold_out: Number(product.stock_quantity || 0) <= 0,
    }
}

const buildGuestStorefront = async () => {
    const settings = {
        slug: 'guest-shop-v4',
        template_id: 'styla-fashion',
        status: 'published',
        brand_name: 'STYLA',
        primary_color: '#111111',
        hero_title: 'Song chat mac dep',
        hero_subtitle: 'Kham pha nhung san pham moi nhat tu cua hang cua ban.',
        hero_image_url: '/mocking/mocking/4.jpg',
        featured_category_names: [],
        config: {},
        ...parseGuestSettings(),
    }

    const allProducts = (await getAllLocalProducts()).map(normalizeProduct)
    const displayProducts = allProducts.filter((product) => !product.parent_id && getCatalog(product).channel_visibility?.web !== false)
    const categories = Array.from(new Set(displayProducts.map((product) => product.category).filter(Boolean))).slice(0, 12)
    const savedCategories = Array.isArray(settings.featured_category_names) ? settings.featured_category_names : []
    const validSavedCategories = savedCategories.filter((name) => categories.includes(name))
    const selectedCategories = validSavedCategories.length ? validSavedCategories : categories.slice(0, 3)
    const featuredProducts = displayProducts.filter((product) => selectedCategories.includes(product.category))

    return {
        shop: { id: 'guest_shop_v4', name: 'Shop Tham Quan', address: '' },
        settings,
        template: { id: 'styla-fashion', name: 'STYLA Fashion', industry: 'Retail' },
        categories,
        inventory_products: allProducts,
        collections: selectedCategories.map((name) => ({
            name,
            products: displayProducts.filter((product) => product.category === name).slice(0, 8),
        })),
        products: {
            latest: displayProducts.slice(0, 60),
            featured: (featuredProducts.length ? featuredProducts : displayProducts).slice(0, 24),
        },
    }
}

export default function Storefront() {
    const { slug } = useParams()
    const [storefront, setStorefront] = useState(null)
    const [loading, setLoading] = useState(true)
    const [cart, setCart] = useState([])
    const [checkoutOpen, setCheckoutOpen] = useState(false)
    const [customer, setCustomer] = useState({ customer_name: '', customer_phone: '', customer_address: '', note: '' })
    const [orderResult, setOrderResult] = useState(null)
    const [error, setError] = useState('')
    const [detail, setDetail] = useState(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [selectedVariantId, setSelectedVariantId] = useState('')
    const [detailQty, setDetailQty] = useState(1)
    const [activeImage, setActiveImage] = useState('')

    useEffect(() => {
        setLoading(true)
        setDetail(null)
        if (slug === 'guest-shop-v4') {
            buildGuestStorefront()
                .then(setStorefront)
                .catch(() => setError('Khong tai duoc du lieu shop tham quan.'))
                .finally(() => setLoading(false))
            return
        }
        api.get(`/storefront/${slug}`)
            .then((res) => setStorefront(res.data))
            .catch(() => setError('Website chua duoc publish hoac khong ton tai.'))
            .finally(() => setLoading(false))
    }, [slug])

    const settings = storefront?.settings || {}
    const products = storefront?.products?.latest || []
    const featured = storefront?.products?.featured?.length ? storefront.products.featured : products.slice(0, 8)
    const collections = storefront?.collections?.filter((collection) => collection.products.length > 0).slice(0, 3) || []
    const cartTotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
    const cartCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    const heroImage = settings.hero_image_url || featured[0]?.image_url || fallbackHero
    const productGridItems = useMemo(() => {
        const seen = new Set()
        return [...featured, ...products].filter((product) => {
            if (!product?.id || seen.has(product.id)) return false
            seen.add(product.id)
            return true
        }).slice(0, 60)
    }, [featured, products])

    const collectionBlocks = useMemo(() => {
        if (collections.length) return collections
        const pool = featured.length ? featured : products
        return Array.from(new Set(pool.map((product) => product.category).filter(Boolean))).slice(0, 3).map((name) => ({
            name,
            products: pool.filter((product) => product.category === name).slice(0, 3),
        }))
    }, [collections, featured, products])

    const selectedProduct = detail?.product
    const selectedVariant = detail?.variants?.find((variant) => variant.id === selectedVariantId)
    const purchaseProduct = selectedVariant || selectedProduct
    const catalog = getCatalog(selectedProduct)
    const gallery = getGallery(selectedProduct)

    const openProductDetail = async (product) => {
        setDetailLoading(true)
        setError('')
        setDetailQty(1)
        setSelectedVariantId('')
        try {
            if (slug === 'guest-shop-v4') {
                const all = storefront.inventory_products || []
                const parent = all.find((item) => String(item.id) === String(product.id))
                const variants = all.filter((item) => String(item.parent_id || '') === String(product.id))
                setDetail({ shop: storefront.shop, settings, product: parent || product, variants })
                setActiveImage(getGallery(parent || product)[0] || fallbackHero)
                return
            }
            const res = await api.get(`/storefront/${slug}/products/${product.id}`)
            setDetail(res.data)
            setActiveImage(getGallery(res.data.product)[0] || fallbackHero)
        } catch {
            setError('Khong tai duoc chi tiet san pham.')
        } finally {
            setDetailLoading(false)
        }
    }

    const closeDetail = () => {
        setDetail(null)
        setSelectedVariantId('')
        setDetailQty(1)
    }

    const addToCart = (product, quantity = 1) => {
        if (!product || product.is_sold_out) return
        setCart((current) => {
            const existing = current.find((item) => item.product_id === product.id)
            if (existing) {
                return current.map((item) => item.product_id === product.id ? { ...item, quantity: item.quantity + quantity } : item)
            }
            return [...current, {
                product_id: product.id,
                product_name: getDisplayName(product),
                price: product.price,
                image_url: product.image_url || selectedProduct?.image_url,
                quantity,
            }]
        })
    }

    const addDetailToCart = (openCheckout = false) => {
        if (!purchaseProduct || purchaseProduct.is_sold_out) return
        addToCart(purchaseProduct, detailQty)
        if (openCheckout) {
            setDetail(null)
            setCheckoutOpen(true)
        }
    }

    const changeQty = (productId, delta) => {
        setCart((current) => current.map((item) => item.product_id === productId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item))
    }

    const removeFromCart = (productId) => {
        setCart((current) => current.filter((item) => item.product_id !== productId))
    }

    const submitOrder = async (event) => {
        event.preventDefault()
        setError('')
        try {
            if (slug === 'guest-shop-v4') {
                const order = {
                    id: `guest-web-${Date.now()}`,
                    code: `WEB${Date.now().toString().slice(-6)}`,
                    ...customer,
                    total_amount: cartTotal,
                    status: 'pending',
                    items: cart,
                    created_at: new Date().toISOString(),
                }
                const orders = JSON.parse(localStorage.getItem('posweb:guest_web_orders') || '[]')
                localStorage.setItem('posweb:guest_web_orders', JSON.stringify([order, ...orders]))
                setOrderResult(order)
                setCart([])
                setCheckoutOpen(false)
                return
            }
            const res = await api.post(`/storefront/${slug}/orders`, {
                ...customer,
                items: cart.map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
            })
            setOrderResult(res.data)
            setCart([])
            setCheckoutOpen(false)
        } catch (err) {
            setError(err.response?.data?.error || 'Khong tao duoc don hang.')
        }
    }

    if (loading) return <div className="storefront-state">Dang mo cua hang...</div>
    if (error && !storefront) return <div className="storefront-state">{error}</div>

    return (
        <div className="styla-store" style={{ '--store-accent': settings.primary_color || '#111111' }}>
            <SEO title={`${settings.brand_name || storefront.shop.name} - Website ban hang`} description={settings.hero_subtitle || 'Website ban hang'} />
            <div className="styla-topbar">
                <span><strong>MIEN PHI GIAO HANG</strong> cho don tu 500.000d</span>
                <span>Ho tro: 1900 1234 <i>|</i> Dang nhap / Dang ky</span>
            </div>

            <header className="styla-header">
                <a href="#home" className="styla-brand">{settings.logo_url ? <img src={settings.logo_url} alt={settings.brand_name} /> : settings.brand_name}</a>
                <nav>
                    <a href="#home">Trang chu</a>
                    <a href="#products">San pham</a>
                    <a href="#collections">Danh muc</a>
                    <a href="#footer">Ho tro</a>
                </nav>
                <div className="styla-icons">
                    <Search className="w-5 h-5" />
                    <User className="w-5 h-5" />
                    <Heart className="w-5 h-5" />
                    <button onClick={() => setCheckoutOpen(true)} aria-label="Gio hang">
                        <ShoppingCart className="w-5 h-5" />
                        {cartCount > 0 && <b>{cartCount}</b>}
                    </button>
                </div>
            </header>

            <section id="home" className="styla-hero">
                <div className="styla-hero-copy">
                    <span>New arrivals</span>
                    <h1>{settings.hero_title || 'Cua hang truc tuyen'}</h1>
                    <p>{settings.hero_subtitle || 'Kham pha san pham moi nhat tu cua hang cua ban.'}</p>
                    <div className="styla-hero-actions">
                        <a href="#products">Mua ngay</a>
                        <a href="#collections">Xem danh muc</a>
                    </div>
                    <div className="styla-promises">
                        <span>Doi tra linh hoat</span>
                        <span>Thanh toan an toan</span>
                        <span>Tu van nhanh</span>
                    </div>
                </div>
                <div className="styla-hero-image">
                    <img src={getProductImageUrl(heroImage)} alt="" />
                </div>
            </section>

            <section id="collections" className="styla-collections">
                {collectionBlocks.map((collection, index) => {
                    const image = collection.products[0]?.image_url || featured[index]?.image_url || fallbackHero
                    return (
                        <a key={collection.name} href="#products" className="styla-collection">
                            <img src={getProductImageUrl(image)} alt={collection.name} />
                            <div>
                                <h2>{collection.name}</h2>
                                <p>{collection.products.length} san pham dang ban</p>
                                <span>Kham pha</span>
                            </div>
                        </a>
                    )
                })}
            </section>

            <section id="products" className="styla-products">
                <div className="styla-section-title">
                    <h2>San pham noi bat</h2>
                    <div><span>Moi nhat</span><span>Con hang</span><span>Dang ban</span></div>
                </div>
                <div className="styla-product-grid">
                    {productGridItems.map((product) => (
                        <article key={product.id} className="styla-product">
                            <button className="heart-btn" aria-label="Yeu thich"><Heart className="w-5 h-5" /></button>
                            <button type="button" className="product-image" onClick={() => openProductDetail(product)}>
                                {product.image_url ? <img src={getProductImageUrl(product.image_url)} alt={getDisplayName(product)} /> : <Package className="w-10 h-10" />}
                                {product.is_sold_out && <span>Het hang</span>}
                            </button>
                            <button disabled={product.is_sold_out} onClick={() => addToCart(product)} className="product-cart-button">
                                {product.is_sold_out ? 'Het hang' : 'Them vao gio'}
                            </button>
                            <button type="button" className="product-title-button" onClick={() => openProductDetail(product)}>
                                <h3>{getDisplayName(product)}</h3>
                            </button>
                            <p>{money(product.price)}</p>
                            <div className="product-swatches"><i></i><i></i><i></i></div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="styla-benefits">
                <div>Dong bo kho<span>Mot kho cho nhieu kenh ban</span></div>
                <div>Dat hang nhanh<span>Gui don cho cua hang xac nhan</span></div>
                <div>Thong tin ro rang<span>Thong so va chinh sach day du</span></div>
                <div>Ho tro da kenh<span>San sang cho Web, Shopee, TikTok</span></div>
            </section>

            <footer id="footer" className="styla-footer">
                <div className="styla-newsletter">
                    <div className="newsletter-image">
                        <img src={getProductImageUrl(featured[1]?.image_url || featured[0]?.image_url || fallbackHero)} alt="" />
                    </div>
                    <div>
                        <label>Dang ky nhan tin</label>
                        <p>Nhan uu dai va cap nhat san pham moi tu cua hang.</p>
                    </div>
                    <form>
                        <input placeholder="Nhap email cua ban" />
                        <button type="button">Dang ky</button>
                    </form>
                </div>
                <div className="styla-footer-grid">
                    <div>
                        <h2>{settings.brand_name}</h2>
                        <p>Cua hang truc tuyen dong bo truc tiep voi kho hang.</p>
                    </div>
                    <div><h3>Ve chung toi</h3><a>Gioi thieu</a><a>Cua hang</a><a>Tin tuc</a></div>
                    <div><h3>Chinh sach</h3><a>Doi tra</a><a>Bao mat</a><a>Huong dan mua hang</a></div>
                    <div><h3>Ho tro</h3><a>Cau hoi thuong gap</a><a>Lien he</a><a>1900 1234</a></div>
                </div>
            </footer>

            {detail && (
                <div className="product-detail-overlay">
                    <article className="product-detail">
                        <button className="detail-close" onClick={closeDetail}>Dong</button>
                        <div className="detail-breadcrumb">Trang chu / {selectedProduct.category || 'San pham'} / {getDisplayName(selectedProduct)}</div>
                        <div className="detail-main">
                            <div className="detail-gallery">
                                <div className="detail-image">
                                    <img src={getProductImageUrl(activeImage || gallery[0] || fallbackHero)} alt={getDisplayName(selectedProduct)} />
                                </div>
                                <div className="detail-thumbs">
                                    {gallery.map((image) => (
                                        <button key={image} onClick={() => setActiveImage(image)} className={image === activeImage ? 'active' : ''}>
                                            <img src={getProductImageUrl(image)} alt="" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="detail-buybox">
                                <span className="detail-category">{selectedProduct.category || 'San pham'}</span>
                                <h1>{getDisplayName(selectedProduct)}</h1>
                                {catalog.subtitle && <p className="detail-subtitle">{catalog.subtitle}</p>}
                                <div className="detail-price">{money(purchaseProduct?.price || selectedProduct.price)}</div>
                                <div className="detail-stock">{Number(purchaseProduct?.stock_quantity || 0) > 0 ? `Con ${purchaseProduct.stock_quantity} ${purchaseProduct.unit || ''}` : 'Het hang'}</div>

                                {detail.variants?.length > 0 && (
                                    <div className="detail-variants">
                                        <strong>Phan loai</strong>
                                        <div>
                                            {detail.variants.map((variant) => (
                                                <button key={variant.id} className={selectedVariantId === variant.id ? 'active' : ''} onClick={() => {
                                                    setSelectedVariantId(variant.id)
                                                    if (variant.image_url) setActiveImage(variant.image_url)
                                                }}>
                                                    {Object.values(variant.attributes || {}).filter((value) => typeof value !== 'object').join(' / ') || variant.barcode}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="detail-qty">
                                    <button onClick={() => setDetailQty((value) => Math.max(1, value - 1))}><Minus className="w-4 h-4" /></button>
                                    <b>{detailQty}</b>
                                    <button onClick={() => setDetailQty((value) => value + 1)}><Plus className="w-4 h-4" /></button>
                                </div>
                                <div className="detail-actions">
                                    <button disabled={!purchaseProduct || purchaseProduct.is_sold_out} onClick={() => addDetailToCart(false)}>Them vao gio</button>
                                    <button disabled={!purchaseProduct || purchaseProduct.is_sold_out} onClick={() => addDetailToCart(true)}>Mua ngay</button>
                                </div>
                            </div>
                        </div>

                        <section className="detail-shop">
                            <strong>{detail.shop?.name || storefront.shop.name}</strong>
                            <span>{detail.shop?.address || 'Cua hang dang ban online'}</span>
                            <button>Xem shop</button>
                        </section>

                        {(catalog.specifications?.length > 0 || selectedProduct.category) && (
                            <section className="detail-section">
                                <h2>Chi tiet san pham</h2>
                                <dl className="detail-specs">
                                    {selectedProduct.category && <><dt>Danh muc</dt><dd>{selectedProduct.category}</dd></>}
                                    {(catalog.specifications || []).map((item, index) => (
                                        <React.Fragment key={index}>
                                            <dt>{item.label}</dt>
                                            <dd>{item.value}</dd>
                                        </React.Fragment>
                                    ))}
                                </dl>
                            </section>
                        )}

                        {(catalog.guides || []).map((guide, index) => (
                            <section key={index} className="detail-section">
                                <h2>{guide.title || 'Huong dan'}</h2>
                                <table className="detail-guide"><tbody>{(guide.rows || []).map((row, rowIndex) => <tr key={rowIndex}><th>{row.label}</th><td>{row.value}</td></tr>)}</tbody></table>
                                {guide.note && <p>{guide.note}</p>}
                            </section>
                        ))}

                        <section className="detail-section">
                            <h2>Mo ta san pham</h2>
                            <p>{catalog.description || selectedProduct.name}</p>
                            {(catalog.detail_sections || []).map((section, index) => (
                                <div key={index} className="detail-copy-block">
                                    {section.title && <h3>{section.title}</h3>}
                                    {section.content && <p>{section.content}</p>}
                                </div>
                            ))}
                        </section>

                        {(catalog.policies?.shipping || catalog.policies?.returns || catalog.policies?.warranty) && (
                            <section className="detail-section detail-policies">
                                <h2>Chinh sach</h2>
                                {catalog.policies.shipping && <p><strong>Giao hang:</strong> {catalog.policies.shipping}</p>}
                                {catalog.policies.returns && <p><strong>Doi tra:</strong> {catalog.policies.returns}</p>}
                                {catalog.policies.warranty && <p><strong>Bao hanh:</strong> {catalog.policies.warranty}</p>}
                            </section>
                        )}
                    </article>
                </div>
            )}

            {detailLoading && <div className="storefront-state floating">Dang tai chi tiet...</div>}

            {(checkoutOpen || cart.length > 0) && (
                <aside className={`styla-cart ${checkoutOpen ? 'open' : ''}`}>
                    <div className="cart-header">
                        <strong>Gio hang</strong>
                        <button onClick={() => setCheckoutOpen(false)}>Dong</button>
                    </div>
                    {cart.length === 0 ? <p className="cart-empty">Chua co san pham.</p> : (
                        <>
                            <div className="cart-items">
                                {cart.map((item) => (
                                    <div key={item.product_id} className="cart-item">
                                        <img src={getProductImageUrl(item.image_url || fallbackHero)} alt="" />
                                        <div>
                                            <strong>{item.product_name}</strong>
                                            <span>{money(item.price)}</span>
                                            <div className="qty">
                                                <button onClick={() => changeQty(item.product_id, -1)}><Minus className="w-3 h-3" /></button>
                                                <b>{item.quantity}</b>
                                                <button onClick={() => changeQty(item.product_id, 1)}><Plus className="w-3 h-3" /></button>
                                                <button onClick={() => removeFromCart(item.product_id)}><Trash2 className="w-3 h-3" /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="cart-total"><span>Tong cong</span><strong>{money(cartTotal)}</strong></div>
                            <form className="checkout-form" onSubmit={submitOrder}>
                                <input required placeholder="Ten khach hang" value={customer.customer_name} onChange={(e) => setCustomer({ ...customer, customer_name: e.target.value })} />
                                <input required placeholder="So dien thoai" value={customer.customer_phone} onChange={(e) => setCustomer({ ...customer, customer_phone: e.target.value })} />
                                <input placeholder="Dia chi giao hang" value={customer.customer_address} onChange={(e) => setCustomer({ ...customer, customer_address: e.target.value })} />
                                <textarea placeholder="Ghi chu" value={customer.note} onChange={(e) => setCustomer({ ...customer, note: e.target.value })} />
                                <button type="submit">Gui don cho xac nhan</button>
                            </form>
                        </>
                    )}
                </aside>
            )}

            {orderResult && (
                <div className="order-toast">
                    <Check className="w-5 h-5" />
                    <div>
                        <strong>Don {orderResult.code} da duoc gui</strong>
                        <p>Cua hang se xac nhan truoc khi tru kho.</p>
                    </div>
                    <button onClick={() => setOrderResult(null)}>Dong</button>
                </div>
            )}
        </div>
    )
}
