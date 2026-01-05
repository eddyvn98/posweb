import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNotification } from '../contexts/NotificationContext'

export default function ImportModal({ shopId, onClose, onSuccess }) {
    const { showNotification } = useNotification()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        import_date: new Date().toISOString().split('T')[0],
        supplier_name: '',
        total_cost: '',
        note: ''
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'total_cost' ? (value ? parseInt(value) : '') : value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.supplier_name.trim()) {
            showNotification('Vui lòng nhập tên nhà cung cấp', 'error')
            return
        }

        if (!formData.total_cost || formData.total_cost <= 0) {
            showNotification('Vui lòng nhập tổng tiền nhập hợp lệ', 'error')
            return
        }

        setLoading(true)
        try {
            // 1. Create import record
            const { data: importData, error: importError } = await supabase
                .from('imports')
                .insert([
                    {
                        shop_id: shopId,
                        import_date: formData.import_date,
                        supplier_name: formData.supplier_name,
                        total_cost: formData.total_cost,
                        note: formData.note || null
                    }
                ])
                .select()

            if (importError) throw importError

            const importId = importData[0].id

            // 2. Create inventory log (record import)
            const { error: logError } = await supabase
                .from('inventory_logs')
                .insert([
                    {
                        shop_id: shopId,
                        product_id: null, // Bulk import, no specific product
                        change_amount: 0, // Placeholder
                        current_stock: 0,
                        type: 'import',
                        note: `Nhập hàng từ ${formData.supplier_name}`,
                        ref_id: importId
                    }
                ])

            if (logError) console.warn('Inventory log error (non-critical):', logError)

            // 3. Create cash flow (record expense)
            const { error: cashError } = await supabase
                .from('cash_flows')
                .insert([
                    {
                        shop_id: shopId,
                        amount: formData.total_cost,
                        type: 'out',
                        category: 'import',
                        description: `Nhập hàng từ ${formData.supplier_name}`,
                        ref_id: importId,
                        created_at: new Date(formData.import_date).toISOString()
                    }
                ])

            if (cashError) throw cashError

            showNotification('✅ Ghi nhận nhập hàng thành công!', 'success')
            onSuccess()
            onClose()
        } catch (err) {
            console.error('Error creating import:', err)
            showNotification('❌ Lỗi khi ghi nhận nhập hàng', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
                <h2 className="text-2xl font-black text-gray-800 mb-6 uppercase tracking-tight">📦 Ghi nhận nhập hàng</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Import Date */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Ngày nhập</label>
                        <input
                            type="date"
                            name="import_date"
                            value={formData.import_date}
                            onChange={handleChange}
                            className="input w-full border-gray-200 focus:ring-primary focus:border-primary"
                        />
                    </div>

                    {/* Supplier Name */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nhà cung cấp</label>
                        <input
                            type="text"
                            name="supplier_name"
                            placeholder="Ví dụ: ABC Supply Co."
                            value={formData.supplier_name}
                            onChange={handleChange}
                            className="input w-full border-gray-200 focus:ring-primary focus:border-primary"
                        />
                    </div>

                    {/* Total Cost */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Tổng tiền nhập</label>
                        <div className="flex">
                            <input
                                type="number"
                                name="total_cost"
                                placeholder="0"
                                value={formData.total_cost}
                                onChange={handleChange}
                                className="input flex-1 border-gray-200 focus:ring-primary focus:border-primary"
                                min="0"
                            />
                            <span className="ml-2 flex items-center text-gray-500 font-bold">đ</span>
                        </div>
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Ghi chú (optional)</label>
                        <textarea
                            name="note"
                            placeholder="Ví dụ: Nhập 50 tấn gạo, hạn thanh toán 30 ngày"
                            value={formData.note}
                            onChange={handleChange}
                            rows="3"
                            className="input w-full border-gray-200 focus:ring-primary focus:border-primary resize-none"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 btn bg-gray-100 text-gray-700 font-black rounded-xl hover:bg-gray-200 transition"
                            disabled={loading}
                        >
                            Huỷ
                        </button>
                        <button
                            type="submit"
                            className="flex-1 btn bg-primary text-white font-black rounded-xl hover:bg-pink-600 transition disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? '⏳ Đang lưu...' : '💾 Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
