import { useState, useEffect, useMemo } from 'react'
import { saveOfflineSale } from '../lib/db'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'
import { Banknote, Landmark } from 'lucide-react'
import SmartPriceInput from './Common/SmartPriceInput'

export default function CheckoutModal({ cart, totalAmount, onClose, onFinish }) {
    const { shop } = useAuth()
    const { pushSales } = useSync() // To trigger immediate sync if online
    const [loading, setLoading] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState('cash')
    const [cashGiven, setCashGiven] = useState(totalAmount)

    const parsedCashGiven = useMemo(() => {
        if (cashGiven === '' || cashGiven === null || cashGiven === undefined) return totalAmount
        let num = Number(String(cashGiven).replace(',', '.'))
        if (isNaN(num)) return totalAmount
        if (num > 0 && num < 1000) num = num * 1000
        return num
    }, [cashGiven, totalAmount])

    const changeAmount = parsedCashGiven - totalAmount

    // Quick denomination suggestions based on total amount
    const quickSuggestions = useMemo(() => {
        const standardNotes = [10000, 20000, 50000, 100000, 200000, 500000]
        const list = standardNotes.filter(note => note > totalAmount)
        
        // Add nearest round ceiling (e.g. 178k -> 180k or 200k) if not present
        const nextTenK = Math.ceil(totalAmount / 10000) * 10000
        if (nextTenK > totalAmount && !list.includes(nextTenK)) {
            list.unshift(nextTenK)
        }
        const nextFiftyK = Math.ceil(totalAmount / 50000) * 50000
        if (nextFiftyK > totalAmount && !list.includes(nextFiftyK)) {
            list.unshift(nextFiftyK)
        }
        
        // Sort and deduplicate
        return Array.from(new Set(list)).sort((a, b) => a - b).slice(0, 4)
    }, [totalAmount])

    const handleCheckout = async () => {
        if (loading) return
        setLoading(true)
        try {
            // 1. Prepare Sale Data
            const now = new Date()
            // Convert to GMT+7 for local_date (YYYY-MM-DD)
            const gmt7Date = new Date(now.getTime() + (7 * 60 * 60 * 1000))
            const localDate = gmt7Date.toISOString().split('T')[0]
            
            const saleData = {
                shop_id: shop?.id,
                code: `HD-${Math.floor(Date.now() / 1000).toString().slice(-6)}`, // Temporary Code
                total_amount: totalAmount,
                payment_method: paymentMethod,
                cash_given: paymentMethod === 'cash' ? parsedCashGiven : totalAmount,
                change_amount: paymentMethod === 'cash' ? Math.max(0, changeAmount) : 0,
                sale_date: now.toISOString(),
                sale_local_date: localDate, // GMT+7 date for reporting
                items: cart.map(item => ({
                    product_id: item.product_id,
                    product_name: item.name,
                    quantity: item.quantity,
                    price: item.price
                }))
            }

            // 2. Save to Offline DB
            await saveOfflineSale(saleData)

            // 3. Try to sync immediately (Fire & Forget)
            if (navigator.onLine) {
                pushSales()
            }

            onFinish(saleData)

        } catch (error) {
            console.error(error)
            alert('Lỗi thanh toán: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const handleKeyDown = (e) => {
            const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable

            if (e.key === 'Enter') {
                e.preventDefault()
                handleCheckout()
                return
            }
            if (e.key === 'Escape') {
                e.preventDefault()
                if (!loading) onClose()
                return
            }

            // Do NOT trigger single key shortcuts if user is typing in an input
            if (isInput) return

            if (e.key === '1' || e.code === 'Numpad1') {
                e.preventDefault()
                setPaymentMethod('cash')
            } else if (e.key === '2' || e.code === 'Numpad2') {
                e.preventDefault()
                setPaymentMethod('transfer')
            } else if (
                e.key === 'ArrowLeft' ||
                e.key === 'ArrowRight' ||
                e.key === 'ArrowUp' ||
                e.key === 'ArrowDown'
            ) {
                e.preventDefault()
                setPaymentMethod(prev => (prev === 'cash' ? 'transfer' : 'cash'))
            } else if (e.key === 'Backspace') {
                e.preventDefault()
                if (!loading) {
                    onClose()
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [loading, paymentMethod, totalAmount, cart, shop, parsedCashGiven])

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    handleCheckout()
                }}
                className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up"
            >
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-900 text-center">Xác nhận thanh toán</h2>
                </div>

                <div className="p-4 space-y-4">
                    {/* Total */}
                    <div className="text-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng tiền phải thu</div>
                        <div className="text-3xl font-black text-primary font-mono mt-0.5">
                            {new Intl.NumberFormat('vi-VN').format(totalAmount)} <span className="text-lg font-bold">đ</span>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('cash')}
                            className={`p-3 rounded-xl border text-center transition-all flex items-center justify-center gap-2 font-bold ${paymentMethod === 'cash' ? 'bg-sky-50 border-primary text-primary shadow-sm' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Banknote className="w-4 h-4" /> Tiền mặt
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('transfer')}
                            className={`p-3 rounded-xl border text-center transition-all flex items-center justify-center gap-2 font-bold ${paymentMethod === 'transfer' ? 'bg-sky-50 border-primary text-primary shadow-sm' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Landmark className="w-4 h-4" /> Chuyển khoản
                        </button>
                    </div>

                    {/* Cash Details */}
                    {paymentMethod === 'cash' && (
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Tiền khách đưa</label>
                                    {cashGiven !== totalAmount && (
                                        <button
                                            type="button"
                                            onClick={() => setCashGiven(totalAmount)}
                                            className="text-[11px] text-primary hover:underline font-bold"
                                        >
                                            Đặt lại
                                        </button>
                                    )}
                                </div>
                                <SmartPriceInput
                                    value={cashGiven}
                                    onChange={(e) => setCashGiven(e.target.value)}
                                    onBlur={() => {
                                        let num = Number(String(cashGiven).replace(',', '.'))
                                        if (num > 0 && num < 1000) setCashGiven(num * 1000)
                                    }}
                                    placeholder={new Intl.NumberFormat('vi-VN').format(totalAmount)}
                                    className="input w-full px-3 h-11 border border-slate-300 focus-within:border-primary font-mono text-xl font-bold text-gray-900 rounded-xl"
                                    inputClassName="text-xl font-bold font-mono text-gray-900"
                                />
                            </div>

                            {/* Quick suggestion buttons */}
                            <div className="flex flex-wrap gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setCashGiven(totalAmount)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${parsedCashGiven === totalAmount ? 'bg-primary text-white border-primary shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                                >
                                    Vừa đủ
                                </button>
                                {quickSuggestions.map(val => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setCashGiven(val)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${parsedCashGiven === val ? 'bg-primary text-white border-primary shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                                    >
                                        {new Intl.NumberFormat('vi-VN').format(val)} đ
                                    </button>
                                ))}
                            </div>

                            {/* Change result */}
                            <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${changeAmount >= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                                <span className="text-xs font-bold uppercase tracking-wide">
                                    {changeAmount >= 0 ? 'Tiền thừa trả khách' : 'Còn thiếu'}
                                </span>
                                <span className="text-xl font-black font-mono">
                                    {new Intl.NumberFormat('vi-VN').format(Math.abs(changeAmount))} đ
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 btn-secondary btn-lg font-bold"
                    >
                        Quay lại
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 btn-success btn-lg font-bold"
                    >
                        {loading ? 'Đang xử lý...' : 'Hoàn tất thanh toán'}
                    </button>
                </div>
            </form>
        </div>
    )
}
