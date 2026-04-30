import api from './api'

export const getMonthlyRevenue = async (shopId, year, month) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01T00:00:00Z`
    const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}T23:59:59Z`

    try {
        const response = await api.get('/sales', { params: { startDate, endDate } })
        const data = response.data

        const getLocalDate = (dateString) => {
            const date = new Date(dateString)
            date.setHours(date.getHours() + 7)
            return date.toISOString().split('T')[0]
        }

        const nonVoidSales = data.filter(s => !s.is_void)
        const grouped = nonVoidSales.reduce((acc, sale) => {
            const method = sale.payment_method || 'cash'
            if (!acc[method]) acc[method] = { count: 0, total: 0, sales: [] }
            acc[method].count += 1
            acc[method].total += sale.total_amount
            acc[method].sales.push(sale)
            return acc
        }, {})

        const byDay = data.reduce((acc, sale) => {
            if (sale.is_void) return acc
            const date = getLocalDate(sale.sale_date)
            if (!acc[date]) acc[date] = { date, revenue: 0, count: 0, sales: [] }
            acc[date].revenue += sale.total_amount
            acc[date].count += 1
            acc[date].sales.push(sale)
            return acc
        }, {})

        const totalRevenue = nonVoidSales.reduce((sum, s) => sum + s.total_amount, 0)
        const avgPerSale = nonVoidSales.length > 0 ? Math.round(totalRevenue / nonVoidSales.length) : 0

        return {
            year, month, startDate: startDate.split('T')[0], endDate: endDate.split('T')[0],
            byMethod: grouped,
            byDay: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
            totalRevenue, totalSales: nonVoidSales.length,
            totalVoids: data.filter(s => s.is_void).length,
            avgPerSale, rawData: data
        }
    } catch (err) {
        console.error('Error fetching monthly revenue:', err)
        return null
    }
}

export const getYearlyRevenue = async (shopId, year) => {
    const startDate = `${year}-01-01T00:00:00Z`
    const endDate = `${year}-12-31T23:59:59Z`

    try {
        const response = await api.get('/sales', { params: { startDate, endDate } })
        const data = response.data.filter(s => !s.is_void)

        const byMonth = Array(12).fill(null).map((_, i) => ({
            month: i + 1,
            monthName: new Date(year, i).toLocaleString('vi-VN', { month: 'long' }),
            revenue: 0, count: 0
        }))

        data.forEach(sale => {
            const monthIndex = new Date(sale.sale_date).getMonth()
            byMonth[monthIndex].revenue += sale.total_amount
            byMonth[monthIndex].count += 1
        })

        return { year, byMonth, totalRevenue: data.reduce((sum, s) => sum + s.total_amount, 0) }
    } catch (err) {
        console.error('Error fetching yearly revenue:', err)
        return null
    }
}

export const getCashbookReport = async (shopId, year, month) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01T00:00:00Z`
    const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}T23:59:59Z`

    try {
        const [flowsRes, salesRes] = await Promise.all([
            api.get('/reports/cash-flows', { params: { startDate, endDate } }),
            api.get('/sales', { params: { startDate, endDate } })
        ])

        const flows = flowsRes.data
        const sales = salesRes.data.filter(s => !s.is_void)

        const getLocalDate = (dateString) => {
            const date = new Date(dateString)
            date.setHours(date.getHours() + 7)
            return date.toISOString().split('T')[0]
        }

        const salesByDate = sales.reduce((acc, s) => {
            const localDate = getLocalDate(s.sale_date)
            if (!acc[localDate]) acc[localDate] = { date: localDate, total: 0, count: 0 }
            acc[localDate].total += s.total_amount
            acc[localDate].count += 1
            return acc
        }, {})

        const transactions = [
            ...Object.values(salesByDate).map(s => ({
                date: s.date, type: 'in', category: 'Bán hàng',
                description: `Doanh thu bán hàng (${s.count} GD)`, amount: s.total
            })),
            ...flows.map(f => ({
                date: f.created_at.split('T')[0], type: f.type, category: f.category,
                description: f.description, amount: f.amount
            }))
        ].sort((a, b) => a.date.localeCompare(b.date))

        const totalIn = flows.filter(f => f.type === 'in').reduce((sum, f) => sum + f.amount, 0)
        const totalOut = flows.filter(f => f.type === 'out').reduce((sum, f) => sum + f.amount, 0)
        const salesRevenue = Object.values(salesByDate).reduce((sum, s) => sum + s.total, 0)

        return {
            year, month, startDate: startDate.split('T')[0], endDate: endDate.split('T')[0],
            transactions, totalIn: totalIn + salesRevenue, totalOut,
            balance: (totalIn + salesRevenue) - totalOut,
            salesRevenue, manualInflows: totalIn, rawData: transactions
        }
    } catch (err) {
        console.error('Error fetching cashbook:', err)
        return null
    }
}

export const getInventorySnapshot = async (shopId, year, month) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01T00:00:00Z`
    const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}T23:59:59Z`

    try {
        const [productsRes, logsRes] = await Promise.all([
            api.get('/products'),
            api.get('/reports/inventory-logs', { params: { startDate, endDate } })
        ])

        const products = productsRes.data
        const logs = logsRes.data

        const movements = logs.reduce((acc, log) => {
            if (!acc[log.product_id]) acc[log.product_id] = { imported: 0, sold: 0, adjusted: 0, voided: 0 }
            if (log.type === 'import') acc[log.product_id].imported += log.change_amount
            if (log.type === 'sale') acc[log.product_id].sold -= log.change_amount
            if (log.type === 'adjustment') acc[log.product_id].adjusted += log.change_amount
            if (log.type === 'void') acc[log.product_id].voided += log.change_amount
            return acc
        }, {})

        const inventory = products.map(p => {
            const move = movements[p.id] || { imported: 0, sold: 0, adjusted: 0, voided: 0 }
            const totalChange = move.imported + move.sold + move.adjusted + move.voided
            return {
                id: p.id, barcode: p.barcode, name: p.name,
                costPrice: p.cost_price, salePrice: p.price,
                beginningStock: Math.max(0, p.stock_quantity - totalChange),
                imported: move.imported, sold: move.sold, adjusted: move.adjusted, voided: move.voided,
                endingStock: p.stock_quantity, estimatedValue: p.stock_quantity * p.cost_price
            }
        })

        return {
            year, month, startDate: startDate.split('T')[0], endDate: endDate.split('T')[0],
            inventory, totalValue: inventory.reduce((sum, item) => sum + item.estimatedValue, 0),
            totalItems: inventory.length
        }
    } catch (err) {
        console.error('Error fetching inventory:', err)
        return null
    }
}

export const formatMoney = (value) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(value)
}

export const formatDateVN = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
