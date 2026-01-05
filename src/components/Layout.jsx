import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'

export default function Layout({ children }) {
    const navigate = useNavigate()
    const location = useLocation()
    const { signOut } = useAuth()
    const { isOnline, pendingCount } = useSync()

    const sidebarItems = [
        { path: '/dashboard', label: 'Tổng quan', icon: '⛺' },
        { path: '/sales', label: 'Bán hàng', icon: '🛒' },
        { path: '/products', label: 'Sản phẩm', icon: '📦' },
        { path: '/imports', label: 'Nhập hàng', icon: '📥' },
        { path: '/reports', label: 'Thống kê', icon: '📈' },
        { path: '/cashbook', label: 'Sổ quỹ', icon: '📊' },
        { path: '/history', label: 'Lịch sử', icon: '📜' },
        { path: '/settings', label: 'Cài đặt', icon: '⚙️' },
    ]

    const bottomMenuItems = [
        { path: '/sales', label: 'Bán', icon: '🛒' },
        { path: '/imports', label: 'Nhập', icon: '📥' },
        { path: '/reports', label: 'Báo cáo', icon: '📈' },
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
            <main className="flex-1 overflow-x-hidden pb-24 md:pb-0">
                {children}
            </main>

            {/* Mobile Bottom Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-pink-50 flex justify-around items-center px-2 py-3 z-[100] safe-bottom">
                {bottomMenuItems.map(item => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`
                            flex flex-col items-center gap-1 min-w-[64px] transition-all
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
            </nav>
        </div>
    )
}
