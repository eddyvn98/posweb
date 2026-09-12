import * as XLSX from 'xlsx'
import api from './api'

export const exportAllData = async (shopId) => {
    const workbook = XLSX.utils.book_new()

    try {
        // Prepare date range for "all" data (e.g., from 2020 to 2050)
        const startDate = '2020-01-01T00:00:00Z'
        const endDate = '2050-12-31T23:59:59Z'

        const [salesRes, productsRes, flowsRes] = await Promise.all([
            api.get('/sales', { params: { startDate, endDate } }),
            api.get('/products'),
            api.get('/reports/cash-flows', { params: { startDate, endDate } })
        ])

        const sales = salesRes.data
        const products = productsRes.data
        const cashflows = flowsRes.data

        // Sales sheet
        if (sales && sales.length > 0) {
            const salesData = sales.map(s => ({
                'Mã phiếu': s.code,
                'Ngày': s.sale_date,
                'Tổng tiền': s.total_amount,
                'Phương thức': s.payment_method,
                'Huỷ': s.is_void ? 'Có' : 'Không',
                'Ngày huỷ': s.void_at || ''
            }))
            XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(salesData), 'Bán hàng')

            // Extract items for sheet
            const itemsData = []
            sales.forEach(s => {
                if (s.items) {
                    s.items.forEach(i => {
                        itemsData.push({
                            'Mã phiếu': s.code,
                            'Sản phẩm': i.product_name,
                            'Số lượng': i.quantity,
                            'Giá': i.price,
                            'Thành tiền': i.quantity * i.price
                        })
                    })
                }
            })
            if (itemsData.length > 0) {
                XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(itemsData), 'Chi tiết')
            }
        }

        // Products sheet
        if (products && products.length > 0) {
            const productsData = products.map(p => ({
                'Tên': p.name,
                'Mã vạch': p.barcode,
                'Giá bán': p.price,
                'Giá vốn': p.cost_price,
                'Tồn kho': p.stock_quantity,
                'Trạng thái': p.is_active ? 'Bán' : 'Dừng'
            }))
            XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(productsData), 'Sản phẩm')
        }

        // Cashbook sheet
        if (cashflows && cashflows.length > 0) {
            const cashData = cashflows.map(c => ({
                'Ngày': c.created_at,
                'Loại': c.type === 'in' ? 'Thu' : 'Chi',
                'Danh mục': c.category,
                'Mô tả': c.description,
                'Số tiền': c.amount
            }))
            XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(cashData), 'Sổ quỹ')
        }

        const metadata = [
            ['Thông tin sao lưu', ''],
            ['Ngày xuất', new Date().toLocaleString('vi-VN')],
            ['Tổng hóa đơn', sales?.length || 0],
            ['Tổng sản phẩm', products?.length || 0],
            ['Tổng giao dịch quỹ', cashflows?.length || 0]
        ]
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(metadata), 'Thông tin')

        const filename = `backup-${new Date().toISOString().split('T')[0]}.xlsx`
        XLSX.writeFile(workbook, filename)
        return { success: true, message: `Đã xuất ${filename}` }
    } catch (err) {
        console.error('Export error:', err)
        throw err
    }
}

export const exportMonthlyReportCompliant = async (
    shopId, year, month, shopName,
    revenueData, cashbookData, inventoryData
) => {
    const workbook = XLSX.utils.book_new()
    try {
        const monthName = new Date(year, month - 1).toLocaleString('vi-VN', { month: 'long', year: 'numeric' })
        const summaryData = [
            ['TỔNG QUAN BÁO CÁO', ''],
            ['Cửa hàng', shopName || 'PosWebFree'],
            ['Tháng báo cáo', monthName],
            ['Ngày xuất file', new Date().toLocaleString('vi-VN')],
            ['', ''],
            ['DOANH THU', ''],
            ['Tổng doanh thu', revenueData.totalRevenue],
            ['Tổng giao dịch', revenueData.totalSales],
            ['Giao dịch bị huỷ', revenueData.totalVoids],
            ['Giá trị tồn kho', inventoryData?.totalValue || 0]
        ]
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryData), 'Tổng quan')

        const methodMap = { 'cash': 'Tiền mặt', 'transfer': 'Chuyển khoản', 'qr': 'QR Code' }
        const salesDetailHeaders = ['Ngày', 'Giờ', 'Mã phiếu', 'Tổng tiền', 'Phương thức', 'Trạng thái']
        const salesDetailData = revenueData.rawData.map(sale => {
            const date = new Date(sale.sale_date)
            return [
                date.toLocaleDateString('vi-VN'),
                date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }),
                sale.code,
                sale.total_amount,
                methodMap[sale.payment_method] || sale.payment_method,
                sale.is_void ? 'Huỷ' : 'Bình thường'
            ]
        })
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([salesDetailHeaders, ...salesDetailData]), 'Chi tiết bán hàng')

        const dailyRevenueHeaders = ['Ngày', 'Doanh thu', 'Số GD']
        const dailyRevenueData = revenueData?.byDay?.map(day => [day.date.split('-').reverse().join('/'), day.revenue, day.count]) || []
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([dailyRevenueHeaders, ...dailyRevenueData]), 'Thống kê ngày')

        const cashbookHeaders = ['Ngày', 'Loại', 'Số tiền', 'Nội dung']
        const cashbookRows = cashbookData?.transactions?.map(tx => [tx.date.split('-').reverse().join('/'), tx.type === 'in' ? 'Thu' : 'Chi', tx.amount, tx.description]) || []
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([cashbookHeaders, ...cashbookRows]), 'Thu - Chi')

        const inventoryHeaders = ['Tên SP', 'SL tồn', 'Giá vốn', 'Giá trị']
        const inventoryRows = inventoryData?.inventory?.filter(item => item.endingStock > 0).map(item => [item.name, item.endingStock, item.costPrice, item.estimatedValue]) || []
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([inventoryHeaders, ...inventoryRows]), 'Tồn kho')

        const filename = `Report-${String(month).padStart(2, '0')}-${year}.xlsx`
        XLSX.writeFile(workbook, filename)
        return { success: true, filename }
    } catch (err) {
        console.error('Export error:', err)
        throw err
    }
}

export const exportToExcel = async (data, filename, type) => {
    const workbook = XLSX.utils.book_new()
    let sheetData = []
    let sheetName = 'Báo cáo'

    try {
        if (type === 'revenue') {
            sheetName = 'Doanh thu'
            sheetData = data.rawData.map(sale => ({
                'Ngày': new Date(sale.sale_date).toLocaleString('vi-VN'),
                'Mã phiếu': sale.code,
                'Tổng tiền': sale.total_amount,
                'Phương thức': sale.payment_method,
                'Trạng thái': sale.is_void ? 'Huỷ' : 'Bình thường'
            }))
        } else if (type === 'inventory') {
            sheetName = 'Tồn kho'
            sheetData = data.inventory.map(item => ({
                'Sản phẩm': item.name,
                'Mã vạch': item.barcode,
                'Đầu kỳ': item.beginningStock,
                'Nhập': item.imported,
                'Bán': item.sold,
                'Điều chỉnh': item.adjusted,
                'Cuối kỳ': item.endingStock,
                'Giá trị': item.estimatedValue
            }))
        } else if (type === 'cashbook') {
            sheetName = 'Sổ quỹ'
            sheetData = data.transactions.map(tx => ({
                'Ngày': new Date(tx.date).toLocaleDateString('vi-VN'),
                'Loại': tx.type === 'in' ? 'Thu' : 'Chi',
                'Nội dung': tx.description,
                'Số tiền': tx.amount
            }))
        }

        const worksheet = XLSX.utils.json_to_sheet(sheetData)
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
        XLSX.writeFile(workbook, `${filename}.xlsx`)
        return { success: true }
    } catch (err) {
        console.error('ExportToExcel error:', err)
        throw err
    }
}
