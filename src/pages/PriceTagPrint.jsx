import { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { generateBarcodeSvg, generateBarcodeDataUrl } from '../lib/barcodeGenerator'
import { generateQrCodeDataUrl } from '../lib/qrCodeGenerator'
import { useNotification } from '../contexts/NotificationContext'
import { matchProduct, sortSearchResults } from '../lib/searchUtils'
import { 
    Tag, 
    Printer, 
    Search, 
    Trash2, 
    Settings, 
    Eye,
    QrCode
} from 'lucide-react'

export default function PriceTagPrint() {
    const location = useLocation()
    const navigate = useNavigate()
    const { showNotification } = useNotification()

    const [items, setItems] = useState([])
    const [storeName, setStoreName] = useState('Văn Phòng Phẩm 302')
    const [showStoreName, setShowStoreName] = useState(true)
    const [showProductName, setShowProductName] = useState(true)
    const [showPrice, setShowPrice] = useState(true)
    const [showBarcodeText, setShowBarcodeText] = useState(true)
    const [labelLayout, setLabelLayout] = useState('2_col') // '3_col' (35x22mm), '2_col' (50x30mm), '1_col' (60x40mm)
    const [barcodeHeight, setBarcodeHeight] = useState(48) // 35, 48, 60px
    const [barcodeWidth, setBarcodeWidth] = useState('85%') // 75%, 85%, 95%
    const [codeType, setCodeType] = useState('qr') // 'barcode' or 'qr'
    const [codeScale, setCodeScale] = useState(35) // 25, 35, 50, 75, 100 (%)
    const [fontScale, setFontScale] = useState(75) // 60, 75, 90, 100 (%)

    // Product search modal state to manually add products
    const [searchQuery, setSearchQuery] = useState('')
    const [allProducts, setAllProducts] = useState([])
    const [isSearching, setIsSearching] = useState(false)

    useEffect(() => {
        // Load passed state or local storage initial data
        if (location.state?.items && Array.isArray(location.state.items)) {
            setItems(location.state.items.map(item => ({
                id: item.id || item.barcode || Math.random().toString(),
                name: item.name || item.product_name || 'Sản phẩm mới',
                barcode: item.barcode || `${Math.floor(Date.now() / 1000)}`,
                price: Number(item.price || item.unitPrice || item.cost_price || 0),
                printQty: Number(item.qty || item.quantity || item.printQty || 1)
            })))
        } else {
            try {
                const saved = localStorage.getItem('posweb_print_items')
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setItems(parsed)
                    }
                }
            } catch (e) {
                console.error('Failed to load print items from storage', e)
            }
        }

        // Fetch products for manual addition search
        api.get('/products').then(res => setAllProducts(res.data || [])).catch(() => {})
    }, [location.state])

    // Save current items to local storage for persistence
    useEffect(() => {
        try {
            localStorage.setItem('posweb_print_items', JSON.stringify(items))
        } catch (e) {
            // ignore
        }
    }, [items])

    const handleQuantityChange = (id, delta) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const next = Math.max(1, item.printQty + delta)
                return { ...item, printQty: next }
            }
            return item
        }))
    }

    const handleSetQuantity = (id, qty) => {
        const val = Math.max(1, parseInt(qty) || 1)
        setItems(prev => prev.map(item => item.id === id ? { ...item, printQty: val } : item))
    }

    const removeItem = (id) => {
        setItems(prev => prev.filter(item => item.id !== id))
    }

    const handleAddProduct = (prod) => {
        setItems(prev => {
            const existing = prev.find(p => p.id === prod.id || p.barcode === prod.barcode)
            if (existing) {
                return prev.map(p => (p.id === prod.id || p.barcode === prod.barcode) ? { ...p, printQty: p.printQty + 1 } : p)
            }
            return [...prev, {
                id: prod.id || prod.barcode,
                name: prod.name,
                barcode: prod.barcode || `${Math.floor(Date.now() / 1000)}`,
                price: Number(prod.price || 0),
                printQty: 1
            }]
        })
        showNotification(`Đã thêm ${prod.name} vào danh sách in`, 'success')
    }

    const searchFilteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return []
        const matched = allProducts.filter(p => matchProduct(p, searchQuery))
        return sortSearchResults(matched, searchQuery).slice(0, 10)
    }, [allProducts, searchQuery])

    // Flatten label list based on printQty for rendering printable items
    const flattenedLabels = useMemo(() => {
        const result = []
        items.forEach(item => {
            for (let i = 0; i < item.printQty; i++) {
                result.push({
                    ...item,
                    copyIndex: i + 1
                })
            }
        })
        return result
    }, [items])

    // Memoize generated code data URLs for unique barcodes to prevent UI thread freezing
    const codeDataUrls = useMemo(() => {
        const map = {}
        const barcodeOpts = {
            height: labelLayout === '3_col' ? Math.min(barcodeHeight, 32) : labelLayout === '2_col' ? Math.min(barcodeHeight, 30) : barcodeHeight,
            moduleWidth: labelLayout === '3_col' ? 1.0 : labelLayout === '2_col' ? 1.0 : 1.8,
            showText: showBarcodeText,
            fontSize: Math.max(5, Math.round(7 * fontScale / 100)),
            quietZoneModules: 14
        }
        const qrOpts = { showText: false, quietZoneModules: 2 }

        items.forEach(item => {
            const code = item.barcode || '00000000'
            if (!map[code]) {
                map[code] = codeType === 'qr'
                    ? generateQrCodeDataUrl(code, qrOpts)
                    : generateBarcodeDataUrl(code, barcodeOpts)
            }
        })
        return map
    }, [items, codeType, labelLayout, barcodeHeight, showBarcodeText, fontScale])

    const totalLabelsCount = useMemo(() => items.reduce((sum, item) => sum + (item.printQty || 0), 0), [items])

    const formatMoney = (val) => new Intl.NumberFormat('vi-VN').format(Number(val || 0)) + 'đ'

    const handlePrint = () => {
        if (flattenedLabels.length === 0) {
            showNotification('Vui lòng chọn ít nhất 1 sản phẩm để in', 'error')
            return
        }
        window.print()
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 pb-24">
            {/* Header - Screen only */}
            <div className="max-w-6xl mx-auto space-y-5 print:hidden">
                <div className="bg-white border rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <Tag className="w-6 h-6 text-primary" /> In Tem Giá Sản Phẩm
                        </h1>
                        <p className="text-xs text-gray-500 font-medium">
                            Tạo và in tem mã vạch dán sản phẩm từ đơn nhập hàng hoặc kho hàng
                        </p>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => navigate('/imports-sheet')}
                            className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 h-11 text-sm font-bold rounded-xl flex-1 sm:flex-initial"
                        >
                            ← Về Nhập sheet
                        </button>
                        <button
                            onClick={handlePrint}
                            disabled={flattenedLabels.length === 0}
                            className="btn-primary h-11 px-6 text-sm font-bold rounded-xl shadow-lg disabled:opacity-50 flex items-center gap-2 flex-1 sm:flex-initial"
                        >
                            <Printer className="w-4 h-4" /> <span>In {totalLabelsCount} tem</span>
                        </button>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Left Panel: Item List & Customization (7 Cols) */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* Search & Add items */}
                        <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-3">
                            <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Thêm sản phẩm từ kho</h2>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="input w-full pl-9"
                                    placeholder="Tìm tên sản phẩm hoặc mã vạch để thêm in tem..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setIsSearching(true)}
                                />
                                <span className="absolute left-3 top-2.5 text-gray-400">
                                    <Search className="w-4 h-4" />
                                </span>

                                {searchQuery && (
                                    <div className="absolute left-0 right-0 top-12 bg-white border rounded-xl shadow-xl z-30 max-h-60 overflow-y-auto divide-y">
                                        {searchFilteredProducts.length === 0 ? (
                                            <div className="p-3 text-sm text-gray-500 text-center">Không tìm thấy sản phẩm</div>
                                        ) : (
                                            searchFilteredProducts.map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => {
                                                        handleAddProduct(p)
                                                        setSearchQuery('')
                                                    }}
                                                    className="p-3 hover:bg-sky-50 cursor-pointer flex justify-between items-center transition"
                                                >
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-800">{p.name}</p>
                                                        <p className="text-xs text-gray-400 font-mono">{p.barcode}</p>
                                                    </div>
                                                    <span className="font-bold text-primary text-sm">{formatMoney(p.price)}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Selected Items Table */}
                        <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-3">
                            <div className="flex justify-between items-center border-b pb-3">
                                <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wider">
                                    Danh sách tem in ({items.length} món - {totalLabelsCount} tem)
                                </h2>
                                {items.length > 0 && (
                                    <button
                                        onClick={() => setItems([])}
                                        className="text-xs text-red-500 hover:underline font-bold"
                                    >
                                        Xóa tất cả
                                    </button>
                                )}
                            </div>

                            {items.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Tag className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm font-bold">Chưa có sản phẩm nào trong danh sách in</p>
                                    <p className="text-xs mt-1">Chuyển dữ liệu từ màn hình Nhập Sheet hoặc tìm kiếm sản phẩm phía trên</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 border-b text-gray-500 font-bold text-xs uppercase">
                                                <th className="py-2 px-2">STT</th>
                                                <th className="py-2 px-2">Sản phẩm</th>
                                                <th className="py-2 px-2 text-right">Giá bán</th>
                                                <th className="py-2 px-2 text-center">Số lượng tem</th>
                                                <th className="py-2 px-2 text-center">Xóa</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {items.map((item, idx) => (
                                                <tr key={item.id} className="hover:bg-gray-50">
                                                    <td className="py-2.5 px-2 text-gray-400 font-bold text-xs">{idx + 1}</td>
                                                    <td className="py-2.5 px-2">
                                                        <p className="font-bold text-gray-800 text-sm leading-tight">{item.name}</p>
                                                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">{item.barcode}</p>
                                                    </td>
                                                    <td className="py-2.5 px-2 text-right font-black text-primary text-sm">
                                                        {formatMoney(item.price)}
                                                    </td>
                                                    <td className="py-2.5 px-2 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={() => handleQuantityChange(item.id, -1)}
                                                                className="w-7 h-7 rounded-lg bg-gray-100 font-bold text-gray-600 hover:bg-gray-200"
                                                            >
                                                                -
                                                            </button>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                className="w-12 h-7 text-center border rounded-lg font-bold text-sm"
                                                                value={item.printQty}
                                                                onChange={(e) => handleSetQuantity(item.id, e.target.value)}
                                                            />
                                                            <button
                                                                onClick={() => handleQuantityChange(item.id, 1)}
                                                                className="w-7 h-7 rounded-lg bg-gray-100 font-bold text-gray-600 hover:bg-gray-200"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-2 text-center">
                                                        <button
                                                            onClick={() => removeItem(item.id)}
                                                            className="text-red-400 hover:text-red-600 text-base"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-500 mx-auto" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Label Customization & Preview (5 Cols) */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-4">
                            <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                                <Settings className="w-4 h-4" /> Cấu hình tem in
                            </h2>

                            {/* Store Name Input */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Tên cửa hàng trên tem</label>
                                <input
                                    type="text"
                                    className="input w-full text-sm"
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                />
                            </div>

                            {/* Code Type Selection: Barcode vs QR Code */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Loại mã in trên tem</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCodeType('barcode')}
                                        className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition ${codeType === 'barcode' ? 'bg-sky-500 text-white border-sky-500 shadow-sm' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                                    >
                                        <Tag className="w-3.5 h-3.5" /> Mã vạch (Barcode 1D)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCodeType('qr')}
                                        className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition ${codeType === 'qr' ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                                    >
                                        <QrCode className="w-3.5 h-3.5" /> Mã QR Code (2D)
                                    </button>
                                </div>
                                {codeType === 'qr' && (
                                    <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded-xl text-[11px] text-purple-800 leading-snug">
                                        💡 <strong>Lưu ý về thiết bị quét:</strong> Mã QR Code (2D) quét bằng Camera Điện thoại (Zalo / Trình duyệt) hoặc <strong>Máy quét 2D chụp ảnh</strong>. Nếu cửa hàng dùng <strong>Máy quét tia laser đỏ 1D đơn tia</strong>, tia laser đỏ không quét được QR Code, bạn hãy chọn <strong>Mã vạch (Barcode 1D)</strong>.
                                    </div>
                                )}
                            </div>

                            {/* Layout Selection */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Kích thước tem / Khổ in</label>
                                <select
                                    className="input w-full text-sm font-semibold"
                                    value={labelLayout}
                                    onChange={(e) => setLabelLayout(e.target.value)}
                                >
                                    <option value="3_col">3 Tem / Hàng (Standard 35x22mm)</option>
                                    <option value="2_col">2 Tem / Hàng (Trung bình 50x30mm)</option>
                                    <option value="1_col">1 Tem / Hàng (Khổ máy in bill K80/K57 / 60x40mm)</option>
                                </select>
                            </div>

                            {/* Code Scale Control */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Kích thước mã (QR / Barcode)</label>
                                <select
                                    className="input w-full text-sm font-semibold bg-purple-50 border-purple-300 text-purple-900"
                                    value={codeScale}
                                    onChange={(e) => setCodeScale(Number(e.target.value))}
                                >
                                    <option value={25}>Cực nhỏ (25% khung - Siêu nhỏ gọn)</option>
                                    <option value={35}>Thu nhỏ 1/4 (35% khung - Khuyên dùng)</option>
                                    <option value={50}>Trung bình (50% khung - Cân đối)</option>
                                    <option value={75}>Lớn (75% khung - Dễ quét)</option>
                                    <option value={100}>Tối đa (100% khung - Phủ kín)</option>
                                </select>
                            </div>

                            {/* Font Scale Control */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Kích thước chữ trên tem</label>
                                <select
                                    className="input w-full text-sm font-semibold bg-sky-50 border-sky-300 text-sky-900"
                                    value={fontScale}
                                    onChange={(e) => setFontScale(Number(e.target.value))}
                                >
                                    <option value={60}>Chữ rất nhỏ (60% - Thu nhỏ 1/4)</option>
                                    <option value={75}>Chữ nhỏ gọn (75% - Khuyên dùng)</option>
                                    <option value={90}>Chữ vừa (90% - Dễ đọc)</option>
                                    <option value={100}>Chữ lớn tiêu chuẩn (100%)</option>
                                </select>
                            </div>

                            {/* Barcode Height Control for Scanner Optimization */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Độ cao vạch mã vạch (Tăng độ nhạy máy quét)</label>
                                <select
                                    className="input w-full text-sm font-semibold"
                                    value={barcodeHeight}
                                    onChange={(e) => setBarcodeHeight(Number(e.target.value))}
                                >
                                    <option value={48}>Tiêu chuẩn (48px - Khuyến nghị cho máy quét)</option>
                                    <option value={60}>Cao (60px - Cực kỳ dễ quét cho máy in bill)</option>
                                    <option value={35}>Thấp (35px - Cho tem cỡ nhỏ)</option>
                                </select>
                            </div>

                            {/* Barcode Width / Quiet Zone Control */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Tỷ lệ chiều rộng mã vạch</label>
                                <select
                                    className="input w-full text-sm font-semibold"
                                    value={barcodeWidth}
                                    onChange={(e) => setBarcodeWidth(e.target.value)}
                                >
                                    <option value="85%">Vừa vặn (85% - Tạo khoảng trống lề chuẩn)</option>
                                    <option value="75%">Gọn hơn (75% - Tăng khoảng trắng 2 bên cho máy in bill)</option>
                                    <option value="95%">Rộng (95% - Phù hợp mã vạch dài)</option>
                                </select>
                            </div>

                            {/* Display Toggles */}
                            <div className="space-y-2 pt-2 border-t text-xs font-medium">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="rounded text-primary focus:ring-primary"
                                        checked={showStoreName}
                                        onChange={(e) => setShowStoreName(e.target.checked)}
                                    />
                                    <span>Hiển thị tên cửa hàng</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="rounded text-primary focus:ring-primary"
                                        checked={showProductName}
                                        onChange={(e) => setShowProductName(e.target.checked)}
                                    />
                                    <span>Hiển thị tên sản phẩm</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="rounded text-primary focus:ring-primary"
                                        checked={showPrice}
                                        onChange={(e) => setShowPrice(e.target.checked)}
                                    />
                                    <span>Hiển thị giá bán</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="rounded text-primary focus:ring-primary"
                                        checked={showBarcodeText}
                                        onChange={(e) => setShowBarcodeText(e.target.checked)}
                                    />
                                    <span>Hiển thị chữ số mã vạch</span>
                                </label>
                            </div>
                        </div>

                        {/* Preview Box */}
                        <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-3">
                            <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wider border-b pb-2 flex justify-between items-center">
                                <span className="flex items-center gap-2"><Eye className="w-4 h-4" /> Xem trước tem</span>
                                <span className="text-xs text-gray-400 lowercase font-normal">({totalLabelsCount} tem)</span>
                            </h2>

                            <div className="bg-gray-100 p-3 rounded-xl max-h-80 overflow-y-auto flex flex-wrap gap-2 justify-center">
                                {flattenedLabels.slice(0, 12).map((lbl, idx) => (
                                    <div
                                        key={`${lbl.id}-${idx}`}
                                        className="bg-white border border-gray-300 p-2 text-center rounded shadow-xs overflow-hidden flex flex-col justify-between"
                                        style={{
                                            width: labelLayout === '3_col' ? '120px' : labelLayout === '2_col' ? '160px' : '220px',
                                            height: labelLayout === '3_col' ? '85px' : labelLayout === '2_col' ? '110px' : '140px',
                                        }}
                                    >
                                        {showStoreName && (
                                            <div 
                                                className="font-black uppercase text-gray-600 truncate border-b pb-0.5"
                                                style={{ fontSize: `${Math.max(6, Math.round(9 * fontScale / 100))}px` }}
                                            >
                                                {storeName}
                                            </div>
                                        )}
                                        {showProductName && (
                                            <div 
                                                className="font-bold leading-tight text-gray-800 truncate my-0.5"
                                                style={{ fontSize: `${Math.max(7, Math.round(10 * fontScale / 100))}px` }}
                                            >
                                                {lbl.name}
                                            </div>
                                        )}
                                        <div className="flex-1 min-h-0 flex flex-col items-center justify-center my-0.5 overflow-hidden">
                                            <img
                                                src={codeDataUrls[lbl.barcode] || ''}
                                                alt={lbl.barcode}
                                                className="object-contain mx-auto block"
                                                style={{
                                                    maxWidth: `${codeScale}%`,
                                                    maxHeight: `${codeScale}%`,
                                                    aspectRatio: codeType === 'qr' ? '1 / 1' : 'auto',
                                                    display: 'block',
                                                    margin: '0 auto',
                                                    imageRendering: 'pixelated'
                                                }}
                                            />
                                            {showBarcodeText && codeType === 'qr' && (
                                                <div 
                                                    className="font-mono text-gray-700 font-bold leading-none tracking-tight mt-0.5"
                                                    style={{ fontSize: `${Math.max(6, Math.round(8 * fontScale / 100))}px` }}
                                                >
                                                    {lbl.barcode}
                                                </div>
                                            )}
                                        </div>
                                        {showPrice && (
                                            <div 
                                                className="font-black text-gray-900 leading-none pt-0.5 border-t"
                                                style={{ fontSize: `${Math.max(8, Math.round(11 * fontScale / 100))}px` }}
                                            >
                                                {formatMoney(lbl.price)}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {flattenedLabels.length > 12 && (
                                    <div className="w-full text-center text-xs text-gray-500 py-1 font-bold">
                                        ...và {flattenedLabels.length - 12} tem khác
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Area - ONLY visible when printing (window.print) */}
            <div className="hidden print:block print:m-0 print:p-0 printable-labels">
                <style>{`
                    @media print {
                        body {
                            background: white !important;
                            color: black !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        nav, header, aside, .print\\:hidden {
                            display: none !important;
                        }
                        @page {
                            margin: 2mm;
                            size: auto;
                        }
                        svg, svg * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .printable-labels img {
                            image-rendering: -webkit-optimize-contrast !important;
                            image-rendering: crisp-edges !important;
                            image-rendering: pixelated !important;
                        }
                    }
                `}</style>
                <div
                    className="grid gap-1"
                    style={{
                        gridTemplateColumns: labelLayout === '3_col' ? 'repeat(3, 1fr)' : labelLayout === '2_col' ? 'repeat(2, 1fr)' : 'repeat(1, 1fr)'
                    }}
                >
                    {flattenedLabels.map((lbl, idx) => (
                        <div
                            key={`print-${lbl.id}-${idx}`}
                            className="p-1 text-center bg-white flex flex-col justify-between overflow-hidden page-break-inside-avoid"
                            style={{
                                height: labelLayout === '3_col' ? '22mm' : labelLayout === '2_col' ? '30mm' : '40mm',
                                width: '100%',
                                boxSizing: 'border-box'
                            }}
                        >
                            {showStoreName && (
                                <div 
                                    className="font-black uppercase tracking-tighter truncate leading-none"
                                    style={{ fontSize: `${(8 * fontScale / 100).toFixed(1)}pt` }}
                                >
                                    {storeName}
                                </div>
                            )}
                            {showProductName && (
                                <div 
                                    className="font-bold truncate leading-tight my-0.5"
                                    style={{ fontSize: `${(8 * fontScale / 100).toFixed(1)}pt` }}
                                >
                                    {lbl.name}
                                </div>
                            )}
                            <div className="flex-1 min-h-0 flex flex-col items-center justify-center overflow-hidden my-0.5">
                                <img
                                    src={codeDataUrls[lbl.barcode] || ''}
                                    alt={lbl.barcode}
                                    className="object-contain mx-auto block"
                                    style={{
                                        maxWidth: `${codeScale}%`,
                                        maxHeight: `${codeScale}%`,
                                        aspectRatio: codeType === 'qr' ? '1 / 1' : 'auto',
                                        display: 'block',
                                        margin: '0 auto',
                                        imageRendering: 'pixelated'
                                    }}
                                />
                                {showBarcodeText && codeType === 'qr' && (
                                    <div 
                                        className="font-mono font-bold leading-none tracking-tight mt-0.5 text-black"
                                        style={{ fontSize: `${(7 * fontScale / 100).toFixed(1)}pt` }}
                                    >
                                        {lbl.barcode}
                                    </div>
                                )}
                            </div>
                            {showPrice && (
                                <div 
                                    className="font-black text-black leading-none pt-0.5"
                                    style={{ fontSize: `${(9 * fontScale / 100).toFixed(1)}pt` }}
                                >
                                    GIÁ: {formatMoney(lbl.price)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
