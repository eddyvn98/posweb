import { useState } from 'react'
import { formatMoney, formatDateVN } from '../lib/reports'
import { exportToExcel } from '../lib/export'
import { FileSpreadsheet, Printer } from './Icons'

export default function CashbookReport({ data }) {
    const [exporting, setExporting] = useState(false)

    const handleExportExcel = async () => {
        setExporting(true)
        try {
            const reportName = `So-quy-${data.month.toString().padStart(2, '0')}-${data.year}`
            await exportToExcel(data, reportName, 'cashbook')
        } catch (err) {
            console.error('Export error:', err)
        } finally {
            setExporting(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="space-y-10">
            {/* Cashflow Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                <div className="bg-white border-2 border-green-100 rounded-[2rem] p-6 lg:p-8 shadow-sm hover:shadow-md transition-all relative overflow-hidden group min-w-0">
                    <div className="absolute right-0 top-0 w-20 h-20 bg-green-50 rounded-bl-[3rem] -mr-6 -mt-6 group-hover:scale-110 transition-transform"></div>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Tổng thu</p>
                    <div className="flex items-baseline gap-1 relative z-10 flex-wrap">
                        <h4 className="text-2xl sm:text-3xl font-black text-green-600 tracking-tighter break-all">{formatMoney(data.totalIn)}</h4>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">đ</span>
                    </div>
                </div>

                <div className="bg-white border-2 border-red-100 rounded-[2rem] p-6 lg:p-8 shadow-sm hover:shadow-md transition-all relative overflow-hidden group min-w-0">
                    <div className="absolute right-0 top-0 w-20 h-20 bg-red-50 rounded-bl-[3rem] -mr-6 -mt-6 group-hover:scale-110 transition-transform"></div>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Tổng chi</p>
                    <div className="flex items-baseline gap-1 relative z-10 flex-wrap">
                        <h4 className="text-2xl sm:text-3xl font-black text-red-600 tracking-tighter break-all">{formatMoney(data.totalOut)}</h4>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">đ</span>
                    </div>
                </div>

                <div className={`rounded-[2rem] p-6 lg:p-8 shadow-xl relative overflow-hidden group min-w-0 ${data.balance >= 0 ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}>
                    <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-2">Số dư hiện tại</p>
                    <div className="flex items-baseline gap-1 relative z-10 flex-wrap">
                        <h4 className="text-2xl sm:text-3xl font-black tracking-tighter break-all">{formatMoney(data.balance)}</h4>
                        <span className="text-[10px] font-bold text-white/40 uppercase">đ</span>
                    </div>
                </div>
            </div>

            {/* Unified Timeline */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Dòng tiền chi tiết</h3>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 sticky top-0 backdrop-blur-sm z-10">
                                <tr>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Thời gian</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Nội dung</th>
                                    <th className="px-6 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Số tiền</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.transactions.map((tx, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${tx.type === 'in' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                    {tx.type === 'in' ? '+' : '-'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm">
                                                        {new Date(tx.date + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-sm font-bold text-gray-700">{tx.description}</p>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{tx.category || (tx.type === 'in' ? 'Thu nhập' : 'Chi phí')}</p>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <p className={`font-black text-base ${tx.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.type === 'in' ? '+' : ''}{formatMoney(tx.amount)}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {data.transactions.length === 0 && (
                            <div className="py-20 text-center text-gray-400 italic font-medium">Chưa có giao dịch phát sinh trong kỳ</div>
                        )}
                    </div>
                </div>
            </div>

            {/* In/Out Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Cash In List */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-2 h-6 bg-green-500 rounded-full"></div>
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Phân tích khoản thu</h3>
                    </div>
                    <div className="bg-white rounded-[2rem] border border-gray-100 p-2 overflow-hidden">
                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                            {data.inFlows.map(flow => (
                                <div key={flow.id} className="p-4 flex justify-between items-center hover:bg-green-50/50 rounded-2xl transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 text-xs">💰</div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{flow.description}</p>
                                            <p className="text-[9px] text-gray-400 font-black uppercase">{formatDateVN(flow.created_at)}</p>
                                        </div>
                                    </div>
                                    <p className="font-black text-green-600 text-sm">{formatMoney(flow.amount)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Cash Out List */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-2 h-6 bg-red-500 rounded-full"></div>
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Phân tích khoản chi</h3>
                    </div>
                    <div className="bg-white rounded-[2rem] border border-gray-100 p-2 overflow-hidden">
                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                            {data.outFlows.map(flow => (
                                <div key={flow.id} className="p-4 flex justify-between items-center hover:bg-red-50/50 rounded-2xl transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600 text-xs">💸</div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{flow.description}</p>
                                            <p className="text-[9px] text-gray-400 font-black uppercase">{formatDateVN(flow.created_at)}</p>
                                        </div>
                                    </div>
                                    <p className="font-black text-red-600 text-sm">{formatMoney(flow.amount)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4">
                <button
                    onClick={handleExportExcel}
                    disabled={exporting}
                    className="flex-1 bg-white border-2 border-gray-100 text-gray-800 font-black py-4 rounded-2xl hover:bg-gray-50 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                    {exporting ? 'Đang xuất...' : (
                        <>
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>Xuất file Excel</span>
                        </>
                    )}
                </button>
                <button
                    onClick={handlePrint}
                    className="flex-1 bg-gray-900 text-white font-black py-4 rounded-2xl hover:bg-black transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                    <Printer className="w-4 h-4" />
                    <span>In sổ quỹ</span>
                </button>
            </div>
        </div>
    )
}
