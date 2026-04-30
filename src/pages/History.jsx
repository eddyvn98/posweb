import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSalesHistory } from '../lib/db'
import InvoiceModal from '../components/InvoiceModal'
import VoidModal from '../components/VoidModal'

export default function History() {
    const navigate = useNavigate()
    const [sales, setSales] = useState([])
    const [selectedSale, setSelectedSale] = useState(null)
    const [voidSale, setVoidSale] = useState(null)
    const [loading, setLoading] = useState(true)

    // Load History
    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true)
            // Default limit 50 recent sales from local DB
            // In real app, we would merge with Supabase data or have pagination
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
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white shadow-sm p-4 sticky top-0 z-10 border-b">
                <div className="flex gap-3 items-center">
                    <h1 className="text-xl font-black flex-1 text-gray-800 uppercase tracking-tighter">Lịch sử bán hàng</h1>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 p-4">
                <div className="card bg-blue-50 border-blue-100">
                    <p className="text-xs text-blue-600 uppercase font-bold">Doanh thu (50 đơn gần nhất)</p>
                    <p className="text-xl font-bold text-blue-800">
                        {new Intl.NumberFormat('vi-VN').format(totalRevenue)}
                    </p>
                </div>
                <div className="card bg-purple-50 border-purple-100">
                    <p className="text-xs text-purple-600 uppercase font-bold">Số đơn hàng</p>
                    <p className="text-xl font-bold text-purple-800">{totalCount}</p>
                </div>
            </div>

            {/* List */}
            <div className="p-4 pt-0 space-y-6">
                {loading ? (
                    <div className="text-center py-16">
                        <p className="text-5xl mb-4">⏳</p>
                        <p className="text-gray-500 font-bold">Đang tải lịch sử...</p>
                    </div>
                ) : sales.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-5xl mb-4">📜</p>
                        <p className="text-gray-600 font-bold text-lg">Chưa có giao dịch nào</p>
                        <p className="text-gray-400 text-sm mt-2">Bắt đầu bán hàng để xem lịch sử ở đây</p>
                    </div>
                ) : (
                    Object.entries(groupedSales).map(([date, daySales]) => (
                        <div key={date}>
                            <h3 className="text-sm font-bold text-gray-500 mb-2 sticky top-[70px] bg-gray-50 py-1">{date}</h3>
                            <div className="space-y-3">
                                {daySales.map(sale => (
                                    <div
                                        key={sale.local_id || sale.id}
                                        className="card space-y-2"
                                    >
                                        <div
                                            onClick={() => setSelectedSale(sale)}
                                            className="flex justify-between items-center active:scale-[0.98] transition-transform cursor-pointer"
                                        >
                                            <div className="flex gap-3 items-center">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs ${sale.payment_method === 'transfer' ? 'bg-indigo-500' : 'bg-green-500'}`}>
                                                    {sale.payment_method === 'transfer' ? 'CK' : 'TM'}
                                                </div>
                                                <div>
                                                    <div className="font-bold flex items-center gap-2">
                                                        #{sale.code || '---'}
                                                        {sale.is_void && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">Đã huỷ</span>}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(sale.created_at || sale.sale_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                        {' • '}
                                                        {sale.items?.length} món
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`font-bold ${sale.is_void ? 'text-red-600 line-through' : 'text-primary'}`}>
                                                    {new Intl.NumberFormat('vi-VN').format(sale.total_amount)}
                                                </div>
                                                {sale.synced === 1 ? (
                                                    <span className="text-[10px] text-green-600">✓ Đã sync</span>
                                                ) : (
                                                    <span className="text-[10px] text-orange-500">☁ Chờ sync</span>
                                                )}
                                            </div>
                                        </div>
                                        {!sale.is_void && sale.synced === 1 && (
                                            <button
                                                onClick={() => setVoidSale(sale)}
                                                className="w-full text-xs font-bold text-red-600 hover:text-red-700 border-t pt-2 transition"
                                            >
                                                🗑️ Huỷ phiếu này
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
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
