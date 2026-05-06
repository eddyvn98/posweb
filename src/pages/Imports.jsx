import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import ImportModal from '../components/ImportModal'
import SupplierManagerModal from '../components/SupplierManagerModal'
import { useNotification } from '../contexts/NotificationContext'
import { Brain, Copy, Camera, Zap, X, LinkIcon, Package } from '../components/Icons'
import { FEATURE_KEYS, hasFeatureEnabled } from '../lib/featureFlags'

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
    const navigate = useNavigate()
    const { shop, isGuest } = useAuth()
    const { showNotification } = useNotification()
    const [imports, setImports] = useState([])
    const [suppliers, setSuppliers] = useState([])
    const [loading, setLoading] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [loadingDetail, setLoadingDetail] = useState(false)
    const [editingImport, setEditingImport] = useState(null)
    const [showSupplierModal, setShowSupplierModal] = useState(false)
    const [aiDraftText, setAiDraftText] = useState('')
    const isSupplierDebtEnabled = hasFeatureEnabled(shop?.feature_flags, FEATURE_KEYS.SUPPLIER_DEBT)

    const loadImports = async () => {
        if (!shop?.id) return
        if (isGuest) {
            setImports([])
            setLoading(false)
            return
        }

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
        if (isGuest) {
            setSuppliers([])
            return
        }

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
            <div className="bg-white shadow-sm px-4 py-3 md:py-4 sticky top-0 z-10 border-b">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                    <div>
                        <h1 className="text-xl font-black text-gray-800 uppercase tracking-tighter">Nhập hàng</h1>
                        <p className="hidden md:block text-sm text-gray-500 font-medium mt-0.5">Theo dõi nhanh phiếu nhập và dữ liệu còn thiếu ngay trong web</p>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide -mx-1 px-1">
                        <button
                            onClick={() => navigate('/app/imports-sheet')}
                            className="shrink-0 px-4 shadow-sm text-xs font-bold h-10 rounded-xl bg-blue-50 text-blue-700 whitespace-nowrap active:scale-95 transition-transform"
                        >
                            Nhập file/sheet
                        </button>
                        <button
                            onClick={() => setShowSupplierModal(true)}
                            className="shrink-0 px-4 shadow-sm text-xs font-bold h-10 rounded-xl bg-gray-100 text-gray-700 whitespace-nowrap active:scale-95 transition-transform"
                        >
                            Nhà cung cấp
                        </button>
                        <button
                            onClick={() => {
                                setEditingImport(null)
                                setShowModal(true)
                            }}
                            className="shrink-0 btn-primary px-4 shadow-lg text-xs font-bold h-10 rounded-xl whitespace-nowrap active:scale-95 transition-transform"
                        >
                            + Ghi nhận
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* ✨ REDESIGNED AI IMPORT SECTION */}
                <section className="rounded-3xl border border-primary/10 bg-white p-4 md:p-6 shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-opacity group-hover:opacity-10">
                        <Brain className="w-24 h-24 md:w-32 md:h-32 text-primary" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <Brain className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">Dán dữ liệu từ GPT / Gemini</h2>
                                <p className="text-sm text-gray-500 font-medium">Chụp ảnh hóa đơn và để AI soạn phiếu giúp bạn</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6">
                            {/* Step 1: Get data from AI */}
                            <div className="flex flex-col">
                                <div className="bg-gray-50 rounded-2xl p-4 md:p-5 border border-gray-100 flex-1 flex flex-col">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                        BƯỚC 1: LẤY DỮ LIỆU TỪ AI
                                    </p>
                                    
                                    <div className="space-y-4 flex-1">
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 shadow-sm">1</div>
                                            <div className="space-y-2">
                                                <p className="text-sm text-gray-600 leading-relaxed font-bold">
                                                    Mở trang web AI và gửi ảnh hóa đơn/PDF:
                                                </p>
                                                <div className="flex flex-wrap gap-2 py-1">
                                                    <a href="https://chatgpt.com" target="_blank" rel="noreferrer" className="h-9 px-3 rounded-xl bg-white border border-gray-200 text-xs font-bold flex items-center gap-2 hover:border-primary/30 hover:shadow-md transition-all">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> ChatGPT
                                                        <LinkIcon className="w-3 h-3 opacity-30" />
                                                    </a>
                                                    <a href="https://gemini.google.com" target="_blank" rel="noreferrer" className="h-9 px-3 rounded-xl bg-white border border-gray-200 text-xs font-bold flex items-center gap-2 hover:border-primary/30 hover:shadow-md transition-all">
                                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> Gemini
                                                        <LinkIcon className="w-3 h-3 opacity-30" />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 shadow-sm">2</div>
                                            <div className="space-y-3 flex-1">
                                                <p className="text-sm text-gray-600 leading-relaxed font-bold">
                                                    Copy mẫu Prompt và dán kèm theo ảnh:
                                                </p>
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(AI_IMPORT_TEMPLATE);
                                                        showNotification('Đã copy mẫu Prompt', 'success');
                                                    }}
                                                    className="w-full h-11 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg hover:bg-black"
                                                >
                                                    <Copy className="w-4 h-4" /> Copy mẫu Prompt
                                                </button>
                                                <div className="flex items-center gap-2 text-[10px] text-orange-500 font-black uppercase tracking-tighter bg-orange-50 p-2 rounded-lg border border-orange-100">
                                                    <Camera className="w-3.5 h-3.5" /> Quan trọng: Phải đính kèm ảnh hóa đơn
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: Paste and Create */}
                            <div className="flex flex-col">
                                <div className="bg-primary/[0.03] rounded-2xl p-4 md:p-5 border border-primary/10 flex-1 flex flex-col">
                                    <p className="text-[10px] font-black text-primary/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/30"></span>
                                        BƯỚC 2: DÁN KẾT QUẢ VÀO ĐÂY
                                    </p>
                                    
                                    <div className="relative flex-1 flex flex-col">
                                        <textarea
                                            value={aiDraftText}
                                            onChange={(e) => setAiDraftText(e.target.value)}
                                            className="flex-1 w-full min-h-[160px] bg-white border-2 border-dashed border-gray-200 rounded-2xl p-4 text-xs font-mono focus:border-primary/40 focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none shadow-inner"
                                            placeholder="Kết quả AI (JSON) dán vào đây..."
                                        />
                                        {aiDraftText && (
                                            <button 
                                                onClick={() => setAiDraftText('')}
                                                className="absolute top-2 right-2 p-1.5 bg-gray-100 text-gray-400 rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                        
                                        <div className="mt-4">
                                            <button 
                                                disabled={!aiDraftText.trim()}
                                                onClick={handleCreateDraftFromAi}
                                                className={`w-full h-12 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
                                                    aiDraftText.trim() 
                                                    ? 'bg-primary text-white shadow-primary/30 hover:shadow-primary/40' 
                                                    : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
                                                }`}
                                            >
                                                <Zap className={`w-5 h-5 ${aiDraftText.trim() ? 'animate-pulse' : ''}`} /> Tạo phiếu nháp từ AI
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                            <div className="flex justify-center mb-6">
                                <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200 shadow-inner">
                                    <Package className="w-12 h-12" strokeWidth={1.5} />
                                </div>
                            </div>
                            <p className="text-gray-600 font-black text-xl tracking-tight">Chưa có nhập hàng nào</p>
                            <p className="text-gray-400 text-sm mt-2 font-medium">Nhấn "+ Ghi nhận" để bắt đầu thêm phiếu nhập đầu tiên</p>
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
                    debtEnabled={isSupplierDebtEnabled}
                />
            )}
        </div>
    )
}
