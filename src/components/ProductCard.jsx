export default function ProductCard({ product, onAdd }) {
    const hasStock = product.stock_quantity > 0

    return (
        <div
            onClick={() => onAdd(product)}
            className="card p-3 cursor-pointer hover:border-primary border transition-all active:scale-95 flex flex-col h-full bg-white shadow-sm hover:shadow-md"
        >
            {/* Image Placeholder or Actual Image */}
            <div className="h-24 w-full bg-gray-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden border border-gray-100">
                {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-3xl opacity-20">📦</span>
                )}
            </div>

            <div className="flex-1">
                <h3 className="font-bold text-sm text-gray-800 line-clamp-2 min-h-[2.5rem] leading-tight">
                    {product.name}
                </h3>
                <p className="text-[10px] text-gray-400 mt-1 font-mono">
                    {product.barcode}
                </p>
            </div>

            <div className="mt-3 flex justify-between items-end">
                <span className="text-base font-black text-primary">
                    {new Intl.NumberFormat('vi-VN').format(product.price)}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${hasStock ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {hasStock ? `Kho: ${product.stock_quantity}` : 'Hết hàng'}
                </span>
            </div>
        </div>
    )
}
