import { getProductImageUrl } from '../lib/imageUtils'
import { Package } from './Icons'

export default function ProductCard({ product, onAdd, hasVariants = false, variantCount = 0 }) {
    const hasStock = product.stock_quantity > 0

    return (
        <div
            onClick={() => onAdd(product)}
            className="card p-3 cursor-pointer hover:border-primary border transition-all active:scale-95 flex flex-col h-full bg-white shadow-sm hover:shadow-md"
        >
            {/* Image Placeholder or Actual Image */}
            <div className="relative aspect-square w-full bg-gray-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden border border-gray-100">
                {product.image_url ? (
                    <img src={getProductImageUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <Package className="w-10 h-10 opacity-20" />
                )}
                {hasVariants && (
                    <div className="absolute top-2 right-2 rounded-lg bg-primary px-2 py-1 text-[9px] font-black uppercase text-white shadow-lg shadow-primary/20">
                        {variantCount || ''} phiên bản
                    </div>
                )}
            </div>

            <div className="flex-1">
                <h3 className="font-bold text-sm text-gray-800 line-clamp-2 min-h-[2.5rem] leading-tight">
                    {product.name}
                </h3>
                <p className="text-[10px] text-gray-400 mt-1 font-mono">
                    {product.barcode}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">
                    ĐV: {product.unit || 'Cái'}
                </p>
                {hasVariants && (
                    <p className="mt-1 inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase text-primary">
                        Chọn phiên bản
                    </p>
                )}
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
