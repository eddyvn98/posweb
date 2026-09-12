import { useState } from 'react'
import api from '../lib/api'
import { useNotification } from '../contexts/NotificationContext'
import SupplierFormModal from './SupplierFormModal'

function formatSupplierName(supplier) {
    return supplier?.name?.trim() || 'Nhà cung cấp chưa đặt tên'
}

export default function SupplierManagerModal({ suppliers, onClose, onRefresh }) {
    const [editingSupplier, setEditingSupplier] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const { showNotification } = useNotification()

    const openCreate = () => {
        setEditingSupplier(null)
        setShowForm(true)
    }

    const openEdit = (supplier) => {
        setEditingSupplier(supplier)
        setShowForm(true)
    }

    const handleDelete = async (supplier) => {
        if (!window.confirm(`Xóa nhà cung cấp "${formatSupplierName(supplier)}"?`)) return

        try {
            await api.delete(`/suppliers/${supplier.id}`)
            await onRefresh?.()
            showNotification('Đã xóa nhà cung cấp', 'success')
        } catch (error) {
            console.error('Delete supplier error:', error)
            showNotification('Lỗi khi xóa nhà cung cấp', 'error')
        }
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between gap-3 mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Nhà cung cấp</h2>
                        <button onClick={openCreate} className="btn-primary px-4 h-10 rounded-xl text-sm font-bold">
                            + Thêm mới
                        </button>
                    </div>

                    {suppliers.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">Chưa có nhà cung cấp nào</div>
                    ) : (
                        <div className="space-y-3">
                            {suppliers.map((supplier) => (
                                <div key={supplier.id} className="border border-gray-200 rounded-2xl p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-gray-800">{formatSupplierName(supplier)}</p>
                                            {supplier.phone && <p className="text-sm text-gray-600 mt-1">{supplier.phone}</p>}
                                            {supplier.address && <p className="text-sm text-gray-600 mt-1">{supplier.address}</p>}
                                            {supplier.tax_code && <p className="text-xs text-gray-500 mt-2">MST: {supplier.tax_code}</p>}
                                            {(supplier.bank_account || supplier.bank_name) && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {supplier.bank_name || 'Ngân hàng'} {supplier.bank_account ? `- ${supplier.bank_account}` : ''}
                                                </p>
                                            )}
                                            {supplier.note && <p className="text-xs text-gray-500 mt-2 italic">{supplier.note}</p>}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEdit(supplier)}
                                                className="px-3 h-9 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200"
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                onClick={() => handleDelete(supplier)}
                                                className="px-3 h-9 rounded-xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full btn bg-gray-100 text-gray-700 font-black rounded-xl hover:bg-gray-200 transition"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>

            {showForm && (
                <SupplierFormModal
                    supplier={editingSupplier}
                    onClose={() => setShowForm(false)}
                    onSuccess={async () => {
                        await onRefresh?.()
                        setShowForm(false)
                    }}
                />
            )}
        </>
    )
}
