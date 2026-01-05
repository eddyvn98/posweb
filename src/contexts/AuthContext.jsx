import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null)
    const [user, setUser] = useState(null)
    const [shop, setShop] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // 1. Get initial session
        if (!supabase) {
            setLoading(false)
            return
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfileAndShop(session.user.id)
            } else {
                setLoading(false)
            }
        })

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)

            if (session?.user) {
                fetchProfileAndShop(session.user.id)
            } else {
                setShop(null)
                setProfile(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchProfileAndShop = async (userId) => {
        try {
            // Get profile linked to shop
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*, shops(*)')
                .eq('id', userId)
                .single()

            if (profileError) throw profileError

            setProfile(profileData)
            setShop(profileData.shops)
        } catch (error) {
            console.error('Error loading shop data:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setShop(null)
        setProfile(null)
    }

    const value = {
        session,
        user,
        shop,
        profile,
        loading,
        signOut
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}
