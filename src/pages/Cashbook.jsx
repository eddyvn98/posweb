import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getCashbookReport, formatMoney } from '../lib/reports'
import { useNotification } from '../contexts/NotificationContext'
import { 
    TrendingUp, 
    Loader2, 
    ArrowDownLeft, 
    ArrowUpRight,
    Search,
    ChevronLeft,
    ChevronRight,
    Wallet
} from 'lucide-react'

export default function Cashbook() {
    const { shop } = useAuth()
    const { showNotification } = useNotification()
    const [year, setYear] = useState(new Date().getFullYear())
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState(null)

    // Filter states
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState('all') // 'all' | 'in' | 'out'

    useEffect(() => {
        if (!shop?.id) return

        const loadCashbook = async () => {
            setLoading(true)
            try {
                const report = await getCashbookReport(shop.id, year, month)
                if (!report) throw new Error('Không thể tải sổ quỹ')
                setData(report)
            } catch (err) {
                console.error('Error loading cashbook:', err)
                showNotification('Lỗi khi tải sổ quỹ', 'error')
            } finally {
                setLoading(false)
            }
        }

        loadCashbook()
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

    const monthName = new Date(year, month - 1).toLocaleString('vi-VN', {
        month: 'long',
        year: 'numeric'
    })

    // Filtered transactions
    const filteredTransactions = useMemo(() => {
        if (!data?.transactions) return []
        return data.transactions.filter(tx => {
            const matchesQuery = !searchQuery.trim() || 
                (tx.description || '').toLowerCase().includes(searchQuery.trim().toLowerCase())

            if (!matchesQuery) return false

            if (filterType === 'in') return tx.type === 'in'
            if (filterType === 'out') return tx.type === 'out'

            return true
        })
    }, [data?.transactions, searchQuery, filterType])

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm p-4 sticky top-0 z-10 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <Wallet className="w-6 h-6 text-primary" /> Sổ Quỹ
                        </h1>
                        <p className="text-xs text-gray-500 font-medium">Theo dõi tất cả dòng tiền thu và chi trong tháng</p>
                    </div>

                    {/* Month Navigator */}
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-full sm:w-auto justify-between">
                        <button
                            onClick={handlePreviousMonth}
                            className="p-1.5 rounded-lg hover:bg-white text-gray-700 transition"
                            title="Tháng trước"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-black text-gray-800 capitalize px-2">{monthName}</span>
                        <button
                            onClick={handleNextMonth}
                            className="p-1.5 rounded-lg hover:bg-white text-gray-700 transition"
                            title="Tháng sau"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Summary Cards */}
                {data && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                        {/* Tổng thu */}
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/40 border border-emerald-200/80 rounded-3xl p-5 shadow-xs">
                            <div className="flex items-center justify-between">
                                <p className="text-emerald-700 text-xs font-black uppercase tracking-wider">Tổng Thu (+)</p>
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                    <ArrowDownLeft className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
                                {formatMoney(data.totalIn)} <span className="text-xs font-bold text-emerald-600">đ</span>
                            </p>
                        </div>

                        {/* Tổng chi */}
                        <div className="bg-gradient-to-br from-rose-50 to-rose-100/40 border border-rose-200/80 rounded-3xl p-5 shadow-xs">
                            <div className="flex items-center justify-between">
                                <p className="text-rose-700 text-xs font-black uppercase tracking-wider">Tổng Chi (-)</p>
                                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                                    <ArrowUpRight className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-2xl sm:text-3xl font-black text-rose-700 mt-2">
                                {formatMoney(data.totalOut)} <span className="text-xs font-bold text-rose-600">đ</span>
                            </p>
                        </div>

                        {/* Số dư */}
                        <div className={`bg-gradient-to-br ${
                            data.balance >= 0 ? 'from-sky-50 to-sky-100/40 border-sky-200/80' : 'from-amber-50 to-amber-100/40 border-amber-200/80'
                        } border rounded-3xl p-5 shadow-xs`}>
                            <div className="flex items-center justify-between">
                                <p className={`text-xs font-black uppercase tracking-wider ${data.balance >= 0 ? 'text-sky-700' : 'text-amber-700'}`}>
                                    Số Dư Quỹ
                                </p>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${data.balance >= 0 ? 'bg-sky-100 text-sky-600' : 'bg-amber-100 text-amber-600'}`}>
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                            </div>
                            <p className={`text-2xl sm:text-3xl font-black mt-2 ${data.balance >= 0 ? 'text-sky-700' : 'text-amber-700'}`}>
                                {formatMoney(data.balance)} <span className="text-xs font-bold opacity-75">đ</span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Filter and Search Bar */}
                <div className="bg-white rounded-2xl border border-gray-200 p-3 sm:p-4 flex flex-col sm:flex-row gap-3 justify-between items-center shadow-sm">
                    <div className="relative w-full sm:w-80">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm theo nội dung giao dịch..."
                            className="w-full h-10 pl-9 pr-8 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-primary focus:border-primary focus:bg-white transition outline-none"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-xs"
                                title="Xóa từ khóa"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Filter Chips */}
                    <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                        {[
                            { id: 'all', label: 'Tất cả giao dịch' },
                            { id: 'in', label: 'Thu (+)' },
                            { id: 'out', label: 'Chi (-)' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setFilterType(tab.id)}
                                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition ${
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

                {/* Transactions List */}
                {loading ? (
                    <div className="bg-white rounded-3xl p-12 text-center flex flex-col items-center gap-2 border border-gray-200 shadow-sm">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-gray-500 font-bold text-sm">Đang tải sổ quỹ...</p>
                    </div>
                ) : filteredTransactions.length > 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-black text-gray-800 text-xs sm:text-sm uppercase tracking-wide">
                                Danh sách giao dịch ({filteredTransactions.length})
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs sm:text-sm text-left">
                                <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-bold uppercase text-[11px]">
                                    <tr>
                                        <th className="px-5 py-3">Ngày</th>
                                        <th className="px-5 py-3">Loại</th>
                                        <th className="px-5 py-3">Nội dung</th>
                                        <th className="px-5 py-3 text-right">Số tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredTransactions.map((tx, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/60 transition">
                                            <td className="px-5 py-3 font-bold text-gray-800 whitespace-nowrap">
                                                {new Date(tx.date + 'T00:00:00').toLocaleDateString('vi-VN', {
                                                    weekday: 'short',
                                                    month: '2-digit',
                                                    day: '2-digit'
                                                })}
                                            </td>
                                            <td className="px-5 py-3 font-bold">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black ${
                                                    tx.type === 'in' 
                                                        ? 'bg-emerald-100 text-emerald-800' 
                                                        : 'bg-rose-100 text-rose-800'
                                                }`}>
                                                    {tx.type === 'in' ? (
                                                        <><ArrowDownLeft className="w-3.5 h-3.5" /> Thu</>
                                                    ) : (
                                                        <><ArrowUpRight className="w-3.5 h-3.5" /> Chi</>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-gray-700 font-medium">{tx.description}</td>
                                            <td className={`px-5 py-3 text-right font-black text-sm sm:text-base font-mono whitespace-nowrap ${
                                                tx.type === 'in' ? 'text-emerald-600' : 'text-rose-600'
                                            }`}>
                                                {tx.type === 'in' ? '+' : '-'}{formatMoney(tx.amount)} đ
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-sm">
                        <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 font-bold text-base">
                            {searchQuery || filterType !== 'all' ? 'Không tìm thấy giao dịch phù hợp' : 'Không có giao dịch nào trong tháng'}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">Bán hàng hoặc nhập kho sẽ tự động tạo giao dịch tại đây</p>
                    </div>
                )}
            </div>
        </div>
    )
}
