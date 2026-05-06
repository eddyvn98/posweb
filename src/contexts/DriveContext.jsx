import React, { createContext, useContext, useEffect, useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'

const DriveContext = createContext()

export const useDriveAuth = () => {
    const context = useContext(DriveContext)
    if (!context) {
        throw new Error('useDriveAuth must be inside DriveProvider')
    }
    return context
}

/**
 * Provider cho Google Drive Authentication
 * Wrapper ở App.jsx
 */
export const DriveProvider = ({ children, clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID }) => {
    const [isAuthed, setIsAuthed] = useState(false)
    const [accessToken, setAccessToken] = useState(null)
    const [userInfo, setUserInfo] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Mặc định không lưu token vào localStorage để tránh XSS.
        // Chỉ lưu ở RAM (in-memory). Khi người dùng refresh trang, 
        // họ sẽ cần thao tác kết nối lại nếu có nhu cầu (tính năng hiện đang tạm tắt).
        setLoading(false)
    }, [])

    const handleGoogleLogin = (credentialResponse) => {
        try {
            // credentialResponse.credential là JWT token
            // Cần decode để lấy access_token
            const token = credentialResponse.credential
            
            // Giải mã JWT (không cần verify vì từ Google)
            const parts = token.split('.')
            const payload = JSON.parse(atob(parts[1]))
            
            setAccessToken(token)
            setUserInfo({
                email: payload.email,
                name: payload.name,
                picture: payload.picture
            })
            
            setIsAuthed(true)
        } catch (err) {
            console.error('Lỗi xử lý Google login:', err)
        }
    }

    const handleLogout = () => {
        setAccessToken(null)
        setUserInfo(null)
        setIsAuthed(false)
        
        // Logout từ Google
        if (window.gapi) {
            window.gapi.auth2.getAuthInstance().signOut()
        }
    }

    if (loading) {
        return <div>Loading Google Drive...</div>
    }

    return (
        <DriveContext.Provider value={{
            isAuthed,
            accessToken,
            userInfo,
            handleGoogleLogin,
            handleLogout,
            clientId
        }}>
            {children}
        </DriveContext.Provider>
    )
}

/**
 * Component đăng nhập Drive (dùng trong Settings)
 */
export const DriveLoginButton = () => {
    const { isAuthed, userInfo, handleLogout } = useDriveAuth()
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID

    if (!clientId) {
        return (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                    ⚠️ Google Drive Client ID chưa cấu hình. 
                    <br/>
                    Hướng dẫn: Xem file GOOGLE_SETUP.md
                </p>
            </div>
        )
    }

    if (isAuthed) {
        return (
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                    {userInfo?.picture && (
                        <img 
                            src={userInfo.picture} 
                            alt={userInfo.name}
                            className="w-8 h-8 rounded-full"
                        />
                    )}
                    <div className="text-sm">
                        <p className="font-medium">✓ Đã đăng nhập</p>
                        <p className="text-xs text-gray-600">{userInfo?.email}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-100 rounded"
                >
                    Đăng xuất
                </button>
            </div>
        )
    }

    return (
        <div className="flex justify-center p-4">
            <GoogleLogin
                onSuccess={(credentialResponse) => {
                    // Note: @react-oauth/google sẽ handle callback
                    // Cần config ở App.jsx cùng với GoogleOAuthProvider
                }}
                onError={() => console.log('Login Failed')}
                text="signin_with"
                size="large"
            />
        </div>
    )
}
