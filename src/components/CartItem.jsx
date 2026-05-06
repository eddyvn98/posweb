import { getProductImageUrl } from '../lib/imageUtils'
import { Package, Plus, X, MinusCircle, PlusCircle } from './Icons'

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
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-50 flex gap-3 mb-2 relative group transition-all">
            {/* Compact Product Image */}
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100/50">
                {item.image_url ? (
                    <img src={getProductImageUrl(item.image_url)} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg"><Package className="w-6 h-6 opacity-10" /></div>
                )}
            </div>

            {/* Compressed Info Area */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                {/* Row 1: Name and Actions */}
                <div className="flex items-start justify-between gap-1 mb-1">
                    <h3 className="font-bold text-[13px] text-gray-800 leading-tight truncate flex-1">
                        {item.name}
                    </h3>
                    
                    <div className="flex items-center gap-1.5 shrink-0 scale-[0.8] origin-right -mt-1">
                        <div className="flex items-center bg-gray-50 rounded-full p-0.5 border border-gray-100">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleUpdate(-1); }}
                                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
                            >
                                <MinusCircle className="w-4 h-4" />
                            </button>
                            <span className="min-w-[20px] text-center text-xs font-black text-primary px-0.5">{item.quantity}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleUpdate(1); }}
                                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
                            >
                                <PlusCircle className="w-4 h-4" />
                            </button>
                        </div>

                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove(item.product_id || item.id); }}
                            className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 transition-all"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" /></svg>
                        </button>
                    </div>
                </div>

                {/* Row 2: Price and Stock in one line to save height */}
                <div className="flex items-center gap-3 text-[11px]">
                    <div className="text-primary font-bold">
                        {new Intl.NumberFormat('vi-VN').format(item.price)}đ
                    </div>
                    <div className="flex items-center gap-1 text-green-600 font-bold opacity-80">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Tồn: {stockQuantity}
                    </div>
                </div>

                {/* Row 3: Item total price (Optional: keep small) */}
                <div className="flex justify-end mt-0.5">
                    <div className="text-primary font-black text-[13px] opacity-90">
                        {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}đ
                    </div>
                </div>
            </div>
        </div>
    )
}

