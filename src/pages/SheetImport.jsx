import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import * as XLSX from 'xlsx'
import api from '../lib/api'
import { useNotification } from '../contexts/NotificationContext'
import { FileSpreadsheet, ArrowLeft, Save } from '../components/Icons'
import './Products.css'

function toLines(text) {
    return String(text || '')
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean)
}

function toNumber(value) {
    const n = Number(String(value || '').replace(/[^\d.-]/g, ''))
    return Number.isFinite(n) ? n : 0
}

export default function SheetImport() {
    const navigate = useNavigate()
    const { showNotification } = useNotification()
    const fileInputRef = useRef(null)

    const [supplier, setSupplier] = useState('')
    const [grid, setGrid] = useState(() =>
        Array.from({ length: 20 }, () => ({ barcode: '', product_name: '', quantity: '', total: '' }))
    )
    const [loading, setLoading] = useState(false)

    const rows = useMemo(() => {
        return grid.map((r) => {
            const barcode = String(r.barcode || '').trim()
            const product_name = String(r.product_name || '').trim()
            const quantity = toNumber(r.quantity)
            const total = toNumber(r.total)
            return { barcode, product_name, quantity, total, valid: Boolean(barcode && product_name && quantity > 0 && total > 0) }
        })
    }, [grid])

    const validRows = useMemo(() => rows.filter((r) => r.valid), [rows])
    const totalQty = useMemo(() => validRows.reduce((s, r) => s + r.quantity, 0), [validRows])
    const totalCost = useMemo(() => validRows.reduce((s, r) => s + r.total, 0), [validRows])

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (evt) => {
            const wb = XLSX.read(evt.target.result, { type: 'binary' })
            const ws = wb.Sheets[wb.SheetNames[0]]
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 })
            const body = data.slice(1).filter((r) => r.length >= 1)
            setGrid(body.map((r) => ({ barcode: r[0] ?? '', product_name: r[1] ?? '', quantity: r[2] ?? '', total: r[3] ?? '' })))
            showNotification(`Đã nạp ${body.length} dòng từ file`, 'success')
        }
        reader.readAsBinaryString(file)
    }

    const updateCell = (rowIdx, key, value) => {
        setGrid((prev) => prev.map((r, i) => (i === rowIdx ? { ...r, [key]: value } : r)))
    }

    const addRow = () => setGrid((prev) => [...prev, { barcode: '', product_name: '', quantity: '', total: '' }])
    const removeRow = (idx) => setGrid((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)))

    const handleSubmit = async () => {
        if (!validRows.length) {
            showNotification('Không có dòng hợp lệ để nhập', 'error')
            return
        }

        setLoading(true)
        try {
            const productsRes = await api.get('/products')
            const existing = new Map((productsRes.data || []).map((p) => [p.barcode, p]))
            const payload = validRows.map((row) => {
                const old = existing.get(row.barcode)
                const unitPrice = Math.round(row.total / row.quantity)
                return {
                    id: old?.id || uuidv4(),
                    barcode: row.barcode,
                    name: row.product_name || old?.name || `SP ${row.barcode}`,
                    unit: old?.unit || 'Cái',
                    category: old?.category || '',
                    price: unitPrice,
                    cost_price: old?.cost_price || unitPrice,
                    stock_quantity: Number(old?.stock_quantity || 0) + row.quantity,
                    image_url: old?.image_url || null,
                    is_active: true,
                    created_at: old?.created_at || new Date().toISOString(),
                }
            })

            await api.post('/products/bulk-upsert', payload)
            await api.post('/imports', {
                import_date: new Date().toISOString().slice(0, 10),
                supplier_name: supplier.trim() || 'Nhập nhanh nội bộ',
                total_cost: Math.round(totalCost),
                note: `Import grid: ${validRows.length} dòng`,
            })
            showNotification(`Đã nhập ${validRows.length} dòng`, 'success')
            navigate('/app/products')
        } catch (err) {
            showNotification(`Lỗi nhập dữ liệu: ${err.response?.data?.error || err.message}`, 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="h-screen flex flex-col bg-white">
            <div className="bg-white border-b p-4 flex flex-col gap-3 shadow-sm z-30">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-black text-gray-800 uppercase tracking-tighter">Nhập hàng dạng sheet</h1>
                        <p className="text-xs text-gray-500 font-medium">Dán dữ liệu hoặc nạp file để nhập hàng loạt nhanh chóng</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => navigate('/app/products')} className="btn bg-gray-100 text-gray-600 px-3 text-xs font-bold h-10 rounded-xl flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" /> Quay lại
                        </button>
                        <button onClick={handleSubmit} disabled={loading || !validRows.length} className="btn-primary px-5 shadow-lg text-sm font-bold h-10 rounded-xl disabled:opacity-50 flex items-center gap-2">
                            {loading ? 'Đang lưu...' : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Lưu vào kho</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
                
                <div className="flex gap-2 items-center">
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
                    <button onClick={() => fileInputRef.current?.click()} className="btn bg-blue-50 text-blue-700 px-4 text-xs font-bold h-10 rounded-xl border border-blue-100 flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4" /> Nạp từ Excel
                    </button>
                    <input className="input flex-1 h-10 text-sm bg-gray-50 border-gray-100" placeholder="Tên nhà cung cấp (tùy chọn)" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <div className="sheet-container h-full">
                    <table className="sheet-table">
                        <thead>
                            <tr>
                                <th className="row-index">#</th>
                                <th className="col-barcode">Mã vạch (Barcode)</th>
                                <th className="col-name">Tên sản phẩm</th>
                                <th className="col-stock text-center">Số lượng</th>
                                <th className="col-price text-right">Tổng tiền nhập</th>
                            </tr>
                        </thead>
                        <tbody>
                            {grid.map((r, idx) => (
                                <tr key={idx}>
                                    <td className="row-index cursor-pointer hover:bg-red-50 hover:text-red-500" 
                                        onClick={() => removeRow(idx)}
                                        title="Nhấn để xóa dòng này"
                                    >
                                        {idx + 1}
                                    </td>
                                    <td><input className="sheet-input font-mono" value={r.barcode} onChange={(e) => updateCell(idx, 'barcode', e.target.value)} autoComplete="off" spellCheck="false" onKeyDown={(e) => e.key === 'Delete' && e.ctrlKey && removeRow(idx)} /></td>
                                    <td><input className="sheet-input" value={r.product_name} onChange={(e) => updateCell(idx, 'product_name', e.target.value)} autoComplete="off" spellCheck="false" onKeyDown={(e) => e.key === 'Delete' && e.ctrlKey && removeRow(idx)} /></td>
                                    <td><input type="number" className="sheet-input text-center" value={r.quantity} onChange={(e) => updateCell(idx, 'quantity', e.target.value)} autoComplete="off" onKeyDown={(e) => e.key === 'Delete' && e.ctrlKey && removeRow(idx)} /></td>
                                    <td><input type="number" className="sheet-input text-right" value={r.total} onChange={(e) => updateCell(idx, 'total', e.target.value)} autoComplete="off" onKeyDown={(e) => e.key === 'Delete' && e.ctrlKey && removeRow(idx)} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-gray-50 border-t p-3 flex flex-wrap items-center gap-4 text-[11px] font-black uppercase tracking-wider text-gray-500">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Hàng: {validRows.length}</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> SL: {totalQty}</span>
                <span className="flex items-center gap-1 text-primary"><div className="w-2 h-2 rounded-full bg-primary"></div> Tiền: {new Intl.NumberFormat('vi-VN').format(totalCost)}đ</span>
            </div>
        </div>
    )
}

