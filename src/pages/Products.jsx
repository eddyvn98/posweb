import React, { useState, useEffect, useRef } from 'react'
import api from '../lib/api'
import { matchProduct } from '../lib/searchUtils'
import { getAllLocalProducts } from '../lib/db'
import ProductFormModal from '../components/ProductFormModal'
import BulkImportModal from '../components/BulkImportModal'
import { useCart } from '../contexts/CartContext'
import { useNotification } from '../contexts/NotificationContext'
import { useScanBarcode } from '../hooks/useScanBarcode'
import { useSync } from '../contexts/SyncContext'
import { useAuth } from '../contexts/AuthContext'
import { getProductImageUrl } from '../lib/imageUtils'
import { useNavigate } from 'react-router-dom'
import { Search, Package, Plus, X, Check, LayoutGrid, FileSpreadsheet, Wrench, Zap, QrCode, ChevronDown, ChevronRight } from '../components/Icons'
import BarcodeScanner from '../components/BarcodeScanner'
import './Products.css'

let productScreenWarmCache = []

export default function Products() {
    const navigate = useNavigate()
    const { isGuest } = useAuth()
    const { addToCart, cart } = useCart()
    const getCartQty = (id) => {
        const targetId = String(id ?? '')
        return cart.find(item => String(item.product_id || item.id) === targetId)?.quantity || 0
    }

    const { fabPosition } = useCart()

    const { showNotification } = useNotification()
    const { deleteProduct, pushProducts } = useSync()

    const [query, setQuery] = useState('')
    const [allProducts, setAllProducts] = useState([])
    const [products, setProducts] = useState([])
    const [loadingProducts, setLoadingProducts] = useState(true)
    const [editingProduct, setEditingProduct] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [showBulkModal, setShowBulkModal] = useState(false)

    const [selectedProducts, setSelectedProducts] = useState([])
    const [isSelectionMode, setIsSelectionMode] = useState(false)
    const [expandedRows, setExpandedRows] = useState([]) // [parentId, ...]

    const toggleExpanded = (parentId) => {
        setExpandedRows(prev => 
            prev.includes(parentId) 
            ? prev.filter(id => id !== parentId) 
            : [...prev, parentId]
        )
    }

    const [filter, setFilter] = useState('all')
    const [sortBy, setSortBy] = useState('name_asc')
    const [categories, setCategories] = useState([])
    const [selectedCategory, setSelectedCategory] = useState('')

    const [updatingId, setUpdatingId] = useState(null)
    const [viewMode, setViewMode] = useState(localStorage.getItem('posweb:products_view_mode') || 'sheet')
    const [showCamera, setShowCamera] = useState(false)

    const toggleViewMode = () => {
        const next = viewMode === 'sheet' ? 'grid' : 'sheet'
        setViewMode(next)
        localStorage.setItem('posweb:products_view_mode', next)
    }

    const toggleSelect = (id) => {
        setSelectedProducts((prev) => {
            const isSelected = prev.includes(id)
            const next = isSelected ? prev.filter((itemId) => itemId !== id) : [...prev, id]
            setIsSelectionMode(next.length > 0)
            return next
        })
    }

    const handleScan = async (code) => {
        if (showModal || showBulkModal) return
        const existing = allProducts.find((product) => product.barcode === code)
        if (existing) {
            handleEdit(existing)
            showNotification(`Đã tìm thấy: ${existing.name}`, 'info')
        } else {
            setEditingProduct({ barcode: code, name: '', price: '', stock_quantity: 1 })
            setShowModal(true)
            showNotification(`Mã mới: ${code}. Đang tạo nháp...`, 'info')
        }
    }

    useScanBarcode({ onScan: handleScan })

    const fetchCategories = async () => {
        try {
            if (!isGuest) {
                const res = await api.get('/categories')
                setCategories(Array.isArray(res.data) ? res.data : [])
            } else {
                const { MOCK_CATEGORIES } = await import('../lib/mockData')
                setCategories(MOCK_CATEGORIES)
            }
        } catch (err) {
            console.error('Failed to fetch categories', err)
        }
    }

    const fetchProducts = async () => {
        setLoadingProducts(true)
        if (productScreenWarmCache.length > 0) {
            setAllProducts(productScreenWarmCache)
            setLoadingProducts(false)
        }

        let localProducts = []
        try {
            localProducts = await getAllLocalProducts()
            if (localProducts.length > 0) {
                setAllProducts(localProducts)
                setLoadingProducts(false)
            }
        } catch (error) {
            console.error('Failed to fetch products from local cache', error)
        }

        if (isGuest) {
            setLoadingProducts(false)
            return
        }

        try {
            const apiRes = await api.get('/products')
            const apiProducts = apiRes.data || []
            const merged = new Map()
            localProducts.forEach(p => { const key = p.id || p.barcode; if (key) merged.set(key, p) })
            apiProducts.forEach(p => { const key = p.id || p.barcode; if (key) merged.set(key, p) })
            const nextProducts = Array.from(merged.values())
            productScreenWarmCache = nextProducts
            setAllProducts(nextProducts)
        } catch (error) {
            console.error('Failed to fetch products from server', error)
        } finally {
            setLoadingProducts(false)
        }
    }

    useEffect(() => { 
        fetchProducts() 
        fetchCategories()
    }, [])

    useEffect(() => {
        const onGuestSeeded = () => {
            fetchProducts()
        }
        window.addEventListener('posweb:guest-seeded', onGuestSeeded)
        return () => window.removeEventListener('posweb:guest-seeded', onGuestSeeded)
    }, [isGuest])

    useEffect(() => {
        // 1. Identify Parents and Children
        const parents = allProducts.filter(p => !p.parent_id);
        const children = allProducts.filter(p => p.parent_id);

        let processed = parents.map(parent => {
            const myChildren = children.filter(c => c.parent_id === parent.id);
            if (myChildren.length === 0) return { ...parent, hasVariants: false };

            // Aggregate data
            const totalStock = myChildren.reduce((sum, c) => sum + (Number(c.stock_quantity) || 0), 0);
            const prices = myChildren.map(c => Number(c.price)).filter(p => p > 0);
            const minPrice = prices.length > 0 ? Math.min(...prices) : parent.price;
            const maxPrice = prices.length > 0 ? Math.max(...prices) : parent.price;
            
            // Join children barcodes for searchability
            const childBarcodes = myChildren.map(c => c.barcode).filter(b => b).join(' ');

            return {
                ...parent,
                hasVariants: true,
                variantCount: myChildren.length,
                stock_quantity: totalStock,
                minPrice,
                maxPrice,
                variants: myChildren,
                childBarcodes, // Searchable field
                // Keep prices consistent for sorting
                price: minPrice 
            };
        });

        // 2. Apply Filters
        if (query && query.trim()) {
            const q = query.trim().toLowerCase();
            processed = processed.filter((product) => {
                const matchBase = matchProduct(product, q);
                const matchChildBarcode = product.childBarcodes && product.childBarcodes.toLowerCase().includes(q);
                return matchBase || matchChildBarcode;
            });
        }
        if (filter === 'low_stock') {
            processed = processed.filter((product) => product.stock_quantity < 10);
        }
        if (selectedCategory) {
            processed = processed.filter((product) => {
                const isMainCategory = product.category === selectedCategory
                if (isMainCategory) return true
                
                // Also check classifications
                const classifs = typeof product.classifications === 'string' 
                    ? JSON.parse(product.classifications) 
                    : (product.classifications || {})
                return Object.values(classifs).some(v => String(v) === selectedCategory)
            });
        }

        // 3. Sorting
        processed.sort((a, b) => {
            if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
            if (sortBy === 'price_asc') return a.price - b.price;
            if (sortBy === 'price_desc') return b.price - a.price;
            if (sortBy === 'stock_asc') return a.stock_quantity - b.stock_quantity;
            return 0;
        });
        setProducts(processed);
    }, [allProducts, query, filter, sortBy, selectedCategory])

    const handleCreate = () => {
        setEditingProduct(null)
        setShowModal(true)
    }

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Delete' && selectedProducts.length > 0 && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT' && e.target.tagName !== 'TEXTAREA') {
                if (window.confirm(`Bạn có chắc muốn xóa ${selectedProducts.length} sản phẩm đã chọn?`)) {
                    handleBulkDelete()
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedProducts])

    const handleEdit = (product) => {
        setEditingProduct(product)
        setShowModal(true)
    }

    const handleUpdateInline = async (product, field, value) => {
        if (isGuest) return
        if (product[field] === value) return

        const updatedProduct = { ...product, [field]: value }
        
        // Optimistic update
        setAllProducts(prev => prev.map(p => p.id === product.id ? updatedProduct : p))
        setUpdatingId(product.id)

        try {
            await pushProducts(updatedProduct)
        } catch (error) {
            showNotification('Không thể lưu thay đổi', 'error')
            fetchProducts() // Rollback
        } finally {
            setUpdatingId(null)
        }
    }

    const handleDeleteSelected = async () => {
        if (!selectedProducts.length) return
        if (!confirm(`Bạn chắc chắn muốn xóa ${selectedProducts.length} sản phẩm đã chọn?`)) return

        const idsToDelete = [...selectedProducts]
        setAllProducts((prev) => prev.filter((product) => !idsToDelete.includes(product.id)))
        setSelectedProducts([])
        setIsSelectionMode(false)

        for (const id of idsToDelete) {
            try { await deleteProduct(id) } catch (error) { console.error('Failed to delete', id, error) }
        }
        showNotification(`Đã xóa ${idsToDelete.length} sản phẩm`, 'info')
    }

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            <div className="bg-white p-3 md:p-4 flex flex-col gap-3 md:gap-4 border-b shadow-sm z-30">
                {/* Row 1: Title and Main Actions */}
                <div className="flex flex-row items-center justify-between gap-3">
                    <h1 className="text-lg md:text-xl font-black text-gray-800 uppercase tracking-tighter truncate flex-1">
                        {isSelectionMode ? (
                            <span className="text-primary flex items-center gap-2">
                                <span className="bg-primary/10 px-2 py-0.5 rounded-lg text-sm">{selectedProducts.length}</span>
                                <span className="hidden xs:inline">Đang chọn</span>
                            </span>
                        ) : (
                            <>
                                KHO HÀNG
                                {updatingId && <span className="ml-2 text-[10px] normal-case font-normal text-blue-500 animate-pulse">Đang lưu...</span>}
                            </>
                        )}
                    </h1>
                    
                    <div className="flex items-center gap-1.5 md:gap-2">
                        {isSelectionMode ? (
                            <>
                                <button onClick={() => { setIsSelectionMode(false); setSelectedProducts([]) }} className="h-9 md:h-10 px-3 text-xs font-bold rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                                    Hủy
                                </button>
                                <button onClick={handleDeleteSelected} className="h-9 md:h-10 px-4 text-xs md:text-sm font-bold rounded-xl bg-red-500 text-white shadow-lg shadow-red-100 active:scale-95 transition-all">
                                    Xóa hết
                                </button>
                            </>
                        ) : (
                            <>
                                <button 
                                    onClick={() => setShowCamera(!showCamera)} 
                                    className={`h-9 md:h-10 px-2.5 md:px-3 font-bold rounded-xl shadow-sm active:scale-95 text-[10px] flex items-center gap-1.5 transition-all border ${showCamera ? 'bg-red-500 text-white border-red-500 shadow-red-100' : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'}`}
                                >
                                    <QrCode className="w-4 h-4" /> 
                                    <span className="hidden sm:inline uppercase">{showCamera ? 'Đóng cam' : 'Quét mã'}</span>
                                </button>
                                
                                <button onClick={() => setShowBulkModal(true)} className="h-9 md:h-10 px-2.5 md:px-3 text-[10px] font-bold rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center gap-1.5 hover:bg-orange-100 transition-colors">
                                    <Zap className="w-4 h-4" />
                                    <span className="hidden sm:inline uppercase">Quét lô</span>
                                </button>

                                <button onClick={handleCreate} className="h-9 md:h-10 px-3 md:px-4 text-xs md:text-sm font-bold rounded-xl bg-primary text-white shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-1.5">
                                    <Plus className="w-4 h-4" />
                                    <span className="hidden xs:inline">+ Sản phẩm</span>
                                </button>

                                <button onClick={toggleViewMode} className="h-9 md:h-10 w-9 md:w-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 hover:bg-gray-50 hover:text-gray-600 shadow-sm transition-all" title={viewMode === 'sheet' ? 'Xem dạng lưới' : 'Xem dạng bảng'}>
                                    {viewMode === 'sheet' ? <LayoutGrid className="w-5 h-5" /> : <FileSpreadsheet className="w-5 h-5" />}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Row 2: Search and Filters */}
                <div className="flex flex-col lg:flex-row gap-2 md:gap-3">
                    {/* Search Input Box */}
                    <div className="relative flex-1 group">
                        <input
                            type="text"
                            className="w-full h-10 md:h-11 pl-10 pr-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                            placeholder="Tìm kiếm tên, mã vạch, phân loại..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    
                    {/* Filter Group - Scrollable on mobile */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
                        <div className="relative shrink-0">
                            <select 
                                className="appearance-none h-10 md:h-11 pl-3 pr-8 bg-gray-50 border-2 border-gray-50 rounded-xl text-[11px] md:text-xs font-bold text-gray-700 focus:bg-white focus:border-primary/20 transition-all outline-none cursor-pointer" 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="name_asc">Sắp xếp: A-Z</option>
                                <option value="price_asc">Giá: Thấp → Cao</option>
                                <option value="price_desc">Giá: Cao → Thấp</option>
                                <option value="stock_asc">Tồn kho: Thấp → Cao</option>
                            </select>
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>

                        <div className="relative shrink-0">
                            <select 
                                className="appearance-none h-10 md:h-11 pl-3 pr-8 bg-gray-50 border-2 border-gray-50 rounded-xl text-[11px] md:text-xs font-bold text-gray-700 focus:bg-white focus:border-primary/20 transition-all outline-none cursor-pointer min-w-[120px]" 
                                value={selectedCategory} 
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="">Tất cả nhóm</option>
                                {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                            </select>
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>

                        <button
                            onClick={() => setFilter(filter === 'all' ? 'low_stock' : 'all')}
                            className={`h-10 md:h-11 px-4 rounded-xl text-[11px] md:text-xs font-bold transition-all whitespace-nowrap border-2 flex items-center gap-2 shrink-0 ${
                                filter === 'low_stock' 
                                ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-100' 
                                : 'bg-gray-50 border-gray-50 text-gray-600 hover:border-gray-200'
                            }`}
                        >
                            {filter === 'low_stock' ? (
                                <>
                                    <Zap className="w-3.5 h-3.5" />
                                    <span>SẮP HẾT</span>
                                </>
                            ) : (
                                <>
                                    <Package className="w-3.5 h-3.5 opacity-50" />
                                    <span>TẤT CẢ HÀNG</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* 📸 CAMERA SCANNER VIEW */}
                {showCamera && (
                    <div className="mt-2 rounded-2xl overflow-hidden border-2 border-red-100 shadow-inner bg-black relative">
                        <BarcodeScanner 
                            onDetected={(code) => {
                                handleScan(code)
                                setShowCamera(false)
                            }} 
                            active={showCamera} 
                        />
                        <div className="absolute top-2 right-2 z-10">
                            <button onClick={() => setShowCamera(false)} className="bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/40 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {loadingProducts ? (
                    <div className="flex items-center justify-center h-full text-gray-400 font-bold">Đang tải...</div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                        <div className="bg-gray-50 p-6 rounded-full mb-4">
                            <Package className="w-12 h-12 text-gray-200" />
                        </div>
                        <p className="font-bold">{query ? 'Không tìm thấy sản phẩm nào khớp' : 'Chưa có sản phẩm nào trong kho'}</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-24">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                            {products.map((product) => {
                                const isSelected = selectedProducts.includes(product.id)
                                return (
                                    <div 
                                        key={product.id} 
                                        className={`group relative bg-white border-2 rounded-3xl p-3 transition-all duration-300 hover:shadow-xl active:scale-95 ${isSelected ? 'border-primary ring-4 ring-primary/10' : 'border-gray-50'}`}
                                        onClick={() => isSelectionMode ? toggleSelect(product.id) : null}
                                    >
                                        {/* Selection Badge */}
                                        {isSelected && (
                                            <div className="absolute -top-2 -right-2 bg-primary text-white p-1 rounded-full shadow-lg z-10">
                                                <Check className="w-4 h-4" />
                                            </div>
                                        )}
                                        
                                        {/* Image Area */}
                                        <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-3 relative">
                                            <img 
                                                src={getProductImageUrl(product.image_url)} 
                                                alt={product.name} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                onDoubleClick={() => handleEdit(product)}
                                            />
                                            {product.stock_quantity < 10 && (
                                                <div className="absolute bottom-2 left-2 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm">SẮP HẾT</div>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="space-y-1">
                                            <div className="flex items-start justify-between gap-1">
                                                <h3 className="text-[12px] font-black text-gray-900 line-clamp-2 leading-tight h-8 flex-1">{product.name}</h3>
                                                {product.hasVariants && (
                                                    <span className="bg-blue-50 text-blue-600 p-1 rounded-lg shadow-sm shrink-0" title="Sản phẩm có biến thể">
                                                        <LayoutGrid className="w-3 h-3" />
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 py-0.5">
                                                <span className="text-[10px] font-mono bg-gray-100 text-gray-800 px-2.5 py-1 rounded-lg font-black border border-gray-200 tracking-wider shadow-sm">
                                                    {product.hasVariants ? `${product.variantCount} phiên bản` : `#${product.barcode || '---'}`}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter truncate">{product.category || 'Chưa nhóm'}</p>
                                                {product.classifications && Object.entries(typeof product.classifications === 'string' ? JSON.parse(product.classifications) : product.classifications).map(([k, v]) => (
                                                    <span key={k} className="text-[8px] bg-gray-100 text-gray-500 px-1 rounded font-bold uppercase truncate max-w-[60px]">
                                                        {v}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="pt-1 flex flex-col">
                                                {product.hasVariants ? (
                                                    <span className="text-[11px] font-black text-primary leading-none">
                                                        {new Intl.NumberFormat('vi-VN').format(product.minPrice)} - {new Intl.NumberFormat('vi-VN').format(product.maxPrice)}đ
                                                    </span>
                                                ) : (
                                                    <span className="text-sm font-black text-primary leading-none">{new Intl.NumberFormat('vi-VN').format(product.price)}đ</span>
                                                )}
                                                <div className="flex items-center gap-1 mt-1">
                                                    <div className={`h-1 w-1 rounded-full ${product.stock_quantity < 10 ? 'bg-red-500 animate-pulse' : 'bg-green-400'}`}></div>
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase">Tồn {product.hasVariants ? 'tổng' : ''}:</span>
                                                    <span className={`text-[10px] font-black ${product.stock_quantity < 10 ? 'text-red-500' : 'text-gray-700'}`}>{product.stock_quantity}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quick Actions (Desktop hover) */}
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); toggleSelect(product.id) }} 
                                                className="bg-white/90 backdrop-blur p-2 rounded-xl shadow-md text-gray-400 hover:text-primary transition-colors"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleEdit(product) }} 
                                                className="bg-white/90 backdrop-blur p-2 rounded-xl shadow-md text-gray-400 hover:text-blue-500 transition-colors"
                                            >
                                                <Wrench className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="sheet-container flex-1 pb-24">
                        <table className="sheet-table">
                            <thead>
                                <tr>
                                    <th className="row-index">#</th>
                                    <th className="col-img w-10 text-center">Ảnh</th>
                                    <th className="col-name">Tên sản phẩm</th>
                                    <th className="col-barcode">Mã vạch</th>
                                    <th className="col-category">Nhóm</th>
                                    <th className="col-stock text-center">Tồn</th>
                                    <th className="col-unit text-center">ĐVT</th>
                                    <th className="col-price text-right">Giá bán</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product, idx) => {
                                    const isSelected = selectedProducts.includes(product.id)
                                    const isExpanded = expandedRows.includes(product.id)
                                    
                                    return (
                                        <React.Fragment key={product.id}>
                                            <tr className={`${isSelected ? 'selected' : ''} ${product.hasVariants ? 'cursor-pointer hover:bg-gray-50/50' : ''}`}>
                                                <td className="row-index" onClick={() => product.hasVariants ? toggleExpanded(product.id) : toggleSelect(product.id)}>
                                                    <div className="flex items-center justify-center">
                                                        {product.hasVariants ? (
                                                            isExpanded ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-gray-400" />
                                                        ) : (
                                                            isSelected ? <Check className="w-4 h-4 mx-auto" /> : idx + 1
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="text-center p-1">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden mx-auto flex items-center justify-center">
                                                        {product.image_url ? (
                                                            <img src={getProductImageUrl(product.image_url)} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package className="w-4 h-4 opacity-10" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="pl-4">
                                                    <div className="flex items-center gap-2">
                                                        <input 
                                                            className="sheet-input font-bold" 
                                                            defaultValue={product.name}
                                                            onBlur={(e) => handleUpdateInline(product, 'name', e.target.value)}
                                                            disabled={isGuest}
                                                            autoComplete="off"
                                                            spellCheck="false"
                                                            onDoubleClick={() => handleEdit(product)}
                                                        />
                                                        {product.hasVariants && (
                                                            <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-black shrink-0 uppercase">
                                                                {product.variantCount} biến thể
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <input 
                                                        className="sheet-input font-mono text-[11px]" 
                                                        defaultValue={product.barcode}
                                                        onBlur={(e) => handleUpdateInline(product, 'barcode', e.target.value)}
                                                        disabled={isGuest || product.hasVariants}
                                                        placeholder={product.hasVariants ? 'Dùng mã riêng cho từng mẫu' : 'Mã vạch'}
                                                        autoComplete="off"
                                                        spellCheck="false"
                                                    />
                                                </td>
                                                <td>
                                                    <div className="flex flex-col gap-0.5">
                                                        <select 
                                                            className="sheet-input bg-transparent"
                                                            value={product.category || ''}
                                                            onChange={(e) => handleUpdateInline(product, 'category', e.target.value)}
                                                            disabled={isGuest}
                                                        >
                                                            <option value="">--</option>
                                                            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                                        </select>
                                                        <div className="flex flex-wrap gap-1 px-1">
                                                            {product.classifications && Object.entries(typeof product.classifications === 'string' ? JSON.parse(product.classifications) : product.classifications).map(([k, v]) => (
                                                                <span key={k} className="text-[9px] text-gray-400 bg-gray-50 border border-gray-100 px-1 rounded">
                                                                    {v}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <input 
                                                        type="number"
                                                        className={`sheet-input text-center font-bold ${product.stock_quantity < 10 ? 'text-red-500' : ''}`}
                                                        value={product.stock_quantity}
                                                        onChange={(e) => product.hasVariants ? null : handleUpdateInline(product, 'stock_quantity', Number(e.target.value))}
                                                        disabled={isGuest || product.hasVariants}
                                                        autoComplete="off"
                                                    />
                                                </td>
                                                <td className="text-center">
                                                    <input 
                                                        className="sheet-input text-center" 
                                                        defaultValue={product.unit}
                                                        onBlur={(e) => handleUpdateInline(product, 'unit', e.target.value)}
                                                        disabled={isGuest}
                                                        autoComplete="off"
                                                        spellCheck="false"
                                                    />
                                                </td>
                                                <td className="text-right">
                                                    {product.hasVariants ? (
                                                        <div className="px-2 text-[11px] font-black text-primary opacity-60" onDoubleClick={() => handleEdit(product)}>
                                                            {new Intl.NumberFormat('vi-VN').format(product.minPrice)} ~ {new Intl.NumberFormat('vi-VN').format(product.maxPrice)}
                                                        </div>
                                                    ) : (
                                                        <input 
                                                            type="number"
                                                            className="sheet-input text-right font-black text-primary" 
                                                            defaultValue={product.price}
                                                            onBlur={(e) => handleUpdateInline(product, 'price', Number(e.target.value))}
                                                            disabled={isGuest}
                                                            autoComplete="off"
                                                            onDoubleClick={() => handleEdit(product)}
                                                        />
                                                    )}
                                                </td>
                                            </tr>

                                            {/* Sub-rows for Variants */}
                                            {isExpanded && product.variants?.map((v, vIdx) => (
                                                <tr key={v.id} className="bg-gray-50/30 border-l-4 border-l-primary/30">
                                                    <td className="row-index text-[10px] text-gray-300 font-bold italic">
                                                        {idx + 1}.{vIdx + 1}
                                                    </td>
                                                    <td className="text-center p-1">
                                                        <div className="w-6 h-6 rounded-md bg-white border border-gray-100 overflow-hidden mx-auto flex items-center justify-center relative group/vimg">
                                                            <img 
                                                                src={getProductImageUrl(v.image_url || product.image_url)} 
                                                                className="w-full h-full object-cover" 
                                                            />
                                                            {!v.image_url && product.image_url && (
                                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/vimg:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <span className="text-[6px] text-white font-black uppercase">Gốc</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="pl-8">
                                                        <div className="flex flex-wrap gap-1">
                                                            {v.attributes && Object.entries(typeof v.attributes === 'string' ? JSON.parse(v.attributes) : v.attributes).map(([key, val]) => (
                                                                <span key={key} className="text-[10px] font-black bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-500 uppercase">
                                                                    {val}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <input 
                                                            className="sheet-input font-mono text-[10px] bg-transparent" 
                                                            defaultValue={v.barcode}
                                                            onBlur={(e) => handleUpdateInline(v, 'barcode', e.target.value)}
                                                            disabled={isGuest}
                                                            placeholder="Mã vạch riêng"
                                                        />
                                                    </td>
                                                    <td><div className="sheet-input opacity-20">—</div></td>
                                                    <td className="text-center">
                                                        <input 
                                                            type="number"
                                                            className="sheet-input text-center font-bold bg-transparent"
                                                            defaultValue={v.stock_quantity}
                                                            onBlur={(e) => handleUpdateInline(v, 'stock_quantity', Number(e.target.value))}
                                                            disabled={isGuest}
                                                        />
                                                    </td>
                                                    <td><div className="sheet-input opacity-20">—</div></td>
                                                    <td className="text-right">
                                                        <input 
                                                            type="number"
                                                            className="sheet-input text-right font-black text-primary bg-transparent" 
                                                            defaultValue={v.price}
                                                            onBlur={(e) => handleUpdateInline(v, 'price', Number(e.target.value))}
                                                            disabled={isGuest}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <ProductFormModal
                    product={editingProduct}
                    readOnly={false}
                    onClose={() => { setShowModal(false); fetchProducts() }}
                    onFinish={fetchProducts}
                />
            )}
            {showBulkModal && <BulkImportModal onClose={() => setShowBulkModal(false)} onFinish={fetchProducts} />}

            {/* 📱 Mobile Floating Camera Button */}
            {!showCamera && !showModal && !showBulkModal && (
                <button 
                    onClick={() => {
                        setShowCamera(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`fixed bottom-24 ${fabPosition === 'right' ? 'right-4' : 'left-4'} w-14 h-14 bg-primary text-white rounded-full shadow-[0_8px_30px_rgb(233,30,99,0.4)] flex flex-col items-center justify-center z-[50] active:scale-90 transition-all md:hidden border-2 border-white`}
                >
                    <QrCode className="w-6 h-6" />
                    <span className="text-[8px] font-black mt-0.5 uppercase">Thêm</span>
                </button>
            )}
        </div>
    )
}

