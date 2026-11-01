import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [shopName, setShopName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [isSignUp, setIsSignUp] = useState(false)
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const [forgotEmail, setForgotEmail] = useState('')
    const [forgotSuccess, setForgotSuccess] = useState('')
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
            const cleanEmail = email.trim().toLowerCase()
            const cleanPassword = password.trim()
            const cleanShopName = shopName.trim()
            const result = isSignUp
                ? await register(cleanEmail, password, cleanShopName)
                : await login(cleanEmail, cleanPassword)

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

    const submitForgotPassword = async e => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setForgotSuccess('')
        try {
            const response = await api.post('/auth/forgot-password', { email: forgotEmail.trim().toLowerCase() })
            setForgotSuccess(response.data.message)
        } catch (err) {
            setError(err.response?.data?.error || 'Không thể gửi email. Vui lòng thử lại sau.')
        } finally { setLoading(false) }
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

                {showForgotPassword ? (
                    <form onSubmit={submitForgotPassword} className="space-y-4">
                        <p className="text-sm text-text-muted">Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.</p>
                        <label className="block text-sm font-semibold text-text-main">Email
                            <input type="email" autoComplete="email" inputMode="email" required
                                className="input mt-1 h-12 w-full" value={forgotEmail}
                                onChange={e => setForgotEmail(e.target.value)} placeholder="ten@cuahang.com" />
                        </label>
                        {forgotSuccess && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{forgotSuccess}</p>}
                        <button type="submit" disabled={loading} className="btn-primary h-12 w-full">{loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}</button>
                        <button type="button" onClick={() => { setShowForgotPassword(false); setError(null); setForgotSuccess('') }}
                            className="h-11 w-full text-sm font-semibold text-primary">Trở về đăng nhập</button>
                    </form>
                ) : <form onSubmit={handleAuth} className="space-y-4" noValidate>
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
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck="false"
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

                    {!isSignUp && (
                        <div className="text-right">
                            <button type="button" onClick={() => { setForgotEmail(email); setShowForgotPassword(true); setError(null) }}
                                className="min-h-11 text-sm font-semibold text-primary hover:underline">Quên mật khẩu?</button>
                        </div>
                    )}
                    <div className="text-center mt-4">
                        <button
                            type="button"
                            className="text-primary hover:underline text-sm"
                            onClick={toggleAuthMode}
                        >
                            {isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
                        </button>
                    </div>
                </form>}

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
