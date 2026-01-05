import React, { useState, useEffect } from 'react'

/**
 * Hiển thị trạng thái sao lưu gần nhất
 * Props: { shopId, supabase }
 */
export const BackupStatus = ({ shopId, supabase }) => {
    const [lastBackup, setLastBackup] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!shopId) return
        
        const loadLastBackup = async () => {
            try {
                const { data, error } = await supabase
                    .from('backup_logs')
                    .select('*')
                    .eq('shop_id', shopId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single()

                if (error && error.code !== 'PGRST116') throw error
                
                setLastBackup(data || null)
            } catch (err) {
                console.error('Lỗi load backup status:', err)
            } finally {
                setLoading(false)
            }
        }

        loadLastBackup()
    }, [shopId, supabase])

    if (loading) {
        return <div className="text-sm text-gray-500">Đang tải...</div>
    }

    if (!lastBackup) {
        return (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                <p className="text-gray-600">📭 Chưa có sao lưu nào</p>
            </div>
        )
    }

    const createdDate = new Date(lastBackup.created_at).toLocaleString('vi-VN')
    const statusColor = lastBackup.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'
    const statusIcon = lastBackup.status === 'SUCCESS' ? '✓' : '✕'

    return (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-medium">📋 Lần sao lưu gần nhất</p>
                <span className={`text-sm ${statusColor}`}>
                    {statusIcon} {lastBackup.status === 'SUCCESS' ? 'Thành công' : 'Thất bại'}
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
                    <p className="text-red-600 mt-2">⚠️ Lỗi: {lastBackup.error_message}</p>
                )}
            </div>
        </div>
    )
}

/**
 * Nút bấm để sao lưu ngay
 * Props: { shopId, shopName, supabase, onBackupSuccess, onBackupError }
 */
export const BackupButton = ({ 
    shopId, 
    shopName, 
    supabase, 
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
            const response = await fetch('/api/backup/manual', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    shop_id: shopId,
                    shop_name: shopName,
                    month: month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
                    year: year || new Date().getFullYear()
                })
            })

            if (!response.ok) {
                throw new Error(`Backup API error: ${response.statusText}`)
            }

            const result = await response.json()
            
            setStatus('✓ Sao lưu thành công!')
            
            if (onBackupSuccess) {
                onBackupSuccess(result)
            }
            
            // Clear status sau 3 giây
            setTimeout(() => setStatus(''), 3000)
        } catch (err) {
            console.error('Lỗi sao lưu:', err)
            setStatus(`✕ Lỗi: ${err.message}`)
            
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
                {isLoading ? 'Đang sao lưu...' : '💾 Sao lưu ngay'}
            </button>
            
            {status && (
                <p className={`text-sm ${status.includes('✓') ? 'text-green-600' : 'text-red-600'}`}>
                    {status}
                </p>
            )}
        </div>
    )
}
