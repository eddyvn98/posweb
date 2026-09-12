import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchLocalProducts } from '../lib/db'
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
    History 
} from 'lucide-react'

import ProductCard from '../components/ProductCard'
import CartItem from '../components/CartItem'
import CheckoutModal from '../components/CheckoutModal'
import QuickSaleModal from '../components/QuickSaleModal'
import InvoiceModal from '../components/InvoiceModal'

export default function Sales() {
    const navigate = useNavigate()
    const searchInputRef = useRef(null)
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

    const { cart, addToCart, removeFromCart, updateQuantity, setQuantity, clearCart, totalAmount, totalItems } = useCart()
    const { pullProducts, isOnline } = useSync()

    // 🔊 Beep sound utility
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
        } catch (e) { /* Audio fallback */ }
    }

    // 🚀 Enable Bluetooth/External Scanner
    // Disabled when input is focused to avoid double-fire:
    // input's onKeyDown also handles Enter when focused.
    useScanBarcode({
        onScan: (code) => handleScanResult(code),
        enabled: !isSearchInputFocused,
    })

    // Auto-focus search input only on mount
    useEffect(() => {
        searchInputRef.current?.focus()
    }, [])

    // Escape shortcut to exit search state
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
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
    }, [query, isSearchInputFocused, showCheckout, showQuickSale, lastSale])

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

    // Shared Scan Logic
    const handleScanResult = async (code) => {
        setQuery('') // Clear UI search
        setScanError(null)

        const results = await searchLocalProducts(code)
        // Find exact match by barcode OR id
        const match = results.find(p => p.barcode === code || p.id === code)

        if (match) {
            addToCart(match)
            setLastScanned(match.name)
            playBeep('success')
            setTimeout(() => setLastScanned(null), 2000)
        } else {
            setQuickSalePreset({
                barcode: code,
                name: `SP ${code}`
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

                    <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar min-h-0">
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
                                <span className="text-sm font-bold uppercase tracking-tight flex items-center gap-1">THANH TOÁN <ArrowRight className="w-4 h-4" /></span>
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
                                                    addToCart(p);
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
                            autoFocus
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
                    onAddToCart={addToCart}
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
