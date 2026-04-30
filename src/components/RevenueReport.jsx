import { useState } from 'react'
import { formatMoney } from '../lib/reports'
import { exportToExcel } from '../lib/export'

export default function RevenueReport({ data }) {
    const [exporting, setExporting] = useState(false)

    const handleExportExcel = async () => {
        setExporting(true)
        try {
            const reportName = `Doanh-thu-${data.month.toString().padStart(2, '0')}-${data.year}`
            await exportToExcel(data, reportName, 'revenue')
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
            <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 border border-pink-200 rounded-3xl p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-gray-600 text-sm font-bold uppercase">Tổng doanh thu</p>
                        <p className="text-3xl font-black text-primary mt-2">{formatMoney(data.totalRevenue)}</p>
                        <p className="text-xs text-gray-500 mt-1">đ</p>
                    </div>
                    <div>
                        <p className="text-gray-600 text-sm font-bold uppercase">Số lượng giao dịch</p>
                        <p className="text-3xl font-black text-gray-800 mt-2">{data.totalSales}</p>
                        <p className="text-xs text-gray-500 mt-1">hóa đơn</p>
                    </div>
                    <div>
                        <p className="text-gray-600 text-sm font-bold uppercase">Trung bình/giao dịch</p>
                        <p className="text-3xl font-black text-gray-800 mt-2">
                            {formatMoney(data.avgPerSale || Math.round(data.totalRevenue / (data.totalSales || 1)))}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">đ</p>
                    </div>
                </div>

                {data.totalVoids > 0 && (
                    <div className="mt-4 pt-4 border-t border-pink-200">
                        <p className="text-xs text-red-600 font-bold">⚠️ {data.totalVoids} giao dịch bị huỷ (không tính vào doanh thu)</p>
                    </div>
                )}
            </div>

            {/* Daily Revenue Table */}
            {data.byDay && data.byDay.length > 0 && (
                <div className="bg-white rounded-3xl border border-pink-50 shadow-sm overflow-hidden">
                    <div className="bg-pink-50 px-6 py-4 border-b border-pink-100">
                        <h3 className="font-black text-gray-800 uppercase tracking-wide">Doanh thu theo ngày</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-pink-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-black text-gray-600 uppercase">Ngày</th>
                                    <th className="px-6 py-3 text-right text-xs font-black text-gray-600 uppercase">Doanh thu</th>
                                    <th className="px-6 py-3 text-right text-xs font-black text-gray-600 uppercase">Số GD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.byDay.map(day => (
                                    <tr key={day.date} className="border-b border-pink-50 hover:bg-pink-50/50 transition">
                                        <td className="px-6 py-3 font-bold text-gray-800">
                                            {new Date(day.date + 'T00:00:00').toLocaleDateString('vi-VN', {
                                                weekday: 'short',
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-3 text-right font-black text-primary">{formatMoney(day.revenue)}</td>
                                        <td className="px-6 py-3 text-right font-bold text-gray-600">{day.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* By Payment Method */}
            <div className="bg-white rounded-3xl border border-pink-50 shadow-sm overflow-hidden">
                <div className="bg-pink-50 px-6 py-4 border-b border-pink-100">
                    <h3 className="font-black text-gray-800 uppercase tracking-wide">Theo phương thức thanh toán</h3>
                </div>

                <div className="divide-y divide-pink-50">
                    {Object.entries(data.byMethod).map(([method, info]) => (
                        <div key={method} className="p-6 hover:bg-pink-50/50 transition">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="font-black text-gray-800 capitalize">
                                        {method === 'cash' && '💵 Tiền mặt'}
                                        {method === 'transfer' && '🏦 Chuyển khoản'}
                                        {method === 'qr' && '📱 QR Code'}
                                    </p>
                                    <p className="text-sm text-gray-500 font-bold mt-1">{info.count} giao dịch</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-primary">{formatMoney(info.total)}</p>
                                    <p className="text-xs text-gray-500 font-bold">đ</p>
                                </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-primary h-full rounded-full transition-all"
                                    style={{ width: `${(info.total / data.totalRevenue) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
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

            {/* Detailed Sales List */}
            <div className="bg-white rounded-3xl border border-pink-50 shadow-sm overflow-hidden print:hidden">
                <div className="bg-pink-50 px-6 py-4 border-b border-pink-100">
                    <h3 className="font-black text-gray-800 uppercase tracking-wide">Chi tiết giao dịch</h3>
                </div>

                <div className="divide-y divide-pink-50 max-h-96 overflow-y-auto custom-scrollbar">
                    {data.rawData.map(sale => (
                        <div key={sale.id} className="p-4 flex justify-between items-center hover:bg-pink-50/50 transition">
                            <div>
                                <p className="font-bold text-gray-800">{sale.code}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {new Date(sale.sale_date).toLocaleString('vi-VN')}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-primary">{formatMoney(sale.total_amount)}</p>
                                <p className="text-xs text-gray-500 font-bold capitalize mt-1">{sale.payment_method}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
