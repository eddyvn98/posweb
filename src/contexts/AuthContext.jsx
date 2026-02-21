import { createContext, useContext, useEffect, useState } from 'react'
import api from '../lib/api'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [shop, setShop] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('pos_token')
        const savedUser = localStorage.getItem('pos_user')
        const savedShop = localStorage.getItem('pos_shop')

        if (token && savedUser && savedShop) {
            setUser(JSON.parse(savedUser))
            setShop(JSON.parse(savedShop))
        }
        setLoading(false)
    }, [])

    const loginWithTelegram = async (initData) => {
        try {
            const response = await api.post('/auth/telegram-auth', { initData })
            const { token, user, shop } = response.data

            localStorage.setItem('pos_token', token)
            localStorage.setItem('pos_user', JSON.stringify(user))
            localStorage.setItem('pos_shop', JSON.stringify(shop))

            setUser(user)
            setShop(shop)
            return { success: true }
        } catch (error) {
            console.error('Login Error:', error)
            return { success: false, error: error.message }
        }
    }

    const signOut = () => {
        localStorage.removeItem('pos_token')
        localStorage.removeItem('pos_user')
        localStorage.removeItem('pos_shop')
        setUser(null)
        setShop(null)
    }

    const value = {
        user,
        shop,
        loading,
        loginWithTelegram,
        signOut
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}
