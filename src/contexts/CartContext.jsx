import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'

const CartContext = createContext()

export function useCart() {
    return useContext(CartContext)
}

export function CartProvider({ children }) {
    const { shop } = useAuth()
    const shopId = shop?.id || null
    const [cart, setCart] = useState([])
    const [activeShopId, setActiveShopId] = useState(null)

    useEffect(() => {
        if (!shopId) {
            setCart([])
            setActiveShopId(null)
            return
        }
        try {
            let saved = localStorage.getItem(`pos_cart:${shopId}`)
            if (!saved) {
                const legacy = JSON.parse(localStorage.getItem('pos_cart') || 'null')
                if (Array.isArray(legacy) && legacy.every(item => item.shop_id === shopId)) {
                    saved = JSON.stringify(legacy)
                    localStorage.removeItem('pos_cart')
                }
            }
            setCart(saved ? JSON.parse(saved) : [])
        } catch (error) {
            console.error('Failed to load shop cart', error)
            setCart([])
        }
        setActiveShopId(shopId)
    }, [shopId])

    useEffect(() => {
        if (!shopId || activeShopId !== shopId) return
        localStorage.setItem(`pos_cart:${shopId}`, JSON.stringify(cart))
    }, [cart, shopId, activeShopId])

    const visibleCart = activeShopId === shopId ? cart : []

    const addToCart = useCallback((product) => {
        if (!shopId || activeShopId !== shopId || product.shop_id !== shopId) return
        setCart(currentCart => {
            // Use .id as the primary key in cart. For normal products, it's product.id.
            // For Quick Sale items, it's a unique uuid.
            const targetId = product.product_id || product.id
            const existing = currentCart.find(item => (item.product_id || item.id) === targetId)

            if (existing) {
                return currentCart.map(item =>
                    (item.product_id || item.id) === targetId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...currentCart, { ...product, product_id: targetId, id: targetId, quantity: 1 }]
        })
    }, [shopId, activeShopId])

    const removeFromCart = useCallback((productId) => {
        setCart(currentCart => currentCart.filter(item => (item.product_id || item.id) !== productId))
    }, [])

    const updateQuantity = useCallback((productId, delta) => {
        setCart(currentCart => currentCart.map(item => {
            const currentId = item.product_id || item.id
            if (currentId === productId) {
                const newQty = Math.max(0, item.quantity + delta)
                return { ...item, quantity: newQty }
            }
            return item
        }).filter(item => item.quantity > 0)) // Remove if 0
    }, [])

    const setQuantity = useCallback((productId, quantity) => {
        setCart(currentCart => currentCart.map(item => {
            const currentId = item.product_id || item.id
            if (currentId === productId) {
                return { ...item, quantity: Math.max(0, quantity) }
            }
            return item
        }).filter(item => item.quantity > 0))
    }, [])

    const clearCart = useCallback(() => {
        setCart([])
    }, [])

    const totalAmount = visibleCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const totalItems = visibleCart.reduce((sum, item) => sum + item.quantity, 0)

    const value = {
        cart: visibleCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        setQuantity,
        clearCart,
        totalAmount,
        totalItems
    }

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    )
}
