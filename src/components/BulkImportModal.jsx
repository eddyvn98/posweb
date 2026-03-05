import { useState, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'
import { findProductByBarcode, saveProductLocal } from '../lib/db'
import { useNotification } from '../contexts/NotificationContext'
import { useScanBarcode } from '../hooks/useScanBarcode'
import BarcodeScanner from './BarcodeScanner'

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

    // 🚀 Enable Bluetooth/External Scanner
    useScanBarcode({
        onScan: (code) => handleScan(code),
        enabled: !isClosed
    })

    const handleScan = async (code, isCamera = false) => {
        if (scanLock.current || isClosed) return
        scanLock.current = true

        try {
            const existing = await findProductByBarcode(code)

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
                    id: existing?.id || uuidv4(),
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
                id: existing?.id || uuidv4(),
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
                id: item.id,
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
                    <h2 className="text-xl font-bold">📦 Nhập kho nhanh</h2>
                    <button onClick={onClose} className="text-gray-400 text-2xl">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => setShowCamera(!showCamera)}
                            className={`btn text-xs font-bold h-9 rounded-xl border transition-all ${showCamera ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}
                        >
                            {showCamera ? '🛑 Tắt Camera' : '📷 Mở Camera để quét'}
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
                        {scannedItems.length === 0 && <p className="text-center text-gray-400 py-10 italic text-sm">Hãy bóp cò máy quét để bắt đầu...</p>}
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
