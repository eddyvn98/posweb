import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'
import { 
    Sparkles, 
    DollarSign, 
    ShoppingBag, 
    Wifi, 
    WifiOff, 
    Zap, 
    Package, 
    History, 
    ArrowRight,
    RefreshCw,
    TrendingUp
} from 'lucide-react'

export default function Home() {
    const navigate = useNavigate()
    const { shop } = useAuth()
    const {
        isOnline,
        isSyncing,
        pendingCount,
        lastSync,
        pullProducts,
        pushSales
    } = useSync()

    const handlePullProducts = async () => {
        if (confirm('Tải lại toàn bộ dữ liệu sản phẩm mới nhất?')) {
            await pullProducts()
        }
    }

    // (Mock stats - In future, fetch actual daily totals from local DB)
    const todayStats = {
        revenue: 0,
        orders: 0
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 pb-24 max-w-7xl mx-auto space-y-6">
            {/* Store Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <span>Xin chào, <span className="text-sky-600">{shop?.name || 'Chủ Shop'}</span></span>
                        <Sparkles className="w-5 h-5 text-amber-500" />
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Tổng quan hoạt động bán hàng hôm nay</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/sales')}
                        className="btn btn-primary btn-sm"
                    >
                        <Zap className="w-3.5 h-3.5" /> Bán hàng ngay
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Doanh Thu Hôm Nay</span>
                        <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums tracking-tight">
                        {new Intl.NumberFormat('vi-VN').format(todayStats.revenue)} <span className="text-xs font-normal text-slate-500">đ</span>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đơn Hàng</span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums tracking-tight">
                        {todayStats.orders} <span className="text-xs font-normal text-slate-500">đơn</span>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chờ Đồng Bộ</span>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${pendingCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                            <RefreshCw className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums tracking-tight flex items-center justify-between">
                        <span>{pendingCount}</span>
                        {pendingCount > 0 && isOnline && (
                            <button
                                onClick={pushSales}
                                className="text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-colors"
                            >
                                Gửi ngay
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng Thái Kết Nối</span>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]' : 'bg-rose-500 animate-pulse'}`}></span>
                        <span className="text-sm font-semibold text-slate-900">
                            {isOnline ? 'Trực tuyến' : 'Ngoại tuyến (Offline)'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Actions Bento Section */}
            <div className="space-y-3">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thao Tác Tức Thì</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div
                        onClick={() => navigate('/sales')}
                        className="bg-sky-600 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between active:scale-[0.98] hover:bg-sky-700 transition-all cursor-pointer border border-sky-700"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white">
                                <Zap className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="font-bold text-base">Bán Hàng Ngay</div>
                                <div className="text-white/80 text-xs font-normal">Quét mã & thanh toán nhanh</div>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white/80" />
                    </div>

                    <div
                        onClick={() => navigate('/products')}
                        className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between active:scale-[0.98] hover:border-slate-300 transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                                <Package className="w-6 h-6 text-sky-600" />
                            </div>
                            <div>
                                <div className="font-bold text-slate-900 text-base">Quản Lý Sản Phẩm</div>
                                <div className="text-slate-500 text-xs font-normal">Xem & thêm mới mặt hàng</div>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400" />
                    </div>

                    <div
                        onClick={() => navigate('/history')}
                        className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between active:scale-[0.98] hover:border-slate-300 transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                                <History className="w-6 h-6 text-sky-600" />
                            </div>
                            <div>
                                <div className="font-bold text-slate-900 text-base">Lịch Sử Giao Dịch</div>
                                <div className="text-slate-500 text-xs font-normal">Tra cứu hóa đơn đã bán</div>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400" />
                    </div>
                </div>
            </div>

            {/* System Info Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thông Tin Dữ Liệu</span>
                    <button
                        onClick={handlePullProducts}
                        disabled={!isOnline || isSyncing}
                        className="btn border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs py-1.5 px-3 min-h-0 h-auto disabled:opacity-40"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Đang tải...' : 'Làm mới danh mục'}</span>
                    </button>
                </div>
                <div className="text-xs text-slate-500 flex justify-between items-center">
                    <span>Thời gian đồng bộ danh mục sản phẩm gần nhất:</span>
                    <span className="font-mono font-semibold text-slate-700">
                        {lastSync ? new Date(lastSync).toLocaleString('vi-VN') : 'Chưa đồng bộ'}
                    </span>
                </div>
            </div>
        </div>
    )
}

