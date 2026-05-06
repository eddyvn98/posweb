import { useState } from 'react'
import { formatMoney } from '../lib/reports'
import { exportToExcel } from '../lib/export'
import { FileSpreadsheet, Printer } from './Icons'

export default function InventoryReport({ data }) {
    const [exporting, setExporting] = useState(false)
    const [showDetails, setShowDetails] = useState(false)

    const handleExportExcel = async () => {
        setExporting(true)
        try {
            const reportName = `Ton-kho-${data.month.toString().padStart(2, '0')}-${data.year}`
            await exportToExcel(data, reportName, 'inventory')
        } catch (err) {
            console.error('Export error:', err)
        } finally {
            setExporting(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const itemsWithMovement = data.inventory.filter(
        item => item.imported > 0 || item.sold > 0 || item.adjusted > 0 || item.voided > 0
    )

    return (
        <div className="space-y-10">
            {/* Inventory KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-6 lg:p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden group min-w-0">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
                    <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-2">Giá trị kho (vốn)</p>
                    <div className="flex items-baseline gap-1 lg:gap-2 flex-wrap">
                        <h4 className="text-2xl sm:text-3xl font-black tracking-tighter break-all">{formatMoney(data.totalValue)}</h4>
                        <span className="text-[10px] font-bold text-white/60">VNĐ</span>
                    </div>
                </div>

                <div className="bg-white border-2 border-gray-100 rounded-[2rem] p-6 lg:p-8 shadow-sm hover:shadow-md transition-all min-w-0">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Số lượng SKU</p>
                    <div className="flex items-baseline gap-1 lg:gap-2 flex-wrap">
                        <h4 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tighter break-all">{data.totalItems}</h4>
                        <span className="text-[10px] font-bold text-gray-400">Loại SP</span>
                    </div>
                </div>

                <div className="bg-white border-2 border-gray-100 rounded-[2rem] p-6 lg:p-8 shadow-sm hover:shadow-md transition-all min-w-0">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">SKU Còn hàng</p>
                    <div className="flex items-baseline gap-1 lg:gap-2 flex-wrap">
                        <h4 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tighter break-all">
                            {data.inventory.filter(i => i.endingStock > 0).length}
                        </h4>
                        <span className="text-[10px] font-bold text-gray-400">Đang kinh doanh</span>
                    </div>
                </div>
            </div>

            {/* Movement Summary */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Biến động kho trong kỳ</h3>
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-[10px] font-black text-primary bg-pink-50 px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm"
                    >
                        {showDetails ? 'Ẩn bảng chi tiết' : 'Hiện bảng chi tiết'}
                    </button>
                </div>

                {showDetails && (
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-50/50 sticky top-0 backdrop-blur-sm z-10">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-black text-gray-400 uppercase tracking-widest">Sản phẩm</th>
                                        <th className="px-4 py-4 text-right font-black text-gray-400 uppercase tracking-widest">Đầu kỳ</th>
                                        <th className="px-4 py-4 text-right font-black text-gray-400 uppercase tracking-widest">Nhập</th>
                                        <th className="px-4 py-4 text-right font-black text-gray-400 uppercase tracking-widest">Bán</th>
                                        <th className="px-4 py-4 text-right font-black text-gray-400 uppercase tracking-widest">Cuối kỳ</th>
                                        <th className="px-6 py-4 text-right font-black text-gray-400 uppercase tracking-widest">Giá trị</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {data.inventory.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-gray-800">{item.name}</p>
                                                <p className="text-[10px] text-gray-400 font-mono mt-1">{item.barcode}</p>
                                            </td>
                                            <td className="px-4 py-4 text-right font-medium text-gray-500">{item.beginningStock}</td>
                                            <td className="px-4 py-4 text-right font-bold text-green-600">+{item.imported}</td>
                                            <td className="px-4 py-4 text-right font-bold text-red-600">-{item.sold}</td>
                                            <td className="px-4 py-4 text-right font-black text-gray-900">{item.endingStock}</td>
                                            <td className="px-6 py-4 text-right font-black text-indigo-600">{formatMoney(item.estimatedValue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Visual Grid for Movements */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {itemsWithMovement.length === 0 ? (
                        <div className="lg:col-span-2 py-12 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                            <p className="text-gray-400 font-bold">Không có biến động kho nào được ghi nhận</p>
                        </div>
                    ) : (
                        itemsWithMovement.map(item => (
                            <div key={item.id} className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h5 className="font-black text-gray-800 uppercase text-sm leading-tight group-hover:text-primary transition-colors">{item.name}</h5>
                                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Mã: {item.barcode}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-gray-900 leading-none">{item.endingStock}</span>
                                        <p className="text-[10px] font-black text-gray-400 uppercase">Tồn kho</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {item.imported > 0 && <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-wider border border-green-100">+{item.imported} Nhập</span>}
                                    {item.sold > 0 && <span className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-[10px] font-black uppercase tracking-wider border border-red-100">-{item.sold} Bán</span>}
                                    {item.adjusted !== 0 && <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-wider border border-blue-100">🔧 {item.adjusted > 0 ? '+' : ''}{item.adjusted} Lệch</span>}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Giá trị ước tính</span>
                                    <span className="text-sm font-black text-indigo-600">{formatMoney(item.estimatedValue)} đ</span>
                                </div>
                            </div>
                        ))
                    )}
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
                    <span>In báo cáo kho</span>
                </button>
            </div>
        </div>
    )
}
