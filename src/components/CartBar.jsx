import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import CartItem from './CartItem'
import { ShoppingCart, ChevronDown, X } from 'lucide-react'

export default function CartBar() {
    const navigate = useNavigate()
    const location = useLocation()
    const { cart, totalAmount, totalItems, removeFromCart, updateQuantity, setQuantity } = useCart()
    const [expanded, setExpanded] = useState(false)
    const [animate, setAnimate] = useState(false)

    // Trigger bounce animation when items change
    useEffect(() => {
        if (totalItems > 0) {
            setAnimate(true)
            const timer = setTimeout(() => setAnimate(false), 300)
            return () => clearTimeout(timer)
        }
    }, [totalItems])

    // Auto-hide if cart is empty or on specific pages
    const hidePages = ['/login', '/sales', '/history']
    if (cart.length === 0 || hidePages.includes(location.pathname) || location.pathname.startsWith('/shop')) {
        return null
    }

    return (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[110] w-[95%] max-w-lg transition-all duration-300">
            {/* Expanded Content Overlay */}
            {expanded && (
                <div
                    className="absolute bottom-full left-0 w-full mb-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in-up origin-bottom"
                >
                    <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <span className="font-bold text-slate-800 text-sm">Chi tiết giỏ hàng ({totalItems})</span>
                        <button onClick={() => setExpanded(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
                        {cart.map((item) => (
                            <CartItem
                                key={item.product_id || item.id}
                                item={item}
                                onUpdateQty={updateQuantity}
                                onSetQty={setQuantity}
                                onRemove={removeFromCart}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Main Bar */}
            <div
                className={`
                    flex items-center gap-3 p-3 bg-slate-900 text-white rounded-2xl shadow-xl transition-all border border-slate-800
                    ${animate ? 'scale-[1.02]' : 'scale-100'}
                `}
            >
                {/* Summary Info (Click to toggle expanded) */}
                <div
                    className="flex-1 flex items-center gap-3 cursor-pointer select-none active:opacity-80 transition-opacity pl-1"
                    onClick={() => setExpanded(!expanded)}
                >
                    <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-sm">
                        <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-1">
                            {totalItems} món trong giỏ
                        </div>
                        <div className="text-lg font-bold font-mono tabular-nums leading-none flex items-center gap-1.5 text-white">
                            {new Intl.NumberFormat('vi-VN').format(totalAmount)}
                            <span className="text-xs font-normal text-slate-400">đ</span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        </div>
                    </div>
                </div>

                {/* Checkout Button */}
                <button
                    onClick={() => navigate('/sales')}
                    className="btn bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm text-sm uppercase tracking-tight"
                >
                    Thanh toán
                </button>
            </div>
        </div>
    )
}

