import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'

export default function CartBar() {
    const navigate = useNavigate()
    const location = useLocation()
    const { cart, totalAmount, totalItems } = useCart()
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
    if (cart.length === 0 || hidePages.includes(location.pathname)) {
        return null
    }

    return (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[110] w-[95%] max-w-lg transition-all duration-300">
            {/* Expanded Content Overlay */}
            {expanded && (
                <div
                    className="absolute bottom-full left-0 w-full mb-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in-up origin-bottom"
                >
                    <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                        <span className="font-bold text-gray-700">Chi tiết giỏ hàng</span>
                        <button onClick={() => setExpanded(false)} className="text-gray-400 font-bold text-xl">&times;</button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-4 space-y-3">
                        {cart.map((item, idx) => (
                            <div key={item.product_id || item.id || idx} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                <div className="flex-1">
                                    <div className="font-bold text-gray-800 line-clamp-1">{item.name}</div>
                                    <div className="text-[10px] text-gray-400">{new Intl.NumberFormat('vi-VN').format(item.price)}đ</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-primary">x{item.quantity}</span>
                                    <span className="font-bold text-gray-800 min-w-[70px] text-right">
                                        {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Bar */}
            <div
                className={`
                    flex items-center gap-3 p-3 bg-primary/95 backdrop-blur-md text-white rounded-2xl shadow-2xl transition-all border border-pink-400
                    ${animate ? 'scale-105 shadow-pink-200' : 'scale-100'}
                `}
            >
                {/* Summary Info (Click to toggle expanded) */}
                <div
                    className="flex-1 flex items-center gap-3 cursor-pointer select-none active:opacity-70 transition-opacity pl-2"
                    onClick={() => setExpanded(!expanded)}
                >
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shadow-inner">
                        🛒
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">
                            {totalItems} MÓN TRONG GIỎ
                        </div>
                        <div className="text-xl font-black leading-none flex items-center gap-1">
                            {new Intl.NumberFormat('vi-VN').format(totalAmount)}
                            <span className="text-xs font-bold opacity-60 pt-1">đ</span>
                            <span className={`text-[10px] transition-transform ml-1 ${expanded ? 'rotate-180' : ''}`}>▼</span>
                        </div>
                    </div>
                </div>

                {/* Checkout Button */}
                <button
                    onClick={() => navigate('/sales')}
                    className="bg-white text-primary font-black px-6 py-3 rounded-xl shadow-lg active:scale-90 transition-all text-sm uppercase tracking-tighter border-b-2 border-gray-200"
                >
                    Thanh toán
                </button>
            </div>
        </div>
    )
}
