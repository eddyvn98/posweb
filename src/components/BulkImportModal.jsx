import { useState, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'
import { findProductByBarcode, saveProductLocal } from '../lib/db'
import { useNotification } from '../contexts/NotificationContext'
import { useScanBarcode } from '../hooks/useScanBarcode'
import BarcodeScanner from './BarcodeScanner'
import { Package, Zap, Search } from './Icons'

export default function BulkImportModal({ onClose, onFinish }) {
    const { shop } = useAuth()
    const { pushProducts } = useSync()
    const { showNotification } = useNotification()
    const [scannedItems, setScannedItems] = useState([])
    const [isClosed, setIsClosed] = useState(false)
    const [showCamera, setShowCamera] = useState(false)
    const scanLock = useRef(false)

    useEffect(() => {
        return () => setIsClosed(true)
    }, [])

    // Enable Bluetooth/External Scanner
    useScanBarcode({
        onScan: (code) => handleScan(code),
        enabled: !isClosed
    })

    const handleScan = async (code, isCamera = false) => {
        if (scanLock.current || isClosed) return
        scanLock.current = true

        try {
            const existing = await findProductByBarcode(code)
            const itemId = existing?.id || uuidv4()

            // 1. Update UI List (History - Newest on top)
            setScannedItems(prev => {
                const idx = prev.findIndex(item => item.barcode === code)
                if (idx > -1) {
                    const next = [...prev]
                    const updated = { ...next[idx], quantity: next[idx].quantity + 1, status: 'saving' }
                    next.splice(idx, 1)
                    return [updated, ...next]
                }
                return [{
                    id: itemId,
                    barcode: code,
                    name: existing?.name || `SP mới (${code})`,
                    quantity: 1,
                    isNew: !existing,
                    price: existing?.price || 0,
                    unit: existing?.unit || 'Cái',
                    status: 'saving'
                }, ...prev]
            })

            // 2. Save immediately to DB
            const productData = {
                ...(existing || {}),
                id: itemId,
                shop_id: shop.id,
                barcode: code,
                name: existing?.name || `SP mới (${code})`,
                unit: existing?.unit || 'Cái',
                price: Number(existing?.price || 0),
                stock_quantity: (existing?.stock_quantity || 0) + 1,
                is_active: true,
                updated_at: new Date().toISOString()
            }
            if (!existing) productData.created_at = new Date().toISOString()

            await saveProductLocal(productData)
            await pushProducts(productData)

            // 3. Mark as saved in UI
            setScannedItems(prev => prev.map(item =>
                item.barcode === code ? { ...item, status: 'saved' } : item
            ))

            showNotification(`Đã lưu: ${productData.name}`, 'success')
        } catch (err) {
            showNotification('Lỗi khi lưu: ' + err.message, 'error')
        } finally {
            setTimeout(() => { scanLock.current = false }, isCamera ? 800 : 100)
        }
    }

    const handleUpdateItem = async (index, field, value) => {
        const nextItems = [...scannedItems]
        nextItems[index][field] = value
        setScannedItems(nextItems)

        // Auto-save changes in the list if name/price/unit is changed
        try {
            const item = nextItems[index]
            const existing = await findProductByBarcode(item.barcode)
            const productData = {
                ...(existing || {}),
                id: existing?.id || item.id,
                shop_id: shop.id,
                barcode: item.barcode,
                name: item.name,
                unit: item.unit,
                price: Number(item.price),
                stock_quantity: (existing?.stock_quantity || 0), // Don't add here, just sync current
                updated_at: new Date().toISOString()
            }
            await saveProductLocal(productData)
            await pushProducts(productData)
        } catch (err) {
            console.error('Auto-update error:', err)
        }
    }

    const handleFinish = () => {
        onFinish()
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-lg h-full sm:h-[80vh] flex flex-col rounded-none sm:rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                        <Package className="w-6 h-6 text-primary" />
                        <h2 className="text-xl font-bold uppercase tracking-tight">Quét lô hàng loạt</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 text-2xl">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => setShowCamera(!showCamera)}
                            className={`btn text-xs font-black uppercase tracking-widest h-10 rounded-xl border transition-all flex items-center justify-center gap-2 ${showCamera ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}
                        >
                            {showCamera ? (
                                <>
                                    <Zap className="w-4 h-4" />
                                    <span>Tắt Camera</span>
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4" />
                                    <span>Mở Camera để quét</span>
                                </>
                            )}
                        </button>

                        {showCamera && (
                            <div className="bg-gray-100 rounded-xl overflow-hidden animate-in fade-in zoom-in duration-300">
                                <BarcodeScanner onDetected={(code) => handleScan(code, true)} active={!isClosed && showCamera} />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Lịch sử quét</h3>
                            <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full">Tự động sao lưu</span>
                        </div>
                        {scannedItems.length === 0 && (
                            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-500">
                                <div className="relative">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 shadow-inner">
                                        <Package className="w-10 h-10 text-gray-200" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-50">
                                        <Zap className="w-4 h-4 text-primary animate-pulse" />
                                    </div>
                                </div>
                                
                                <div className="space-y-4 max-w-[240px] mx-auto opacity-40">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-gray-600 uppercase tracking-widest">Hướng dẫn nhanh</p>
                                        <div className="h-0.5 w-8 bg-primary/30 mx-auto rounded-full"></div>
                                    </div>
                                    
                                    <ul className="text-[10px] text-gray-500 space-y-3 font-bold uppercase tracking-tight text-left max-w-[220px] mx-auto">
                                        <li className="flex items-start gap-2">
                                            <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] shrink-0 mt-0.5">1</div>
                                            <span>Bóp cò quét mã sản phẩm liên tục</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[8px] shrink-0 mt-0.5">2</div>
                                            <span>Tự động thêm mới nếu chưa có trong kho</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[8px] shrink-0 mt-0.5">3</div>
                                            <span>Cộng thêm số lượng nếu đã có sản phẩm</span>
                                        </li>
                                    </ul>
                                </div>

                                <p className="text-sm italic text-primary font-black animate-pulse">
                                    Sẵn sàng quét hàng...
                                </p>
                            </div>
                        )}
                        {scannedItems.map((item, idx) => (
                            <div key={item.barcode} className={`flex gap-3 bg-white p-3 rounded-2xl border transition-all ${item.status === 'saving' ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100 shadow-sm'} items-center animate-in slide-in-from-top-2 duration-300`}>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <input
                                            className="font-bold text-sm bg-transparent border-none p-0 focus:ring-0 w-full uppercase tracking-tight"
                                            value={item.name}
                                            onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                                        />
                                        {item.status === 'saving' ? (
                                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                        ) : (
                                            <span className="text-[10px] text-green-500">✓</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{item.barcode} • Số lượng: <span className="font-bold text-gray-700">{item.quantity}</span></p>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="font-black text-xs text-primary">{new Intl.NumberFormat('vi-VN').format(item.price)}đ</div>
                                    {item.isNew && <span className="text-[8px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded uppercase font-black">Mới</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 flex gap-3 sticky bottom-0">
                    <button onClick={handleFinish} className="flex-1 btn-primary h-12 shadow-lg font-black uppercase tracking-widest text-sm">
                        HOÀN TẤT & ĐÓNG
                    </button>
                </div>
            </div>
        </div>
    )
}
