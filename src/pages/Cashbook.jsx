import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getCashbookReport, formatMoney, formatDateVN } from '../lib/reports'
import { useNotification } from '../contexts/NotificationContext'
import { BarChart3, ArrowLeft, ArrowRight, Wallet, TrendingDown } from '../components/Icons'

export default function Cashbook() {
    const { shop } = useAuth()
    const { showNotification } = useNotification()
    const [year, setYear] = useState(new Date().getFullYear())
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState(null)

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

    if (!data && !loading) {
        return (
            <div className="min-h-screen bg-gray-50 pb-20">
                <div className="text-center py-16">
                    <p className="text-gray-500 font-bold">Không có dữ liệu</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100 px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <BarChart3 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight leading-none">
                            Sổ quỹ
                        </h1>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mt-1.5 hidden sm:block">
                            Theo dõi tất cả giao dịch thu và chi
                        </p>
                    </div>
                </div>
            </div>

            {/* Month Navigation */}
            <div className="p-4">
                <div className="bg-white rounded-3xl p-4 mb-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between gap-1 sm:gap-6">
                        <button
                            onClick={handlePreviousMonth}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-gray-100 active:scale-90 transition-all shadow-sm shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>

                        <div className="text-center flex-1 min-w-0 px-2">
                            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Thời gian</p>
                            <div className="flex items-center justify-center">
                                <span className="text-base sm:text-2xl font-black text-gray-900 capitalize whitespace-nowrap tracking-tight">
                                    {monthName.replace('tháng', 'Tháng').replace(' năm ', ' / ')}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleNextMonth}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-gray-100 active:scale-90 transition-all shadow-sm shrink-0"
                        >
                            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                {data && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 rounded-3xl p-6">
                            <p className="text-gray-600 text-sm font-bold uppercase">Tổng thu</p>
                            <p className="text-3xl font-black text-green-600 mt-2">{formatMoney(data.totalIn)}</p>
                            <p className="text-xs text-gray-500 mt-1">đ</p>
                        </div>

                        <div className="bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200 rounded-3xl p-6">
                            <p className="text-gray-600 text-sm font-bold uppercase">Tổng chi</p>
                            <p className="text-3xl font-black text-red-600 mt-2">{formatMoney(data.totalOut)}</p>
                            <p className="text-xs text-gray-500 mt-1">đ</p>
                        </div>

                        <div className={`bg-gradient-to-br ${data.balance >= 0 ? 'from-blue-50 to-blue-100/50' : 'from-orange-50 to-orange-100/50'} border ${data.balance >= 0 ? 'border-blue-200' : 'border-orange-200'} rounded-3xl p-6`}>
                            <p className="text-gray-600 text-sm font-bold uppercase">Số dư</p>
                            <p className={`text-3xl font-black mt-2 ${data.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                {formatMoney(data.balance)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">đ</p>
                        </div>
                    </div>
                )}

                {/* Transactions Table */}
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 font-bold">Đang tải...</p>
                    </div>
                ) : data?.transactions?.length > 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                            <h3 className="font-black text-gray-800 uppercase tracking-wide">Chi tiết giao dịch ({data.transactions?.length || 0})</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-black text-gray-600 uppercase">Ngày</th>
                                        <th className="px-6 py-3 text-left font-black text-gray-600 uppercase">Thu/Chi</th>
                                        <th className="px-6 py-3 text-left font-black text-gray-600 uppercase">Nội dung</th>
                                        <th className="px-6 py-3 text-right font-black text-gray-600 uppercase">Số tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.transactions?.map((tx, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition">
                                            <td className="px-6 py-3 font-bold text-gray-800">
                                                {new Date(tx.date + 'T00:00:00').toLocaleDateString('vi-VN', {
                                                    weekday: 'short',
                                                    month: '2-digit',
                                                    day: '2-digit'
                                                })}
                                            </td>
                                            <td className={`px-6 py-3 font-bold flex items-center gap-2 ${tx.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.type === 'in' ? <Wallet className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                                {tx.type === 'in' ? 'Thu' : 'Chi'}
                                            </td>
                                            <td className="px-6 py-3 text-gray-700">{tx.description}</td>
                                            <td className={`px-6 py-3 text-right font-black ${tx.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatMoney(tx.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 flex flex-col items-center">
                        <div className="bg-gray-50 p-6 rounded-full mb-4">
                            <BarChart3 className="w-12 h-12 text-gray-200" />
                        </div>
                        <p className="text-gray-600 font-bold">Không có giao dịch nào</p>
                        <p className="text-gray-400 text-sm mt-2">Bán hàng hoặc nhập hàng sẽ tạo giao dịch ở đây</p>
                    </div>
                )}
            </div>
        </div>
    )
}
