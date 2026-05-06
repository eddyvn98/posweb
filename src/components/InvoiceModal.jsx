import { useEffect, useMemo, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { formatReceiptCode } from '../lib/codeFormatter'
import { getPrinterSettings, PRINT_PAPER_SIZES } from '../lib/printerSettings'

export default function InvoiceModal({ sale, onClose }) {
    const printRef = useRef(null)
    const { shop } = useAuth()
    const printerSettings = useMemo(() => getPrinterSettings(), [])

    useEffect(() => {
        const paperClass = `printing-paper-${printerSettings.paperSize}`
        document.body.classList.add('printing-receipt', paperClass)
        return () => {
            document.body.classList.remove('printing-receipt', paperClass)
        }
    }, [printerSettings.paperSize])

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(Number(price || 0))
    const formatDate = (dateStr) => {
        try {
            return new Date(dateStr).toLocaleString('vi-VN')
        } catch {
            return dateStr
        }
    }

    const shopName = shop?.name || 'CỬA HÀNG POS'
    const shopAddress = shop?.address || 'Đà Nẵng, Việt Nam'
    const isDraft = sale?.code === 'DRAFT' || sale?.is_draft === true
    const paidAmount = Array.isArray(sale?.payments) && sale.payments.length > 0
        ? sale.payments.reduce((sum, p) => sum + Number(p?.amount || 0), 0)
        : (isDraft ? Number(sale?.paid_amount || 0) : Number(sale?.total_amount || 0))
    const remainingAmount = Math.max(0, Number(sale?.total_amount || 0) - paidAmount)

    const getPaymentLabel = (method) => method === 'cash' ? 'Tiền mặt' : method === 'transfer' ? 'Chuyển khoản' : method
    const paymentMethodLabel = sale?.payments?.length > 0
        ? sale.payments.map(p => `${getPaymentLabel(p.method)} (${formatPrice(p.amount)})`).join(', ')
        : (isDraft ? 'Chưa thanh toán' : getPaymentLabel(sale?.payment_method))

    const receiptFontSizeClass = printerSettings.fontSize <= 10
        ? 'text-xs'
        : printerSettings.fontSize >= 13
            ? 'text-base'
            : 'text-sm'

    const handlePrint = () => {
        window.print()
    }

    const handleShare = async () => {
        const itemsText = sale.items?.map(item =>
            `- ${item.product_name} x${item.quantity}: ${formatPrice(item.price * item.quantity)}đ`,
        ).join('\n')

        const text = `
🧾 HÓA ĐƠN BÁN LẺ - ${shopName}
Mã: ${formatReceiptCode(sale.code) || '---'}
Ngày: ${formatDate(sale.created_at || sale.sale_date)}
---------------------------
${itemsText}
---------------------------
${sale.discount > 0 ? `Tạm tính: ${formatPrice(sale.original_amount)}đ\nGiảm giá: -${formatPrice(sale.discount)}đ\n` : ''}TỔNG CỘNG: ${formatPrice(sale.total_amount)}đ
Thanh toán: ${paymentMethodLabel}
${remainingAmount > 0 ? `Còn thiếu: ${formatPrice(remainingAmount)}đ\n` : ''}${sale.note ? `Ghi chú: ${sale.note}\n` : ''}
Cảm ơn quý khách!
        `.trim()

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Hóa đơn ${sale.code}`,
                    text,
                })
            } catch (err) {
                console.error('Error sharing:', err)
            }
        } else {
            try {
                await navigator.clipboard.writeText(text)
                alert('Đã sao chép nội dung hóa đơn vào bộ nhớ tạm!')
            } catch {
                alert('Không thể chia sẻ hoặc sao chép hóa đơn.')
            }
        }
    }

    if (!sale) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/50 no-print"
                onClick={onClose}
            />

            <div className="bg-white w-full max-w-sm mx-4 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up relative z-10">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 no-print"
                    aria-label="Đóng hóa đơn"
                >
                    ✕
                </button>

                <div ref={printRef} className={`print-receipt p-6 text-gray-800 font-mono leading-relaxed ${receiptFontSizeClass}`}>
                    <div className="text-center mb-4">
                        <h2 className="text-xl font-bold uppercase">{shopName}</h2>
                        <p className="text-xs text-gray-500">{shopAddress}</p>
                        <hr className="my-2 border-dashed border-gray-300" />
                        <p className="text-xs">{isDraft ? 'PHIẾU TẠM TÍNH' : 'PHIẾU THANH TOÁN'}</p>
                        <p className="text-xs font-bold">#{isDraft ? 'DRAFT' : (formatReceiptCode(sale.code) || 'UNKNOWN')}</p>
                        <p className="text-[10px] text-gray-500">{formatDate(sale.created_at || sale.sale_date)}</p>
                    </div>

                    <table className="w-full text-left border-collapse mb-4">
                        <thead>
                            <tr className="border-b border-gray-300 text-xs text-gray-500">
                                <th className="py-1 w-8">SL</th>
                                <th className="py-1">Món</th>
                                <th className="py-1 text-right">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.items?.map((item, idx) => (
                                <tr key={idx} className="border-b border-dashed border-gray-200">
                                    <td className="py-2 align-top font-bold">{item.quantity}</td>
                                    <td className="py-2 align-top break-words">
                                        <div>{item.product_name}</div>
                                        {item.quantity > 1 && (
                                            <div className="text-[10px] text-gray-500">
                                                x {formatPrice(item.price)}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-2 text-right align-top font-bold whitespace-nowrap">
                                        {formatPrice(item.price * item.quantity)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="space-y-1 border-t border-gray-800 pt-2 mt-2">
                        {sale.discount > 0 && (
                            <>
                                <div className="flex justify-between items-center text-xs text-gray-600">
                                    <span>Tạm tính</span>
                                    <span>{formatPrice(sale.original_amount)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-600">
                                    <span>Giảm giá</span>
                                    <span className="text-red-500">-{formatPrice(sale.discount)}</span>
                                </div>
                            </>
                        )}
                        <div className="flex justify-between items-center text-base font-bold">
                            <span>TỔNG CỘNG</span>
                            <span>{formatPrice(sale.total_amount)}</span>
                        </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-dashed border-gray-300 space-y-1">
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Thanh toán:</p>
                        {sale.payments?.length > 0 ? (
                            sale.payments.map((p, i) => (
                                <div key={i} className="flex justify-between items-center text-xs">
                                    <span>{getPaymentLabel(p.method)}</span>
                                    <span>{formatPrice(p.amount)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="flex justify-between items-center text-xs">
                                <span>{isDraft ? 'Chưa thanh toán' : getPaymentLabel(sale.payment_method)}</span>
                                <span>{formatPrice(paidAmount)}</span>
                            </div>
                        )}
                        {remainingAmount > 0 && (
                            <div className="flex justify-between items-center text-xs text-red-500">
                                <span>Còn thiếu</span>
                                <span>{formatPrice(remainingAmount)}</span>
                            </div>
                        )}
                    </div>

                    {sale.note && (
                        <div className="mt-4 p-2 bg-gray-50 border border-gray-100 rounded text-[10px]">
                            <p className="font-bold mb-1 uppercase text-gray-400">Ghi chú:</p>
                            <p className="italic text-gray-600">{sale.note}</p>
                        </div>
                    )}

                    {printerSettings.showFooterNote && (
                        <div className="text-center mt-6 text-[10px] text-gray-400">
                            <p>Cảm ơn quý khách và hẹn gặp lại!</p>
                            <p>Powered by OpenPOS</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t flex gap-2 no-print">
                    <button
                        onClick={handlePrint}
                        className="flex-1 btn-primary text-xs py-2 h-10 px-0"
                    >
                        In
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex-1 btn bg-green-500 text-white hover:bg-green-600 text-xs py-2 h-10 px-0 shadow-sm"
                    >
                        Chia sẻ
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

export const PRINTER_PAPER_HINT = {
    [PRINT_PAPER_SIZES.MM58]: '58mm',
    [PRINT_PAPER_SIZES.MM80]: '80mm',
    [PRINT_PAPER_SIZES.A4]: 'A4',
}
