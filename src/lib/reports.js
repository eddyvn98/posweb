import { supabase } from './supabase'

/**
 * TASK 7.1 – Monthly Revenue Report
 * Get revenue grouped by month and payment method
 * Enhanced: Include ALL sales (void & normal), filter void in UI
 */
export const getMonthlyRevenue = async (shopId, year, month) => {
    if (!supabase) return null

    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    // Get ALL sales (both void and normal) for complete audit trail
    const { data, error } = await supabase
        .from('sales')
        .select('id, code, total_amount, payment_method, sale_date, is_void, void_reason, void_at')
        .eq('shop_id', shopId)
        .gte('sale_date', startDate + 'T00:00:00Z')
        .lte('sale_date', endDate + 'T23:59:59Z')
        .order('sale_date', { ascending: true })

    if (error) {
        console.error('Error fetching monthly revenue:', error)
        return null
    }

    // Helper: Convert UTC sale_date to local date (GMT+7)
    const getLocalDate = (dateString) => {
        const date = new Date(dateString)
        date.setHours(date.getHours() + 7)
        return date.toISOString().split('T')[0]
    }

    // Group by payment method (only non-void for revenue)
    const nonVoidSales = data.filter(s => !s.is_void)
    const grouped = nonVoidSales.reduce((acc, sale) => {
        const method = sale.payment_method || 'cash'
        if (!acc[method]) {
            acc[method] = { count: 0, total: 0, sales: [] }
        }
        acc[method].count += 1
        acc[method].total += sale.total_amount
        acc[method].sales.push(sale)
        return acc
    }, {})

    // Daily revenue grouping
    const byDay = data.reduce((acc, sale) => {
        if (sale.is_void) return acc // Don't count voids in revenue
        
        const date = getLocalDate(sale.sale_date)
        if (!acc[date]) {
            acc[date] = { date, revenue: 0, count: 0, sales: [] }
        }
        acc[date].revenue += sale.total_amount
        acc[date].count += 1
        acc[date].sales.push(sale)
        return acc
    }, {})

    // Calculate total
    const totalRevenue = nonVoidSales.reduce((sum, s) => sum + s.total_amount, 0)
    const avgPerSale = nonVoidSales.length > 0 ? Math.round(totalRevenue / nonVoidSales.length) : 0

    return {
        year,
        month,
        startDate,
        endDate,
        byMethod: grouped,
        byDay: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
        totalRevenue,
        totalSales: nonVoidSales.length,
        totalVoids: data.filter(s => s.is_void).length,
        avgPerSale,
        rawData: data // For export (includes voids)
    }
}

/**
 * Get all monthly revenues for a year (for chart)
 */
export const getYearlyRevenue = async (shopId, year) => {
    if (!supabase) return null

    const startDate = new Date(year, 0, 1).toISOString().split('T')[0]
    const endDate = new Date(year, 11, 31).toISOString().split('T')[0]

    const { data, error } = await supabase
        .from('sales')
        .select('id, total_amount, sale_date, is_void')
        .eq('shop_id', shopId)
        .gte('sale_date', startDate + 'T00:00:00Z')
        .lte('sale_date', endDate + 'T23:59:59Z')
        .eq('is_void', false)
        .order('sale_date', { ascending: true })

    if (error) {
        console.error('Error fetching yearly revenue:', error)
        return null
    }

    // Group by month
    const byMonth = Array(12).fill(null).map((_, i) => ({
        month: i + 1,
        monthName: new Date(year, i).toLocaleString('vi-VN', { month: 'long' }),
        revenue: 0,
        count: 0
    }))

    data.forEach(sale => {
        const saleDate = new Date(sale.sale_date)
        const monthIndex = saleDate.getMonth()
        byMonth[monthIndex].revenue += sale.total_amount
        byMonth[monthIndex].count += 1
    })

    return {
        year,
        byMonth,
        totalRevenue: data.reduce((sum, s) => sum + s.total_amount, 0)
    }
}

/**
 * TASK 7.2 – Cashbook Report
 * Get cash in/out transactions with sales revenue
 */
export const getCashbookReport = async (shopId, year, month) => {
    if (!supabase) return null

    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    // Get cash flows
    const { data: flows, error: flowsError } = await supabase
        .from('cash_flows')
        .select('id, amount, type, category, description, created_at')
        .eq('shop_id', shopId)
        .gte('created_at', startDate + 'T00:00:00Z')
        .lte('created_at', endDate + 'T23:59:59Z')
        .order('created_at', { ascending: true })

    if (flowsError) {
        console.error('Error fetching cashbook:', flowsError)
        return null
    }

    // Get auto-recorded sales revenue (from non-void sales)
    const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('id, total_amount, sale_date')
        .eq('shop_id', shopId)
        .eq('is_void', false)
        .gte('sale_date', startDate + 'T00:00:00Z')
        .lte('sale_date', endDate + 'T23:59:59Z')

    if (salesError) {
        console.error('Error fetching sales for cashbook:', salesError)
        return null
    }

    // Helper: Convert UTC sale_date to local date (GMT+7)
    const getLocalDate = (dateString) => {
        const date = new Date(dateString)
        date.setHours(date.getHours() + 7)
        return date.toISOString().split('T')[0]
    }

    // Group sales by date (auto revenue)
    const salesByDate = sales.reduce((acc, s) => {
        const localDate = getLocalDate(s.sale_date)
        if (!acc[localDate]) {
            acc[localDate] = { date: localDate, total: 0, count: 0 }
        }
        acc[localDate].total += s.total_amount
        acc[localDate].count += 1
        return acc
    }, {})

    // Separate in/out
    const inFlows = flows.filter(f => f.type === 'in')
    const outFlows = flows.filter(f => f.type === 'out')

    const totalIn = inFlows.reduce((sum, f) => sum + f.amount, 0)
    const totalOut = outFlows.reduce((sum, f) => sum + f.amount, 0)
    const balance = totalIn - totalOut

    // Combine flows and sales for unified cashbook
    const transactions = [
        // Sales revenue (Thu tiền bán hàng)
        ...Object.values(salesByDate).map(s => ({
            date: s.date,
            type: 'in',
            category: 'Bán hàng',
            description: `Doanh thu bán hàng (${s.count} GD)`,
            amount: s.total
        })),
        // Manual flows
        ...flows.map(f => ({
            date: f.created_at.split('T')[0],
            type: f.type,
            category: f.category,
            description: f.description,
            amount: f.amount
        }))
    ].sort((a, b) => a.date.localeCompare(b.date))

    const totalFlowRevenue = Object.values(salesByDate).reduce((sum, s) => sum + s.total, 0)

    return {
        year,
        month,
        startDate,
        endDate,
        transactions,
        inFlows,
        outFlows,
        totalIn: totalIn + totalFlowRevenue,
        totalOut,
        balance: (totalIn + totalFlowRevenue) - totalOut,
        salesRevenue: totalFlowRevenue,
        manualInflows: totalIn,
        byCategory: flows.reduce((acc, flow) => {
            const key = `${flow.type}_${flow.category}`
            if (!acc[key]) {
                acc[key] = { type: flow.type, category: flow.category, total: 0, count: 0, items: [] }
            }
            acc[key].total += flow.amount
            acc[key].count += 1
            acc[key].items.push(flow)
            return acc
        }, {}),
        rawData: transactions
    }
}

/**
 * TASK 7.3 – Inventory End-of-Month
 * Get stock snapshot at end of month
 */
export const getInventorySnapshot = async (shopId, year, month) => {
    if (!supabase) return null

    // Get all products with current stock
    const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, barcode, name, stock_quantity, cost_price, price')
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .order('name', { ascending: true })

    if (productsError) {
        console.error('Error fetching products:', productsError)
        return null
    }

    // Get inventory logs for the month to show changes
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const { data: logs, error: logsError } = await supabase
        .from('inventory_logs')
        .select('product_id, type, change_amount')
        .eq('shop_id', shopId)
        .gte('created_at', startDate + 'T00:00:00Z')
        .lte('created_at', endDate + 'T23:59:59Z')

    if (logsError) {
        console.error('Error fetching inventory logs:', logsError)
        return null
    }

    // Calculate movements
    const movements = logs.reduce((acc, log) => {
        if (!acc[log.product_id]) {
            acc[log.product_id] = { imported: 0, sold: 0, adjusted: 0, voided: 0 }
        }
        if (log.type === 'import') acc[log.product_id].imported += log.change_amount
        if (log.type === 'sale') acc[log.product_id].sold -= log.change_amount
        if (log.type === 'adjustment') acc[log.product_id].adjusted += log.change_amount
        if (log.type === 'void') acc[log.product_id].voided += log.change_amount
        return acc
    }, {})

    // Calculate estimated beginning stock
    const inventory = products.map(p => {
        const move = movements[p.id] || { imported: 0, sold: 0, adjusted: 0, voided: 0 }
        const totalChange = move.imported + move.sold + move.adjusted + move.voided
        const beginningStock = p.stock_quantity - totalChange

        return {
            id: p.id,
            barcode: p.barcode,
            name: p.name,
            costPrice: p.cost_price,
            salePrice: p.price,
            beginningStock: Math.max(0, beginningStock),
            imported: move.imported,
            sold: move.sold,
            adjusted: move.adjusted,
            voided: move.voided,
            endingStock: p.stock_quantity,
            estimatedValue: p.stock_quantity * p.cost_price
        }
    })

    const totalValue = inventory.reduce((sum, item) => sum + item.estimatedValue, 0)

    return {
        year,
        month,
        startDate,
        endDate,
        inventory,
        totalValue,
        totalItems: inventory.length
    }
}

/**
 * Format large numbers with Vietnamese thousand separator
 */
export const formatMoney = (value) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value)
}

/**
 * Format date in Vietnamese
 */
export const formatDateVN = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
