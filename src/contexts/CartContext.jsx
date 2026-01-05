import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CartContext = createContext()

export function useCart() {
    return useContext(CartContext)
}

export function CartProvider({ children }) {
    const [cart, setCart] = useState([])

    // Load from LocalStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('pos_cart')
            if (saved) {
                setCart(JSON.parse(saved))
            }
        } catch (e) {
            console.error('Failed to load cart', e)
        }
    }, [])

    // Save to LocalStorage whenever cart changes
    useEffect(() => {
        localStorage.setItem('pos_cart', JSON.stringify(cart))
    }, [cart])

    const addToCart = useCallback((product) => {
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
    }, [])

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

    const clearCart = useCallback(() => {
        setCart([])
    }, [])

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

    const value = {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
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
