import { useState } from 'react'
import { formatMoney, parseLocalDateString } from '../lib/reports'
import { exportToExcel } from '../lib/export'
import InvoiceModal from './InvoiceModal'
import { 
    AlertTriangle, 
    Banknote, 
    Landmark, 
    QrCode, 
    FileSpreadsheet, 
    Printer, 
    Loader2,
    TrendingUp,
    Sparkles,
    Coins,
    ChevronRight,
    X,
    Eye,
    Receipt,
    MousePointerClick
} from 'lucide-react'

export default function RevenueReport({ data, isProMode = false }) {
    const [exporting, setExporting] = useState(false)
    const [selectedDate, setSelectedDate] = useState(null)
    const [viewInvoiceSale, setViewInvoiceSale] = useState(null)

    const handleExportExcel = async () => {
        setExporting(true)
        try {
            const reportName = `Doanh-thu-${data.month.toString().padStart(2, '0')}-${data.year}`
            await exportToExcel(data, reportName, 'revenue')
            alert('Xuất Excel thành công!')
        } catch (err) {
            console.error('Export error:', err)
            alert('Lỗi khi xuất Excel')
        } finally {
            setExporting(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const handleRowClick = (dayDate) => {
        if (selectedDate === dayDate) {
            setSelectedDate(null)
        } else {
            setSelectedDate(dayDate)
            setTimeout(() => {
                const el = document.getElementById('sales-detail-section')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }, 100)
        }
    }

    const filteredSales = selectedDate 
        ? data.rawData.filter(sale => !sale.is_void && parseLocalDateString(sale) === selectedDate)
        : data.rawData.filter(sale => !sale.is_void)

    return (
        <div className="space-y-6">
            {/* PRO Mode Banner if active */}
            {isProMode && (
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-3xl p-4 sm:p-5 shadow-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                            <Sparkles className="w-6 h-6 text-yellow-200 animate-spin" style={{ animationDuration: '6s' }} />
                        </div>
                        <div>
                            <p className="font-black text-sm sm:text-base uppercase tracking-wider">Chế độ PRO Lợi Nhuận: Đang Kích Hoạt</p>
                            <p className="text-xs text-amber-100 font-medium">Thống kê chi tiết doanh thu, giá vốn và lợi nhuận thuần</p>
                        </div>
                    </div>
                    <span className="text-xs font-black bg-white text-orange-600 px-3 py-1 rounded-full shadow">PRO ACTIVE</span>
                </div>
            )}

            {/* Summary Card */}
            <div className="bg-gradient-to-br from-sky-50 to-sky-100/50 border border-sky-200 rounded-3xl p-6 shadow-sm">
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

                {/* PRO Section in Summary Card */}
                {isProMode && (
                    <div className="mt-6 pt-6 border-t border-sky-200/80 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/60 p-4 rounded-2xl">
                        <div>
                            <p className="text-emerald-700 text-xs font-black uppercase flex items-center gap-1">
                                <TrendingUp className="w-4 h-4 text-emerald-600" /> Tổng Lợi Nhuận
                            </p>
                            <p className="text-2xl font-black text-emerald-600 mt-1">
                                {formatMoney(data.totalProfit ?? (data.totalRevenue - (data.totalCost || 0)))} đ
                            </p>
                        </div>
                        <div>
                            <p className="text-amber-700 text-xs font-black uppercase flex items-center gap-1">
                                <Coins className="w-4 h-4 text-amber-600" /> Tỷ Suất Lợi Nhuận
                            </p>
                            <p className="text-2xl font-black text-amber-600 mt-1">
                                {data.profitMargin ?? 0}%
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-xs font-black uppercase">Tổng Giá Vốn</p>
                            <p className="text-2xl font-black text-gray-700 mt-1">
                                {formatMoney(data.totalCost || 0)} đ
                            </p>
                        </div>
                    </div>
                )}

                {data.totalVoids > 0 && (
                    <div className="mt-4 pt-4 border-t border-sky-200">
                        <p className="text-xs text-red-600 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" /> {data.totalVoids} giao dịch bị huỷ (không tính vào doanh thu)
                        </p>
                    </div>
                )}
            </div>

            {/* Daily Revenue Table */}
            {data.byDay && data.byDay.length > 0 && (
                <div className="bg-white rounded-3xl border border-sky-50 shadow-sm overflow-hidden">
                    <div className="bg-sky-50 px-6 py-4 border-b border-sky-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
                                <span>Doanh thu theo ngày</span>
                                <span className="text-[10px] font-bold bg-sky-200 text-sky-900 px-2 py-0.5 rounded-full normal-case flex items-center gap-1">
                                    <MousePointerClick className="w-3 h-3" /> Nhấp hàng để xem hóa đơn
                                </span>
                            </h3>
                        </div>
                        {isProMode && (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                                Đã mở cột Lợi Nhuận
                            </span>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-sky-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-black text-gray-600 uppercase">Ngày (Nhấp chọn)</th>
                                    <th className="px-6 py-3 text-right text-xs font-black text-gray-600 uppercase">Doanh thu</th>
                                    {isProMode && (
                                        <>
                                            <th className="px-6 py-3 text-right text-xs font-black text-gray-600 uppercase">Giá vốn</th>
                                            <th className="px-6 py-3 text-right text-xs font-black text-emerald-700 uppercase">Lợi nhuận</th>
                                        </>
                                    )}
                                    <th className="px-6 py-3 text-right text-xs font-black text-gray-600 uppercase">Số GD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.byDay.map(day => {
                                    const isSelected = selectedDate === day.date
                                    return (
                                        <tr 
                                            key={day.date} 
                                            onClick={() => handleRowClick(day.date)}
                                            className={`border-b border-sky-50 transition cursor-pointer select-none ${
                                                isSelected 
                                                    ? 'bg-sky-100/90 hover:bg-sky-100 border-l-4 border-sky-600 font-bold' 
                                                    : 'hover:bg-sky-50/70'
                                            }`}
                                        >
                                            <td className="px-6 py-3.5 text-gray-800 flex items-center justify-between">
                                                <span className="flex items-center gap-2">
                                                    <Receipt className={`w-4 h-4 ${isSelected ? 'text-primary font-bold' : 'text-gray-400'}`} />
                                                    {new Date(day.date + 'T00:00:00').toLocaleDateString('vi-VN', {
                                                        weekday: 'short',
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit'
                                                    })}
                                                </span>
                                                {isSelected && (
                                                    <span className="text-[10px] uppercase font-black bg-primary text-white px-2 py-0.5 rounded-full">
                                                        Đang chọn
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3.5 text-right font-black text-primary">{formatMoney(day.revenue)}</td>
                                            {isProMode && (
                                                <>
                                                    <td className="px-6 py-3.5 text-right font-bold text-gray-500">{formatMoney(day.cost || 0)}</td>
                                                    <td className="px-6 py-3.5 text-right font-black text-emerald-600">{formatMoney(day.profit || (day.revenue - (day.cost || 0)))}</td>
                                                </>
                                            )}
                                            <td className="px-6 py-3.5 text-right font-bold text-gray-600 flex items-center justify-end gap-1">
                                                <span>{day.count} HD</span>
                                                <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90 text-primary' : 'text-gray-300'}`} />
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* By Payment Method */}
            <div className="bg-white rounded-3xl border border-sky-50 shadow-sm overflow-hidden">
                <div className="bg-sky-50 px-6 py-4 border-b border-sky-100">
                    <h3 className="font-black text-gray-800 uppercase tracking-wide">Theo phương thức thanh toán</h3>
                </div>

                <div className="divide-y divide-sky-50">
                    {Object.entries(data.byMethod).map(([method, info]) => (
                        <div key={method} className="p-6 hover:bg-sky-50/50 transition">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="font-black text-gray-800 capitalize flex items-center gap-1.5">
                                        {method === 'cash' && <><Banknote className="w-4 h-4 text-green-600" /> Tiền mặt</>}
                                        {method === 'transfer' && <><Landmark className="w-4 h-4 text-blue-600" /> Chuyển khoản</>}
                                        {method === 'qr' && <><QrCode className="w-4 h-4 text-purple-600" /> QR Code</>}
                                    </p>
                                    <p className="text-sm text-gray-500 font-bold mt-1">{info.count} giao dịch</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-primary">{formatMoney(info.total)} đ</p>
                                    {isProMode && (
                                        <p className="text-xs text-emerald-600 font-bold mt-1">
                                            Lợi nhuận: {formatMoney(info.profit || 0)} đ
                                        </p>
                                    )}
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
                    className="flex-1 btn-primary btn-lg font-bold"
                >
                    {exporting ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xuất...</> : <><FileSpreadsheet className="w-4 h-4" /> Xuất Excel</>}
                </button>
                <button
                    onClick={handlePrint}
                    className="flex-1 btn-secondary btn-lg font-bold"
                >
                    <Printer className="w-4 h-4" /> In báo cáo
                </button>
            </div>

            {/* Detailed Sales List */}
            <div className="bg-white rounded-3xl border border-sky-50 shadow-sm overflow-hidden print:hidden" id="sales-detail-section">
                <div className="bg-sky-50 px-6 py-4 border-b border-sky-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
                            <span>Chi tiết hóa đơn {selectedDate ? `ngày ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('vi-VN')}` : 'tất cả các ngày'}</span>
                            <span className="text-xs font-bold text-primary bg-sky-100 px-2.5 py-0.5 rounded-full">
                                {filteredSales.length} hóa đơn
                            </span>
                        </h3>
                    </div>
                    {selectedDate && (
                        <button
                            onClick={() => setSelectedDate(null)}
                            className="text-xs font-bold text-gray-600 hover:text-red-600 bg-white border border-gray-200 hover:border-red-300 px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm"
                        >
                            <X className="w-3.5 h-3.5" /> Xem tất cả các ngày
                        </button>
                    )}
                </div>

                <div className="divide-y divide-sky-50 max-h-96 overflow-y-auto custom-scrollbar">
                    {filteredSales.length > 0 ? (
                        filteredSales.map(sale => (
                            <div 
                                key={sale.id || sale.code} 
                                onClick={() => setViewInvoiceSale(sale)}
                                className="p-4 flex justify-between items-center hover:bg-sky-50/70 transition cursor-pointer group"
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-black text-gray-900 group-hover:text-primary transition">{sale.code}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            sale.payment_method === 'transfer' 
                                                ? 'bg-blue-50 text-blue-700' 
                                                : 'bg-green-50 text-green-700'
                                        }`}>
                                            {sale.payment_method === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium mt-1">
                                        {new Date(sale.sale_date || sale.created_at).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="font-black text-primary text-base">{formatMoney(sale.total_amount)} đ</p>
                                        <p className="text-[11px] text-gray-400 font-bold mt-0.5">
                                            {sale.items?.length || 0} sản phẩm
                                        </p>
                                    </div>
                                    <button 
                                        className="p-2 text-gray-400 hover:text-primary hover:bg-sky-100 rounded-xl transition"
                                        title="Xem chi tiết hóa đơn"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-400 font-bold text-sm">
                            Không tìm thấy hóa đơn nào cho ngày này
                        </div>
                    )}
                </div>
            </div>

            {/* Invoice Modal Popup */}
            {viewInvoiceSale && (
                <InvoiceModal 
                    sale={viewInvoiceSale} 
                    onClose={() => setViewInvoiceSale(null)} 
                />
            )}
        </div>
    )
}
