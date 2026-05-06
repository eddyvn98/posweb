import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../lib/api'
import SEO from '../components/SEO'
import { Store, ArrowLeft } from '../components/Icons'
import './Login.css' // Reuse auth styles

export default function ResetPassword() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const token = searchParams.get('token')

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!token) { setError('Liên kết không hợp lệ'); return }
        if (password.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự'); return }
        if (password !== confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return }

        setLoading(true)
        setError(null)
        try {
            const response = await api.post('/auth/reset-password', { token, newPassword: password })
            if (response.data.success) {
                setSuccess(true)
                setTimeout(() => navigate('/login'), 3000)
            } else {
                setError(response.data.error || 'Đặt lại mật khẩu thất bại')
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại')
        } finally {
            setLoading(false)
        }
    }

    if (!token) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-alert error">Liên kết không hợp lệ hoặc đã hết hạn.</div>
                    <div className="auth-back">
                        <Link to="/login" className="flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="auth-page">
            <SEO title="Đặt lại mật khẩu" noindex={true} />
            <div className="auth-bg" aria-hidden="true">
                <div className="auth-blob auth-blob-1" />
                <div className="auth-blob auth-blob-2" />
            </div>

            <div className="auth-card">
                <div className="auth-brand">
                    <Link to="/" className="auth-brand-link flex items-center gap-2">
                        <Store className="w-6 h-6 text-primary" /> <span>POSweb</span>
                    </Link>
                </div>

                <h1 className="auth-title">Đặt lại mật khẩu</h1>
                <p className="auth-subtitle">Nhập mật khẩu mới cho tài khoản của bạn</p>

                {error && <div className="auth-alert error">{error}</div>}
                {success && (
                    <div className="auth-alert success">
                        Mật khẩu đã được cập nhật thành công! Đang chuyển hướng về trang đăng nhập...
                    </div>
                )}

                {!success && (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Mật khẩu mới</label>
                            <input
                                type="password"
                                required
                                className="auth-input"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>
                        <div className="form-group">
                            <label>Xác nhận mật khẩu mới</label>
                            <input
                                type="password"
                                required
                                className="auth-input"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>
                        <button type="submit" disabled={loading} className="auth-submit">
                            {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                        </button>
                    </form>
                )}

                <div className="auth-back">
                    <Link to="/login" className="flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
                    </Link>
                </div>
            </div>
        </div>
    )
}
