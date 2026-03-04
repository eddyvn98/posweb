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
            name: name || 'Khach le',
            unit: 'Cái',
            price: Number(price),
            sku: 'QUICK',
            barcode: `QUICK-${Date.now().toString().slice(-6)}`,
            stock_quantity: 9999,
            is_active: true,
            created_at: new Date().toISOString()
        }

        if (saveToCatalog) {
            try {
                await saveProductLocal({
                    ...customItem,
                    stock_quantity: 0
                })
            } catch (err) {
                console.error('Failed to save to catalog', err)
            }
        }

        for (let i = 0; i < quantity; i++) {
            onAddToCart(customItem)
        }

        onClose()
    }

    const handlePriceBlur = (e) => {
        const val = Number(e.target.value)
        if (val > 0 && val < 1000) {
            setPrice(val * 1000)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-fade-in-up">
                <form onSubmit={handleSubmit}>
                    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
                        <h3 className="flex items-center gap-2 text-3xl font-extrabold leading-none text-gray-800">
                            <span className="text-orange-500">⚡</span>
                            Ban Nhanh
                        </h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-9 w-9 items-center justify-center rounded-full text-2xl font-bold text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                        >
                            &times;
                        </button>
                    </div>

                    <div className="space-y-5 px-6 py-5">
                        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                            <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-orange-700">
                                Gia ban (Nhap 50 tuong duong 50.000)
                            </label>
                            <div className="relative">
                                <input
                                    autoFocus
                                    type="number"
                                    className="block w-full border-none bg-transparent p-0 text-5xl font-extrabold leading-none text-primary placeholder:text-gray-300 focus:ring-0"
                                    placeholder="0"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    onBlur={handlePriceBlur}
                                    required
                                />
                                <span className="absolute bottom-1 right-0 text-2xl font-bold text-gray-400">đ</span>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-gray-600">Ten san pham</label>
                            <input
                                type="text"
                                className="input h-14 w-full border-gray-200 bg-gray-50 text-xl transition-all focus:bg-white"
                                placeholder="Ghi chu mon hang..."
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold uppercase tracking-wide text-gray-600">So luong</label>
                            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-100 p-1.5">
                                <button
                                    type="button"
                                    className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-white text-2xl font-bold transition-all active:scale-95"
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                >
                                    −
                                </button>
                                <span className="w-10 text-center text-2xl font-extrabold text-gray-800">{quantity}</span>
                                <button
                                    type="button"
                                    className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-white text-2xl font-bold transition-all active:scale-95"
                                    onClick={() => setQuantity(q => q + 1)}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-1">
                            <input
                                type="checkbox"
                                id="saveToCatalog"
                                checked={saveToCatalog}
                                onChange={e => setSaveToCatalog(e.target.checked)}
                                className="h-5 w-5 cursor-pointer rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="saveToCatalog" className="cursor-pointer select-none text-base font-semibold text-gray-700">
                                Luu vao danh muc san pham?
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-14 flex-1 rounded-xl text-xl font-bold text-gray-600 transition-colors hover:bg-gray-200"
                        >
                            Huy
                        </button>
                        <button type="submit" className="btn-primary h-14 flex-[1.4] text-xl shadow-lg">
                            THEM VAO GIO
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
