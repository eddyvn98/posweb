import { useRef, useEffect } from 'react'
import { formatReceiptCode, getShortCode } from '../lib/codeFormatter'
import { Printer, Share2 } from 'lucide-react'

export default function InvoiceModal({ sale, onClose }) {
    const printRef = useRef(null)

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price)
    const formatDate = (dateStr) => {
        try {
            return new Date(dateStr).toLocaleString('vi-VN')
        } catch (e) {
            return dateStr
        }
    }

    const shopName = "VĂN PHÒNG PHẨM 302"
    const shopAddress = "302 Vườn Lài, Phường An Phú Đông, TP.HCM"
    const shopPhone = "0932843329 (Nga)"

    const totalQuantity = sale?.items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || 0

    const handlePrint = () => {
        if (!printRef.current) return

        const receiptHTML = printRef.current.innerHTML

        const printWindow = window.open('', '_blank', 'width=400,height=600')
        if (!printWindow) {
            // Fallback if popup blocked
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
    .text-center { text-align: center; }
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
            `${idx + 1}. ${item.product_name} (${item.unit || 'Cái'}) x${item.quantity} @${formatPrice(item.price)} = ${formatPrice(item.price * item.quantity)}đ`
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
                handlePrint()
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
    }, [sale, onClose])

    if (!sale) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            {/* Overlay - Hide on print */}
            <div
                className="absolute inset-0 bg-black/50 no-print"
                onClick={onClose}
            ></div>

            {/* Modal Content - Shows on Screen & Print */}
            <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-fade-in-up relative z-10 flex flex-col max-h-[90vh]">

                {/* Close Button - Hide on print */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 no-print font-bold text-lg z-20"
                    title="Đóng (Esc)"
                >
                    ✕
                </button>

                {/* Receipt Content (Thermal 80mm style) */}
                <div ref={printRef} className="printable-receipt p-4 text-xs text-black font-mono leading-relaxed font-bold overflow-y-auto flex-1">
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
                            <span>{formatPrice(sale.total_amount)}</span>
                        </div>
                    </div>
                    {sale.payment_method && (
                        <div className="flex justify-between items-center text-xs mt-1 text-black font-semibold">
                            <span>Hình thức:</span>
                            <span className="uppercase font-bold">{sale.payment_method === 'cash' ? 'Tiền mặt' : sale.payment_method}</span>
                        </div>
                    )}
                    {sale.cash_given > 0 && sale.payment_method === 'cash' && (
                        <>
                            <div className="flex justify-between items-center text-xs mt-0.5 text-black font-semibold">
                                <span>Tiền khách đưa:</span>
                                <span>{formatPrice(sale.cash_given)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs mt-0.5 text-black font-bold">
                                <span>Tiền thừa trả khách:</span>
                                <span>{formatPrice(sale.change_amount || 0)}</span>
                            </div>
                        </>
                    )}

                    {/* Footer */}
                    <div className="text-center mt-6 text-[10px] text-black font-bold">
                        <p>Cảm ơn quý khách & Hẹn gặp lại!</p>
                        <p>Powered by PosWebFree</p>
                    </div>
                </div>

                {/* Action Buttons - Hide on print */}
                <div className="p-3 sm:p-4 bg-slate-50 border-t flex gap-2 no-print shrink-0">
                    <button
                        onClick={handlePrint}
                        className="flex-1 btn-primary btn-md px-2 sm:px-3 text-xs sm:text-sm"
                    >
                        <Printer className="w-4 h-4" /> In hóa đơn
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex-1 btn-primary btn-md px-2 sm:px-3 text-xs sm:text-sm"
                    >
                        <Share2 className="w-4 h-4" /> Chia sẻ
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 btn-secondary btn-md px-2 sm:px-3 text-xs sm:text-sm"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    )
}
