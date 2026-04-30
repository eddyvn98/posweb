import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchLocalProducts } from '../lib/db'
import { useCart } from '../contexts/CartContext'
import { useSync } from '../contexts/SyncContext'
import { useScanBarcode } from '../hooks/useScanBarcode'

import ProductCard from '../components/ProductCard'
import CartItem from '../components/CartItem'
import CheckoutModal from '../components/CheckoutModal'
import QuickSaleModal from '../components/QuickSaleModal'
import InvoiceModal from '../components/InvoiceModal'
import { getProductImageUrl } from '../lib/imageUtils'

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
        <div className="h-[100dvh] flex flex-col overflow-hidden bg-white md:flex-col-reverse">
            {/* Main Content: Products + Cart */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 bg-gray-50">
                {/* --- LEFT: MAIN LOGIC AREA --- */}
                <div className={`${cart.length > 0 ? 'hidden md:flex' : 'flex'} flex-1 flex flex-col h-full relative z-0`}>
                    {/* Main Content Area - Just Show "Sẵn sàng" state when idle */}
                    <div className="flex-1 overflow-y-auto p-3 content-start custom-scrollbar">
                        <div className="text-center mt-12 opacity-30 select-none animate-fade-in-up">
                            <div className="text-7xl mb-4">🏪</div>
                            <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter">Sẵn sàng bán hàng</h3>
                            <p className="text-xs text-gray-500 font-medium tracking-tight">Quét mã vạch hoặc nhập tên để tìm</p>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT: CART & CHECKOUT --- */}
                <div className={`flex flex-col z-20 overflow-hidden md:flex-none md:w-[380px] bg-white border-l border-pink-100 shadow-xl ${cart.length === 0 ? 'h-auto' : 'flex-1 md:flex-1'}`}>
                    <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                        <h2 className="font-black text-xs uppercase tracking-widest text-gray-500 flex items-center gap-2">
                            🛒 GIỎ HÀNG <span className="bg-primary text-white px-2 py-0.5 rounded-full text-[10px]">{totalItems}</span>
                        </h2>
                        <button
                            onClick={clearCart}
                            className="text-[10px] text-red-400 hover:text-red-600 font-black uppercase tracking-tighter transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                            disabled={totalItems === 0}
                        >
                            Xoá hết
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar min-h-0">
                        {cart.length === 0 ? (
                            <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-300 text-xs italic font-medium">
                                Giỏ hàng đang trống...
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
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
                    <div className="p-3 border-t bg-white shadow-[0_-10px_30px_rgba(233,30,99,0.05)]">
                        <button
                            onClick={() => setShowCheckout(true)}
                            className="w-full h-14 bg-primary text-white rounded-xl shadow-lg shadow-pink-100 active:scale-95 transition-all disabled:opacity-30 disabled:shadow-none flex items-center justify-between px-5"
                            disabled={totalItems === 0}
                        >
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] opacity-70 font-black uppercase tracking-widest leading-none mb-1">Xác nhận</span>
                                <span className="text-sm font-black uppercase tracking-tight">THANH TOÁN ➝</span>
                            </div>
                            <div className="text-right">
                                <span className="text-xl font-black leading-none">
                                    {new Intl.NumberFormat('vi-VN').format(totalAmount)}
                                    <span className="text-xs ml-0.5 opacity-80 font-bold underline">đ</span>
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
                                    className="h-6 w-6 rounded-md bg-gray-50 flex items-center justify-center text-[10px] text-gray-400"
                                >✕</button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar min-h-[100px]">
                                {products.length === 0 ? (
                                    <div className="text-center py-10 opacity-30">
                                        <p className="text-4xl mb-2">🔍</p>
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
                                                        <img src={getProductImageUrl(p.image_url)} alt={p.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
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

                {/* 🏷️ Floating Scan Feedback - Moved higher to avoid overlap */}
                {lastScanned && (
                    <div className={`${isSearching ? 'bottom-[120%]' : '-top-12'} absolute left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg font-bold text-xs animate-in slide-in-from-bottom-2 flex items-center gap-2 z-50 whitespace-nowrap transition-all`}>
                        <span>✅ {lastScanned}</span>
                    </div>
                )}
                {scanError && (
                    <div className={`${isSearching ? 'bottom-[120%]' : '-top-12'} absolute left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg font-bold text-xs animate-in slide-in-from-bottom-2 flex items-center gap-2 z-50 whitespace-nowrap transition-all`}>
                        <span>❌ {scanError}</span>
                    </div>
                )}

                <div className="flex items-center gap-2 max-w-full">
                    {/* Search Input - Main Expandable */}
                    <div className="flex-1 relative">
                        <input
                            ref={searchInputRef}
                            autoFocus
                            type="text"
                            className="w-full h-10 pl-9 pr-3 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:ring-primary focus:border-primary focus:bg-white transition-all outline-none"
                            placeholder="Mã/Tên SP..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                const scanCode = e.currentTarget.value.trim()
                                if (e.key === 'Enter' && scanCode) {
                                    handleScanResult(scanCode)
                                    e.preventDefault()
                                }
                            }}
                            onFocus={() => setIsSearchInputFocused(true)}
                            onBlur={() => {
                                if (query.trim() === '') {
                                    setIsSearchInputFocused(false)
                                }
                            }}
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                    </div>

                    {/* Quick Sale Button - Compact */}
                    <button
                        onClick={() => {
                            setQuickSalePreset({ barcode: '', name: '' })
                            setShowQuickSale(true)
                        }}
                        className="h-10 px-3 bg-primary text-white font-bold rounded-xl shadow-sm active:scale-95 transition-all text-[10px] flex items-center gap-1 shrink-0 uppercase"
                    >
                        <span>⚡</span> <span className="hidden xs:inline">BÁN NHANH</span><span className="xs:hidden">NHANH</span>
                    </button>

                    {/* History Button - Compact */}
                    <button
                        onClick={() => navigate('/history')}
                        className="h-10 px-3 bg-blue-500 text-white font-bold rounded-xl shadow-sm active:scale-95 transition-all text-[10px] flex items-center gap-1 shrink-0 uppercase"
                    >
                        <span>📜</span> <span className="hidden xs:inline">LỊCH SỬ</span><span className="xs:hidden">T.SỬ</span>
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
