import { useRef } from 'react'
import { formatReceiptCode, getShortCode } from '../lib/codeFormatter'

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

    const shopName = "CỬA HÀNG POS"
    const shopAddress = "Đà Nẵng, Việt Nam"

    const handlePrint = () => {
        window.print()
    }

    const handleShare = async () => {
        const itemsText = sale.items?.map(item =>
            `- ${item.product_name} x${item.quantity}: ${formatPrice(item.price * item.quantity)}đ`
        ).join('\n')

        const text = `
🧾 HÓA ĐƠN BÁN LẺ - ${shopName}
Mã: ${formatReceiptCode(sale.code) || '---'}
Ngày: ${formatDate(sale.created_at || sale.sale_date)}
---------------------------
${itemsText}
---------------------------
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

    if (!sale) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay - Hide on print */}
            <div
                className="absolute inset-0 bg-black/50 no-print"
                onClick={onClose}
            ></div>

            {/* Modal Content - Shows on Screen & Print */}
            <div className="bg-white w-full max-w-sm mx-4 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up relative z-10">

                {/* Close Button - Hide on print */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 no-print"
                >
                    ✕
                </button>

                {/* Receipt Content (Thermal 80mm style) */}
                <div ref={printRef} className="p-6 text-sm text-gray-800 font-mono leading-relaxed">
                    <div className="text-center mb-4">
                        <h2 className="text-xl font-bold uppercase">{shopName}</h2>
                        <p className="text-xs text-gray-500">{shopAddress}</p>
                        <hr className="my-2 border-dashed border-gray-300" />
                        <p className="text-xs">PHIẾU THANH TOÁN</p>
                        <p className="text-xs font-bold">#{formatReceiptCode(sale.code) || 'UNKNOWN'}</p>
                        <p className="text-[10px] text-gray-500">{formatDate(sale.created_at || sale.sale_date)}</p>
                    </div>

                    {/* Items */}
                    <table className="w-full text-left border-collapse mb-4">
                        <thead>
                            <tr className="border-b border-gray-300 text-xs text-gray-500">
                                <th className="py-1">SL</th>
                                <th className="py-1">Món</th>
                                <th className="py-1 text-right">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.items?.map((item, idx) => (
                                <tr key={idx} className="border-b border-dashed border-gray-200">
                                    <td className="py-2 w-8 align-top font-bold">{item.quantity}</td>
                                    <td className="py-2 align-top">
                                        <div>{item.product_name}</div>
                                        {item.quantity > 1 && (
                                            <div className="text-[10px] text-gray-500">
                                                x {formatPrice(item.price)}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-2 text-right align-top font-bold">
                                        {formatPrice(item.price * item.quantity)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-between items-center text-base font-bold border-t border-gray-800 pt-2 mt-2">
                        <span>TỔNG CỘNG</span>
                        <span>{formatPrice(sale.total_amount)}</span>
                    </div>
                    {sale.payment_method && (
                        <div className="flex justify-between items-center text-xs mt-1 text-gray-600">
                            <span>Hình thức:</span>
                            <span className="uppercase">{sale.payment_method === 'cash' ? 'Tiền mặt' : sale.payment_method}</span>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="text-center mt-6 text-[10px] text-gray-400">
                        <p>Cảm ơn quý khách & Hẹn gặp lại!</p>
                        <p>Powered by OpenPOS</p>
                    </div>
                </div>

                {/* Action Buttons - Hide on print */}
                <div className="p-4 bg-gray-50 border-t flex gap-2 no-print">
                    <button
                        onClick={handlePrint}
                        className="flex-1 btn-primary text-xs py-2 h-10 px-0"
                    >
                        🖨️ In
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex-1 btn bg-green-500 text-white hover:bg-green-600 text-xs py-2 h-10 px-0 shadow-sm"
                    >
                        🔗 Chia sẻ
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 btn bg-white border border-gray-200 text-xs py-2 h-10 px-0 text-gray-600"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    )
}
