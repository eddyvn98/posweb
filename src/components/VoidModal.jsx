import { useState } from 'react'
import api from '../lib/api'
import { voidSaleInLocal } from '../lib/db'
import { useAuth } from '../contexts/AuthContext'
import { 
    Trash2, 
    AlertTriangle, 
    CheckCircle2, 
    Check, 
    Loader2 
} from 'lucide-react'

export default function VoidModal({ sale, onClose, onVoidSuccess }) {
    const { shop } = useAuth()
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
            // 1. Try remote API void if synced on backend
            if (sale.id && sale.synced === 1) {
                try {
                    await api.post(`/sales/${sale.id}/void`, {
                        reason: reason
                    })
                } catch (apiErr) {
                    console.warn('[VoidModal] API void failed, proceeding with local void:', apiErr)
                }
            }

            // 2. Always update local IndexedDB
            const identifier = sale.local_id || sale.id || sale.code
            if (identifier !== undefined) {
                await voidSaleInLocal(identifier, reason)
            }

            setStep('success')
            setTimeout(() => {
                onVoidSuccess?.(sale)
                onClose()
            }, 1500)
        } catch (err) {
            console.error('Error voiding sale:', err)
            alert('Lỗi khi huỷ phiếu: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const isAlreadyVoided = sale.is_void

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up">
                {/* Header */}
                <div className="bg-red-50 px-6 py-4 border-b border-red-100">
                    <h2 className="text-xl font-bold text-red-700 flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-red-600" /> Huỷ phiếu bán
                    </h2>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {isAlreadyVoided ? (
                        // Already voided
                        <div className="space-y-3">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-sm font-bold text-yellow-800 flex items-center gap-1">
                                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Phiếu này đã bị huỷ
                                </p>
                                <p className="text-xs text-yellow-700 mt-2">
                                    <strong>Lý do:</strong> {sale.void_reason}
                                </p>
                                <p className="text-xs text-yellow-700 mt-1">
                                    <strong>Ngày huỷ:</strong> {new Date(sale.void_at).toLocaleString('vi-VN')}
                                </p>
                            </div>
                        </div>
                    ) : step === 'confirm' ? (
                        // Confirm step
                        <div className="space-y-4">
                            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                                <p className="text-sm font-bold text-red-700">Xác nhận huỷ phiếu?</p>
                                <p className="text-xs text-red-600 mt-2">
                                    Mã: <strong>{sale.code}</strong>
                                </p>
                                <p className="text-xs text-red-600">
                                    Tổng: <strong>{new Intl.NumberFormat('vi-VN').format(sale.total_amount)} đ</strong>
                                </p>
                                <p className="text-xs text-red-600 mt-3 flex items-center gap-1">
                                    <AlertTriangle className="w-4 h-4 shrink-0" /> <strong>Không thể hoàn tác!</strong> Phiếu sẽ được đánh dấu là huỷ trong hệ thống.
                                </p>
                            </div>
                            <button
                                onClick={() => setStep('reason')}
                                className="w-full btn bg-red-500 text-white font-black hover:bg-red-600 transition"
                            >
                                Tiếp tục →
                            </button>
                        </div>
                    ) : step === 'reason' ? (
                        // Reason step
                        <div className="space-y-4">
                            <p className="text-sm font-bold text-gray-700">Chọn lý do huỷ phiếu:</p>
                            <div className="space-y-2">
                                {voidReasons.map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setReason(r)}
                                        className={`w-full p-3 rounded-lg border-2 font-bold text-sm transition ${reason === r
                                                ? 'bg-red-100 border-red-500 text-red-700'
                                                : 'bg-white border-gray-200 text-gray-700 hover:border-red-300'
                                            }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                            {reason === 'Khác' && (
                                <input
                                    type="text"
                                    placeholder="Nhập lý do khác..."
                                    className="w-full p-3 border border-gray-300 rounded-lg font-bold"
                                    onChange={(e) => setReason(e.target.value)}
                                />
                            )}
                            <button
                                onClick={handleVoid}
                                disabled={loading || !reason.trim()}
                                className="w-full btn bg-red-600 text-white font-black hover:bg-red-700 disabled:opacity-50 transition flex items-center justify-center gap-1.5"
                            >
                                {loading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                                ) : (
                                    <><Check className="w-4 h-4" /> Xác nhận huỷ</>
                                )}
                            </button>
                        </div>
                    ) : (
                        // Success step
                        <div className="text-center space-y-4 py-4">
                            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                            <p className="text-lg font-black text-green-700">Huỷ phiếu thành công!</p>
                            <p className="text-sm text-gray-600">
                                Phiếu đã được đánh dấu là huỷ. Doanh thu sẽ tự động điều chỉnh.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t flex gap-3">
                    {step !== 'success' && (
                        <>
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 btn-secondary h-11 font-bold"
                            >
                                {step === 'confirm' ? 'Quay lại' : 'Huỷ'}
                            </button>
                            {step === 'reason' && (
                                <button
                                    onClick={() => setStep('confirm')}
                                    className="flex-1 btn-secondary h-11 font-bold"
                                >
                                    ← Quay lại
                                </button>
                            )}
                        </>
                    )}
                    {step === 'success' && (
                        <button
                            onClick={onClose}
                            className="flex-1 btn-primary h-11 font-bold"
                        >
                            Đóng
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
