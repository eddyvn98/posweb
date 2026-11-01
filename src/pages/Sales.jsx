import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { playBeep, unlockAudio } from '../lib/soundUtils'
import { searchLocalProducts, saveProductsToLocal, upsertProductsToLocal } from '../lib/db'
import BarcodeScanner from '../components/BarcodeScanner'
import api from '../lib/api'
import { useCart } from '../contexts/CartContext'
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
                if (query || isSearchInputFocused) {
                    e.preventDefault()
                    setQuery('')
                    setProducts([])
                    setIsSearchInputFocused(false)
                    searchInputRef.current?.blur()
                }
            }
        }
        window.addEventListener('keydown', handleGlobalKeyDown)
        return () => window.removeEventListener('keydown', handleGlobalKeyDown)
    }, [query, isSearchInputFocused, showCheckout, showQuickSale, lastSale, totalItems])

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
                    itemElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest'
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
        if (!cleanCode) return

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
            handleAddToCart(match)
            setLastScanned(`Đã thêm: ${match.name}`)
            playBeep('success')
            setTimeout(() => setLastScanned(null), 2500)
        } else {
            setQuickSalePreset({
                barcode: cleanCode,
                name: `SP ${cleanCode}`
            })
            setShowQuickSale(true)
            playBeep('error')
        }
    }

    const handleCheckoutSuccess = (saleData) => {
        setShowCheckout(false)
        clearCart()
        setLastSale(saleData)
    }

    return (
        <div className="h-[100dvh] flex flex-col overflow-hidden bg-slate-50 md:flex-col-reverse">
            {/* Main Content: Products + Cart */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 bg-slate-50">
                {/* --- LEFT: MAIN LOGIC AREA --- */}
                <div className={`${cart.length > 0 ? 'hidden md:flex' : 'flex'} flex-1 flex flex-col h-full relative z-0`}>
                    {/* Main Content Area - Just Show "Sẵn sàng" state when idle */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center custom-scrollbar select-none">
                        <div className="text-center my-auto w-full max-w-lg">
                            <h3 className="text-base font-bold text-slate-700 tracking-tight">Sẵn sàng bán hàng</h3>
                            <p className="text-xs text-slate-400 font-medium mt-1">Quét mã vạch hoặc nhập tên/mã sản phẩm bên dưới</p>
                            <button type="button" onClick={() => setShowCameraScanner(true)} className="mt-4 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"><Camera className="w-4 h-4" /> Bật Camera Quét Mã</button>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT: CART & CHECKOUT --- */}
                <div className={`flex flex-col z-20 overflow-hidden md:flex-none md:w-[380px] bg-white border-l border-slate-200 shadow-sm ${cart.length === 0 ? 'h-auto' : 'flex-1 md:flex-1'}`}>
                    <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
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

                    <div ref={cartListRef} className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar min-h-0 scroll-smooth">
                        {cart.length === 0 ? (
                            <div className="hidden md:flex flex-col items-center justify-center h-full text-slate-400 text-xs italic font-medium">
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

                    {/* Sticky Checkout Area - Combined Total into Button */}
                    <div className="p-3 border-t border-slate-200 bg-white shadow-sm">
                        <button
                            onClick={() => setShowCheckout(true)}
                            className="btn-success w-full h-13 rounded-xl shadow-sm active:scale-[0.98] transition-all disabled:opacity-30 disabled:shadow-none flex items-center justify-between px-4 py-3"
                            disabled={totalItems === 0}
                        >
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] opacity-80 font-bold uppercase tracking-wider leading-none mb-0.5">Xác nhận</span>
                                <span className="text-sm font-bold uppercase tracking-tight flex items-center gap-1.5">THANH TOÁN <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white/20 rounded border border-white/25 text-white leading-none">Ctrl + Enter</kbd> <ArrowRight className="w-4 h-4" /></span>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-bold font-mono tabular-nums leading-none">
                                    {new Intl.NumberFormat('vi-VN').format(totalAmount)}
                                    <span className="text-xs ml-0.5 opacity-90 font-normal">đ</span>
                                </span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Search Bar + Action Buttons - Combined Single Row */}
            <div className="p-2 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.1)] z-30 border-t pb-[100px] md:pb-3 transition-all relative md:border-t-0 md:border-b md:shadow-[0_8px_24px_rgba(0,0,0,0.06)]">

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
                    {/* Search Input - Main Expandable */}
                    <div className="flex-1 relative">
                        <input
                            ref={searchInputRef}
                            autoFocus={typeof window !== 'undefined' && window.innerWidth >= 768}
                            type="text"
                            className="w-full h-10 pl-9 pr-8 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:ring-primary focus:border-primary focus:bg-white transition-all outline-none"
                            placeholder="Mã/Tên SP... (Esc để thoát)"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    e.preventDefault()
                                    setQuery('')
                                    setProducts([])
                                    setIsSearchInputFocused(false)
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
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Search className="w-4 h-4" />
                        </span>
                        {query && (
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => {
                                    setQuery('')
                                    setProducts([])
                                    setIsSearchInputFocused(false)
                                    searchInputRef.current?.blur()
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors p-1"
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Camera Scanner Button */}
                    <button
                        type="button"
                        onClick={() => setShowCameraScanner(prev => !prev)}
                        className={`h-10 px-3 rounded-xl flex items-center justify-center font-bold text-xs gap-1.5 transition-all border shadow-xs shrink-0 active:scale-95 ${
                            showCameraScanner
                                ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                                : 'bg-sky-50 text-sky-600 hover:bg-sky-100 border-sky-200'
                        }`}
                        title={showCameraScanner ? "Đóng camera" : "Quét mã vạch bằng camera điện thoại"}
                    >
                        {showCameraScanner ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4 text-sky-600" />}
                        <span className="hidden sm:inline">{showCameraScanner ? "Đóng" : "Quét mã"}</span>
                    </button>

                    {/* Quick Sale Button - Compact */}
                    <button
                        onClick={() => {
                            setQuickSalePreset({ barcode: '', name: '' })
                            setShowQuickSale(true)
                        }}
                        className="btn-primary btn-md"
                    >
                        <Zap className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Bán Nhanh</span><span className="xs:hidden">Nhanh</span>
                    </button>

                    {/* History Button - Compact */}
                    <button
                        onClick={() => navigate('/history')}
                        className="btn-secondary btn-md"
                    >
                        <History className="w-3.5 h-3.5 text-slate-500" /> <span className="hidden xs:inline">Lịch Sử</span><span className="xs:hidden">T.Sử</span>
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
            {/* 📷 CAMERA SCANNER MODAL */}
            {showCameraScanner && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center p-2 sm:p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col animate-in slide-in-from-bottom-5 duration-300">
                        {/* Header */}
                        <div className="p-3.5 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                                <span className="text-white font-bold text-sm flex items-center gap-1.5">
                                    <Camera className="w-4 h-4 text-sky-400" /> Quét mã vạch sản phẩm
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCameraScanner(false)}
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Viewfinder */}
                        <div className="relative bg-black min-h-[220px] max-h-[340px] flex items-center justify-center overflow-hidden">
                            <BarcodeScanner
                                active={showCameraScanner}
                                onDetected={(code) => handleScanResult(code)}
                            />
                            {/* Crosshair Overlay */}
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <div className="w-[75%] h-[120px] border-2 border-sky-400/80 rounded-2xl shadow-[0_0_20px_rgba(56,189,248,0.3)] relative">
                                    <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-red-500/70 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-3 bg-slate-800/90 border-t border-slate-700/60 flex items-center justify-between text-xs">
                            <div className="text-slate-300 font-medium">
                                Giỏ hàng: <span className="font-bold text-white bg-sky-600 px-2 py-0.5 rounded-full font-mono">{totalItems} món</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCameraScanner(false)}
                                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold rounded-xl transition-all shadow-sm"
                            >
                                Xong (Xem giỏ)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}