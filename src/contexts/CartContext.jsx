import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const CartContext = createContext()
const normalizeId = (id) => String(id ?? '')

export function useCart() {
    return useContext(CartContext)
}

export function CartProvider({ children }) {
    const [orders, setOrders] = useState([
        { id: 'order-1', name: 'Đơn 1', items: [] }
    ])
    const [activeOrderId, setActiveOrderId] = useState('order-1')
    const [fabPosition, setFabPosition] = useState(() => {
        return localStorage.getItem('pos_fab_position') || 'right'
    })

    // Load from LocalStorage on mount
    useEffect(() => {
        try {
            const savedOrders = localStorage.getItem('pos_orders')
            const savedActiveId = localStorage.getItem('pos_active_order_id')
            
            if (savedOrders) {
                const parsed = JSON.parse(savedOrders)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setOrders(parsed)
                }
            }
            if (savedActiveId) {
                setActiveOrderId(savedActiveId)
            }
        } catch (e) {
            console.error('Failed to load orders', e)
        }
    }, [])

    // Save to LocalStorage whenever orders change
    useEffect(() => {
        localStorage.setItem('pos_orders', JSON.stringify(orders))
        localStorage.setItem('pos_active_order_id', activeOrderId)
        localStorage.setItem('pos_fab_position', fabPosition)
    }, [orders, activeOrderId, fabPosition])

    const toggleFabPosition = useCallback(() => {
        setFabPosition(prev => prev === 'right' ? 'left' : 'right')
    }, [])

    const activeOrder = useMemo(() => 
        orders.find(o => o.id === activeOrderId) || orders[0], 
    [orders, activeOrderId])

    const cart = activeOrder.items

    const updateOrders = useCallback((newItems) => {
        setOrders(prev => prev.map(o => 
            o.id === activeOrderId ? { ...o, items: newItems } : o
        ))
    }, [activeOrderId])

    const addToCart = useCallback((product) => {
        const targetId = normalizeId(product.product_id || product.id)
        const existing = cart.find(item => normalizeId(item.product_id || item.id) === targetId)

        let newItems
        if (existing) {
            newItems = cart.map(item =>
                normalizeId(item.product_id || item.id) === targetId
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            )
        } else {
            newItems = [...cart, { ...product, product_id: targetId, id: targetId, quantity: 1 }]
        }
        updateOrders(newItems)
    }, [cart, updateOrders])

    const removeFromCart = useCallback((productId) => {
        const targetId = normalizeId(productId)
        const newItems = cart.filter(item => normalizeId(item.product_id || item.id) !== targetId)
        updateOrders(newItems)
    }, [cart, updateOrders])

    const updateQuantity = useCallback((productId, delta) => {
        const targetId = normalizeId(productId)
        const newItems = cart.map(item => {
            const currentId = normalizeId(item.product_id || item.id)
            if (currentId === targetId) {
                const newQty = Math.max(0, item.quantity + delta)
                return { ...item, quantity: newQty }
            }
            return item
        }).filter(item => item.quantity > 0)
        updateOrders(newItems)
    }, [cart, updateOrders])

    const setQuantity = useCallback((productId, quantity) => {
        const targetId = normalizeId(productId)
        const newItems = cart.map(item => {
            const currentId = normalizeId(item.product_id || item.id)
            if (currentId === targetId) {
                return { ...item, quantity: Math.max(0, quantity) }
            }
            return item
        }).filter(item => item.quantity > 0)
        updateOrders(newItems)
    }, [cart, updateOrders])

    const clearCart = useCallback(() => {
        updateOrders([])
    }, [updateOrders])

    // Multi-order management
    const addOrder = useCallback(() => {
        const newId = `order-${Date.now()}`
        const newName = `Đơn ${orders.length + 1}`
        setOrders(prev => [...prev, { id: newId, name: newName, items: [] }])
        setActiveOrderId(newId)
    }, [orders.length])

    const switchOrder = useCallback((id) => {
        setActiveOrderId(id)
    }, [])

    const removeOrder = useCallback((id) => {
        setOrders(prev => {
            if (prev.length <= 1) {
                // If last order, just clear it
                return prev.map(o => o.id === id ? { ...o, items: [] } : o)
            }
            const filtered = prev.filter(o => o.id !== id)
            if (activeOrderId === id) {
                setActiveOrderId(filtered[0].id)
            }
            return filtered
        })
    }, [activeOrderId])

    const renameOrder = useCallback((id, name) => {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, name } : o))
    }, [])

    const updateProductInCart = useCallback((productId, updatedData) => {
        const targetId = normalizeId(productId)
        setOrders(prev => prev.map(order => ({
            ...order,
            items: order.items.map(item => {
                const currentId = normalizeId(item.product_id || item.id)
                if (currentId === targetId) {
                    return { ...item, ...updatedData }
                }
                return item
            })
        })))
    }, [])

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

    const [isCheckoutRequested, setIsCheckoutRequested] = useState(false)
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false)

    const value = {
        cart,
        orders,
        activeOrderId,
        addToCart,
        removeFromCart,
        updateQuantity,
        setQuantity,
        clearCart,
        addOrder,
        switchOrder,
        removeOrder,
        renameOrder,
        updateProductInCart,
        totalAmount,
        totalItems,
        isCheckoutRequested,
        setIsCheckoutRequested,
        isCheckoutModalOpen,
        setIsCheckoutModalOpen,
        fabPosition,
        toggleFabPosition
    }

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    )
}
