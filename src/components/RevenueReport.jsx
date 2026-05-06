import { useState } from 'react'
import { formatMoney } from '../lib/reports'
import { exportToExcel } from '../lib/export'
import { 
    Printer, 
    FileSpreadsheet, 
    Wallet, 
    Bank, 
    QrCode 
} from './Icons'

export default function RevenueReport({ data }) {
    const [exporting, setExporting] = useState(false)

    const handleExportExcel = async () => {
        setExporting(true)
        try {
            const reportName = `Doanh-thu-${data.month.toString().padStart(2, '0')}-${data.year}`
            await exportToExcel(data, reportName, 'revenue')
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
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-[2rem] p-6 lg:p-8 text-white shadow-xl shadow-pink-200 relative overflow-hidden group min-w-0">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
                    <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-2">Tổng doanh thu</p>
                    <div className="flex items-baseline gap-1 lg:gap-2 flex-wrap">
                        <h4 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter break-all">{formatMoney(data.totalRevenue)}</h4>
                        <span className="text-xs font-bold text-white/60">VNĐ</span>
                    </div>
                </div>

                <div className="bg-white border-2 border-gray-100 rounded-[2rem] p-6 lg:p-8 shadow-sm hover:shadow-md transition-all min-w-0">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Số lượng giao dịch</p>
                    <div className="flex items-baseline gap-1 lg:gap-2 flex-wrap">
                        <h4 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-800 tracking-tighter break-all">{data.totalSales}</h4>
                        <span className="text-xs font-bold text-gray-400">Hóa đơn</span>
                    </div>
                </div>

                <div className="bg-white border-2 border-gray-100 rounded-[2rem] p-6 lg:p-8 shadow-sm hover:shadow-md transition-all min-w-0">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Trung bình/GD</p>
                    <div className="flex items-baseline gap-1 lg:gap-2 flex-wrap">
                        <h4 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-800 tracking-tighter break-all">
                            {formatMoney(data.avgPerSale || Math.round(data.totalRevenue / (data.totalSales || 1)))}
                        </h4>
                        <span className="text-xs font-bold text-gray-400">VNĐ</span>
                    </div>
                </div>
            </div>

            {/* Main Stats Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Daily Performance */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Doanh thu theo ngày</h3>
                        <span className="text-[10px] font-black text-primary bg-pink-50 px-3 py-1 rounded-full uppercase tracking-widest">Tháng {data.month}</span>
                    </div>

                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 sticky top-0 backdrop-blur-sm z-10">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Thời gian</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Doanh thu</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {data.byDay.map(day => (
                                        <tr key={day.date} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center font-black text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                        {day.date.split('-')[2]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800 text-sm">
                                                            {new Date(day.date + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'short' })}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 font-medium">{day.count} giao dịch</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="font-black text-gray-900">{formatMoney(day.revenue)}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Payment & Methods */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Phương thức thanh toán</h3>
                    </div>

                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 space-y-8">
                        {Object.entries(data.byMethod).map(([method, info]) => (
                            <div key={method} className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
                                            {method === 'cash' && <><Wallet className="w-4 h-4 text-green-500" /> Tiền mặt</>}
                                            {method === 'transfer' && <><Bank className="w-4 h-4 text-blue-500" /> Chuyển khoản</>}
                                            {method === 'qr' && <><QrCode className="w-4 h-4 text-purple-500" /> QR Code</>}
                                            {!['cash', 'transfer', 'qr'].includes(method) && method}
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{info.count} hóa đơn</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-gray-900">{formatMoney(info.total)}</p>
                                    </div>
                                </div>
                                <div className="h-2.5 w-full bg-gray-50 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-primary rounded-full shadow-lg shadow-pink-200 transition-all duration-1000"
                                        style={{ width: `${(info.total / data.totalRevenue) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Print/Export */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleExportExcel}
                            disabled={exporting}
                            className="bg-green-50 border-2 border-green-100 text-green-700 font-black py-4 rounded-2xl hover:bg-green-100 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            {exporting ? 'Đang xuất...' : (
                                <>
                                    <FileSpreadsheet className="w-4 h-4" />
                                    <span>Xuất Excel</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={handlePrint}
                            className="bg-blue-50 border-2 border-blue-100 text-blue-700 font-black py-4 rounded-2xl hover:bg-blue-100 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            <Printer className="w-4 h-4" />
                            <span>In báo cáo</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
