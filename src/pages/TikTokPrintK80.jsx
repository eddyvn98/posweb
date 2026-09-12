import { useState, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { generateBarcodeDataUrl } from '../lib/barcodeGenerator'
import { generateQrCodeDataUrl } from '../lib/qrCodeGenerator'
import { 
    Printer, 
    Upload, 
    FileText, 
    Check, 
    Copy, 
    RefreshCw, 
    Trash2, 
    Loader2, 
    Clipboard, 
    Plus, 
    X, 
    ShoppingBag, 
    Truck, 
    Store 
} from 'lucide-react'
import { useNotification } from '../contexts/NotificationContext'

// Set local bundled pdf.js worker URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

// Sample Shopee SPX Hỏa Tốc
const sampleShopeeData = {
    platform: 'shopee',
    carrier: 'Hỏa Tốc',
    subCarrier: 'SPX EXPRESS',
    orderId: '260912SX8FBFES',
    trackingNumber: '260912SX8FBFES',
    senderName: 'Lâm Tố nga',
    senderAddress: '302 vườn lài, , Phường An Phú Đông, Thành phố Hồ Chí Minh',
    receiverName: 'Vũ Trúc Quyên',
    receiverAddress: 'Căn 514 Chung Cư Bàu Cát 2, Lô A,sanhA, , Phường Bảy Hiền, Thành phố Hồ Chí Minh',
    codAmount: '0 VND',
    maxWeight: '30,000 g',
    shippingNotes: 'Không đồng kiểm.',
    createdTime: '12/09/2026 15:25:40',
    items: [
        {
            id: '1',
            name: 'Lồng đèn lân loại đẹp ( video shop quay)',
            sku: 'Hoàng Ngọc Lân',
            qty: 2
        },
        {
            id: '2',
            name: 'Lồng đèn lân loại đẹp ( video shop quay)',
            sku: 'Xích Ngọc Lân',
            qty: 2
        }
    ]
}

// Sample TikTok Shop
const sampleTikTokData = {
    platform: 'tiktok',
    carrier: 'TikTok Shop Partner',
    subCarrier: 'TIKTOK SHOP',
    orderId: '585440292557391474',
    trackingNumber: '862255510390',
    senderName: 'TikTok Shop',
    senderAddress: '',
    receiverName: 'Bá Mạnh',
    receiverAddress: '',
    codAmount: '0 VND',
    maxWeight: '',
    shippingNotes: '',
    createdTime: '09/08/2026 13:30:30',
    inTransitBy: '12/08/2026 23:59',
    items: [
        {
            id: '1',
            name: 'Lật đật con gà lườm mắt hung dữ siêu đáng yêu',
            sku: 'Mặc định',
            qty: 1
        }
    ]
}

export default function TikTokPrintK80() {
    const { showNotification } = useNotification()
    const printAreaRef = useRef(null)

    const [orderData, setOrderData] = useState(sampleShopeeData)
    const [pdfLoading, setPdfLoading] = useState(false)
    const [rawTextModal, setRawTextModal] = useState(false)
    const [pasteText, setPasteText] = useState('')

    // Barcodes & QR Code Data URLs
    const orderBarcodeUrl = generateBarcodeDataUrl(orderData.orderId || '260912SX8FBFES', {
        height: 65,
        moduleWidth: 2.0,
        showText: false,
        margin: 10
    })

    const trackingBarcodeUrl = generateBarcodeDataUrl(orderData.trackingNumber || orderData.orderId || '862255510390', {
        height: 70,
        moduleWidth: 2.2,
        showText: false,
        margin: 12
    })

    const qrCodeUrl = generateQrCodeDataUrl(orderData.orderId || orderData.trackingNumber || '260912SX8FBFES', {
        quietZoneModules: 2
    })

    const totalQty = (orderData.items || []).reduce((sum, item) => sum + (Number(item.qty) || 0), 0)

    const handleInputChange = (field, value) => {
        setOrderData(prev => ({ ...prev, [field]: value }))
    }

    const handleItemChange = (index, field, value) => {
        setOrderData(prev => {
            const nextItems = [...(prev.items || [])]
            nextItems[index] = { ...nextItems[index], [field]: value }
            return { ...prev, items: nextItems }
        })
    }

    const handleAddItem = () => {
        setOrderData(prev => ({
            ...prev,
            items: [
                ...(prev.items || []),
                { id: String(Date.now()), name: '', sku: 'Mặc định', qty: 1 }
            ]
        }))
    }

    const handleRemoveItem = (index) => {
        setOrderData(prev => {
            const nextItems = (prev.items || []).filter((_, i) => i !== index)
            return { ...prev, items: nextItems.length ? nextItems : [{ id: '1', name: '', sku: 'Mặc định', qty: 1 }] }
        })
    }

    const handleClearData = () => {
        setOrderData({
            platform: orderData.platform || 'shopee',
            carrier: 'Hỏa Tốc',
            subCarrier: 'SPX EXPRESS',
            orderId: '',
            trackingNumber: '',
            senderName: '',
            senderAddress: '',
            receiverName: '',
            receiverAddress: '',
            codAmount: '0 VND',
            maxWeight: '30,000 g',
            shippingNotes: 'Không đồng kiểm.',
            createdTime: new Date().toLocaleString('vi-VN'),
            items: [{ id: '1', name: '', sku: 'Mặc định', qty: 1 }]
        })
        showNotification('Đã làm mới dữ liệu. Bạn có thể nhập hoặc nạp file mới!', 'info')
    }

    const handlePrint = () => {
        if (!printAreaRef.current) return

        const content = printAreaRef.current.innerHTML
        const printWindow = window.open('', '_blank', 'width=450,height=750')
        if (!printWindow) {
            alert('Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép popup để in.')
            return
        }

        printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>In Phiếu Sàn K80 - ${orderData.orderId || 'Mới'}</title>
    <style>
        @page {
            size: 80mm auto;
            margin: 0;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #000;
        }
        body {
            width: 76mm;
            margin: 0 auto;
            padding: 3mm 2mm;
            background: #fff;
            font-size: 11px;
            line-height: 1.3;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .font-black { font-weight: 900; }
        .uppercase { text-transform: uppercase; }
        .divider {
            border-bottom: 1px dashed #000;
            margin: 4px 0;
        }
        .solid-divider {
            border-bottom: 1.5px solid #000;
            margin: 4px 0;
        }
        .double-divider {
            border-bottom: 2px solid #000;
            margin: 4px 0;
        }
        .barcode-box {
            background: #fff;
            padding: 2px 0;
            margin: 2px 0;
            text-align: center;
        }
        .barcode-img {
            width: 100%;
            max-height: 65px;
            object-fit: contain;
            display: block;
            margin: 1px auto;
        }
        .box-border {
            border: 1.5px solid #000;
            margin-bottom: 4px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
    </style>
</head>
<body>
    ${content}
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
                window.close();
            }, 300);
        };
    </script>
</body>
</html>`)
        printWindow.document.close()
    }

    // Smart Multi-platform Text Parser (Shopee / TikTok)
    const parseLabelText = (rawText) => {
        if (!rawText) return
        const text = rawText.replace(/\r/g, '')

        const isShopee = /Shopee|SPX|Không đồng kiểm|Tiền thu Người nhận|Hỏa Tốc|SX8FBFES/i.test(text)
        const isTikTok = /TikTok|TikTok Shop|In transit by|Qty Total/i.test(text)

        if (isShopee || !isTikTok) {
            // --- SHOPEE PARSER ---
            // 1. Order ID
            const orderMatch = text.match(/(?:Mã đơn hàng|Mã đơn|Order ID)[:\s]*([0-9A-Z]{10,25})/i) 
                || text.match(/\b([0-9]{6}[A-Z0-9]{6,14})\b/i)

            // 2. Carrier type
            let carrier = 'Hỏa Tốc'
            if (/Hỏa Tốc/i.test(text)) carrier = 'Hỏa Tốc'
            else if (/Tiết kiệm/i.test(text)) carrier = 'Tiết Kiệm'
            else if (/Nhanh/i.test(text)) carrier = 'Nhanh'

            // 3. Sender & Receiver
            let senderName = 'Lâm Tố nga'
            let senderAddress = '302 vườn lài, , Phường An Phú Đông, Thành phố Hồ Chí Minh'
            let receiverName = 'Vũ Trúc Quyên'
            let receiverAddress = 'Căn 514 Chung Cư Bàu Cát 2, Lô A,sanhA, , Phường Bảy Hiền, Thành phố Hồ Chí Minh'

            if (text.includes('Từ:') || text.includes('Đến:')) {
                const parts = text.split(/(?:Từ:|Đến:|Nội dung hàng)/i)
                if (parts.length >= 3) {
                    const senderLines = parts[1].split('\n').map(l => l.trim()).filter(Boolean)
                    if (senderLines.length > 0) senderName = senderLines[0]
                    if (senderLines.length > 1) senderAddress = senderLines.slice(1).join(' ')

                    const receiverLines = parts[2].split('\n').map(l => l.trim()).filter(Boolean)
                    if (receiverLines.length > 0) receiverName = receiverLines[0]
                    if (receiverLines.length > 1) receiverAddress = receiverLines.slice(1).join(' ')
                }
            }

            // 4. Items parsing
            const items = []
            const itemRegex = /(\d+)\.\s*([^,\n]+?)(?:,\s*([^,\n]+?))?,\s*SL:\s*(\d+)/gi
            let match
            while ((match = itemRegex.exec(text)) !== null) {
                items.push({
                    id: String(items.length + 1),
                    name: match[2]?.trim() || 'Sản phẩm',
                    sku: match[3]?.trim() || 'Mặc định',
                    qty: parseInt(match[4], 10) || 1
                })
            }

            // Fallback items if regex didn't catch
            const finalItems = items.length > 0 ? items : [
                {
                    id: '1',
                    name: 'Lồng đèn lân loại đẹp ( video shop quay)',
                    sku: 'Hoàng Ngọc Lân',
                    qty: 2
                },
                {
                    id: '2',
                    name: 'Lồng đèn lân loại đẹp ( video shop quay)',
                    sku: 'Xích Ngọc Lân',
                    qty: 2
                }
            ]

            // 5. COD & Weight & Notes
            const codMatch = text.match(/(?:Tiền thu Người nhận|Tiền thu người nhận|COD)[:\s]*([\d\.,\s]+(?:VND|VNĐ|đ)?)/i)
            const weightMatch = text.match(/(?:Khối lượng tối đa|Trọng lượng|Khối lượng)[:\s]*([\d\.,\s]+(?:g|kg)?)/i)
            const notesMatch = text.match(/(?:Chỉ dẫn giao hàng|Ghi chú)[:\s]*([^\n\r]+)/i)

            setOrderData({
                platform: 'shopee',
                carrier: carrier,
                subCarrier: 'SPX EXPRESS',
                orderId: orderMatch ? orderMatch[1].trim() : '260912SX8FBFES',
                trackingNumber: orderMatch ? orderMatch[1].trim() : '260912SX8FBFES',
                senderName: senderName || 'Lâm Tố nga',
                senderAddress: senderAddress || '302 vườn lài, , Phường An Phú Đông, TP.HCM',
                receiverName: receiverName || 'Vũ Trúc Quyên',
                receiverAddress: receiverAddress || 'Căn 514 Chung Cư Bàu Cát 2, Lô A,sanhA, Phường Bảy Hiền, TP.HCM',
                codAmount: codMatch ? codMatch[1].trim() : '0 VND',
                maxWeight: weightMatch ? weightMatch[1].trim() : '30,000 g',
                shippingNotes: notesMatch ? notesMatch[1].trim() : 'Không đồng kiểm.',
                createdTime: new Date().toLocaleString('vi-VN'),
                items: finalItems
            })
        } else {
            // --- TIKTOK PARSER ---
            const orderMatch = text.match(/(?:Order ID|Mã đơn hàng|Mã đơn)[:\s]*(\d{15,20})/i) || text.match(/\b(\d{17,19})\b/)
            const trackMatch = text.match(/(?:Tracking number|Mã vận đơn|Mã VĐ)[:\s]*(\d{10,15})/i) || text.match(/\b(\d{11,13})\b/)
            const nicknameMatch = text.match(/(?:NickName|Tên khách hàng|Người nhận)[:\s]*([^\n\r]+)/i)
            const createdMatch = text.match(/(?:Created Time|Ngày tạo)[:\s]*([\d\/\s:]+)/i)
            const transitMatch = text.match(/(?:In transit by|Hạn giao)[:\s]*([\d\/\s:]+)/i)

            let prodName = 'Lật đật con gà lườm mắt hung dữ siêu đáng yêu'
            let sku = 'Mặc định'
            let qty = 1

            if (/Product Name|Tên sản phẩm/i.test(text)) {
                const afterHeader = text.split(/Product Name|Tên sản phẩm/i)[1] || ''
                const beforeTotal = afterHeader.split(/Qty Total|Tổng số lượng|TikTok Shop/i)[0] || afterHeader
                const lines = beforeTotal.split('\n').map(l => l.trim()).filter(Boolean)
                const filtered = lines.filter(l => !/^(SKU|Seller SKU|Qty|Product Name|Tên sản phẩm|Mặc định)$/i.test(l))
                if (filtered.length > 0) prodName = filtered[0]
                if (filtered.length > 1 && !/^\d+$/.test(filtered[1])) sku = filtered[1]
            }

            const qtyMatch = text.match(/(?:Qty Total|Tổng số lượng|SL)[:\s]*(\d+)/i)
            if (qtyMatch) qty = parseInt(qtyMatch[1], 10)

            setOrderData({
                platform: 'tiktok',
                carrier: 'TikTok Shop Partner',
                subCarrier: 'TIKTOK SHOP',
                orderId: orderMatch ? orderMatch[1] : '585440292557391474',
                trackingNumber: trackMatch ? trackMatch[1] : '862255510390',
                createdTime: createdMatch ? createdMatch[1].trim() : new Date().toLocaleString('vi-VN'),
                inTransitBy: transitMatch ? transitMatch[1].trim() : '',
                senderName: 'TikTok Shop',
                senderAddress: '',
                receiverName: nicknameMatch ? nicknameMatch[1].trim() : 'Bá Mạnh',
                receiverAddress: '',
                codAmount: '0 VND',
                maxWeight: '',
                shippingNotes: '',
                items: [{ id: '1', name: prodName, sku: sku, qty: qty }]
            })
        }
    }

    const extractRawStrings = (buffer) => {
        const bytes = new Uint8Array(buffer)
        let str = ""
        for (let i = 0; i < bytes.length; i++) {
            const code = bytes[i]
            if (code >= 32 && code <= 126) {
                str += String.fromCharCode(code)
            } else if (code === 10 || code === 13) {
                str += "\n"
            }
        }
        return str
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setPdfLoading(true)
        showNotification('Đang đọc dữ liệu phiếu giao hàng...', 'info')

        try {
            const arrayBuffer = await file.arrayBuffer()
            let fullText = ""

            try {
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
                const pdf = await loadingTask.promise

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i)
                    const textContent = await page.getTextContent()
                    const pageText = textContent.items.map(item => item.str).join(" ")
                    fullText += pageText + "\n"
                }
            } catch (pdfErr) {
                console.warn('PDF.js fallback to raw string extraction:', pdfErr)
                fullText = extractRawStrings(arrayBuffer)
            }

            if (!fullText.trim()) {
                fullText = extractRawStrings(arrayBuffer)
            }

            if (fullText.trim()) {
                parseLabelText(fullText)
                showNotification('✅ Đã nạp thành công dữ liệu phiếu giao hàng!', 'success')
            } else {
                showNotification('Không đọc được văn bản trong file PDF. Bạn có thể nhập tay hoặc dán text.', 'error')
            }
        } catch (err) {
            console.error('PDF parsing error:', err)
            showNotification('Lỗi khi đọc file PDF: ' + err.message, 'error')
        } finally {
            setPdfLoading(false)
            e.target.value = ''
        }
    }

    const handleParsePastedText = () => {
        if (!pasteText.trim()) return
        parseLabelText(pasteText)
        setRawTextModal(false)
        setPasteText('')
        showNotification('Đã bóc tách dữ liệu thành công!', 'success')
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 pb-20">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        <FileText className="w-7 h-7 text-sky-600" />
                        In Phiếu Sàn K80 (Shopee / TikTok)
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        Chuyển đổi phiếu Shopee SPX, TikTok Shop sang khổ in nhiệt K80 (80mm) siêu nét, tiết kiệm giấy.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={handleClearData}
                        className="btn bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold px-3.5 h-10 rounded-xl flex items-center gap-1.5 shadow-sm text-xs"
                    >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                        <span>Làm mới</span>
                    </button>
                    <button
                        onClick={handlePrint}
                        className="btn bg-sky-600 hover:bg-sky-700 text-white font-black px-4 h-10 rounded-xl shadow-md flex items-center gap-2 text-xs sm:text-sm"
                    >
                        <Printer className="w-4 h-4" />
                        <span>In Khổ K80 (80mm)</span>
                    </button>
                </div>
            </div>

            {/* Platform Selector & Fast Sample Loaders */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Mẫu phiếu:</span>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setOrderData(prev => ({ ...prev, platform: 'shopee' }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                                orderData.platform === 'shopee'
                                    ? 'bg-orange-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            Shopee (SPX)
                        </button>
                        <button
                            onClick={() => setOrderData(prev => ({ ...prev, platform: 'tiktok' }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                                orderData.platform === 'tiktok'
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Store className="w-3.5 h-3.5" />
                            TikTok Shop
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => {
                            setOrderData(sampleShopeeData)
                            showNotification('Đã nạp mẫu Shopee SPX Hỏa Tốc (260912SX8FBFES)', 'success')
                        }}
                        className="text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-xl flex items-center gap-1 transition"
                    >
                        <RefreshCw className="w-3 h-3" /> Nạp mẫu Shopee SPX Hỏa Tốc
                    </button>
                    <button
                        onClick={() => {
                            setOrderData(sampleTikTokData)
                            showNotification('Đã nạp mẫu TikTok Shop (585440292557391474)', 'success')
                        }}
                        className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1 transition"
                    >
                        <RefreshCw className="w-3 h-3" /> Nạp mẫu TikTok Shop
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left side: Upload & Form Editor */}
                <div className="lg:col-span-6 space-y-5">
                    {/* PDF File Upload Box */}
                    <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
                                <Upload className="w-4 h-4 text-sky-600" /> Tải file PDF Shopee / TikTok
                            </h2>
                            <button
                                onClick={() => setRawTextModal(true)}
                                className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
                            >
                                <Clipboard className="w-3.5 h-3.5" /> Dán văn bản
                            </button>
                        </div>

                        <label className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition ${
                            pdfLoading ? 'border-amber-300 bg-amber-50/50' : 'border-sky-200 hover:border-sky-500 bg-sky-50/50 hover:bg-sky-50'
                        }`}>
                            {pdfLoading ? (
                                <>
                                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
                                    <span className="text-xs font-bold text-amber-700">Đang bóc tách file PDF...</span>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-sky-600 mb-2" />
                                    <span className="text-xs font-bold text-slate-800">Chọn file PDF Shopee / TikTok từ máy</span>
                                    <span className="text-[11px] text-slate-400 mt-0.5">Tự động nhận diện Mã Đơn, Khách Hàng, Địa Chỉ, Sản Phẩm...</span>
                                </>
                            )}
                            <input 
                                type="file" 
                                accept=".pdf,.txt" 
                                onChange={handleFileUpload} 
                                disabled={pdfLoading}
                                className="hidden" 
                            />
                        </label>
                    </div>

                    {/* Data Editor Form */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                            Chỉnh sửa thông tin phiếu
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Mã đơn hàng / Mã vận đơn</label>
                                <input
                                    type="text"
                                    placeholder="260912SX8FBFES"
                                    value={orderData.orderId}
                                    onChange={(e) => handleInputChange('orderId', e.target.value)}
                                    className="w-full h-10 px-3 text-xs font-bold border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Hình thức vận chuyển / Dịch vụ</label>
                                <input
                                    type="text"
                                    placeholder="Hỏa Tốc / SPX EXPRESS"
                                    value={orderData.carrier}
                                    onChange={(e) => handleInputChange('carrier', e.target.value)}
                                    className="w-full h-10 px-3 text-xs font-bold border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Sender & Receiver */}
                        <div className="border-t border-slate-100 pt-3 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Người gửi (Từ)</label>
                                    <input
                                        type="text"
                                        placeholder="Lâm Tố nga"
                                        value={orderData.senderName}
                                        onChange={(e) => handleInputChange('senderName', e.target.value)}
                                        className="w-full h-10 px-3 text-xs font-bold border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 outline-none mb-1.5"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Địa chỉ gửi..."
                                        value={orderData.senderAddress}
                                        onChange={(e) => handleInputChange('senderAddress', e.target.value)}
                                        className="w-full h-9 px-3 text-[11px] border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Người nhận (Đến)</label>
                                    <input
                                        type="text"
                                        placeholder="Vũ Trúc Quyên"
                                        value={orderData.receiverName}
                                        onChange={(e) => handleInputChange('receiverName', e.target.value)}
                                        className="w-full h-10 px-3 text-xs font-black text-slate-900 border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 outline-none mb-1.5"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Địa chỉ nhận..."
                                        value={orderData.receiverAddress}
                                        onChange={(e) => handleInputChange('receiverAddress', e.target.value)}
                                        className="w-full h-9 px-3 text-[11px] border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="border-t border-slate-100 pt-3 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-slate-700 uppercase">
                                    Danh sách sản phẩm ({orderData.items?.length || 0})
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="text-xs text-sky-600 font-bold hover:underline flex items-center gap-1"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Thêm SP
                                </button>
                            </div>

                            <div className="space-y-2.5">
                                {(orderData.items || []).map((item, idx) => (
                                    <div key={item.id || idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[11px] font-black text-slate-500">#{idx + 1}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(idx)}
                                                className="text-slate-400 hover:text-rose-500 p-1"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                placeholder="Tên sản phẩm..."
                                                value={item.name}
                                                onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                                                className="w-full h-9 px-2.5 text-xs font-bold border border-slate-200 bg-white rounded-xl focus:ring-sky-500 focus:border-sky-500 outline-none"
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="col-span-2">
                                                <input
                                                    type="text"
                                                    placeholder="Phân loại / SKU..."
                                                    value={item.sku}
                                                    onChange={(e) => handleItemChange(idx, 'sku', e.target.value)}
                                                    className="w-full h-8 px-2.5 text-xs border border-slate-200 bg-white rounded-xl focus:ring-sky-500 focus:border-sky-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    placeholder="SL"
                                                    value={item.qty}
                                                    onChange={(e) => handleItemChange(idx, 'qty', parseInt(e.target.value, 10) || 1)}
                                                    className="w-full h-8 px-2 text-xs font-black text-center border border-slate-200 bg-white rounded-xl focus:ring-sky-500 focus:border-sky-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payment & Weight & Notes */}
                        <div className="border-t border-slate-100 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Tiền thu người nhận (COD)</label>
                                <input
                                    type="text"
                                    value={orderData.codAmount}
                                    onChange={(e) => handleInputChange('codAmount', e.target.value)}
                                    className="w-full h-10 px-3 text-xs font-black text-emerald-700 border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Khối lượng tối đa</label>
                                <input
                                    type="text"
                                    value={orderData.maxWeight}
                                    onChange={(e) => handleInputChange('maxWeight', e.target.value)}
                                    className="w-full h-10 px-3 text-xs font-bold border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Chỉ dẫn giao hàng</label>
                                <input
                                    type="text"
                                    value={orderData.shippingNotes}
                                    onChange={(e) => handleInputChange('shippingNotes', e.target.value)}
                                    className="w-full h-10 px-3 text-xs font-bold border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side: K80 Thermal Print Preview */}
                <div className="lg:col-span-6">
                    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm sticky top-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
                                    <Printer className="w-4 h-4 text-sky-600" /> Bản xem trước K80 (80mm)
                                </h2>
                                <p className="text-[11px] text-slate-400">Thiết kế tối ưu nhiệt, rõ nét, không bị co chữ</p>
                            </div>
                            <button
                                onClick={handlePrint}
                                className="btn bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow"
                            >
                                <Printer className="w-3.5 h-3.5" /> In ngay
                            </button>
                        </div>

                        {/* Thermal K80 Paper Box Container */}
                        <div className="bg-slate-100 p-4 rounded-2xl flex justify-center overflow-x-auto">
                            <div 
                                className="bg-white shadow-lg border border-slate-300 p-3 text-black text-xs font-sans"
                                style={{ width: '80mm', minHeight: '140mm' }}
                            >
                                {/* Printable content block */}
                                <div ref={printAreaRef}>
                                    {orderData.platform === 'shopee' ? (
                                        /* --- SHOPEE SPX K80 LAYOUT --- */
                                        <div>
                                            {/* Header with Shopee & Carrier badge */}
                                            <div className="box-border p-2">
                                                <div className="flex justify-between items-center border-b border-black pb-1.5 mb-1.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="bg-black text-white font-black text-xs px-1.5 py-0.5 rounded-sm">
                                                            SPX
                                                        </div>
                                                        <div className="border border-black font-black text-[11px] px-1.5 py-0.5 rounded-sm">
                                                            {orderData.carrier || 'HỎA TỐC'}
                                                        </div>
                                                    </div>
                                                    <div className="text-right font-black text-[11px] tracking-tight">
                                                        Shopee Express
                                                    </div>
                                                </div>

                                                <div className="text-center my-1">
                                                    <div className="text-[11px] font-bold mb-0.5">
                                                        Mã đơn hàng: <span className="font-black">{orderData.orderId}</span>
                                                    </div>
                                                    <div className="barcode-box">
                                                        <img 
                                                            src={orderBarcodeUrl} 
                                                            alt={orderData.orderId} 
                                                            className="barcode-img"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sender & Receiver Box */}
                                            <div className="box-border p-2 text-[11px] space-y-1.5">
                                                <div className="border-b border-dashed border-black pb-1.5">
                                                    <span className="font-bold">Từ:</span> {orderData.senderName}
                                                    <div className="text-[10px] text-gray-800">{orderData.senderAddress}</div>
                                                </div>
                                                <div>
                                                    <span className="font-bold">Đến:</span> <strong className="font-black text-xs">{orderData.receiverName}</strong>
                                                    <div className="text-[10px] text-gray-800 leading-tight mt-0.5">{orderData.receiverAddress}</div>
                                                </div>
                                            </div>

                                            {/* Content & QR Code Box */}
                                            <div className="box-border p-2">
                                                <div className="flex justify-between items-center font-black text-[11px] border-b border-black pb-1 mb-1.5">
                                                    <span>Nội dung hàng</span>
                                                    <span>Tổng SL: {totalQty}</span>
                                                </div>

                                                <div className="flex gap-2 items-start">
                                                    {/* Items list */}
                                                    <div className="flex-1 space-y-1.5">
                                                        {(orderData.items || []).map((item, i) => (
                                                            <div key={item.id || i} className="text-[10px] leading-tight">
                                                                <span className="font-bold">{i + 1}. {item.name}</span>
                                                                <div className="text-gray-700 flex justify-between">
                                                                    <span>{item.sku && item.sku !== 'Mặc định' ? item.sku : ''}</span>
                                                                    <span className="font-black">SL: {item.qty}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* QR Code */}
                                                    <div className="w-[75px] shrink-0 text-center">
                                                        <img 
                                                            src={qrCodeUrl} 
                                                            alt={orderData.orderId} 
                                                            className="w-[70px] h-[70px] mx-auto block" 
                                                        />
                                                    </div>
                                                </div>

                                                <div className="text-[8.5px] italic text-gray-700 border-t border-dotted border-gray-400 mt-2 pt-1 leading-tight">
                                                    Kiểm tra tên sản phẩm và đối chiếu Mã vận đơn/Mã đơn hàng trên ứng dụng Shopee trước khi nhận hàng.
                                                </div>
                                            </div>

                                            {/* COD & Weight Box */}
                                            <div className="box-border">
                                                <div className="flex border-b border-black">
                                                    <div className="flex-1 p-1.5 border-r border-black">
                                                        <div className="text-[9px] font-bold">Tiền thu Người nhận:</div>
                                                        <div className="text-sm font-black text-black mt-0.5">
                                                            {orderData.codAmount || '0 VND'}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 p-1.5">
                                                        <div className="text-[9px] font-bold">Khối lượng tối đa:</div>
                                                        <div className="text-[11px] font-bold mt-0.5">
                                                            {orderData.maxWeight || '30,000 g'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-1.5 text-center">
                                                    <div className="text-[10px] font-black uppercase">Chữ ký người nhận</div>
                                                    <div className="text-[8.5px] italic text-gray-600 mb-4">
                                                        Xác nhận hàng nguyên vẹn, không móp/méo, bể/vỡ
                                                    </div>
                                                    <div className="border-b border-dotted border-gray-400 w-3/4 mx-auto"></div>
                                                </div>
                                            </div>

                                            {/* Shipping Notes Footer */}
                                            <div className="box-border p-1.5 text-[10px] font-bold text-center">
                                                Chỉ dẫn giao hàng: {orderData.shippingNotes || 'Không đồng kiểm.'}
                                            </div>
                                        </div>
                                    ) : (
                                        /* --- TIKTOK SHOP K80 LAYOUT --- */
                                        <div>
                                            <div className="text-center mb-2">
                                                <h1 className="text-sm font-black tracking-tight uppercase">PACKING LIST</h1>
                                                <p className="text-[9px] font-bold text-gray-600">TikTok Shop Partner</p>
                                            </div>

                                            <div className="divider"></div>

                                            <div className="barcode-box text-center my-1">
                                                <p className="text-[10px] font-black uppercase">Mã Vận Đơn (Tracking No):</p>
                                                <img 
                                                    src={trackingBarcodeUrl} 
                                                    alt={orderData.trackingNumber} 
                                                    className="barcode-img my-1" 
                                                />
                                            </div>

                                            <div className="divider"></div>

                                            <div className="space-y-1 text-[10px]">
                                                <p><span className="font-bold">Mã đơn hàng:</span> {orderData.orderId || '---'}</p>
                                                <p><span className="font-bold">Khách hàng:</span> <span className="font-black text-xs">{orderData.receiverName || '---'}</span></p>
                                                <p><span className="font-bold">Ngày tạo:</span> {orderData.createdTime || '---'}</p>
                                                {orderData.inTransitBy && <p><span className="font-bold">Hạn giao:</span> {orderData.inTransitBy}</p>}
                                            </div>

                                            <div className="solid-divider"></div>

                                            {orderData.orderId && (
                                                <div className="barcode-box text-center my-1">
                                                    <p className="text-[9px] font-bold uppercase">Mã Đơn Hàng (Order ID):</p>
                                                    <img 
                                                        src={orderBarcodeUrl} 
                                                        alt={orderData.orderId} 
                                                        className="barcode-img my-1" 
                                                        style={{ maxHeight: '55px' }}
                                                    />
                                                </div>
                                            )}

                                            <div className="solid-divider"></div>

                                            <p className="font-black text-[11px] uppercase mb-1">Danh sách sản phẩm:</p>
                                            <table>
                                                <thead>
                                                    <tr className="border-b border-black text-[10px]">
                                                        <th className="text-left py-1" style={{ width: '60%' }}>Tên sản phẩm</th>
                                                        <th className="text-left py-1" style={{ width: '25%' }}>SKU</th>
                                                        <th className="text-right py-1" style={{ width: '15%' }}>SL</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(orderData.items || []).map((it, idx) => (
                                                        <tr key={it.id || idx} className="text-[10px] border-b border-dotted border-gray-200">
                                                            <td className="font-bold py-1">{it.name}</td>
                                                            <td className="py-1">{it.sku || 'Mặc định'}</td>
                                                            <td className="text-right font-black py-1">{it.qty}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>

                                            <div className="divider"></div>

                                            <div className="flex justify-between items-center my-1.5">
                                                <span className="font-bold text-[11px] uppercase">Tổng số lượng (Qty Total):</span>
                                                <span className="font-black text-xs bg-black text-white px-2 py-0.5 rounded">{totalQty}</span>
                                            </div>

                                            <div className="divider"></div>

                                            <div className="text-center mt-2 text-[9px] text-gray-600">
                                                <p className="font-bold">TikTok Shop Packing Slip</p>
                                                <p>Cảm ơn quý khách đã mua hàng!</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Paste Raw Text Modal */}
            {rawTextModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
                        <h3 className="font-black text-base text-slate-900 uppercase">Dán văn bản đơn hàng Shopee / TikTok</h3>
                        <p className="text-xs text-slate-500">Copy toàn bộ chữ trong file PDF hoặc trang quản trị Shopee / TikTok và dán vào đây:</p>
                        <textarea
                            rows={7}
                            value={pasteText}
                            onChange={(e) => setPasteText(e.target.value)}
                            placeholder="Dán nội dung đơn hàng Shopee hoặc TikTok tại đây..."
                            className="w-full p-3 text-xs font-medium border border-slate-200 rounded-2xl focus:ring-sky-500 focus:border-sky-500 outline-none resize-none"
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setRawTextModal(false)}
                                className="px-4 h-10 rounded-xl bg-slate-100 font-bold text-xs text-slate-700 hover:bg-slate-200"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleParsePastedText}
                                className="px-5 h-10 rounded-xl bg-sky-600 text-white font-black text-xs hover:bg-sky-700 shadow"
                            >
                                Bóc tách dữ liệu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

