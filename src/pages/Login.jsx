import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [shopName, setShopName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [isSignUp, setIsSignUp] = useState(false)
    const navigate = useNavigate()
    const { loginWithTelegram, login, register } = useAuth()

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
        setLoading(true)
        setError(null)

        try {
            let result;
            if (isSignUp) {
                if (!shopName) throw new Error('Vui lòng nhập tên cửa hàng');
                result = await register(email, password, shopName);
            } else {
                result = await login(email, password);
            }

            if (result.success) {
                navigate('/sales');
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-main p-4">
            <div className="card w-full max-w-md">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-primary mb-2">POS Shop</h1>
                    <p className="text-text-muted">
                        {isSignUp ? 'Đăng ký cửa hàng mới' : 'Đăng nhập để quản lý cửa hàng'}
                    </p>
                </div>

                {error && (
                    <div className={`${error.includes('Đang xác thực') ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-status-error'} p-3 rounded-lg mb-4 text-sm whitespace-pre-wrap`}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    {isSignUp && (
                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1">Tên cửa hàng</label>
                            <input
                                type="text"
                                required
                                className="input"
                                value={shopName}
                                onChange={(e) => setShopName(e.target.value)}
                                placeholder="Cửa hàng của tôi"
                            />
                        </div>
                    )}

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
                        {loading ? 'Đang xử lý...' : (isSignUp ? 'Đăng Ký' : 'Đăng Nhập')}
                    </button>

                    <div className="text-center mt-4">
                        <button
                            type="button"
                            className="text-primary hover:underline text-sm"
                            onClick={() => setIsSignUp(!isSignUp)}
                        >
                            {isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
                        </button>
                    </div>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="text-center text-xs text-text-muted">
                        Hoặc đăng nhập tự động bằng Telegram
                    </div>
                    <div className="mt-4 flex justify-center">
                        <div className="px-4 py-2 bg-gray-50 rounded-md text-xs text-gray-400 italic">
                            Mở ứng dụng từ Telegram Bot để đồng bộ tài khoản
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

