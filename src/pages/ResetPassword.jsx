import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../lib/api'

export default function ResetPassword() {
    const [params] = useSearchParams()
    const token = params.get('token')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const submit = async e => {
        e.preventDefault()
        if (password.length < 8 || password.length > 128) { setError('Mật khẩu phải có 8–128 ký tự'); return }
        if (password !== confirm) { setError('Hai mật khẩu không khớp'); return }
        setBusy(true)
        setError('')
        try {
            await api.post('/auth/reset-password', { token, password })
            setSuccess(true)
            window.history.replaceState({}, '', '/reset-password')
        } catch (err) {
            setError(err.response?.data?.error || 'Không thể đặt lại mật khẩu')
        } finally { setBusy(false) }
    }
    return (
        <main className="min-h-screen bg-background-main px-4 py-8 flex items-center justify-center">
            <section className="card w-full max-w-md space-y-5">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-primary">PosWebFree</h1>
                    <h2 className="mt-2 text-lg font-bold text-text-main">Đặt lại mật khẩu</h2>
                </div>
                {success ? <p role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-700">Mật khẩu đã được cập nhật. Bạn có thể đăng nhập lại.</p> :
                    token ? <form onSubmit={submit} className="space-y-4">
                        <label className="block text-sm font-medium">Mật khẩu mới
                            <input autoComplete="new-password" type="password" minLength={8} maxLength={128}
                                required className="input mt-1 h-12 w-full" value={password} onChange={e => setPassword(e.target.value)} />
                        </label>
                        <label className="block text-sm font-medium">Nhập lại mật khẩu
                            <input autoComplete="new-password" type="password" minLength={8} maxLength={128}
                                required className="input mt-1 h-12 w-full" value={confirm} onChange={e => setConfirm(e.target.value)} />
                        </label>
                        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
                        <button disabled={busy} type="submit" className="btn-primary h-12 w-full">{busy ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}</button>
                    </form> :
                    <p role="alert" className="text-sm text-red-600">Liên kết đặt lại mật khẩu không hợp lệ.</p>}
                <Link to="/login" className="block min-h-11 py-3 text-center text-sm font-semibold text-primary">Trở về đăng nhập</Link>
            </section>
        </main>
    )
}
