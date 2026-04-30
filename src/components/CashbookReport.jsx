import { useState } from 'react'
import { formatMoney, formatDateVN } from '../lib/reports'
import { exportToExcel } from '../lib/export'

export default function CashbookReport({ data }) {
    const [exporting, setExporting] = useState(false)

    const handleExportExcel = async () => {
        setExporting(true)
        try {
            const reportName = `So-quy-${data.month.toString().padStart(2, '0')}-${data.year}`
            await exportToExcel(data, reportName, 'cashbook')
            alert('✅ Xuất Excel thành công!')
        } catch (err) {
            console.error('Export error:', err)
            alert('❌ Lỗi khi xuất Excel')
        } finally {
            setExporting(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-3xl p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-gray-600 text-sm font-bold uppercase">Tổng thu</p>
                        <p className="text-3xl font-black text-green-600 mt-2">{formatMoney(data.totalIn)}</p>
                        <p className="text-xs text-gray-500 mt-1">đ</p>
                    </div>
                    <div>
                        <p className="text-gray-600 text-sm font-bold uppercase">Tổng chi</p>
                        <p className="text-3xl font-black text-red-600 mt-2">{formatMoney(data.totalOut)}</p>
                        <p className="text-xs text-gray-500 mt-1">đ</p>
                    </div>
                    <div>
                        <p className="text-gray-600 text-sm font-bold uppercase">Số dư</p>
                        <p className={`text-3xl font-black mt-2 ${data.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatMoney(data.balance)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">đ</p>
                    </div>
                </div>
            </div>

            {/* Unified Transactions Table */}
            {data.transactions && data.transactions.length > 0 && (
                <div className="bg-white rounded-3xl border border-blue-100 shadow-sm overflow-hidden">
                    <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                        <h3 className="font-black text-gray-800 uppercase tracking-wide">Chi tiết giao dịch</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-blue-100">
                                <tr>
                                    <th className="px-6 py-3 text-left font-black text-gray-600 uppercase">Ngày</th>
                                    <th className="px-6 py-3 text-left font-black text-gray-600 uppercase">Thu/Chi</th>
                                    <th className="px-6 py-3 text-left font-black text-gray-600 uppercase">Nội dung</th>
                                    <th className="px-6 py-3 text-right font-black text-gray-600 uppercase">Số tiền</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-50 max-h-96 overflow-y-auto">
                                {data.transactions.map((tx, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50/50 transition">
                                        <td className="px-6 py-3 font-bold text-gray-800">
                                            {new Date(tx.date + 'T00:00:00').toLocaleDateString('vi-VN', {
                                                weekday: 'short',
                                                month: '2-digit',
                                                day: '2-digit'
                                            })}
                                        </td>
                                        <td className={`px-6 py-3 font-bold ${tx.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.type === 'in' ? '💰 Thu' : '💸 Chi'}
                                        </td>
                                        <td className="px-6 py-3 text-gray-700">{tx.description}</td>
                                        <td className={`px-6 py-3 text-right font-black ${tx.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatMoney(tx.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Cash In Section */}
            <div className="bg-white rounded-3xl border border-green-100 shadow-sm overflow-hidden">
                <div className="bg-green-50 px-6 py-4 border-b border-green-100">
                    <h3 className="font-black text-gray-800 uppercase tracking-wide">💰 Thu tiền ({data.inFlows.length})</h3>
                </div>

                <div className="divide-y divide-green-50 max-h-80 overflow-y-auto custom-scrollbar">
                    {data.inFlows.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 italic">Không có dữ liệu</div>
                    ) : (
                        data.inFlows.map(flow => (
                            <div key={flow.id} className="p-4 flex justify-between items-start hover:bg-green-50/50 transition">
                                <div>
                                    <p className="font-bold text-gray-800">{flow.description || 'Thu tiền'}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatDateVN(flow.created_at)}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1 capitalize font-bold">
                                        {flow.category}
                                    </p>
                                </div>
                                <p className="font-black text-green-600">{formatMoney(flow.amount)}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Cash Out Section */}
            <div className="bg-white rounded-3xl border border-red-100 shadow-sm overflow-hidden">
                <div className="bg-red-50 px-6 py-4 border-b border-red-100">
                    <h3 className="font-black text-gray-800 uppercase tracking-wide">💸 Chi tiền ({data.outFlows.length})</h3>
                </div>

                <div className="divide-y divide-red-50 max-h-80 overflow-y-auto custom-scrollbar">
                    {data.outFlows.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 italic">Không có dữ liệu</div>
                    ) : (
                        data.outFlows.map(flow => (
                            <div key={flow.id} className="p-4 flex justify-between items-start hover:bg-red-50/50 transition">
                                <div>
                                    <p className="font-bold text-gray-800">{flow.description || 'Chi tiền'}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatDateVN(flow.created_at)}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1 capitalize font-bold">
                                        {flow.category}
                                    </p>
                                </div>
                                <p className="font-black text-red-600">{formatMoney(flow.amount)}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleExportExcel}
                    disabled={exporting}
                    className="flex-1 btn bg-green-500 text-white font-black rounded-2xl py-3 hover:bg-green-600 disabled:opacity-50 transition"
                >
                    {exporting ? '⏳ Đang xuất...' : '📊 Xuất Excel'}
                </button>
                <button
                    onClick={handlePrint}
                    className="flex-1 btn bg-blue-500 text-white font-black rounded-2xl py-3 hover:bg-blue-600 transition"
                >
                    🖨️ In báo cáo
                </button>
            </div>
        </div>
    )
}
