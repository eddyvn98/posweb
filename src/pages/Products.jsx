import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchLocalProducts, deleteProductLocal } from '../lib/db'
import ProductFormModal from '../components/ProductFormModal'
import { useSync } from '../contexts/SyncContext'
import { useCart } from '../contexts/CartContext'
import { useNotification } from '../contexts/NotificationContext'

export default function Products() {
    const navigate = useNavigate()
    const { pushProducts } = useSync()
    const { addToCart } = useCart()
    const { showNotification } = useNotification()

    const [query, setQuery] = useState('')
    const [products, setProducts] = useState([])
    const [editingProduct, setEditingProduct] = useState(null)
    const [showModal, setShowModal] = useState(false)

    // Filters
    const [filter, setFilter] = useState('all') // all, low_stock
    const [sortBy, setSortBy] = useState('name_asc') // name_asc, price_asc, price_desc

    const loadProducts = async () => {
        const results = await searchLocalProducts(query || ' ')

        // Client-side Sort & Filter
        let processed = [...results]

        // Filter
        if (filter === 'low_stock') {
            processed = processed.filter(p => p.stock_quantity < 10)
        }

        // Sort
        processed.sort((a, b) => {
            if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
            if (sortBy === 'price_asc') return a.price - b.price
            if (sortBy === 'price_desc') return b.price - a.price
            if (sortBy === 'stock_asc') return a.stock_quantity - b.stock_quantity
            return 0
        })

        setProducts(processed)
    }

    useEffect(() => {
        loadProducts()
    }, [query, filter, sortBy])

    const handleCreate = () => {
        setEditingProduct(null)
        setShowModal(true)
    }

    const handleEdit = (p) => {
        setEditingProduct(p)
        setShowModal(true)
    }

    const handleDelete = async (e, id) => {
        e.stopPropagation()
        if (confirm('Bạn chắc chắn muốn xoá?')) {
            await deleteProductLocal(id)
            loadProducts()
            showNotification('Đã xóa sản phẩm', 'info')
        }
    }

    const handleAddToCart = (e, product) => {
        e.stopPropagation()
        addToCart(product)
        // showNotification moved to CartBar animation
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm p-4 sticky top-0 z-10 flex flex-col gap-3 border-b">
                <div className="flex gap-3 items-center">
                    <h1 className="text-xl font-black flex-1 text-gray-800 uppercase tracking-tighter">Sản phẩm</h1>
                    <button onClick={handleCreate} className="btn-primary px-4 shadow-lg text-sm font-bold h-10 rounded-xl">
                        + Tạo mới
                    </button>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        className="input flex-1 focus:ring-primary focus:border-primary"
                        placeholder="Tìm kiếm sản phẩm..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <select
                        className="input py-1 px-2 text-sm w-auto border-gray-200 min-h-[36px] bg-white font-medium"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="name_asc">Tên A-Z</option>
                        <option value="price_asc">Giá tăng dần</option>
                        <option value="price_desc">Giá giảm dần</option>
                        <option value="stock_asc">Tồn kho ít</option>
                    </select>

                    <button
                        onClick={() => setFilter(filter === 'all' ? 'low_stock' : 'all')}
                        className={`btn text-xs px-3 min-h-[36px] border font-bold transition-all ${filter === 'low_stock' ? 'bg-orange-100 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-600'}`}
                    >
                        {filter === 'low_stock' ? '🧹 Sắp hết hàng' : '📦 Tất cả'}
                    </button>
                </div>
            </div>

            {/* Grid List */}
            <div className="p-3">
                {products.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-5xl mb-4">
                            {query ? '🔍' : '📦'}
                        </p>
                        <p className="text-gray-600 font-bold text-lg">
                            {query ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm nào'}
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                            {query ? 'Thử tìm kiếm từ khóa khác' : 'Nhấn "+ Tạo mới" để thêm sản phẩm'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {products.map(p => (
                            <div
                                key={p.id}
                                onClick={() => handleEdit(p)}
                                className="card p-3 relative group active:scale-[0.98] transition-all flex flex-col h-full border border-gray-100 bg-white hover:border-primary/50 shadow-sm hover:shadow-md rounded-2xl overflow-hidden"
                            >
                                {/* Stock Badge */}
                                <div className={`absolute top-3 left-3 z-10 text-[10px] px-2 py-0.5 rounded-full font-black ${p.stock_quantity < 10 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                    KHO: {p.stock_quantity}
                                </div>

                                <div className="h-32 w-full bg-gray-50 rounded-xl mb-3 flex items-center justify-center text-4xl select-none overflow-hidden border border-gray-50">
                                    {p.image_url ? (
                                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <span className="opacity-10">📦</span>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm text-gray-800 line-clamp-2 leading-tight mb-1 group-hover:text-primary transition-colors">{p.name}</h3>
                                    <p className="text-[10px] text-gray-400 truncate font-mono uppercase tracking-tighter">{p.barcode}</p>
                                </div>

                                <div className="mt-3 flex justify-between items-end">
                                    <div className="font-black text-primary text-lg">
                                        {new Intl.NumberFormat('vi-VN').format(p.price)}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={(e) => handleAddToCart(e, p)}
                                            className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white active:scale-90 transition-all shadow-sm shadow-blue-100"
                                            title="Thêm vào giỏ"
                                        >
                                            <span className="text-xl">🛒</span>
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, p.id)}
                                            className="w-10 h-10 rounded-xl bg-gray-50 text-gray-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center active:scale-90 transition-all"
                                        >
                                            <span className="text-lg">✕</span>
                                        </button>
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
                    onClose={() => setShowModal(false)}
                    onFinish={loadProducts}
                />
            )}
        </div>
    )
}
