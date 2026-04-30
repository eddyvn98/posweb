import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import api from '../../lib/api'
import { useNotification } from '../../contexts/NotificationContext'
import SupplierFormModal from '../SupplierFormModal'
import {
    buildInitialForm,
    numberValue,
    openTelegramFile,
    readFileAsDataUrl,
    summarize
} from './utils'
import {
    ActionSection,
    AttachmentsSection,
    GeneralInfoSection,
    ProductItemsSection,
    SummarySection
} from './Sections'

export default function ImportModalContent({ importRecord, onClose, onSuccess, suppliers, onSupplierSaved }) {
    const { showNotification } = useNotification()
    const [loading, setLoading] = useState(false)
    const [products, setProducts] = useState([])
    const [showSupplierForm, setShowSupplierForm] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState(null)
    const [formData, setFormData] = useState(buildInitialForm(importRecord, suppliers))

    useEffect(() => {
        setFormData(buildInitialForm(importRecord, suppliers))
    }, [importRecord, suppliers])

    useEffect(() => {
        api.get('/products')
            .then((response) => setProducts(response.data || []))
            .catch((error) => {
                console.error('Load products for import error:', error)
            })
    }, [])

    useEffect(() => {
        if (!formData.supplier_id) return

        const supplier = suppliers.find((item) => item.id === formData.supplier_id)
        if (!supplier) return

        setFormData((prev) => ({
            ...prev,
            supplier_name: supplier.name || '',
            supplier_tax_code: prev.supplier_tax_code || supplier.tax_code || ''
        }))
    }, [formData.supplier_id, suppliers])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'paid_amount' ? numberValue(value) : value
        }))
    }

    const handleItemChange = (id, field, value) => {
        setFormData((prev) => ({
            ...prev,
            items: prev.items.map((item) => {
                if (item.id !== id) return item
                // Special action: match an AI item to a real product
                if (field === '_matchProduct') {
                    return {
                        ...item,
                        product_id: value.id,
                        product_name: value.name || item.product_name,
                        search: value.name || item.product_name,
                        unit_price: item.unit_price || numberValue(value.cost_price || value.price)
                    }
                }
                return {
                    ...item,
                    [field]: ['quantity', 'unit_price', 'vat_amount', 'total_amount'].includes(field) ? numberValue(value) : value
                }
            })
        }))
    }

    const addItem = (product) => {
        if (!product?.id) return

        setFormData((prev) => {
            const existingItem = prev.items.find((item) => item.product_id === product.id)
            if (existingItem) {
                return {
                    ...prev,
                    items: prev.items.map((item) => (
                        item.product_id === product.id
                            ? { ...item, quantity: numberValue(item.quantity) + 1 }
                            : item
                    ))
                }
            }

            return {
                ...prev,
                items: [
                    ...prev.items,
                    {
                        id: uuidv4(),
                        search: product.name || '',
                        product_id: product.id,
                        product_name: product.name || '',
                        quantity: 1,
                        unit_price: numberValue(product.cost_price || product.price),
                        vat_amount: 0,
                        total_amount: 0
                    }
                ]
            }
        })
    }

    const removeItem = (id) => {
        setFormData((prev) => ({
            ...prev,
            items: prev.items.filter((item) => item.id !== id)
        }))
    }

    const handleAttachmentChange = async (e) => {
        const files = Array.from(e.target.files || [])
        try {
            const attachments = await Promise.all(files.map(async (file) => {
                const dataUrl = await readFileAsDataUrl(file)
                const response = await api.post('/files/upload-document', {
                    file_name: file.name,
                    data_url: dataUrl
                })

                return {
                    id: uuidv4(),
                    name: response.data.file_name || file.name,
                    type: response.data.mime_type || file.type || 'application/octet-stream',
                    size: file.size,
                    telegram_file_id: response.data.file_id
                }
            }))

            setFormData((prev) => ({
                ...prev,
                attachment_files: [...prev.attachment_files, ...attachments]
            }))
            showNotification('Đã tải chứng từ lên Telegram', 'success')
        } catch (error) {
            console.error('Attachment upload error:', error)
            showNotification('Lỗi khi tải chứng từ lên Telegram', 'error')
        } finally {
            e.target.value = ''
        }
    }

    const removeAttachment = (id) => {
        setFormData((prev) => ({
            ...prev,
            attachment_files: prev.attachment_files.filter((file) => file.id !== id)
        }))
    }

    const handleViewAttachment = async (file) => {
        try {
            await openTelegramFile({
                fileId: file.telegram_file_id,
                filename: file.name,
                mimeType: file.type,
                download: false
            })
        } catch (error) {
            showNotification('Không thể mở chứng từ này', 'error')
        }
    }

    const handleDownloadAttachment = async (file) => {
        try {
            await openTelegramFile({
                fileId: file.telegram_file_id,
                filename: file.name,
                mimeType: file.type,
                download: true
            })
            showNotification('Đã tải chứng từ xuống máy', 'success')
        } catch (error) {
            showNotification('Không thể tải chứng từ này', 'error')
        }
    }

    const summary = summarize(formData.items, formData.paid_amount)
    // Tính tổng từ toàn bộ items (kể cả chưa match product_id) để validation không bị chặn sai
    const rawTotalCost = formData.items.reduce((sum, item) => sum + numberValue(item.quantity) * numberValue(item.unit_price) + numberValue(item.vat_amount), 0)
    const unmatchedCount = formData.items.filter((item) => !item.product_id && item.product_name).length

    const handleSubmit = async (nextStatus = formData.status) => {
        if (!formData.import_date || rawTotalCost <= 0) {
            showNotification('Cần nhập ngày và ít nhất một sản phẩm hợp lệ', 'error')
            return
        }

        setLoading(true)
        try {
            const payload = {
                import_date: formData.import_date,
                supplier_name: formData.supplier_name,
                supplier_tax_code: formData.supplier_tax_code,
                invoice_number: formData.invoice_number,
                invoice_date: formData.invoice_date || null,
                invoice_type: formData.invoice_type,
                payment_method: formData.payment_method,
                payment_date: formData.payment_date || null,
                paid_amount: numberValue(formData.paid_amount),
                total_goods_amount: summary.totalGoodsAmount,
                total_vat_amount: summary.totalVatAmount,
                total_cost: summary.totalCost,
                attachment_files: formData.attachment_files,
                status: nextStatus,
                note: formData.note,
                items: formData.items
                    // Khi lưu draft: giữ cả items chưa match product (chỉ có product_name từ AI)
                    // Khi confirmed: chỉ lưu items đã được match với product_id
                    .filter((item) => nextStatus === 'draft' ? item.product_name : item.product_id)
                    .map((item) => ({
                        id: item.id,
                        product_id: item.product_id || '',
                        product_name: item.product_name,
                        quantity: numberValue(item.quantity),
                        unit_price: numberValue(item.unit_price),
                        vat_amount: numberValue(item.vat_amount),
                        total_amount: numberValue(item.quantity) * numberValue(item.unit_price) + numberValue(item.vat_amount)
                    }))
            }

            if (importRecord?.id) {
                await api.put(`/imports/${importRecord.id}`, payload)
                showNotification(nextStatus === 'confirmed' ? 'Đã xác nhận phiếu nhập' : 'Đã cập nhật phiếu nhập', 'success')
            } else {
                await api.post('/imports', payload)
                showNotification(nextStatus === 'confirmed' ? 'Đã tạo và xác nhận phiếu nhập' : 'Đã lưu nháp phiếu nhập', 'success')
            }

            onSuccess()
            onClose()
        } catch (err) {
            console.error('Import save error:', err)
            showNotification('Lỗi khi lưu phiếu nhập', 'error')
        } finally {
            setLoading(false)
        }
    }

    const selectedSupplier = suppliers.find((item) => item.id === formData.supplier_id)

    return (
        <>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl p-6 max-w-5xl w-full shadow-2xl max-h-[92vh] overflow-y-auto">
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
                            Chi tiết đơn nhập
                        </h2>
                        <button type="button" onClick={onClose} className="px-4 h-10 rounded-xl bg-gray-100 text-gray-700 font-bold">
                            Đóng
                        </button>
                    </div>

                    <div className="space-y-6">
                        <GeneralInfoSection
                            formData={formData}
                            suppliers={suppliers}
                            selectedSupplier={selectedSupplier}
                            onChange={handleChange}
                            onAddSupplier={() => {
                                setEditingSupplier(null)
                                setShowSupplierForm(true)
                            }}
                            onEditSupplier={() => {
                                if (!selectedSupplier) return
                                setEditingSupplier(selectedSupplier)
                                setShowSupplierForm(true)
                            }}
                        />

                        <ProductItemsSection
                            formData={formData}
                            products={products}
                            onAddItem={addItem}
                            onRemoveItem={removeItem}
                            onItemChange={handleItemChange}
                        />

                        <SummarySection summary={summary} paidAmount={formData.paid_amount} />

                        <AttachmentsSection
                            attachments={formData.attachment_files}
                            onAttachmentChange={handleAttachmentChange}
                            onRemoveAttachment={removeAttachment}
                            onViewAttachment={handleViewAttachment}
                            onDownloadAttachment={handleDownloadAttachment}
                        />

                        <ActionSection
                            status={formData.status}
                            loading={loading}
                            unmatchedCount={unmatchedCount}
                            onSaveDraft={() => handleSubmit('draft')}
                            onConfirm={() => handleSubmit('confirmed')}
                        />
                    </div>
                </div>
            </div>

            {showSupplierForm && (
                <SupplierFormModal
                    supplier={editingSupplier}
                    onClose={() => setShowSupplierForm(false)}
                    onSuccess={async () => {
                        await onSupplierSaved?.()
                    }}
                />
            )}
        </>
    )
}
