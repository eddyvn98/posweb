export default function PriceStockSection({ price, costPrice, stockQuantity, onChange, onPriceBlur }) {
    const quantityOptions = [20, 50, 100]

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Giá bán *</label>
                    <input
                        type="number" required min="0" step="1" inputMode="numeric"
                        className="input w-full font-mono text-lg font-bold text-primary p-2 h-11"
                        value={price}
                        onChange={(e) => onChange('price', e.target.value)}
                        onBlur={(e) => onPriceBlur('price', e.target.value)}
                        placeholder="0"
                    />
                    <div className="text-[10px] text-gray-500 mt-1">
                        {Number(price) > 0 ? new Intl.NumberFormat('vi-VN').format(price) : '0'} đ
                    </div>
                </div>
                <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Giá vốn</label>
                    <input
                        type="number" min="0" step="1" inputMode="numeric"
                        className="input w-full p-2 h-11"
                        value={costPrice}
                        onChange={(e) => onChange('cost_price', e.target.value)}
                        onBlur={(e) => onPriceBlur('cost_price', e.target.value)}
                    />
                </div>
            </div>

            <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tồn kho ban đầu</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {quantityOptions.map(qty => (
                        <button
                            key={qty}
                            type="button"
                            onClick={() => onChange('stock_quantity', qty)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${Number(stockQuantity) === qty ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {qty}
                        </button>
                    ))}
                </div>
                <input
                    type="number" required
                    className="input w-full p-2 h-11"
                    value={stockQuantity}
                    onChange={(e) => onChange('stock_quantity', e.target.value)}
                />
            </div>
        </div>
    )
}
