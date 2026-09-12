import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useNotification } from '../contexts/NotificationContext'

const EMPTY_FORM = {
    name: '',
    phone: '',
    address: '',
    tax_code: '',
    bank_account: '',
    bank_name: '',
    note: ''
}

export default function SupplierFormModal({ supplier, onClose, onSuccess }) {
    const { showNotification } = useNotification()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState(EMPTY_FORM)

    useEffect(() => {
        setFormData(supplier ? {
            name: supplier.name || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
            tax_code: supplier.tax_code || '',
            bank_account: supplier.bank_account || '',
            bank_name: supplier.bank_name || '',
            note: supplier.note || ''
        } : EMPTY_FORM)
    }, [supplier])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (supplier?.id) {
                await api.put(`/suppliers/${supplier.id}`, formData)
                showNotification('Đã cập nhật nhà cung cấp', 'success')
            } else {
                await api.post('/suppliers', formData)
                showNotification('Đã thêm nhà cung cấp', 'success')
            }

            await onSuccess?.()
            onClose()
        } catch (error) {
            console.error('Supplier save error:', error)
            showNotification('Lỗi khi lưu nhà cung cấp', 'error')
        } finally {
            setLoading(false)
        }
    }

    const title = supplier?.id ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-gray-900 mb-6">{title}</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Field label="Tên" name="name" value={formData.name} onChange={handleChange} />
                    <Field label="SĐT" name="phone" value={formData.phone} onChange={handleChange} />
                    <Field label="Địa chỉ" name="address" value={formData.address} onChange={handleChange} />
                    <Field label="Mã số thuế" name="tax_code" value={formData.tax_code} onChange={handleChange} />
                    <Field label="Số tài khoản" name="bank_account" value={formData.bank_account} onChange={handleChange} />
                    <Field label="Tên ngân hàng" name="bank_name" value={formData.bank_name} onChange={handleChange} />

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Ghi chú</label>
                        <textarea
                            name="note"
                            value={formData.note}
                            onChange={handleChange}
                            rows="3"
                            className="input w-full border-gray-200 focus:ring-primary focus:border-primary resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 btn-secondary h-11 font-bold"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 btn-primary h-11 font-bold"
                        >
                            {loading ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function Field({ label, name, value, onChange }) {
    return (
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                className="input w-full border-gray-200 focus:ring-primary focus:border-primary"
            />
        </div>
    )
}
