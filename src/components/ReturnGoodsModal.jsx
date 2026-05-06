import { useState, useEffect } from 'react'
import { searchSalesHistory, returnSaleLocal } from '../lib/db'
import { X, Search, QrCode, Calendar, History, ArrowLeft, Check, AlertCircle } from './Icons'
import { useNotification } from '../contexts/NotificationContext'

export default function ReturnGoodsModal({ onClose, onReturnSuccess }) {
    const { showNotification } = useNotification()
    const [query, setQuery] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedSale, setSelectedSale] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false)
    
    // Return options
    const [returnAmount, setReturnAmount] = useState(0)
    const [paymentMethod, setPaymentMethod] = useState('cash')
    const [reason, setReason] = useState('Khách trả hàng')

    const handleSearch = async () => {
        setLoading(true)
        try {
            const results = await searchSalesHistory({
                query: query,
                barcode: query, // Use same input for code and barcode
                startDate,
                endDate
            })
            setSales(results)
        } catch (err) {
            console.error('Search sales failed', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        handleSearch()
    }, [])

    const handleSelectSale = (sale) => {
        setSelectedSale(sale)
        setReturnAmount(sale.total_amount)
        setPaymentMethod(sale.payment_method || 'cash')
    }

    const handleConfirmReturn = async () => {
        if (!selectedSale) return
        
        setIsProcessing(true)
        try {
            const success = await returnSaleLocal(selectedSale.local_id, {
                reason,
                amount: returnAmount,
                paymentMethod
            })
            
            if (success) {
                showNotification('Đã trả hàng thành công!', 'success')
                if (onReturnSuccess) onReturnSuccess()
                onClose()
            } else {
                showNotification('Không thể trả hàng (đơn có thể đã bị hủy)', 'error')
            }
        } catch (err) {
            console.error('Return process failed', err)
            showNotification('Có lỗi xảy ra khi trả hàng', 'error')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 lg:p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative w-full h-[100dvh] lg:h-auto lg:max-w-4xl bg-white lg:rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
                {/* Header */}
                <div className="p-4 lg:p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <button onClick={selectedSale ? () => setSelectedSale(null) : onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">
                            {selectedSale ? 'Chi tiết trả hàng' : 'Tìm đơn hàng trả'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6">
                    {!selectedSale ? (
                        <>
                            {/* Search Controls */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                                <div className="relative md:col-span-2">
                                    <input 
                                        type="text" 
                                        className="w-full h-12 pl-11 pr-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-sm"
                                        placeholder="Mã đơn hàng / Mã vạch sản phẩm..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                </div>
                                <button 
                                    onClick={handleSearch}
                                    className="h-12 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase text-xs"
                                >
                                    <Search className="w-4 h-4" /> Tìm kiếm
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Từ ngày</label>
                                    <div className="relative">
                                        <input 
                                            type="date" 
                                            className="w-full h-10 px-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Đến ngày</label>
                                    <div className="relative">
                                        <input 
                                            type="date" 
                                            className="w-full h-10 px-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Results List */}
                            <div className="space-y-3">
                                {loading ? (
                                    <div className="py-20 text-center opacity-30 animate-pulse">
                                        <History className="w-12 h-12 mx-auto mb-2" />
                                        <p className="font-black uppercase tracking-widest text-xs">Đang tìm kiếm...</p>
                                    </div>
                                ) : sales.length === 0 ? (
                                    <div className="py-20 text-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
                                        <p className="text-gray-400 font-bold">Không tìm thấy đơn hàng phù hợp</p>
                                    </div>
                                ) : (
                                    sales.map(sale => (
                                        <div 
                                            key={sale.local_id} 
                                            onClick={() => !sale.is_void && handleSelectSale(sale)}
                                            className={`
                                                p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between
                                                ${sale.is_void 
                                                    ? 'bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed' 
                                                    : 'bg-white border-gray-100 hover:border-primary/30 hover:shadow-md'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] ${sale.is_void ? 'bg-gray-200 text-gray-400' : 'bg-primary/10 text-primary'}`}>
                                                    {sale.code?.slice(-3) || '---'}
                                                </div>
                                                <div>
                                                    <div className="font-black text-gray-800 text-sm flex items-center gap-2">
                                                        #{sale.code || sale.local_id}
                                                        {sale.is_void && <span className="text-[8px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded uppercase">Đã hủy</span>}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 font-bold mt-0.5">
                                                        {new Date(sale.created_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                                                        {' • '} {sale.items?.length || 0} món
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-gray-900">
                                                    {new Intl.NumberFormat('vi-VN').format(sale.total_amount)}đ
                                                </div>
                                                <div className="text-[9px] font-black text-gray-400 uppercase">{sale.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-6">
                            {/* Sale Items Summary */}
                            <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Chi tiết đơn hàng #{selectedSale.code}</h3>
                                <div className="space-y-3">
                                    {selectedSale.items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm">
                                            <div className="flex-1 pr-4">
                                                <p className="font-bold text-gray-800 uppercase text-xs">{item.product_name}</p>
                                                <p className="text-[10px] text-gray-400 font-bold">{new Intl.NumberFormat('vi-VN').format(item.price)}đ x {item.quantity}</p>
                                            </div>
                                            <div className="font-black text-gray-900">
                                                {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}đ
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                                    <span className="text-sm font-black text-gray-800 uppercase">Tổng tiền đơn hàng</span>
                                    <span className="text-lg font-black text-primary tracking-tight">
                                        {new Intl.NumberFormat('vi-VN').format(selectedSale.total_amount)}đ
                                    </span>
                                </div>
                            </div>

                            {/* Return Configuration */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Số tiền hoàn trả cho khách</label>
                                    <div className="relative mt-1">
                                        <input 
                                            type="number" 
                                            className="w-full h-12 px-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-black text-xl text-primary"
                                            value={returnAmount}
                                            onChange={(e) => setReturnAmount(Number(e.target.value))}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-gray-400">Đ</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Hình thức trả</label>
                                        <select 
                                            className="w-full h-12 px-4 bg-white border-2 border-gray-100 rounded-2xl outline-none font-bold text-sm mt-1"
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        >
                                            <option value="cash">Tiền mặt</option>
                                            <option value="transfer">Chuyển khoản</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Lý do trả hàng</label>
                                        <input 
                                            type="text" 
                                            className="w-full h-12 px-4 bg-white border-2 border-gray-100 rounded-2xl outline-none font-bold text-sm mt-1"
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            placeholder="VD: Sản phẩm lỗi, đổi hàng..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 rounded-2xl p-4 flex gap-3 items-start border border-amber-100">
                                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                                <div className="text-[10px] text-amber-800 font-bold leading-relaxed">
                                    Lưu ý: Hệ thống sẽ tự động cộng lại số lượng sản phẩm vào kho và tạo một phiếu chi tiền tương ứng với số tiền hoàn trả.
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 lg:p-6 border-t bg-gray-50 flex gap-3 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] lg:pb-6">
                    <button 
                        onClick={onClose}
                        className="flex-1 h-12 bg-white border border-gray-200 text-gray-600 font-black rounded-2xl active:scale-95 transition-all uppercase text-xs"
                    >
                        Hủy bỏ
                    </button>
                    {selectedSale && (
                        <button 
                            onClick={handleConfirmReturn}
                            disabled={isProcessing}
                            className="flex-[2] h-12 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase text-xs disabled:opacity-50"
                        >
                            {isProcessing ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>Xác nhận trả hàng <Check className="w-4 h-4" /></>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
