import { useState, useEffect } from 'react'
import { saveOfflineSale } from '../lib/db'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'
import { getProductImageUrl } from '../lib/imageUtils'
import { Zap, Search, Info, AlertTriangle, TrendingUp, ShoppingCart, Package, Folder, History, BarChart3, Save, Lightbulb, ArrowLeft, ArrowRight, LayoutGrid, Wallet, Bank, X, Plus, Minus, Trash2, Tag, FileText } from './Icons'

export default function CheckoutModal({ cart, totalAmount, onClose, onFinish }) {
    const { shop, isGuest } = useAuth()
    const [loading, setLoading] = useState(false)
    
    // Core Fields
    const [discount, setDiscount] = useState(0)
    const [note, setNote] = useState('')
    
    // Split Payments State
    // Default to one payment of the full amount
    const [payments, setPayments] = useState([
        { id: Date.now(), method: 'cash', amount: totalAmount }
    ])
    
    const [step, setStep] = useState(1) // 1: Summary, 2: Payment
    const [showQR, setShowQR] = useState(false)
    const [qrAmount, setQrAmount] = useState(0)
    
    const [expandedField, setExpandedField] = useState(null) // 'discount' or 'note' or null

    const finalTotal = Math.max(0, totalAmount - discount)
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
    const remaining = finalTotal - totalPaid

    // Auto-update the first payment if it's the only one and totalAmount changes
    useEffect(() => {
        if (payments.length === 1 && payments[0].amount !== finalTotal) {
            setPayments([{ ...payments[0], amount: finalTotal }])
        }
    }, [finalTotal, payments.length])

    const addPayment = (method) => {
        const amountToAdd = remaining > 0 ? remaining : 0
        setPayments([...payments, { id: Date.now(), method, amount: amountToAdd }])
    }

    const updatePaymentAmount = (id, val) => {
        const num = parseInt(val) || 0
        setPayments(payments.map(p => p.id === id ? { ...p, amount: num } : p))
    }

    const removePayment = (id) => {
        if (payments.length > 1) {
            setPayments(payments.filter(p => p.id !== id))
        }
    }

    const handlePrintDraft = () => {
        // Create a temporary sale object for printing
        const tempSale = {
            code: 'DRAFT',
            is_draft: true,
            total_amount: finalTotal,
            original_amount: totalAmount,
            discount: discount,
            note: note,
            payments: [],
            payment_method: 'unpaid',
            paid_amount: 0,
            remaining_amount: finalTotal,
            created_at: new Date().toISOString(),
            items: cart.map(item => ({
                product_name: item.name,
                quantity: item.quantity,
                price: item.price
            }))
        }
        onFinish(tempSale, true) // Pass a second flag to indicate it's just a draft/print request
    }

    const handleCheckout = async () => {
        if (remaining > 0) {
            alert('Số tiền thanh toán chưa đủ!')
            return
        }

        setLoading(true)
        try {
            const now = new Date()
            const gmt7Date = new Date(now.getTime() + (7 * 60 * 60 * 1000))
            const localDate = gmt7Date.toISOString().split('T')[0]
            
            const saleData = {
                shop_id: shop.id,
                code: `HD-${Math.floor(Date.now() / 1000).toString().slice(-6)}`,
                total_amount: finalTotal,
                original_amount: totalAmount,
                discount: discount,
                note: note,
                payments: payments.map(p => ({ method: p.method, amount: p.amount })),
                payment_method: payments[0]?.method || 'cash',
                sale_date: now.toISOString(),
                sale_local_date: localDate,
                items: cart.map(item => ({
                    product_id: item.product_id,
                    product_name: item.name,
                    quantity: item.quantity,
                    price: item.price
                }))
            }

            await saveOfflineSale(saleData)
            onFinish(saleData)
        } catch (error) {
            console.error(error)
            alert('Lỗi thanh toán: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-fade-in-up flex flex-col max-h-[95vh]">
                
                {/* Header */}
                <div className="p-4 border-b relative shrink-0">
                    <h2 className="text-lg font-black text-center uppercase tracking-widest text-gray-800">
                        {step === 1 ? 'Xác nhận đơn hàng' : 'Thanh toán'}
                    </h2>
                    <button onClick={onClose} className="absolute right-4 top-4 text-gray-300 hover:text-gray-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                    {isGuest && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-yellow-400 text-[9px] font-black px-4 py-1 rounded-b-xl uppercase tracking-widest shadow-sm">
                            Demo Mode
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    
                    {/* Content will be reordered below */}

                    {step === 1 ? (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
                            
                            {/* 1. Cart Mini List (Gọn hơn) */}
                            <div className="bg-gray-50/50 rounded-3xl p-3 border border-dashed border-gray-200">
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sản phẩm ({cart.length})</span>
                                </div>
                                <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1 custom-scrollbar">
                                    {cart.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs">
                                            <div className="flex-1 min-w-0 mr-4">
                                                <p className="font-bold text-gray-700 truncate">{item.name}</p>
                                                <p className="text-[10px] text-gray-400">x{item.quantity}</p>
                                            </div>
                                            <p className="font-black text-gray-600 shrink-0">{new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}đ</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 2. COMBINED ROW: SUMMARY + ICONS */}
                            <div className="bg-white rounded-2xl p-2 border border-gray-100 shadow-sm flex items-center justify-between gap-2">
                                {/* Tạm tính */}
                                <div className="flex flex-col pl-2">
                                    <span className="text-[7px] font-black text-gray-400 uppercase tracking-tight leading-none mb-1">Tạm tính</span>
                                    <span className="text-[11px] font-black text-gray-600 leading-none">{new Intl.NumberFormat('vi-VN').format(totalAmount)}đ</span>
                                </div>

                                <div className="h-6 w-px bg-gray-100 mx-1"></div>

                                {/* Tổng cộng */}
                                <div className="flex-1">
                                    <span className="text-[7px] font-black text-primary uppercase tracking-tight leading-none mb-1 block">Tổng cộng</span>
                                    <span className="text-[15px] font-black text-primary leading-none">{new Intl.NumberFormat('vi-VN').format(finalTotal)}đ</span>
                                </div>

                                {/* Icons Group */}
                                <div className="flex items-center bg-gray-50 rounded-xl p-0.5 border border-gray-100">
                                    <button 
                                        onClick={() => setExpandedField(expandedField === 'discount' ? null : 'discount')}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all relative ${expandedField === 'discount' || discount > 0 ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:bg-white'}`}
                                    >
                                        <Tag className="w-4 h-4" />
                                        {discount > 0 && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-green-500 border border-white rounded-full"></span>}
                                    </button>
                                    <div className="w-px h-4 bg-gray-200 mx-0.5"></div>
                                    <button 
                                        onClick={() => setExpandedField(expandedField === 'note' ? null : 'note')}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all relative ${expandedField === 'note' || note ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:bg-white'}`}
                                    >
                                        <FileText className="w-4 h-4" />
                                        {note && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-yellow-500 border border-white rounded-full"></span>}
                                    </button>
                                </div>
                            </div>

                            {/* 3. Expanded Inputs */}
                            {expandedField === 'discount' && (
                                <div className="animate-in zoom-in-95 fade-in">
                                    <div className="bg-primary/5 p-3 rounded-2xl border border-primary/10">
                                        <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-2 text-center">Giảm giá trực tiếp (đ)</p>
                                        <input 
                                            type="number" 
                                            value={discount || ''} 
                                            onChange={(e) => setDiscount(Math.min(totalAmount, parseInt(e.target.value) || 0))}
                                            className="w-full h-10 bg-white border-0 rounded-xl font-black text-primary focus:ring-2 focus:ring-primary outline-none transition-all text-lg text-center shadow-inner"
                                            placeholder="0"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            )}

                            {expandedField === 'note' && (
                                <div className="animate-in zoom-in-95 fade-in">
                                    <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100">
                                        <p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest mb-2 text-center">Ghi chú đơn hàng</p>
                                        <textarea 
                                            rows="2"
                                            value={note} 
                                            onChange={(e) => setNote(e.target.value)}
                                            className="w-full p-3 bg-white border-0 rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-300 outline-none resize-none text-xs shadow-inner"
                                            placeholder="Nhập ghi chú..."
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            {/* 💳 PAYMENTS SECTION */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-2">
                                    <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-[0.2em]">Hình thức thanh toán</h3>
                                    <div className="flex gap-2">
                                        <button onClick={() => addPayment('cash')} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-100 transition-colors flex items-center gap-1">
                                            <Plus className="w-3 h-3" /> Tiền mặt
                                        </button>
                                        <button onClick={() => addPayment('transfer')} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase hover:bg-indigo-100 transition-colors flex items-center gap-1">
                                            <Plus className="w-3 h-3" /> Chuyển khoản
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {payments.map((p, idx) => (
                                        <div key={p.id} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${p.method === 'cash' ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-50 text-indigo-500'}`}>
                                                {p.method === 'cash' ? <Wallet className="w-6 h-6" /> : <Bank className="w-6 h-6" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{p.method === 'cash' ? 'Khách đưa tiền mặt' : `Chuyển khoản #${idx + 1}`}</p>
                                                <input 
                                                    type="number" 
                                                    value={p.amount || ''} 
                                                    onChange={(e) => updatePaymentAmount(p.id, e.target.value)}
                                                    className="w-full bg-transparent border-0 p-0 font-black text-gray-800 focus:ring-0 text-lg"
                                                    placeholder="0"
                                                    autoFocus={idx > 0}
                                                />
                                            </div>
                                            {p.method === 'transfer' && (shop?.bank_name || shop?.bank_qr_url) && (
                                                <button 
                                                    onClick={() => { setQrAmount(p.amount); setShowQR(true); }}
                                                    className="h-10 w-10 rounded-xl bg-gray-50 text-gray-400 hover:text-primary transition-colors flex items-center justify-center"
                                                    title="Hiện mã QR"
                                                >
                                                    <Zap className="w-5 h-5" />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => removePayment(p.id)}
                                                className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${payments.length > 1 ? 'text-red-300 hover:text-red-500 hover:bg-red-50' : 'text-gray-100 cursor-not-allowed'}`}
                                                disabled={payments.length === 1}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Payment Result */}
                                <div className="bg-gray-900 rounded-3xl p-4 flex justify-between items-center text-white shadow-xl">
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Đã nhận</p>
                                        <p className="text-base font-black text-emerald-400">{new Intl.NumberFormat('vi-VN').format(totalPaid)}đ</p>
                                    </div>
                                    <div className="text-right space-y-0.5">
                                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{remaining > 0 ? 'Còn thiếu' : 'Tiền thừa'}</p>
                                        <p className={`text-xl font-black ${remaining > 0 ? 'text-red-400' : 'text-primary'}`}>
                                            {new Intl.NumberFormat('vi-VN').format(Math.abs(remaining))}đ
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-white border-t flex gap-3 shrink-0">
                    {step === 1 ? (
                        <>
                            <button
                                onClick={onClose}
                                className="flex-1 h-12 bg-gray-100 text-gray-600 font-black rounded-xl hover:bg-gray-200 transition-all uppercase tracking-widest text-[10px]"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={handlePrintDraft}
                                className="flex-1 h-12 bg-gray-900 text-white font-black rounded-xl hover:bg-black transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-1.5"
                            >
                                <Zap className="w-3.5 h-3.5 text-yellow-400" /> Tạm Tính
                            </button>
                            <button
                                onClick={() => setStep(2)}
                                className="flex-[1.5] h-12 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 uppercase tracking-widest text-[10px]"
                            >
                                Tiếp tục <ArrowRight className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 h-12 bg-gray-100 text-gray-600 font-black rounded-xl hover:bg-gray-200 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-1.5"
                            >
                                <ArrowLeft className="w-4 h-4" /> Quay lại
                            </button>
                            <button
                                onClick={handleCheckout}
                                disabled={loading || remaining > 0}
                                className="flex-[2] h-12 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 uppercase tracking-widest text-[10px] disabled:opacity-30"
                            >
                                {loading ? 'Đang lưu...' : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        <span>XUẤT ĐƠN</span>
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>


                {/* 📲 QR MODAL OVERLAY */}
                {showQR && (
                    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-white w-full max-w-xs rounded-[3rem] overflow-hidden shadow-2xl flex flex-col items-center p-8 space-y-5">
                            <div className="w-full flex justify-between items-center">
                                <h3 className="font-black text-gray-800 uppercase tracking-widest text-xs">Mã QR Thanh toán</h3>
                                <button onClick={() => setShowQR(false)} className="text-gray-300 hover:text-gray-600 transition-colors"><X className="w-6 h-6" /></button>
                            </div>

                            {/* Editable QR Amount */}
                            <div className="w-full space-y-2">
                                <div className="flex justify-between items-end px-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Số tiền hiển thị</label>
                                    <button 
                                        onClick={() => setQrAmount(0)}
                                        className="text-[9px] font-black text-primary uppercase hover:underline"
                                    >
                                        Xoá số tiền
                                    </button>
                                </div>
                                <input 
                                    type="number" 
                                    value={qrAmount || ''} 
                                    onChange={(e) => setQrAmount(parseInt(e.target.value) || 0)}
                                    className="w-full h-12 px-5 bg-gray-50 border-0 rounded-2xl font-black text-primary focus:ring-2 focus:ring-primary outline-none transition-all text-center text-xl"
                                />
                            </div>

                            <div className="w-full aspect-square bg-white rounded-[2rem] border-4 border-blue-50 p-2 overflow-hidden shadow-inner flex items-center justify-center">
                                {shop?.bank_account_number ? (
                                    <img 
                                        src={`https://img.vietqr.io/image/${(shop.bank_name || 'vcb').toLowerCase().replace(/\s+/g, '')}-${shop.bank_account_number}-compact2.jpg?amount=${qrAmount}&addInfo=THANH TOAN DON HANG`} 
                                        alt="Bank QR" 
                                        className="w-full h-full object-contain" 
                                        onError={(e) => {
                                            // Fallback to uploaded image if generator fails
                                            if (shop.bank_qr_url) e.target.src = getProductImageUrl(shop.bank_qr_url)
                                        }}
                                    />
                                ) : shop?.bank_qr_url ? (
                                    <img src={getProductImageUrl(shop.bank_qr_url)} alt="Bank QR" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="flex flex-col items-center text-gray-300">
                                        <AlertTriangle className="w-12 h-12 mb-2 opacity-20" />
                                        <p className="text-[10px] font-black uppercase">Chưa cài đặt QR</p>
                                    </div>
                                )}
                            </div>

                            <div className="w-full bg-blue-50 rounded-[2rem] p-5 space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-black text-blue-400 uppercase tracking-widest text-[8px]">Ngân hàng</span>
                                    <span className="font-black text-blue-900 uppercase">{shop?.bank_name || '---'}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-black text-blue-400 uppercase tracking-widest text-[8px]">Số tài khoản</span>
                                    <span className="font-black text-blue-900">{shop?.bank_account_number || '---'}</span>
                                </div>
                                <div className="pt-3 border-t border-blue-100 flex flex-col items-center">
                                    <p className="text-[9px] text-blue-500 font-bold mb-2 italic text-center px-4">
                                        {qrAmount > 0 
                                            ? '📌 Quét mã để tự động nhập số tiền' 
                                            : '📌 Mã QR tĩnh: Khách tự nhập số tiền trên điện thoại'
                                        }
                                    </p>
                                    <button 
                                        onClick={() => setShowQR(false)} 
                                        className="w-full py-3 bg-primary text-white font-black rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
                                    >
                                        ĐÃ XÁC NHẬN CHUYỂN
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
