import { createContext, useContext, useEffect, useState } from 'react'
import api from '../lib/api'
import { useAuth } from './AuthContext'
import {
    saveProductsToLocal,
    getPendingSales,
    markSaleSynced,
    queuePendingProduct,
    getPendingProducts,
    removePendingProduct
} from '../lib/db'

const SyncContext = createContext({})

export const useSync = () => useContext(SyncContext)

export const SyncProvider = ({ children }) => {
    const { user, shop } = useAuth()
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const [isSyncing, setIsSyncing] = useState(false)
    const [pendingCount, setPendingCount] = useState(0)
    const [lastSync, setLastSync] = useState(null)

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true)
            pushSales()
            pushPendingProducts()
        }
        const handleOffline = () => setIsOnline(false)
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [user])

    useEffect(() => {
        const checkPending = async () => {
            const pending = await getPendingSales()
            setPendingCount(pending.length)
        }
        checkPending()
        const interval = setInterval(checkPending, 5000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (!user || !shop) return
        const interval = setInterval(() => {
            if (navigator.onLine) {
                pushSales()
                pushPendingProducts()
            }
        }, 120000)
        return () => clearInterval(interval)
    }, [user, shop])

    const pullProducts = async () => {
        if (!shop || !navigator.onLine) return
        setIsSyncing(true)
        try {
            const response = await api.get('/products')
            await saveProductsToLocal(response.data)
            setLastSync(new Date())
        } catch (err) {
            console.error('[Sync] Pull Error:', err)
        } finally {
            setIsSyncing(false)
        }
    }

    const pushSales = async () => {
        if (!user || !navigator.onLine || isSyncing) return
        const pending = await getPendingSales()
        if (pending.length === 0) return

        setIsSyncing(true)
        try {
            for (const sale of pending) {
                await api.post('/sales', sale)
                await markSaleSynced(sale.local_id)
            }
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
        if (!user) return
        if (!navigator.onLine) {
            await queuePendingProduct({ ...product, op: 'upsert' })
            return { queued: true }
        }
        try {
            await api.post('/products/upsert', product)
            await removePendingProduct(product.id)
            return { queued: false }
        } catch (err) {
            console.error('[Sync] Product Push Error:', err)
            await queuePendingProduct({ ...product, op: 'upsert' })
            return { queued: true, error: err }
        }
    }

    const deleteProduct = async (productId) => {
        if (!user) return
        if (!navigator.onLine) {
            await queuePendingProduct({ id: productId, op: 'delete' })
            return { queued: true }
        }
        try {
            await api.delete(`/products/${productId}`)
            await removePendingProduct(productId)
            return { queued: false }
        } catch (err) {
            console.error('[Sync] Product Delete Error:', err)
            await queuePendingProduct({ id: productId, op: 'delete' })
            return { queued: true, error: err }
        }
    }

    const pushPendingProducts = async () => {
        if (!user || !navigator.onLine) return
        const pendingProducts = await getPendingProducts()
        if (pendingProducts.length === 0) return
        for (const product of pendingProducts) {
            try {
                if (product.op === 'delete') {
                    await api.delete(`/products/${product.id}`)
                } else {
                    await api.post('/products/upsert', product)
                }
                await removePendingProduct(product.id)
            } catch (err) {
                console.error('[Sync] Pending Product Push Error:', err)
                break
            }
        }
    }

    const value = {
        isOnline, isSyncing, pendingCount, lastSync,
        pullProducts, pushSales, pushProducts, deleteProduct
    }

    return (
        <SyncContext.Provider value={value}>
            {children}
        </SyncContext.Provider>
    )
}
