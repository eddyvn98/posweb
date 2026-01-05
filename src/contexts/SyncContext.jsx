import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import {
    saveProductsToLocal,
    getPendingSales,
    markSaleSynced
} from '../lib/db'

const SyncContext = createContext({})

export const useSync = () => useContext(SyncContext)

export const SyncProvider = ({ children }) => {
    const { user, shop } = useAuth()
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const [isSyncing, setIsSyncing] = useState(false)
    const [pendingCount, setPendingCount] = useState(0)
    const [lastSync, setLastSync] = useState(null)

    // 1. Network Status Listener
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true)
            // Auto sync when back online
            pushSales()
        }
        const handleOffline = () => setIsOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [user])

    // 2. Count Pending Sales (Poll check)
    useEffect(() => {
        const checkPending = async () => {
            const pending = await getPendingSales()
            setPendingCount(pending.length)
        }

        checkPending()
        // Check every 5s if queue changes (naive approach, better with event bus)
        const interval = setInterval(checkPending, 5000)
        return () => clearInterval(interval)
    }, [])

    // 3. Auto Sync Loop (Every 2 minutes)
    useEffect(() => {
        if (!user || !shop) return
        const interval = setInterval(() => {
            if (navigator.onLine) {
                pushSales()
            }
        }, 120000) // 2 mins
        return () => clearInterval(interval)
    }, [user, shop])

    // --- ACTIONS ---

    const pullProducts = async () => {
        if (!shop || !navigator.onLine) return
        setIsSyncing(true)
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('shop_id', shop.id)
                .eq('is_active', true)

            if (error) throw error

            await saveProductsToLocal(data)
            console.log(`[Sync] Pulled ${data.length} products`)
            setLastSync(new Date())
        } catch (err) {
            console.error('[Sync] Pull Error:', err)
        } finally {
            setIsSyncing(false)
        }
    }

    const pushSales = async () => {
        if (!user || !navigator.onLine) return
        if (isSyncing) return

        const pending = await getPendingSales()
        if (pending.length === 0) return

        setIsSyncing(true)
        console.log(`[Sync] Pushing ${pending.length} sales...`)

        try {
            for (const sale of pending) {
                // 1. Insert/Sync to Supabase
                // We need to transform local shape to DB shape if distinct
                // Assuming local sale object matches DB schema + 'items' array

                // A. Insert Sale Header
                const { data: saleData, error: saleError } = await supabase
                    .from('sales')
                    .insert({
                        shop_id: sale.shop_id,
                        code: sale.code,
                        total_amount: sale.total_amount,
                        payment_method: sale.payment_method,
                        sale_date: sale.sale_date,
                        sale_local_date: sale.sale_local_date || new Date(sale.sale_date).toISOString().split('T')[0],
                        created_by: user.id
                    })
                    .select()
                    .single()

                if (saleError) {
                    console.error('[Sync] Sale Insert Error:', saleError)
                    continue // Skip this one, try next
                }

                // B. Insert Sale Items
                if (sale.items && sale.items.length > 0) {
                    const itemsToInsert = sale.items.map(item => ({
                        sale_id: saleData.id,
                        product_id: item.product_id,
                        quantity: item.quantity,
                        price: item.price,
                        product_name: item.product_name
                    }))

                    const { error: itemsError } = await supabase
                        .from('sale_items')
                        .insert(itemsToInsert)

                    if (itemsError) {
                        console.error('[Sync] Items Insert Error:', itemsError)
                        // Complex rollback logic needed here in real app
                        // For now, we unfortunately might have partial data if not using RPC
                        continue
                    }
                }

                // 2. Mark Local as Synced
                await markSaleSynced(sale.local_id)
            }

            // Refresh pending count
            const remaining = await getPendingSales()
            setPendingCount(remaining.length)
            setLastSync(new Date())

        } catch (err) {
            console.error('[Sync] Push Error:', err)
        } finally {
            setIsSyncing(false)
        }
    }

    const pushProducts = async (product) => {
        if (!user || !navigator.onLine) return

        try {
            // Upsert to Supabase
            // We strip 'search_normalize' as it is local only
            const { search_normalize, ...productData } = product

            const { error } = await supabase
                .from('products')
                .upsert({
                    ...productData,
                    shop_id: shop.id
                })

            if (error) throw error
            console.log('[Sync] Product pushed:', product.name)

        } catch (err) {
            console.error('[Sync] Product Push Error:', err)
            // Ideally queue for retry or alert user
        }
    }

    const value = {
        isOnline,
        isSyncing,
        pendingCount,
        lastSync,
        pullProducts,
        pushSales,
        pushProducts
    }

    return (
        <SyncContext.Provider value={value}>
            {children}
        </SyncContext.Provider>
    )
}
