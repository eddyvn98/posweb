import { useState, useEffect } from 'react'
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import './Login.css'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [shopName, setShopName] = useState('')
    const [inviteCode, setInviteCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [isSignUp, setIsSignUp] = useState(false)
    const [googleClientId, setGoogleClientId] = useState('')
    const [googleReady, setGoogleReady] = useState(false)
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { loginWithTelegram, login, loginWithGoogle, register } = useAuth()

    useEffect(() => {
        // Auto switch to signup if navigated with ?mode=register
        if (searchParams.get('mode') === 'register') {
            setIsSignUp(true)
        }
        // Pre-fill invite code from URL ?invite=XXXX
        const code = searchParams.get('invite')
        if (code) {
            setInviteCode(code.toUpperCase())
            setIsSignUp(true)
        }

        const initData = window.Telegram?.WebApp?.initData
        if (initData) handleTelegramLogin(initData)

        loadGoogleConfig()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const loadGoogleConfig = async () => {
        try {
            const response = await api.get('/auth/google-config')
            const clientId = response.data?.client_id || ''
            setGoogleClientId(clientId)
            setGoogleReady(Boolean(clientId))
        } catch {
            setGoogleReady(false)
        }
    }

    const handleTelegramLogin = async (initData) => {
        setLoading(true)
        setError('Đang xác thực với Telegram...')
        try {
            const result = await loginWithTelegram(initData)
            if (result.success) navigate('/app/sales')
            else throw new Error(result.error)
        } catch (err) {
            setError(`Lỗi Telegram: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    const validateForm = () => {
        if (!email.trim()) return 'Vui lòng nhập email'
        if (!/\S+@\S+\.\S+/.test(email.trim())) return 'Email không hợp lệ'
        if (!password) return 'Vui lòng nhập mật khẩu'
        if (password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự'
        if (isSignUp && !inviteCode && !shopName.trim()) return 'Vui lòng nhập tên cửa hàng'
        return null
    }

    const handleAuth = async (e) => {
        e.preventDefault()
        const err = validateForm()
        if (err) { setError(err); return }

        setLoading(true)
        setError(null)

        try {
            const result = isSignUp
                ? await register(email.trim(), password, shopName.trim(), inviteCode.trim() || undefined)
                : await login(email.trim(), password)

            if (result.success) navigate('/app/sales')
            else setError(result.error || 'Thao tác thất bại')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSuccess = async (response) => {
        if (!response?.credential) { setError('Không nhận được Google credential'); return }
        setLoading(true); setError(null)
        try {
            const result = await loginWithGoogle(response.credential)
            if (result.success) navigate('/app/sales')
            else setError(result.error || 'Đăng nhập Google thất bại')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const hasInvite = Boolean(inviteCode)

    return (
        <div className="auth-page">
            <div className="auth-bg" aria-hidden="true">
                <div className="auth-blob auth-blob-1" />
                <div className="auth-blob auth-blob-2" />
            </div>

            <div className="auth-card">
                {/* Brand */}
                <div className="auth-brand">
                    <Link to="/" className="auth-brand-link">
                        🏪 <span>POSweb</span>
                    </Link>
                </div>

                <h1 className="auth-title">
                    {isSignUp
                        ? (hasInvite ? '👥 Tham gia cửa hàng' : '🆕 Tạo tài khoản')
                        : '👋 Đăng nhập'}
                </h1>
                <p className="auth-subtitle">
                    {isSignUp
                        ? (hasInvite
                            ? 'Bạn được mời tham gia — điền thông tin để tiếp tục'
                            : 'Tạo tài khoản miễn phí, không cần thẻ ngân hàng')
                        : 'Chào mừng trở lại!'}
                </p>

                {error && (
                    <div className={`auth-alert ${error.includes('xác thực') ? 'info' : 'error'}`}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} noValidate>
                    {isSignUp && (
                        <>
                            {/* Invite code input */}
                            <div className="form-group">
                                <label>Mã mời (nếu có)</label>
                                <div className="invite-input-wrapper">
                                    <input
                                        type="text"
                                        className="auth-input invite-input"
                                        value={inviteCode}
                                        onChange={e => setInviteCode(e.target.value.toUpperCase())}
                                        placeholder="VD: A1B2C3D4"
                                        maxLength={8}
                                        autoComplete="off"
                                    />
                                    {inviteCode && (
                                        <span className="invite-badge">✓ Sẽ tham gia shop có sẵn</span>
                                    )}
                                </div>
                            </div>

                            {/* Shop name — only required if no invite code */}
                            {!hasInvite && (
                                <div className="form-group">
                                    <label>Tên cửa hàng <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        className="auth-input"
                                        value={shopName}
                                        onChange={e => setShopName(e.target.value)}
                                        placeholder="Cửa hàng của tôi"
                                        autoComplete="organization"
                                    />
                                </div>
                            )}
                        </>
                    )}

                    <div className="form-group">
                        <label>Email <span className="required">*</span></label>
                        <input
                            type="email"
                            required
                            className="auth-input"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="ten@example.com"
                            autoComplete="email"
                            inputMode="email"
                        />
                    </div>

                    <div className="form-group">
                        <label>Mật khẩu <span className="required">*</span></label>
                        <input
                            type="password"
                            required
                            className="auth-input"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            minLength={6}
                            autoComplete={isSignUp ? 'new-password' : 'current-password'}
                        />
                    </div>

                    <button type="submit" disabled={loading} className="auth-submit">
                        {loading ? (
                            <span className="auth-loading">
                                <span className="auth-spinner" />
                                Đang xử lý...
                            </span>
                        ) : (
                            isSignUp ? (hasInvite ? 'Tham gia cửa hàng' : 'Đăng ký miễn phí') : 'Đăng nhập'
                        )}
                    </button>

                    <div className="auth-toggle">
                        <button type="button" onClick={() => { setIsSignUp(p => !p); setError(null) }}>
                            {isSignUp
                                ? 'Đã có tài khoản? Đăng nhập'
                                : 'Chưa có tài khoản? Đăng ký ngay'}
                        </button>
                    </div>
                </form>

                {/* Google Login */}
                {googleReady && googleClientId && (
                    <div className="auth-divider">
                        <span>hoặc</span>
                    </div>
                )}
                {googleReady && googleClientId && (
                    <div className="auth-google">
                        <GoogleOAuthProvider clientId={googleClientId}>
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError('Không thể đăng nhập bằng Google lúc này')}
                                text={isSignUp ? 'signup_with' : 'signin_with'}
                                shape="pill"
                                theme="outline"
                                width="320"
                            />
                        </GoogleOAuthProvider>
                    </div>
                )}

                <div className="auth-back">
                    <Link to="/">← Về trang chủ</Link>
                </div>
            </div>
        </div>
    )
}
