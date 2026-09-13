import SmartPriceInput from '../Common/SmartPriceInput'

export default function PriceStockSection({ price, onlinePrice, promoPrice, costPrice, stockQuantity, onChange, onPriceBlur }) {
    const quantityOptions = [20, 50, 100]

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Giá offline *</label>
                    <SmartPriceInput
                        required min="0" step="1"
                        className="input w-full font-mono text-lg font-bold text-primary px-3 h-11"
                        inputClassName="text-lg font-bold text-primary font-mono"
                        suffixClassName="text-lg font-bold text-primary/45 font-mono"
                        value={price}
                        onChange={(e) => onChange('price', e.target.value)}
                        onBlur={(e) => onPriceBlur('price', e.target.value)}
                        placeholder="0"
                    />
                    <div className="text-[10px] font-bold text-primary mt-1">
                        {Number(price) > 0 ? new Intl.NumberFormat('vi-VN').format(Number(price) < 1000 ? Number(price) * 1000 : price) : '0'} đ
                    </div>
                </div>
                <div>
                    <label className="block text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">Giá online</label>
                    <SmartPriceInput
                        min="0" step="1"
                        className="input w-full font-mono text-lg font-bold text-blue-600 px-3 h-11"
                        inputClassName="text-lg font-bold text-blue-600 font-mono"
                        suffixClassName="text-lg font-bold text-blue-400/50 font-mono"
                        value={onlinePrice}
                        onChange={(e) => onChange('online_price', e.target.value)}
                        onBlur={(e) => onPriceBlur('online_price', e.target.value)}
                        placeholder="Dùng giá offline"
                    />
                    <div className="text-[10px] font-bold text-blue-600 mt-1">
                        {Number(onlinePrice) > 0
                            ? `${new Intl.NumberFormat('vi-VN').format(Number(onlinePrice) < 1000 ? Number(onlinePrice) * 1000 : onlinePrice)} đ`
                            : 'Để trống = dùng giá offline'}
                    </div>
                </div>
                <div>
                    <label className="block text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Giá KM online</label>
                    <SmartPriceInput
                        min="0" step="1"
                        className="input w-full font-mono text-lg font-bold text-emerald-600 px-3 h-11"
                        inputClassName="text-lg font-bold text-emerald-600 font-mono"
                        suffixClassName="text-lg font-bold text-emerald-400/50 font-mono"
                        value={promoPrice}
                        onChange={(e) => onChange('promo_price', e.target.value)}
                        onBlur={(e) => onPriceBlur('promo_price', e.target.value)}
                        placeholder="Không giảm"
                    />
                    <div className="text-[10px] font-bold text-emerald-600 mt-1">
                        {Number(promoPrice) > 0
                            ? `${new Intl.NumberFormat('vi-VN').format(Number(promoPrice) < 1000 ? Number(promoPrice) * 1000 : promoPrice)} đ`
                            : 'Thấp hơn giá online để hiện gạch ngang'}
                    </div>
                </div>
                <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Giá vốn</label>
                    <SmartPriceInput
                        min="0" step="1"
                        className="input w-full font-mono text-base font-bold text-gray-800 px-3 h-11"
                        inputClassName="text-base font-bold text-gray-800 font-mono"
                        suffixClassName="text-base font-bold text-gray-400/60 font-mono"
                        value={costPrice}
                        onChange={(e) => onChange('cost_price', e.target.value)}
                        onBlur={(e) => onPriceBlur('cost_price', e.target.value)}
                        placeholder="0"
                    />
                    <div className="text-[10px] font-bold text-gray-500 mt-1">
                        {Number(costPrice) > 0 ? new Intl.NumberFormat('vi-VN').format(Number(costPrice) < 1000 ? Number(costPrice) * 1000 : costPrice) : '0'} đ
                    </div>
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
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => e.target.select()}
                />
            </div>
        </div>
    )
}
