import { useState, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '../contexts/AuthContext'
import { saveProductLocal } from '../lib/db'
import SmartPriceInput from './Common/SmartPriceInput'
import { Zap } from 'lucide-react'

export default function QuickSaleModal({ onClose, onAddToCart, presetBarcode = '', presetName = '' }) {
    const { shop } = useAuth()
    const [step, setStep] = useState(1) // 1: Price, 2: Note, 3: Quantity
    const [price, setPrice] = useState('')
    const [name, setName] = useState(presetName)
    const [quantity, setQuantity] = useState(1)
    const [saveToCatalog, setSaveToCatalog] = useState(true)

    const priceInputRef = useRef(null)
    const nameInputRef = useRef(null)
    const qtyInputRef = useRef(null)

    useEffect(() => {
        if (step === 1) priceInputRef.current?.focus()
        if (step === 2) nameInputRef.current?.focus()
        if (step === 3) qtyInputRef.current?.focus()
    }, [step])

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault()
                onClose()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose])

    const formatNumber = (val) => {
        if (!val) return ''
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    }

    const parseNumber = (val) => {
        return val.toString().replace(/\./g, "")
    }

    const handlePriceChange = (e) => {
        const raw = parseNumber(e.target.value)
        if (/^\d*$/.test(raw)) {
            setPrice(raw)
        }
    }

    const multiplyPrice = (factor) => {
        const current = Number(price) || 0
        setPrice((current * factor).toString())
    }

    const nextStep = (e) => {
        if (e) e.preventDefault()
        if (step === 1 && price) {
            const num = Number(price)
            if (num > 0 && num < 1000) {
                setPrice((num * 1000).toString())
            }
            setStep(2)
        }
        else if (step === 2) setStep(3)
        else if (step === 3) handleSubmit()
    }

    const handleSubmit = async (e) => {
        if (e) e.preventDefault()
        if (!price) return

        const itemId = uuidv4()
        const rawPrice = Number(price)
        const actualPrice = rawPrice > 0 && rawPrice < 1000 ? rawPrice * 1000 : rawPrice
        const customItem = {
            id: itemId,
            shop_id: shop.id,
            name: name || 'Khách lẻ',
            unit: 'Cái',
            price: actualPrice,
            sku: 'QUICK',
            barcode: presetBarcode || `QUICK-${Date.now().toString().slice(-6)}`,
            stock_quantity: 9999,
            is_active: true,
            created_at: new Date().toISOString()
        }

        if (saveToCatalog) {
            try {
                await saveProductLocal({ ...customItem, stock_quantity: 0 })
            } catch (err) {
                console.error(err)
            }
        }

        for (let i = 0; i < quantity; i++) {
            onAddToCart(customItem)
        }
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-[24px] bg-white shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-5 py-3.5 bg-white">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                        <Zap className="w-5 h-5 text-amber-500" /> Bán nhanh
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-lg text-gray-400 hover:text-red-500 transition-colors bg-gray-50 h-8 w-8 rounded-full flex items-center justify-center"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Step 1: Price */}
                    <div className={`${step >= 1 ? 'block' : 'hidden'} space-y-2`}>
                        <label className="block text-[9px] font-black uppercase text-primary/60 tracking-[0.2em]">GIÁ BÁN</label>
                        <div className="relative border-b-2 border-primary/10 focus-within:border-primary transition-all py-2 flex items-center justify-center">
                            <SmartPriceInput
                                inputRef={priceInputRef}
                                className="text-3xl font-black text-primary justify-center"
                                inputClassName="text-3xl font-black text-primary font-mono text-center"
                                suffixClassName="text-3xl font-black text-primary/45 font-mono"
                                placeholder="0"
                                value={price}
                                onChange={handlePriceChange}
                                onKeyDown={e => e.key === 'Enter' && nextStep()}
                                required
                            />
                            <span className="ml-1 text-lg font-black text-primary/30">đ</span>
                        </div>
                        {Number(price) > 0 && (
                            <div className="text-center text-xs font-bold text-primary">
                                = {formatNumber(Number(price) < 1000 ? Number(price) * 1000 : Number(price))} đ
                            </div>
                        )}

                        {step === 1 && (
                            <div className="flex gap-2 animate-in slide-in-from-top-2 duration-300">
                                {[1000, 10000, 100000].map(f => (
                                    <button
                                        key={f}
                                        type="button"
                                        onClick={() => multiplyPrice(f)}
                                        className="flex-1 py-2 bg-gray-50/50 hover:bg-primary hover:text-white rounded-xl text-[10px] font-bold border border-gray-100 transition-all active:scale-95 text-gray-600"
                                    >
                                        x{formatNumber(f)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Step 2: Note */}
                    <div className={`${step >= 2 ? 'block animate-in slide-in-from-top-4 duration-300' : 'hidden'} space-y-2`}>
                        <label className="block text-[9px] font-black uppercase text-gray-400 tracking-[0.2em]">Tên SP / Ghi chú</label>
                        <input
                            ref={nameInputRef}
                            type="text"
                            className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-transparent focus:border-primary/20 focus:bg-white focus:ring-0 text-sm transition-all"
                            placeholder="Mặc định: Khách lẻ..."
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onFocus={(e) => e.target.select()}
                            onClick={(e) => e.target.select()}
                            onKeyDown={e => e.key === 'Enter' && nextStep()}
                        />
                        {presetBarcode && (
                            <div className="text-[10px] text-gray-400 font-mono">Mã quét: {presetBarcode}</div>
                        )}
                    </div>

                    {/* Step 3: Quantity */}
                    <div className={`${step >= 3 ? 'block animate-in slide-in-from-top-4 duration-300' : 'hidden'} space-y-2`}>
                        <label className="block text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] mb-1">Số lượng</label>
                        <div className="flex items-center justify-between gap-4 bg-gray-50 rounded-2xl p-2 border border-gray-100 focus-within:bg-white transition-all">
                            <button
                                type="button"
                                className="h-10 w-10 shrink-0 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl font-bold text-gray-400 hover:text-primary active:scale-90 transition-all border border-gray-100"
                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                            >
                                −
                            </button>
                            <input
                                ref={qtyInputRef}
                                type="text"
                                inputMode="numeric"
                                className="min-w-0 w-full text-center text-3xl font-black text-gray-800 border-0 bg-transparent focus:ring-0 p-0 outline-none"
                                value={quantity}
                                onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '')
                                    setQuantity(Math.max(1, parseInt(val) || 1))
                                }}
                                onFocus={(e) => e.target.select()}
                                onClick={(e) => e.target.select()}
                                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                            />
                            <button
                                type="button"
                                className="h-10 w-10 shrink-0 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl font-bold text-gray-400 hover:text-primary active:scale-90 transition-all border border-gray-100"
                                onClick={() => setQuantity(q => q + 1)}
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="flex items-center gap-3 pt-2 select-none">
                        <input
                            type="checkbox"
                            id="saveCatalog"
                            checked={saveToCatalog}
                            onChange={e => setSaveToCatalog(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                        />
                        <label htmlFor="saveCatalog" className="text-xs font-bold text-gray-500 cursor-pointer">Lưu vào danh mục</label>
                    </div>
                </div>

                {/* Footer Button */}
                <div className="p-5 pt-0 mt-auto">
                    <button
                        type="button"
                        onClick={nextStep}
                        className="btn-primary w-full h-14 text-[15px] font-black shadow-lg shadow-primary/10 hover:scale-[1.01] active:scale-95 transition-all uppercase tracking-widest rounded-2xl"
                    >
                        {step === 3 ? 'Xác nhận bán' : 'Tiếp tục (Enter)'}
                    </button>
                </div>
            </div>
        </div>
    )
}
