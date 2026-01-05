import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '../contexts/AuthContext'
import { saveProductLocal } from '../lib/db'

export default function QuickSaleModal({ onClose, onAddToCart }) {
    const { shop } = useAuth()
    const [price, setPrice] = useState('')
    const [name, setName] = useState('')
    const [quantity, setQuantity] = useState(1)
    const [saveToCatalog, setSaveToCatalog] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!price) return

        const itemId = uuidv4()
        const customItem = {
            id: itemId,
            shop_id: shop.id,
            name: name || 'Khách lẻ',
            price: Number(price),
            sku: 'QUICK',
            barcode: `QUICK-${Date.now().toString().slice(-6)}`,
            stock_quantity: 9999,
            is_active: true,
            created_at: new Date().toISOString()
        }

        // 1. If user wants to save to catalog
        if (saveToCatalog) {
            try {
                await saveProductLocal({
                    ...customItem,
                    stock_quantity: 0 // Default to 0 if saving to catalog from quick sale
                })
            } catch (err) {
                console.error("Failed to save to catalog", err)
            }
        }

        // 2. Add to cart
        for (let i = 0; i < quantity; i++) {
            onAddToCart(customItem)
        }

        onClose()
    }

    const handlePriceBlur = (e) => {
        let val = Number(e.target.value)
        if (val > 0 && val < 1000) {
            setPrice(val * 1000)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                <form onSubmit={handleSubmit}>
                    <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="font-black text-xl text-gray-800 flex items-center gap-2">
                            <span className="text-orange-500">⚡</span> Bán Nhanh
                        </h3>
                        <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-gray-400 font-bold text-xl">&times;</button>
                    </div>

                    <div className="p-6 space-y-5">
                        <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                            <label className="block text-xs font-black text-orange-600 uppercase mb-2 tracking-wider">Giá bán (Nhập 50 tương đương 50.000)</label>
                            <div className="relative">
                                <input
                                    autoFocus
                                    type="number"
                                    className="block w-full bg-transparent border-none p-0 text-4xl font-black text-primary placeholder:opacity-20 focus:ring-0"
                                    placeholder="0"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    onBlur={handlePriceBlur}
                                    required
                                />
                                <span className="absolute right-0 bottom-1 text-xl font-bold text-gray-400">đ</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-wider">Tên sản phẩm</label>
                            <input
                                type="text"
                                className="input w-full bg-gray-50 border-gray-200 focus:bg-white transition-all py-3"
                                placeholder="Ghi chú món hàng..."
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-between items-center">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Số lượng</label>
                            <div className="flex items-center gap-4 bg-gray-100 p-1 rounded-xl">
                                <button type="button" className="w-10 h-10 flex items-center justify-center rounded-lg bg-white shadow-sm font-bold text-xl active:scale-90 transition-all" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                                <span className="font-black text-xl w-8 text-center text-gray-800">{quantity}</span>
                                <button type="button" className="w-10 h-10 flex items-center justify-center rounded-lg bg-white shadow-sm font-bold text-xl active:scale-90 transition-all" onClick={() => setQuantity(q => q + 1)}>+</button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-1">
                            <input
                                type="checkbox"
                                id="saveToCatalog"
                                checked={saveToCatalog}
                                onChange={e => setSaveToCatalog(e.target.checked)}
                                className="w-5 h-5 text-primary rounded-lg border-gray-300 focus:ring-primary cursor-pointer"
                            />
                            <label htmlFor="saveToCatalog" className="text-sm font-medium text-gray-600 cursor-pointer select-none">
                                Lưu vào danh mục sản phẩm?
                            </label>
                        </div>
                    </div>

                    <div className="p-5 border-t bg-gray-50 flex gap-4">
                        <button type="button" onClick={onClose} className="flex-1 py-4 px-6 rounded-xl font-bold text-gray-400 hover:text-gray-600 transition-colors">Hủy</button>
                        <button type="submit" className="flex-[2] btn-primary py-4 shadow-orange-200 shadow-xl">THÊM VÀO GIỎ</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
