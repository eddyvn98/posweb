import { useState, useEffect, useMemo, useCallback } from 'react'
import api from '../lib/api'
import { useNotification } from '../contexts/NotificationContext'
import { useAuth } from '../contexts/AuthContext'
import { 
    ShoppingBag, 
    Phone, 
    MapPin, 
    Search, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Truck, 
    RefreshCw, 
    Printer, 
    AlertCircle, 
    ChevronRight,
    Wallet,
    Landmark
} from 'lucide-react'

const statusBadges = {
    awaiting_shipment: { label: 'Chờ giao hàng', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
    completed: { label: 'Đã hoàn thành', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    cancelled: { label: 'Đã hủy đơn', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: XCircle },
}

const formatVnd = (val) => `${new Intl.NumberFormat('vi-VN').format(Number(val) || 0)}đ`

export default function OnlineOrders() {
    const { showNotification } = useNotification()
    const { shop } = useAuth()
    const [orders, setOrders] = useState([])
    const [stats, setStats] = useState({ all: 0, awaiting_shipment: 0, completed: 0, cancelled: 0, revenue: 0 })
    const [loading, setLoading] = useState(true)
    const [query, setQuery] = useState('')
    const [tab, setTab] = useState('all') // 'all' | 'awaiting_shipment' | 'completed' | 'cancelled'
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [cancelModalOrder, setCancelModalOrder] = useState(null)
    const [cancelReason, setCancelReason] = useState('Khách yêu cầu hủy đơn')
    const [processing, setProcessing] = useState(false)

    const fetchOrders = useCallback(async () => {
        setLoading(true)
        try {
            const params = {
                status: tab,
                q: query.trim(),
            }
            const res = await api.get('/admin/online-orders', { params })
            setOrders(res.data.orders || [])
            if (res.data.stats) setStats(res.data.stats)
        } catch (error) {
            console.error('Fetch online orders error:', error)
            showNotification('Không thể tải danh sách đơn online: ' + (error.response?.data?.error || error.message), 'error')
        } finally {
            setLoading(false)
        }
    }, [tab, query, showNotification])

    useEffect(() => {
        fetchOrders()
    }, [fetchOrders])

    const handleUpdateStatus = async (orderId, newStatus, reason = '') => {
        if (processing) return
        setProcessing(true)
        try {
            await api.patch(`/admin/online-orders/${orderId}/status`, {
                status: newStatus,
                reason,
            })
            showNotification(
                newStatus === 'completed' 
                    ? 'Đã chuyển trạng thái đơn hàng sang Hoàn thành' 
                    : 'Đã hủy đơn hàng và hoàn lại tồn kho thành công', 
                'success'
            )
            setCancelModalOrder(null)
            if (selectedOrder?.id === orderId) {
                setSelectedOrder(null)
            }
            fetchOrders()
        } catch (error) {
            console.error('Update order status error:', error)
            showNotification('Lỗi khi đổi trạng thái: ' + (error.response?.data?.error || error.message), 'error')
        } finally {
            setProcessing(false)
        }
    }

    const handlePrintK80 = (order) => {
        const printWindow = window.open('', '_blank', 'width=400,height=600')
        if (!printWindow) {
            alert('Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép popup để in.')
            return
        }

        const itemsHtml = order.items.map((item, idx) => `
            <tr>
                <td style="padding: 4px 2px; font-size: 11px;">${idx + 1}. ${item.product_name}</td>
                <td style="padding: 4px 2px; font-size: 11px; text-align: center;">x${item.quantity}</td>
                <td style="padding: 4px 2px; font-size: 11px; text-align: right;">${formatVnd(item.price * item.quantity)}</td>
            </tr>
        `).join('')

        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Phiếu Giao Hàng - ${order.code}</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; width: 72mm; margin: 4mm auto; color: #000; font-size: 12px; line-height: 1.4; }
    .text-center { text-align: center; }
    .font-bold { font-weight: bold; }
    .border-b { border-bottom: 1px dashed #333; margin: 8px 0; }
    .badge { display: inline-block; padding: 2px 6px; font-size: 10px; font-weight: bold; border: 1px solid #000; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; }
    .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; margin-top: 6px; }
  </style>
</head>
<body>
  <div class="text-center">
    <div style="font-size: 15px; font-weight: 900; text-transform: uppercase;">${shop?.name || 'CỬA HÀNG BÁN LẺ'}</div>
    <div style="font-size: 10px;">${shop?.address || ''}</div>
    <div style="font-size: 10px;">Hotline: ${shop?.phone || ''}</div>
    <div class="border-b"></div>
    <div style="font-size: 16px; font-weight: 900; margin: 4px 0;">PHIẾU GIAO HÀNG ONLINE</div>
    <div style="font-size: 12px; font-weight: bold;">Mã đơn: ${order.code}</div>
    <div style="font-size: 10px; color: #444;">Ngày đặt: ${new Date(order.createdAt).toLocaleString('vi-VN')}</div>
  </div>

  <div class="border-b"></div>

  <div>
    <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px;">NGƯỜI NHẬN HÀNG:</div>
    <div style="font-size: 14px; font-weight: bold;">${order.customer.name}</div>
    <div style="font-size: 14px; font-weight: bold; margin: 2px 0;">SĐT: ${order.customer.phone}</div>
    <div style="font-size: 12px;">Đ/C: ${order.address.address}${order.address.ward ? ', ' + order.address.ward : ''}, ${order.address.city}</div>
    ${order.note ? `<div style="font-size: 11px; margin-top: 4px; font-style: italic;">Ghi chú: ${order.note}</div>` : ''}
  </div>

  <div class="border-b"></div>

  <table>
    <thead>
      <tr style="border-bottom: 1px solid #666; font-size: 10px; text-transform: uppercase;">
        <th style="text-align: left; padding-bottom: 4px;">Sản phẩm</th>
        <th style="text-align: center; padding-bottom: 4px;">SL</th>
        <th style="text-align: right; padding-bottom: 4px;">Tiền</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="border-b"></div>

  <div style="font-size: 11px;">
    <div style="display: flex; justify-content: space-between;"><span>Tạm tính:</span><span>${formatVnd(order.subtotal)}</span></div>
    ${order.voucherDiscount > 0 ? `<div style="display: flex; justify-content: space-between;"><span>Voucher (${order.voucher?.code || ''}):</span><span>-${formatVnd(order.voucherDiscount)}</span></div>` : ''}
    <div style="display: flex; justify-content: space-between;"><span>Phí giao hàng:</span><span>${order.shippingFee > 0 ? formatVnd(order.shippingFee) : 'Miễn phí'}</span></div>
  </div>

  <div class="total-row">
    <span>TỔNG THU (COD):</span>
    <span>${order.paymentMethod === 'cod' ? formatVnd(order.total) : '0đ (ĐÃ CK)'}</span>
  </div>
  <div style="text-align: center; margin-top: 4px; font-size: 11px; font-weight: bold;">
    ${order.paymentMethod === 'cod' ? 'TIỀN THU NGƯỜI NHẬN: ' + formatVnd(order.total) : 'ĐÃ THANH TOÁN CHUYỂN KHOẢN'}
  </div>

  <div class="border-b"></div>
  <div class="text-center" style="font-size: 10px; font-style: italic;">
    Quý khách vui lòng kiểm tra hàng trước khi nhận.<br>Cảm ơn quý khách đã mua sắm!
  </div>
</body>
</html>
        `

        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
            printWindow.print()
            printWindow.close()
        }, 350)
    }

    const tabsList = [
        { key: 'all', label: 'Tất cả', count: stats.all },
        { key: 'awaiting_shipment', label: 'Chờ giao hàng', count: stats.awaiting_shipment },
        { key: 'completed', label: 'Hoàn thành', count: stats.completed },
        { key: 'cancelled', label: 'Đã hủy', count: stats.cancelled },
    ]

    return (
        <div className="min-h-screen bg-slate-50 pb-20 p-4 md:p-6">
            {/* Page Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <ShoppingBag className="w-6 h-6 text-sky-600" /> Quản lý Đơn Hàng Online
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Theo dõi, duyệt giao hàng và in phiếu gửi cho khách mua tại Website / Shop online
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchOrders}
                        disabled={loading}
                        className="btn-secondary btn-md flex items-center gap-1.5"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>Làm mới</span>
                    </button>
                    <a
                        href="/shop"
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary btn-md flex items-center gap-1.5"
                    >
                        <Globe className="w-4 h-4" />
                        <span>Xem trang Shop</span>
                    </a>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chờ giao hàng</span>
                        <div className="text-2xl font-extrabold text-amber-600 mt-1">{stats.awaiting_shipment}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đã hoàn thành</span>
                        <div className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.completed}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đã hủy đơn</span>
                        <div className="text-2xl font-extrabold text-slate-500 mt-1">{stats.cancelled}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                        <XCircle className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Doanh thu Online</span>
                        <div className="text-xl font-extrabold text-sky-600 mt-1">{formatVnd(stats.revenue)}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                        <Wallet className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-5 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    {/* Status tabs */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                        {tabsList.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                                    tab === t.key
                                        ? 'bg-sky-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                <span>{t.label}</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                    tab === t.key ? 'bg-sky-700 text-white' : 'bg-white text-slate-600'
                                }`}>
                                    {t.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Tìm theo SĐT, Tên khách, Mã đơn..."
                            className="input w-full pl-9 h-9 text-xs"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Orders List */}
            {loading ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-600">Đang tải danh sách đơn hàng online...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800">Chưa có đơn hàng nào</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Khi khách hàng đặt hàng qua Website `/shop`, đơn hàng sẽ lập tức xuất hiện tại đây để bạn xử lý và giao hàng.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map((order) => {
                        const badge = statusBadges[order.status] || statusBadges.awaiting_shipment
                        const BadgeIcon = badge.icon
                        return (
                            <div
                                key={order.id}
                                className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 shadow-sm hover:border-sky-300 transition-colors"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <span className="font-mono font-extrabold text-base text-slate-900">
                                            {order.code}
                                        </span>
                                        <span className={`px-2.5 py-0.5 rounded-lg border text-xs font-bold flex items-center gap-1 ${badge.color}`}>
                                            <BadgeIcon className="w-3.5 h-3.5" />
                                            {badge.label}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {new Date(order.createdAt).toLocaleString('vi-VN')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handlePrintK80(order)}
                                            className="btn-secondary btn-sm flex items-center gap-1 text-slate-700"
                                            title="In phiếu gửi K80"
                                        >
                                            <Printer className="w-3.5 h-3.5" />
                                            <span>In phiếu K80</span>
                                        </button>
                                        {order.status === 'awaiting_shipment' && (
                                            <>
                                                <button
                                                    onClick={() => handleUpdateStatus(order.id, 'completed')}
                                                    disabled={processing}
                                                    className="btn-success btn-sm flex items-center gap-1 font-bold"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span>Hoàn thành đơn</span>
                                                </button>
                                                <button
                                                    onClick={() => setCancelModalOrder(order)}
                                                    disabled={processing}
                                                    className="btn-danger btn-sm flex items-center gap-1"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    <span>Hủy đơn</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Customer & Delivery Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-3 py-1">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Khách hàng</span>
                                        <div className="font-bold text-slate-900 text-sm">{order.customer.name}</div>
                                        <a
                                            href={`tel:${order.customer.phone}`}
                                            className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:underline mt-0.5"
                                        >
                                            <Phone className="w-3 h-3" /> {order.customer.phone}
                                        </a>
                                    </div>

                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Địa chỉ giao</span>
                                        <p className="text-xs text-slate-700 leading-relaxed">
                                            {order.address.address}{order.address.ward ? `, ${order.address.ward}` : ''}, {order.address.city}
                                        </p>
                                        {order.note && (
                                            <p className="text-[11px] text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 inline-block mt-1 font-medium">
                                                Ghi chú: {order.note}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Thanh toán & Thu tiền</span>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                            {order.paymentMethod === 'bank_transfer' ? (
                                                <><Landmark className="w-3.5 h-3.5 text-sky-600" /> Chuyển khoản</>
                                            ) : (
                                                <><Wallet className="w-3.5 h-3.5 text-emerald-600" /> COD (Thu tiền khi giao)</>
                                            )}
                                        </div>
                                        <div className="text-base font-extrabold text-sky-600 mt-1">
                                            {formatVnd(order.total)}
                                        </div>
                                    </div>
                                </div>

                                {/* Items List Preview */}
                                <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100">
                                    <div className="text-[11px] font-bold text-slate-500 uppercase mb-2">
                                        Sản phẩm ({order.items.length}):
                                    </div>
                                    <div className="space-y-1.5">
                                        {order.items.map((item) => (
                                            <div key={item.id || item.product_id} className="flex justify-between items-center text-xs text-slate-700">
                                                <div className="truncate pr-2">
                                                    <span className="font-semibold text-slate-900">{item.product_name}</span>
                                                    <span className="text-slate-400 ml-2 font-mono">x{item.quantity}</span>
                                                </div>
                                                <span className="font-bold text-slate-800 whitespace-nowrap">
                                                    {formatVnd(item.price * item.quantity)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    {(order.voucherDiscount > 0 || order.shippingFee > 0) && (
                                        <div className="mt-2 pt-2 border-t border-slate-200/60 flex flex-wrap gap-3 text-xs text-slate-500">
                                            {order.voucherDiscount > 0 && (
                                                <span>Voucher: <b className="text-rose-600">-{formatVnd(order.voucherDiscount)}</b> ({order.voucher?.code})</span>
                                            )}
                                            {order.shippingFee > 0 && (
                                                <span>Phí ship: <b>{formatVnd(order.shippingFee)}</b></span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Cancel Modal */}
            {cancelModalOrder && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl animate-scaleIn space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Xác nhận hủy đơn hàng</h3>
                                <p className="text-xs text-slate-500">Mã đơn: <b className="font-mono">{cancelModalOrder.code}</b></p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                            Khi hủy đơn, toàn bộ số lượng sản phẩm trong đơn sẽ được <strong>tự động hoàn lại vào kho hàng</strong> và giao dịch bán hàng liên kết sẽ được hủy.
                        </p>

                        <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1.5">Lý do hủy đơn:</label>
                            <select
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="input w-full text-xs"
                            >
                                <option value="Khách yêu cầu hủy đơn">Khách yêu cầu hủy đơn</option>
                                <option value="Hết hàng trong kho">Hết hàng trong kho</option>
                                <option value="Không liên lạc được khách hàng">Không liên lạc được khách hàng</option>
                                <option value="Sai thông tin giao nhận">Sai thông tin giao nhận</option>
                                <option value="Khác">Lý do khác</option>
                            </select>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setCancelModalOrder(null)}
                                disabled={processing}
                                className="flex-1 btn-secondary btn-md font-bold"
                            >
                                Đóng
                            </button>
                            <button
                                type="button"
                                onClick={() => handleUpdateStatus(cancelModalOrder.id, 'cancelled', cancelReason)}
                                disabled={processing}
                                className="flex-1 btn-danger btn-md font-bold"
                            >
                                {processing ? 'Đang hủy...' : 'Xác nhận hủy đơn'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
