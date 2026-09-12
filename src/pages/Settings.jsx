import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import { useNotification } from '../contexts/NotificationContext'
import InvoiceModal from '../components/InvoiceModal'
import { Printer } from 'lucide-react'

export default function Settings() {
    const { user, shop, updateShopInfo } = useAuth()
    const { showNotification } = useNotification()

    const [loading, setLoading] = useState(false)
    const [editingShop, setEditingShop] = useState(false)
    const [clearingCache, setClearingCache] = useState(false)
    const [changingPassword, setChangingPassword] = useState(false)
    const [testSale, setTestSale] = useState(null)

    const [shopData, setShopData] = useState({
        name: shop?.name || '',
        address: shop?.address || '',
        phone: shop?.phone || '',
        zalo_url: shop?.zalo_url || '',
        opening_hours: shop?.opening_hours || '',
        pickup_available: shop?.pickup_available !== false,
        delivery_note: shop?.delivery_note || '',
        shipping_fee: shop?.shipping_fee || '',
        free_shipping_threshold: shop?.free_shipping_threshold || '',
        bank_name: shop?.bank_name || '',
        bank_account: shop?.bank_account || '',
        bank_owner: shop?.bank_owner || '',
    })

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    useEffect(() => {
        if (shop) {
            setShopData({
                name: shop.name || '',
                address: shop.address || '',
                phone: shop.phone || '',
                zalo_url: shop.zalo_url || '',
                opening_hours: shop.opening_hours || '',
                pickup_available: shop.pickup_available !== false,
                delivery_note: shop.delivery_note || '',
                shipping_fee: shop.shipping_fee || '',
                free_shipping_threshold: shop.free_shipping_threshold || '',
                bank_name: shop.bank_name || '',
                bank_account: shop.bank_account || '',
                bank_owner: shop.bank_owner || '',
            })
        }
    }, [shop])

    const handleShopChange = (e) => {
        const { name, value } = e.target
        setShopData(prev => ({ ...prev, [name]: value }))
    }

    const handleSaveShop = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await api.patch('/auth/shop', {
                name: shopData.name,
                address: shopData.address || null,
                phone: shopData.phone || null,
                zalo_url: shopData.zalo_url || null,
                opening_hours: shopData.opening_hours || null,
                pickup_available: shopData.pickup_available,
                delivery_note: shopData.delivery_note || null,
                shipping_fee: shopData.shipping_fee ? Number(shopData.shipping_fee) : null,
                free_shipping_threshold: shopData.free_shipping_threshold ? Number(shopData.free_shipping_threshold) : null,
                bank_name: shopData.bank_name || null,
                bank_account: shopData.bank_account || null,
                bank_owner: shopData.bank_owner || null,
            })

            updateShopInfo({
                name: shopData.name,
                address: shopData.address,
                phone: shopData.phone,
                zalo_url: shopData.zalo_url,
                opening_hours: shopData.opening_hours,
                pickup_available: shopData.pickup_available,
                delivery_note: shopData.delivery_note,
                shipping_fee: shopData.shipping_fee ? Number(shopData.shipping_fee) : null,
                free_shipping_threshold: shopData.free_shipping_threshold ? Number(shopData.free_shipping_threshold) : null,
                bank_name: shopData.bank_name,
                bank_account: shopData.bank_account,
                bank_owner: shopData.bank_owner,
            })

            showNotification('Updated shop info successfully', 'success')
            setEditingShop(false)
        } catch (err) {
            showNotification('Update failed: ' + (err.response?.data?.error || err.message), 'error')
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
            showNotification('Please fill all password fields', 'error')
            return
        }

        if (passwordData.newPassword.length < 8) {
            showNotification('New password must be at least 8 characters', 'error')
            return
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showNotification('Confirm password does not match', 'error')
            return
        }

        setChangingPassword(true)
        try {
            await api.patch('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            })
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
            showNotification('Password changed successfully', 'success')
        } catch (err) {
            showNotification('Change password failed: ' + (err.response?.data?.error || err.message), 'error')
        } finally {
            setChangingPassword(false)
        }
    }

    const handleClearCache = async () => {
        if (!window.confirm('Clear offline cache on this device?')) return
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
            showNotification('Offline cache cleared. Reload page to refresh.', 'success')
        } catch (err) {
            showNotification('Error clearing cache', 'error')
        } finally {
            setClearingCache(false)
        }
    }

    return (
        <div className="min-h-screen bg-transparent pb-20 p-4">
            <div className="mb-6 mt-2">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Cài đặt</h1>
                <p className="text-xs text-gray-500 font-medium">Cấu hình cửa hàng và tài khoản</p>
            </div>

            <div className="max-w-2xl space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-sky-50 shadow-sm">
                    <h2 className="text-lg font-black text-gray-800 mb-4 uppercase">Account</h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">Email / Telegram ID</p>
                            <p className="text-gray-800 font-bold mt-1">{user?.email || user?.telegram_id}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-sky-50 shadow-sm">
                    <h2 className="text-lg font-black text-gray-800 mb-4 uppercase">Change Password</h2>
                    <form onSubmit={handleChangePassword} className="space-y-3">
                        <input
                            type="password"
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            className="input w-full"
                            placeholder="Current password"
                            autoComplete="current-password"
                        />
                        <input
                            type="password"
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            className="input w-full"
                            placeholder="New password (min 8 chars)"
                            autoComplete="new-password"
                        />
                        <input
                            type="password"
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            className="input w-full"
                            placeholder="Confirm new password"
                            autoComplete="new-password"
                        />
                        <button
                            type="submit"
                            disabled={changingPassword}
                            className="w-full btn bg-primary text-white font-black rounded-2xl hover:bg-sky-700 transition disabled:opacity-50"
                        >
                            {changingPassword ? 'Saving...' : 'Change Password'}
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-sky-50 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-black text-gray-800 uppercase">Shop Info</h2>
                        {!editingShop && (
                            <button onClick={() => setEditingShop(true)} className="text-sm btn bg-sky-100 text-sky-700 font-bold px-3 py-1 rounded-xl hover:bg-sky-200 transition">
                                Edit
                            </button>
                        )}
                    </div>

                    {editingShop ? (
                        <form onSubmit={handleSaveShop} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Shop name</label>
                                <input type="text" name="name" value={shopData.name} onChange={handleShopChange} className="input w-full" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
                                <textarea name="address" value={shopData.address} onChange={handleShopChange} rows="2" className="input w-full resize-none" />
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                                    <input type="tel" name="phone" value={shopData.phone} onChange={handleShopChange} className="input w-full" placeholder="09xx xxx xxx" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Zalo link</label>
                                    <input type="url" name="zalo_url" value={shopData.zalo_url} onChange={handleShopChange} className="input w-full" placeholder="https://zalo.me/..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Opening hours</label>
                                    <input type="text" name="opening_hours" value={shopData.opening_hours} onChange={handleShopChange} className="input w-full" placeholder="08:00 - 21:00" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Delivery note</label>
                                    <input type="text" name="delivery_note" value={shopData.delivery_note} onChange={handleShopChange} className="input w-full" placeholder="Giao quanh Quận 12" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Shipping fee</label>
                                    <input type="number" name="shipping_fee" value={shopData.shipping_fee} onChange={handleShopChange} min="0" className="input w-full" placeholder="Để trống nếu báo sau" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Free shipping from</label>
                                    <input type="number" name="free_shipping_threshold" value={shopData.free_shipping_threshold} onChange={handleShopChange} min="0" className="input w-full" placeholder="Ví dụ: 299000" />
                                </div>
                            </div>
                            <label className="flex items-center gap-3 text-sm font-bold text-gray-700">
                                <input type="checkbox" name="pickup_available" checked={shopData.pickup_available} onChange={(event) => setShopData((current) => ({ ...current, pickup_available: event.target.checked }))} />
                                Cho phép nhận hàng tại shop
                            </label>
                            <div className="border-t border-gray-100 pt-4">
                                <p className="mb-3 text-xs font-black uppercase text-gray-500">Bank transfer details</p>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <input type="text" name="bank_name" value={shopData.bank_name} onChange={handleShopChange} className="input w-full" placeholder="Tên ngân hàng" />
                                    <input type="text" name="bank_account" value={shopData.bank_account} onChange={handleShopChange} className="input w-full" placeholder="Số tài khoản" />
                                    <input type="text" name="bank_owner" value={shopData.bank_owner} onChange={handleShopChange} className="input w-full" placeholder="Chủ tài khoản" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setEditingShop(false)} className="flex-1 btn-secondary h-11 font-bold">Hủy</button>
                                <button type="submit" disabled={loading} className="flex-1 btn-primary h-11 font-bold">
                                    {loading ? 'Đang lưu...' : 'Lưu'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Shop name</p>
                                <p className="text-gray-800 font-bold mt-1 text-lg">{shopData.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Address</p>
                                <p className="text-gray-800 font-bold mt-1">{shopData.address || 'Not set'}</p>
                            </div>
                            {shopData.phone && <div><p className="text-xs text-gray-500 font-bold uppercase">Phone</p><p className="text-gray-800 font-bold mt-1">{shopData.phone}</p></div>}
                            {shopData.opening_hours && <div><p className="text-xs text-gray-500 font-bold uppercase">Opening hours</p><p className="text-gray-800 font-bold mt-1">{shopData.opening_hours}</p></div>}
                            {shopData.delivery_note && <div><p className="text-xs text-gray-500 font-bold uppercase">Delivery</p><p className="text-gray-800 font-bold mt-1">{shopData.delivery_note}</p></div>}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-3xl p-6 border border-sky-50 shadow-sm">
                    <h2 className="text-lg font-black text-gray-800 mb-4 uppercase flex items-center gap-2">
                        <Printer className="w-5 h-5 text-primary" /> Máy in hóa đơn
                    </h2>
                    <p className="text-xs text-gray-500 mb-4">
                        POSWeb hỗ trợ in trực tiếp qua trình duyệt web trên tất cả loại máy in nhiệt (K80, K57, Xprinter, Epson, Canon...).
                    </p>
                    
                    <div className="space-y-4">
                        <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100 space-y-2">
                            <p className="text-xs font-bold text-gray-700 uppercase">Cấu hình in khuyến nghị:</p>
                            <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                                <li><strong>Khổ giấy:</strong> Chọn <span className="text-primary font-bold">80mm (K80)</span> hoặc <span className="text-primary font-bold">58mm (K57)</span></li>
                                <li><strong>Lề (Margins):</strong> Chọn <span className="text-primary font-bold">None</span> (Không lề)</li>
                                <li><strong>Đầu/Chân trang (Headers & Footers):</strong> <span className="text-red-500 font-bold">Bỏ tích</span></li>
                            </ul>
                        </div>

                        <button
                            type="button"
                            onClick={() => setTestSale({
                                code: 'TEST-8888',
                                created_at: new Date().toISOString(),
                                total_amount: 150000,
                                payment_method: 'cash',
                                items: [
                                    { product_name: 'Sản phẩm thử nghiệm 1', quantity: 2, price: 50000 },
                                    { product_name: 'Sản phẩm thử nghiệm 2', quantity: 1, price: 50000 }
                                ]
                            })}
                            className="w-full btn bg-sky-600 text-white font-black py-3 rounded-2xl hover:bg-sky-700 transition shadow-md shadow-sky-100 flex items-center justify-center gap-2"
                        >
                            <Printer className="w-4 h-4" /> <span>In thử hóa đơn mẫu</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-sky-50 shadow-sm">
                    <h2 className="text-lg font-black text-gray-800 mb-4 uppercase">System</h2>
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                        <p className="text-sm font-bold text-blue-800 mb-1">Clear offline cache</p>
                        <p className="text-xs text-blue-700 mb-3">Server SQLite data will not be affected.</p>
                        <button onClick={handleClearCache} disabled={clearingCache} className="w-full btn-primary h-10 font-bold">
                            {clearingCache ? 'Clearing...' : 'Clear cache on this device'}
                        </button>
                    </div>
                </div>
            </div>

            {testSale && (
                <InvoiceModal
                    sale={testSale}
                    onClose={() => setTestSale(null)}
                />
            )}
        </div>
    )
}
