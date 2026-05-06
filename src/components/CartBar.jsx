import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import CartItem from './CartItem'
import { ShoppingCart, ArrowRight, X, ChevronDown } from './Icons'

export default function CartBar() {
    const navigate = useNavigate()
    const location = useLocation()
    const { cart, totalAmount, totalItems, removeFromCart, updateQuantity, setQuantity, isCheckoutRequested, setIsCheckoutRequested, isCheckoutModalOpen, orders, activeOrderId, fabPosition } = useCart()
    const [expanded, setExpanded] = useState(false)
    const [animate, setAnimate] = useState(false)

    const activeOrder = orders.find(o => o.id === activeOrderId) || orders[0]
    const hasMultipleOrders = orders.length > 1

    // Trigger bounce animation when items change
    useEffect(() => {
        if (totalItems > 0) {
            setAnimate(true)
            const timer = setTimeout(() => setAnimate(false), 300)
            return () => clearTimeout(timer)
        }
    }, [totalItems])

    // Visible pages: Sales and Products
    const isVisiblePage = ['/app/sales', '/app/products'].includes(location.pathname)

    // Only show on mobile, on visible pages, when cart has items, AND not in checkout mode
    if (cart.length === 0 || !isVisiblePage || isCheckoutModalOpen) {
        return null
    }

    const isSalesPage = location.pathname === '/app/sales'

    return (
        <div className="md:hidden">
            {/* Expanded Content Overlay */}
            {expanded && (
                <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-end animate-in fade-in duration-200" onClick={() => setExpanded(false)}>
                    <div 
                        className="w-full bg-white rounded-t-[32px] shadow-2xl border-t border-pink-50 overflow-hidden animate-in slide-in-from-bottom-10 duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="px-5 py-6 bg-white flex justify-between items-center sticky top-0 z-10">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setExpanded(false)} className="text-gray-800 p-1">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6"><path d="M19 12H5m7-7l-7 7 7 7" /></svg>
                                </button>
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-xl text-gray-800">Giỏ hàng</span>
                                    <span className="bg-primary text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                                        {totalItems}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => { if (confirm('Xóa tất cả sản phẩm?')) orders.forEach(o => o.items.forEach(i => removeFromCart(i.id))) }}
                                className="text-xs font-black text-primary uppercase tracking-widest hover:opacity-70 transition-opacity"
                            >
                                Xóa hết
                            </button>
                        </div>
                        
                        <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar bg-gray-50/30">
                            <div className="divide-y divide-gray-100">
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

                        <div className="p-5 bg-white border-t border-gray-100 safe-bottom">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setExpanded(false)
                                    if (isSalesPage) {
                                        setIsCheckoutRequested(true)
                                    } else {
                                        navigate('/app/sales')
                                    }
                                }}
                                className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <span className="text-lg">Thanh toán ngay</span>
                                <ArrowRight className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Compact Floating Cart Button */}
            <div
                className={`
                    fixed bottom-24 ${fabPosition === 'right' ? 'left-4' : 'right-4'} w-14 h-14 bg-white border-2 border-primary rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.15)] 
                    flex flex-col items-center justify-center active:scale-90 transition-all cursor-pointer z-[110]
                    ${animate ? 'scale-110' : 'scale-100'}
                `}
                onClick={() => setExpanded(true)}
            >
                <div className="relative">
                    <ShoppingCart className="w-6 h-6 text-primary" />
                    <span className="absolute -top-2.5 -right-2.5 bg-primary text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-md border border-white min-w-[18px] text-center">
                        {totalItems}
                    </span>
                </div>
                <span className="text-[8px] font-black text-primary mt-0.5">GIỎ</span>
            </div>
        </div>
    )
}
