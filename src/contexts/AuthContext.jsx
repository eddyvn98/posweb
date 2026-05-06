import { createContext, useContext, useEffect, useState } from 'react'
import api from '../lib/api'
import { setCurrentShopId, clearCurrentShopId, seedGuestData } from '../lib/db'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [shop, setShop] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const init = async () => {
            const savedUser = localStorage.getItem('pos_user')
            const savedShop = localStorage.getItem('pos_shop')

            if (savedUser && savedShop) {
                try {
                    const parsedUser = JSON.parse(savedUser)
                    const parsedShop = JSON.parse(savedShop)
                    setUser(parsedUser)
                    setShop(parsedShop)
                    if (parsedUser?.shop_id) {
                        setCurrentShopId(parsedUser.shop_id)
                    }
                } catch {
                    localStorage.removeItem('pos_user')
                    localStorage.removeItem('pos_shop')
                    setCurrentShopId('guest_shop')
                }
            } else {
                setCurrentShopId('guest_shop')
                setShop({ id: 'guest_shop', name: 'Shop Tham Quan', currency: 'VND' })
            }
            
            // Populate mock data if in guest mode
            await seedGuestData()
            setLoading(false)
        }
        init()
    }, [])

    const _persistSession = (user, shop) => {
        localStorage.setItem('pos_user', JSON.stringify(user))
        localStorage.setItem('pos_shop', JSON.stringify(shop))
        setUser(user)
        setShop(shop)
        // Scope IndexedDB cache to this shop
        if (user?.shop_id) {
            setCurrentShopId(user.shop_id)
        }
    }

    const loginWithTelegram = async (initData) => {
        try {
            const response = await api.post('/auth/telegram-auth', { initData })
            const { user, shop } = response.data
            _persistSession(user, shop)
            return { success: true }
        } catch (error) {
            console.error('Login Error:', error)
            return { success: false, error: error.response?.data?.error || error.message }
        }
    }

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password })
            const { user, shop } = response.data
            _persistSession(user, shop)
            return { success: true }
        } catch (error) {
            return { success: false, error: error.response?.data?.error || error.message }
        }
    }

    const loginWithGoogle = async (credential) => {
        try {
            const response = await api.post('/auth/google', { credential })
            const { user, shop } = response.data
            _persistSession(user, shop)
            return { success: true }
        } catch (error) {
            return { success: false, error: error.response?.data?.error || error.message }
        }
    }

    const register = async (email, password, shopName, inviteCode) => {
        try {
            const response = await api.post('/auth/register', { email, password, shopName, inviteCode })
            const { user, shop } = response.data
            _persistSession(user, shop)
            return { success: true }
        } catch (error) {
            return { success: false, error: error.response?.data?.error || error.message }
        }
    }

    const signOut = async () => {
        try {
            await api.post('/auth/logout')
        } catch (error) {
            console.error('Logout Error:', error)
        }
        localStorage.removeItem('pos_user')
        localStorage.removeItem('pos_shop')
        // Clear IndexedDB scope on logout
        clearCurrentShopId()
        setUser(null)
        setShop(null)
    }

    const updateShopInfo = (updatedShop) => {
        const newShop = { ...shop, ...updatedShop }
        localStorage.setItem('pos_shop', JSON.stringify(newShop))
        setShop(newShop)
    }

    const value = {
        user,
        shop,
        isGuest: !user,
        loading,
        loginWithTelegram,
        login,
        loginWithGoogle,
        register,
        signOut,
        updateShopInfo
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}
