import { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'
import { saveProductLocal, findProductByBarcode } from '../lib/db'
import { useNotification } from '../contexts/NotificationContext'
import api from '../lib/api'
import BarcodeScanner from './BarcodeScanner'

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

    const [formData, setFormData] = useState({
        name: '',
        barcode: '',
        unit: DEFAULT_UNIT,
        price: '',
        cost_price: '',
        stock_quantity: 0,
        image_url: null
    })

    const [isContinuous] = useState(true)

    useEffect(() => {
        return () => {
            setIsClosed(true)
        }
    }, [])

    const loadUnits = async () => {
        try {
            const response = await api.get('/units')
            const data = Array.isArray(response.data) ? response.data : []
            setUnits(data)
            if (data.length > 0 && !formData.unit) {
                setFormData((prev) => ({ ...prev, unit: data[0].name }))
            }
        } catch (err) {
            console.error('Load units error:', err)
            setUnits([])
        }
    }

    useEffect(() => {
        loadUnits()
    }, [])

    const handleCreateUnit = async () => {
        const name = prompt('Nhập tên đơn vị mới')
        if (!name?.trim()) return
        try {
            const response = await api.post('/units', { name: name.trim() })
            const created = response.data
            setUnits((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
            setFormData((prev) => ({ ...prev, unit: created.name }))
            showNotification('Đã tạo đơn vị mới', 'success')
        } catch (err) {
            showNotification(err.response?.data?.error || 'Không thể tạo đơn vị', 'error')
        }
    }

    const handleEditUnit = async () => {
        const selected = units.find((u) => u.name === formData.unit)
        if (!selected) {
            showNotification('Vui lòng chọn đơn vị trước', 'info')
            return
        }

        const name = prompt('Sửa tên đơn vị', selected.name)
        if (!name?.trim() || name.trim() === selected.name) return

        try {
            await api.patch(`/units/${selected.id}`, { name: name.trim() })
            await loadUnits()
            setFormData((prev) => ({ ...prev, unit: name.trim() }))
            showNotification('Đã cập nhật đơn vị', 'success')
        } catch (err) {
            showNotification(err.response?.data?.error || 'Không thể sửa đơn vị', 'error')
        }
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            if (file.size > 500000) {
                alert('Ảnh quá lớn! Vui lòng chọn ảnh < 500KB')
                return
            }

            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData((prev) => ({ ...prev, image_url: reader.result }))
            }
            reader.readAsDataURL(file)
        }
    }

    const handleScan = async (code) => {
        if (product) return
        if (scanLock.current) return
        scanLock.current = true

        try {
            const existingProduct = await findProductByBarcode(code)
            if (existingProduct) {
                setFormKey((k) => k + 1)
                setFormData({
                    ...existingProduct,
                    unit: existingProduct.unit || DEFAULT_UNIT
                })
                showNotification(`Tải: ${existingProduct.name}`, 'info')
                return
            }

            if (isContinuous && formData.barcode && formData.barcode !== code) {
                if (formData.name?.trim() && formData.price) {
                    await handleAutoSave()
                }

                setFormKey((k) => k + 1)
                setFormData({
                    name: '',
                    barcode: '',
                    unit: DEFAULT_UNIT,
                    price: '',
                    cost_price: '',
                    stock_quantity: 0,
                    image_url: null
                })

                requestAnimationFrame(() => {
                    document.getElementById('barcode-input')?.focus()
                })
            }

            setFormData((prev) => ({
                ...prev,
                barcode: code
            }))
        } finally {
            setTimeout(() => {
                scanLock.current = false
            }, 500)
        }
    }

    const handleAutoSave = async () => {
        if (!isContinuous) return

        try {
            const newProduct = {
                id: uuidv4(),
                shop_id: shop.id,
                ...formData,
                unit: formData.unit || DEFAULT_UNIT,
                price: Number(formData.price),
                cost_price: Number(formData.cost_price),
                stock_quantity: Number(formData.stock_quantity),
                is_active: true,
                created_at: new Date().toISOString()
            }

            await saveProductLocal(newProduct)
            await pushProducts(newProduct)
            showNotification(`Lưu: ${newProduct.name}`, 'success')
        } catch (err) {
            console.error('Auto-save error:', err)
            showNotification('Lỗi lưu sản phẩm', 'error')
        }
    }

    useEffect(() => {
        if (product) {
            setFormKey((k) => k + 1)
            setFormData({
                ...product,
                unit: product.unit || DEFAULT_UNIT
            })
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
                unit: formData.unit || DEFAULT_UNIT,
                price: Number(formData.price),
                cost_price: Number(formData.cost_price),
                stock_quantity: Number(formData.stock_quantity),
                is_active: true,
                created_at: product?.created_at || new Date().toISOString()
            }

            await saveProductLocal(newProduct)
            await pushProducts(newProduct)

            onFinish()
            onClose()
        } catch (err) {
            console.error(err)
            alert(`Lỗi: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    const generateBarcode = () => {
        setFormData((prev) => ({
            ...prev,
            barcode: `${Math.floor(Date.now() / 1000)}`
        }))
    }

    const handlePriceBlur = (field, value) => {
        const numeric = Number(value)
        if (!Number.isNaN(numeric) && numeric > 0 && numeric < 1000) {
            setFormData((prev) => ({ ...prev, [field]: numeric * 1000 }))
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
                        <BarcodeScanner onDetected={handleScan} active={!product && !isClosed} />

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

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tên sản phẩm *</label>
                            <input
                                autoFocus
                                required
                                className="input w-full"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mã vạch</label>
                            <div className="flex gap-2">
                                <input
                                    id="barcode-input"
                                    className="input flex-1"
                                    value={formData.barcode}
                                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Đơn vị</label>
                            <div className="flex gap-2">
                                <select
                                    className="input flex-1"
                                    value={formData.unit || DEFAULT_UNIT}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                >
                                    {units.length === 0 && <option value={DEFAULT_UNIT}>{DEFAULT_UNIT}</option>}
                                    {units.map((unit) => (
                                        <option key={unit.id} value={unit.name}>{unit.name}</option>
                                    ))}
                                </select>
                                <button type="button" onClick={handleCreateUnit} className="btn bg-green-50 text-green-700 text-xs px-2">
                                    + ĐV
                                </button>
                                <button type="button" onClick={handleEditUnit} className="btn bg-amber-50 text-amber-700 text-xs px-2">
                                    Sửa
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Giá bán *</label>
                                <input
                                    type="number" required min="0" step="1000"
                                    className="input w-full font-mono text-lg font-bold text-primary"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
                                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                                    onBlur={(e) => handlePriceBlur('cost_price', e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tồn kho ban đầu</label>
                            <input
                                type="number" required
                                className="input w-full"
                                value={formData.stock_quantity}
                                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
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
