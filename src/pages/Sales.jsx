import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchLocalProducts } from '../lib/db'
import { useCart } from '../contexts/CartContext'
import { useScanBarcode } from '../hooks/useScanBarcode'

import BarcodeScanner from '../components/BarcodeScanner'
import ProductCard from '../components/ProductCard'
import CartItem from '../components/CartItem'
import CheckoutModal from '../components/CheckoutModal'
import QuickSaleModal from '../components/QuickSaleModal'
import InvoiceModal from '../components/InvoiceModal'

export default function Sales() {
    const navigate = useNavigate()
    const [query, setQuery] = useState('')
    const [isSearchInputFocused, setIsSearchInputFocused] = useState(false)
    const [products, setProducts] = useState([])
    const [showCheckout, setShowCheckout] = useState(false)
    const [showQuickSale, setShowQuickSale] = useState(false)
    const [lastSale, setLastSale] = useState(null)

    const { cart, addToCart, removeFromCart, updateQuantity, clearCart, totalAmount, totalItems } = useCart()

    // Core state per new4.md
    const isSearching = isSearchInputFocused || query.trim().length > 0

    // 1. Search Logic
    useEffect(() => {
        if (!query.trim()) {
            setProducts([])
            return
        }

        const timer = setTimeout(async () => {
            const results = await searchLocalProducts(query)
            setProducts(results)
        }, 200)
        return () => clearTimeout(timer)
    }, [query])

    // Shared Scan Logic
    const handleScanResult = async (code) => {
        const results = await searchLocalProducts(code)
        const match = results.find(p => p.barcode === code)

        if (match) {
            addToCart(match)
        } else {
            if (confirm(`Mã ${code} chưa có. Bán nhanh?`)) {
                setShowQuickSale(true)
            }
        }
    }

    // 2. Barcode Logic (Hardware)
    useScanBarcode({
        onScan: handleScanResult
    })

    // 3. Layout Handlers
    const handleCheckoutSuccess = (saleData) => {
        setShowCheckout(false)
        clearCart()
        setLastSale(saleData)
    }

    return (
        <div className="flex flex-col md:flex-row h-full overflow-hidden bg-gray-100">
            {/* --- LEFT: SEARCH & PRODUCTS --- */}
            <div className="flex-1 flex flex-col h-[55vh] md:h-full relative z-0 border-b md:border-b-0">
                {/* Search Bar + Action Buttons */}
                <div className="p-3 bg-white shadow-sm z-10 border-b space-y-2">
                    {/* Search Input */}
                    <input
                        autoFocus
                        type="text"
                        className="input w-full focus:ring-primary focus:border-primary shadow-inner bg-white border-pink-100"
                        placeholder="Tìm tên hoặc quét mã SP..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsSearchInputFocused(true)}
                        onBlur={() => {
                            if (query.trim() === '') {
                                setIsSearchInputFocused(false)
                            }
                        }}
                    />
                    
                    {/* Action Buttons Row */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowQuickSale(true)}
                            className="flex-1 btn bg-primary text-white font-black py-3 rounded-2xl shadow-lg shadow-pink-100 active:scale-95 transition-all text-sm hover:shadow-xl"
                        >
                            ⚡ BÁN NHANH
                        </button>
                        <button
                            onClick={() => navigate('/history')}
                            className="flex-1 btn bg-blue-50 text-blue-600 font-black py-3 rounded-2xl border border-blue-200 active:scale-95 transition-all text-sm hover:bg-blue-100"
                        >
                            📜 LỊCH SỬ
                        </button>
                    </div>
                </div>

                {/* Product Grid - Desktop/Tablet always, Mobile only when not searching */}
                {!isSearching && (
                <div className="flex-1 overflow-y-auto p-3 content-start custom-scrollbar">
                    {query.trim() ? (
                        <>
                            {products.length === 0 ? (
                                <div className="text-center py-16">
                                    <p className="text-5xl mb-4">🔍</p>
                                    <p className="text-gray-600 font-bold text-lg">Không tìm thấy sản phẩm</p>
                                    <p className="text-gray-400 text-sm mt-2">Thử từ khóa khác hoặc quét mã vạch</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {products.map(p => (
                                        <ProductCard key={p.id} product={p} onAdd={addToCart} />
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center mt-12 opacity-30 select-none animate-fade-in-up">
                            <div className="text-7xl mb-4">🏪</div>
                            <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter">Sẵn sàng bán hàng</h3>
                            <p className="text-xs text-gray-500 font-medium tracking-tight">Quét mã vạch hoặc nhập tên để tìm</p>
                        </div>
                    )}
                </div>
                )}

                {/* Mobile Search Results - shows when searching */}
                {isSearching && (
                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-white border-t border-pink-100">
                    {products.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-4xl mb-3">🔍</p>
                            <p className="text-gray-600 font-bold">Không tìm thấy sản phẩm</p>
                            <p className="text-gray-400 text-xs mt-1">Thử từ khóa khác</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {products.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800 text-sm">{p.name}</p>
                                        <p className="text-primary font-black text-sm">
                                            {new Intl.NumberFormat('vi-VN').format(p.price)}đ
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            addToCart(p)
                                            setQuery('')
                                            setIsSearchInputFocused(false)
                                        }}
                                        className="btn bg-primary text-white py-2 px-4 rounded-xl text-sm font-black"
                                    >
                                        + Thêm
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                )}
            </div>

            {/* --- RIGHT: CART & CHECKOUT --- */}
            <div className="flex-1 md:flex-none md:w-[380px] bg-white border-l border-pink-100 shadow-2xl flex flex-col z-20 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
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

                <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-300 mt-20 text-xs italic font-medium">
                            Giỏ hàng đang trống...
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {cart.map(item => (
                                <CartItem
                                    key={item.product_id || item.id}
                                    item={item}
                                    onUpdateQty={updateQuantity}
                                    onRemove={removeFromCart}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Sticky Checkout Area */}
                <div className="p-4 border-t bg-white shadow-[0_-10px_30px_rgba(233,30,99,0.05)]">
                    <div className="flex justify-between items-center mb-4 px-1">
                        <span className="text-gray-400 text-[10px] uppercase font-black tracking-widest">TỔNG TIỀN</span>
                        <div className="text-right">
                            <div className="text-2xl font-black text-primary leading-none">
                                {new Intl.NumberFormat('vi-VN').format(totalAmount)}
                                <span className="text-xs ml-1 opacity-60">đ</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCheckout(true)}
                        className="w-full bg-primary text-white py-4 rounded-2xl text-lg font-black shadow-xl shadow-pink-200 active:scale-95 transition-all disabled:opacity-30 disabled:shadow-none tracking-tight uppercase"
                        disabled={totalItems === 0}
                    >
                        THANH TOÁN ➝
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
                    onClose={() => setShowQuickSale(false)}
                    onAddToCart={addToCart}
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
