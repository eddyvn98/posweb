import * as XLSX from 'xlsx'

/**
 * Export ALL data for backup/compliance
 */
export const exportAllData = async (shopId, supabase) => {
    const workbook = XLSX.utils.book_new()

    try {
        // Get all data
        const { data: sales } = await supabase
            .from('sales')
            .select('*')
            .eq('shop_id', shopId)

        const { data: items } = await supabase
            .from('sale_items')
            .select('*')

        const { data: products } = await supabase
            .from('products')
            .select('*')
            .eq('shop_id', shopId)

        const { data: cashflows } = await supabase
            .from('cash_flows')
            .select('*')
            .eq('shop_id', shopId)

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
            const sheet = XLSX.utils.json_to_sheet(salesData)
            XLSX.utils.book_append_sheet(workbook, sheet, 'Bán hàng')
        }

        // Items sheet
        if (items && items.length > 0) {
            const itemsData = items.map(i => ({
                'Sale ID': i.sale_id,
                'Sản phẩm': i.product_name,
                'Số lượng': i.quantity,
                'Giá': i.price,
                'Thành tiền': i.quantity * i.price
            }))
            const sheet = XLSX.utils.json_to_sheet(itemsData)
            XLSX.utils.book_append_sheet(workbook, sheet, 'Chi tiết')
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
            const sheet = XLSX.utils.json_to_sheet(productsData)
            XLSX.utils.book_append_sheet(workbook, sheet, 'Sản phẩm')
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
            const sheet = XLSX.utils.json_to_sheet(cashData)
            XLSX.utils.book_append_sheet(workbook, sheet, 'Sổ quỹ')
        }

        // Metadata sheet
        const metadata = [
            ['Thông tin sao lưu', ''],
            ['Ngày xuất', new Date().toLocaleString('vi-VN')],
            ['', ''],
            ['Tổng hóa đơn', sales?.length || 0],
            ['Tổng sản phẩm', products?.length || 0],
            ['Tổng giao dịch quỹ', cashflows?.length || 0],
            ['', ''],
            ['Ghi chú', 'File này được xuất từ hệ thống POS. Không thể chỉnh sửa.']
        ]
        const metaSheet = XLSX.utils.aoa_to_sheet(metadata)
        XLSX.utils.book_append_sheet(workbook, metaSheet, 'Thông tin')

        // Export
        const filename = `backup-${new Date().toISOString().split('T')[0]}.xlsx`
        XLSX.writeFile(workbook, filename)

        return { success: true, message: `Đã xuất ${filename}` }
    } catch (err) {
        console.error('Export error:', err)
        throw err
    }
}

/**
 * Export monthly revenue report to 6-sheet Excel format
 * SPEC: new1.md – Vietnamese POS Tax-Compliant Export
 * 
 * SHEET 1: Tổng quan (Summary)
 * SHEET 2: Chi tiết bán hàng (Sales Detail – TAX REPORT)
 * SHEET 3: Doanh thu theo ngày (Daily Revenue)
 * SHEET 4: Theo phương thức thanh toán (By Payment Method)
 * SHEET 5: Thu - Chi (Cashbook)
 * SHEET 6: Tồn kho cuối kỳ (Inventory)
 */
export const exportMonthlyReportCompliant = async (
    shopId,
    year,
    month,
    shopName,
    revenueData,
    cashbookData,
    inventoryData,
    supabase
) => {
    const workbook = XLSX.utils.book_new()

    try {
        // ============ SHEET 1: TỔNG QUAN ============
        const monthName = new Date(year, month - 1).toLocaleString('vi-VN', {
            month: 'long',
            year: 'numeric'
        })

        const summaryData = [
            ['TỔNG QUAN BÁO CÁO', ''],
            ['', ''],
            ['Cửa hàng', shopName || 'POS Shop'],
            ['Tháng báo cáo', monthName],
            ['Ngày xuất file', new Date().toLocaleString('vi-VN')],
            ['', ''],
            ['DOANH THU', ''],
            ['Tổng doanh thu', revenueData.totalRevenue],
            ['Tổng giao dịch', revenueData.totalSales],
            ['Doanh thu TB/giao dịch', revenueData.avgPerSale],
            ['Giao dịch bị huỷ', revenueData.totalVoids],
            ['', ''],
            ['THÔNG TIN KHÁC', ''],
            ['Giá trị tồn kho', inventoryData?.totalValue || 0],
            ['', ''],
            ['CHÂN DUNG', 'Dữ liệu được xuất tự động từ hệ thống POS, không chỉnh sửa thủ công.']
        ]

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
        summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }]
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng quan')

        // ============ SHEET 2: CHI TIẾT BÁN HÀNG (TAX REPORT) ============
        const salesDetailHeaders = [
            'Ngày bán (dd/mm/yyyy)',
            'Giờ bán (hh:mm)',
            'Mã phiếu (HD-xxxxx)',
            'Tổng tiền',
            'Phương thức TT',
            'Trạng thái'
        ]

        // Helper: Convert UTC sale_date to local date (GMT+7)
        const getLocalDate = (dateString) => {
            const date = new Date(dateString)
            date.setHours(date.getHours() + 7)
            return date.toISOString().split('T')[0]
        }

        // Payment method mapping (used in SHEET 2 and SHEET 4)
        const methodMap = {
            'cash': 'Tiền mặt',
            'transfer': 'Chuyển khoản',
            'qr': 'QR Code'
        }

        const salesDetailData = revenueData.rawData
            .sort((a, b) => {
                const localDateA = getLocalDate(a.sale_date)
                const localDateB = getLocalDate(b.sale_date)
                const dateCompare = localDateA.localeCompare(localDateB)
                if (dateCompare !== 0) return dateCompare
                return new Date(a.sale_date) - new Date(b.sale_date)
            })
            .map(sale => {
                const saleDate = new Date(sale.sale_date)
                const localDate = getLocalDate(sale.sale_date)
                const dateStr = localDate.split('-').reverse().join('/')
                const timeStr = saleDate.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                })

                return [
                    dateStr,
                    timeStr,
                    sale.code || 'HD-' + sale.id.substring(0, 5).toUpperCase(),
                    sale.total_amount,
                    methodMap[sale.payment_method] || sale.payment_method,
                    sale.is_void ? 'Huỷ' : 'Bình thường'
                ]
            })

        const salesDetailSheet = XLSX.utils.aoa_to_sheet(
            [salesDetailHeaders, ...salesDetailData],
            { header: 1 }
        )
        salesDetailSheet['!cols'] = [
            { wch: 18 },
            { wch: 14 },
            { wch: 18 },
            { wch: 15 },
            { wch: 18 },
            { wch: 15 }
        ]
        XLSX.utils.book_append_sheet(workbook, salesDetailSheet, 'Chi tiết bán hàng')

        // ============ SHEET 3: DOANH THU THEO NGÀY ============
        const dailyRevenueHeaders = ['Ngày', 'Doanh thu', 'Số giao dịch']
        const dailyRevenueData = revenueData?.byDay?.length > 0
            ? revenueData.byDay.map(day => [
                day.date.split('-').reverse().join('/'),
                day.revenue,
                day.count
            ])
            : []

        const dailySheet = XLSX.utils.aoa_to_sheet(
            [dailyRevenueHeaders, ...dailyRevenueData],
            { header: 1 }
        )
        dailySheet['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }]
        XLSX.utils.book_append_sheet(workbook, dailySheet, 'Doanh thu theo ngày')

        // ============ SHEET 4: THEO PHƯƠNG THỨC THANH TOÁN ============
        const paymentMethodHeaders = ['Phương thức', 'Tổng tiền', 'Số GD']
        const paymentMethodData = revenueData?.byMethod
            ? Object.entries(revenueData.byMethod).map(([method, info]) => [
                methodMap[method] || method,
                info.total,
                info.count
            ])
            : []

        const paymentSheet = XLSX.utils.aoa_to_sheet(
            [paymentMethodHeaders, ...paymentMethodData],
            { header: 1 }
        )
        paymentSheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 12 }]
        XLSX.utils.book_append_sheet(workbook, paymentSheet, 'Theo phương thức')

        // ============ SHEET 5: THU - CHI (CASHBOOK) ============
        const cashbookHeaders = ['Ngày', 'Thu/Chi', 'Số tiền', 'Nội dung']
        const cashbookRows = cashbookData?.transactions?.length > 0 
            ? cashbookData.transactions.map(tx => [
                tx.date.split('-').reverse().join('/'),
                tx.type === 'in' ? 'Thu' : 'Chi',
                tx.amount,
                tx.description
            ])
            : []

        const cashbookSheet = XLSX.utils.aoa_to_sheet(
            [cashbookHeaders, ...cashbookRows],
            { header: 1 }
        )
        cashbookSheet['!cols'] = [
            { wch: 15 },
            { wch: 12 },
            { wch: 15 },
            { wch: 30 }
        ]
        XLSX.utils.book_append_sheet(workbook, cashbookSheet, 'Thu - Chi')

        // ============ SHEET 6: TỒN KHO CUỐI KỲ ============
        const inventoryHeaders = [
            'Tên SP',
            'SL tồn',
            'Giá vốn',
            'Giá trị tồn'
        ]

        const inventoryRows = inventoryData?.inventory?.length > 0
            ? inventoryData.inventory
                .filter(item => item.endingStock > 0)
                .map(item => [
                    item.name,
                    item.endingStock,
                    item.costPrice,
                    item.estimatedValue
                ])
            : []

        const inventorySheet = XLSX.utils.aoa_to_sheet(
            [inventoryHeaders, ...inventoryRows],
            { header: 1 }
        )
        inventorySheet['!cols'] = [
            { wch: 30 },
            { wch: 12 },
            { wch: 12 },
            { wch: 15 }
        ]
        XLSX.utils.book_append_sheet(workbook, inventorySheet, 'Tồn kho cuối kỳ')

        // ============ EXPORT ============
        const filename = `Doanh-thu-${month.toString().padStart(2, '0')}-${year}.xlsx`
        XLSX.writeFile(workbook, filename)

        return { success: true, filename }
    } catch (err) {
        console.error('Export error:', err)
        throw err
    }
}


/**
 * Legacy export to Excel (kept for backward compatibility)
 */
export const exportToExcel = async (data, filename, reportType) => {
    const workbook = XLSX.utils.book_new()

    if (reportType === 'revenue') {
        // Revenue Report Sheet
        const summaryData = [
            ['BÁO CÁO DOANH THU', ''],
            ['', ''],
            ['Tháng', `${data.month}/${data.year}`],
            ['Tổng doanh thu', data.totalRevenue],
            ['Tổng giao dịch', data.totalSales],
            ['Trung bình/giao dịch', Math.round(data.totalRevenue / (data.totalSales || 1))],
            ['', ''],
        ]

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tóm tắt')

        // Detailed sales
        const detailHeaders = ['Mã phiếu', 'Thời gian', 'Số tiền', 'Phương thức']
        const detailData = data.rawData.map(sale => [
            sale.code,
            new Date(sale.sale_date).toLocaleString('vi-VN'),
            sale.total_amount,
            sale.payment_method
        ])

        const detailSheet = XLSX.utils.aoa_to_sheet(
            [detailHeaders, ...detailData],
            { header: 1 }
        )
        XLSX.utils.book_append_sheet(workbook, detailSheet, 'Chi tiết')

        // By method
        const methodHeaders = ['Phương thức', 'Số lượng', 'Tổng tiền']
        const methodData = Object.entries(data.byMethod).map(([method, info]) => [
            method,
            info.count,
            info.total
        ])

        const methodSheet = XLSX.utils.aoa_to_sheet(
            [methodHeaders, ...methodData],
            { header: 1 }
        )
        XLSX.utils.book_append_sheet(workbook, methodSheet, 'Theo phương thức')
    }

    if (reportType === 'cashbook') {
        // Cashbook Summary
        const summaryData = [
            ['BÁO CÁO SỔ QUỸ', ''],
            ['', ''],
            ['Tháng', `${data.month}/${data.year}`],
            ['Tổng thu', data.totalIn],
            ['Tổng chi', data.totalOut],
            ['Số dư', data.balance],
            ['', ''],
        ]

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tóm tắt')

        // Cash In
        const inHeaders = ['Nội dung', 'Ngày', 'Loại', 'Số tiền']
        const inData = data.inFlows.map(flow => [
            flow.description || 'Thu tiền',
            new Date(flow.created_at).toLocaleDateString('vi-VN'),
            flow.category,
            flow.amount
        ])

        const inSheet = XLSX.utils.aoa_to_sheet(
            [inHeaders, ...inData],
            { header: 1 }
        )
        XLSX.utils.book_append_sheet(workbook, inSheet, 'Thu tiền')

        // Cash Out
        const outHeaders = ['Nội dung', 'Ngày', 'Loại', 'Số tiền']
        const outData = data.outFlows.map(flow => [
            flow.description || 'Chi tiền',
            new Date(flow.created_at).toLocaleDateString('vi-VN'),
            flow.category,
            flow.amount
        ])

        const outSheet = XLSX.utils.aoa_to_sheet(
            [outHeaders, ...outData],
            { header: 1 }
        )
        XLSX.utils.book_append_sheet(workbook, outSheet, 'Chi tiền')
    }

    if (reportType === 'inventory') {
        // Inventory Summary
        const summaryData = [
            ['BÁO CÁO TỒN KHO', ''],
            ['', ''],
            ['Tháng', `${data.month}/${data.year}`],
            ['Tổng giá trị', data.totalValue],
            ['Tổng sản phẩm', data.totalItems],
            ['', ''],
        ]

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tóm tắt')

        // Detailed inventory
        const headers = ['Tên sản phẩm', 'Mã vạch', 'Đầu kỳ', 'Nhập', 'Bán', 'Cuối kỳ', 'Giá vốn', 'Giá trị']
        const inventoryData = data.inventory.map(item => [
            item.name,
            item.barcode,
            item.beginningStock,
            item.imported,
            item.sold,
            item.endingStock,
            item.costPrice,
            item.estimatedValue
        ])

        const inventorySheet = XLSX.utils.aoa_to_sheet(
            [headers, ...inventoryData],
            { header: 1 }
        )
        XLSX.utils.book_append_sheet(workbook, inventorySheet, 'Chi tiết')
    }

    // Write file
    XLSX.writeFile(workbook, `${filename}.xlsx`)
}

/**
 * Format currency for Excel (Vietnamese format)
 */
export const formatCurrencyExcel = (value) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'decimal',
        minimumFractionDigits: 0
    }).format(value)
}
