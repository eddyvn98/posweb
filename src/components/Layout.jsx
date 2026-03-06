import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'

export default function Layout({ children }) {
    const navigate = useNavigate()
    const location = useLocation()
    const { signOut } = useAuth()
    const { isOnline, pendingCount } = useSync()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const mainItems = [
        { path: '/sales', label: 'Bán hàng', icon: '🛒' },
        { path: '/products', label: 'Sản phẩm', icon: '📦' },
        { path: '/reports', label: 'Báo cáo', icon: '📊' },
    ]

    const sidebarItems = [
        { path: '/dashboard', label: 'Tổng quan', icon: '⛺' },
        { path: '/sales', label: 'Bán hàng', icon: '🛒' },
        { path: '/products', label: 'Sản phẩm', icon: '📦' },
        { path: '/imports', label: 'Nhập hàng', icon: '📥' },
        { path: '/imports-sheet', label: 'Nhập sheet', icon: '🧾' },
        { path: '/reports', label: 'Thống kê', icon: '📊' },
        { path: '/cashbook', label: 'Sổ quỹ', icon: '📈' },
        { path: '/history', label: 'Lịch sử', icon: '📜' },
        { path: '/settings', label: 'Cài đặt', icon: '⚙️' },
    ]

    const mobileMenuItems = [
        { path: '/dashboard', label: 'Tổng quan', icon: '⛺' },
        { path: '/imports', label: 'Nhập hàng', icon: '📥' },
        { path: '/imports-sheet', label: 'Nhập sheet', icon: '🧾' },
        { path: '/cashbook', label: 'Sổ quỹ', icon: '📈' },
        { path: '/history', label: 'Lịch sử', icon: '📜' },
        { path: '/settings', label: 'Cài đặt', icon: '⚙️' },
    ]

    const isActive = (path) => location.pathname === path

    return (
        <div className="min-h-screen bg-pink-50/30 flex flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 bg-white border-r border-pink-100 flex-col sticky top-0 h-screen z-20">
                <div className="p-6">
                    <h1 className="text-2xl font-black text-primary tracking-tighter italic">OpenPOS</h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {sidebarItems.map(item => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`
                                w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all
                                ${isActive(item.path)
                                    ? 'bg-primary text-white shadow-lg shadow-pink-200'
                                    : 'text-gray-500 hover:bg-pink-50'}
                            `}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-pink-50">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse'}`}></div>
                        <span className="text-xs font-bold text-gray-400">
                            {isOnline ? 'Hệ thống Trực tuyến' : 'Ngoại tuyến (Offline)'}
                        </span>
                    </div>
                    <button
                        onClick={signOut}
                        className="w-full btn bg-gray-100 text-gray-500 hover:text-red-500 hover:bg-red-50 text-sm"
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
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-pink-100 flex justify-between items-center px-2 py-2 z-[100] safe-bottom">
                {mainItems.map(item => (
                    <button
                        key={item.path}
                        onClick={() => {
                            navigate(item.path)
                            setMobileMenuOpen(false)
                        }}
                        className={`
                            flex-1 flex flex-col items-center gap-1 py-2 transition-all
                            ${isActive(item.path) ? 'text-primary' : 'text-gray-400'}
                        `}
                    >
                        <span className={`text-2xl transition-transform ${isActive(item.path) ? 'scale-110' : 'scale-100'}`}>
                            {item.icon}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-tighter">
                            {item.label}
                        </span>
                        {isActive(item.path) && (
                            <div className="w-1 h-1 rounded-full bg-primary mt-0.5"></div>
                        )}
                    </button>
                ))}

                {/* Hamburger Menu */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 transition-all ${mobileMenuOpen ? 'text-primary' : 'text-gray-400'}`}
                >
                    <span className="flex h-6 w-6 items-center justify-center" aria-hidden="true">
                        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                            <path d="M4 7h16M4 12h16M4 17h16" />
                        </svg>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Thêm</span>
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
                        <div className="p-4 border-b border-pink-100">
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
                                            : 'text-gray-500 hover:bg-pink-50'}
                                    `}
                                >
                                    <span className="text-xl">{item.icon}</span>
                                    <span className="text-sm">{item.label}</span>
                                </button>
                            ))}
                        </nav>

                        <div className="p-4 border-t border-pink-100 space-y-3">
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

