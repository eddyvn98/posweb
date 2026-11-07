import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { playBeep, unlockAudio } from '../lib/soundUtils'
import { searchLocalProducts, saveProductsToLocal, upsertProductsToLocal } from '../lib/db'
import BarcodeScanner from '../components/BarcodeScanner'
import api from '../lib/api'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'
import { useScanBarcode } from '../hooks/useScanBarcode'

import { 
    Store, 
    ShoppingCart, 
    ArrowRight, 
    Search, 
    Package, 
    CheckCircle2, 
    XCircle, 
    Zap,
    History,
    Camera,
    CameraOff,
    X
} from 'lucide-react'

import ProductCard from '../components/ProductCard'
import CartItem from '../components/CartItem'
import CheckoutModal from '../components/CheckoutModal'
import QuickSaleModal from '../components/QuickSaleModal'
import InvoiceModal from '../components/InvoiceModal'

export default function Sales() {
    const navigate = useNavigate()
    const { shop } = useAuth()
    const searchInputRef = useRef(null)
    const cartListRef = useRef(null)
    const lastHydrationRef = useRef(0)
    const [query, setQuery] = useState('')
    const [isSearchInputFocused, setIsSearchInputFocused] = useState(false)
    const [products, setProducts] = useState([])
    const [showCheckout, setShowCheckout] = useState(false)
    const [showQuickSale, setShowQuickSale] = useState(false)
    const [quickSalePreset, setQuickSalePreset] = useState({ barcode: '', name: '' })
    const [lastSale, setLastSale] = useState(null)
    const [lastScanned, setLastScanned] = useState(null)
    const [scanError, setScanError] = useState(null)
    const [scannedItem, setScannedItem] = useState(null)
    const [showCameraScanner, setShowCameraScanner] = useState(false)
    const scanInFlightRef = useRef(false)
    const [cameraFeedback, setCameraFeedback] = useState('')
    const [isSearchOpen, setIsSearchOpen] = useState(false)

    useEffect(() => {
        window.scrollTo(0, 0)
        const shouldHide = showCameraScanner || showQuickSale || showCheckout
        window.dispatchEvent(new CustomEvent('pos-toggle-bottom-nav', { detail: { hide: shouldHide } }))
        return () => {
            window.dispatchEvent(new CustomEvent('pos-toggle-bottom-nav', { detail: { hide: false } }))
        }
    }, [showCameraScanner, showQuickSale, showCheckout])

    useEffect(() => {
        if (!cameraFeedback) return
        const timer = setTimeout(() => setCameraFeedback(''), 3000)
        return () => clearTimeout(timer)
    }, [cameraFeedback])

    const { cart, addToCart, removeFromCart, updateQuantity, setQuantity, clearCart, totalAmount, totalItems } = useCart()
    const { pullProducts, isOnline } = useSync()



    // 🚀 Enable Bluetooth/External Scanner
    // Disabled when input is focused to avoid double-fire:
    // input's onKeyDown also handles Enter when focused.
    useScanBarcode({
        onScan: (code) => handleScanResult(code),
        enabled: !isSearchInputFocused,
    })

    // Auto-focus search input only on desktop (prevents mobile keyboard popup and viewport shifts)
    useEffect(() => {
        const isMobile = window.innerWidth < 768 || ('ontouchstart' in window && navigator.maxTouchPoints > 0)
        if (!isMobile) {
            searchInputRef.current?.focus()
        }
    }, [])

    // Global keyboard shortcuts (F9 to checkout, Escape to exit search)
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable

            // Shortcut thanh toán:
            // - Ctrl + Enter (hoạt động mọi lúc, kể cả đang gõ ô tìm kiếm)
            // - Dấu + bàn phím số (khi không đứng trong ô nhập liệu)
            // - F9 (giữ lại dự phòng nếu bấm Fn+F9 hoặc dùng phím rời)
            const isCheckoutTrigger =
                (e.ctrlKey && e.key === 'Enter') ||
                e.key === 'F9' ||
                (!isInput && e.code === 'NumpadAdd')

            if (isCheckoutTrigger) {
                e.preventDefault()
                if (showCheckout || showQuickSale || lastSale) return
                if (totalItems > 0) {
                    searchInputRef.current?.blur()
                    setShowCheckout(true)
                }
                return
            }

            if (e.key === 'Escape') {
                if (showCheckout || showQuickSale || lastSale) return
                if (query || isSearchInputFocused || isSearchOpen) {
                    e.preventDefault()
                    setQuery('')
                    setProducts([])
                    setIsSearchInputFocused(false)
                    setIsSearchOpen(false)
                    searchInputRef.current?.blur()
                }
            }
        }
        window.addEventListener('keydown', handleGlobalKeyDown)
        return () => window.removeEventListener('keydown', handleGlobalKeyDown)
    }, [query, isSearchInputFocused, isSearchOpen, showCheckout, showQuickSale, lastSale, totalItems])

    const isSearching = query.trim().length > 0

    // 1. Search Logic
    useEffect(() => {
        if (!query.trim()) {
            setProducts([])
            return
        }

        const timer = setTimeout(async () => {
            let results = await searchLocalProducts(query)

            // Fallback: cache local co the chua kip dong bo, thu hydrate 1 lan neu dang online.
            const canHydrate =
                results.length === 0 &&
                isOnline &&
                Date.now() - lastHydrationRef.current > 30000

            if (canHydrate) {
                lastHydrationRef.current = Date.now()
                await pullProducts()
                results = await searchLocalProducts(query)
            }

            setProducts(results)
        }, 200)
        return () => clearTimeout(timer)
    }, [isOnline, pullProducts, query])

    // Helper to add item to cart with auto-scroll tracking
    const handleAddToCart = (product) => {
        const targetId = product.product_id || product.id
        addToCart(product)
        setScannedItem({ id: targetId, ts: Date.now() })
    }

    // Auto-scroll and highlight cart item on scan/add
    useEffect(() => {
        if (!scannedItem?.id) return

        const targetId = scannedItem.id
        const scrollTimer = setTimeout(() => {
            const container = cartListRef.current
            const itemElement = document.getElementById(`cart-item-${targetId}`)

            if (container) {
                const isLastItem = cart.length > 0 && 
                    (cart[cart.length - 1].product_id || cart[cart.length - 1].id) === targetId

                if (isLastItem) {
                    container.scrollTo({
                        top: container.scrollHeight,
                        behavior: 'smooth'
                    })
                } else if (itemElement) {
                    const itemTop = itemElement.offsetTop - container.offsetTop
                    container.scrollTo({
                        top: Math.max(0, itemTop - 10),
                        behavior: 'smooth'
                    })
                }
            }
        }, 50)

        const highlightTimer = setTimeout(() => {
            setScannedItem(null)
        }, 1500)

        return () => {
            clearTimeout(scrollTimer)
            clearTimeout(highlightTimer)
        }
    }, [scannedItem, cart])

    // Shared Scan Logic
    const handleScanResult = async (code) => {
        const cleanCode = (code || '').trim()
        if (!cleanCode || scanInFlightRef.current) return
        scanInFlightRef.current = true
        try {
        setQuery('') // Clear UI search
        setScanError(null)

        const results = await searchLocalProducts(cleanCode)
        // Find exact match by barcode OR id
        let match = results.find(p => p.barcode === cleanCode || p.id === cleanCode)

        // Fallback: If not found in local IndexedDB, query backend API
        if (!match) {
            try {
                const resp = await api.get(`/products?search=${encodeURIComponent(cleanCode)}`)
                if (resp.data && Array.isArray(resp.data)) {
                    match = resp.data.find(p => p.barcode === cleanCode || p.id === cleanCode)
                    if (match) {
                        await upsertProductsToLocal([match])
                    }
                }
            } catch (err) {
                console.warn('[Sales] Backend search fallback error:', err)
            }
        }

        if (match) {
            if (!match.id || !shop?.id || match.shop_id !== shop.id) {
                setScanError('Không thể thêm: sản phẩm không thuộc cửa hàng này')
                setCameraFeedback('Không thể thêm sản phẩm này')
                return
            }
            handleAddToCart(match)
            setCameraFeedback(`Đã thêm: ${match.name} · ${Number(match.price).toLocaleString('vi-VN')}đ`)
            setLastScanned(`Đã thêm: ${match.name}`)
            playBeep('success')
            setTimeout(() => setLastScanned(null), 2500)
        } else {
            setQuickSalePreset({
                barcode: cleanCode,
                name: `SP ${cleanCode}`
            })
            setShowCameraScanner(false)
            setShowQuickSale(true)
            playBeep('error')
        }
        } finally { scanInFlightRef.current = false }
    }

    const handleCheckoutSuccess = (saleData) => {
        setShowCheckout(false)
        clearCart()
        setLastSale(saleData)
    }

    return (
        <div className="fixed inset-0 md:relative md:inset-auto md:h-full flex flex-col overflow-hidden bg-slate-50 md:flex-col-reverse">
            {/* Main Content: Products + Cart */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 bg-slate-50">
                {/* --- LEFT: MAIN LOGIC AREA --- */}
                {/* --- CAMERA SCANNER (SPLIT-VIEW) --- */}
                {showCameraScanner && (
                    <div className="relative shrink-0 border-b border-slate-200 bg-slate-950 md:flex-1 md:border-b-0 md:border-r md:h-full md:flex md:flex-col md:justify-center overflow-hidden">
                        {/* Top-right overlay close button */}
                        <button
                            type="button"
                            onClick={() => { setShowCameraScanner(false); setCameraFeedback('') }}
                            className="absolute right-3 top-3 z-30 h-8 w-8 rounded-full bg-slate-900/80 hover:bg-slate-900 active:scale-95 text-white flex items-center justify-center backdrop-blur-sm shadow-md transition-all border border-white/10"
                            title="Đóng camera"
                            aria-label="Đóng camera"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Floating Scan Success Feedback Pill */}
                        {cameraFeedback && (
                            <div className="absolute bottom-16 left-3 right-3 z-30 flex justify-center pointer-events-none">
                                <div className="bg-emerald-600/95 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xl backdrop-blur-sm flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200 truncate max-w-[90%] border border-emerald-400/30">
                                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
                                    <span className="truncate">{cameraFeedback}</span>
                                </div>
                            </div>
                        )}

                        <BarcodeScanner onDetected={handleScanResult} active={showCameraScanner} />
                    </div>
                )}

                {!showCameraScanner && (
                <div className={`${cart.length > 0 ? 'hidden md:flex' : 'flex'} flex-1 flex flex-col min-h-0 relative z-0`}>
                    {/* Main Content Area - Just Show "Sẵn sàng" state when idle */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center custom-scrollbar select-none">
                        <div className="text-center my-auto w-full max-w-lg">
                            <h3 className="text-base font-bold text-slate-700 tracking-tight">Sẵn sàng bán hàng</h3>
                            <p className="text-xs text-slate-400 font-medium mt-1">Quét mã vạch hoặc nhập tên/mã sản phẩm bên dưới</p>
                            <button type="button" onClick={() => setShowCameraScanner(true)} className="mt-4 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"><Camera className="w-4 h-4" /> Bật Camera Quét Mã</button>
                        </div>
                    </div>
                </div>
                )}

                {/* --- RIGHT: CART & CHECKOUT --- */}

                <div className={`flex flex-col z-20 overflow-hidden md:flex-none md:w-[380px] bg-white border-l border-slate-200 shadow-sm min-h-0 ${cart.length === 0 ? 'hidden md:flex' : 'flex flex-1 md:flex-1'}`}>
                    <div className="py-2 px-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <h2 className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-sky-600" /> GIỎ HÀNG <span className="bg-sky-600 text-white px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums">{totalItems}</span>
                        </h2>
                        <button
                            onClick={clearCart}
                            className="text-[11px] text-slate-400 hover:text-rose-600 font-medium transition-colors px-2 py-1 rounded-md hover:bg-rose-50"
                            disabled={totalItems === 0}
                        >
                            Xoá hết
                        </button>
                    </div>

                    <div ref={cartListRef} className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar min-h-0 overscroll-contain touch-pan-y">
                        {cart.length === 0 ? (
                            <div className={`${showCameraScanner ? 'flex' : 'hidden md:flex'} flex-col items-center justify-center h-full text-slate-400 text-xs italic font-medium p-4 text-center`}>
                                Chưa có sản phẩm trong giỏ...
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {cart.map(item => (
                                    <CartItem
                                        key={item.product_id || item.id}
                                        item={item}
                                        isHighlighted={scannedItem?.id === (item.product_id || item.id)}
                                        onUpdateQty={updateQuantity}
                                        onSetQty={setQuantity}
                                        onRemove={removeFromCart}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sticky Checkout Area - Slim Single Row */}
                    {totalItems > 0 && (
                        <div className="py-1.5 px-2.5 border-t border-slate-200 bg-white shadow-sm shrink-0">
                            <button
                                onClick={() => setShowCheckout(true)}
                                className="btn-success w-full h-10 rounded-xl shadow-sm active:scale-[0.98] transition-all disabled:opacity-30 disabled:shadow-none flex items-center justify-between px-3 py-1.5"
                                disabled={totalItems === 0}
                            >
                                <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-tight">
                                    <span>THANH TOÁN</span>
                                    <span className="bg-white/20 px-1.5 py-0.5 rounded text-[11px] font-mono leading-none">({totalItems})</span>
                                    <ArrowRight className="w-3.5 h-3.5 opacity-80" />
                                </div>
                                <div className="text-right font-bold font-mono tabular-nums text-sm sm:text-base leading-none flex items-baseline gap-0.5">
                                    <span>{new Intl.NumberFormat('vi-VN').format(totalAmount)}</span>
                                    <span className="text-[11px] font-normal opacity-90">đ</span>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Search Bar + Action Buttons - Combined Single Row */}
            <div data-testid="mobile-sales-actions" className={`shrink-0 px-2 pt-2 md:p-2 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.1)] z-30 border-t transition-all relative md:border-t-0 md:border-b md:shadow-[0_8px_24px_rgba(0,0,0,0.06)] ${showCameraScanner ? 'pb-2 safe-bottom' : 'mb-[58px] pb-2'}`}>

                {/* 🚀 INTEGRATED SEARCH RESULTS - Pops up from the bar */}
                {isSearching && (
                    <div className="absolute bottom-full left-0 right-0 z-40 px-2 pb-2 animate-in slide-in-from-bottom-5 duration-200 md:bottom-auto md:top-full md:pb-0 md:pt-2">
                        <div className="bg-white rounded-t-[28px] shadow-[0_-25px_60px_rgba(0,0,0,0.2)] border-x border-t border-gray-100 flex flex-col max-h-[50vh] overflow-hidden">
                            <div className="p-3 border-b flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-10">
                                <span className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] px-2">Kết quả</span>
                                <button
                                    onClick={() => { setQuery(''); setIsSearchInputFocused(false); }}
                                    className="h-6 w-6 rounded-md bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 hover:text-red-500 font-bold"
                                >✕</button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar min-h-[100px]">
                                {products.length === 0 ? (
                                    <div className="text-center py-10 opacity-30">
                                        <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm font-bold">Không tìm thấy</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-1.5">
                                        {products.map(p => (
                                            <div
                                                key={p.id}
                                                onClick={() => {
                                                    handleAddToCart(p);
                                                    setQuery('');
                                                    setIsSearchInputFocused(false);
                                                    playBeep('success');
                                                }}
                                                className="flex items-center gap-3 p-2 bg-gray-50/50 hover:bg-primary/5 rounded-2xl active:scale-[0.99] transition-all cursor-pointer border border-transparent hover:border-primary/10"
                                            >
                                                {/* Thumbnail */}
                                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-gray-100 shrink-0">
                                                    {p.image_url ? (
                                                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <Package className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-800 text-xs truncate leading-tight uppercase tracking-tight">{p.name}</p>
                                                    <p className="text-primary font-black text-xs mt-0.5">
                                                        {new Intl.NumberFormat('vi-VN').format(p.price)}
                                                        <span className="text-[8px] ml-0.5 opacity-50 font-bold underline">đ</span>
                                                    </p>
                                                </div>
                                                <div className="h-8 w-8 rounded-xl bg-primary text-white flex items-center justify-center font-black text-lg shadow-sm">+</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Floating Scan Feedback */}
                {lastScanned && (
                    <div className={`${isSearching ? 'bottom-[120%]' : '-top-12'} absolute left-1/2 -translate-x-1/2 bg-sky-600 text-white px-4 py-2 rounded-full shadow-lg font-bold text-xs animate-in slide-in-from-bottom-2 flex items-center gap-2 z-50 whitespace-nowrap transition-all`}>
                        <CheckCircle2 className="w-4 h-4" /> <span>{lastScanned}</span>
                    </div>
                )}
                {scanError && (
                    <div className={`${isSearching ? 'bottom-[120%]' : '-top-12'} absolute left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg font-bold text-xs animate-in slide-in-from-bottom-2 flex items-center gap-2 z-50 whitespace-nowrap transition-all`}>
                        <XCircle className="w-4 h-4" /> <span>{scanError}</span>
                    </div>
                )}

                <div className="flex items-center gap-2 max-w-full">
                    {/* Search: Icon-only by default, expands to input when clicked */}
                    {!(isSearchOpen || query) ? (
                        <button
                            type="button"
                            onClick={() => {
                                setIsSearchOpen(true)
                                setTimeout(() => searchInputRef.current?.focus(), 50)
                            }}
                            className="flex-1 sm:flex-none h-11 w-11 md:h-10 md:w-10 rounded-xl flex items-center justify-center bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 shadow-xs shrink-0 active:scale-95 transition-all"
                            title="Tìm kiếm sản phẩm"
                            aria-label="Tìm kiếm"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    ) : (
                        <div className="flex-1 relative flex items-center min-w-0 animate-in fade-in zoom-in-95 duration-150">
                            <input
                                ref={searchInputRef}
                                autoFocus
                                type="text"
                                className="w-full h-11 md:h-10 pl-9 pr-8 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white transition-all outline-none"
                                placeholder="Mã/Tên SP... (Esc để thoát)"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        e.preventDefault()
                                        setQuery('')
                                        setProducts([])
                                        setIsSearchInputFocused(false)
                                        setIsSearchOpen(false)
                                        searchInputRef.current?.blur()
                                        return
                                    }
                                    if (e.ctrlKey && e.key === 'Enter') {
                                        e.preventDefault()
                                        if (!showCheckout && !showQuickSale && !lastSale && totalItems > 0) {
                                            searchInputRef.current?.blur()
                                            setShowCheckout(true)
                                        }
                                        return
                                    }
                                    const scanCode = e.currentTarget.value.trim()
                                    if (e.key === 'Enter') {
                                        if (scanCode) {
                                            handleScanResult(scanCode)
                                            e.preventDefault()
                                        }
                                    }
                                }}
                                onFocus={() => setIsSearchInputFocused(true)}
                                onBlur={() => {
                                    if (query.trim() === '') {
                                        setIsSearchInputFocused(false)
                                    }
                                }}
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <Search className="w-4 h-4" />
                            </span>
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => {
                                    setQuery('')
                                    setProducts([])
                                    setIsSearchInputFocused(false)
                                    setIsSearchOpen(false)
                                    searchInputRef.current?.blur()
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors p-1"
                                title="Đóng tìm kiếm"
                                aria-label="Đóng tìm kiếm"
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Camera Scanner Button - Icon only */}
                    <button
                        type="button"
                        onClick={() => setShowCameraScanner(prev => !prev)}
                        aria-label="Quét mã bằng camera"
                        className={`${(isSearchOpen || query) ? 'w-11 sm:w-10' : 'flex-1 sm:w-10'} h-11 md:h-10 rounded-xl flex items-center justify-center transition-all border shadow-xs shrink-0 active:scale-95 ${
                            showCameraScanner
                                ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                                : 'bg-sky-50 text-sky-600 hover:bg-sky-100 border-sky-200'
                        }`}
                        title={showCameraScanner ? "Đóng camera" : "Quét mã bằng camera"}
                    >
                        {showCameraScanner ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5 text-sky-600" />}
                    </button>

                    {/* Quick Sale Button - Icon only */}
                    <button
                        onClick={() => {
                            setQuickSalePreset({ barcode: '', name: '' })
                            setShowQuickSale(true)
                        }}
                        aria-label="Bán nhanh"
                        title="Bán nhanh"
                        className={`${(isSearchOpen || query) ? 'w-11 sm:w-10' : 'flex-1 sm:w-10'} h-11 md:h-10 rounded-xl flex items-center justify-center transition-all border shadow-xs shrink-0 active:scale-95 ${
                            showQuickSale
                                ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
                                : 'bg-white hover:bg-amber-50 text-amber-500 border-slate-200 hover:border-amber-200'
                        }`}
                    >
                        <Zap className={`w-5 h-5 ${showQuickSale ? 'text-white' : 'text-amber-500'}`} />
                    </button>

                    {/* History Button - Icon only */}
                    <button
                        onClick={() => navigate('/history')}
                        aria-label="Lịch sử"
                        title="Lịch sử"
                        className={`${(isSearchOpen || query) ? 'w-11 sm:w-10' : 'flex-1 sm:w-10'} h-11 md:h-10 rounded-xl flex items-center justify-center bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-xs shrink-0 active:scale-95 transition-all`}
                    >
                        <History className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
            </div>

            {/* Modals */}
            {showCheckout && (
                <CheckoutModal
                    cart={cart}
                    totalAmount={totalAmount}
                    onClose={() => setShowCheckout(false)}
                    onFinish={handleCheckoutSuccess}
                />
            )}

            {showQuickSale && (
                <QuickSaleModal
                    onClose={() => {
                        setShowQuickSale(false)
                        setQuickSalePreset({ barcode: '', name: '' })
                    }}
                    onAddToCart={handleAddToCart}
                    presetBarcode={quickSalePreset.barcode}
                    presetName={quickSalePreset.name}
                />
            )}

            {lastSale && (
                <InvoiceModal
                    sale={lastSale}
                    onClose={() => setLastSale(null)}
                />
            )}
        </div>
    )
}