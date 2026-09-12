import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotification } from '../contexts/NotificationContext'
import { 
    TrendingUp, 
    BarChart3, 
    Package, 
    FileSpreadsheet, 
    Save, 
    Lightbulb, 
    AlertTriangle, 
    Loader2,
    ChevronLeft,
    ChevronRight,
    PieChart
} from 'lucide-react'
import {
    getMonthlyRevenue,
    getCashbookReport,
    getInventorySnapshot,
} from '../lib/reports'
import { exportAllData, exportMonthlyReportCompliant } from '../lib/export'
import RevenueReport from '../components/RevenueReport'
import CashbookReport from '../components/CashbookReport'
import InventoryReport from '../components/InventoryReport'

export default function Reports() {
    const { user, shop } = useAuth()
    const { showNotification } = useNotification()
    const [activeTab, setActiveTab] = useState('revenue')
    const [year, setYear] = useState(new Date().getFullYear())
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [exporting, setExporting] = useState(false)

    // PRO Mode state & synchronous triple click logic on "Thống kê"
    const [isProMode, setIsProMode] = useState(() => {
        return localStorage.getItem('pos_pro_mode') === 'true'
    })
    const clicksRef = useRef(0)
    const timerRef = useRef(null)

    const handleHeaderClick = () => {
        clicksRef.current += 1
        if (timerRef.current) clearTimeout(timerRef.current)

        if (clicksRef.current >= 3) {
            clicksRef.current = 0
            setIsProMode(prev => {
                const next = !prev
                localStorage.setItem('pos_pro_mode', next ? 'true' : 'false')
                if (next) {
                    showNotification('🔥 Đã KÍCH HOẠT chế độ PRO (Báo cáo Lợi Nhuận)!', 'success')
                } else {
                    showNotification('Đã tắt chế độ PRO', 'info')
                }
                return next
            })
        } else {
            timerRef.current = setTimeout(() => {
                clicksRef.current = 0
            }, 2500)
        }
    }

    // Report data
    const [revenueData, setRevenueData] = useState(null)
    const [cashbookData, setCashbookData] = useState(null)
    const [inventoryData, setInventoryData] = useState(null)

    useEffect(() => {
        if (!shop?.id) return

        const loadReport = async () => {
            setLoading(true)
            setError('')
            try {
                // Always load ALL reports for export, not just active tab
                const revenue = await getMonthlyRevenue(shop.id, year, month)
                const cashbook = await getCashbookReport(shop.id, year, month)
                const inventory = await getInventorySnapshot(shop.id, year, month)

                if (!revenue) throw new Error('Không thể tải báo cáo doanh thu')
                if (!cashbook) throw new Error('Không thể tải báo cáo sổ quỹ')
                if (!inventory) throw new Error('Không thể tải báo cáo tồn kho')

                setRevenueData(revenue)
                setCashbookData(cashbook)
                setInventoryData(inventory)
            } catch (err) {
                setError(err.message)
                console.error('Error loading report:', err)
            } finally {
                setLoading(false)
            }
        }

        loadReport()
    }, [shop?.id, year, month])

    const handlePreviousMonth = () => {
        if (month === 1) {
            setMonth(12)
            setYear(year - 1)
        } else {
            setMonth(month - 1)
        }
    }

    const handleNextMonth = () => {
        if (month === 12) {
            setMonth(1)
            setYear(year + 1)
        } else {
            setMonth(month + 1)
        }
    }

    const monthName = new Date(year, month - 1).toLocaleString('vi-VN', { month: 'long', year: 'numeric' })

    const handleExportAllData = async () => {
        if (!shop?.id) return
        setExporting(true)
        try {
            await exportAllData(shop.id)
            showNotification('Đã xuất dữ liệu sao lưu thành công!', 'success')
        } catch (err) {
            showNotification('Lỗi khi xuất: ' + err.message, 'error')
        } finally {
            setExporting(false)
        }
    }

    const handleExportMonthlyReport = async () => {
        if (!shop?.id) {
            showNotification('Vui lòng đợi cửa hàng tải xong', 'error')
            return
        }

        if (!revenueData || !cashbookData || !inventoryData) {
            showNotification('Vui lòng đợi báo cáo tải xong', 'error')
            return
        }

        setExporting(true)
        try {
            await exportMonthlyReportCompliant(
                shop.id,
                year,
                month,
                shop.name,
                revenueData,
                cashbookData,
                inventoryData
            )

            showNotification('Đã xuất báo cáo tháng thành công!', 'success')
        } catch (err) {
            showNotification(`Lỗi khi xuất: ${err.message}`, 'error')
            console.error(err)
        } finally {
            setExporting(false)
        }
    }

    const tabList = [
        { id: 'revenue', label: 'Doanh thu', Icon: TrendingUp },
        { id: 'cashbook', label: 'Sổ quỹ', Icon: BarChart3 },
        { id: 'inventory', label: 'Tồn kho', Icon: Package }
    ]

    return (
        <div className="min-h-screen bg-gray-50 p-3 sm:p-5 pb-20">
            {/* Header */}
            <div 
                onClick={handleHeaderClick}
                className="mb-4 cursor-pointer select-none group p-2 -m-2 rounded-2xl hover:bg-gray-100/50 transition-colors"
                title="Bấm 3 lần liên tiếp vào khu vực này để bật/tắt chế độ PRO Lợi Nhuận"
            >
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2 group-hover:text-primary transition-colors">
                    <PieChart className="w-6 h-6 text-primary" />
                    <span>Thống kê & Báo cáo</span>
                    {isProMode && (
                        <span className="ml-2 px-2.5 py-0.5 text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-sm animate-pulse">
                            PRO (Lợi Nhuận)
                        </span>
                    )}
                </h1>
                <p className="text-xs text-gray-500 font-medium mt-1">
                    {isProMode ? '🔥 Chế độ PRO đang hoạt động: Hiển thị chi tiết Lợi Nhuận & Giá Vốn' : 'Tổng hợp tổng quan kinh doanh, sổ quỹ và tồn kho sản phẩm (Bấm 3 lần để mở Lợi nhuận PRO)'}
                </p>
            </div>

            {/* Combined Month Selector & Export Toolbar */}
            <div className="bg-white rounded-3xl p-4 mb-4 border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <button
                        onClick={handlePreviousMonth}
                        className="btn bg-gray-100 text-gray-700 font-bold px-3 h-10 rounded-xl hover:bg-gray-200 transition text-xs sm:text-sm flex items-center gap-1"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Tháng trước</span>
                    </button>

                    <div className="text-center">
                        <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">Kỳ báo cáo</p>
                        <p className="text-lg sm:text-xl font-black text-gray-900 capitalize leading-tight">{monthName}</p>
                    </div>

                    <button
                        onClick={handleNextMonth}
                        className="btn bg-gray-100 text-gray-700 font-bold px-3 h-10 rounded-xl hover:bg-gray-200 transition text-xs sm:text-sm flex items-center gap-1"
                    >
                        <span className="hidden sm:inline">Tháng sau</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Quick Export Actions */}
                <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 sm:gap-3">
                    <button
                        onClick={handleExportMonthlyReport}
                        disabled={exporting || !revenueData}
                        className="w-full btn bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl disabled:opacity-50 transition text-xs sm:text-sm px-3 h-10 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                        {exporting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Đang xuất...</>
                        ) : (
                            <>
                                <FileSpreadsheet className="w-4 h-4" />
                                <span>Xuất báo cáo tháng (Excel)</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleExportAllData}
                        disabled={exporting}
                        className="w-full btn bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl disabled:opacity-50 transition text-xs sm:text-sm px-3 h-10 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                        {exporting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Đang sao lưu...</>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                <span>Sao lưu toàn bộ</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {tabList.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            px-4 sm:px-6 py-2.5 rounded-2xl font-black text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2
                            ${activeTab === tab.id
                                ? 'bg-primary text-white shadow-md shadow-sky-200'
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                            }
                        `}
                    >
                        <tab.Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 text-red-700 font-bold text-xs sm:text-sm flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="bg-white rounded-3xl p-12 text-center flex flex-col items-center gap-2 border border-gray-100 shadow-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-gray-500 font-bold text-sm">Đang tính toán số liệu báo cáo...</p>
                </div>
            )}

            {/* Reports Content */}
            {!loading && !error && (
                <>
                    {activeTab === 'revenue' && (
                        revenueData && revenueData.totalSales > 0 ? (
                            <RevenueReport data={revenueData} isProMode={isProMode} />
                        ) : (
                            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-sm">
                                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-600 font-bold text-base">Không có dữ liệu doanh thu</p>
                                <p className="text-gray-400 text-xs mt-1">Không có giao dịch nào được ghi nhận trong {monthName}</p>
                            </div>
                        )
                    )}
                    {activeTab === 'cashbook' && (
                        cashbookData && cashbookData.transactions && cashbookData.transactions.length > 0 ? (
                            <CashbookReport data={cashbookData} />
                        ) : (
                            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-sm">
                                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-600 font-bold text-base">Không có dữ liệu sổ quỹ</p>
                                <p className="text-gray-400 text-xs mt-1">Không có giao dịch thu/chi trong {monthName}</p>
                            </div>
                        )
                    )}
                    {activeTab === 'inventory' && (
                        inventoryData && inventoryData.items && inventoryData.items.length > 0 ? (
                            <InventoryReport data={inventoryData} />
                        ) : (
                            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-sm">
                                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-600 font-bold text-base">Không có dữ liệu tồn kho</p>
                                <p className="text-gray-400 text-xs mt-1">Chưa có sản phẩm nào trong danh mục</p>
                            </div>
                        )
                    )}
                </>
            )}

            {/* Tip Card */}
            <div className="mt-6 bg-sky-50 border border-sky-100 p-4 sm:p-5 rounded-3xl flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-xs text-sky-900 leading-relaxed font-medium">
                    <span className="font-bold text-sky-950">Mẹo quản lý:</span> Báo cáo doanh thu và sổ quỹ được cập nhật tự động khi bán hàng hoặc nhập kho. Bạn có thể xuất file Excel để kiểm kê cuối tháng.
                </div>
            </div>
        </div>
    )
}
