export default function CartItem({ item, onUpdateQty, onRemove }) {
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
        <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0 group">
            <div className="flex-1 pr-4">
                <div className="font-bold text-sm text-gray-800 line-clamp-1 mb-0.5">
                    {item.name}
                </div>
                <div className="text-xs text-gray-400 font-mono">
                    {new Intl.NumberFormat('vi-VN').format(item.price)} đ
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Quantity Controls */}
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-9 bg-gray-50/50 shadow-sm">
                    <button
                        onClick={() => handleUpdate(-1)}
                        className="w-10 h-full flex items-center justify-center text-lg hover:bg-white active:bg-gray-200 transition-colors text-gray-500"
                    >
                        −
                    </button>
                    <div className="w-8 h-full flex items-center justify-center text-sm font-bold text-primary select-none">
                        {item.quantity}
                    </div>
                    <button
                        onClick={() => handleUpdate(1)}
                        className="w-10 h-full flex items-center justify-center text-lg hover:bg-white active:bg-gray-200 transition-colors text-gray-500"
                    >
                        +
                    </button>
                </div>

                {/* Total & Remove */}
                <div className="min-w-[80px] text-right">
                    <div className="font-bold text-sm text-primary">
                        {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}
                    </div>
                </div>

                <button
                    onClick={() => onRemove(item.product_id || item.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                >
                    ✕
                </button>
            </div>
        </div>
    )
}
