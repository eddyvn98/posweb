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
            className={`flex items-center justify-between py-1.5 px-2 rounded-lg transition-all duration-200 border-b border-slate-100 last:border-0 group gap-2 ${
                isHighlighted 
                    ? 'bg-sky-50 ring-2 ring-sky-400 shadow-sm' 
                    : 'hover:bg-slate-50/50'
            }`}
        >
            <div className="hidden sm:flex w-8 h-8 rounded-lg overflow-hidden bg-slate-50 border border-slate-200 shrink-0 items-center justify-center">
                {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                    <Package className="w-3.5 h-3.5 text-slate-400" />
                )}
            </div>

            <div className="flex-1 min-w-0 pr-1">
                <div title={item.name} className="font-semibold text-xs text-slate-800 leading-snug line-clamp-2 break-words">
                    {item.name || 'Sản phẩm'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5 flex items-center gap-1.5 flex-wrap">
                    {new Intl.NumberFormat('vi-VN').format(item.price)} <span className="text-[10px]">đ</span>
                </div>
                <div className={`text-[10px] font-medium leading-none mt-1 ${remainingAfterSale < 0 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                    Tồn: {new Intl.NumberFormat('vi-VN').format(stockQuantity)} | Còn: {new Intl.NumberFormat('vi-VN').format(remainingAfterSale)}
                </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 justify-end">
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden h-7 bg-white shadow-xs">
                    <button
                        onClick={() => handleUpdate(-1)}
                        className="w-7 h-full flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                        title="Giảm số lượng"
                        aria-label="Giảm số lượng"
                    >
                        <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                        type="text"
                        inputMode="numeric"
                        className="w-7 h-full text-center text-xs font-bold text-sky-600 font-mono tabular-nums bg-transparent border-0 focus:ring-0 p-0 outline-none"
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
                        className="w-7 h-full flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                        title="Tăng số lượng"
                        aria-label="Tăng số lượng"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="min-w-[50px] text-right font-bold text-xs text-slate-900 font-mono tabular-nums">
                    {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}
                </div>

                <button
                    onClick={() => onRemove(item.product_id || item.id)}
                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-80 group-hover:opacity-100"
                    title="Xóa sản phẩm"
                    aria-label="Xóa sản phẩm"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}

