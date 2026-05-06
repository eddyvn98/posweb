import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'
import { getTodayStatsFromLocal } from '../lib/db'
import { 
    TrendingUp, 
    ShoppingCart, 
    Zap, 
    Package, 
    History, 
    Info, 
    AlertTriangle,
    ArrowRight,
    RefreshCw,
    Download
} from '../components/Icons'

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

    const [todayStats, setTodayStats] = useState({ revenue: 0, orders: 0 })

    useEffect(() => {
        if (!shop?.id) return
        const loadStats = async () => {
            const stats = await getTodayStatsFromLocal()
            setTodayStats(stats)
        }
        loadStats()
    }, [shop?.id])

    const handlePullProducts = async () => {
        if (confirm('Tải lại toàn bộ dữ liệu sản phẩm mới nhất?')) {
            await pullProducts()
        }
    }

    return (
        <div className="min-h-screen bg-transparent p-4 pb-20">
            {/* Store Header */}
            <div className="mb-8 mt-2">
                <h1 className="text-3xl font-black text-gray-800 tracking-tight">
                    Chào, <span className="text-primary">{shop?.name || 'Chủ Shop'}</span>
                </h1>
                <p className="text-gray-400 font-medium">Hôm nay của bạn thế nào?</p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="card bg-white border border-pink-50 p-5 shadow-sm rounded-3xl">
                    <div className="mb-2"><TrendingUp className="w-6 h-6 text-primary" /></div>
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Doanh thu</div>
                    <div className="text-xl font-black text-gray-800">
                        {new Intl.NumberFormat('vi-VN').format(todayStats.revenue)}đ
                    </div>
                </div>
                <div className="card bg-white border border-pink-50 p-5 shadow-sm rounded-3xl">
                    <div className="mb-2"><ShoppingCart className="w-6 h-6 text-primary" /></div>
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Đơn hàng</div>
                    <div className="text-xl font-black text-gray-800">{todayStats.orders} Đơn</div>
                </div>
            </div>

            {/* System Status Section */}
            <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Hệ thống & Dữ liệu</h3>

                <div className="card bg-white border border-pink-50 p-4 rounded-3xl shadow-sm space-y-4">
                    {/* Network & Sync */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner ${isOnline ? 'bg-green-50' : 'bg-red-50'}`}>
                                {isOnline ? <Info className="w-6 h-6 text-green-600" /> : <AlertTriangle className="w-6 h-6 text-red-600" />}
                            </div>
                            <div>
                                <div className="font-bold text-gray-800 text-sm">
                                    {isOnline ? 'Đang Trực tuyến' : 'Đang Ngoại tuyến'}
                                </div>
                                <div className="text-[10px] text-gray-400 font-medium">
                                    {isOnline ? 'Sẵn sàng đồng bộ ngay' : 'Dữ liệu sẽ được lưu cục bộ'}
                                </div>
                            </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500 animate-pulse'}`}></div>
                    </div>

                    <hr className="border-pink-50" />

                    {/* Pending Sync */}
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="font-bold text-gray-800 text-sm">Đơn chờ đồng bộ</div>
                            <div className="text-[10px] text-gray-400 font-medium">Số đơn hàng chưa đưa lên Server</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-lg font-black ${pendingCount > 0 ? 'text-orange-500' : 'text-gray-300'}`}>
                                {pendingCount}
                            </span>
                            {pendingCount > 0 && isOnline && (
                                <button
                                    onClick={pushSales}
                                    className="bg-orange-50 text-orange-600 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tighter active:scale-95 transition-transform flex items-center gap-1"
                                >
                                    Gửi ngay <RefreshCw className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    <hr className="border-pink-50" />

                    {/* Product Sync */}
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="font-bold text-gray-800 text-sm">Danh mục sản phẩm</div>
                            <div className="text-[10px] text-gray-400 font-medium">
                                Cập nhật lần cuối: {lastSync ? new Date(lastSync).toLocaleTimeString() : '---'}
                            </div>
                        </div>
                        <button
                            onClick={handlePullProducts}
                            disabled={!isOnline || isSyncing}
                            className="bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter disabled:opacity-30 active:scale-95 transition-transform shadow-md shadow-pink-100 flex items-center gap-1"
                        >
                            {isSyncing ? 'Đang tải...' : (
                                <>
                                    <span>Làm mới</span>
                                    <Download className="w-3 h-3" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Access List */}
            <div className="mt-8 space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Thao tác nhanh</h3>

                <div
                    onClick={() => navigate('/app/sales')}
                    className="card bg-primary p-4 rounded-3xl shadow-lg shadow-pink-200 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer border border-pink-400"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="text-white font-black text-lg leading-tight uppercase tracking-tighter">Bán hàng ngay</div>
                            <div className="text-white/70 text-[10px] font-bold">Mở màn hình scan & thanh toán</div>
                        </div>
                    </div>
                    <div className="text-white/50"><ArrowRight className="w-6 h-6" /></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div
                        onClick={() => navigate('/app/products')}
                        className="card bg-white p-4 rounded-3xl shadow-sm border border-pink-50 flex flex-col gap-2 active:scale-[0.98] transition-all cursor-pointer"
                    >
                        <Package className="w-6 h-6 text-primary" />
                        <div className="font-black text-gray-700 text-sm uppercase tracking-tighter">Kho hàng</div>
                    </div>
                    <div
                        onClick={() => navigate('/app/history')}
                        className="card bg-white p-4 rounded-3xl shadow-sm border border-pink-50 flex flex-col gap-2 active:scale-[0.98] transition-all cursor-pointer"
                    >
                        <History className="w-6 h-6 text-primary" />
                        <div className="font-black text-gray-700 text-sm uppercase tracking-tighter">Lịch sử</div>
                    </div>
                </div>
            </div>

            {/* Vivutrade Ecosystem Banner */}
            <div className="mt-10 mb-6">
                <div 
                    onClick={() => navigate('/app/modules')}
                    className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden cursor-pointer active:scale-[0.99] transition-all"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-black bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                                Ecosystem
                            </span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                By Vivutrade
                            </span>
                        </div>
                        
                        <h4 className="text-white font-black text-xl mb-2 leading-tight">
                            Tăng tốc doanh thu cùng <br/>
                            <span className="text-primary">Vivutrade Pro</span>
                        </h4>
                        
                        <p className="text-gray-400 text-[10px] font-medium mb-4 leading-relaxed max-w-[200px]">
                            Kết nối Telegram Bot, Tự động hóa thanh toán QR và Báo cáo AI chuyên sâu.
                        </p>
                        
                        <button 
                            onClick={() => navigate('/app/modules')}
                            className="bg-white text-gray-900 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-transform flex items-center gap-1"
                        >
                            Nâng cấp ngay <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Decorative Icon */}
                    <div className="absolute bottom-4 right-6 text-white opacity-10">
                        <Zap className="w-16 h-16" />
                    </div>
                </div>
            </div>
        </div>
    )
}
