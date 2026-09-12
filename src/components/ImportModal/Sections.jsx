import { useMemo, useState } from 'react'
import { INVOICE_TYPE_OPTIONS, PAYMENT_METHOD_OPTIONS } from './constants'
import { Field, SelectField, SummaryRow } from './Fields'
import { formatBytes, getSupplierLabel, numberValue } from './utils'
import { matchProduct, sortSearchResults } from '../../lib/searchUtils'
import { AlertTriangle, Check } from 'lucide-react'

export function GeneralInfoSection({
    formData,
    suppliers,
    selectedSupplier,
    onChange,
    onAddSupplier,
    onEditSupplier
}) {
    return (
        <section className="rounded-3xl border border-gray-200 p-5">
            <h3 className="text-xl font-black text-gray-800 mb-4">A. Thông tin chung</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2 border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-sm text-gray-500 font-semibold">Nhà cung cấp</p>
                        <p className="text-lg font-black text-gray-800">{formData.supplier_name || 'Chưa chọn nhà cung cấp'}</p>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={onAddSupplier} className="px-4 h-10 rounded-xl bg-gray-100 text-gray-700 font-bold">
                            + Thêm
                        </button>
                        <button
                            type="button"
                            onClick={onEditSupplier}
                            disabled={!selectedSupplier}
                            className="px-4 h-10 rounded-xl bg-primary text-white font-bold disabled:opacity-40"
                        >
                            Chọn / sửa
                        </button>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Danh sách nhà cung cấp</label>
                    <select
                        name="supplier_id"
                        value={formData.supplier_id}
                        onChange={onChange}
                        className="input w-full"
                    >
                        <option value="">Chọn nhà cung cấp</option>
                        {suppliers.map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>{getSupplierLabel(supplier)}</option>
                        ))}
                    </select>
                </div>

                <Field label="Tên nhà cung cấp" name="supplier_name" value={formData.supplier_name} onChange={onChange} />
                <Field label="Mã số thuế NCC" name="supplier_tax_code" value={formData.supplier_tax_code} onChange={onChange} />
                <Field label="Số hóa đơn" name="invoice_number" value={formData.invoice_number} onChange={onChange} />
                <Field label="Ngày hóa đơn" name="invoice_date" type="date" value={formData.invoice_date} onChange={onChange} />
                <SelectField label="Loại hóa đơn" name="invoice_type" value={formData.invoice_type} onChange={onChange} options={INVOICE_TYPE_OPTIONS} />
                <Field label="Ngày nhập" name="import_date" type="date" value={formData.import_date} onChange={onChange} />
                <SelectField label="Phương thức thanh toán" name="payment_method" value={formData.payment_method} onChange={onChange} options={PAYMENT_METHOD_OPTIONS} />
                <Field label="Ngày thanh toán" name="payment_date" type="date" value={formData.payment_date} onChange={onChange} />
                <Field label="Số tiền thanh toán" name="paid_amount" type="number" value={formData.paid_amount} onChange={onChange} />
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Ghi chú</label>
                    <textarea name="note" value={formData.note} onChange={onChange} rows="3" className="input w-full resize-none" />
                </div>
            </div>
        </section>
    )
}

export function ProductItemsSection({ formData, products, onAddItem, onRemoveItem, onItemChange }) {
    const [isPickerOpen, setIsPickerOpen] = useState(false)
    const [query, setQuery] = useState('')

    const filteredProducts = useMemo(() => {
        if (!query || !query.trim()) return products.slice(0, 8)
        const matched = products.filter((p) => matchProduct(p, query))
        return sortSearchResults(matched, query).slice(0, 8)
    }, [products, query])

    return (
        <section className="rounded-3xl border border-gray-200 p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-xl font-black text-gray-800">B. Danh sách sản phẩm</h3>
                <button
                    type="button"
                    onClick={() => setIsPickerOpen((prev) => !prev)}
                    className="w-10 h-10 rounded-full bg-primary text-white text-2xl leading-none"
                >
                    +
                </button>
            </div>

            <div className="space-y-3">
                {isPickerOpen && (
                    <div className="rounded-2xl border border-primary/20 bg-sky-50/40 p-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Tìm sản phẩm đã nhập</label>
                        <input
                            className="input w-full"
                            placeholder="Gõ tên hoặc mã vạch sản phẩm"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />

                        <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                            {filteredProducts.length === 0 ? (
                                <p className="text-sm text-gray-500">Không tìm thấy sản phẩm phù hợp.</p>
                            ) : (
                                filteredProducts.map((product) => (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => {
                                            onAddItem(product)
                                            setQuery('')
                                            setIsPickerOpen(false)
                                        }}
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left hover:border-primary/30 hover:bg-primary/5"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate font-bold text-gray-800">{product.name}</p>
                                                <p className="truncate text-xs text-gray-500">{product.barcode || 'Không có mã vạch'}</p>
                                            </div>
                                            <p className="shrink-0 text-sm font-bold text-primary">
                                                {new Intl.NumberFormat('vi-VN').format(numberValue(product.cost_price || product.price))} đ
                                            </p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {formData.items.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                        Chưa có sản phẩm nào. Nhấn dấu cộng để thêm sản phẩm.
                    </div>
                ) : (
                    formData.items.map((item, index) => (
                        <ItemRow
                            key={item.id}
                            item={item}
                            index={index}
                            products={products}
                            onRemove={onRemoveItem}
                            onChange={onItemChange}
                            onMatch={(product) => onItemChange(item.id, '_matchProduct', product)}
                        />
                    ))
                )}
            </div>
        </section>
    )
}

function ItemRow({ item, index, products, onRemove, onChange, onMatch }) {
    const [showMatchPicker, setShowMatchPicker] = useState(false)
    const [matchQuery, setMatchQuery] = useState(item.product_name || '')
    const isUnmatched = !item.product_id && item.product_name

    const filteredMatchProducts = useMemo(() => {
        if (!matchQuery || !matchQuery.trim()) return products.slice(0, 8)
        const matched = products.filter((p) => matchProduct(p, matchQuery))
        return sortSearchResults(matched, matchQuery).slice(0, 8)
    }, [products, matchQuery])

    return (
        <div className={`rounded-2xl border px-4 py-3 ${isUnmatched ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex items-center gap-2 flex-wrap">
                    <p className="font-black text-gray-800">{item.product_name || `Sản phẩm ${index + 1}`}</p>
                    {isUnmatched && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-[11px] font-black whitespace-nowrap inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-700" /> Chưa khớp SP
                        </span>
                    )}
                    {item.product_id && (
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[11px] font-black whitespace-nowrap inline-flex items-center gap-1">
                            <Check className="w-3 h-3 text-green-600" /> Đã khớp
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {isUnmatched && (
                        <button
                            type="button"
                            onClick={() => setShowMatchPicker((v) => !v)}
                            className="text-sm font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-lg hover:bg-amber-200"
                        >
                            Khớp SP
                        </button>
                    )}
                    <button type="button" onClick={() => onRemove(item.id)} className="text-sm font-bold text-red-500">
                        Xóa
                    </button>
                </div>
            </div>

            {showMatchPicker && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-white p-3">
                    <p className="text-xs font-black text-gray-600 mb-2">
                        Khớp <span className="text-amber-700">"{item.product_name}"</span> với sản phẩm trong hệ thống:
                    </p>
                    <input
                        className="input w-full text-sm"
                        placeholder="Gõ tên hoặc mã vạch..."
                        value={matchQuery}
                        onChange={(e) => setMatchQuery(e.target.value)}
                        autoFocus
                    />
                    <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                        {filteredMatchProducts.length === 0 ? (
                            <p className="text-xs text-gray-400 py-2 text-center">Không tìm thấy – sản phẩm có thể chưa có trong hệ thống</p>
                        ) : (
                            filteredMatchProducts.map((product) => (
                                <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => {
                                        onMatch(product)
                                        setShowMatchPicker(false)
                                    }}
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:border-primary/30 hover:bg-primary/5"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="truncate font-bold text-gray-800">{product.name}</p>
                                            <p className="text-xs text-gray-400">{product.barcode || 'Không có mã vạch'}</p>
                                        </div>
                                        <p className="shrink-0 text-xs font-bold text-primary">
                                            {new Intl.NumberFormat('vi-VN').format(numberValue(product.cost_price || product.price))} đ
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_140px_150px_120px]">
                <Field label="Tên sản phẩm" value={item.product_name} onChange={() => { }} readOnly />
                <Field label="Số lượng" type="number" value={item.quantity} onChange={(e) => onChange(item.id, 'quantity', e.target.value)} />
                <Field label="Đơn giá" type="number" value={item.unit_price} onChange={(e) => onChange(item.id, 'unit_price', e.target.value)} />
                <Field label="VAT" type="number" value={item.vat_amount} onChange={(e) => onChange(item.id, 'vat_amount', e.target.value)} />
            </div>
        </div>
    )
}

export function SummarySection({ summary, paidAmount }) {
    return (
        <section className="rounded-3xl border border-gray-200 p-5">
            <h3 className="text-xl font-black text-gray-800 mb-4">C. Bản tóm tắt tiền tệ</h3>
            <div className="space-y-3 text-lg">
                <SummaryRow label="Tổng tiền hàng" value={summary.totalGoodsAmount} />
                <SummaryRow label="Tổng VAT" value={summary.totalVatAmount} accent="text-sky-600" />
                <SummaryRow label="Tổng cộng" value={summary.totalCost} tone="bg-green-50" accent="text-green-700" strong />
                <SummaryRow label="Đã thanh toán" value={numberValue(paidAmount)} />
                <SummaryRow label="Còn nợ" value={summary.debtAmount} tone="bg-green-50" accent="text-green-700" strong />
            </div>
        </section>
    )
}

export function AttachmentsSection({ attachments, onAttachmentChange, onRemoveAttachment, onViewAttachment, onDownloadAttachment }) {
    return (
        <section className="rounded-3xl border border-gray-200 p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-xl font-black text-gray-800">D. Chứng từ đính kèm</h3>
                <label className="px-4 h-10 rounded-xl bg-primary text-white font-bold flex items-center cursor-pointer">
                    + Tải lên
                    <input type="file" multiple className="hidden" onChange={onAttachmentChange} />
                </label>
            </div>

            {attachments.length === 0 ? (
                <p className="text-gray-400 text-center py-6">Chưa có chứng từ nào.</p>
            ) : (
                <div className="space-y-2">
                    {attachments.map((file) => (
                        <div key={file.id} className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3">
                            <div className="min-w-0">
                                <p className="font-bold text-gray-800 truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {file.telegram_file_id && (
                                    <>
                                        <button type="button" onClick={() => onViewAttachment(file)} className="text-primary font-bold text-sm">
                                            Xem
                                        </button>
                                        <button type="button" onClick={() => onDownloadAttachment(file)} className="text-gray-700 font-bold text-sm">
                                            Tải
                                        </button>
                                    </>
                                )}
                                <button type="button" onClick={() => onRemoveAttachment(file.id)} className="text-red-500 font-bold text-sm">
                                    Xóa
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}

export function ActionSection({ status, loading, unmatchedCount = 0, onSaveDraft, onConfirm }) {
    return (
        <section className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
            <p className="text-2xl font-black text-gray-800 mb-4">Trạng thái: {String(status || 'draft').toUpperCase()}</p>
            {unmatchedCount > 0 && (
                <div className="mb-4 rounded-2xl bg-amber-100 border border-amber-300 px-4 py-3 text-sm font-bold text-amber-800">
                    ℹ️ Có {unmatchedCount} sản phẩm chưa khớp – Khi Xác nhận, hệ thống sẽ <strong>tự động tạo sản phẩm mới</strong> vào kho cho các mặt hàng này.
                </div>
            )}
            <div className="flex flex-col md:flex-row gap-3">
                <button type="button" disabled={loading} onClick={onSaveDraft} className="flex-1 btn-primary h-12 rounded-xl disabled:opacity-50">
                    Lưu nháp
                </button>
                <button
                    type="button"
                    disabled={loading}
                    onClick={onConfirm}
                    className="flex-1 h-12 rounded-xl bg-stone-800 text-white font-black hover:bg-stone-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Xác nhận{unmatchedCount > 0 ? ` (tự tạo ${unmatchedCount} SP mới)` : ''}
                </button>
            </div>
        </section>
    )
}
