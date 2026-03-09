export default function CartItem({ item, onUpdateQty, onSetQty, onRemove }) {
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
        <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 group gap-2">
            {/* Thumbnail */}
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-base">📦</div>
                )}
            </div>

            {/* Left side: Name and unit details - Compact */}
            <div className="flex-1 min-w-0 pr-1">
                <div className="font-bold text-sm text-gray-800 leading-tight truncate-2-lines break-words">
                    {item.name}
                </div>
                <div className="text-[10px] text-gray-400 font-medium leading-none mt-0.5">
                    {new Intl.NumberFormat('vi-VN').format(item.price)}đ
                </div>
            </div>

            {/* Right side: Everything else in a single compact row */}
            <div className="flex items-center gap-2 shrink-0">
                {/* Quantity Controls - Compact h-7 */}
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-7 bg-white shadow-sm">
                    <button
                        onClick={() => handleUpdate(-1)}
                        className="w-6 h-full flex items-center justify-center text-sm active:bg-gray-100 text-gray-400"
                    >
                        −
                    </button>
                    <input
                        type="text"
                        inputMode="numeric"
                        className="w-7 h-full text-center text-xs font-black text-primary bg-transparent border-0 focus:ring-0 p-0 outline-none"
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
                        className="w-6 h-full flex items-center justify-center text-sm active:bg-gray-100 text-gray-400"
                    >
                        +
                    </button>
                </div>

                {/* Total Price - Bold & Primary */}
                <div className="min-w-[55px] text-right font-black text-sm text-primary leading-none">
                    {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}
                </div>

                {/* Delete - Minimal */}
                <button
                    onClick={() => onRemove(item.product_id || item.id)}
                    className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 transition-all opacity-40 group-hover:opacity-100"
                >
                    <span className="text-sm">✕</span>
                </button>
            </div>
        </div>
    )
}
