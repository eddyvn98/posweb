import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSalesHistory } from '../lib/db'
import InvoiceModal from '../components/InvoiceModal'
import VoidModal from '../components/VoidModal'
import { normalizeString } from '../lib/searchUtils'
import { 
    History as HistoryIcon, 
    Loader2, 
    FileText, 
    CheckCircle2, 
    Cloud, 
    Trash2,
    Search,
    CreditCard,
    Banknote
} from 'lucide-react'

export default function History() {
    const navigate = useNavigate()
    const [sales, setSales] = useState([])
    const [query, setQuery] = useState('')
    const [selectedSale, setSelectedSale] = useState(null)
    const [voidSale, setVoidSale] = useState(null)
    const [loading, setLoading] = useState(true)
    const [filterType, setFilterType] = useState('all') // 'all' | 'cash' | 'transfer' | 'unsynced' | 'void'

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

    // Filter sales based on query and filter chips
    const filteredSales = useMemo(() => {
        return sales.filter(sale => {
            // Filter by search query
            if (query.trim()) {
                const q = normalizeString(query)
                const codeMatch = normalizeString(sale.code || '').includes(q)
                const idMatch = String(sale.id || sale.local_id || '').includes(q)
                const itemMatch = sale.items?.some(item => 
                    normalizeString(item.name || item.product_name || '').includes(q) ||
                    normalizeString(item.barcode || '').includes(q)
                )
                const payMatch = normalizeString(sale.payment_method === 'transfer' ? 'chuyen khoan ck' : 'tien mat tm').includes(q)
                
                if (!codeMatch && !idMatch && !itemMatch && !payMatch) return false
            }

            // Filter by type
            if (filterType === 'cash') return sale.payment_method === 'cash' || !sale.payment_method
            if (filterType === 'transfer') return sale.payment_method === 'transfer'
            if (filterType === 'unsynced') return sale.synced !== 1
            if (filterType === 'void') return sale.is_void === 1 || sale.is_void === true

            return true
        })
    }, [sales, query, filterType])

    // Group by Date Helper
    const groupedSales = filteredSales.reduce((groups, sale) => {
        const date = new Date(sale.created_at || sale.sale_date).toLocaleDateString('vi-VN')
        if (!groups[date]) groups[date] = []
        groups[date].push(sale)
        return groups
    }, {})

    // Stats
    const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.is_void ? 0 : (s.total_amount || 0)), 0)
    const totalCount = filteredSales.length

    const formatMoney = (val) => new Intl.NumberFormat('vi-VN').format(Number(val || 0))

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Top Bar Header */}
            <div className="bg-white shadow-sm p-4 sticky top-0 z-10 border-b border-gray-200 space-y-3">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <HistoryIcon className="w-6 h-6 text-primary" /> Lịch sử bán hàng
                    </h1>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Doanh thu ({totalCount} đơn)</p>
                        <p className="text-base font-black text-primary">{formatMoney(totalRevenue)} đ</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        className="w-full h-10 pl-9 pr-8 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-primary focus:border-primary focus:bg-white transition-all outline-none"
                        placeholder="Tìm theo Mã hóa đơn (#HD...), tên SP, mã vạch..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-xs"
                            title="Xóa từ khóa"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1">
                    {[
                        { id: 'all', label: 'Tất cả' },
                        { id: 'cash', label: 'Tiền mặt' },
                        { id: 'transfer', label: 'Chuyển khoản' },
                        { id: 'unsynced', label: 'Chờ sync' },
                        { id: 'void', label: 'Đã hủy' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterType(tab.id)}
                            className={`px-3 py-1 rounded-xl font-bold text-xs whitespace-nowrap transition ${
                                filterType === tab.id
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="p-4 space-y-6">
                {loading ? (
                    <div className="text-center py-16 flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-gray-500 font-bold text-sm">Đang tải lịch sử đơn hàng...</p>
                    </div>
                ) : filteredSales.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-sm">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 font-bold text-base">
                            {query || filterType !== 'all' ? 'Không tìm thấy hóa đơn phù hợp' : 'Chưa có đơn hàng nào'}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                            {query || filterType !== 'all' ? 'Thử tìm với từ khóa khác' : 'Thực hiện bán hàng để xem đơn tại đây'}
                        </p>
                    </div>
                ) : (
                    Object.entries(groupedSales).map(([date, daySales]) => (
                        <div key={date} className="space-y-3">
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider sticky top-[138px] bg-gray-50/95 backdrop-blur-sm py-1.5 z-5 flex items-center justify-between border-b border-gray-200/50">
                                <span>{date}</span>
                                <span className="text-[11px] font-bold text-gray-400">{daySales.length} đơn</span>
                            </h3>

                            <div className="space-y-3">
                                {daySales.map(sale => (
                                    <div
                                        key={sale.local_id || sale.id}
                                        className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs hover:shadow-md transition space-y-3"
                                    >
                                        <div
                                            onClick={() => setSelectedSale(sale)}
                                            className="flex justify-between items-start cursor-pointer group"
                                        >
                                            <div className="flex gap-3 items-center">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-xs shrink-0 ${
                                                    sale.payment_method === 'transfer' ? 'bg-sky-500' : 'bg-sky-600'
                                                }`}>
                                                    {sale.payment_method === 'transfer' ? <CreditCard className="w-5 h-5" /> : <Banknote className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <div className="font-black text-gray-900 text-sm group-hover:text-primary transition flex items-center gap-2">
                                                        #{sale.code || '---'}
                                                        {sale.is_void && (
                                                            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                                                                Đã huỷ
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                                                        <span>{new Date(sale.created_at || sale.sale_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span>•</span>
                                                        <span>{sale.items?.length || 0} món</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`font-black text-base ${sale.is_void ? 'text-red-500 line-through' : 'text-primary'}`}>
                                                    {formatMoney(sale.total_amount)} đ
                                                </div>
                                                {sale.synced === 1 ? (
                                                    <span className="text-[10px] text-emerald-600 font-bold flex items-center justify-end gap-0.5 mt-1">
                                                        <CheckCircle2 className="w-3 h-3" /> Đã sync
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-amber-500 font-bold flex items-center justify-end gap-0.5 mt-1">
                                                        <Cloud className="w-3 h-3" /> Chờ sync
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {!sale.is_void && (
                                            <div className="pt-2 border-t border-gray-100 flex justify-end">
                                                <button
                                                    onClick={() => setVoidSale(sale)}
                                                    className="text-xs font-bold text-red-500 hover:text-red-700 transition flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Huỷ phiếu này
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
