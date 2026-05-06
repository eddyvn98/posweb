import { useState } from 'react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { voidSaleLocal } from '../lib/db'
import { Trash2, AlertTriangle, Info, Check, ArrowRight, ArrowLeft } from './Icons'

export default function VoidModal({ sale, onClose, onVoidSuccess }) {
    const { isGuest } = useAuth()
    const [loading, setLoading] = useState(false)
    const [reason, setReason] = useState('')
    const [step, setStep] = useState('confirm') // confirm, reason, success

    const voidReasons = [
        'Bán nhầm',
        'Khách hàng yêu cầu',
        'Lỗi giá',
        'Hệ thống lỗi',
        'Khác'
    ]

    const handleVoid = async () => {
        if (!reason.trim()) {
            alert('Vui lòng chọn hoặc nhập lý do huỷ phiếu')
            return
        }

        setLoading(true)
        try {
            // Re-fetch sale from local DB to get latest sync status and server ID
            const { initDB } = await import('../lib/db')
            const db = await initDB()
            const latestSale = await db.get('sales_queue', sale.local_id)
            const activeSale = latestSale || sale

            if (isGuest || activeSale.synced === 0) {
                // Local void only
                await voidSaleLocal(activeSale.local_id, reason)
            } else {
                // API void
                if (!activeSale.id) {
                    throw new Error('Không tìm thấy ID đơn hàng trên hệ thống để huỷ. Vui lòng liên hệ hỗ trợ.')
                }
                await api.post(`/sales/${activeSale.id}/void`, {
                    reason: reason
                })
                // Also update local for immediate feedback
                await voidSaleLocal(activeSale.local_id, reason)
            }



            setStep('success')
            setTimeout(() => {
                onVoidSuccess?.(sale)
                onClose()
            }, 2000)
        } catch (err) {
            console.error('Error voiding sale:', err)
            alert('❌ Lỗi khi huỷ phiếu: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const isOldSale = sale.synced === 1
    const isAlreadyVoided = sale.is_void

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up">
                {/* Header */}
                <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-red-700" />
                    <h2 className="text-lg font-black text-red-700">Huỷ phiếu bán</h2>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {isAlreadyVoided ? (
                        // Already voided
                        <div className="space-y-3">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-sm font-bold text-yellow-800 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Phiếu này đã bị huỷ
                                </p>
                                <p className="text-xs text-yellow-700 mt-2">
                                    <strong>Lý do:</strong> {sale.void_reason}
                                </p>
                                {sale.void_at && (
                                    <p className="text-xs text-yellow-700 mt-1">
                                        <strong>Ngày huỷ:</strong> {new Date(sale.void_at).toLocaleString('vi-VN')}
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : step === 'confirm' ? (
                        // Confirm step
                        <div className="space-y-4">
                            {!isOldSale && (
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
                                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                                        Phiếu chưa đồng bộ. Huỷ phiếu lúc này sẽ cập nhật dữ liệu cục bộ ngay lập tức.
                                    </p>
                                </div>
                            )}
                            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                                <p className="text-sm font-bold text-red-700">Xác nhận huỷ phiếu?</p>
                                <p className="text-xs text-red-600 mt-2">
                                    Mã: <strong>{sale.code || 'Phiếu tạm'}</strong>
                                </p>
                                <p className="text-xs text-red-600">
                                    Tổng: <strong>{new Intl.NumberFormat('vi-VN').format(sale.total_amount)} đ</strong>
                                </p>
                                <p className="text-xs text-red-600 mt-3">
                                    ⚠️ <strong>Không thể hoàn tác!</strong> Phiếu sẽ được đánh dấu là huỷ trong hệ thống.
                                </p>
                            </div>
                            <button
                                onClick={() => setStep('reason')}
                                className="w-full h-12 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 transition flex items-center justify-center gap-2"
                            >
                                Tiếp tục <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    ) : step === 'reason' ? (
                        // Reason step
                        <div className="space-y-4">
                            <p className="text-sm font-bold text-gray-700">Chọn lý do huỷ phiếu:</p>
                            <div className="grid grid-cols-1 gap-2">
                                {voidReasons.map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setReason(r)}
                                        className={`w-full p-3 rounded-xl border-2 font-bold text-sm transition text-left flex items-center justify-between ${reason === r
                                                ? 'bg-red-50 border-red-500 text-red-700'
                                                : 'bg-white border-gray-100 text-gray-700 hover:border-red-200'
                                            }`}
                                    >
                                        {r}
                                        {reason === r && <Check className="w-4 h-4" />}
                                    </button>
                                ))}
                            </div>
                            {reason === 'Khác' && (
                                <input
                                    type="text"
                                    placeholder="Nhập lý do khác..."
                                    className="w-full p-4 bg-gray-50 border-0 rounded-xl font-bold text-sm focus:ring-2 focus:ring-red-500 outline-none"
                                    onChange={(e) => setReason(e.target.value)}
                                    autoFocus
                                />
                            )}
                            <button
                                onClick={handleVoid}
                                disabled={loading || !reason.trim()}
                                className="w-full h-14 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 disabled:opacity-30 transition flex items-center justify-center gap-2 shadow-lg shadow-red-900/10"
                            >
                                {loading ? 'Đang xử lý...' : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        <span>Xác nhận huỷ phiếu</span>
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        // Success step
                        <div className="text-center space-y-4 py-4">
                            <div className="flex justify-center">
                                <div className="bg-green-100 p-4 rounded-full animate-bounce">
                                    <Check className="w-12 h-12 text-green-600" />
                                </div>
                            </div>
                            <p className="text-lg font-black text-green-700">Huỷ phiếu thành công!</p>
                            <p className="text-sm text-gray-600">
                                Phiếu đã được đánh dấu là huỷ. Doanh thu sẽ tự động điều chỉnh.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t flex gap-3">
                    {step !== 'success' && (
                        <>
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 btn bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                            >
                                {step === 'confirm' ? 'Quay lại' : 'Huỷ'}
                            </button>
                            {step === 'reason' && (
                                <button
                                    onClick={() => setStep('confirm')}
                                    className="flex-1 btn bg-gray-300 text-gray-700 hover:bg-gray-400 flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Quay lại
                                </button>
                            )}
                        </>
                    )}
                    {step === 'success' && (
                        <button
                            onClick={onClose}
                            className="flex-1 btn btn-primary"
                        >
                            Đóng
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
