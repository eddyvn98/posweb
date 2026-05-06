import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import api from '../lib/api'
import { useAuth } from './AuthContext'
import {
    saveProductsToLocal,
    getPendingSales,
    markSaleSynced,
    queuePendingProduct,
    getPendingProducts,
    removePendingProduct,
    deleteProductLocal
} from '../lib/db'

const SyncContext = createContext({})

export const useSync = () => useContext(SyncContext)

export const SyncProvider = ({ children }) => {
    const { user, shop } = useAuth()
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const [isSyncing, setIsSyncing] = useState(false)
    const isSyncingRef = useRef(false)
    const [pendingCount, setPendingCount] = useState(0)
    const [lastSync, setLastSync] = useState(null)

    const refreshPendingCount = useCallback(async () => {
        const pending = await getPendingSales()
        setPendingCount(pending.length)
    }, [])

    useEffect(() => {
        refreshPendingCount()
        const interval = setInterval(refreshPendingCount, 5000)
        return () => clearInterval(interval)
    }, [refreshPendingCount])

    const pullProducts = useCallback(async () => {
        if (!user || !navigator.onLine) return
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
    }, [user])

    const pushSales = useCallback(async () => {
        if (!user || !navigator.onLine) return
        const pending = await getPendingSales()
        if (pending.length === 0) return

        setIsSyncing(true)
        try {
            for (const sale of pending) {
                const response = await api.post('/sales', sale)
                await markSaleSynced(sale.local_id, response.data.id)
            }
            const remaining = await getPendingSales()

            setPendingCount(remaining.length)
            setLastSync(new Date())
        } catch (err) {
            console.error('[Sync] Push Error:', err)
        } finally {
            setIsSyncing(false)
        }
    }, [user])

    const pushProducts = useCallback(async (product) => {
        if (!shop?.id) return
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
            const status = err?.response?.status
            // 4xx usually means invalid payload/business error; surface it immediately.
            if (status >= 400 && status < 500) {
                throw err
            }
            await queuePendingProduct({ ...product, op: 'upsert' })
            return { queued: true, error: err }
        }
    }, [shop?.id, user])

    const deleteProduct = useCallback(async (productId) => {
        if (!shop?.id) return
        await deleteProductLocal(productId)
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
    }, [shop?.id, user])

    const pushPendingProducts = async () => {
        if (!user || !navigator.onLine) return
        const pendingProducts = await getPendingProducts()
        if (pendingProducts.length === 0) return
        for (const product of pendingProducts) {
            try {
                if (product.op === 'delete') {
                    await api.delete(`/products/${product.id}`)
                    await deleteProductLocal(product.id)
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

    const syncAll = useCallback(async () => {
        if (!user || !navigator.onLine || isSyncingRef.current) return
        isSyncingRef.current = true
        setIsSyncing(true)
        try {
            await pushPendingProducts()
            await pushSales()
            await pullProducts()
            await refreshPendingCount()
            setLastSync(new Date())
        } finally {
            isSyncingRef.current = false
            setIsSyncing(false)
        }
    }, [user, pushSales, pullProducts, refreshPendingCount])

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true)
            syncAll()
        }
        const handleOffline = () => setIsOnline(false)
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [syncAll])

    useEffect(() => {
        if (!user) return
        const interval = setInterval(() => {
            if (navigator.onLine) syncAll()
        }, 120000)
        return () => clearInterval(interval)
    }, [user, syncAll])

    useEffect(() => {
        if (!user || !navigator.onLine) return
        syncAll()
    }, [user, syncAll])

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
