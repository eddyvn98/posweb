import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchLocalProducts, getAllLocalProducts } from '../lib/db'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useSync } from '../contexts/SyncContext'
import { useScanBarcode } from '../hooks/useScanBarcode'
import { useNotification } from '../contexts/NotificationContext'

import ProductCard from '../components/ProductCard'
import CartItem from '../components/CartItem'
import CheckoutModal from '../components/CheckoutModal'
import QuickSaleModal from '../components/QuickSaleModal'
import InvoiceModal from '../components/InvoiceModal'
import ReturnGoodsModal from '../components/ReturnGoodsModal'
import BarcodeScanner from '../components/BarcodeScanner'
import { getProductImageUrl } from '../lib/imageUtils'
import { 
    Search, 
    Zap, 
    History, 
    Package, 
    Folder, 
    ShoppingCart,
    X,
    Plus,
    Check,
    AlertTriangle,
    QrCode,
    RefreshCw,
    Menu
} from '../components/Icons'

export default function Sales() {
    const navigate = useNavigate()
    const { showNotification } = useNotification()
    const searchInputRef = useRef(null)
    const [query, setQuery] = useState('')
    const [allProducts, setAllProducts] = useState([])
    const [filteredProducts, setFilteredProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [showQuickSale, setShowQuickSale] = useState(false)
    const [quickSalePreset, setQuickSalePreset] = useState({ barcode: '', name: '' })
    const [lastSale, setLastSale] = useState(null)
    const [lastScanned, setLastScanned] = useState(null)
    const [scanError, setScanError] = useState(null)
    const [isCartOpenMobile, setIsCartOpenMobile] = useState(false)
    const [showCamera, setShowCamera] = useState(false)
    const [showReturnModal, setShowReturnModal] = useState(false)
    const [showMobileMenu, setShowMobileMenu] = useState(false)
    const [showMobileSearch, setShowMobileSearch] = useState(true)
    const [shouldReopenCamera, setShouldReopenCamera] = useState(false)

    const { isGuest } = useAuth()
    const { 
        cart, 
        addToCart, 
        removeFromCart, 
        updateQuantity, 
        setQuantity, 
        clearCart, 
        totalAmount, 
        totalItems, 
        isCheckoutRequested, 
        setIsCheckoutRequested,
        isCheckoutModalOpen,
        setIsCheckoutModalOpen,
        orders,
        activeOrderId,
        addOrder,
        switchOrder,
        removeOrder,
        fabPosition,
        toggleFabPosition
    } = useCart()
    const { pullProducts, isOnline } = useSync()

    const playBeep = (type = 'success') => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.setValueAtTime(type === 'success' ? 880 : 220, ctx.currentTime)
            gain.gain.setValueAtTime(0.1, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start()
            osc.stop(ctx.currentTime + 0.1)
        } catch (e) { }
    }

    useScanBarcode({
        onScan: (code) => handleScanResult(code),
        enabled: true,
    })

    useEffect(() => {
        const loadData = async () => {
            try {
                const localProds = await getAllLocalProducts()
                setAllProducts(localProds)
                setFilteredProducts(localProds.slice(0, 100))
            } catch (err) {
                console.error('Failed to load local products for sales', err)
                setAllProducts([])
                setFilteredProducts([])
            }

            try {
                if (!isGuest) {
                    const catRes = await api.get('/categories')
                    setCategories(catRes.data || [])
                } else {
                    const { MOCK_CATEGORIES } = await import('../lib/mockData')
                    setCategories(MOCK_CATEGORIES)
                }
            } catch (err) {
                console.warn('Failed to fetch categories', err)
            }
        }
        loadData()
    }, [isGuest])

    useEffect(() => {
        let results = allProducts
        if (selectedCategory !== 'all') results = results.filter(p => p.category === selectedCategory)
        if (query.trim()) {
            const q = query.toLowerCase()
            results = results.filter(p => p.name.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q))
        }
        setFilteredProducts(results.slice(0, 100))
    }, [query, selectedCategory, allProducts])

    const handleScanResult = async (code) => {
        setQuery('')
        setScanError(null)
        
        const match = allProducts.find(p => p.barcode === code || p.id === code)
        if (match) {
            addToCart(match)
            setLastScanned(match.name)
            playBeep('success')
            setTimeout(() => setLastScanned(null), 2000)
        } else {
            setQuickSalePreset({ barcode: code, name: `SP ${code}` })
            setShouldReopenCamera(showCamera) // Ghi nhớ nếu camera đang mở
            setShowQuickSale(true)
            setShowCamera(false) // Tự động đóng camera để hiện panel nhập giá
            playBeep('error')
        }
    }

    const handleCheckoutSuccess = (saleData, isDraft = false) => {
        setLastSale(saleData)
        if (!isDraft) {
            setIsCheckoutModalOpen(false)
            setIsCartOpenMobile(false)
            clearCart()
        }
    }

    // Listen for checkout request from global CartBar
    useEffect(() => {
        if (isCheckoutRequested) {
            setIsCheckoutRequested(false) // Reset
            if (isGuest) {
                showNotification('Chế độ xem thử: Bạn có thể trải nghiệm quy trình thanh toán', 'info')
            }
            if (totalItems > 0) {
                setIsCheckoutModalOpen(true)
            }
        }
    }, [isCheckoutRequested, isGuest, totalItems, setIsCheckoutRequested, showNotification])

    const isSearching = query.trim().length > 0

    return (
        <div className="h-[100dvh] flex flex-col overflow-hidden bg-white relative">
            
            {/* 🔍 TOP SEARCH BAR (HEADER) */}
            <div className={`bg-white shadow-sm z-40 border-b relative shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${(!showMobileSearch && !isSearching) ? 'max-h-0 border-none' : 'max-h-20 p-2 opacity-100'}`}>
                <div className="flex items-center gap-2 max-w-full">
                    <div className="flex-1 relative">
                        <input ref={searchInputRef} autoFocus type="text" className="w-full h-10 pl-9 pr-3 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:ring-primary focus:border-primary outline-none" placeholder="Mã/Tên SP..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && query.trim()) { handleScanResult(query.trim()); e.preventDefault() } }} />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        {isSearching && (
                            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1 hover:bg-gray-100 rounded-full">
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                    
                    {/* Desktop Actions (Hidden on mobile) */}
                    <div className="hidden lg:flex items-center gap-2">
                        <button 
                            onClick={() => setShowCamera(!showCamera)} 
                            className={`h-10 px-3 font-bold rounded-xl shadow-sm active:scale-95 text-[10px] flex items-center gap-1 shrink-0 uppercase transition-colors ${showCamera ? 'bg-red-500 text-white' : 'bg-white border border-gray-100 text-gray-600'}`}
                        >
                            <QrCode className="w-4 h-4" /> 
                            <span>{showCamera ? 'ĐÓNG CAM' : 'QUÉT MÃ'}</span>
                        </button>
                        <button onClick={() => { setQuickSalePreset({ barcode: '', name: '' }); setShowQuickSale(true) }} className="h-10 px-3 bg-primary text-white font-bold rounded-xl shadow-sm active:scale-95 text-[10px] flex items-center gap-1 shrink-0 uppercase"><Zap className="w-4 h-4" /> <span>BÁN NHANH</span></button>
                        <button onClick={() => setShowReturnModal(true)} className="h-10 px-3 bg-amber-500 text-white font-bold rounded-xl shadow-sm active:scale-95 text-[10px] flex items-center gap-1 shrink-0 uppercase">
                            <RefreshCw className="w-4 h-4" /> <span>TRẢ HÀNG</span>
                        </button>
                        <button onClick={() => navigate('/app/history')} className="h-10 px-3 bg-blue-500 text-white font-bold rounded-xl shadow-sm active:scale-95 text-[10px] flex items-center gap-1 shrink-0 uppercase"><History className="w-4 h-4" /> <span>LỊCH SỬ</span></button>
                    </div>

                    {/* Mobile Collapse Search Button (only if hidden) */}
                    <button onClick={() => setShowMobileSearch(false)} className="lg:hidden p-2 text-gray-400 hover:bg-gray-100 rounded-xl">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

                {/* 📋 ORDER TABS (MULTI-ORDER) */}
                <div className="mt-2 flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
                    {orders.map(order => (
                        <div 
                            key={order.id}
                            onClick={() => switchOrder(order.id)}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-t-xl transition-all cursor-pointer border-x border-t text-[10px] font-black uppercase tracking-wider
                                ${activeOrderId === order.id 
                                    ? 'bg-gray-50 text-primary border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] -mb-[1px] z-10' 
                                    : 'bg-white text-gray-400 border-transparent hover:bg-gray-50 opacity-60'
                                }
                            `}
                        >
                            <ShoppingCart className={`w-3.5 h-3.5 ${activeOrderId === order.id ? 'text-primary' : 'text-gray-300'}`} />
                            <span className="whitespace-nowrap">{order.name}</span>
                            {order.items.length > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[8px] ${activeOrderId === order.id ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    {order.items.reduce((sum, i) => sum + i.quantity, 0)}
                                </span>
                            )}
                            {orders.length > 1 && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); removeOrder(order.id) }}
                                    className="ml-1 hover:text-red-500 transition-colors p-0.5"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button 
                        onClick={addOrder}
                        className="p-1.5 text-gray-400 hover:text-primary transition-colors active:scale-90"
                        title="Thêm đơn mới"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {/* Smart Search Popup (Dropdown) */}
                {isSearching && (
                    <div className="absolute top-full left-0 right-0 z-50 px-2 pt-2 animate-in slide-in-from-top-5">
                        <div className="bg-white rounded-b-[28px] shadow-2xl border-x border-b border-gray-100 flex flex-col max-h-[60vh] overflow-hidden">
                            <div className="p-3 border-b flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-10">
                                <span className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] px-2">Tìm nhanh</span>
                                <button onClick={() => { setQuery(''); }} className="h-6 w-6 rounded-md bg-gray-50 flex items-center justify-center">
                                    <X className="w-3 h-3 text-gray-400" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar min-h-[100px]">
                                {filteredProducts.length === 0 ? (<div className="text-center py-10 opacity-30"><Search className="w-10 h-10 mx-auto mb-2" /><p className="text-sm font-bold">Không tìm thấy</p></div>) : (
                                    <div className="grid grid-cols-1 gap-1.5">
                                        {filteredProducts.map(p => (
                                            <div key={p.id} onClick={() => { addToCart(p); setQuery(''); playBeep('success') }} className="flex items-center gap-3 p-2 bg-gray-50/50 hover:bg-primary/5 rounded-2xl active:scale-[0.99] transition-all cursor-pointer border border-transparent hover:border-primary/10">
                                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-gray-100 shrink-0">{p.image_url ? <img src={getProductImageUrl(p.image_url)} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg"><Package className="w-6 h-6 opacity-20" /></div>}</div>
                                                <div className="flex-1 min-w-0"><p className="font-bold text-gray-800 text-xs truncate uppercase">{p.name}</p><p className="text-primary font-black text-xs mt-0.5">{new Intl.NumberFormat('vi-VN').format(p.price)}đ</p></div>
                                                <div className="h-8 w-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
                                                    <Plus className="w-4 h-4" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 📸 CAMERA SCANNER VIEW */}
                {showCamera && (
                    <div className="mt-2 rounded-2xl overflow-hidden border border-gray-100 shadow-inner animate-in zoom-in duration-300 relative group">
                        <BarcodeScanner 
                            onDetected={(code) => {
                                handleScanResult(code)
                            }} 
                            active={showCamera} 
                        />
                        <button 
                            onClick={() => setShowCamera(false)}
                            className="absolute top-3 right-3 z-10 w-10 h-10 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center active:scale-90 transition-all border border-white/20"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                )}
            
            <div className="flex-1 flex flex-col xl:flex-row overflow-hidden min-h-0 bg-gray-50">
                
                {/* 1. Categories: Vertical on XL+, Horizontal on Tablet/Mobile */}
                <div className="hidden xl:flex w-32 flex-col bg-white border-r border-gray-100 overflow-y-auto no-scrollbar shrink-0">
                    <button onClick={() => setSelectedCategory('all')} className={`p-4 text-center transition-all border-b ${selectedCategory === 'all' ? 'bg-primary/10 border-r-4 border-r-primary' : 'hover:bg-gray-50'}`}>
                        <Package className={`mx-auto mb-1 w-6 h-6 ${selectedCategory === 'all' ? 'text-primary' : 'text-gray-400'}`} />
                        <div className={`text-[10px] font-black uppercase tracking-tighter ${selectedCategory === 'all' ? 'text-primary' : 'text-gray-500'}`}>Tất cả</div>
                    </button>
                    {categories.map(cat => (
                        <button key={cat.id} onClick={() => setSelectedCategory(cat.name)} className={`p-4 text-center transition-all border-b ${selectedCategory === cat.name ? 'bg-primary/10 border-r-4 border-r-primary' : 'hover:bg-gray-50'}`}>
                            <Folder className={`mx-auto mb-1 w-6 h-6 ${selectedCategory === cat.name ? 'text-primary' : 'text-gray-400'}`} />
                            <div className={`text-[10px] font-black uppercase tracking-tighter line-clamp-2 ${selectedCategory === cat.name ? 'text-primary' : 'text-gray-500'}`}>{cat.name}</div>
                        </button>
                    ))}
                </div>

                {/* 2. Products Grid */}
                <div className="flex-1 flex flex-col h-full relative z-0 overflow-hidden">
                    {/* Horizontal Categories for Tablet/Mobile */}
                    <div className="xl:hidden flex overflow-x-auto p-2 gap-2 bg-white border-b no-scrollbar shrink-0 shadow-sm">
                        <button onClick={() => setSelectedCategory('all')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all border ${selectedCategory === 'all' ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-gray-500 border-gray-100'}`}><Package className="w-4 h-4" /> <span>Tất cả</span></button>
                        {categories.map(cat => (
                            <button key={cat.id} onClick={() => setSelectedCategory(cat.name)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all border ${selectedCategory === cat.name ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-gray-500 border-gray-100'}`}><Folder className="w-4 h-4" /> <span>{cat.name}</span></button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 lg:p-4 custom-scrollbar">
                        {filteredProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full opacity-30 select-none"><Search className="w-16 h-16 mb-4" /><h3 className="text-lg font-black text-gray-800 uppercase">Không thấy sản phẩm</h3></div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-5 gap-3 lg:gap-4">
                                {filteredProducts.map(p => (
                                    <ProductCard key={p.id} product={p} onAdd={(prod) => { addToCart(prod); playBeep('success') }} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Cart Pane: Bottom Bar on Tablet, Sidebar on Desktop */}
                <div className={`
                    ${isCartOpenMobile ? 'fixed inset-0 z-[9999] flex' : 'hidden md:flex'} 
                    flex-col xl:w-[380px] bg-white border-t xl:border-t-0 xl:border-l border-pink-100 shadow-2xl transition-all duration-300
                `}>
                    {/* Cart Header (Hidden on Tablet Bottom Bar unless opened as overlay) */}
                    <div className={`${isCartOpenMobile ? 'flex' : 'hidden xl:flex'} p-5 lg:p-6 bg-white border-b justify-between items-center shrink-0 sticky top-0 z-10`}>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsCartOpenMobile(false)} className="text-gray-800 p-1 xl:hidden">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6"><path d="M19 12H5m7-7l-7 7 7 7" /></svg>
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-xl text-gray-800 tracking-tight">Giỏ hàng</span>
                                <span className="bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                                    {totalItems}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={clearCart} 
                            className="text-[10px] font-black text-primary uppercase tracking-widest hover:opacity-70 transition-all flex items-center gap-1.5"
                            disabled={totalItems === 0}
                        >
                            Xóa tất cả <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" /></svg>
                        </button>
                    </div>

                    {/* Cart Items (Hidden on Tablet Bottom Bar unless opened as overlay) */}
                    <div className={`${isCartOpenMobile ? 'flex' : 'hidden xl:flex'} flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 custom-scrollbar bg-gray-50/30 relative flex-col`}>
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-300 text-base italic font-medium opacity-50 w-full"><ShoppingCart className="w-20 h-20 mb-6" />Giỏ hàng đang trống...</div>
                        ) : (
                            <div className="divide-y divide-gray-100 w-full">
                                {cart.map(item => <CartItem key={item.product_id || item.id} item={item} onUpdateQty={updateQuantity} onSetQty={setQuantity} onRemove={removeFromCart} />)}
                            </div>
                        )}

                        {/* Usage Hints (Subtle) - Only shown when cart is empty */}
                        {cart.length === 0 && (
                            <div className="mt-auto pt-10 pb-4 px-2 opacity-20 hover:opacity-50 transition-opacity cursor-default select-none">
                                <div className="text-[9px] font-black uppercase tracking-[0.2em] mb-3 text-gray-400 border-b pb-1">Hướng dẫn sử dụng</div>
                                <ul className="space-y-2 text-[10px] font-medium text-gray-500 list-disc pl-4 leading-relaxed">
                                    <li>Web dùng được cho cả máy tính và di động</li>
                                    <li>Quét mã bằng camera trên điện thoại ngay trong web</li>
                                    <li>Dùng được ngay cả khi mất mạng</li>
                                    <li>Dùng chung với máy quét mã khi sử dụng trên máy tính</li>
                                    <li>Có thể bán hàng mà không cần quét mã sản phẩm</li>
                                    <li>Quét mã bất cứ lúc nào, không cần chọn gì</li>
                                    <li>Bán nhanh ngay cả khi sản phẩm không có trong kho</li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Compact Action Bar */}
                    <div className="p-4 md:p-5 border-t bg-white shadow-[0_-10px-40px_rgba(0,0,0,0.04)] shrink-0">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex flex-col shrink-0">
                                <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px] mb-0.5">Tổng cộng</span>
                                <span className="text-primary font-black text-2xl tracking-tighter leading-none">
                                    {new Intl.NumberFormat('vi-VN').format(totalAmount)}
                                    <span className="text-xs ml-0.5 font-bold">đ</span>
                                </span>
                            </div>
                            
                            <button 
                                onClick={() => { 
                                    if (isGuest) showNotification('Chế độ xem thử', 'info');
                                    setIsCheckoutModalOpen(true) 
                                }} 
                                className="flex-1 h-12 bg-primary text-white rounded-2xl shadow-[0_8px_20px_rgba(231,34,94,0.2)] active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-between px-6 group overflow-hidden relative" 
                                disabled={totalItems === 0}
                            >
                                <span className="text-[14px] font-black uppercase tracking-tight">THANH TOÁN</span>
                                <div className="bg-white/20 p-1.5 rounded-xl shrink-0 group-hover:translate-x-1 transition-transform">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5"><path d="M5 12h14m-7-7l7 7-7 7" /></svg>
                                </div>
                            </button>
                        </div>

                        <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] text-gray-400 font-bold opacity-50">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3"><path d="M12 15V17M12 7V13M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" /></svg>
                            Giao dịch bảo mật tuyệt đối
                        </div>
                    </div>
                </div>
            </div>

            {/* Scan Feedback UI Overlay */}
            {lastScanned && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg font-bold text-xs animate-in slide-in-from-top-2 z-[60] whitespace-nowrap flex items-center gap-2">
                    <Check className="w-4 h-4" /> {lastScanned}
                </div>
            )}
            {scanError && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg font-bold text-xs animate-in slide-in-from-top-2 z-[60] whitespace-nowrap flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> {scanError}
                </div>
            )}

            {/* 📱 Mobile Floating Vertical Stack */}
            {!isCheckoutModalOpen && (
                <div className={`fixed bottom-24 ${fabPosition === 'right' ? 'right-4 items-end' : 'left-4 items-start'} flex flex-col gap-4 z-[50] lg:hidden transition-all duration-500`}>
                    {/* Menu Actions (Expandable) */}
                    <div className={`flex flex-col ${fabPosition === 'right' ? 'items-end' : 'items-start'} gap-3 transition-all duration-300 ${showMobileMenu ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-0 pointer-events-none'}`}>
                        <div className={`flex items-center gap-2 ${fabPosition === 'right' ? 'flex-row' : 'flex-row-reverse'}`}>
                            <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">Đổi bên</span>
                            <button 
                                onClick={toggleFabPosition}
                                className="w-12 h-12 bg-gray-600 text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-all border-2 border-white"
                                title="Đổi bên"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path d="M7 16V4m0 0L3 8m4-4l4 4m6-4v12m0 0l4-4m-4 4l-4-4" /></svg>
                            </button>
                        </div>
                        <div className={`flex items-center gap-2 ${fabPosition === 'right' ? 'flex-row' : 'flex-row-reverse'}`}>
                            <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">Trả hàng</span>
                            <button 
                                onClick={() => { setShowReturnModal(true); setShowMobileMenu(false) }}
                                className="w-12 h-12 bg-amber-500 text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-all border-2 border-white"
                                title="Trả hàng"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>
                        <div className={`flex items-center gap-2 ${fabPosition === 'right' ? 'flex-row' : 'flex-row-reverse'}`}>
                            <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">Lịch sử</span>
                            <button 
                                onClick={() => { navigate('/app/history'); setShowMobileMenu(false) }}
                                className="w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-all border-2 border-white"
                                title="Lịch sử"
                            >
                                <History className="w-5 h-5" />
                            </button>
                        </div>
                        <div className={`flex items-center gap-2 ${fabPosition === 'right' ? 'flex-row' : 'flex-row-reverse'}`}>
                            <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">Bán nhanh</span>
                            <button 
                                onClick={() => { setQuickSalePreset({ barcode: '', name: '' }); setShowQuickSale(true); setShowMobileMenu(false) }}
                                className="w-12 h-12 bg-primary text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-all border-2 border-white"
                                title="Bán nhanh"
                            >
                                <Zap className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Menu Toggle */}
                    <div className={`flex items-center gap-2 ${fabPosition === 'right' ? 'flex-row' : 'flex-row-reverse'}`}>
                        {showMobileMenu && <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">Đóng</span>}
                        <button 
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className={`w-14 h-14 ${showMobileMenu ? 'bg-gray-800' : 'bg-gray-700'} text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-all border-2 border-white`}
                        >
                            {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>

                    {/* Search Toggle */}
                    <div className={`flex items-center gap-2 ${fabPosition === 'right' ? 'flex-row' : 'flex-row-reverse'}`}>
                        {showMobileMenu && <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">Tìm kiếm</span>}
                        <button 
                            onClick={() => {
                                setShowMobileSearch(!showMobileSearch);
                                if (!showMobileSearch) setTimeout(() => searchInputRef.current?.focus(), 100);
                                if (showMobileMenu) setShowMobileMenu(false);
                            }}
                            className={`w-14 h-14 ${showMobileSearch ? 'bg-primary text-white' : 'bg-white text-gray-600'} rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-all border-2 border-white`}
                        >
                            <Search className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Scan Button (Bottom) */}
                    <div className={`flex items-center gap-2 ${fabPosition === 'right' ? 'flex-row' : 'flex-row-reverse'}`}>
                        {showMobileMenu && <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">{showCamera ? 'Đóng camera' : 'Quét mã'}</span>}
                        <button 
                            onClick={() => {
                                if (showCamera) {
                                    setShowCamera(false);
                                } else {
                                    setShowCamera(true);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                                if (showMobileMenu) setShowMobileMenu(false);
                            }}
                            className={`w-14 h-14 ${showCamera ? 'bg-red-500' : 'bg-primary'} text-white rounded-full shadow-[0_8px_30px_rgb(233,30,99,0.4)] flex flex-col items-center justify-center active:scale-90 transition-all border-2 border-white`}
                        >
                            {showCamera ? <X className="w-6 h-6" /> : <QrCode className="w-6 h-6" />}
                            <span className="text-[8px] font-black mt-0.5 uppercase">{showCamera ? 'ĐÓNG' : 'QUÉT'}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Modals */}
            {isCheckoutModalOpen && <CheckoutModal cart={cart} totalAmount={totalAmount} onClose={() => setIsCheckoutModalOpen(false)} onFinish={handleCheckoutSuccess} />}
            {showQuickSale && (
                <QuickSaleModal 
                    onClose={() => { 
                        setShowQuickSale(false); 
                        setQuickSalePreset({ barcode: '', name: '' });
                        if (shouldReopenCamera) {
                            setShowCamera(true);
                            setShouldReopenCamera(false);
                        }
                    }} 
                    onAddToCart={addToCart} 
                    presetBarcode={quickSalePreset.barcode} 
                    presetName={quickSalePreset.name} 
                />
            )}
            {showReturnModal && (
                <ReturnGoodsModal 
                    onClose={() => setShowReturnModal(false)}
                    onReturnSuccess={() => {
                        // Refresh products to show updated stock if needed
                        pullProducts().catch(() => {});
                    }}
                />
            )}
            {lastSale && <InvoiceModal sale={lastSale} onClose={() => setLastSale(null)} />}
        </div>
    )
}
