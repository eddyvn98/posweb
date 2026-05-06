import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotification } from '../contexts/NotificationContext'
import {
    getMonthlyRevenue,
    getYearlyRevenue,
    getCashbookReport,
    getInventorySnapshot,
    formatMoney,
    formatDateVN
} from '../lib/reports'
import { exportAllData, exportMonthlyReportCompliant } from '../lib/export'
import RevenueReport from '../components/RevenueReport'
import CashbookReport from '../components/CashbookReport'
import InventoryReport from '../components/InventoryReport'
import { 
    BarChart3, 
    Save, 
    TrendingUp, 
    Package, 
    Lightbulb, 
    AlertTriangle,
    ArrowLeft,
    ArrowRight
} from '../components/Icons'

export default function Reports() {
    const { shop } = useAuth()
    const { showNotification } = useNotification()
    const [activeTab, setActiveTab] = useState('revenue')
    const [year, setYear] = useState(new Date().getFullYear())
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [exporting, setExporting] = useState(false)

    // Report data
    const [revenueData, setRevenueData] = useState(null)
    const [cashbookData, setCashbookData] = useState(null)
    const [inventoryData, setInventoryData] = useState(null)
    const [reportSource, setReportSource] = useState('server')

    useEffect(() => {
        if (!shop?.id) return

        const loadReport = async () => {
            setLoading(true)
            setError('')
            try {
                const [revenue, cashbook, inventory] = await Promise.all([
                    getMonthlyRevenue(shop.id, year, month),
                    getCashbookReport(shop.id, year, month),
                    getInventorySnapshot(shop.id, year, month)
                ])

                if (!revenue) throw new Error('Không thể tải báo cáo doanh thu')
                if (!cashbook) throw new Error('Không thể tải báo cáo sổ quỹ')
                if (!inventory) throw new Error('Không thể tải báo cáo tồn kho')

                setRevenueData(revenue)
                setCashbookData(cashbook)
                setInventoryData(inventory)
                
                // Set the most restricted source as the global source
                const sources = [revenue.source, cashbook.source, inventory.source]
                if (sources.includes('local')) setReportSource('local')
                else if (sources.includes('cache')) setReportSource('cache')
                else setReportSource('server')

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
            showNotification('✅ Đã xuất dữ liệu sao lưu thành công!', 'success')
        } catch (err) {
            showNotification('❌ Lỗi khi xuất: ' + err.message, 'error')
        } finally {
            setExporting(false)
        }
    }

    const handleExportMonthlyReport = async () => {
        if (!shop?.id || !revenueData || !cashbookData || !inventoryData) {
            showNotification('❌ Vui lòng đợi báo cáo tải xong', 'warning')
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
            showNotification('✅ Đã xuất báo cáo tháng thành công!', 'success')
        } catch (err) {
            showNotification(`❌ ${err.message}`, 'error')
            console.error(err)
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50/30 p-4 pb-20">
            {/* Header Section */}
            <div className="mb-8 mt-2 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">
                        Báo cáo <span className="text-primary">&</span> Thống kê
                    </h1>
                    <p className="text-gray-400 font-bold mt-3 flex items-center gap-2">
                        <span className="w-8 h-[2px] bg-primary/30"></span>
                        Theo dõi hiệu quả kinh doanh & dòng tiền
                    </p>
                </div>
                
                {/* Global Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={handleExportMonthlyReport}
                        disabled={exporting || !revenueData}
                        className="flex-1 lg:flex-none bg-white border-2 border-blue-100 text-blue-600 font-black px-6 py-4 rounded-[1.5rem] hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-sm shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        {exporting ? 'Đang xuất...' : (
                            <>
                                <BarChart3 className="w-5 h-5" />
                                <span>Xuất báo cáo tháng</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleExportAllData}
                        disabled={exporting}
                        className="flex-1 lg:flex-none bg-gray-900 text-white font-black px-6 py-4 rounded-[1.5rem] hover:bg-black transition-all flex items-center justify-center gap-2 text-sm shadow-xl active:scale-95 disabled:opacity-50"
                    >
                        {exporting ? 'Đang xuất...' : (
                            <>
                                <Save className="w-5 h-5" />
                                <span>Sao lưu dữ liệu</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Application Container */}
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-gray-200/40 overflow-hidden min-h-[60vh]">
                {/* Navigation & Controls Bar */}
                <div className="bg-gray-50/50 border-b border-gray-100 p-4 flex flex-col xl:flex-row items-center justify-between gap-6">
                    {/* Primary Tabs */}
                    <div className="flex bg-white p-1.5 rounded-3xl border border-gray-100 shadow-inner w-full xl:w-auto">
                        {[
                            { id: 'revenue', label: 'Doanh thu', icon: TrendingUp },
                            { id: 'cashbook', label: 'Sổ quỹ', icon: BarChart3 },
                            { id: 'inventory', label: 'Tồn kho', icon: Package }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex-1 xl:flex-none px-2 sm:px-6 py-3 sm:py-4 rounded-2xl font-black text-[9px] sm:text-xs uppercase tracking-tight sm:tracking-widest transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3
                                    ${activeTab === tab.id
                                        ? 'bg-primary text-white shadow-xl shadow-pink-200'
                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                    }
                                `}
                            >
                                <tab.icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={activeTab === tab.id ? 3 : 2} />
                                <span className="whitespace-nowrap">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Timeline Navigation */}
                    <div className="flex items-center gap-6 bg-white px-6 py-3 rounded-[2rem] border border-gray-100 shadow-sm w-full xl:w-auto justify-between">
                        <button
                            onClick={handlePreviousMonth}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-800 hover:bg-primary hover:text-white transition-all font-black text-xl shadow-sm"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        
                        <div className="text-center min-w-[160px]">
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] leading-none mb-1.5">Kỳ báo cáo</p>
                            <p className="text-xl font-black text-gray-900 capitalize">{monthName}</p>
                        </div>

                        <button
                            onClick={handleNextMonth}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-800 hover:bg-primary hover:text-white transition-all font-black text-xl shadow-sm"
                        >
                            <ArrowRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-8 lg:p-10">
                    {/* Offline / Cache Banner */}
                    {!loading && reportSource !== 'server' && shop?.id !== 'guest_shop' && (
                        <div className={`mb-6 flex items-center gap-4 rounded-[2rem] p-5 border-2 ${
                            reportSource === 'cache' 
                            ? 'bg-amber-50 border-amber-100 text-amber-900' 
                            : 'bg-red-50 border-red-100 text-red-900'
                        }`}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                                reportSource === 'cache' ? 'bg-white text-amber-500' : 'bg-white text-red-500'
                            }`}>
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-black text-sm uppercase tracking-tight">
                                    {reportSource === 'cache' ? 'Dữ liệu từ bộ nhớ đệm (Offline)' : 'Dữ liệu cục bộ (Chưa đầy đủ)'}
                                </p>
                                <p className="text-xs font-medium opacity-80 mt-0.5">
                                    {reportSource === 'cache' 
                                        ? 'Bạn đang xem bản lưu cuối cùng khi có mạng. Các thay đổi mới từ thiết bị khác có thể chưa hiển thị.' 
                                        : 'Chỉ bao gồm các giao dịch chưa đồng bộ trên máy này. Kết quả có thể không chính xác so với thực tế.'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Compact Advice Banner */}
                    <div className="mb-10 flex items-center gap-4 bg-blue-50/40 border border-blue-100 rounded-[2rem] p-5">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                            <Lightbulb className="w-6 h-6 text-blue-500" />
                        </div>
                        <p className="text-xs text-blue-900 font-bold leading-relaxed max-w-2xl">
                            Các chỉ số dưới đây được tổng hợp từ dữ liệu bán hàng và thu chi thực tế. 
                            Sử dụng các tab phía trên để xem chi tiết từng mảng kinh doanh.
                        </p>
                    </div>

                    {/* Dynamic Component Loader */}
                    {loading ? (
                        <div className="py-20 text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                            <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Đang xử lý dữ liệu...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-100 rounded-3xl p-10 text-center">
                            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <p className="text-red-700 font-black text-lg mb-2">Đã có lỗi xảy ra</p>
                            <p className="text-red-500 text-sm font-medium">{error}</p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {activeTab === 'revenue' && (
                                revenueData?.totalSales > 0 ? (
                                    <RevenueReport data={revenueData} />
                                ) : (
                                    <div className="py-20 text-center">
                                        <TrendingUp className="w-20 h-20 mx-auto mb-6 text-gray-200 stroke-[1.5]" />
                                        <p className="text-gray-400 font-black text-xl uppercase tracking-tighter">Chưa có dữ liệu doanh thu</p>
                                        <p className="text-gray-300 text-sm mt-2">Bắt đầu bán hàng để thấy báo cáo tại đây</p>
                                    </div>
                                )
                            )}
                            {activeTab === 'cashbook' && (
                                cashbookData?.transactions?.length > 0 ? (
                                    <CashbookReport data={cashbookData} />
                                ) : (
                                    <div className="py-20 text-center">
                                        <BarChart3 className="w-20 h-20 mx-auto mb-6 text-gray-200 stroke-[1.5]" />
                                        <p className="text-gray-400 font-black text-xl uppercase tracking-tighter">Sổ quỹ đang trống</p>
                                        <p className="text-gray-300 text-sm mt-2">Các giao dịch thu chi sẽ được liệt kê tại đây</p>
                                    </div>
                                )
                            )}
                            {activeTab === 'inventory' && (
                                inventoryData?.inventory?.length > 0 ? (
                                    <InventoryReport data={inventoryData} />
                                ) : (
                                    <div className="py-20 text-center">
                                        <Package className="w-20 h-20 mx-auto mb-6 text-gray-200 stroke-[1.5]" />
                                        <p className="text-gray-400 font-black text-xl uppercase tracking-tighter">Kho chưa có sản phẩm</p>
                                        <p className="text-gray-300 text-sm mt-2">Nhập hàng hóa để theo dõi tồn kho</p>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Attribution */}
            <div className="mt-12 text-center">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">POSWeb Free Edition &copy; 2026</p>
            </div>
        </div>
    )
}
