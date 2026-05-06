import { useMemo, useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import api from '../lib/api'
import { useNotification } from '../contexts/NotificationContext'
import SupplierFormModal from './SupplierFormModal'

function formatSupplierName(supplier) {
    return supplier?.name?.trim() || 'Nhà cung cấp chưa đặt tên'
}

function formatCurrency(val) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
}

function formatDate(value) {
    if (!value) return '--'
    return new Date(`${value}T00:00:00`).toLocaleDateString('vi-VN')
}

function normalizeHeader(header) {
    return String(header || '').trim().toLowerCase()
}

function mapSupplierRow(row = {}) {
    const pick = (...keys) => {
        for (const key of keys) {
            if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
                return row[key]
            }
        }
        return ''
    }

    return {
        name: String(pick('name', 'ten_ncc', 'ten nha cung cap', 'tên nhà cung cấp', 'nha_cung_cap', 'ncc') || '').trim(),
        phone: String(pick('phone', 'sdt', 'so dien thoai', 'số điện thoại') || '').trim(),
        address: String(pick('address', 'dia_chi', 'địa chỉ') || '').trim(),
        tax_code: String(pick('tax_code', 'mst', 'ma so thue', 'mã số thuế') || '').trim(),
        bank_account: String(pick('bank_account', 'so_tai_khoan', 'số tài khoản') || '').trim(),
        bank_name: String(pick('bank_name', 'ten_ngan_hang', 'tên ngân hàng') || '').trim(),
        note: String(pick('note', 'ghi_chu', 'ghi chú') || '').trim(),
        opening_debt: Number(pick('opening_debt', 'no_dau_ky', 'nợ đầu kỳ') || 0),
    }
}

export default function SupplierManagerModal({ suppliers, onClose, onRefresh, debtEnabled = true }) {
    const [editingSupplier, setEditingSupplier] = useState(null)
    const [showForm, setShowForm] = useState(false)

    const [debtSummary, setDebtSummary] = useState({})
    const [payingSupplier, setPayingSupplier] = useState(null)
    const [paymentAmount, setPaymentAmount] = useState('')
    const [paymentNote, setPaymentNote] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('transfer')
    const [savingPayment, setSavingPayment] = useState(false)

    const [ledgerSupplier, setLedgerSupplier] = useState(null)
    const [ledgerLoading, setLedgerLoading] = useState(false)
    const [ledgerItems, setLedgerItems] = useState([])
    const [ledgerCurrentDebt, setLedgerCurrentDebt] = useState(0)

    const [showAdjust, setShowAdjust] = useState(false)
    const [adjustDirection, setAdjustDirection] = useState('increase')
    const [adjustAmount, setAdjustAmount] = useState('')
    const [adjustReason, setAdjustReason] = useState('')
    const [savingAdjust, setSavingAdjust] = useState(false)
    const [importing, setImporting] = useState(false)

    const { showNotification } = useNotification()

    const fetchDebt = async () => {
        if (!debtEnabled) return
        try {
            const response = await api.get('/suppliers/debt')
            const summary = {}
            response.data.forEach(item => {
                summary[item.id] = item
            })
            setDebtSummary(summary)
        } catch (error) {
            console.error('Fetch debt error:', error)
        }
    }

    useEffect(() => {
        fetchDebt()
    }, [debtEnabled])

    const handleImportSuppliers = async (event) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return

        setImporting(true)
        try {
            const buffer = await file.arrayBuffer()
            const workbook = XLSX.read(buffer, { type: 'array' })
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
            const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })

            const payload = rows
                .map((raw) => {
                    const normalized = {}
                    Object.entries(raw || {}).forEach(([key, value]) => {
                        normalized[normalizeHeader(key)] = value
                    })
                    return mapSupplierRow(normalized)
                })
                .filter((item) => item.name)

            if (payload.length === 0) {
                showNotification('File không có dữ liệu nhà cung cấp hợp lệ', 'error')
                return
            }

            const response = await api.post('/suppliers/bulk-upsert', payload)
            const { created = 0, updated = 0, skipped = 0 } = response.data || {}

            await onRefresh?.()
            await fetchDebt()
            showNotification(`Import NCC xong: thêm ${created}, cập nhật ${updated}, bỏ qua ${skipped}`, 'success')
        } catch (error) {
            console.error('Import suppliers error:', error)
            showNotification(error?.response?.data?.error || 'Lỗi khi import danh sách NCC', 'error')
        } finally {
            setImporting(false)
        }
    }

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
            showNotification(error?.response?.data?.error || 'Lỗi khi xóa nhà cung cấp', 'error')
        }
    }

    const handleRecordPayment = async (e) => {
        e.preventDefault()
        if (!payingSupplier || !paymentAmount || Number(paymentAmount) <= 0) return

        setSavingPayment(true)
        try {
            await api.post('/suppliers/payments', {
                supplier_id: payingSupplier.id,
                amount: Number(paymentAmount),
                payment_method: paymentMethod,
                description: paymentNote || `Thanh toán công nợ cho ${payingSupplier.name}`
            })
            showNotification('Đã ghi nhận thanh toán thành công', 'success')
            setPayingSupplier(null)
            setPaymentAmount('')
            setPaymentNote('')
            setPaymentMethod('transfer')
            await fetchDebt()
            if (ledgerSupplier) {
                await openLedger(ledgerSupplier)
            }
        } catch (error) {
            console.error('Record payment error:', error)
            showNotification(error?.response?.data?.error || 'Lỗi khi ghi nhận thanh toán', 'error')
        } finally {
            setSavingPayment(false)
        }
    }

    const openLedger = async (supplier) => {
        setLedgerSupplier(supplier)
        setLedgerLoading(true)
        try {
            const response = await api.get(`/suppliers/${supplier.id}/ledger`)
            setLedgerItems(response.data?.items || [])
            setLedgerCurrentDebt(Number(response.data?.supplier?.current_debt || 0))
        } catch (error) {
            console.error('Load supplier ledger error:', error)
            showNotification(error?.response?.data?.error || 'Không tải được lịch sử công nợ', 'error')
            setLedgerItems([])
            setLedgerCurrentDebt(0)
        } finally {
            setLedgerLoading(false)
        }
    }

    const handleAdjustDebt = async (e) => {
        e.preventDefault()
        if (!ledgerSupplier || Number(adjustAmount) <= 0 || !adjustReason.trim()) return

        setSavingAdjust(true)
        try {
            await api.post(`/suppliers/${ledgerSupplier.id}/adjust-debt`, {
                amount: Number(adjustAmount),
                direction: adjustDirection,
                reason: adjustReason.trim()
            })
            showNotification('Đã điều chỉnh công nợ', 'success')
            setShowAdjust(false)
            setAdjustAmount('')
            setAdjustReason('')
            await fetchDebt()
            await openLedger(ledgerSupplier)
        } catch (error) {
            console.error('Adjust supplier debt error:', error)
            showNotification(error?.response?.data?.error || 'Lỗi khi điều chỉnh công nợ', 'error')
        } finally {
            setSavingAdjust(false)
        }
    }

    const ledgerTitle = useMemo(() => {
        if (!ledgerSupplier) return ''
        return formatSupplierName(ledgerSupplier)
    }, [ledgerSupplier])

    return (
        <>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
                <div className="bg-white rounded-3xl p-4 max-w-2xl w-full shadow-2xl max-h-[92vh] overflow-y-auto">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <h2 className="text-xl font-black text-gray-800">Nhà cung cấp</h2>
                        <div className="flex items-center gap-2">
                            <label className={`px-3 h-10 rounded-xl text-sm font-bold flex items-center ${importing ? 'bg-gray-200 text-gray-500' : 'bg-blue-50 text-blue-700'}`}>
                                {importing ? 'Đang import...' : 'Import file'}
                                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportSuppliers} disabled={importing} />
                            </label>
                            <button onClick={openCreate} className="btn-primary px-4 h-10 rounded-xl text-sm font-bold">
                                + Thêm
                            </button>
                        </div>
                    </div>

                    {suppliers.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">Chưa có nhà cung cấp nào</div>
                    ) : (
                        <div className="space-y-3">
                            {suppliers.map((supplier) => (
                                <div key={supplier.id} className="border border-gray-200 rounded-2xl p-4">
                                    <p className="font-black text-gray-800">{formatSupplierName(supplier)}</p>
                                    {supplier.phone && <p className="text-sm text-gray-600 mt-1">{supplier.phone}</p>}
                                    {supplier.address && <p className="text-sm text-gray-600 mt-1">{supplier.address}</p>}

                                    {debtEnabled && (
                                        <div className="mt-3 pt-3 border-t border-dashed border-gray-100">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Dư nợ hiện tại</p>
                                                    <p className={`text-sm font-black ${(debtSummary[supplier.id]?.current_debt || 0) > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                        {formatCurrency(debtSummary[supplier.id]?.current_debt || 0)}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openLedger(supplier)}
                                                        className="px-3 h-8 rounded-lg bg-blue-50 text-blue-700 text-xs font-black"
                                                    >
                                                        Lịch sử
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setPayingSupplier(supplier)
                                                            setPaymentAmount(Math.max(0, debtSummary[supplier.id]?.current_debt || 0).toString())
                                                        }}
                                                        className="px-3 h-8 rounded-lg bg-pink-50 text-primary text-xs font-black"
                                                    >
                                                        Trả nợ
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => openEdit(supplier)}
                                            className="px-3 h-9 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold"
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            onClick={() => handleDelete(supplier)}
                                            className="px-3 h-9 rounded-xl bg-red-50 text-red-600 text-sm font-bold"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pt-4">
                        <button type="button" onClick={onClose} className="w-full btn bg-gray-100 text-gray-700 font-black rounded-xl">
                            Đóng
                        </button>
                    </div>
                </div>
            </div>

            {showForm && (
                <SupplierFormModal
                    supplier={editingSupplier}
                    debtEnabled={debtEnabled}
                    onClose={() => setShowForm(false)}
                    onSuccess={async () => {
                        await onRefresh?.()
                        await fetchDebt()
                        setShowForm(false)
                    }}
                />
            )}

            {debtEnabled && payingSupplier && (
                <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[70] p-0 sm:p-4">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 w-full max-w-lg shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-black text-gray-800">Thanh toán công nợ</h2>
                            <button onClick={() => setPayingSupplier(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">×</button>
                        </div>

                        <form onSubmit={handleRecordPayment} className="space-y-4">
                            <div className="bg-gray-50 rounded-xl p-3">
                                <p className="text-xs text-gray-500">Nhà cung cấp</p>
                                <p className="font-black text-gray-800">{payingSupplier.name}</p>
                                <p className="text-sm font-black text-red-500 mt-1">Nợ: {formatCurrency(debtSummary[payingSupplier.id]?.current_debt || 0)}</p>
                            </div>

                            <input
                                type="number"
                                required
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="input w-full text-xl font-black"
                                placeholder="Số tiền trả"
                            />

                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="input w-full"
                            >
                                <option value="transfer">Chuyển khoản</option>
                                <option value="cash">Tiền mặt</option>
                                <option value="mixed">Kết hợp</option>
                            </select>

                            <textarea
                                rows="2"
                                value={paymentNote}
                                onChange={(e) => setPaymentNote(e.target.value)}
                                className="input w-full resize-none"
                                placeholder="Ghi chú"
                            />

                            <div className="flex gap-2">
                                <button type="button" onClick={() => setPayingSupplier(null)} className="flex-1 btn bg-gray-100 text-gray-600 font-black rounded-xl">Hủy</button>
                                <button type="submit" disabled={savingPayment} className="flex-[1.6] btn bg-primary text-white font-black rounded-xl disabled:opacity-50">
                                    {savingPayment ? 'Đang lưu...' : 'Xác nhận'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {debtEnabled && ledgerSupplier && (
                <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[75] p-0 sm:p-4">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl p-4 w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <div>
                                <h3 className="text-lg font-black text-gray-800">Công nợ NCC</h3>
                                <p className="text-sm text-gray-500">{ledgerTitle}</p>
                            </div>
                            <button onClick={() => setLedgerSupplier(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">×</button>
                        </div>

                        <div className="rounded-2xl border border-red-100 bg-red-50 p-3 mb-3">
                            <p className="text-xs text-gray-500">Dư nợ hiện tại</p>
                            <p className={`text-xl font-black ${ledgerCurrentDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(ledgerCurrentDebt)}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <button onClick={() => setShowAdjust(true)} className="h-10 rounded-xl bg-amber-50 text-amber-700 text-sm font-black">Điều chỉnh</button>
                            <button onClick={() => { setLedgerSupplier(null); setPayingSupplier(ledgerSupplier); setPaymentAmount(Math.max(0, ledgerCurrentDebt).toString()) }} className="h-10 rounded-xl bg-pink-50 text-primary text-sm font-black">Trả nợ</button>
                        </div>

                        {ledgerLoading ? (
                            <div className="py-8 text-center text-gray-500">Đang tải lịch sử...</div>
                        ) : ledgerItems.length === 0 ? (
                            <div className="py-8 text-center text-gray-500">Chưa có phát sinh công nợ</div>
                        ) : (
                            <div className="space-y-2">
                                {ledgerItems.map((item) => (
                                    <div key={item.ref_id} className="rounded-xl border border-gray-100 p-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-xs font-bold text-gray-500 uppercase">{item.tx_type}</p>
                                            <p className="text-xs text-gray-500">{formatDate(item.tx_date)}</p>
                                        </div>
                                        <p className="text-sm text-gray-700 mt-1">{item.note || '-'}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-xs text-red-500 font-bold">+{formatCurrency(item.increase_amount || 0)}</p>
                                            <p className="text-xs text-green-600 font-bold">-{formatCurrency(item.decrease_amount || 0)}</p>
                                        </div>
                                        <p className="text-sm font-black text-gray-800 mt-1">Số dư: {formatCurrency(item.running_debt || 0)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {debtEnabled && showAdjust && ledgerSupplier && (
                <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[80] p-0 sm:p-4">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl p-4 w-full max-w-lg shadow-2xl">
                        <h3 className="text-lg font-black text-gray-800 mb-3">Điều chỉnh công nợ</h3>
                        <form onSubmit={handleAdjustDebt} className="space-y-3">
                            <select className="input w-full" value={adjustDirection} onChange={(e) => setAdjustDirection(e.target.value)}>
                                <option value="increase">Tăng công nợ</option>
                                <option value="decrease">Giảm công nợ</option>
                            </select>
                            <input className="input w-full" type="number" min="1" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} placeholder="Số tiền" required />
                            <textarea className="input w-full resize-none" rows="3" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="Lý do điều chỉnh" required />
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowAdjust(false)} className="flex-1 btn bg-gray-100 text-gray-700 font-black rounded-xl">Hủy</button>
                                <button type="submit" disabled={savingAdjust} className="flex-[1.6] btn bg-amber-500 text-white font-black rounded-xl disabled:opacity-50">
                                    {savingAdjust ? 'Đang lưu...' : 'Xác nhận điều chỉnh'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
