import { Package } from 'lucide-react'

export default function ProductCard({ product, onAdd }) {
    const hasStock = product.stock_quantity > 0

    return (
        <div
            onClick={() => onAdd(product)}
            className="group relative bg-white rounded-xl p-3 border border-slate-200 hover:border-sky-400 hover:shadow-md transition-all duration-150 cursor-pointer active:scale-[0.98] flex flex-col justify-between h-full select-none"
        >
            {/* Image Placeholder or Actual Image */}
            <div className="h-24 w-full bg-slate-50 rounded-lg mb-2.5 flex items-center justify-center overflow-hidden border border-slate-100 group-hover:bg-sky-50/30 transition-colors">
                {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <Package className="w-8 h-8 text-slate-300 group-hover:text-sky-400 transition-colors" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-sky-600 transition-colors">
                    {product.name}
                </h3>
                {product.barcode && (
                    <p className="text-[10px] text-slate-400 mt-1 font-mono truncate">
                        {product.barcode}
                    </p>
                )}
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    ĐV: {product.unit || 'Cái'}
                </p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="text-base font-bold text-slate-900 font-mono tabular-nums tracking-tight">
                    {new Intl.NumberFormat('vi-VN').format(product.price)}
                    <span className="text-xs font-normal text-slate-500 ml-0.5">đ</span>
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${hasStock ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                    {hasStock ? `Kho: ${product.stock_quantity}` : 'Hết hàng'}
                </span>
            </div>
        </div>
    )
}

