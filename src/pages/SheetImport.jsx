import { useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import api from '../lib/api'
import { useNotification } from '../contexts/NotificationContext'

function parseLines(raw) {
    const lines = raw
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean)

    const rows = []

    for (const line of lines) {
        const cols = line.includes('\t')
            ? line.split('\t')
            : line.split(',')

        if (cols.length < 4) continue

        const barcode = String(cols[0] || '').trim()
        const name = String(cols[1] || '').trim()
        const qty = Number(String(cols[2] || '').replace(/[^\d.-]/g, ''))
        const total = Number(String(cols[3] || '').replace(/[^\d.-]/g, ''))

        if (!barcode || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(total) || total <= 0) continue

        rows.push({
            barcode,
            name,
            qty,
            total,
            unitPrice: Math.round(total / qty),
        })
    }

    return rows
}

export default function SheetImport() {
    const { showNotification } = useNotification()
    const [supplier, setSupplier] = useState('')
    const [raw, setRaw] = useState('')
    const [loading, setLoading] = useState(false)

    const parsed = useMemo(() => parseLines(raw), [raw])
    const totalCost = useMemo(() => parsed.reduce((s, x) => s + x.total, 0), [parsed])
    const totalQty = useMemo(() => parsed.reduce((s, x) => s + x.qty, 0), [parsed])

    const runPool = async (items, worker, concurrency = 10) => {
        let i = 0
        const run = async () => {
            while (i < items.length) {
                const idx = i++
                await worker(items[idx], idx)
            }
        }
        await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => run()))
    }

    const handleSubmit = async () => {
        if (parsed.length === 0) {
            showNotification('Không có dòng hợp lệ để nhập', 'error')
            return
        }

        setLoading(true)
        try {
            const productsRes = await api.get('/products')
            const existing = new Map((productsRes.data || []).map((p) => [p.barcode, p]))

            await runPool(parsed, async (row) => {
                const old = existing.get(row.barcode)
                const nextStock = Number(old?.stock_quantity || 0) + row.qty
                const payload = {
                    id: old?.id || uuidv4(),
                    barcode: row.barcode,
                    name: row.name || old?.name || `SP ${row.barcode}`,
                    unit: old?.unit || 'Cái',
                    category: old?.category || '',
                    price: row.unitPrice,
                    cost_price: old?.cost_price || row.unitPrice,
                    stock_quantity: nextStock,
                    image_url: old?.image_url || null,
                    is_active: true,
                    created_at: old?.created_at || new Date().toISOString(),
                }
                await api.post('/products/upsert', payload)
                existing.set(row.barcode, { ...payload })
            }, 12)

            await api.post('/imports', {
                import_date: new Date().toISOString().slice(0, 10),
                supplier_name: supplier.trim() || 'Nhap tu sheet',
                total_cost: Math.round(totalCost),
                note: `Sheet import: ${parsed.length} dong`,
            })

            showNotification(`Đã nhập ${parsed.length} dòng / ${totalQty} SP`, 'success')
            setRaw('')
        } catch (err) {
            showNotification(`Lỗi nhập sheet: ${err.response?.data?.error || err.message}`, 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 pb-24">
            <div className="max-w-5xl mx-auto space-y-4">
                <div className="bg-white border rounded-2xl p-4 md:p-5">
                    <h1 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-tight">Nhập Dữ Liệu Từ Sheet</h1>
                    <p className="text-sm text-gray-500 mt-1">Dán theo cột: `barcode` TAB `tên` TAB `số lượng` TAB `thành tiền`</p>
                </div>

                <div className="bg-white border rounded-2xl p-4 md:p-5 space-y-3">
                    <input
                        className="input w-full"
                        placeholder="Nhà cung cấp (tuỳ chọn)"
                        value={supplier}
                        onChange={(e) => setSupplier(e.target.value)}
                    />

                    <textarea
                        className="input w-full min-h-[320px] font-mono text-sm"
                        placeholder={'8938505962022\tBim bim Oishi\t5\t75000\n8931234567890\tNuoc ngot lon\t12\t144000'}
                        value={raw}
                        onChange={(e) => setRaw(e.target.value)}
                    />

                    <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-bold">Dòng hợp lệ: {parsed.length}</span>
                        <span className="px-3 py-1.5 rounded-full bg-green-50 text-green-700 font-bold">Tổng SL: {totalQty}</span>
                        <span className="px-3 py-1.5 rounded-full bg-pink-50 text-pink-700 font-bold">
                            Tổng tiền: {new Intl.NumberFormat('vi-VN').format(totalCost)}đ
                        </span>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleSubmit}
                            disabled={loading || parsed.length === 0}
                            className="btn-primary h-11 px-5 disabled:opacity-50"
                        >
                            {loading ? 'Đang nhập...' : 'Nhập vào hệ thống'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

