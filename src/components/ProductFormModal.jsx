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
        name: '', barcode: '', unit: DEFAULT_UNIT, category: '',
        price: '', cost_price: '', stock_quantity: 1, image_url: null
    })

    const draftId = useRef(uuidv4())



    const handleAutoSave = async (currentData = formData) => {
        // Only save if there's at least one piece of data to identify the product
        if (!currentData.name?.trim() && !currentData.barcode?.trim() && !currentData.image_url) return

        try {
            const data = {
                ...currentData,
                id: product?.id || draftId.current,
                shop_id: shop.id,
                price: currentData.price ? Number(currentData.price) : 0,
                cost_price: currentData.cost_price ? Number(currentData.cost_price) : 0,
                stock_quantity: currentData.stock_quantity ? Number(currentData.stock_quantity) : 0,
                is_active: true,
                created_at: product?.created_at || new Date().toISOString()
            }
            await saveProductLocal(data)
            console.log('[AutoSave] Local data saved')
        } catch (err) { console.error('Autosave error:', err) }
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
        if (product) {
            setFormData(prev => ({
                ...prev,
                ...product,
                unit: product.unit || prev.unit || DEFAULT_UNIT
            }))
        } else {
            // Reset form for truly new product (not a scanned draft)
            setFormData({
                name: '', barcode: '', unit: DEFAULT_UNIT, category: '',
                price: '', cost_price: '', stock_quantity: 1, image_url: null
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
        } catch (err) { console.error('Load units error:', err); setUnits([]) }
    }

    const loadCategories = async () => {
        try {
            const res = await api.get('/categories')
            const data = Array.isArray(res.data) ? res.data : []
            setCategories(data)
        } catch (err) { console.error('Load categories error:', err); setCategories([]) }
    }

    const handleEditUnit = async (unit, newName) => {
        try {
            await api.patch(`/units/${unit.id}`, { name: newName.trim() })
            await loadUnits()
            if (formData.unit === unit.name) setFormData(p => ({ ...p, unit: newName.trim() }))
            showNotification('Đã cập nhật đơn vị', 'success')
        } catch (err) { showNotification('Lỗi khi sửa đơn vị', 'error') }
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
        } catch (err) { showNotification('Lỗi khi sửa nhóm', 'error') }
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
        } finally { setTimeout(() => { scanLock.current = false }, 500) }
    }

    const handleSubmit = async (e) => {
        if (e) e.preventDefault()
        setLoading(true)
        try {
            let finalImageUrl = formData.image_url
            // If image is base64 (newly uploaded), upload to Telegram
            if (formData.image_url && formData.image_url.startsWith('data:image')) {
                try {
                    const uploadRes = await api.post('/products/upload-image', { image: formData.image_url })
                    if (uploadRes.data.success) {
                        finalImageUrl = `tg_file_id:${uploadRes.data.file_id}`
                    }
                } catch (uploadErr) {
                    console.error('Telegram Upload Failed:', uploadErr)
                    // Fallback to local base64 or show warning? 
                    // Let's proceed with base64 if TG fails as backup
                }
            }

            const data = {
                ...formData,
                image_url: finalImageUrl,
                id: product?.id || draftId.current,
                shop_id: shop.id,
                price: Number(formData.price),
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
            const message = err?.response?.data?.error || err?.message || 'Khong the luu san pham'
            showNotification(`Loi luu san pham: ${message}`, 'error')
        } finally {
            setLoading(false)
        }
    }

    const handlePriceBlur = (field, value) => {
        const num = Number(value)
        if (num > 0 && num < 1000) setFormData(p => ({ ...p, [field]: num * 1000 }))
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-stretch sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-md rounded-none sm:rounded-xl shadow-2xl flex flex-col h-screen sm:h-[90vh] max-h-screen sm:max-h-[90vh] overflow-hidden">
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
                                        const newData = { ...formData, image_url: base64 };
                                        setFormData(newData);
                                        handleAutoSave(newData);
                                    }}
                                />
                                <div className="flex-1">
                                    <ProductImage imageUrl={formData.image_url} onChange={url => {
                                        const newData = { ...formData, image_url: url };
                                        setFormData(newData);
                                        handleAutoSave(newData);
                                    }} />
                                </div>
                            </div>
                        ) : (
                            <ProductImage imageUrl={formData.image_url} onChange={url => {
                                const newData = { ...formData, image_url: url };
                                setFormData(newData);
                                handleAutoSave(newData);
                            }} />
                        )}

                        {/* 1. Barcode */}
                        <BarcodeSection
                            barcode={formData.barcode}
                            onChange={val => setFormData(p => ({ ...p, barcode: val }))}
                            onGenerate={() => {
                                const newBarcode = `${Math.floor(Date.now() / 1000)}`;
                                const newData = { ...formData, barcode: newBarcode };
                                setFormData(newData);
                                handleAutoSave(newData);
                            }}
                            onBlur={() => handleAutoSave()}
                        />

                        {/* 2. Name */}
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

                        {/* 3. Price & 4. Stock */}
                        <PriceStockSection
                            price={formData.price} costPrice={formData.cost_price} stockQuantity={formData.stock_quantity}
                            onChange={(f, v) => setFormData(p => ({ ...p, [f]: v }))}
                            onPriceBlur={(f, v) => {
                                handlePriceBlur(f, v);
                                handleAutoSave();
                            }}
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Đơn vị</label>
                                <UnitSection
                                    units={units} selectedUnit={formData.unit}
                                    onChange={val => {
                                        const newData = { ...formData, unit: val };
                                        setFormData(newData);
                                        handleAutoSave(newData);
                                    }}
                                    onCreate={async (n) => {
                                        if (n) {
                                            const r = await api.post('/units', { name: n });
                                            setUnits(p => [...p, r.data]);
                                            const newData = { ...formData, unit: r.data.name };
                                            setFormData(newData);
                                            handleAutoSave(newData);
                                        }
                                    }}
                                    onEdit={handleEditUnit}
                                    onDelete={handleDeleteUnit}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nhóm hàng</label>
                                <CategorySection
                                    categories={categories} selectedCategory={formData.category}
                                    onChange={val => {
                                        const newData = { ...formData, category: val };
                                        setFormData(newData);
                                        handleAutoSave(newData);
                                    }}
                                    onCreate={async (n) => {
                                        if (n) {
                                            try {
                                                const r = await api.post('/categories', { name: n });
                                                setCategories(p => [...p, r.data]);
                                                const newData = { ...formData, category: r.data.name };
                                                setFormData(newData);
                                                handleAutoSave(newData);
                                            } catch (err) { showNotification('Lỗi khi tạo nhóm', 'error') }
                                        }
                                    }}
                                    onEdit={handleEditCategory}
                                    onDelete={handleDeleteCategory}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t bg-gray-50 sticky bottom-0 z-10">
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

