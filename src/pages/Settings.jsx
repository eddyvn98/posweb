import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import { useNotification } from '../contexts/NotificationContext'
import ProductImage from '../components/ProductForm/ProductImage'
import { getProductImageUrl } from '../lib/imageUtils'
import { DEFAULT_PRINTER_SETTINGS, getPrinterSettings, PRINT_PAPER_SIZES, savePrinterSettings } from '../lib/printerSettings'
import { FEATURE_KEYS, hasFeatureEnabled, parseFeatureFlags } from '../lib/featureFlags'

export default function Settings() {
    const { user, shop, updateShopInfo } = useAuth()
    const { showNotification } = useNotification()

    const [loading, setLoading] = useState(false)
    const [editingShop, setEditingShop] = useState(false)
    const [clearingCache, setClearingCache] = useState(false)
    const [changingPassword, setChangingPassword] = useState(false)
    const [savingPrinter, setSavingPrinter] = useState(false)

    const [shopData, setShopData] = useState({
        name: shop?.name || '',
        address: shop?.address || '',
        bank_name: shop?.bank_name || '',
        bank_account_name: shop?.bank_account_name || '',
        bank_account_number: shop?.bank_account_number || '',
        bank_qr_url: shop?.bank_qr_url || '',
        feature_flags: shop?.feature_flags || '{}'
    })

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [printerData, setPrinterData] = useState(DEFAULT_PRINTER_SETTINGS)

    useEffect(() => {
        if (shop) {
            setShopData({
                name: shop.name || '',
                address: shop.address || '',
                bank_name: shop.bank_name || '',
                bank_account_name: shop.bank_account_name || '',
                bank_account_number: shop.bank_account_number || '',
                bank_qr_url: shop.bank_qr_url || '',
                feature_flags: shop.feature_flags || '{}'
            })
        }
    }, [shop])

    useEffect(() => {
        setPrinterData(getPrinterSettings())
    }, [])

    const handleShopChange = (e) => {
        const { name, value } = e.target
        setShopData(prev => ({ ...prev, [name]: value }))
    }

    const handleSaveShop = async (e) => {
        if (e) e.preventDefault()
        setLoading(true)
        try {
            let finalQrUrl = shopData.bank_qr_url
            // If it's a data URL, upload it first
            if (shopData.bank_qr_url && shopData.bank_qr_url.startsWith('data:image')) {
                try {
                    const uploadRes = await api.post('/products/upload-image', { image: shopData.bank_qr_url })
                    if (uploadRes.data.success) {
                        finalQrUrl = `tg_file_id:${uploadRes.data.file_id}`
                    }
                } catch (uploadErr) {
                    console.error('QR upload failed:', uploadErr)
                }
            }

            const payload = {
                name: shopData.name,
                address: shopData.address || null,
                bank_name: shopData.bank_name || null,
                bank_account_name: shopData.bank_account_name || null,
                bank_account_number: shopData.bank_account_number || null,
                bank_qr_url: finalQrUrl || null,
                feature_flags: shopData.feature_flags
            }

            await api.patch('/auth/shop', payload)

            updateShopInfo(payload)

            showNotification('Cập nhật thông tin cửa hàng thành công', 'success')
            setEditingShop(false)
        } catch (err) {
            showNotification('Cập nhật thất bại: ' + (err.response?.data?.error || err.message), 'error')
        } finally {
            setLoading(false)
        }
    }

    const handlePasswordChange = (e) => {
        const { name, value } = e.target
        setPasswordData(prev => ({ ...prev, [name]: value }))
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()

        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            showNotification('Vui lòng nhập đầy đủ các trường mật khẩu', 'error')
            return
        }

        if (passwordData.newPassword.length < 8) {
            showNotification('Mật khẩu mới phải có ít nhất 8 ký tự', 'error')
            return
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showNotification('Mật khẩu xác nhận không khớp', 'error')
            return
        }

        setChangingPassword(true)
        try {
            await api.patch('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            })
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
            showNotification('Đổi mật khẩu thành công', 'success')
        } catch (err) {
            showNotification('Đổi mật khẩu thất bại: ' + (err.response?.data?.error || err.message), 'error')
        } finally {
            setChangingPassword(false)
        }
    }

    const handleClearCache = async () => {
        if (!window.confirm('Xóa bộ nhớ đệm ngoại tuyến trên thiết bị này?')) return
        setClearingCache(true)
        try {
            const databases = await indexedDB.databases()
            databases.forEach(db => {
                if (db.name && (db.name.includes('posweb') || db.name === 'pos_db')) {
                    indexedDB.deleteDatabase(db.name)
                }
            })
            localStorage.removeItem('syncQueue')
            localStorage.removeItem('lastSyncTime')
            showNotification('Đã xóa bộ nhớ đệm. Vui lòng tải lại trang để làm mới.', 'success')
        } catch (err) {
            showNotification('Lỗi khi xóa bộ nhớ đệm', 'error')
        } finally {
            setClearingCache(false)
        }
    }

    const handlePrinterChange = (e) => {
        const { name, value, type, checked } = e.target
        setPrinterData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'fontSize' ? Number(value) : value),
        }))
    }

    const handleSavePrinter = (e) => {
        e.preventDefault()
        setSavingPrinter(true)
        try {
            savePrinterSettings(printerData)
            showNotification('Đã lưu cấu hình in hóa đơn', 'success')
        } catch (error) {
            console.error('Save printer settings error:', error)
            showNotification('Lỗi khi lưu cấu hình in', 'error')
        } finally {
            setSavingPrinter(false)
        }
    }

    const handleFeatureToggle = (featureKey) => {
        const currentFlags = parseFeatureFlags(shopData.feature_flags)
        const newFlags = { ...currentFlags, [featureKey]: !currentFlags[featureKey] }
        const newFlagsStr = JSON.stringify(newFlags)
        
        setShopData(prev => ({ ...prev, feature_flags: newFlagsStr }))
        
        // Auto-save feature flags immediately
        const payload = {
            name: shopData.name,
            address: shopData.address || null,
            bank_name: shopData.bank_name || null,
            bank_account_name: shopData.bank_account_name || null,
            bank_account_number: shopData.bank_account_number || null,
            bank_qr_url: shopData.bank_qr_url || null,
            feature_flags: newFlagsStr
        }
        
        api.patch('/auth/shop', payload).then(() => {
            updateShopInfo({ feature_flags: newFlagsStr })
            showNotification('Đã cập nhật cấu hình chức năng', 'success')
        }).catch(err => {
            showNotification('Lỗi khi cập nhật chức năng', 'error')
        })
    }

    return (
        <div className="min-h-screen bg-transparent pb-20 p-4">
            <div className="mb-6 mt-2">
                <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Cài đặt</h1>
                <p className="text-gray-400 font-medium italic">Cấu hình cửa hàng và tài khoản</p>
            </div>

            <div className="max-w-2xl space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-pink-50 shadow-sm">
                    <h2 className="text-lg font-black text-gray-800 mb-4 uppercase">Tài khoản</h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">Email / ID Telegram</p>
                            <p className="text-gray-800 font-bold mt-1">{user?.email || user?.telegram_id}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-pink-50 shadow-sm">
                    <h2 className="text-lg font-black text-gray-800 mb-4 uppercase">Đổi mật khẩu</h2>
                    <form onSubmit={handleChangePassword} className="space-y-3">
                        <input
                            type="password"
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            className="input w-full"
                            placeholder="Mật khẩu hiện tại"
                            autoComplete="current-password"
                        />
                        <input
                            type="password"
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            className="input w-full"
                            placeholder="Mật khẩu mới (tối thiểu 8 ký tự)"
                            autoComplete="new-password"
                        />
                        <input
                            type="password"
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            className="input w-full"
                            placeholder="Xác nhận mật khẩu mới"
                            autoComplete="new-password"
                        />
                        <button
                            type="submit"
                            disabled={changingPassword}
                            className="w-full btn bg-primary text-white font-black rounded-2xl hover:bg-pink-600 transition disabled:opacity-50"
                        >
                            {changingPassword ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-pink-50 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-black text-gray-800 uppercase">Thông tin cửa hàng</h2>
                        {!editingShop && (
                            <button onClick={() => setEditingShop(true)} className="text-sm btn bg-pink-100 text-pink-600 font-bold px-3 py-1 rounded-xl hover:bg-pink-200 transition">
                                Chỉnh sửa
                            </button>
                        )}
                    </div>

                    {editingShop ? (
                        <form onSubmit={handleSaveShop} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Tên cửa hàng</label>
                                <input type="text" name="name" value={shopData.name} onChange={handleShopChange} className="input w-full" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Địa chỉ</label>
                                <textarea name="address" value={shopData.address} onChange={handleShopChange} rows="2" className="input w-full resize-none" />
                            </div>
                            
                            <div className="pt-4 border-t border-gray-100 space-y-4">
                                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Thông tin ngân hàng (để tạo QR)</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Ngân hàng</label>
                                        <input type="text" name="bank_name" value={shopData.bank_name} onChange={handleShopChange} placeholder="Ví dụ: Vietcombank" className="input w-full text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Số tài khoản</label>
                                        <input type="text" name="bank_account_number" value={shopData.bank_account_number} onChange={handleShopChange} placeholder="Số tài khoản" className="input w-full text-sm" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Chủ tài khoản</label>
                                        <input type="text" name="bank_account_name" value={shopData.bank_account_name} onChange={handleShopChange} placeholder="HỌ VÀ TÊN" className="input w-full text-sm uppercase" />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Hình ảnh mã QR</label>
                                    <ProductImage imageUrl={shopData.bank_qr_url} onChange={(url) => setShopData(prev => ({ ...prev, bank_qr_url: url }))} />
                                    <p className="text-[9px] text-gray-400 mt-1 italic">* Tải ảnh mã QR ngân hàng tĩnh của bạn lên đây.</p>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setEditingShop(false)} className="flex-1 btn bg-gray-100 text-gray-700 font-black rounded-2xl hover:bg-gray-200 transition">Hủy</button>
                                <button type="submit" disabled={loading} className="flex-1 btn bg-primary text-white font-black rounded-2xl hover:bg-pink-600 transition disabled:opacity-50">
                                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Tên cửa hàng</p>
                                <p className="text-gray-800 font-bold mt-1 text-lg">{shopData.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Địa chỉ</p>
                                <p className="text-gray-800 font-bold mt-1">{shopData.address || 'Chưa thiết lập'}</p>
                            </div>
                            {(shopData.bank_name || shopData.bank_account_number) && (
                                <div className="pt-3 border-t border-gray-50 space-y-3">
                                    <h3 className="text-xs font-black text-primary uppercase tracking-widest">Thông tin chuyển khoản</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Ngân hàng</p>
                                            <p className="text-gray-800 font-bold text-sm">{shopData.bank_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Số tài khoản</p>
                                            <p className="text-gray-800 font-bold text-sm">{shopData.bank_account_number}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Chủ tài khoản</p>
                                            <p className="text-gray-800 font-bold text-sm uppercase">{shopData.bank_account_name}</p>
                                        </div>
                                    </div>
                                    {shopData.bank_qr_url && (
                                        <div className="mt-2 w-32 h-32 rounded-2xl overflow-hidden border border-gray-100">
                                            <img src={getProductImageUrl(shopData.bank_qr_url)} alt="QR Code" className="w-full h-full object-contain bg-white" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-3xl p-6 border border-pink-50 shadow-sm">
                    <h2 className="text-lg font-black text-gray-800 mb-4 uppercase">In hóa đơn</h2>
                    <form onSubmit={handleSavePrinter} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Khổ giấy mặc định</label>
                            <select
                                name="paperSize"
                                value={printerData.paperSize}
                                onChange={handlePrinterChange}
                                className="input w-full"
                            >
                                <option value={PRINT_PAPER_SIZES.MM58}>Máy in nhiệt 58mm</option>
                                <option value={PRINT_PAPER_SIZES.MM80}>Máy in nhiệt 80mm</option>
                                <option value={PRINT_PAPER_SIZES.A4}>Máy in A4 / Laser</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Cỡ chữ hóa đơn ({printerData.fontSize}px)
                            </label>
                            <input
                                type="range"
                                min="9"
                                max="14"
                                step="1"
                                name="fontSize"
                                value={printerData.fontSize}
                                onChange={handlePrinterChange}
                                className="w-full"
                            />
                        </div>

                        <label className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <input
                                type="checkbox"
                                name="showFooterNote"
                                checked={printerData.showFooterNote}
                                onChange={handlePrinterChange}
                                className="h-4 w-4"
                            />
                            <span className="text-sm font-semibold text-gray-700">
                                Hiện lời cảm ơn ở cuối hóa đơn
                            </span>
                        </label>

                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 leading-relaxed">
                            Mẹo in chuẩn: trong hộp thoại in chọn đúng khổ giấy, để Scale 100%, Margins None và bỏ Header/Footer của trình duyệt.
                        </div>

                        <button
                            type="submit"
                            disabled={savingPrinter}
                            className="w-full btn bg-primary text-white font-black rounded-2xl hover:bg-pink-600 transition disabled:opacity-50"
                        >
                            {savingPrinter ? 'Đang lưu...' : 'Lưu cấu hình in'}
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-pink-50 shadow-sm">
                    <h2 className="text-lg font-black text-gray-800 mb-4 uppercase">Nâng cao</h2>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-black text-gray-800">Quản lý công nợ nhà cung cấp</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Bật nếu shop cần theo dõi dư nợ, nợ đầu kỳ và trả nợ NCC. Tắt sẽ ẩn các phần liên quan công nợ.
                                </p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={hasFeatureEnabled(shopData.feature_flags, FEATURE_KEYS.SUPPLIER_DEBT)}
                                onClick={() => handleFeatureToggle(FEATURE_KEYS.SUPPLIER_DEBT)}
                                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors ${hasFeatureEnabled(shopData.feature_flags, FEATURE_KEYS.SUPPLIER_DEBT) ? 'bg-primary' : 'bg-gray-300'}`}
                            >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${hasFeatureEnabled(shopData.feature_flags, FEATURE_KEYS.SUPPLIER_DEBT) ? 'translate-x-6 mt-1' : 'translate-x-1 mt-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-pink-50 shadow-sm">
                    <h2 className="text-lg font-black text-gray-800 mb-4 uppercase">Hệ thống</h2>
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                        <p className="text-sm font-bold text-blue-800 mb-1">Xóa bộ nhớ đệm ngoại tuyến</p>
                        <p className="text-xs text-blue-700 mb-3">Dữ liệu trên máy chủ (SQLite) sẽ không bị ảnh hưởng.</p>
                        <button onClick={handleClearCache} disabled={clearingCache} className="w-full btn bg-blue-500 text-white font-bold py-2 rounded-xl hover:bg-blue-600 transition disabled:opacity-50">
                            {clearingCache ? 'Đang xóa...' : 'Xóa cache trên thiết bị này'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
