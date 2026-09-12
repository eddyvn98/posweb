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

    useEffect(() => {
        const initData = window.Telegram?.WebApp?.initData
        if (initData) {
            handleTelegramLogin(initData)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleTelegramLogin = async (initData) => {
        setLoading(true)
        setError('Đang xác thực với Telegram...')
        try {
            const result = await loginWithTelegram(initData)
            if (result.success) {
                navigate('/sales')
            } else {
                throw new Error(result.error || 'Xác thực Telegram thất bại')
            }
        } catch (err) {
            setError(`Lỗi Telegram: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    const validateAuthForm = () => {
        if (!email.trim()) return 'Vui lòng nhập email'
        if (!/\S+@\S+\.\S+/.test(email.trim())) return 'Email không hợp lệ'
        if (!password) return 'Vui lòng nhập mật khẩu'
        if (password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự'
        if (isSignUp && !shopName.trim()) return 'Vui lòng nhập tên cửa hàng'
        return null
    }

    const handleAuth = async (e) => {
        e.preventDefault()
        const validationError = validateAuthForm()
        if (validationError) {
            setError(validationError)
            return
        }

        setLoading(true)
        setError(null)

        try {
            const cleanEmail = email.trim()
            const cleanShopName = shopName.trim()
            const result = isSignUp
                ? await register(cleanEmail, password, cleanShopName)
                : await login(cleanEmail, password)

            if (result.success) {
                navigate('/sales')
            } else {
                setError(result.error || 'Đăng nhập thất bại')
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const toggleAuthMode = () => {
        setIsSignUp((prev) => !prev)
        setError(null)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-main p-4">
            <div className="card w-full max-w-md">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-primary mb-2">PosWebFree</h1>
                    <p className="text-text-muted">
                        {isSignUp ? 'Đăng ký cửa hàng mới' : 'Đăng nhập để quản lý cửa hàng'}
                    </p>
                </div>

                {error && (
                    <div className={`${error.includes('Đang xác thực') ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-status-error'} p-3 rounded-lg mb-4 text-sm whitespace-pre-wrap`}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4" noValidate>
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
                                autoComplete="organization"
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
                            autoComplete="email"
                            inputMode="email"
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
                            autoComplete={isSignUp ? 'new-password' : 'current-password'}
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
                            onClick={toggleAuthMode}
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
