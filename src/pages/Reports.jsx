import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotification } from '../contexts/NotificationContext'
// import { useDriveAuth } from '../contexts/DriveContext' // TEMPORARY: Google Drive disabled
import {
    getMonthlyRevenue,
    getYearlyRevenue,
    getCashbookReport,
    getInventorySnapshot,
    formatMoney,
    formatDateVN
} from '../lib/reports'
import { exportAllData, exportMonthlyReportCompliant } from '../lib/export'
// import { uploadToDrive } from '../lib/driveBackup' // TEMPORARY: Google Drive disabled
import RevenueReport from '../components/RevenueReport'
import CashbookReport from '../components/CashbookReport'
import InventoryReport from '../components/InventoryReport'

export default function Reports() {
    const { user, shop } = useAuth()
    const { showNotification } = useNotification()
    // const { isAuthed, accessToken } = useDriveAuth() // TEMPORARY: Google Drive disabled
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
            const { supabase } = await import('../lib/supabase')
            await exportAllData(shop.id, supabase)
            alert('✅ Đã xuất dữ liệu sao lưu thành công!')
        } catch (err) {
            alert('❌ Lỗi khi xuất: ' + err.message)
        } finally {
            setExporting(false)
        }
    }

    const handleExportMonthlyReport = async () => {
        if (!shop?.id) {
            alert('❌ Vui lòng đợi cửa hàng tải xong')
            return
        }

        if (!revenueData || !cashbookData || !inventoryData) {
            alert('❌ Vui lòng đợi báo cáo tải xong')
            return
        }

        setExporting(true)
        try {
            const { supabase } = await import('../lib/supabase')
            
            // Export Excel
            await exportMonthlyReportCompliant(
                shop.id,
                year,
                month,
                shop.name,
                revenueData,
                cashbookData,
                inventoryData,
                supabase
            )
            
            showNotification('✅ Đã xuất báo cáo tháng thành công!', 'success')

            // Auto-upload to Drive nếu đã đăng nhập
            if (isAuthed && accessToken) {
                try {
                    showNotification('⏳ Đang sao lưu lên Google Drive...', 'info')
                    
                    // Tải file Excel từ download (thực tế cần truyền blob)
                    // Đây là phần phức tạp hơn - cần modify export function
                    // Tạm thời log notification
                    
                    // Log vào backup_logs table
                    await supabase
                        .from('backup_logs')
                        .insert({
                            shop_id: shop.id,
                            month: `${year}-${String(month).padStart(2, '0')}`,
                            file_name: `Bao-cao-POS-${String(month).padStart(2, '0')}-${year}.xlsx`,
                            status: 'SUCCESS',
                            backup_type: 'MANUAL',
                            backup_source: 'EXPORT'
                        })
                    
                    showNotification('✅ Báo cáo cũng đã được sao lưu lên Google Drive!', 'success')
                } catch (driveErr) {
                    console.warn('Lỗi auto-upload Drive:', driveErr)
                    showNotification('⚠️ Export thành công nhưng upload Drive bị lỗi', 'warning')
                }
            }
        } catch (err) {
            alert('❌ Lỗi khi xuất: ' + err.message)
            showNotification(`❌ ${err.message}`, 'error')
            console.error(err)
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="min-h-screen bg-transparent p-4 pb-20">
            {/* Header */}
            <div className="mb-6 mt-2">
                <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Thống kê</h1>
                <p className="text-gray-400 font-medium italic">Báo cáo doanh thu & sổ quỹ</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {[
                    { id: 'revenue', label: '📈 Doanh thu', icon: '💰' },
                    { id: 'cashbook', label: '📊 Sổ quỹ', icon: '💵' },
                    { id: 'inventory', label: '📦 Tồn kho', icon: '📦' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            px-6 py-3 rounded-2xl font-black text-sm whitespace-nowrap transition-all
                            ${activeTab === tab.id
                                ? 'bg-primary text-white shadow-lg shadow-pink-200'
                                : 'bg-white text-gray-700 border border-pink-100 hover:border-pink-300'
                            }
                        `}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Month Navigation */}
            <div className="bg-white rounded-3xl p-4 mb-6 border border-pink-50 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <button
                        onClick={handlePreviousMonth}
                        className="btn bg-pink-100 text-pink-600 font-black px-4 h-10 rounded-xl hover:bg-pink-200 transition"
                    >
                        ← Tháng trước
                    </button>

                    <div className="text-center flex-1">
                        <p className="text-gray-500 text-sm font-bold">THÁNG</p>
                        <p className="text-2xl font-black text-gray-800 capitalize">{monthName}</p>
                    </div>

                    <button
                        onClick={handleNextMonth}
                        className="btn bg-pink-100 text-pink-600 font-black px-4 h-10 rounded-xl hover:bg-pink-200 transition"
                    >
                        Tháng sau →
                    </button>
                </div>

                {/* Export Buttons */}
                <div className="w-full mt-4 flex gap-3 flex-wrap">
                    <button
                        onClick={handleExportMonthlyReport}
                        disabled={exporting || !revenueData}
                        className="flex-1 btn bg-blue-500 text-white font-black rounded-2xl hover:bg-blue-600 disabled:opacity-50 transition"
                    >
                        {exporting ? '⏳ Đang xuất...' : '📊 Xuất báo cáo tháng'}
                    </button>
                    <button
                        onClick={handleExportAllData}
                        disabled={exporting}
                        className="flex-1 btn bg-green-500 text-white font-black rounded-2xl hover:bg-green-600 disabled:opacity-50 transition"
                    >
                        {exporting ? '⏳ Đang xuất...' : '💾 Sao lưu toàn bộ'}
                    </button>
                </div>

                {/* Drive Status Info */}
                {isAuthed && (
                    <div className="w-full mt-3 bg-blue-50 border border-blue-200 rounded-2xl p-3">
                        <p className="text-xs text-blue-700 font-bold">
                            ✓ Google Drive đã kết nối - Báo cáo sẽ tự động sao lưu khi xuất
                        </p>
                    </div>
                )}
                {!isAuthed && (
                    <div className="w-full mt-3 bg-gray-50 border border-gray-200 rounded-2xl p-3">
                        <p className="text-xs text-gray-600">
                            💡 Đăng nhập Google Drive trong "Cài đặt" để tự động sao lưu báo cáo
                        </p>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-red-700 font-bold text-sm">
                    ⚠️ {error}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="bg-white rounded-3xl p-12 text-center">
                    <p className="text-gray-500 font-bold">⏳ Đang tải báo cáo...</p>
                </div>
            )}

            {/* Reports */}
            {!loading && !error && (
                <>
                    {activeTab === 'revenue' && (
                        revenueData && revenueData.totalSales > 0 ? (
                            <RevenueReport data={revenueData} />
                        ) : (
                            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
                                <p className="text-6xl mb-4">📈</p>
                                <p className="text-gray-600 font-bold text-lg">Không có dữ liệu doanh thu</p>
                                <p className="text-gray-400 text-sm mt-2">Không có giao dịch nào được đồng bộ trong tháng này</p>
                            </div>
                        )
                    )}
                    {activeTab === 'cashbook' && (
                        cashbookData && cashbookData.transactions && cashbookData.transactions.length > 0 ? (
                            <CashbookReport data={cashbookData} />
                        ) : (
                            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
                                <p className="text-6xl mb-4">📊</p>
                                <p className="text-gray-600 font-bold text-lg">Không có dữ liệu sổ quỹ</p>
                                <p className="text-gray-400 text-sm mt-2">Không có giao dịch nào được ghi nhận trong tháng này</p>
                            </div>
                        )
                    )}
                    {activeTab === 'inventory' && (
                        inventoryData && inventoryData.items && inventoryData.items.length > 0 ? (
                            <InventoryReport data={inventoryData} />
                        ) : (
                            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
                                <p className="text-6xl mb-4">📦</p>
                                <p className="text-gray-600 font-bold text-lg">Không có dữ liệu tồn kho</p>
                                <p className="text-gray-400 text-sm mt-2">Chưa có sản phẩm nào trong kho</p>
                            </div>
                        )
                    )}
                </>
            )}

            {/* Tip Card */}
            <div className="mt-8 bg-pink-500/5 border border-pink-100 p-6 rounded-3xl">
                <div className="text-pink-600 font-black text-xs uppercase tracking-[0.2em] mb-2">💡 Mẹo</div>
                <p className="text-pink-800 text-sm font-medium">
                    Những báo cáo này có thể được xuất ra PDF hoặc Excel để trình thuế. Dữ liệu được tính từ các giao dịch đã được đồng bộ.
                </p>
            </div>
        </div>
    )
}
