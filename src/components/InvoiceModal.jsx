import { useState, useRef, useEffect, useCallback } from 'react'
import { formatReceiptCode, getShortCode } from '../lib/codeFormatter'
import { Printer, Share2, CheckCircle2, AlertCircle, Loader2, Monitor } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

export default function InvoiceModal({ sale, onClose }) {
    const { shop } = useAuth()
    const printRef = useRef(null)

    const [isPrinting, setIsPrinting] = useState(false)
    const [printStatus, setPrintStatus] = useState(null) // 'success' | 'error' | null
    const [printError, setPrintError] = useState('')
    const [autoPrintEnabled, setAutoPrintEnabled] = useState(() => {
        try {
            return localStorage.getItem('pos_auto_print') === 'true'
        } catch (e) {
            return false
        }
    })

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price)
    const formatDate = (dateStr) => {
        try {
            return new Date(dateStr).toLocaleString('vi-VN')
        } catch (e) {
            return dateStr
        }
    }

    const shopName = shop?.name || "VĂN PHÒNG PHẨM 302"
    const shopAddress = shop?.address || "302 Vườn Lài, Phường An Phú Đông, TP.HCM"
    const shopPhone = shop?.phone || "0932843329 (Nga)"

    const totalQuantity = sale?.items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || 0

    // Print to server-connected physical printer POS-80C
    const handleServerPrint = useCallback(async () => {
        if (!sale || isPrinting) return

        setIsPrinting(true)
        setPrintStatus(null)
        setPrintError('')

        try {
            const payload = {
                sale,
                shop: {
                    name: shopName,
                    address: shopAddress,
                    phone: shopPhone
                },
                printerName: 'POS-80C'
            }

            const res = await api.post('/print/receipt', payload)
            if (res.data?.success) {
                setPrintStatus('success')
                setTimeout(() => {
                    setPrintStatus(null)
                }, 4000)
            } else {
                setPrintStatus('error')
                setPrintError(res.data?.message || 'Không thể in bill.')
            }
        } catch (err) {
            console.error('Server print error:', err)
            setPrintStatus('error')
            const errMsg = err.response?.data?.error || err.message || 'Lỗi gửi lệnh in tới server.'
            setPrintError(errMsg)
        } finally {
            setIsPrinting(false)
        }
    }, [sale, isPrinting, shopName, shopAddress, shopPhone])

    // Auto-print on mount if enabled
    useEffect(() => {
        if (!sale) return
        const shouldAuto = localStorage.getItem('pos_auto_print') === 'true'
        if (shouldAuto) {
            handleServerPrint()
        }
    }, [])

    const toggleAutoPrint = (e) => {
        const val = e.target.checked
        setAutoPrintEnabled(val)
        try {
            localStorage.setItem('pos_auto_print', val ? 'true' : 'false')
        } catch (err) {
            console.error('Failed to save auto print setting', err)
        }
    }

    // Local Browser / AirPrint fallback
    const handleLocalPrint = () => {
        if (!printRef.current) return

        const receiptHTML = printRef.current.innerHTML

        const printWindow = window.open('', '_blank', 'width=400,height=600')
        if (!printWindow) {
            window.print()
            return
        }

        printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Hóa đơn</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11pt;
      line-height: 1.3;
      color: #000 !important;
      font-weight: 700 !important;
      background: white;
      width: 80mm;
      padding: 3mm 2mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: bold; }
    .font-black { font-weight: 900; }
    .font-medium { font-weight: 700; }
    .text-base { font-size: 13pt; }
    .text-xs { font-size: 9.5pt; }
    .text-sm { font-size: 10.5pt; }
    .uppercase { text-transform: uppercase; }
    .tracking-wide { letter-spacing: 0.05em; }
    .leading-tight { line-height: 1.2; }
    .mb-1 { margin-bottom: 3px; }
    .mb-3 { margin-bottom: 6px; }
    .mt-0\\.5 { margin-top: 2px; }
    .mt-1 { margin-top: 3px; }
    .mt-2 { margin-top: 6px; }
    .mt-6 { margin-top: 18px; }
    .my-2 { margin-top: 4px; margin-bottom: 4px; }
    .pt-2 { padding-top: 6px; }
    .py-1 { padding-top: 3px; padding-bottom: 3px; }
    .pr-1 { padding-right: 3px; }
    .text-gray-600, .text-gray-500, .text-gray-400, .text-gray-800, .text-gray-700 { color: #000 !important; font-weight: 700 !important; }
    .border-dashed { border-style: dashed; }
    .border-gray-300, .border-gray-400, .border-gray-200, .border-gray-800 { border-color: #000 !important; }
    .border-b { border-bottom-width: 1px; border-bottom-style: solid; }
    .border-b-2 { border-bottom-width: 2px; border-bottom-style: solid; }
    .border-t { border-top-width: 1.5px; border-top-style: solid; }
    .border-t-2 { border-top-width: 2px; border-top-style: solid; }
    .border-collapse { border-collapse: collapse; }
    .w-full { width: 100%; }
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    .items-center { align-items: center; }
    .text-\\[11px\\] { font-size: 9pt; }
    .text-\\[10px\\] { font-size: 8pt; }
    .text-\\[10\\.5px\\] { font-size: 8.5pt; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
    th, td { padding: 2px 3px; vertical-align: top; }
    hr { border: none; border-top: 1px dashed #555; margin: 4px 0; }
    .no-print, button { display: none !important; }
    .break-words { word-wrap: break-word; }
    .font-mono { font-family: 'Courier New', Courier, monospace; }
    .align-top { vertical-align: top; }
    .w-7 { width: 22px; }
    .w-8 { width: 26px; }
    .w-9 { width: 28px; }
    .w-10 { width: 32px; }
    .w-12 { width: 36px; }
    .w-14 { width: 44px; }
    .w-16 { width: 52px; }
  </style>
</head>
<body>${receiptHTML}</body>
</html>`)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
            printWindow.print()
            printWindow.close()
        }, 300)
    }

    const handleShare = async () => {
        const itemsText = sale.items?.map((item, idx) =>
            `${idx + 1}. ${item.product_name || item.name} (${item.unit || item.dvt || 'Cái'}) x${item.quantity} @${formatPrice(item.price)} = ${formatPrice(item.price * item.quantity)}đ`
        ).join('\n')

        const text = `
HÓA ĐƠN BÁN LẺ - ${shopName}
ĐC: ${shopAddress}
SĐT: ${shopPhone}
Mã: ${formatReceiptCode(sale.code) || '---'}
Ngày: ${formatDate(sale.created_at || sale.sale_date)}
---------------------------
${itemsText}
---------------------------
Tổng số lượng: ${totalQuantity}
TỔNG CỘNG: ${formatPrice(sale.total_amount)}đ
Hình thức: ${sale.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}

Cảm ơn quý khách!
        `.trim()

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Hóa đơn ${sale.code}`,
                    text: text
                })
            } catch (err) {
                console.error("Error sharing:", err)
            }
        } else {
            try {
                await navigator.clipboard.writeText(text)
                alert("Đã sao chép nội dung hóa đơn vào bộ nhớ tạm!")
            } catch (err) {
                alert("Không thể chia sẻ hoặc sao chép hóa đơn.")
            }
        }
    }

    useEffect(() => {
        if (!sale) return
        const handleKeyDown = (e) => {
            if (e.key === 'Enter' || e.key === '1' || e.code === 'Numpad1') {
                e.preventDefault()
                handleServerPrint()
            } else if (e.key === '2' || e.code === 'Numpad2') {
                e.preventDefault()
                handleShare()
            } else if (e.key === 'Escape' || e.key === '3' || e.code === 'Numpad3') {
                e.preventDefault()
                onClose()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [sale, onClose, handleServerPrint])

    if (!sale) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 no-print"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up relative z-10 flex flex-col max-h-[92vh]">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-2.5 right-2.5 p-2 text-gray-400 hover:text-red-500 no-print font-bold text-lg z-20 rounded-full hover:bg-slate-100 transition-colors"
                    title="Đóng (Esc)"
                >
                    ✕
                </button>

                {/* Status Notice / Feedback Banner */}
                {printStatus === 'success' && (
                    <div className="no-print bg-emerald-500 text-white px-3 py-2 text-xs font-bold flex items-center gap-2 justify-center shadow-inner animate-fade-in">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Đã in ra máy POS-80C tại quán thành công!</span>
                    </div>
                )}
                {printStatus === 'error' && (
                    <div className="no-print bg-rose-500 text-white px-3 py-2 text-xs font-semibold flex items-center gap-2 justify-center shadow-inner animate-fade-in">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="truncate">Lỗi in: {printError}</span>
                    </div>
                )}

                {/* Receipt Content (Thermal 80mm preview) */}
                <div ref={printRef} className="printable-receipt p-4 text-xs text-black font-mono leading-relaxed font-bold overflow-y-auto flex-1 select-text">
                    <div className="text-center mb-3">
                        <h2 className="text-base font-black uppercase leading-tight text-black">{shopName}</h2>
                        <p className="text-[11px] text-black font-semibold mt-0.5">{shopAddress}</p>
                        <p className="text-[11px] text-black font-bold mt-0.5">SĐT: {shopPhone}</p>
                        <hr className="my-2 border-dashed border-black" />
                        <p className="text-xs font-black tracking-wide text-black">PHIẾU THANH TOÁN</p>
                        <p className="text-xs font-black text-black">#{formatReceiptCode(sale.code) || 'UNKNOWN'}</p>
                        <p className="text-[10px] text-black font-semibold">{formatDate(sale.created_at || sale.sale_date)}</p>
                    </div>

                    {/* Items Table */}
                    <table className="w-full text-left border-collapse mb-3 text-[10.5px]">
                        <thead>
                            <tr className="border-b-2 border-black text-[10px] text-black font-black uppercase">
                                <th className="py-1 pr-1">Tên sản phẩm</th>
                                <th className="py-1 pr-1 text-center w-10">ĐVT</th>
                                <th className="py-1 pr-1 text-center w-8">SL</th>
                                <th className="py-1 pr-1 text-right w-14">Đơn giá</th>
                                <th className="py-1 text-right w-16">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.items?.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="py-1 pr-1 align-top break-words">
                                        <div className="font-bold text-black">{item.product_name || item.name}</div>
                                    </td>
                                    <td className="py-1 pr-1 text-center align-top text-black font-semibold">{item.unit || item.dvt || 'Cái'}</td>
                                    <td className="py-1 pr-1 text-center align-top font-black text-black">{item.quantity}</td>
                                    <td className="py-1 pr-1 text-right align-top text-black font-semibold">{formatPrice(item.price)}</td>
                                    <td className="py-1 text-right align-top font-black text-black">
                                        {formatPrice(item.price * item.quantity)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="border-t-2 border-black pt-2 mt-2">
                        <div className="flex justify-between items-center text-xs font-bold text-black mb-1">
                            <span>Tổng số lượng:</span>
                            <span className="text-sm font-black">{totalQuantity}</span>
                        </div>
                        <div className="flex justify-between items-center text-base font-black text-black">
                            <span>TỔNG CỘNG</span>
                            <span>{formatPrice(sale.total_amount)} đ</span>
                        </div>
                    </div>
                    {sale.payment_method && (
                        <div className="flex justify-between items-center text-xs mt-1 text-black font-semibold">
                            <span>Hình thức:</span>
                            <span className="uppercase font-bold">{sale.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</span>
                        </div>
                    )}
                    {sale.cash_given > 0 && sale.payment_method === 'cash' && (
                        <>
                            <div className="flex justify-between items-center text-xs mt-0.5 text-black font-semibold">
                                <span>Tiền khách đưa:</span>
                                <span>{formatPrice(sale.cash_given)} đ</span>
                            </div>
                            <div className="flex justify-between items-center text-xs mt-0.5 text-black font-bold">
                                <span>Tiền thừa trả khách:</span>
                                <span>{formatPrice(sale.change_amount || 0)} đ</span>
                            </div>
                        </>
                    )}

                    {/* Footer */}
                    <div className="text-center mt-6 text-[10px] text-black font-bold">
                        <p>Cảm ơn quý khách & Hẹn gặp lại!</p>
                        <p>Powered by PosWebFree</p>
                    </div>
                </div>

                {/* Auto-print toggle & Action Buttons */}
                <div className="p-3 bg-slate-50 border-t space-y-2.5 no-print shrink-0">
                    {/* Auto-print checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-600 font-semibold px-1">
                        <input
                            type="checkbox"
                            checked={autoPrintEnabled}
                            onChange={toggleAutoPrint}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                        />
                        <span>Tự động in bill máy quán khi thanh toán xong</span>
                    </label>

                    {/* Primary Server Print Button */}
                    <button
                        type="button"
                        onClick={handleServerPrint}
                        disabled={isPrinting}
                        className={`w-full py-2.5 px-3 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all ${
                            isPrinting
                                ? 'bg-emerald-400 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]'
                        }`}
                    >
                        {isPrinting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Đang gửi lệnh in tới máy quán...</span>
                            </>
                        ) : printStatus === 'success' ? (
                            <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                                <span>Đã in xong! Bấm để in lại</span>
                            </>
                        ) : (
                            <>
                                <Printer className="w-4 h-4" />
                                <span>In máy in quán (POS-80C)</span>
                            </>
                        )}
                    </button>

                    {/* Secondary Actions: Local Browser Print, Share, Close */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleLocalPrint}
                            className="flex-1 py-2 px-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                            title="Mở hộp thoại in trình duyệt / AirPrint nếu cần"
                        >
                            <Monitor className="w-3.5 h-3.5 text-slate-500" />
                            <span>In tại chỗ</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleShare}
                            className="flex-1 py-2 px-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                            <Share2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Chia sẻ</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 px-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
                        >
                            Đóng
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}
