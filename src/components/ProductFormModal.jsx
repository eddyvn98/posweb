import { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'
import { saveProductLocal, findProductByBarcode } from '../lib/db'
import { useNotification } from '../contexts/NotificationContext'
import api from '../lib/api'
import ProductCamera from './ProductCamera'
import ProductImage from './ProductForm/ProductImage'
import BarcodeSection from './ProductForm/BarcodeSection'
import UnitSection from './ProductForm/UnitSection'
import CategorySection from './ProductForm/CategorySection'
import PriceStockSection from './ProductForm/PriceStockSection'

const DEFAULT_UNIT = 'Cái'
const LAST_USED_UNIT_KEY = 'posweb:last_used_unit'
const LAST_USED_CATEGORY_KEY = 'posweb:last_used_category'

const getRememberedSelections = () => {
    try {
        return {
            unit: localStorage.getItem(LAST_USED_UNIT_KEY) || '',
            category: localStorage.getItem(LAST_USED_CATEGORY_KEY) || ''
        }
    } catch (err) {
        return { unit: '', category: '' }
    }
}

const saveRememberedSelections = ({ unit, category }) => {
    try {
        if (unit) localStorage.setItem(LAST_USED_UNIT_KEY, unit)
        if (typeof category === 'string') localStorage.setItem(LAST_USED_CATEGORY_KEY, category)
    } catch (err) {
        // Ignore localStorage errors
    }
}

export default function ProductFormModal({ product, onClose, onFinish }) {
    const { shop } = useAuth()
    const { pushProducts } = useSync()
    const { showNotification } = useNotification()
    const [loading, setLoading] = useState(false)
    const [formKey, setFormKey] = useState(0)
    const scanLock = useRef(false)
    const [isClosed, setIsClosed] = useState(false)
    const [units, setUnits] = useState([])
    const [categories, setCategories] = useState([])
    const [formData, setFormData] = useState({
        name: '', barcode: '', unit: getRememberedSelections().unit || DEFAULT_UNIT, category: getRememberedSelections().category || '',
        price: '', online_price: '', promo_price: '', cost_price: '', stock_quantity: 1, image_url: null
    })

    const draftId = useRef(uuidv4())

    const handleAutoSave = async (currentData = formData) => {
        if (!currentData.name?.trim() && !currentData.barcode?.trim() && !currentData.image_url) return

        try {
            const data = {
                ...currentData,
                id: product?.id || draftId.current,
                shop_id: shop.id,
                price: currentData.price ? Number(currentData.price) : 0,
                online_price: currentData.online_price ? Number(currentData.online_price) : null,
                promo_price: currentData.promo_price ? Number(currentData.promo_price) : null,
                cost_price: currentData.cost_price ? Number(currentData.cost_price) : 0,
                stock_quantity: currentData.stock_quantity ? Number(currentData.stock_quantity) : 0,
                is_active: true,
                created_at: product?.created_at || new Date().toISOString()
            }
            await saveProductLocal(data)
            console.log('[AutoSave] Local data saved')
        } catch (err) {
            console.error('Autosave error:', err)
        }
    }

    useEffect(() => {
        loadUnits()
        loadCategories()
        return () => setIsClosed(true)
    }, [])

    useEffect(() => {
        const previousBodyOverflow = document.body.style.overflow
        const previousHtmlOverflow = document.documentElement.style.overflow

        document.body.style.overflow = 'hidden'
        document.documentElement.style.overflow = 'hidden'

        return () => {
            document.body.style.overflow = previousBodyOverflow
            document.documentElement.style.overflow = previousHtmlOverflow
        }
    }, [])

    useEffect(() => {
        const remembered = getRememberedSelections()
        if (product) {
            setFormData(prev => ({
                ...prev,
                ...product,
                unit: product.unit || remembered.unit || prev.unit || DEFAULT_UNIT,
                category: product.category || remembered.category || prev.category || '',
                online_price: product.online_price ?? '',
                promo_price: product.promo_price ?? ''
            }))
        } else {
            setFormData({
                name: '', barcode: '', unit: remembered.unit || DEFAULT_UNIT, category: remembered.category || '',
                price: '', online_price: '', promo_price: '', cost_price: '', stock_quantity: 1, image_url: null
            })
            draftId.current = uuidv4()
        }
    }, [product])

    const loadUnits = async () => {
        try {
            const res = await api.get('/units')
            const data = Array.isArray(res.data) ? res.data : []
            setUnits(data)
            if (data.length > 0 && !formData.unit) setFormData(p => ({ ...p, unit: data[0].name }))
        } catch (err) {
            console.error('Load units error:', err)
            setUnits([])
        }
    }

    const loadCategories = async () => {
        try {
            const res = await api.get('/categories')
            const data = Array.isArray(res.data) ? res.data : []
            setCategories(data)
        } catch (err) {
            console.error('Load categories error:', err)
            setCategories([])
        }
    }

    const handleEditUnit = async (unit, newName) => {
        try {
            await api.patch(`/units/${unit.id}`, { name: newName.trim() })
            await loadUnits()
            if (formData.unit === unit.name) setFormData(p => ({ ...p, unit: newName.trim() }))
            showNotification('Đã cập nhật đơn vị', 'success')
        } catch (err) {
            showNotification('Lỗi khi sửa đơn vị', 'error')
        }
    }

    const handleDeleteUnit = async (unit) => {
        try {
            await api.delete(`/units/${unit.id}`)
            await loadUnits()
            if (formData.unit === unit.name) setFormData(p => ({ ...p, unit: DEFAULT_UNIT }))
            showNotification('Đã xóa đơn vị', 'success')
        } catch (err) {
            showNotification(err.response?.data?.error || 'Lỗi khi xóa đơn vị', 'error')
        }
    }

    const handleEditCategory = async (cat, newName) => {
        try {
            await api.patch(`/categories/${cat.id}`, { name: newName.trim() })
            await loadCategories()
            if (formData.category === cat.name) setFormData(p => ({ ...p, category: newName.trim() }))
            showNotification('Đã cập nhật nhóm hàng', 'success')
        } catch (err) {
            showNotification('Lỗi khi sửa nhóm', 'error')
        }
    }

    const handleDeleteCategory = async (cat) => {
        try {
            await api.delete(`/categories/${cat.id}`)
            await loadCategories()
            if (formData.category === cat.name) setFormData(p => ({ ...p, category: '' }))
            showNotification('Đã xóa nhóm hàng', 'success')
        } catch (err) {
            showNotification(err.response?.data?.error || 'Lỗi khi xóa nhóm', 'error')
        }
    }

    const handleScan = async (code) => {
        if (product || scanLock.current) return
        scanLock.current = true
        try {
            const existing = await findProductByBarcode(code)
            if (existing) {
                setFormData({ ...existing, unit: existing.unit || DEFAULT_UNIT })
                showNotification(`Đã tìm thấy: ${existing.name}`, 'info')
            } else {
                setFormData(p => ({ ...p, barcode: code }))
            }
        } finally {
            setTimeout(() => {
                scanLock.current = false
            }, 500)
        }
    }

    const handleSubmit = async (e) => {
        if (e) e.preventDefault()
        setLoading(true)
        try {
            const onlineBasePrice = Number(formData.online_price) > 0 ? Number(formData.online_price) : Number(formData.price)
            const promoPrice = Number(formData.promo_price)
            if (promoPrice > 0 && promoPrice >= onlineBasePrice) {
                showNotification('Giá KM online phải thấp hơn giá online', 'error')
                setLoading(false)
                return
            }
            let finalImageUrl = formData.image_url
            if (formData.image_url && formData.image_url.startsWith('data:image')) {
                try {
                    const uploadRes = await api.post('/products/upload-image', { image: formData.image_url })
                    if (uploadRes.data.success) {
                        finalImageUrl = `tg_file_id:${uploadRes.data.file_id}`
                    }
                } catch (uploadErr) {
                    console.error('Telegram upload failed:', uploadErr)
                }
            }

            const data = {
                ...formData,
                image_url: finalImageUrl,
                id: product?.id || draftId.current,
                shop_id: shop.id,
                price: Number(formData.price),
                online_price: formData.online_price ? Number(formData.online_price) : null,
                promo_price: formData.promo_price ? Number(formData.promo_price) : null,
                cost_price: Number(formData.cost_price),
                stock_quantity: Number(formData.stock_quantity),
                is_active: true,
                created_at: product?.created_at || new Date().toISOString()
            }
            await saveProductLocal(data)
            const syncResult = await pushProducts(data)
            if (syncResult?.queued) {
                showNotification('Đã lưu cục bộ, sẽ tự đồng bộ khi mạng ổn định', 'info')
            } else {
                showNotification('Đã lưu sản phẩm', 'success')
            }
            if (e) {
                onFinish()
                onClose()
            }
        } catch (err) {
            const message = err?.response?.data?.error || err?.message || 'Không thể lưu sản phẩm'
            showNotification(`Lỗi lưu sản phẩm: ${message}`, 'error')
        } finally {
            setLoading(false)
        }
    }

    const handlePriceBlur = (field, value) => {
        const num = Number(value)
        if (num > 0 && num < 1000) setFormData(p => ({ ...p, [field]: num * 1000 }))
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-[120] flex items-stretch sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-md rounded-none sm:rounded-xl shadow-2xl flex flex-col h-[calc(100dvh-5.5rem)] mb-[5.5rem] sm:h-[90vh] max-h-[calc(100dvh-5.5rem)] sm:max-h-[90vh] overflow-hidden">
                <form key={formKey} onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
                    <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                        <h2 className="text-lg font-bold">{product ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
                        <div className="flex items-center gap-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold uppercase tracking-wide disabled:opacity-50"
                            >
                                {loading ? 'Đang lưu...' : 'Lưu'}
                            </button>
                            <button type="button" onClick={onClose} className="text-gray-400 hover:text-red-500 text-xl p-2">✕</button>
                        </div>
                    </div>

                    <div className="p-4 space-y-4 overflow-y-auto overscroll-contain flex-1 min-h-0 pb-24 sm:pb-4">
                        {!product ? (
                            <div className="flex items-center gap-3 bg-gray-50/50 p-2 rounded-2xl border border-gray-100">
                                <ProductCamera
                                    onCapture={base64 => {
                                        const newData = { ...formData, image_url: base64 }
                                        setFormData(newData)
                                        handleAutoSave(newData)
                                    }}
                                />
                                <div className="flex-1">
                                    <ProductImage imageUrl={formData.image_url} onChange={url => {
                                        const newData = { ...formData, image_url: url }
                                        setFormData(newData)
                                        handleAutoSave(newData)
                                    }} />
                                </div>
                            </div>
                        ) : (
                            <ProductImage imageUrl={formData.image_url} onChange={url => {
                                const newData = { ...formData, image_url: url }
                                setFormData(newData)
                                handleAutoSave(newData)
                            }} />
                        )}

                        <BarcodeSection
                            barcode={formData.barcode}
                            onChange={val => setFormData(p => ({ ...p, barcode: val }))}
                            onGenerate={() => {
                                const newBarcode = `${Math.floor(Date.now() / 1000)}`
                                const newData = { ...formData, barcode: newBarcode }
                                setFormData(newData)
                                handleAutoSave(newData)
                            }}
                            onBlur={() => handleAutoSave()}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tên sản phẩm</label>
                            <input
                                className="input w-full"
                                placeholder="Ví dụ: Bia Heineken..."
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                onBlur={() => handleAutoSave()}
                            />
                        </div>

                        <PriceStockSection
                            price={formData.price}
                            onlinePrice={formData.online_price}
                            promoPrice={formData.promo_price}
                            costPrice={formData.cost_price}
                            stockQuantity={formData.stock_quantity}
                            onChange={(f, v) => setFormData(p => ({ ...p, [f]: v }))}
                            onPriceBlur={(f, v) => {
                                handlePriceBlur(f, v)
                                handleAutoSave()
                            }}
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Đơn vị</label>
                                <UnitSection
                                    units={units}
                                    selectedUnit={formData.unit}
                                    onChange={val => {
                                        const newData = { ...formData, unit: val }
                                        setFormData(newData)
                                        saveRememberedSelections({ unit: val, category: newData.category })
                                        handleAutoSave(newData)
                                    }}
                                    onCreate={async (n) => {
                                        if (n) {
                                            const r = await api.post('/units', { name: n })
                                            setUnits(p => [...p, r.data])
                                            const newData = { ...formData, unit: r.data.name }
                                            setFormData(newData)
                                            saveRememberedSelections({ unit: r.data.name, category: newData.category })
                                            handleAutoSave(newData)
                                        }
                                    }}
                                    onEdit={handleEditUnit}
                                    onDelete={handleDeleteUnit}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nhóm hàng</label>
                                <CategorySection
                                    categories={categories}
                                    selectedCategory={formData.category}
                                    onChange={val => {
                                        const newData = { ...formData, category: val }
                                        setFormData(newData)
                                        saveRememberedSelections({ unit: newData.unit, category: val })
                                        handleAutoSave(newData)
                                    }}
                                    onCreate={async (n) => {
                                        if (n) {
                                            try {
                                                const r = await api.post('/categories', { name: n })
                                                setCategories(p => [...p, r.data])
                                                const newData = { ...formData, category: r.data.name }
                                                setFormData(newData)
                                                saveRememberedSelections({ unit: newData.unit, category: r.data.name })
                                                handleAutoSave(newData)
                                            } catch (err) {
                                                showNotification('Lỗi khi tạo nhóm', 'error')
                                            }
                                        }
                                    }}
                                    onEdit={handleEditCategory}
                                    onDelete={handleDeleteCategory}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t bg-gray-50 sticky bottom-0 z-[130] pb-[max(1rem,env(safe-area-inset-bottom))]">
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} disabled={loading} className="flex-1 btn bg-white border-gray-300">Hủy</button>
                            <button type="submit" disabled={loading} className="flex-1 btn-primary">{loading ? 'Đang lưu...' : 'LƯU SẢN PHẨM'}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
