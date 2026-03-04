import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import ImportModal from '../components/ImportModal'
import { useNotification } from '../contexts/NotificationContext'

export default function Imports() {
    const { shop } = useAuth()
    const { showNotification } = useNotification()
    const [imports, setImports] = useState([])
    const [loading, setLoading] = useState(false)
    const [showModal, setShowModal] = useState(false)

    const loadImports = async () => {
        if (!shop?.id) return

        setLoading(true)
        try {
            const response = await api.get('/imports')
            setImports(response.data || [])
        } catch (err) {
            console.error('Error loading imports:', err)
            showNotification('Lỗi khi tải danh sách nhập hàng', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadImports()
    }, [shop?.id])

    const formatMoney = (value) => {
        return new Intl.NumberFormat('vi-VN').format(value)
    }

    const formatDate = (dateString) => {
        return new Date(dateString + 'T00:00:00').toLocaleDateString('vi-VN', {
            weekday: 'short',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm p-4 sticky top-0 z-10 border-b">
                <div className="flex gap-3 items-center justify-between">
                    <h1 className="text-xl font-black flex-1 text-gray-800 uppercase tracking-tighter">📦 Nhập hàng</h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary px-4 shadow-lg text-sm font-bold h-10 rounded-xl"
                    >
                        + Ghi nhận
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {loading ? (
                    <div className="text-center py-16">
                        <p className="text-gray-500 font-bold">⏳ Đang tải...</p>
                    </div>
                ) : imports.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-5xl mb-4">📦</p>
                        <p className="text-gray-600 font-bold text-lg">Chưa có nhập hàng nào</p>
                        <p className="text-gray-400 text-sm mt-2">Nhấn "+ Ghi nhận" để thêm phiếu nhập hàng</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {imports.map(imp => (
                            <div
                                key={imp.id}
                                className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-primary/20 transition"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="font-black text-gray-800">{imp.supplier_name}</p>
                                        <p className="text-xs text-gray-500 mt-1">{formatDate(imp.import_date)}</p>
                                        {imp.note && (
                                            <p className="text-xs text-gray-600 mt-2 italic">{imp.note}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-primary text-lg">
                                            {formatMoney(imp.total_cost)}
                                        </p>
                                        <p className="text-xs text-gray-500 font-bold">đ</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <ImportModal
                    shopId={shop?.id}
                    onClose={() => setShowModal(false)}
                    onSuccess={loadImports}
                />
            )}
        </div>
    )
}
