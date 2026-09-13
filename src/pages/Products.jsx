import { useState, useEffect, useRef } from 'react'
import api from '../lib/api'
import { matchProduct, sortSearchResults } from '../lib/searchUtils'
import { getAllLocalProducts } from '../lib/db'
import ProductFormModal from '../components/ProductFormModal'
import BulkImportModal from '../components/BulkImportModal'
import { useCart } from '../contexts/CartContext'
import { useNotification } from '../contexts/NotificationContext'
import { useScanBarcode } from '../hooks/useScanBarcode'
import { useSync } from '../contexts/SyncContext'
import { Check } from 'lucide-react'

export default function Products() {
    const { addToCart } = useCart()
    const { showNotification } = useNotification()
    const { deleteProduct } = useSync()

    const [query, setQuery] = useState('')
    const [allProducts, setAllProducts] = useState([])
    const [products, setProducts] = useState([])
    const [editingProduct, setEditingProduct] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [showBulkModal, setShowBulkModal] = useState(false)

    const [selectedProducts, setSelectedProducts] = useState([])
    const [isSelectionMode, setIsSelectionMode] = useState(false)
    const longPressTimer = useRef(null)
    const longPressTriggered = useRef(false)

    const [filter, setFilter] = useState('all')
    const [sortBy, setSortBy] = useState('name_asc')

    const toggleSelect = (id) => {
        setSelectedProducts((prev) => {
            const next = prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
            if (next.length === 0) setIsSelectionMode(false)
            return next
        })
    }

    const startLongPress = (id) => {
        clearLongPress()
        longPressTriggered.current = false
        longPressTimer.current = setTimeout(() => {
            longPressTriggered.current = true
            setIsSelectionMode(true)
            toggleSelect(id)
        }, 500)
    }

    const clearLongPress = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current)
        longPressTimer.current = null
    }

    const handleScan = async (code) => {
        if (showModal || showBulkModal) return

        const existing = allProducts.find((product) => product.barcode === code)
        if (existing) {
            setEditingProduct(existing)
            setShowModal(true)
            showNotification(`Đã tìm thấy: ${existing.name}`, 'info')
        } else {
            setEditingProduct({ barcode: code, name: '', price: '', stock_quantity: 1 })
            setShowModal(true)
            showNotification(`Mã mới: ${code}. Đang tạo nháp...`, 'info')
        }
    }

    useScanBarcode({ onScan: handleScan })

    const fetchProducts = async () => {
        try {
            const [apiRes, localProducts] = await Promise.all([
                api.get('/products'),
                getAllLocalProducts()
            ])

            const merged = new Map()

            ;(localProducts || []).forEach((product) => {
                const key = product.barcode || product.id
                if (key && (product.name?.trim() || product.barcode?.trim())) merged.set(key, product)
            })

            // The authenticated inventory response is authoritative for
            // offline price, online price, promotion price, and stock.
            ;(apiRes.data || []).forEach((product) => {
                const key = product.barcode || product.id
                if (key && (product.name?.trim() || product.barcode?.trim())) merged.set(key, product)
            })

            setAllProducts(Array.from(merged.values()))
        } catch (error) {
            console.error('Failed to fetch products', error)
            showNotification('Lỗi tải sản phẩm', 'error')
        }
    }

    useEffect(() => { fetchProducts() }, [])

    useEffect(() => {
        let processed = [...allProducts]
        if (query && query.trim()) {
            processed = processed.filter((product) => matchProduct(product, query))
            processed = sortSearchResults(processed, query)
        } else {
            processed.sort((a, b) => {
                if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '')
                if (sortBy === 'price_asc') return a.price - b.price
                if (sortBy === 'price_desc') return b.price - a.price
                if (sortBy === 'stock_asc') return a.stock_quantity - b.stock_quantity
                return 0
            })
        }
        if (filter === 'low_stock') processed = processed.filter((product) => product.stock_quantity < 10)
        setProducts(processed)
    }, [allProducts, query, filter, sortBy])

    const handleCreate = () => {
        setEditingProduct(null)
        setShowModal(true)
    }

    const handleEdit = (product) => {
        setEditingProduct(product)
        setShowModal(true)
    }

    const handleCardClick = (product) => {
        if (longPressTriggered.current) {
            longPressTriggered.current = false
            return
        }
        if (isSelectionMode) {
            toggleSelect(product.id)
            return
        }
        handleEdit(product)
    }

    const handleDeleteSelected = async () => {
        if (!selectedProducts.length) return
        if (!confirm(`Bạn chắc chắn muốn xóa ${selectedProducts.length} sản phẩm đã chọn?`)) return

        const idsToDelete = [...selectedProducts]
        let successCount = 0

        setAllProducts((prev) => prev.filter((product) => !idsToDelete.includes(product.id)))
        setSelectedProducts([])
        setIsSelectionMode(false)

        for (const id of idsToDelete) {
            try {
                await deleteProduct(id)
                successCount++
            } catch (error) {
                console.error('Failed to delete', id, error)
            }
        }

        await fetchProducts()
        showNotification(`Đã xóa ${successCount} sản phẩm`, 'info')
    }

    const handleAddToCart = (event, product) => {
        event.stopPropagation()
        addToCart(product)
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white shadow-sm p-4 sticky top-0 z-10 flex flex-col gap-3 border-b">
                <div className="flex gap-3 items-center">
                    <h1 className="text-2xl font-bold flex-1 text-gray-900 tracking-tight">
                        {isSelectionMode ? `${selectedProducts.length} đang chọn` : 'Sản phẩm'}
                    </h1>
                    <div className="flex gap-2">
                        {isSelectionMode ? (
                            <>
                                <button
                                    onClick={() => {
                                        setIsSelectionMode(false)
                                        setSelectedProducts([])
                                    }}
                                    className="btn-secondary btn-sm"
                                >
                                    Hủy
                                </button>
                                <button onClick={handleDeleteSelected} className="btn-danger btn-sm">
                                    Xóa ({selectedProducts.length})
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setShowBulkModal(true)} className="btn-warning btn-sm">
                                    Quét lô
                                </button>
                                <button onClick={handleCreate} className="btn-primary btn-sm">
                                    + Tạo mới
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        className="input flex-1 border-slate-200 text-sm"
                        placeholder="Tìm kiếm theo tên hoặc mã vạch..."
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <select className="input py-1 px-2.5 text-xs w-auto border-slate-200 min-h-[36px] bg-white font-medium text-slate-700" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                        <option value="name_asc">Tên A-Z</option>
                        <option value="price_asc">Giá tăng dần</option>
                        <option value="price_desc">Giá giảm dần</option>
                        <option value="stock_asc">Tồn kho ít</option>
                    </select>
                    <button
                        onClick={() => setFilter(filter === 'all' ? 'low_stock' : 'all')}
                        className={filter === 'low_stock' ? 'btn-warning btn-sm' : 'btn-secondary btn-sm'}
                    >
                        {filter === 'low_stock' ? 'Sắp hết hàng' : 'Tất cả'}
                    </button>
                </div>
            </div>

            <div className="p-3">
                {products.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                        <p className="text-slate-500 font-medium text-sm">{query ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm nào'}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                onPointerDown={(event) => {
                                    if (event.pointerType === 'mouse' && event.button !== 0) return
                                    startLongPress(product.id)
                                }}
                                onPointerUp={clearLongPress}
                                onPointerLeave={clearLongPress}
                                onPointerCancel={clearLongPress}
                                onClick={() => handleCardClick(product)}
                                className={`relative group active:scale-[0.98] transition-all flex flex-col justify-between h-full border overflow-hidden p-3 rounded-xl select-none ${selectedProducts.includes(product.id) ? 'border-sky-600 ring-2 ring-sky-600/20 bg-sky-50/20' : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'}`}
                            >
                                {selectedProducts.includes(product.id) && (
                                    <div className="absolute top-2 right-2 z-20 bg-sky-600 text-white w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                                        <Check className="w-3.5 h-3.5 text-white" />
                                    </div>
                                )}

                                <div className={`absolute top-2.5 left-2.5 z-10 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${product.stock_quantity < 10 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-sky-50 text-sky-700 border-sky-200'}`}>
                                    KHO: {product.stock_quantity}
                                </div>
                                <div className="h-28 w-full bg-slate-50 rounded-lg mb-2.5 flex items-center justify-center text-slate-300 overflow-hidden border border-slate-100">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    ) : (
                                        <span className="text-xs font-semibold text-slate-400">SP</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm text-slate-900 line-clamp-2 leading-snug mb-1">{product.name}</h3>
                                    <p className="text-[10px] text-slate-400 truncate font-mono">{product.barcode}</p>
                                </div>
                                <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-slate-900 text-base font-mono tabular-nums leading-none">
                                            {new Intl.NumberFormat('vi-VN').format(product.price)}
                                            <span className="text-xs font-normal text-slate-500 ml-0.5">đ</span>
                                        </div>
                                        {Number(product.online_price) > 0 && (
                                            <div className="text-[11px] font-medium text-blue-600 font-mono mt-1">
                                                Onl: {new Intl.NumberFormat('vi-VN').format(product.online_price)}đ
                                                {Number(product.promo_price) > 0 && Number(product.promo_price) < Number(product.online_price) && (
                                                    <span className="text-emerald-600 ml-1">
                                                        (KM: {new Intl.NumberFormat('vi-VN').format(product.promo_price)}đ)
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-1.5" onClick={(event) => event.stopPropagation()}>
                                        {!isSelectionMode && (
                                            <button onClick={(event) => handleAddToCart(event, product)} className="w-7 h-7 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 font-bold flex items-center justify-center active:scale-90 transition-transform">
                                                +
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <ProductFormModal
                    product={editingProduct}
                    onClose={() => {
                        setShowModal(false)
                        fetchProducts()
                    }}
                    onFinish={fetchProducts}
                />
            )}
            {showBulkModal && <BulkImportModal onClose={() => setShowBulkModal(false)} onFinish={fetchProducts} />}
        </div>
    )
}
