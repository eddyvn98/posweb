import React, { useEffect, useMemo, useState } from 'react'
import api from '../lib/api'
import SEO from '../components/SEO'
import { Check, Globe, Package, Save, Store, X } from '../components/Icons'
import { useAuth } from '../contexts/AuthContext'
import './WebSales.css'

const money = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ'
const GUEST_STORE_SETTINGS_KEY = 'posweb:guest_storefront_settings'
const GUEST_TEMPLATE = {
    id: 'styla-fashion',
    name: 'STYLA Fashion',
    industry: 'Thời trang',
    preview_image: '/previews/pro.png',
}

const defaultGuestSettings = (shopName = 'Shop Tham Quan') => ({
    id: 'guest-storefront',
    shop_id: 'guest_shop_v4',
    slug: 'guest-shop-v4',
    template_id: GUEST_TEMPLATE.id,
    status: 'draft',
    brand_name: shopName,
    logo_url: '',
    primary_color: '#111111',
    hero_title: 'Sống chất mặc đẹp',
    hero_subtitle: 'Khám phá sản phẩm mới nhất từ kho tham quan của bạn.',
    hero_image_url: '/mocking/mocking/4.jpg',
    featured_category_names: [],
    config: {},
})

export default function WebSales() {
    const { isGuest, shop } = useAuth()
    const [templates, setTemplates] = useState([])
    const [settings, setSettings] = useState(null)
    const [orders, setOrders] = useState([])
    const [activeTab, setActiveTab] = useState('builder')
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    const publicUrl = settings?.slug ? `${window.location.origin}/store/${settings.slug}` : ''
    const selectedTemplate = useMemo(
        () => templates.find((template) => template.id === settings?.template_id) || templates[0],
        [templates, settings]
    )

    const fetchAll = async () => {
        if (isGuest) {
            const saved = localStorage.getItem(GUEST_STORE_SETTINGS_KEY)
            setTemplates([GUEST_TEMPLATE])
            setSettings(saved ? JSON.parse(saved) : defaultGuestSettings(shop?.name))
            setOrders(JSON.parse(localStorage.getItem('posweb:guest_web_orders') || '[]'))
            return
        }
        const [templateRes, settingsRes, ordersRes] = await Promise.all([
            api.get('/storefront/templates'),
            api.get('/storefront/settings'),
            api.get('/web-orders'),
        ])
        setTemplates(templateRes.data || [])
        setSettings(settingsRes.data)
        setOrders(ordersRes.data || [])
    }

    useEffect(() => {
        fetchAll().catch((error) => {
            console.error('Failed to load web sales builder', error)
            setMessage('Không tải được dữ liệu website. Vui lòng thử lại.')
        })
    }, [isGuest, shop?.name])

    const updateField = (field, value) => {
        setSettings((current) => ({ ...current, [field]: value }))
    }

    const saveSettings = async () => {
        if (!settings) return
        setSaving(true)
        setMessage('')
        try {
            const payload = {
                slug: settings.slug,
                template_id: settings.template_id,
                brand_name: settings.brand_name,
                logo_url: settings.logo_url,
                primary_color: settings.primary_color,
                hero_title: settings.hero_title,
                hero_subtitle: settings.hero_subtitle,
                hero_image_url: settings.hero_image_url,
                featured_category_names: String(settings.featured_category_names_text || settings.featured_category_names?.join(',') || '')
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean),
                config: settings.config || {},
            }
            if (isGuest) {
                const next = { ...settings, ...payload, status: settings.status || 'draft' }
                localStorage.setItem(GUEST_STORE_SETTINGS_KEY, JSON.stringify(next))
                setSettings(next)
                setMessage('Đã lưu cấu hình demo cho shop tham quan.')
                return
            }
            const res = await api.patch('/storefront/settings', payload)
            setSettings(res.data)
            setMessage('Đã lưu cấu hình website.')
        } catch (error) {
            setMessage(error.response?.data?.error || 'Không lưu được cấu hình.')
        } finally {
            setSaving(false)
        }
    }

    const publish = async () => {
        setSaving(true)
        setMessage('')
        try {
            if (isGuest) {
                const next = { ...settings, status: 'published', published_at: new Date().toISOString() }
                localStorage.setItem(GUEST_STORE_SETTINGS_KEY, JSON.stringify(next))
                setSettings(next)
                setMessage('Website demo đã publish. Bạn có thể mở link public ngay.')
                return
            }
            const res = await api.post('/storefront/publish')
            setSettings(res.data)
            setMessage('Website đã publish. Khách có thể truy cập link public.')
        } catch (error) {
            setMessage(error.response?.data?.error || 'Không publish được website.')
        } finally {
            setSaving(false)
        }
    }

    const updateOrder = async (id, status) => {
        try {
            if (isGuest) {
                const currentOrders = JSON.parse(localStorage.getItem('posweb:guest_web_orders') || '[]')
                const nextOrders = currentOrders.map((order) => (
                    order.id === id
                        ? { ...order, status, confirmed_at: status === 'confirmed' ? new Date().toISOString() : order.confirmed_at }
                        : order
                ))
                localStorage.setItem('posweb:guest_web_orders', JSON.stringify(nextOrders))
                setOrders(nextOrders)
                return
            }
            await api.patch(`/web-orders/${id}/status`, { status })
            const res = await api.get('/web-orders')
            setOrders(res.data || [])
        } catch (error) {
            setMessage(error.response?.data?.error || 'Không cập nhật được đơn web.')
        }
    }

    if (!settings) {
        return <div className="web-builder-page"><div className="web-builder-loading">Đang tải website builder...</div></div>
    }

    return (
        <div className="web-builder-page">
            <SEO title="Website Builder - POSweb" description="Tạo website bán hàng tự động lấy sản phẩm từ kho POS." />

            <header className="web-builder-header">
                <div>
                    <span className="web-builder-kicker">Website Builder</span>
                    <h1>Tạo web bán hàng từ kho hiện có</h1>
                    <p>Chọn template, chỉnh nhận diện cơ bản và publish link cho khách mua hàng. Đơn web sẽ vào trạng thái chờ xác nhận.</p>
                </div>
                <div className="web-builder-actions">
                    <button className="web-builder-btn secondary" onClick={saveSettings} disabled={saving}>
                        <Save className="w-4 h-4" /> Lưu
                    </button>
                    <button className="web-builder-btn primary" onClick={publish} disabled={saving}>
                        <Globe className="w-4 h-4" /> Publish
                    </button>
                </div>
            </header>

            {message && <div className="web-builder-message">{message}</div>}

            <div className="web-builder-tabs">
                <button className={activeTab === 'builder' ? 'active' : ''} onClick={() => setActiveTab('builder')}>Builder</button>
                <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>Đơn web ({orders.filter((order) => order.status === 'pending').length})</button>
            </div>

            {activeTab === 'builder' ? (
                <div className="web-builder-grid">
                    <section className="web-builder-panel">
                        <div className="panel-title">
                            <Store className="w-5 h-5" />
                            <div>
                                <h2>Template</h2>
                                <p>V1 có template fashion, cấu trúc đã sẵn để thêm ngành khác.</p>
                            </div>
                        </div>
                        <div className="template-list">
                            {templates.map((template) => (
                                <button
                                    key={template.id}
                                    className={`template-choice ${settings.template_id === template.id ? 'selected' : ''}`}
                                    onClick={() => updateField('template_id', template.id)}
                                >
                                    <img src={template.preview_image || '/previews/pro.png'} alt={template.name} />
                                    <span>{template.name}</span>
                                    <small>{template.industry}</small>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="web-builder-panel">
                        <div className="panel-title">
                            <Globe className="w-5 h-5" />
                            <div>
                                <h2>Branding cơ bản</h2>
                                <p>Dữ liệu sản phẩm vẫn lấy từ kho, phần này chỉ quyết định cách trình bày.</p>
                            </div>
                        </div>
                        <div className="builder-form">
                            <label>Tên brand<input value={settings.brand_name || ''} onChange={(e) => updateField('brand_name', e.target.value)} /></label>
                            <label>Slug public<input value={settings.slug || ''} onChange={(e) => updateField('slug', e.target.value)} /></label>
                            <label>Màu chính<input type="color" value={settings.primary_color || '#111111'} onChange={(e) => updateField('primary_color', e.target.value)} /></label>
                            <label>Logo URL<input value={settings.logo_url || ''} onChange={(e) => updateField('logo_url', e.target.value)} placeholder="/logo.png" /></label>
                            <label>Hero title<input value={settings.hero_title || ''} onChange={(e) => updateField('hero_title', e.target.value)} /></label>
                            <label>Hero subtitle<textarea value={settings.hero_subtitle || ''} onChange={(e) => updateField('hero_subtitle', e.target.value)} /></label>
                            <label>Hero image URL<input value={settings.hero_image_url || ''} onChange={(e) => updateField('hero_image_url', e.target.value)} placeholder="/mocking/mocking/4.jpg" /></label>
                            <label>Danh mục nổi bật<input value={settings.featured_category_names_text ?? settings.featured_category_names?.join(', ') ?? ''} onChange={(e) => updateField('featured_category_names_text', e.target.value)} placeholder="Nam, Nữ, Phụ kiện" /></label>
                        </div>
                    </section>

                    <section className="web-builder-preview">
                        <div className="preview-toolbar">
                            <div>
                                <span>{selectedTemplate?.name || 'Template'}</span>
                                <strong className={settings.status === 'published' ? 'published' : ''}>{settings.status}</strong>
                            </div>
                            {publicUrl && <a href={publicUrl} target="_blank" rel="noreferrer">Mở web</a>}
                        </div>
                        <div className="mini-storefront" style={{ '--accent': settings.primary_color || '#111111' }}>
                            <div className="mini-nav">
                                <b>{settings.brand_name}</b>
                                <span>Trang chủ</span>
                                <span>Sản phẩm</span>
                                <span>Liên hệ</span>
                            </div>
                            <div className="mini-hero">
                                <div>
                                    <small>NEW ARRIVALS</small>
                                    <h3>{settings.hero_title}</h3>
                                    <p>{settings.hero_subtitle}</p>
                                    <button>Mua ngay</button>
                                </div>
                                <div className="mini-photo">
                                    {settings.hero_image_url ? <img src={settings.hero_image_url} alt="" /> : <Package className="w-12 h-12" />}
                                </div>
                            </div>
                            <div className="public-url-box">{publicUrl || 'Publish để có link public'}</div>
                        </div>
                    </section>
                </div>
            ) : (
                <section className="web-orders-panel">
                    {orders.length === 0 ? (
                        <div className="empty-orders">Chưa có đơn từ website.</div>
                    ) : orders.map((order) => (
                        <article key={order.id} className="web-order-row">
                            <div>
                                <strong>{order.code}</strong>
                                <p>{order.customer_name} · {order.customer_phone}</p>
                                <small>{order.customer_address || 'Chưa có địa chỉ'}</small>
                            </div>
                            <div className="order-items">
                                {(order.items || []).map((item) => (
                                    <span key={item.product_id}>{item.product_name} x{item.quantity}</span>
                                ))}
                            </div>
                            <div className="order-total">{money(order.total_amount)}</div>
                            <span className={`order-status ${order.status}`}>{order.status}</span>
                            {order.status === 'pending' && (
                                <div className="order-actions">
                                    <button onClick={() => updateOrder(order.id, 'confirmed')}><Check className="w-4 h-4" /> Xác nhận</button>
                                    <button onClick={() => updateOrder(order.id, 'cancelled')}><X className="w-4 h-4" /> Hủy</button>
                                </div>
                            )}
                        </article>
                    ))}
                </section>
            )}
        </div>
    )
}
