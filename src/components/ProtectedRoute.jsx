import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: '#09090b',
            }}>
                <div style={{
                    width: 32, height: 32,
                    border: '3px solid rgba(99,102,241,0.3)',
                    borderTopColor: '#6366f1',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    // We no longer redirect to login. Instead, we let the pages handle "Guest Mode"
    // if (!user) {
    //     return <Navigate to="/login" state={{ from: location }} replace />
    // }

    // Support both as wrapper (children) and as route element (Outlet)
    return children ?? <Outlet />
}
