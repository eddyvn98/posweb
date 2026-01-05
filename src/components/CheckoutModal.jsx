import { useState } from 'react'
import { saveOfflineSale } from '../lib/db'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'

export default function CheckoutModal({ cart, totalAmount, onClose, onFinish }) {
    const { shop } = useAuth()
    const { pushSales } = useSync() // To trigger immediate sync if online
    const [loading, setLoading] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState('cash')

    const handleCheckout = async () => {
        setLoading(true)
        try {
            // 1. Prepare Sale Data
            const now = new Date()
            // Convert to GMT+7 for local_date (YYYY-MM-DD)
            const gmt7Date = new Date(now.getTime() + (7 * 60 * 60 * 1000))
            const localDate = gmt7Date.toISOString().split('T')[0]
            
            const saleData = {
                shop_id: shop.id,
                code: `HD-${Math.floor(Date.now() / 1000).toString().slice(-6)}`, // Temporary Code
                total_amount: totalAmount,
                payment_method: paymentMethod,
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

            // alert(`Thanh toán thành công!\nMã: ${saleData.code}\nTổng: ${totalAmount.toLocaleString()}đ`)
            onFinish(saleData)

        } catch (error) {
            console.error(error)
            alert('Lỗi thanh toán: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-xl overflow-hidden shadow-2xl animate-fade-in-up">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-bold text-center">Xác nhận thanh toán</h2>
                </div>

                <div className="p-4 space-y-4">
                    {/* Total */}
                    <div className="text-center">
                        <div className="text-sm text-text-muted">Tổng tiền phải thu</div>
                        <div className="text-3xl font-bold text-primary">
                            {new Intl.NumberFormat('vi-VN').format(totalAmount)}
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setPaymentMethod('cash')}
                            className={`p-3 rounded-lg border text-center transition-colors ${paymentMethod === 'cash' ? 'bg-pink-50 border-primary text-primary font-bold' : 'border-gray-200'}`}
                        >
                            💵 Tiền mặt
                        </button>
                        <button
                            onClick={() => setPaymentMethod('transfer')}
                            className={`p-3 rounded-lg border text-center transition-colors ${paymentMethod === 'transfer' ? 'bg-pink-50 border-primary text-primary font-bold' : 'border-gray-200'}`}
                        >
                            🏦 Chuyển khoản
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 btn bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                        Quay lại
                    </button>
                    <button
                        onClick={handleCheckout}
                        disabled={loading}
                        className="flex-1 btn-primary"
                    >
                        {loading ? 'Đang xử lý...' : 'HOÀN TẤT'}
                    </button>
                </div>
            </div>
        </div>
    )
}
