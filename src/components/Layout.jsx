import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'

import { 
    ShoppingCart, 
    Package, 
    BarChart3, 
    Home as HomeIcon, 
    Download, 
    Receipt, 
    Tag, 
    TrendingUp, 
    History as HistoryIcon, 
    Settings as SettingsIcon,
    FileText
} from 'lucide-react'

export default function Layout({ children }) {
    const navigate = useNavigate()
    const location = useLocation()
    const { signOut } = useAuth()
    const { isOnline, pendingCount } = useSync()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const mainItems = [
        { path: '/sales', label: 'Bán hàng', icon: ShoppingCart },
        { path: '/products', label: 'Sản phẩm', icon: Package },
        { path: '/reports', label: 'Báo cáo', icon: BarChart3 },
    ]

    const sidebarItems = [
        { path: '/dashboard', label: 'Tổng quan', icon: HomeIcon },
        { path: '/sales', label: 'Bán hàng', icon: ShoppingCart },
        { path: '/products', label: 'Sản phẩm', icon: Package },
        { path: '/imports', label: 'Nhập hàng', icon: Download },
        { path: '/imports-sheet', label: 'Nhập sheet', icon: Receipt },
        { path: '/price-tags', label: 'In tem giá', icon: Tag },
        { path: '/shipping-print', label: 'In phiếu sàn K80', icon: FileText },
        { path: '/reports', label: 'Thống kê', icon: BarChart3 },
        { path: '/cashbook', label: 'Sổ quỹ', icon: TrendingUp },
        { path: '/history', label: 'Lịch sử', icon: HistoryIcon },
        { path: '/settings', label: 'Cài đặt', icon: SettingsIcon },
    ]

    const mobileMenuItems = [
        { path: '/dashboard', label: 'Tổng quan', icon: HomeIcon },
        { path: '/shipping-print', label: 'In phiếu sàn K80', icon: FileText },
        { path: '/imports', label: 'Nhập hàng', icon: Download },
        { path: '/imports-sheet', label: 'Nhập sheet', icon: Receipt },
        { path: '/price-tags', label: 'In tem giá', icon: Tag },
        { path: '/cashbook', label: 'Sổ quỹ', icon: TrendingUp },
        { path: '/history', label: 'Lịch sử', icon: HistoryIcon },
        { path: '/settings', label: 'Cài đặt', icon: SettingsIcon },
    ]

    const isActive = (path) => location.pathname === path || (path === '/shipping-print' && (location.pathname === '/tiktok-print' || location.pathname === '/shopee-print'))

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen z-20 shadow-sm">
                <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        P
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">PosWeb</h1>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">Pro POS System</span>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {sidebarItems.map(item => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`
                                w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium text-sm transition-all duration-150
                                ${isActive(item.path)
                                    ? 'bg-sky-600 text-white font-semibold shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                            `}
                        >
                            <item.icon className={`w-4 h-4 ${isActive(item.path) ? 'text-white' : 'text-slate-400'}`} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-200 bg-slate-50/50">
                    <div className="flex items-center gap-2.5 mb-3 px-1">
                        <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]' : 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.4)] animate-pulse'}`}></div>
                        <span className="text-xs font-medium text-slate-600">
                            {isOnline ? 'Hệ thống Trực tuyến' : 'Ngoại tuyến (Offline)'}
                        </span>
                    </div>
                    <button
                        onClick={signOut}
                        className="w-full btn border border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 text-xs py-2 h-auto min-h-0"
                    >
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden md:pb-0">
                {children}
            </main>

            {/* Mobile Bottom Bar - Only Main 3 Items */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 flex justify-between items-center px-2 py-1.5 z-[100] safe-bottom shadow-lg">
                {mainItems.map(item => (
                    <button
                        key={item.path}
                        onClick={() => {
                            navigate(item.path)
                            setMobileMenuOpen(false)
                        }}
                        className={`
                            flex-1 flex flex-col items-center gap-1 py-1.5 transition-all
                            ${isActive(item.path) ? 'text-sky-600 font-bold' : 'text-slate-400'}
                        `}
                    >
                        <item.icon className={`w-5 h-5 transition-transform ${isActive(item.path) ? 'scale-110' : 'scale-100'}`} />
                        <span className="text-[10px] font-semibold tracking-tight">
                            {item.label}
                        </span>
                    </button>
                ))}

                {/* Hamburger Menu */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className={`flex-1 flex flex-col items-center gap-1 py-1.5 transition-all ${mobileMenuOpen ? 'text-sky-600 font-bold' : 'text-slate-400'}`}
                >
                    <span className="flex h-5 w-5 items-center justify-center" aria-hidden="true">
                        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                            <path d="M4 7h16M4 12h16M4 17h16" />
                        </svg>
                    </span>
                    <span className="text-[10px] font-semibold tracking-tight">Thêm</span>
                </button>
            </nav>

            {/* Mobile Sidebar Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    {/* Sidebar */}
                    <div className="absolute bottom-24 left-0 right-0 mx-2 bg-white rounded-3xl shadow-2xl overflow-hidden z-50">
                        <div className="p-4 border-b border-sky-100">
                            <h2 className="font-black text-gray-800">MENU</h2>
                        </div>

                        <nav className="p-2 space-y-1">
                            {mobileMenuItems.map(item => (
                                <button
                                    key={item.path}
                                    onClick={() => {
                                        navigate(item.path)
                                        setMobileMenuOpen(false)
                                    }}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all
                                        ${isActive(item.path)
                                            ? 'bg-primary text-white'
                                            : 'text-gray-500 hover:bg-sky-50'}
                                    `}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="text-sm">{item.label}</span>
                                </button>
                            ))}
                        </nav>

                        <div className="p-4 border-t border-sky-100 space-y-3">
                            <div className="flex items-center gap-3 px-2">
                                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                                <span className="text-xs font-bold text-gray-400">
                                    {isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
                                </span>
                            </div>
                            <button
                                onClick={() => {
                                    signOut()
                                    setMobileMenuOpen(false)
                                }}
                                className="w-full btn bg-gray-100 text-gray-500 hover:text-red-500 hover:bg-red-50 text-sm"
                            >
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

