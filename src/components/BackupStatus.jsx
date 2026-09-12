import React, { useState, useEffect } from 'react'
import api from '../lib/api'
import { 
    Inbox, 
    Clipboard as ClipboardText, 
    CheckCircle2, 
    XCircle, 
    AlertTriangle, 
    Save, 
    Loader2 
} from 'lucide-react'

/**
 * Hiển thị trạng thái sao lưu gần nhất
 * Props: { shopId }
 */
export const BackupStatus = ({ shopId }) => {
    const [lastBackup, setLastBackup] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!shopId) return

        // Temporarily disabled since backup_logs are now local and we need an endpoint
        // For now, we'll just show "No record" until the endpoint is implemented if needed
        setLoading(false)
    }, [shopId])

    if (loading) {
        return <div className="text-sm text-gray-500">Đang tải...</div>
    }

    if (!lastBackup) {
        return (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                <p className="text-gray-600 flex items-center gap-1.5"><Inbox className="w-4 h-4 text-gray-400" /> Chưa có sao lưu nào</p>
            </div>
        )
    }

    const createdDate = new Date(lastBackup.created_at).toLocaleString('vi-VN')
    const statusColor = lastBackup.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'

    return (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-medium flex items-center gap-1.5"><ClipboardText className="w-4 h-4 text-primary" /> Lần sao lưu gần nhất</p>
                <span className={`text-sm ${statusColor} flex items-center gap-1`}>
                    {lastBackup.status === 'SUCCESS' ? (
                        <><CheckCircle2 className="w-4 h-4 text-green-600" /> Thành công</>
                    ) : (
                        <><XCircle className="w-4 h-4 text-red-600" /> Thất bại</>
                    )}
                </span>
            </div>

            <div className="text-xs text-gray-600 space-y-1">
                <p>Tháng: <span className="font-mono">{lastBackup.month}</span></p>
                <p>File: <span className="font-mono">{lastBackup.file_name}</span></p>
                <p>Lúc: {createdDate}</p>

                {lastBackup.file_size_bytes && (
                    <p>Dung lượng: {(lastBackup.file_size_bytes / 1024).toFixed(2)} KB</p>
                )}

                {lastBackup.error_message && (
                    <p className="text-red-600 mt-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Lỗi: {lastBackup.error_message}</p>
                )}
            </div>
        </div>
    )
}

/**
 * Nút bấm để sao lưu ngay
 * Props: { shopId, shopName, onBackupSuccess, onBackupError }
 */
export const BackupButton = ({
    shopId,
    shopName,
    month,  // YYYY-MM
    year,   // 2026
    onBackupSuccess,
    onBackupError
}) => {
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState('')

    const handleBackupNow = async () => {
        setIsLoading(true)
        setStatus('Đang sao lưu...')

        try {
            // Gọi API backend để generate Excel + upload Drive
            const response = await api.post('/reports/backup', {
                shop_id: shopId,
                shop_name: shopName,
                month: month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
                year: year || new Date().getFullYear()
            })
            const result = response.data

            setStatus('Sao lưu thành công!')

            if (onBackupSuccess) {
                onBackupSuccess(result)
            }

            // Clear status sau 3 giây
            setTimeout(() => setStatus(''), 3000)
        } catch (err) {
            console.error('Lỗi sao lưu:', err)
            setStatus(`Lỗi: ${err.message}`)

            if (onBackupError) {
                onBackupError(err)
            }

            setTimeout(() => setStatus(''), 5000)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={handleBackupNow}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-1.5"
            >
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang sao lưu...</> : <><Save className="w-4 h-4" /> Sao lưu ngay</>}
            </button>

            {status && (
                <p className={`text-sm ${status.includes('thành công') ? 'text-green-600' : 'text-red-600'}`}>
                    {status}
                </p>
            )}
        </div>
    )
}
