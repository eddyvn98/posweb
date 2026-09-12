import { useState, useEffect, useRef } from 'react'
import api from '../lib/api'
import { matchProduct } from '../lib/searchUtils'
import { getAllLocalProducts } from '../lib/db'
import ProductFormModal from '../components/ProductFormModal'
import BulkImportModal from '../components/BulkImportModal'
import { useCart } from '../contexts/CartContext'
import { useNotification } from '../contexts/NotificationContext'
import { useScanBarcode } from '../hooks/useScanBarcode'
import { useSync } from '../contexts/SyncContext'

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
                if (key) merged.set(key, product)
            })

            // The authenticated inventory response is authoritative for
            // offline price, online price, promotion price, and stock.
            ;(apiRes.data || []).forEach((product) => {
                const key = product.barcode || product.id
                if (key) merged.set(key, product)
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
        }
        if (filter === 'low_stock') processed = processed.filter((product) => product.stock_quantity < 10)
        processed.sort((a, b) => {
            if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
            if (sortBy === 'price_asc') return a.price - b.price
            if (sortBy === 'price_desc') return b.price - a.price
            if (sortBy === 'stock_asc') return a.stock_quantity - b.stock_quantity
            return 0
        })
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
                    <h1 className="text-xl font-black flex-1 text-gray-800 uppercase tracking-tighter">
                        {isSelectionMode ? `${selectedProducts.length} đang chọn` : 'SẢN PHẨM'}
                    </h1>
                    <div className="flex gap-2">
                        {isSelectionMode ? (
                            <>
                                <button
                                    onClick={() => {
                                        setIsSelectionMode(false)
                                        setSelectedProducts([])
                                    }}
                                    className="btn bg-gray-100 text-gray-600 px-3 text-xs font-bold h-10 rounded-xl"
                                >
                                    Hủy
                                </button>
                                <button onClick={handleDeleteSelected} className="btn bg-red-500 text-white px-4 shadow-lg text-sm font-bold h-10 rounded-xl">
                                    Xóa hết
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setShowBulkModal(true)} className="btn bg-orange-50 text-orange-600 px-3 text-xs font-bold h-10 rounded-xl border border-orange-100">
                                    Quét lô
                                </button>
                                <button onClick={handleCreate} className="btn-primary px-4 shadow-lg text-sm font-bold h-10 rounded-xl">
                                    + Tạo mới
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        className="input flex-1"
                        placeholder="Tìm kiếm sản phẩm..."
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <select className="input py-1 px-2 text-sm w-auto border-gray-200 min-h-[36px] bg-white font-medium" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                        <option value="name_asc">Tên A-Z</option>
                        <option value="price_asc">Giá tăng dần</option>
                        <option value="price_desc">Giá giảm dần</option>
                        <option value="stock_asc">Tồn kho ít</option>
                    </select>
                    <button
                        onClick={() => setFilter(filter === 'all' ? 'low_stock' : 'all')}
                        className={`btn text-xs px-3 min-h-[36px] border font-bold transition-all ${filter === 'low_stock' ? 'bg-orange-100 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-600'}`}
                    >
                        {filter === 'low_stock' ? 'Sắp hết hàng' : 'Tất cả'}
                    </button>
                </div>
            </div>

            <div className="p-3">
                {products.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-gray-600 font-bold text-lg">{query ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm nào'}</p>
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
                                className={`card p-3 relative group active:scale-[0.98] transition-all flex flex-col h-full border overflow-hidden ${selectedProducts.includes(product.id) ? 'border-primary ring-2 ring-primary bg-primary/5' : 'border-gray-100 bg-white hover:border-primary/50 shadow-sm'} rounded-2xl`}
                            >
                                {selectedProducts.includes(product.id) && (
                                    <div className="absolute top-2 right-2 z-20 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
                                        ✓
                                    </div>
                                )}

                                <div className={`absolute top-3 left-3 z-10 text-[10px] px-2 py-0.5 rounded-full font-black ${product.stock_quantity < 10 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                    KHO: {product.stock_quantity}
                                </div>
                                <div className="h-32 w-full bg-gray-50 rounded-xl mb-3 flex items-center justify-center text-4xl overflow-hidden border">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                    ) : (
                                        <span className="opacity-10">SP</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm text-gray-800 line-clamp-2 leading-tight mb-1 uppercase tracking-tight">{product.name}</h3>
                                    <p className="text-[10px] text-gray-400 truncate font-mono">{product.barcode}</p>
                                </div>
                                <div className="mt-3 flex justify-between items-end">
                                    <div className="font-black text-primary text-lg">{new Intl.NumberFormat('vi-VN').format(product.price)}</div>
                                    <div className="flex gap-1.5" onClick={(event) => event.stopPropagation()}>
                                        {!isSelectionMode && (
                                            <button onClick={(event) => handleAddToCart(event, product)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center active:scale-90 transition-transform">
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
