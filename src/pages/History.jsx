import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSalesHistory } from '../lib/db'
import { useAuth } from '../contexts/AuthContext'
import InvoiceModal from '../components/InvoiceModal'

import VoidModal from '../components/VoidModal'
import { TrendingUp, ShoppingCart, History as HistoryIcon, ArrowLeft } from '../components/Icons'

export default function History() {
    const { user } = useAuth()
    const isOwner = user?.role === 'owner'
    const navigate = useNavigate()

    const [sales, setSales] = useState([])
    const [selectedSale, setSelectedSale] = useState(null)
    const [voidSale, setVoidSale] = useState(null)
    const [loading, setLoading] = useState(true)

    // Load History
    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true)
            const data = await getSalesHistory(50)
            setSales(data)
            setLoading(false)
        }
        fetchHistory()
    }, [])

    // Group by Date Helper
    const groupedSales = sales.reduce((groups, sale) => {
        const date = new Date(sale.created_at || sale.sale_date).toLocaleDateString('vi-VN')
        if (!groups[date]) groups[date] = []
        groups[date].push(sale)
        return groups
    }, {})

    // Stats
    const totalRevenue = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0)
    const totalCount = sales.length

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-24">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-lg font-black text-gray-800 uppercase tracking-tight flex-1">
                        Lịch sử bán hàng
                    </h1>
                    <div className="bg-gray-100 p-2 rounded-full">
                        <HistoryIcon className="w-5 h-5 text-gray-500" />
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4 p-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-50 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute -right-2 -top-2 text-blue-50 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-16 h-16" strokeWidth={3} />
                        </div>
                        <p className="text-[10px] text-blue-500 uppercase font-black tracking-wider mb-1 relative z-10">Doanh thu (50 đơn)</p>
                        <p className="text-xl font-black text-blue-900 relative z-10">
                            {new Intl.NumberFormat('vi-VN').format(totalRevenue)}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-purple-50 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute -right-2 -top-2 text-purple-50 group-hover:scale-110 transition-transform">
                            <ShoppingCart className="w-16 h-16" strokeWidth={3} />
                        </div>
                        <p className="text-[10px] text-purple-500 uppercase font-black tracking-wider mb-1 relative z-10">Số đơn hàng</p>
                        <p className="text-xl font-black text-purple-900 relative z-10">{totalCount}</p>
                    </div>
                </div>

                {/* List */}
                <div className="px-4 space-y-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 font-medium">Đang tải lịch sử...</p>
                        </div>
                    ) : sales.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center">
                            <div className="bg-gray-50 p-6 rounded-full mb-4">
                                <HistoryIcon className="w-12 h-12 text-gray-200" />
                            </div>
                            <p className="text-gray-600 font-bold text-lg">Chưa có giao dịch nào</p>
                            <p className="text-gray-400 text-sm mt-1">Giao dịch của bạn sẽ xuất hiện tại đây</p>
                        </div>
                    ) : (
                        Object.entries(groupedSales).map(([date, daySales]) => (
                            <div key={date} className="relative">
                                <div className="sticky top-16 z-10 bg-[#F8F9FA]/80 backdrop-blur-sm py-3 mb-3">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <span className="w-8 h-[1px] bg-gray-200"></span>
                                        {date}
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    {daySales.map(sale => (
                                        <div
                                            key={sale.local_id || sale.id}
                                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:border-primary/30 transition-all group"
                                        >
                                            <div
                                                onClick={() => setSelectedSale(sale)}
                                                className="p-4 flex justify-between items-center cursor-pointer active:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex gap-4 items-center">
                                                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-[10px] font-black shadow-inner transition-transform group-hover:scale-105 ${
                                                        sale.payments?.length > 1
                                                        ? 'bg-amber-50 text-amber-600'
                                                        : sale.payment_method === 'transfer' 
                                                        ? 'bg-indigo-50 text-indigo-600' 
                                                        : 'bg-emerald-50 text-emerald-600'
                                                    }`}>
                                                        <span className="text-sm">
                                                            {sale.payments?.length > 1 ? 'MIX' : (sale.payment_method === 'transfer' ? 'CK' : 'TM')}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-gray-800 flex items-center gap-2">
                                                            #{sale.code || '---'}
                                                            {sale.is_void && (
                                                                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-md font-black uppercase">Đã huỷ</span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-400 font-medium mt-0.5">
                                                            {new Date(sale.created_at || sale.sale_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                            {' • '}
                                                            <span className="text-gray-600">{sale.items?.length || 0} món</span>
                                                            {sale.note && <span className="text-amber-500 ml-2">● Ghi chú</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-lg font-black tracking-tighter ${sale.is_void ? 'text-gray-300 line-through' : 'text-gray-900'}`}>
                                                        {new Intl.NumberFormat('vi-VN').format(sale.total_amount)}
                                                    </div>
                                                    <div className="flex items-center justify-end gap-1 mt-1">
                                                        {sale.synced === 1 ? (
                                                            <span className="flex items-center gap-0.5 text-[9px] font-black text-emerald-500 uppercase tracking-wider">
                                                                <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                                                                Đã sync
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-0.5 text-[9px] font-black text-orange-400 uppercase tracking-wider">
                                                                <div className="w-1 h-1 rounded-full bg-orange-400 animate-pulse"></div>
                                                                Chờ sync
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {!sale.is_void && isOwner && (
                                                <div className="px-4 pb-3 flex justify-end">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setVoidSale(sale)
                                                        }}
                                                        className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                    >
                                                        Huỷ phiếu
                                                    </button>
                                                </div>
                                            )}

                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Invoice Modal */}
            {selectedSale && (
                <InvoiceModal
                    sale={selectedSale}
                    onClose={() => setSelectedSale(null)}
                />
            )}

            {/* Void Modal */}
            {voidSale && (
                <VoidModal
                    sale={voidSale}
                    onClose={() => setVoidSale(null)}
                    onVoidSuccess={() => {
                        setSelectedSale(null)
                        // Refresh list
                        const fetchHistory = async () => {
                            const data = await getSalesHistory(50)
                            setSales(data)
                        }
                        fetchHistory()
                    }}
                />
            )}
        </div>
    )
}
