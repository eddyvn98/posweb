import { useState, useEffect } from 'react'
import { Package, Minus, Plus, Trash2 } from 'lucide-react'

export default function CartItem({ item, onUpdateQty, onSetQty, onRemove, isHighlighted = false }) {
    const stockQuantity = Number(item.stock_quantity ?? 0)
    const remainingAfterSale = stockQuantity - Number(item.quantity || 0)
    const [localQty, setLocalQty] = useState(String(item.quantity))

    useEffect(() => {
        setLocalQty(String(item.quantity))
    }, [item.quantity])

    const handleUpdate = (delta) => {
        const currentId = item.product_id || item.id
        if (item.quantity + delta <= 0) {
            if (confirm(`Xóa "${item.name}" khỏi giỏ hàng?`)) {
                onRemove(currentId)
            }
        } else {
            onUpdateQty(currentId, delta)
        }
    }

    return (
        <div 
            id={`cart-item-${item.product_id || item.id}`}
            className={`flex flex-wrap items-center justify-between py-2.5 px-2 rounded-xl transition-all duration-300 border-b border-slate-100 last:border-0 group gap-2.5 ${
                isHighlighted 
                    ? 'bg-sky-50 ring-2 ring-sky-400 shadow-sm' 
                    : 'hover:bg-slate-50/50'
            }`}
        >
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-50 border border-slate-200 shrink-0 flex items-center justify-center">
                {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                    <Package className="w-4 h-4 text-slate-400" />
                )}
            </div>

            <div className="flex-1 min-w-[130px] pr-1">
                <div className="font-semibold text-sm text-slate-900 leading-snug truncate">
                    {item.name}
                </div>
                <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                    {new Intl.NumberFormat('vi-VN').format(item.price)} <span className="text-[10px]">đ</span>
                </div>
                <div className={`text-[10px] font-medium leading-none mt-1 ${remainingAfterSale < 0 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                    Tồn: {new Intl.NumberFormat('vi-VN').format(stockQuantity)} | Còn: {new Intl.NumberFormat('vi-VN').format(remainingAfterSale)}
                </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden h-11 sm:h-9 bg-white shadow-sm">
                    <button
                        onClick={() => handleUpdate(-1)}
                        className="w-11 sm:w-9 h-full flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                        title="Giảm số lượng"
                        aria-label="Giảm số lượng"
                    >
                        <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                        type="text"
                        inputMode="numeric"
                        className="w-11 sm:w-9 h-full text-center text-xs font-bold text-sky-600 font-mono tabular-nums bg-transparent border-0 focus:ring-0 p-0 outline-none"
                        value={localQty}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '')
                            setLocalQty(val)
                        }}
                        onBlur={() => {
                            const parsed = parseInt(localQty)
                            if (!localQty || isNaN(parsed) || parsed <= 0) {
                                if (confirm(`Xóa "${item.name}" khỏi giỏ hàng?`)) {
                                    onRemove(item.product_id || item.id)
                                } else {
                                    setLocalQty(String(item.quantity))
                                }
                            } else {
                                onSetQty(item.product_id || item.id, parsed)
                            }
                        }}
                    />
                    <button
                        onClick={() => handleUpdate(1)}
                        className="w-11 sm:w-9 h-full flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                        title="Tăng số lượng"
                        aria-label="Tăng số lượng"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="min-w-[60px] text-right font-bold text-sm text-slate-900 font-mono tabular-nums">
                    {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}
                </div>

                <button
                    onClick={() => onRemove(item.product_id || item.id)}
                    className="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-80 group-hover:opacity-100"
                    title="Xóa sản phẩm"
                    aria-label="Xóa sản phẩm"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}

