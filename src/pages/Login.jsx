import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [isSignUp, setIsSignUp] = useState(false)
    const navigate = useNavigate()
    const { loginWithTelegram } = useAuth()

    // Handle Telegram Auto-Login
    useEffect(() => {
        const initData = window.Telegram?.WebApp?.initData;
        if (initData) {
            handleTelegramLogin(initData);
        }
    }, []);

    const handleTelegramLogin = async (initData) => {
        setLoading(true);
        setError('Đang xác thực với Telegram...');
        try {
            const result = await loginWithTelegram(initData);
            if (result.success) {
                navigate('/sales');
            } else {
                throw new Error(result.error || 'Xác thực Telegram thất bại');
            }
        } catch (err) {
            setError('Lỗi Telegram: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault()
        setError('Đăng nhập bằng email hiện chưa hỗ trợ trong phiên bản này. Vui lòng sử dụng Telegram.')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-main p-4">
            <div className="card w-full max-w-md">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-primary mb-2">POS Shop</h1>
                    <p className="text-text-muted">
                        Đăng nhập bằng Telegram để quản lý cửa hàng
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-status-error p-3 rounded-lg mb-4 text-sm whitespace-pre-wrap">
                        {error}
                    </div>
                )}

                {!window.Telegram?.WebApp?.initData && (
                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1">Email</label>
                            <input
                                type="email"
                                required
                                className="input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ten@cuahang.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1">Mật khẩu</label>
                            <input
                                type="password"
                                required
                                className="input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full"
                        >
                            {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center text-sm text-text-muted">
                    Vui lòng mở ứng dụng từ Telegram Bot để có trải nghiệm tốt nhất.
                </div>
            </div>
        </div>
    )
}
