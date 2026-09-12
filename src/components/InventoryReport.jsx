import { useState } from 'react'
import { formatMoney } from '../lib/reports'
import { exportToExcel } from '../lib/export'
import { 
    ChevronDown, 
    ChevronUp, 
    Package, 
    Plus, 
    Minus, 
    Wrench, 
    RotateCcw, 
    FileSpreadsheet, 
    Printer, 
    Loader2 
} from 'lucide-react'

export default function InventoryReport({ data }) {
    const [exporting, setExporting] = useState(false)
    const [showDetails, setShowDetails] = useState(false)

    const handleExportExcel = async () => {
        setExporting(true)
        try {
            const reportName = `Ton-kho-${data.month.toString().padStart(2, '0')}-${data.year}`
            await exportToExcel(data, reportName, 'inventory')
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

    // Filter to show only items with stock movements
    const itemsWithMovement = data.inventory.filter(
        item => item.imported > 0 || item.sold > 0 || item.adjusted > 0 || item.voided > 0
    )

    return (
        <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-3xl p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-gray-600 text-sm font-bold uppercase">Tổng giá trị tồn kho</p>
                        <p className="text-3xl font-black text-purple-600 mt-2">{formatMoney(data.totalValue)}</p>
                        <p className="text-xs text-gray-500 mt-1">đ (giá vốn)</p>
                    </div>
                    <div>
                        <p className="text-gray-600 text-sm font-bold uppercase">Tổng số sản phẩm</p>
                        <p className="text-3xl font-black text-gray-800 mt-2">{data.totalItems}</p>
                        <p className="text-xs text-gray-500 mt-1">loại</p>
                    </div>
                    <div>
                        <p className="text-gray-600 text-sm font-bold uppercase">Sản phẩm có hàng</p>
                        <p className="text-3xl font-black text-gray-800 mt-2">
                            {data.inventory.filter(i => i.endingStock > 0).length}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">loại</p>
                    </div>
                </div>
            </div>

            {/* Toggle Details */}
            <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full bg-white border border-sky-100 rounded-2xl p-4 font-bold text-gray-800 hover:bg-sky-50 transition flex items-center justify-center gap-1.5"
            >
                {showDetails ? (
                    <><ChevronDown className="w-4 h-4" /> Ẩn chi tiết</>
                ) : (
                    <><ChevronUp className="w-4 h-4" /> Xem chi tiết</>
                )}
            </button>

            {/* Inventory Table */}
            {showDetails && (
                <div className="bg-white rounded-3xl border border-sky-50 shadow-sm overflow-hidden print:rounded-none print:border-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-sky-50 border-b border-sky-100 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left font-black text-gray-800">Sản phẩm</th>
                                    <th className="px-4 py-3 text-center font-black text-gray-800">Mã vạch</th>
                                    <th className="px-4 py-3 text-right font-black text-gray-800">Đầu kỳ</th>
                                    <th className="px-4 py-3 text-right font-black text-gray-800">Nhập</th>
                                    <th className="px-4 py-3 text-right font-black text-gray-800">Bán</th>
                                    <th className="px-4 py-3 text-right font-black text-gray-800">Cuối kỳ</th>
                                    <th className="px-4 py-3 text-right font-black text-gray-800">Giá trị</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sky-50">
                                {data.inventory.map(item => (
                                    <tr key={item.id} className="hover:bg-sky-50/50 transition">
                                        <td className="px-4 py-3 font-bold text-gray-800">{item.name}</td>
                                        <td className="px-4 py-3 text-center text-gray-600 text-xs font-bold font-mono">
                                            {item.barcode}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-700 font-bold">
                                            {item.beginningStock}
                                        </td>
                                        <td className="px-4 py-3 text-right text-green-600 font-bold">
                                            +{item.imported}
                                        </td>
                                        <td className="px-4 py-3 text-right text-red-600 font-bold">
                                            -{item.sold}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-800 font-black">
                                            {item.endingStock}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sky-600 font-black">
                                            {formatMoney(item.estimatedValue)}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-sky-50 font-black text-gray-800 border-t-2 border-sky-200">
                                    <td colSpan="6" className="px-4 py-3 text-right">
                                        TỔNG GIÁ TRỊ
                                    </td>
                                    <td className="px-4 py-3 text-right text-sky-600">
                                        {formatMoney(data.totalValue)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Items with Movement Summary */}
            <div className="bg-white rounded-3xl border border-sky-50 shadow-sm overflow-hidden">
                <div className="bg-sky-50 px-6 py-4 border-b border-sky-100 flex items-center gap-2">
                    <Package className="w-5 h-5 text-sky-600" />
                    <h3 className="font-black text-gray-800 uppercase tracking-wide">
                        Sản phẩm có chuyển động ({itemsWithMovement.length})
                    </h3>
                </div>

                <div className="divide-y divide-sky-50 max-h-96 overflow-y-auto custom-scrollbar">
                    {itemsWithMovement.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 italic">Không có sản phẩm nào chuyển động</div>
                    ) : (
                        itemsWithMovement.map(item => (
                            <div key={item.id} className="p-4 hover:bg-sky-50/50 transition">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-black text-gray-800">{item.name}</p>
                                        <p className="text-xs text-gray-500 mt-1 font-bold">Mã: {item.barcode}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-purple-600 text-lg">
                                            {item.endingStock} <span className="text-sm text-gray-500">cái</span>
                                        </p>
                                        <p className="text-xs text-gray-500 font-bold">
                                            Giá trị: {formatMoney(item.estimatedValue)} đ
                                        </p>
                                    </div>
                                </div>

                                {/* Movement badges */}
                                <div className="flex gap-2 flex-wrap">
                                    {item.imported > 0 && (
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                                            <Plus className="w-3 h-3" /> Nhập: {item.imported}
                                        </span>
                                    )}
                                    {item.sold > 0 && (
                                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                                            <Minus className="w-3 h-3" /> Bán: {item.sold}
                                        </span>
                                    )}
                                    {item.adjusted > 0 && (
                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                                            <Wrench className="w-3 h-3" /> Điều chỉnh: {item.adjusted}
                                        </span>
                                    )}
                                    {item.voided > 0 && (
                                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                                            <RotateCcw className="w-3 h-3" /> Huỷ: {item.voided}
                                        </span>
                                    )}
                                </div>
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
        </div>
    )
}
