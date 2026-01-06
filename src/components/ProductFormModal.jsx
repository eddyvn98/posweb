import { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'
import { saveProductLocal, findProductByBarcode } from '../lib/db'
import { useNotification } from '../contexts/NotificationContext'
import BarcodeScanner from './BarcodeScanner'

export default function ProductFormModal({ product, onClose, onFinish }) {
    const { shop } = useAuth()
    const { pushProducts } = useSync()
    const { showNotification } = useNotification()
    const [loading, setLoading] = useState(false)
    const [formKey, setFormKey] = useState(0)
    const scanLock = useRef(false)
    const [isClosed, setIsClosed] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        barcode: '',
        price: '',
        cost_price: '',
        stock_quantity: 0,
        image_url: null
    })

    const [isContinuous, setIsContinuous] = useState(true)

    // 🎥 Cleanup camera when modal closes
    useEffect(() => {
        return () => {
            setIsClosed(true)
        }
    }, [])

    // Image Handle
    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            // Check size (max 500KB roughly)
            if (file.size > 500000) {
                alert('Ảnh quá lớn! Vui lòng chọn ảnh < 500KB')
                return
            }

            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image_url: reader.result }))
            }
            reader.readAsDataURL(file)
        }
    }

    const resetForm = () => {
        setFormData({
            name: '',
            barcode: '',
            price: '',
            cost_price: '',
            stock_quantity: 0,
            image_url: null
        })
    }

    const handleScan = async (code) => {
        if (product) return // Không scan khi đang edit sản phẩm cũ
        if (scanLock.current) return
        scanLock.current = true

        try {
            console.log('[ProductForm] Barcode scanned:', code)

            // 1. Nếu barcode đã tồn tại → load sản phẩm cũ
            const existingProduct = await findProductByBarcode(code)
            if (existingProduct) {
                setFormKey(k => k + 1)
                setFormData(existingProduct)
                showNotification(`📝 Tải: ${existingProduct.name}`, 'info')
                return
            }

            // 2. Nếu đang tạo liên tục + có sản phẩm hiện tại + quét mã khác
            if (isContinuous && formData.barcode && formData.barcode !== code) {
                // Auto-save nếu đủ dữ liệu
                if (formData.name?.trim() && formData.price) {
                    await handleAutoSave()
                }
                
                // 🔥 DÙ CÓ SAVE HAY KHÔNG → FORM PHẢI MỚI
                setFormKey(k => k + 1)
                setFormData({
                    name: '',
                    barcode: '',
                    price: '',
                    cost_price: '',
                    stock_quantity: 0,
                    image_url: null
                })

                // Focus vào barcode input để quét tiếp mượt
                requestAnimationFrame(() => {
                    document.getElementById('barcode-input')?.focus()
                })
            }

            // 3. GÁN BARCODE CHO FORM MỚI
            setFormData(prev => ({
                ...prev,
                barcode: code
            }))
        } finally {
            setTimeout(() => {
                scanLock.current = false
            }, 500) // debounce scan
        }
    }

    const handleAutoSave = async () => {
        if (!isContinuous) return

        try {
            const newProduct = {
                id: uuidv4(),
                shop_id: shop.id,
                ...formData,
                price: Number(formData.price),
                cost_price: Number(formData.cost_price),
                stock_quantity: Number(formData.stock_quantity),
                is_active: true,
                created_at: new Date().toISOString()
            }

            await saveProductLocal(newProduct)
            await pushProducts(newProduct)
            console.log('[ProductForm] Auto-saved:', newProduct.name)
            showNotification(`✅ Lưu: ${newProduct.name}`, 'success')
        } catch (err) {
            console.error('Auto-save error:', err)
            showNotification('❌ Lỗi lưu sản phẩm', 'error')
        }
    }

    useEffect(() => {
        if (product) {
            setFormKey(k => k + 1)
            setFormData(product)
        }
    }, [product])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const newProduct = {
                id: product?.id || uuidv4(),
                shop_id: shop.id,
                ...formData,
                price: Number(formData.price),
                cost_price: Number(formData.cost_price),
                stock_quantity: Number(formData.stock_quantity),
                is_active: true,
                created_at: product?.created_at || new Date().toISOString()
            }

            // 1. Save Local (Offline First)
            await saveProductLocal(newProduct)

            // 2. Sync to Server (if online)
            await pushProducts(newProduct)

            onFinish() // Reload list
            onClose()

        } catch (err) {
            console.error(err)
            alert('Lỗi: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const generateBarcode = () => {
        setFormData(prev => ({
            ...prev,
            barcode: `${Math.floor(Date.now() / 1000)}`
        }))
    }

    const handlePriceBlur = (field, value) => {
        let numeric = Number(value)
        if (!isNaN(numeric) && numeric > 0 && numeric < 1000) {
            // Smart input: '50' -> '50000'
            setFormData(prev => ({ ...prev, [field]: numeric * 1000 }))
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
                <form key={formKey} onSubmit={handleSubmit}>
                    <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                        <h2 className="text-lg font-bold">{product ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-red-500">✕</button>
                    </div>

                    <div className="p-4 space-y-3">
                        {/* Scanner - only active when creating (not editing) and modal is open */}
                        <BarcodeScanner onDetected={handleScan} active={!product && !isClosed} />

                        {/* Image Upload */}
                        <div className="flex bg-gray-50 p-2 rounded items-center gap-3">
                            <div className="w-16 h-16 bg-white border rounded flex items-center justify-center overflow-hidden shrink-0">
                                {formData.image_url ? (
                                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl opacity-20">📷</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 mb-1">ẢNH SẢN PHẨM</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="text-xs w-full file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                />
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tên sản phẩm *</label>
                            <input
                                autoFocus
                                required
                                className="input w-full"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        {/* Barcode */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mã vạch</label>
                            <div className="flex gap-2">
                                <input
                                    id="barcode-input"
                                    className="input flex-1"
                                    value={formData.barcode}
                                    onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={generateBarcode}
                                    className="btn bg-gray-100 text-xs px-2"
                                >
                                    Auto
                                </button>
                            </div>
                        </div>

                        {/* Prices */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Giá bán *</label>
                                <input
                                    type="number" required min="0" step="1000"
                                    className="input w-full font-mono text-lg font-bold text-primary"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    onBlur={(e) => handlePriceBlur('price', e.target.value)}
                                    placeholder="0"
                                />
                                <div className="text-[10px] text-gray-500 mt-1">
                                    {Number(formData.price) > 0 ? new Intl.NumberFormat('vi-VN').format(formData.price) : '0'} đ
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Giá vốn</label>
                                <input
                                    type="number" min="0" step="1000"
                                    className="input w-full"
                                    value={formData.cost_price}
                                    onChange={e => setFormData({ ...formData, cost_price: e.target.value })}
                                    onBlur={(e) => handlePriceBlur('cost_price', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Stock */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tồn kho ban đầu</label>
                            <input
                                type="number" required
                                className="input w-full"
                                value={formData.stock_quantity}
                                onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="p-4 border-t bg-gray-50">
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 btn bg-gray-200"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 btn-primary"
                            >
                                {loading ? 'Đang lưu...' : 'LƯU SẢN PHẨM'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
