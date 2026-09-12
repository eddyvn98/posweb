import { Package, Minus, Plus, Trash2 } from 'lucide-react'

export default function CartItem({ item, onUpdateQty, onSetQty, onRemove }) {
    const stockQuantity = Number(item.stock_quantity ?? 0)
    const remainingAfterSale = stockQuantity - Number(item.quantity || 0)

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
        <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0 group gap-2.5">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-50 border border-slate-200 shrink-0 flex items-center justify-center">
                {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                    <Package className="w-4 h-4 text-slate-400" />
                )}
            </div>

            <div className="flex-1 min-w-0 pr-1">
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

            <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden h-7 bg-white shadow-sm">
                    <button
                        onClick={() => handleUpdate(-1)}
                        className="w-7 h-full flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                        title="Giảm số lượng"
                    >
                        <Minus className="w-3 h-3" />
                    </button>
                    <input
                        type="text"
                        inputMode="numeric"
                        className="w-8 h-full text-center text-xs font-bold text-sky-600 font-mono tabular-nums bg-transparent border-0 focus:ring-0 p-0 outline-none"
                        value={item.quantity}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '')
                            onSetQty(item.product_id || item.id, parseInt(val) || 0)
                        }}
                        onBlur={() => {
                            if (item.quantity === 0) {
                                if (confirm(`Xóa "${item.name}" khỏi giỏ hàng?`)) {
                                    onRemove(item.product_id || item.id)
                                } else {
                                    onSetQty(item.product_id || item.id, 1)
                                }
                            }
                        }}
                    />
                    <button
                        onClick={() => handleUpdate(1)}
                        className="w-7 h-full flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                        title="Tăng số lượng"
                    >
                        <Plus className="w-3 h-3" />
                    </button>
                </div>

                <div className="min-w-[60px] text-right font-bold text-sm text-slate-900 font-mono tabular-nums">
                    {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}
                </div>

                <button
                    onClick={() => onRemove(item.product_id || item.id)}
                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all opacity-60 group-hover:opacity-100"
                    title="Xóa sản phẩm"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    )
}

