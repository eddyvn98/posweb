import { useMemo, useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import ImportModal from '../components/ImportModal'
import SupplierManagerModal from '../components/SupplierManagerModal'
import { useNotification } from '../contexts/NotificationContext'

function getSupplierLabel(name) {
    return name?.trim() || 'Không có nhà cung cấp'
}

function getImportIssues(record) {
    const issues = []

    if (!record.supplier_name?.trim()) issues.push('Thiếu nhà cung cấp')
    if (!record.invoice_number?.trim()) issues.push('Thiếu số hóa đơn')
    if (!record.invoice_date) issues.push('Thiếu ngày hóa đơn')
    if (!record.attachment_files?.length) issues.push('Thiếu chứng từ đính kèm')
    if ((record.status || 'draft') !== 'confirmed') issues.push('Chưa xác nhận')
    if (Number(record.total_cost || 0) > Number(record.paid_amount || 0)) issues.push('Chưa thanh toán đủ')

    return issues
}

function SummaryCard({ label, value, hint, tone = 'bg-white' }) {
    return (
        <div className={`rounded-3xl border border-gray-200 p-4 ${tone}`}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">{label}</p>
            <p className="mt-2 text-3xl font-black text-gray-900">{value}</p>
            {hint && <p className="mt-2 text-sm font-medium text-gray-500">{hint}</p>}
        </div>
    )
}

function extractJsonBlock(raw) {
    const input = String(raw || '').trim()
    if (!input) throw new Error('Bạn chưa dán dữ liệu AI')

    const fencedMatch = input.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fencedMatch?.[1]) return fencedMatch[1].trim()

    const start = input.indexOf('{')
    const end = input.lastIndexOf('}')
    if (start >= 0 && end > start) return input.slice(start, end + 1)

    throw new Error('Không tìm thấy JSON hợp lệ trong nội dung đã dán')
}

function numberValue(value) {
    const parsed = Number(value || 0)
    return Number.isFinite(parsed) ? parsed : 0
}

function normalizeAiImportPayload(payload) {
    const items = Array.isArray(payload.items) ? payload.items : []

    return {
        import_date: payload.import_date || new Date().toISOString().slice(0, 10),
        supplier_name: String(payload.supplier_name || '').trim(),
        supplier_tax_code: String(payload.supplier_tax_code || '').trim(),
        invoice_number: String(payload.invoice_number || '').trim(),
        invoice_date: payload.invoice_date || '',
        invoice_type: payload.invoice_type || 'no_invoice',
        payment_method: payload.payment_method || 'unpaid',
        payment_date: payload.payment_date || '',
        paid_amount: numberValue(payload.paid_amount),
        note: String(payload.note || '').trim(),
        status: payload.status || 'draft',
        attachment_files: Array.isArray(payload.attachment_files) ? payload.attachment_files : [],
        items: items
            .map((item) => ({
                product_id: String(item.product_id || '').trim(),
                product_name: String(item.product_name || item.name || '').trim(),
                quantity: numberValue(item.quantity),
                unit_price: numberValue(item.unit_price),
                vat_amount: numberValue(item.vat_amount)
            }))
            .filter((item) => item.product_name && item.quantity > 0)
    }
}

const AI_IMPORT_TEMPLATE = `Dán hóa đơn mua hàng này và trả về đúng 1 JSON, không giải thích, không markdown:
{
  "supplier_name": "",
  "supplier_tax_code": "",
  "invoice_number": "",
  "invoice_date": "YYYY-MM-DD",
  "import_date": "YYYY-MM-DD",
  "invoice_type": "vat_invoice | retail_invoice | no_invoice",
  "payment_method": "cash | transfer | mixed | unpaid",
  "paid_amount": 0,
  "note": "",
  "items": [
    {
      "product_name": "",
      "quantity": 1,
      "unit_price": 0,
      "vat_amount": 0
    }
  ]
}`

export default function Imports() {
    const { shop } = useAuth()
    const { showNotification } = useNotification()
    const [imports, setImports] = useState([])
    const [suppliers, setSuppliers] = useState([])
    const [loading, setLoading] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [loadingDetail, setLoadingDetail] = useState(false)
    const [editingImport, setEditingImport] = useState(null)
    const [showSupplierModal, setShowSupplierModal] = useState(false)
    const [aiDraftText, setAiDraftText] = useState('')

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

    const loadSuppliers = async () => {
        if (!shop?.id) return

        try {
            const response = await api.get('/suppliers')
            setSuppliers(response.data || [])
        } catch (err) {
            console.error('Error loading suppliers:', err)
            showNotification('Lỗi khi tải nhà cung cấp', 'error')
        }
    }

    useEffect(() => {
        loadImports()
        loadSuppliers()
    }, [shop?.id])

    const formatMoney = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0))

    const formatDate = (dateString) => {
        if (!dateString) return '--'
        return new Date(`${dateString}T00:00:00`).toLocaleDateString('vi-VN', {
            weekday: 'short',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
    }

    const openImportDetail = async (importId) => {
        setLoadingDetail(true)
        try {
            const response = await api.get(`/imports/${importId}`)
            setEditingImport(response.data)
            setShowModal(true)
        } catch (error) {
            console.error('Error loading import detail:', error)
            showNotification('Không tải được chi tiết phiếu nhập', 'error')
        } finally {
            setLoadingDetail(false)
        }
    }

    const handleCreateDraftFromAi = () => {
        try {
            const extractedJson = extractJsonBlock(aiDraftText)
            const parsed = JSON.parse(extractedJson)
            const nextDraft = normalizeAiImportPayload(parsed)

            if (!nextDraft.items.length) {
                throw new Error('Dữ liệu AI chưa có danh sách sản phẩm hợp lệ')
            }

            setEditingImport(nextDraft)
            setShowModal(true)
            showNotification('Đã tạo nháp từ dữ liệu AI, kiểm tra lại rồi lưu', 'success')
        } catch (error) {
            showNotification(error.message || 'Không đọc được dữ liệu AI', 'error')
        }
    }

    const importInsights = useMemo(() => {
        const records = imports.map((record) => {
            const issues = getImportIssues(record)
            return { ...record, issues }
        })

        return {
            records,
            totalImports: records.length,
            totalCost: records.reduce((sum, item) => sum + Number(item.total_cost || 0), 0),
            draftCount: records.filter((item) => (item.status || 'draft') !== 'confirmed').length,
            missingDocsCount: records.filter((item) => !item.attachment_files?.length).length,
            unpaidCount: records.filter((item) => Number(item.total_cost || 0) > Number(item.paid_amount || 0)).length,
            problematicRecords: records.filter((item) => item.issues.length > 0)
        }
    }, [imports])

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white shadow-sm p-4 sticky top-0 z-10 border-b">
                <div className="flex gap-3 items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-gray-800 uppercase tracking-tighter">Nhập hàng</h1>
                        <p className="text-sm text-gray-500 font-medium">Theo dõi nhanh phiếu nhập và dữ liệu còn thiếu ngay trong web</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowSupplierModal(true)}
                            className="px-4 shadow-sm text-sm font-bold h-10 rounded-xl bg-gray-100 text-gray-700"
                        >
                            Nhà cung cấp
                        </button>
                        <button
                            onClick={() => {
                                setEditingImport(null)
                                setShowModal(true)
                            }}
                            className="btn-primary px-4 shadow-lg text-sm font-bold h-10 rounded-xl"
                        >
                            + Ghi nhận
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-4">
                <section className="rounded-3xl border border-primary/15 bg-white p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-2xl">
                            <h2 className="text-lg font-black text-gray-900">Dán dữ liệu từ GPT / Gemini</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Khi đi mua hàng về, bạn chỉ cần đưa ảnh/PDF hóa đơn cho AI web, yêu cầu nó trả về JSON đúng mẫu rồi dán vào đây.
                                Hệ thống sẽ mở sẵn phiếu nhập để bạn chỉnh nhẹ và lưu, không cần nhập từng món bằng tay.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(AI_IMPORT_TEMPLATE)}
                            className="h-10 px-4 rounded-xl bg-gray-100 text-gray-700 font-bold"
                        >
                            Copy mẫu prompt
                        </button>
                    </div>

                    <div className="mt-4 grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Kết quả JSON từ AI</label>
                            <textarea
                                value={aiDraftText}
                                onChange={(e) => setAiDraftText(e.target.value)}
                                rows="12"
                                className="input w-full resize-y font-mono text-sm"
                                placeholder={`Ví dụ:\n${AI_IMPORT_TEMPLATE}`}
                            />
                            <div className="flex gap-3 mt-3">
                                <button type="button" onClick={handleCreateDraftFromAi} className="btn-primary h-11 px-5 rounded-xl font-bold">
                                    Tạo nháp từ AI
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAiDraftText('')}
                                    className="h-11 px-5 rounded-xl bg-gray-100 text-gray-700 font-bold"
                                >
                                    Xóa nội dung
                                </button>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                            <p className="text-sm font-black text-gray-800 mb-2">Prompt nên dùng với GPT/Gemini</p>
                            <pre className="text-xs leading-6 text-gray-600 whitespace-pre-wrap break-words">
                                {AI_IMPORT_TEMPLATE}
                            </pre>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <SummaryCard
                        label="Tổng phiếu"
                        value={importInsights.totalImports}
                        hint="Tổng số phiếu nhập đang có"
                    />
                    <SummaryCard
                        label="Tổng giá trị"
                        value={`${formatMoney(importInsights.totalCost)} đ`}
                        hint="Tổng giá trị nhập hàng"
                        tone="bg-emerald-50"
                    />
                    <SummaryCard
                        label="Cần xử lý"
                        value={importInsights.problematicRecords.length}
                        hint="Phiếu còn thiếu dữ liệu hoặc chưa hoàn tất"
                        tone="bg-amber-50"
                    />
                    <SummaryCard
                        label="Chưa xác nhận"
                        value={importInsights.draftCount}
                        hint={`${importInsights.missingDocsCount} phiếu thiếu chứng từ, ${importInsights.unpaidCount} phiếu chưa thanh toán đủ`}
                        tone="bg-rose-50"
                    />
                </div>

                {importInsights.problematicRecords.length > 0 && (
                    <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div>
                                <h2 className="text-lg font-black text-amber-900">Phiếu cần bổ sung dữ liệu</h2>
                                <p className="text-sm text-amber-800">Đây là phần thay cho việc phải soi Google Sheet để tìm phiếu còn thiếu.</p>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-white text-amber-700 font-black text-sm">
                                {importInsights.problematicRecords.length} phiếu
                            </span>
                        </div>

                        <div className="space-y-3">
                            {importInsights.problematicRecords.map((imp) => (
                                <button
                                    key={imp.id}
                                    type="button"
                                    onClick={() => openImportDetail(imp.id)}
                                    className="w-full rounded-2xl border border-amber-200 bg-white p-4 text-left hover:border-amber-300"
                                >
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="min-w-0">
                                            <p className="font-black text-gray-900">{getSupplierLabel(imp.supplier_name)}</p>
                                            <p className="text-xs font-semibold text-gray-500 mt-1">{formatDate(imp.import_date)}</p>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {imp.issues.map((issue) => (
                                                    <span key={issue} className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                                                        {issue}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-left lg:text-right">
                                            <p className="text-lg font-black text-primary">{formatMoney(imp.total_cost)} đ</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {loadingDetail ? 'Đang mở...' : 'Bấm để bổ sung'}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                <section className="rounded-3xl border border-gray-200 bg-white p-5">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <div>
                            <h2 className="text-lg font-black text-gray-900">Danh sách phiếu nhập</h2>
                            <p className="text-sm text-gray-500">Xem toàn bộ phiếu và kiểm tra nhanh các trường còn thiếu.</p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-black text-sm">
                            {importInsights.totalImports} phiếu
                        </span>
                    </div>

                    {loading ? (
                        <div className="text-center py-16">
                            <p className="text-gray-500 font-bold">Đang tải...</p>
                        </div>
                    ) : imports.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-5xl mb-4">📥</p>
                            <p className="text-gray-600 font-bold text-lg">Chưa có nhập hàng nào</p>
                            <p className="text-gray-400 text-sm mt-2">Nhấn "+ Ghi nhận" để thêm phiếu nhập hàng</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {importInsights.records.map((imp) => (
                                <button
                                    key={imp.id}
                                    type="button"
                                    onClick={() => openImportDetail(imp.id)}
                                    className="w-full text-left bg-white rounded-2xl p-4 border border-gray-100 hover:border-primary/20 hover:shadow-sm transition"
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-black text-gray-800">{getSupplierLabel(imp.supplier_name)}</p>
                                                {imp.issues.length > 0 && (
                                                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black">
                                                        {imp.issues.length} mục cần bổ sung
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">{formatDate(imp.import_date)}</p>
                                            {imp.invoice_number && (
                                                <p className="text-xs text-gray-500 mt-1">Số hóa đơn: {imp.invoice_number}</p>
                                            )}
                                            {imp.note && (
                                                <p className="text-xs text-gray-600 mt-2 italic">{imp.note}</p>
                                            )}
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-[11px] font-bold">
                                                    Trạng thái: {(imp.status || 'draft').toUpperCase()}
                                                </span>
                                                <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-[11px] font-bold">
                                                    Chứng từ: {imp.attachment_files?.length || 0}
                                                </span>
                                                <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-[11px] font-bold">
                                                    Đã thanh toán: {formatMoney(imp.paid_amount || 0)} đ
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-black text-primary text-lg">{formatMoney(imp.total_cost)} đ</p>
                                            <p className="text-xs text-gray-400 mt-2">{loadingDetail ? 'Đang mở...' : 'Bấm để sửa'}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {showModal && (
                <ImportModal
                    importRecord={editingImport}
                    suppliers={suppliers}
                    onClose={() => {
                        setShowModal(false)
                        setEditingImport(null)
                    }}
                    onSuccess={loadImports}
                    onSupplierSaved={loadSuppliers}
                />
            )}

            {showSupplierModal && (
                <SupplierManagerModal
                    suppliers={suppliers}
                    onClose={() => setShowSupplierModal(false)}
                    onRefresh={loadSuppliers}
                />
            )}
        </div>
    )
}
