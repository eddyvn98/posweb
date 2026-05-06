import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'
import CartBar from './CartBar'
import { RefreshCw, Info } from './Icons'

function NavIcon({ id, className = 'w-5 h-5' }) {
    if (id === 'dashboard') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" className={className}><path d="M3 12h8V3H3zM13 21h8v-8h-8zM13 3h8v6h-8zM3 21h8v-6H3z" /></svg>
    if (id === 'sales') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" className={className}><path d="M3 7h18M6 7V5h12v2M5 7v12h14V7M9 12h6M9 16h4" /></svg>
    if (id === 'products') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" className={className}><path d="M3 7l9-4 9 4-9 4zM3 7v10l9 4 9-4V7" /></svg>
    if (id === 'imports') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" className={className}><path d="M12 3v12M8 11l4 4 4-4M4 21h16" /></svg>
    if (id === 'reports') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" className={className}><path d="M4 20V9M10 20V4M16 20v-7M22 20H2" /></svg>
    if (id === 'cashbook') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" className={className}><path d="M4 20h16M6 16l4-4 3 3 5-6" /></svg>
    if (id === 'history') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" className={className}><path d="M4 4v6h6M20 12a8 8 0 1 1-2.3-5.7L20 8" /></svg>
    if (id === 'modules') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" className={className}><path d="M12 2l3.2 4.8 5.6 1.6-3.6 4.5.2 5.9L12 16l-5.4 2.8.2-5.9L3.2 8.4l5.6-1.6z" /></svg>
    if (id === 'settings') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" className={className}><path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z" /></svg>
    if (id === 'debt') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" className={className}><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
    if (id === 'more') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" className={className}><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
    return <span className={className} />
}

export default function Layout() {
    const navigate = useNavigate()
    const location = useLocation()
    const { signOut, isGuest } = useAuth()
    const { isOnline, pendingCount } = useSync()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const mainItems = [
        { path: '/app/sales', label: 'Bán hàng', icon: 'sales' },
        { path: '/app/products', label: 'Kho hàng', icon: 'products' },
        { path: '/app/reports', label: 'Báo cáo', icon: 'reports' },
    ]

    const sidebarItems = [
        { path: '/app/dashboard', label: 'Tổng quan', icon: 'dashboard' },
        { path: '/app/sales', label: 'Bán hàng', icon: 'sales' },
        { path: '/app/products', label: 'Kho hàng', icon: 'products' },
        { path: '/app/imports', label: 'Nhập hàng', icon: 'imports' },
        { path: '/app/reports', label: 'Báo cáo', icon: 'reports' },
        { path: '/app/cashbook', label: 'Sổ quỹ', icon: 'cashbook' },
        { path: '/app/history', label: 'Lịch sử', icon: 'history' },
        { path: '/app/modules', label: 'Nâng cấp', icon: 'modules' },
        { path: '/app/settings', label: 'Cài đặt', icon: 'settings' },
    ]

    const mobileMenuItems = [
        { path: '/app/dashboard', label: 'Tổng quan', icon: 'dashboard' },
        { path: '/app/imports', label: 'Nhập hàng', icon: 'imports' },
        { path: '/app/cashbook', label: 'Sổ quỹ', icon: 'cashbook' },
        { path: '/app/history', label: 'Lịch sử', icon: 'history' },
        { path: '/app/modules', label: 'Nâng cấp', icon: 'modules' },
        { path: '/app/settings', label: 'Cài đặt', icon: 'settings' },
    ]

    const isActive = (path) => location.pathname === path

    return (
        <div className="min-h-screen bg-pink-50/30 flex flex-col md:flex-row">
            <aside className="hidden md:flex w-64 bg-white border-r border-pink-100 flex-col sticky top-0 h-screen z-20">
                <div className="p-6">
                    <h1 className="text-2xl font-black text-primary tracking-tighter italic">OpenPOS</h1>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    {sidebarItems.map((item) => (
                        <button 
                            key={item.path} 
                            onClick={() => navigate(item.path)} 
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all outline-none focus:outline-none ring-0 focus:ring-0 ${isActive(item.path) ? 'bg-primary text-white shadow-lg shadow-pink-200 border-none' : 'text-gray-500 hover:bg-pink-50 border-none'}`}
                        >
                            <NavIcon id={item.icon} className="w-5 h-5 flex-shrink-0" />
                            <span className="truncate">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-pink-50">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">Hỗ trợ & Góp ý</div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <a href="https://zalo.me/0932690949" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"><span className="text-[10px] font-bold">Zalo</span></a>
                        <a href="https://t.me/htt711" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 p-2 rounded-xl bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors"><span className="text-[10px] font-bold">Telegram</span></a>
                    </div>
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse'}`} />
                        <span className="text-xs font-bold text-gray-400">{isOnline ? 'Hệ thống Trực tuyến' : 'Ngoại tuyến (Offline)'}</span>
                    </div>
                    {pendingCount > 0 && <div className="text-xs text-orange-500 font-bold mb-2 px-2 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin-slow" /> {pendingCount} giao dịch chờ đồng bộ
                    </div>}
                    <button onClick={signOut} className="w-full btn bg-gray-100 text-gray-500 hover:text-red-500 hover:bg-red-50 text-sm">Đăng xuất</button>
                </div>
            </aside>
            <main className="flex-1 flex flex-col overflow-hidden md:pb-0">
                {/* Trial Mode Banner */}
                {isGuest && (
                    <div className="bg-gradient-to-r from-primary to-pink-400 text-white px-4 py-2 flex items-center justify-between shadow-lg animate-demo-banner z-[30] sticky top-0 shrink-0">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="bg-white/20 p-1.5 rounded-lg hidden xs:block">
                                <Info className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col xs:flex-row xs:items-center gap-0 xs:gap-2">
                                <span className="animate-demo-text font-black text-[10px] xs:text-xs uppercase tracking-wider">Chế độ dùng thử</span>
                                <span className="hidden sm:inline text-[11px] opacity-90 font-medium">| Đăng ký để lưu dữ liệu vĩnh viễn và tạo shop thật!</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate('/register')}
                            className="bg-white text-primary px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-xl animate-demo-button hover:scale-105 transition-all whitespace-nowrap ml-2"
                        >
                            Dùng thử miễn phí ngay
                        </button>
                    </div>
                )}
                <CartBar />
                <Outlet />
            </main>
            {/* Mobile More Menu Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[90] bg-black/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
                    <div className="absolute bottom-24 left-4 right-4 bg-white rounded-3xl shadow-2xl border border-pink-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-4 grid grid-cols-3 gap-2">
                            {mobileMenuItems.map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => { navigate(item.path); setMobileMenuOpen(false) }}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${isActive(item.path) ? 'bg-primary text-white' : 'hover:bg-pink-50 text-gray-600'}`}
                                >
                                    <NavIcon id={item.icon} className="w-6 h-6" />
                                    <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
                                </button>
                            ))}
                            <button
                                onClick={() => { signOut(); setMobileMenuOpen(false) }}
                                className="flex flex-col items-center gap-2 p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                                <span className="text-[10px] font-bold uppercase tracking-tighter">Đăng xuất</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-pink-100 flex justify-between items-center px-2 py-2 z-[100] safe-bottom">
                {mainItems.map((item) => (
                    <button key={item.path} onClick={() => { navigate(item.path); setMobileMenuOpen(false) }} className={`flex-1 flex flex-col items-center gap-1 py-2 transition-all ${isActive(item.path) ? 'text-primary' : 'text-gray-400'}`}>
                        <NavIcon id={item.icon} className={`w-6 h-6 ${isActive(item.path) ? 'scale-110' : 'scale-100'}`} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
                    </button>
                ))}
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`flex-1 flex flex-col items-center gap-1 py-2 transition-all ${mobileMenuOpen ? 'text-primary' : 'text-gray-400'}`}>
                    <NavIcon id="more" className={`w-6 h-6 ${mobileMenuOpen ? 'scale-110' : 'scale-100'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Thêm</span>
                </button>
            </nav>
        </div>
    )
}
