import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import api from '../lib/api'
import { useNotification } from '../contexts/NotificationContext'
import SmartPriceInput from '../components/Common/SmartPriceInput'
import { useScanBarcode } from '../hooks/useScanBarcode'
import { normalizeBarcode } from '../lib/searchUtils'
import { 
    Receipt, 
    Clipboard as ClipboardText, 
    Tag, 
    Zap, 
    Trash2, 
    Plus, 
    Check,
    RotateCcw,
    AlertTriangle,
    Building2
} from 'lucide-react'

// Helper to auto-generate system barcode (13-digit EAN style string)
function generateSystemBarcode() {
    const prefix = '893'
    const randomMiddle = Math.floor(100000 + Math.random() * 900000)
    const timestampSuffix = Date.now().toString().slice(-3)
    return `${prefix}${randomMiddle}${timestampSuffix}`
}

export default function SheetImport() {
    const navigate = useNavigate()
    const { showNotification } = useNotification()
    const [supplier, setSupplier] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPasteModal, setShowPasteModal] = useState(false)
    const [pasteRawText, setPasteRawText] = useState('')

    // Products catalog for quick barcode lookup
    const [productCatalog, setProductCatalog] = useState([])

    // Table rows state - default starts with 3 empty interactive rows
    const [rows, setRows] = useState([
        { id: uuidv4(), barcode: '', name: '', unit: 'Cái', isEinvoice: false, costPrice: '', sellingPrice: '', qty: 1 },
        { id: uuidv4(), barcode: '', name: '', unit: 'Cái', isEinvoice: false, costPrice: '', sellingPrice: '', qty: 1 },
        { id: uuidv4(), barcode: '', name: '', unit: 'Cái', isEinvoice: false, costPrice: '', sellingPrice: '', qty: 1 },
    ])

    // Load products from API for matching barcodes
    useEffect(() => {
        api.get('/products')
            .then(res => setProductCatalog(res.data || []))
            .catch(err => console.error('Failed to load products for sheet import', err))
    }, [])

    // Barcode scanner integration - scans into current active row or adds new row
    useScanBarcode({
        onScan: (scannedCode) => {
            if (!scannedCode) return
            
            const cleanScanned = normalizeBarcode(scannedCode)
            // Check if product exists in catalog
            const matched = productCatalog.find(p => p.barcode === scannedCode || (cleanScanned && normalizeBarcode(p.barcode) === cleanScanned))

            setRows(prevRows => {
                // Find empty row or current active row
                const emptyRowIdx = prevRows.findIndex(r => !r.barcode && !r.name)
                
                if (emptyRowIdx >= 0) {
                    const next = [...prevRows]
                    next[emptyRowIdx] = {
                        ...next[emptyRowIdx],
                        barcode: scannedCode,
                        name: matched ? matched.name : next[emptyRowIdx].name,
                        unit: matched?.unit || next[emptyRowIdx].unit || 'Cái',
                        costPrice: matched ? (matched.cost_price || matched.price) : next[emptyRowIdx].costPrice,
                        sellingPrice: matched ? matched.price : next[emptyRowIdx].sellingPrice,
                    }
                    return next
                } else {
                    // Append new row
                    return [
                        ...prevRows,
                        {
                            id: uuidv4(),
                            barcode: scannedCode,
                            name: matched ? matched.name : `SP ${scannedCode}`,
                            unit: matched?.unit || 'Cái',
                            isEinvoice: false,
                            costPrice: matched ? (matched.cost_price || matched.price) : '',
                            sellingPrice: matched ? matched.price : '',
                            qty: 1
                        }
                    ]
                }
            })

            showNotification(`Đã quét mã: ${scannedCode} ${matched ? `(${matched.name})` : ''}`, 'info')
        }
    })

    // Handler to update a field in a table row
    const updateRow = (id, field, value) => {
        setRows(prev => prev.map(row => {
            if (row.id === id) {
                const updated = { ...row, [field]: value }

                // Auto match product catalog when barcode changes
                if (field === 'barcode' && value) {
                    const cleanVal = normalizeBarcode(value)
                    const matched = productCatalog.find(p => p.barcode === value.trim() || (cleanVal && normalizeBarcode(p.barcode) === cleanVal))
                    if (matched) {
                        if (!updated.name) updated.name = matched.name
                        if (!updated.unit) updated.unit = matched.unit || 'Cái'
                        if (!updated.costPrice) updated.costPrice = matched.cost_price || matched.price
                        if (!updated.sellingPrice) updated.sellingPrice = matched.price
                    }
                }

                return updated
            }
            return row
        }))
    }

    // Generate automatic barcode for a specific row
    const handleGenerateBarcode = (id) => {
        const newCode = generateSystemBarcode()
        updateRow(id, 'barcode', newCode)
        showNotification(`Đã sinh mã vạch hệ thống: ${newCode}`, 'success')
    }

    // Add a new empty row to the table
    const handleAddRow = () => {
        setRows(prev => [
            ...prev,
            { id: uuidv4(), barcode: '', name: '', unit: 'Cái', isEinvoice: false, costPrice: '', sellingPrice: '', qty: 1 }
        ])
    }

    // Reset table
    const handleResetRows = () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ bảng dữ liệu để làm mới không?')) {
            setRows([
                { id: uuidv4(), barcode: '', name: '', unit: 'Cái', isEinvoice: false, costPrice: '', sellingPrice: '', qty: 1 },
                { id: uuidv4(), barcode: '', name: '', unit: 'Cái', isEinvoice: false, costPrice: '', sellingPrice: '', qty: 1 },
                { id: uuidv4(), barcode: '', name: '', unit: 'Cái', isEinvoice: false, costPrice: '', sellingPrice: '', qty: 1 },
            ])
            setSupplier('')
            showNotification('Đã xóa dữ liệu bảng', 'info')
        }
    }

    // Remove row by ID
    const handleRemoveRow = (id) => {
        if (rows.length === 1) {
            setRows([{ id: uuidv4(), barcode: '', name: '', unit: 'Cái', isEinvoice: false, costPrice: '', sellingPrice: '', qty: 1 }])
            return
        }
        setRows(prev => prev.filter(r => r.id !== id))
    }

    // Parse Tab-separated/CSV text from Excel or Google Sheet paste
    const handleParsePastedSheet = () => {
        if (!pasteRawText.trim()) {
            showNotification('Vui lòng dán dữ liệu từ Sheet', 'error')
            return
        }

        const lines = pasteRawText.split(/\r?\n/).map(x => x.trim()).filter(Boolean)
        const parsedRows = []

        for (const line of lines) {
            const cols = line.includes('\t') ? line.split('\t') : line.split(',')
            if (cols.length === 0) continue

            const barcode = String(cols[0] || '').trim()
            const name = String(cols[1] || '').trim()
            const qty = Number(String(cols[2] || '1').replace(/[^\d.-]/g, '')) || 1
            const costPrice = Number(String(cols[3] || '0').replace(/[^\d.-]/g, '')) || 0
            const sellingPrice = Number(String(cols[4] || '0').replace(/[^\d.-]/g, '')) || 0
            const unit = String(cols[5] || 'Cái').trim()

            if (!barcode && !name) continue

            // Auto match existing product catalog
            const matched = productCatalog.find(p => p.barcode === barcode)

            parsedRows.push({
                id: uuidv4(),
                barcode: barcode || (matched?.barcode) || generateSystemBarcode(),
                name: name || matched?.name || 'Sản phẩm mới',
                unit: unit || matched?.unit || 'Cái',
                isEinvoice: false,
                costPrice: costPrice > 0 ? costPrice : (matched?.cost_price || matched?.price || 0),
                sellingPrice: sellingPrice > 0 ? sellingPrice : (matched?.price || costPrice || 0),
                qty: qty > 0 ? qty : 1
            })
        }

        if (parsedRows.length === 0) {
            showNotification('Không tìm thấy dòng dữ liệu hợp lệ', 'error')
            return
        }

        setRows(parsedRows)
        setPasteRawText('')
        setShowPasteModal(false)
        showNotification(`Đã nạp ${parsedRows.length} dòng từ Sheet!`, 'success')
    }

    // Filter valid rows ready for processing
    const validRows = useMemo(() => {
        return rows.filter(r => (r.name.trim() || r.barcode.trim()) && Number(r.qty) > 0)
    }, [rows])

    // Calculate totals
    const totalQty = useMemo(() => {
        return validRows.reduce((sum, r) => sum + (Number(r.qty) || 0), 0)
    }, [validRows])

    const totalCostAmount = useMemo(() => {
        return validRows.reduce((sum, r) => sum + ((Number(r.qty) || 0) * (Number(r.costPrice) || 0)), 0)
    }, [validRows])

    // Transfer valid items to Price Tag Printing screen
    const handleTransferToPriceTags = () => {
        if (validRows.length === 0) {
            showNotification('Vui lòng nhập ít nhất 1 sản phẩm hợp lệ để chuyển sang in tem', 'error')
            return
        }

        const printItems = validRows.map(r => {
            const rawP = Number(r.sellingPrice) || Number(r.costPrice) || 0
            const finalP = rawP > 0 && rawP < 1000 ? rawP * 1000 : rawP
            return {
                id: r.id,
                barcode: r.barcode.trim() || generateSystemBarcode(),
                name: r.name.trim() || 'Sản phẩm',
                price: finalP,
                printQty: Number(r.qty) || 1
            }
        })

        try {
            localStorage.setItem('posweb_print_items', JSON.stringify(printItems))
        } catch (e) {
            // ignore
        }

        showNotification(`Đã chuyển ${printItems.length} sản phẩm sang màn hình In Tem Giá`, 'success')
        navigate('/price-tags', { state: { items: printItems } })
    }

    // Concurrent pool worker helper
    const runPool = async (items, worker, concurrency = 8) => {
        let i = 0
        const run = async () => {
            while (i < items.length) {
                const idx = i++
                await worker(items[idx], idx)
            }
        }
        await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => run()))
    }

    // Complete Import action
    const handleSubmitImport = async () => {
        if (validRows.length === 0) {
            showNotification('Vui lòng nhập đầy đủ Tên hoặc Mã vạch sản phẩm trước khi hoàn tất', 'error')
            return
        }

        setLoading(true)
        try {
            const productsRes = await api.get('/products')
            const existingMap = new Map((productsRes.data || []).map(p => [p.barcode, p]))

            await runPool(validRows, async (row) => {
                const barcode = row.barcode.trim() || generateSystemBarcode()
                const old = existingMap.get(barcode)

                let costPriceNum = Number(row.costPrice) || 0
                if (costPriceNum > 0 && costPriceNum < 1000) costPriceNum *= 1000
                let sellingPriceNum = Number(row.sellingPrice) || costPriceNum || 0
                if (sellingPriceNum > 0 && sellingPriceNum < 1000) sellingPriceNum *= 1000
                const qtyNum = Number(row.qty) || 1
                const nextStock = (Number(old?.stock_quantity) || 0) + qtyNum

                const payload = {
                    id: old?.id || uuidv4(),
                    barcode: barcode,
                    name: row.name.trim() || old?.name || `SP ${barcode}`,
                    unit: row.unit || old?.unit || 'Cái',
                    category: old?.category || '',
                    price: sellingPriceNum > 0 ? sellingPriceNum : (old?.price || costPriceNum),
                    cost_price: costPriceNum > 0 ? costPriceNum : (old?.cost_price || 0),
                    stock_quantity: nextStock,
                    image_url: old?.image_url || null,
                    is_active: true,
                    created_at: old?.created_at || new Date().toISOString(),
                }

                await api.post('/products/upsert', payload)
                existingMap.set(barcode, { ...payload })
            }, 8)

            await api.post('/imports', {
                import_date: new Date().toISOString().slice(0, 10),
                supplier_name: supplier.trim() || 'Nhập sheet trực tiếp',
                total_cost: Math.round(totalCostAmount),
                note: `Bảng nhập sheet: ${validRows.length} món (${totalQty} SP)${validRows.some(r => r.isEinvoice) ? ' [Có HĐĐT]' : ''}`,
            })

            showNotification(`Đã hoàn tất nhập kho ${validRows.length} sản phẩm / Tổng SL: ${totalQty}`, 'success')

            if (window.confirm('Đơn nhập kho đã hoàn tất thành công! Bạn có muốn chuyển sang màn hình In Tem Giá cho các sản phẩm này không?')) {
                handleTransferToPriceTags()
            } else {
                setRows([
                    { id: uuidv4(), barcode: '', name: '', unit: 'Cái', isEinvoice: false, costPrice: '', sellingPrice: '', qty: 1 },
                    { id: uuidv4(), barcode: '', name: '', unit: 'Cái', isEinvoice: false, costPrice: '', sellingPrice: '', qty: 1 },
                ])
                setSupplier('')
            }
        } catch (err) {
            console.error('Import sheet failed:', err)
            showNotification(`Lỗi khi hoàn tất đơn nhập: ${err.response?.data?.error || err.message}`, 'error')
        } finally {
            setLoading(false)
        }
    }

    const formatMoney = (val) => new Intl.NumberFormat('vi-VN').format(Number(val || 0))

    return (
        <div className="min-h-screen bg-gray-50 p-3 md:p-5 pb-32">
            <div className="max-w-7xl mx-auto space-y-3">
                {/* Compact Integrated Header */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-sm">
                    <div className="flex-1 min-w-0 w-full">
                        <div className="flex items-center gap-2">
                            <Receipt className="w-6 h-6 text-primary shrink-0" />
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                Bảng Nhập Liệu Trực Tiếp
                            </h1>
                        </div>
                        
                        {/* Supplier Quick Input Inline */}
                        <div className="mt-2 flex items-center gap-2 max-w-md">
                            <span className="text-xs font-bold text-gray-500 whitespace-nowrap flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" /> NCC:
                            </span>
                            <input
                                className="input w-full text-xs h-8 bg-gray-50 focus:bg-white border-gray-200"
                                placeholder="Nhập tên nhà cung cấp (tùy chọn)..."
                                value={supplier}
                                onChange={(e) => setSupplier(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
                        <button
                            type="button"
                            onClick={() => setShowPasteModal(true)}
                            className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold h-9 px-3 rounded-xl flex items-center gap-1.5"
                        >
                            <ClipboardText className="w-4 h-4" /> Dán từ Sheet
                        </button>
                        <button
                            type="button"
                            onClick={handleResetRows}
                            className="btn bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold h-9 px-2.5 rounded-xl flex items-center gap-1"
                            title="Xóa toàn bộ dữ liệu hiện tại để nhập mới"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> Làm mới
                        </button>
                    </div>
                </div>

                {/* EDITABLE TABLE */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs md:text-sm border-collapse min-w-[950px]">
                            <thead>
                                <tr className="bg-gray-100/80 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
                                    <th className="py-2.5 px-3 text-center w-12">STT</th>
                                    <th className="py-2.5 px-3 min-w-[180px]">Tên sản phẩm</th>
                                    <th className="py-2.5 px-3 min-w-[180px]">Mã Barcode / QR Code</th>
                                    <th className="py-2.5 px-3 w-28">ĐVT</th>
                                    <th className="py-2.5 px-3 text-center w-20">HĐĐT</th>
                                    <th className="py-2.5 px-3 w-32 text-right">Giá vốn (nhập)</th>
                                    <th className="py-2.5 px-3 w-32 text-right">Giá bán</th>
                                    <th className="py-2.5 px-3 w-24 text-center">SL nhập</th>
                                    <th className="py-2.5 px-3 w-36 text-right">Thành tiền</th>
                                    <th className="py-2.5 px-3 text-center w-16">Xóa</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.map((row, index) => {
                                    const amount = (Number(row.qty) || 0) * (Number(row.costPrice) || 0)
                                    const priceWarning = Number(row.sellingPrice) > 0 && Number(row.costPrice) > Number(row.sellingPrice)

                                    return (
                                        <tr key={row.id} className="hover:bg-sky-50/30 transition-colors">
                                            {/* 1. STT */}
                                            <td className="py-2.5 px-3 text-center font-bold text-gray-400">
                                                {index + 1}
                                            </td>

                                            {/* 2. Tên sản phẩm */}
                                            <td className="py-2.5 px-3">
                                                <input
                                                    type="text"
                                                    className="input w-full h-9 text-xs md:text-sm font-semibold border-gray-200 focus:border-primary"
                                                    placeholder="Tên sản phẩm..."
                                                    value={row.name}
                                                    onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                />
                                            </td>

                                            {/* 3. Mã Barcode/QR Code + Button Tạo Mã */}
                                            <td className="py-2.5 px-3">
                                                <div className="flex gap-1 items-center">
                                                    <input
                                                        type="text"
                                                        className="input flex-1 h-9 text-xs font-mono border-gray-200 focus:border-primary"
                                                        placeholder="Quét/Nhập mã vạch..."
                                                        value={row.barcode}
                                                        onChange={(e) => updateRow(row.id, 'barcode', e.target.value)}
                                                        onFocus={(e) => e.target.select()}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleGenerateBarcode(row.id)}
                                                        title="Tự động tạo mã vạch hệ thống mới"
                                                        className="btn bg-gray-100 hover:bg-gray-200 text-gray-600 text-[11px] font-bold h-9 px-2 shrink-0 rounded-lg border flex items-center gap-1"
                                                    >
                                                        <Zap className="w-3 h-3" /> Tạo mã
                                                    </button>
                                                </div>
                                            </td>

                                            {/* 4. Đơn vị tính (ĐVT) */}
                                            <td className="py-2.5 px-3">
                                                <input
                                                    type="text"
                                                    className="input w-full h-9 text-xs text-center border-gray-200 focus:border-primary"
                                                    placeholder="Cái, Hộp..."
                                                    value={row.unit}
                                                    onChange={(e) => updateRow(row.id, 'unit', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                />
                                            </td>

                                            {/* 5. Loại HĐĐT */}
                                            <td className="py-2.5 px-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                                                    checked={row.isEinvoice}
                                                    onChange={(e) => updateRow(row.id, 'isEinvoice', e.target.checked)}
                                                    title="Loại Hóa đơn điện tử (Có / Không)"
                                                />
                                            </td>

                                            {/* 6. Giá vốn */}
                                            <td className="py-2.5 px-3">
                                                <SmartPriceInput
                                                    min="0"
                                                    className="input w-full h-9 px-2 text-xs font-mono border-gray-200 focus-within:border-primary"
                                                    inputClassName="text-xs text-right font-mono font-bold text-gray-800"
                                                    suffixClassName="text-xs font-mono text-gray-400 opacity-60"
                                                    placeholder="0"
                                                    value={row.costPrice}
                                                    onChange={(e) => updateRow(row.id, 'costPrice', e.target.value)}
                                                    onBlur={(e) => {
                                                        const num = Number(e.target.value)
                                                        if (num > 0 && num < 1000) updateRow(row.id, 'costPrice', num * 1000)
                                                    }}
                                                />
                                                {Number(row.costPrice) > 0 && (
                                                    <div className="text-[9px] text-right font-bold text-gray-500">
                                                        = {formatMoney(Number(row.costPrice) < 1000 ? Number(row.costPrice) * 1000 : Number(row.costPrice))}đ
                                                    </div>
                                                )}
                                            </td>

                                            {/* 7. Giá bán */}
                                            <td className="py-2.5 px-3">
                                                <SmartPriceInput
                                                    min="0"
                                                    className={`input w-full h-9 px-2 text-xs font-mono border-gray-200 focus-within:border-primary font-bold ${
                                                        priceWarning ? 'border-amber-400 bg-amber-50/50' : ''
                                                    }`}
                                                    inputClassName="text-xs text-right font-mono font-bold text-primary"
                                                    suffixClassName="text-xs font-mono text-primary/45 font-bold"
                                                    placeholder="0"
                                                    value={row.sellingPrice}
                                                    onChange={(e) => updateRow(row.id, 'sellingPrice', e.target.value)}
                                                    onBlur={(e) => {
                                                        const num = Number(e.target.value)
                                                        if (num > 0 && num < 1000) updateRow(row.id, 'sellingPrice', num * 1000)
                                                    }}
                                                />
                                                {priceWarning && (
                                                    <div className="text-[9px] text-right font-bold text-amber-600 flex items-center justify-end gap-0.5 mt-0.5">
                                                        <AlertTriangle className="w-2.5 h-2.5" /> {'< Giá vốn'}
                                                    </div>
                                                )}
                                                {Number(row.sellingPrice) > 0 && !priceWarning && (
                                                    <div className="text-[9px] text-right font-bold text-primary">
                                                        = {formatMoney(Number(row.sellingPrice) < 1000 ? Number(row.sellingPrice) * 1000 : Number(row.sellingPrice))}đ
                                                    </div>
                                                )}
                                            </td>

                                            {/* 8. Số lượng nhập */}
                                            <td className="py-2.5 px-3">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="input w-full h-9 text-xs text-center font-bold border-gray-200 focus:border-primary"
                                                    value={row.qty}
                                                    onChange={(e) => updateRow(row.id, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                                                    onFocus={(e) => e.target.select()}
                                                    onClick={(e) => e.target.select()}
                                                />
                                            </td>

                                            {/* 9. Thành tiền */}
                                            <td className="py-2.5 px-3 text-right font-black text-gray-800 font-mono text-sm">
                                                {formatMoney(amount)}đ
                                            </td>

                                            {/* 10. Thao tác */}
                                            <td className="py-2.5 px-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveRow(row.id)}
                                                    className="w-8 h-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition flex items-center justify-center mx-auto"
                                                    title="Xóa dòng"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Add Row Button under table */}
                    <div className="p-3 bg-gray-50 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleAddRow}
                            className="btn bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs md:text-sm font-bold h-9 px-4 rounded-xl flex items-center gap-2 shadow-xs"
                        >
                            <Plus className="w-4 h-4 text-primary" /> Thêm dòng mới
                        </button>
                    </div>
                </div>
            </div>

            {/* STICKY FOOTER SUMMARY BAR */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 z-30 shadow-2xl">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-4 text-xs sm:text-sm font-bold w-full sm:w-auto justify-between sm:justify-start">
                        <div>
                            <span className="text-gray-400 font-medium">Sản phẩm:</span>{' '}
                            <span className="text-gray-900 font-black">{validRows.length} mặt hàng</span>
                        </div>
                        <div>
                            <span className="text-gray-400 font-medium">Tổng SL:</span>{' '}
                            <span className="text-gray-900 font-black">{totalQty}</span>
                        </div>
                        <div>
                            <span className="text-gray-400 font-medium">Thành tiền:</span>{' '}
                            <span className="text-primary font-black text-base sm:text-lg">{formatMoney(totalCostAmount)} đ</span>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={handleTransferToPriceTags}
                            className="btn bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-bold h-11 px-4 rounded-xl flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
                        >
                            <Tag className="w-4 h-4" /> In Tem Giá
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmitImport}
                            disabled={loading || validRows.length === 0}
                            className="btn-primary h-11 px-6 text-xs sm:text-sm font-bold rounded-xl shadow-lg disabled:opacity-50 flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
                        >
                            {loading ? 'Đang nhập kho...' : <><Check className="w-4.5 h-4.5" /> Hoàn Tất Nhập Kho</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Quick Paste from Excel / Google Sheet */}
            {showPasteModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-5 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h3 className="font-black text-gray-800 text-lg uppercase tracking-tight flex items-center gap-2">
                                <ClipboardText className="w-5 h-5 text-primary" /> Dán Dữ Liệu Từ Excel / Sheet
                            </h3>
                            <button onClick={() => setShowPasteModal(false)} className="text-gray-400 hover:text-red-500 text-xl font-bold">✕</button>
                        </div>

                        <p className="text-xs text-gray-500">
                            Copy các cột từ file Excel/Google Sheet theo thứ tự: <br />
                            <code className="bg-gray-100 px-2 py-0.5 rounded font-mono text-primary font-bold">Mã vạch [TAB] Tên sản phẩm [TAB] Số lượng [TAB] Giá vốn [TAB] Giá bán [TAB] ĐVT</code>
                        </p>

                        <textarea
                            className="input w-full min-h-[220px] font-mono text-xs p-3 leading-relaxed"
                            placeholder={"8938505962022\tBim bim Oishi\t5\t12000\t15000\tGói\n8931234567890\tNước ngọt lon\t12\t9000\t12000\tChai"}
                            value={pasteRawText}
                            onChange={(e) => setPasteRawText(e.target.value)}
                        />

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowPasteModal(false)}
                                className="btn bg-gray-100 text-gray-600 font-bold px-4 h-10 rounded-xl"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleParsePastedSheet}
                                className="btn-primary font-bold px-5 h-10 rounded-xl"
                            >
                                Nạp vào bảng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
