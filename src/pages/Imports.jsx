import { useMemo, useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import ImportModal from '../components/ImportModal'
import SupplierManagerModal from '../components/SupplierManagerModal'
import { useNotification } from '../contexts/NotificationContext'
import { 
    Download, 
    Sparkles, 
    Search, 
    ChevronDown, 
    ChevronUp, 
    Plus, 
    Users, 
    AlertCircle, 
    Package, 
    CheckCircle2, 
    Copy,
    Trash2,
    FileText
} from 'lucide-react'

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

function SummaryCard({ label, value, hint, tone = 'bg-white', icon: Icon, iconColor = 'text-primary' }) {
    return (
        <div className={`rounded-3xl border border-gray-100 p-4 shadow-sm transition hover:shadow-md ${tone}`}>
            <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-wider text-gray-400">{label}</p>
                {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-gray-900">{value}</p>
            {hint && <p className="mt-1 text-xs font-medium text-gray-500">{hint}</p>}
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
    const str = typeof value === 'string' ? value.replace(',', '.') : value
    const parsed = Number(str || 0)
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
    const [showAiTool, setShowAiTool] = useState(false)

    // Search and Filter states
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'problem' | 'confirmed' | 'draft'

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

    // Filtered records based on query and status filter
    const filteredRecords = useMemo(() => {
        return importInsights.records.filter((rec) => {
            const q = searchQuery.trim().toLowerCase()
            const matchesQuery = !q || 
                (rec.supplier_name || '').toLowerCase().includes(q) || 
                (rec.invoice_number || '').toLowerCase().includes(q) ||
                (rec.note || '').toLowerCase().includes(q)

            if (!matchesQuery) return false

            if (statusFilter === 'problem') return rec.issues.length > 0
            if (statusFilter === 'confirmed') return (rec.status || 'draft') === 'confirmed'
            if (statusFilter === 'draft') return (rec.status || 'draft') !== 'confirmed'

            return true
        })
    }, [importInsights.records, searchQuery, statusFilter])

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm p-4 sticky top-0 z-10 border-b">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <Package className="w-6 h-6 text-primary" /> Nhập hàng
                        </h1>
                        <p className="text-xs text-gray-500 font-medium">Quản lý phiếu nhập kho & theo dõi dữ liệu hóa đơn</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => setShowSupplierModal(true)}
                            className="flex-1 sm:flex-initial px-3 sm:px-4 shadow-sm text-xs sm:text-sm font-bold h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition flex items-center justify-center gap-1.5"
                        >
                            <Users className="w-4 h-4" /> Nhà cung cấp
                        </button>
                        <button
                            onClick={() => {
                                setEditingImport(null)
                                setShowModal(true)
                            }}
                            className="btn-primary flex-1 sm:flex-initial px-4 shadow-lg text-xs sm:text-sm font-bold h-10 rounded-xl flex items-center justify-center gap-1"
                        >
                            <Plus className="w-4 h-4" /> Ghi nhận
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* AI Import Collapsible Section */}
                <section className="rounded-3xl border border-primary/20 bg-white shadow-sm overflow-hidden transition-all">
                    <button
                        type="button"
                        onClick={() => setShowAiTool(!showAiTool)}
                        className="w-full p-4 sm:p-5 flex items-center justify-between bg-gradient-to-r from-sky-50/50 to-white hover:bg-sky-50 transition text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                                <Sparkles className="w-5 h-5 animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                                    Nhập hàng nhanh bằng AI (GPT / Gemini)
                                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-bold">Mới</span>
                                </h2>
                                <p className="text-xs text-gray-500">Dán dữ liệu hóa đơn JSON từ AI để tạo phiếu tự động</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 font-bold text-xs">
                            <span>{showAiTool ? 'Thu gọn' : 'Mở công cụ'}</span>
                            {showAiTool ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                    </button>

                    {showAiTool && (
                        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/50 space-y-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between bg-white p-4 rounded-2xl border border-gray-200">
                                <div className="max-w-2xl">
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        Chụp ảnh hoặc upload hóa đơn lên AI (ChatGPT/Gemini), copy mẫu prompt dưới đây rồi dán JSON kết quả vào ô bên dưới.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(AI_IMPORT_TEMPLATE)
                                        showNotification('Đã copy mẫu prompt AI!', 'success')
                                    }}
                                    className="h-9 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center gap-1.5 shrink-0"
                                >
                                    <Copy className="w-3.5 h-3.5" /> Copy mẫu Prompt
                                </button>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-2">Kết quả JSON từ AI</label>
                                    <textarea
                                        value={aiDraftText}
                                        onChange={(e) => setAiDraftText(e.target.value)}
                                        rows="8"
                                        className="input w-full resize-y font-mono text-xs sm:text-sm bg-white p-3 rounded-xl border border-gray-200 focus:ring-primary focus:border-primary"
                                        placeholder={`Ví dụ:\n${AI_IMPORT_TEMPLATE}`}
                                    />
                                    <div className="flex gap-3 mt-3">
                                        <button type="button" onClick={handleCreateDraftFromAi} className="btn-primary h-10 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5">
                                            <Sparkles className="w-4 h-4" /> Tạo nháp từ AI
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAiDraftText('')}
                                            className="h-10 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center gap-1"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Xóa nội dung
                                        </button>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                    <p className="text-xs font-black text-gray-800 mb-2 flex items-center gap-1">
                                        <FileText className="w-4 h-4 text-primary" /> Mẫu prompt tiêu chuẩn
                                    </p>
                                    <pre className="text-[11px] leading-5 text-gray-600 whitespace-pre-wrap break-words bg-gray-50 p-3 rounded-xl border border-gray-100 font-mono">
                                        {AI_IMPORT_TEMPLATE}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <SummaryCard
                        label="Tổng phiếu"
                        value={importInsights.totalImports}
                        hint="Phiếu nhập kho"
                        icon={Package}
                        iconColor="text-sky-500"
                    />
                    <SummaryCard
                        label="Tổng giá trị"
                        value={`${formatMoney(importInsights.totalCost)} đ`}
                        hint="Chi phí nhập"
                        tone="bg-emerald-50/50"
                        icon={Download}
                        iconColor="text-emerald-500"
                    />
                    <SummaryCard
                        label="Cần bổ sung"
                        value={importInsights.problematicRecords.length}
                        hint="Thiếu thông tin"
                        tone="bg-amber-50/50"
                        icon={AlertCircle}
                        iconColor="text-amber-500"
                    />
                    <SummaryCard
                        label="Chưa xác nhận"
                        value={importInsights.draftCount}
                        hint={`${importInsights.unpaidCount} chưa thanh toán đủ`}
                        tone="bg-purple-50/50"
                        icon={CheckCircle2}
                        iconColor="text-purple-500"
                    />
                </div>

                {/* Search and Filters Section */}
                <div className="bg-white rounded-2xl border border-gray-200 p-3 sm:p-4 flex flex-col sm:flex-row gap-3 justify-between items-center shadow-sm">
                    <div className="relative w-full sm:w-80">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm tên NCC, số hóa đơn, ghi chú..."
                            className="w-full h-10 pl-9 pr-8 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-primary focus:border-primary focus:bg-white transition outline-none"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-xs"
                                title="Xóa từ khóa"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                        {[
                            { id: 'all', label: 'Tất cả' },
                            { id: 'problem', label: `Cần xử lý (${importInsights.problematicRecords.length})` },
                            { id: 'confirmed', label: 'Đã xác nhận' },
                            { id: 'draft', label: 'Chưa xác nhận' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id)}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition ${
                                    statusFilter === tab.id
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Import Records List */}
                <section className="rounded-3xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <div>
                            <h2 className="text-base sm:text-lg font-black text-gray-900">Danh sách phiếu nhập</h2>
                            <p className="text-xs text-gray-500">Hiển thị {filteredRecords.length} trên tổng số {importInsights.totalImports} phiếu</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-16">
                            <p className="text-gray-500 font-bold text-sm">Đang tải phiếu nhập...</p>
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-600 font-bold text-sm">
                                {searchQuery || statusFilter !== 'all' ? 'Không tìm thấy phiếu phù hợp' : 'Chưa có phiếu nhập hàng nào'}
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                                {searchQuery || statusFilter !== 'all' ? 'Thử đổi từ khóa hoặc bộ lọc' : 'Nhấn nút "+ Ghi nhận" để tạo phiếu mới'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredRecords.map((imp) => (
                                <button
                                    key={imp.id}
                                    type="button"
                                    onClick={() => openImportDetail(imp.id)}
                                    className="w-full text-left bg-white rounded-2xl p-4 border border-gray-100 hover:border-primary/30 hover:shadow-md transition group"
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-black text-gray-800 text-sm sm:text-base group-hover:text-primary transition">
                                                    {getSupplierLabel(imp.supplier_name)}
                                                </p>
                                                {imp.issues.length > 0 && (
                                                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                                                        {imp.issues.length} mục thiếu
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">{formatDate(imp.import_date)}</p>
                                            {imp.invoice_number && (
                                                <p className="text-xs text-gray-500 mt-0.5">Số HĐ: {imp.invoice_number}</p>
                                            )}
                                            {imp.note && (
                                                <p className="text-xs text-gray-600 mt-1.5 italic line-clamp-1">{imp.note}</p>
                                            )}
                                            
                                            {/* Badges */}
                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                    (imp.status || 'draft') === 'confirmed' 
                                                        ? 'bg-emerald-100 text-emerald-800' 
                                                        : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {(imp.status || 'draft').toUpperCase()}
                                                </span>
                                                <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold">
                                                    Chứng từ: {imp.attachment_files?.length || 0}
                                                </span>
                                                <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold">
                                                    Đã trả: {formatMoney(imp.paid_amount || 0)} đ
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-black text-primary text-base sm:text-lg">{formatMoney(imp.total_cost)} đ</p>
                                            <p className="text-[11px] text-gray-400 mt-1 font-medium">{loadingDetail ? 'Đang mở...' : 'Bấm để sửa'}</p>
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
