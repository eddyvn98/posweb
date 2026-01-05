import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useNotification } from '../contexts/NotificationContext'
import { useDriveAuth, DriveLoginButton } from '../contexts/DriveContext'
import { BackupStatus, BackupButton } from '../components/BackupStatus'

export default function Settings() {
    const { user, shop } = useAuth()
    const { showNotification } = useNotification()
    const { isAuthed } = useDriveAuth()
    const [loading, setLoading] = useState(false)
    const [autoBackupEnabled, setAutoBackupEnabled] = useState(shop?.drive_auto_backup || false)
    const [shopData, setShopData] = useState({
        name: shop?.name || '',
        address: shop?.address || ''
    })
    const [editingShop, setEditingShop] = useState(false)
    const [clearingCache, setClearingCache] = useState(false)

    useEffect(() => {
        if (shop) {
            setShopData({
                name: shop.name || '',
                address: shop.address || ''
            })
        }
    }, [shop])

    const handleShopChange = (e) => {
        const { name, value } = e.target
        setShopData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSaveShop = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase
                .from('shops')
                .update({
                    name: shopData.name,
                    address: shopData.address || null
                })
                .eq('id', shop.id)

            if (error) throw error

            showNotification('✅ Cập nhật thông tin cửa hàng thành công', 'success')
            setEditingShop(false)
        } catch (err) {
            console.error('Error updating shop:', err)
            showNotification('❌ Lỗi khi cập nhật', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleClearCache = async () => {
        if (!window.confirm('⚠️ Xoá cache sẽ dừng đồng bộ hóa tạm thời. Tiếp tục?')) {
            return
        }

        setClearingCache(true)
        try {
            // Clear IndexedDB
            const request = indexedDB.databases()
            request.then(databases => {
                databases.forEach(db => {
                    if (db.name.includes('posweb')) {
                        indexedDB.deleteDatabase(db.name)
                    }
                })
            })

            // Clear localStorage (sync queue)
            if (localStorage.getItem('syncQueue')) {
                localStorage.removeItem('syncQueue')
            }
            if (localStorage.getItem('lastSyncTime')) {
                localStorage.removeItem('lastSyncTime')
            }

            showNotification('✅ Đã xoá cache offline. Làm mới trang để tải lại.', 'success')
        } catch (err) {
            console.error('Error clearing cache:', err)
            showNotification('❌ Lỗi khi xoá cache', 'error')
        } finally {
            setClearingCache(false)
        }
    }

    const handleToggleAutoBackup = async () => {
        try {
            setLoading(true)
            const { error } = await supabase
                .from('shops')
                .update({
                    drive_auto_backup: !autoBackupEnabled
                })
                .eq('id', shop.id)

            if (error) throw error

            setAutoBackupEnabled(!autoBackupEnabled)
            showNotification(
                !autoBackupEnabled 
                    ? '✅ Tự động sao lưu đã bật' 
                    : '✅ Tự động sao lưu đã tắt',
                'success'
            )
        } catch (err) {
            console.error('Error toggling auto backup:', err)
            showNotification('❌ Lỗi cập nhật cài đặt', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm p-4 sticky top-0 z-10 border-b">
                <h1 className="text-xl font-black text-gray-800 uppercase tracking-tighter">⚙️ Cài đặt</h1>
            </div>

            {/* Content */}
            <div className="p-4 max-w-2xl">
                {/* User Info */}
                <div className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
                    <h2 className="text-lg font-black text-gray-800 mb-4 uppercase">👤 Tài khoản</h2>

                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">Email</p>
                            <p className="text-gray-800 font-bold mt-1">{user?.email}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">Vai trò</p>
                            <p className="text-gray-800 font-bold mt-1">Chủ sở hữu</p>
                        </div>
                    </div>
                </div>

                {/* Shop Info */}
                <div className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-black text-gray-800 uppercase">🏪 Thông tin cửa hàng</h2>
                        {!editingShop && (
                            <button
                                onClick={() => setEditingShop(true)}
                                className="text-sm btn bg-blue-100 text-blue-600 font-bold px-3 rounded-lg hover:bg-blue-200 transition"
                            >
                                ✏️ Sửa
                            </button>
                        )}
                    </div>

                    {editingShop ? (
                        <form onSubmit={handleSaveShop} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Tên cửa hàng</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={shopData.name}
                                    onChange={handleShopChange}
                                    className="input w-full border-gray-200 focus:ring-primary focus:border-primary"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Địa chỉ (tuỳ chọn)</label>
                                <textarea
                                    name="address"
                                    value={shopData.address}
                                    onChange={handleShopChange}
                                    rows="2"
                                    className="input w-full border-gray-200 focus:ring-primary focus:border-primary resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingShop(false)}
                                    className="flex-1 btn bg-gray-100 text-gray-700 font-black rounded-xl hover:bg-gray-200 transition"
                                >
                                    Huỷ
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 btn bg-primary text-white font-black rounded-xl hover:bg-pink-600 transition disabled:opacity-50"
                                >
                                    {loading ? '⏳ Đang lưu...' : 'Lưu'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Tên cửa hàng</p>
                                <p className="text-gray-800 font-bold mt-1">{shopData.name}</p>
                            </div>
                            {shopData.address && (
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">Địa chỉ</p>
                                    <p className="text-gray-800 font-bold mt-1">{shopData.address}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Data & Cache */}
                <div className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
                    <h2 className="text-lg font-black text-gray-800 mb-4 uppercase">💾 Dữ liệu & Cache</h2>

                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                            <p className="text-sm font-bold text-blue-800 mb-3">ℹ️ Xoá cache offline (IndexedDB)</p>
                            <p className="text-xs text-blue-700 mb-3">
                                Xoá dữ liệu tạm thời được lưu trên thiết bị. Dữ liệu trên server không bị ảnh hưởng.
                            </p>
                            <button
                                onClick={handleClearCache}
                                disabled={clearingCache}
                                className="w-full btn bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {clearingCache ? '⏳ Đang xoá...' : '🗑️ Xoá cache'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Export */}
                <div className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
                    <h2 className="text-lg font-black text-gray-800 mb-4 uppercase">📊 Xuất dữ liệu</h2>

                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                        <p className="text-sm font-bold text-green-800 mb-3">📥 Xuất báo cáo tháng</p>
                        <p className="text-xs text-green-700 mb-3">
                            Xuất báo cáo tháng hiện tại dưới dạng Excel (6 sheet) phù hợp với yêu cầu thuế.
                        </p>
                        <p className="text-xs text-gray-500 mb-3">
                            Tính năng này có sẵn trong mục "Thống kê" - chọn tháng rồi nhấn "📊 Xuất báo cáo tháng"
                        </p>
                    </div>
                </div>

                {/* Google Drive Backup */}
                <div className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
                    <h2 className="text-lg font-black text-gray-800 mb-4 uppercase">☁️ Google Drive Backup</h2>

                    <div className="space-y-4">
                        {/* Drive Auth */}
                        <div className="mb-4">
                            <p className="text-xs text-gray-600 font-bold mb-3">ĐĂNG NHẬP GOOGLE DRIVE</p>
                            <DriveLoginButton />
                        </div>

                        {/* Auto Backup Toggle */}
                        {isAuthed && (
                            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-bold text-blue-800">
                                        ☑️ Tự động sao lưu hàng tháng
                                    </label>
                                    <button
                                        onClick={handleToggleAutoBackup}
                                        disabled={loading}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            autoBackupEnabled ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                autoBackupEnabled ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                                <p className="text-xs text-blue-700">
                                    {autoBackupEnabled 
                                        ? '✓ Sẽ tự động sao lưu vào ngày 1 hàng tháng lúc 02:00 sáng (GMT+7)'
                                        : 'Nếu bật, sẽ tự động sao lưu vào ngày 1 hàng tháng'
                                    }
                                </p>
                            </div>
                        )}

                        {/* Manual Backup */}
                        {isAuthed && (
                            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                                <p className="text-sm font-bold text-purple-800 mb-3">💾 Sao lưu thủ công</p>
                                <p className="text-xs text-purple-700 mb-3">
                                    Chọn tháng cần sao lưu và bấm nút để lưu file lên Google Drive ngay.
                                </p>
                                <BackupButton
                                    shopId={shop?.id}
                                    shopName={shop?.name}
                                    supabase={supabase}
                                    onBackupSuccess={() => {
                                        showNotification('✅ Sao lưu thành công', 'success')
                                    }}
                                    onBackupError={(err) => {
                                        showNotification(`❌ Lỗi: ${err.message}`, 'error')
                                    }}
                                />
                            </div>
                        )}

                        {/* Backup Status */}
                        {isAuthed && (
                            <div>
                                <p className="text-xs text-gray-600 font-bold mb-2">LỊCH SỬ SAO LƯU</p>
                                <BackupStatus shopId={shop?.id} supabase={supabase} />
                            </div>
                        )}

                        {!isAuthed && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                                <p className="text-sm font-bold text-yellow-800 mb-2">⚠️ Chưa đăng nhập Google Drive</p>
                                <p className="text-xs text-yellow-700">
                                    Đăng nhập Google Drive ở trên để sử dụng tính năng sao lưu tự động.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Help */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100">
                    <h2 className="text-lg font-black text-gray-800 mb-4 uppercase">❓ Trợ giúp</h2>

                    <div className="space-y-4 text-sm">
                        <div>
                            <p className="font-bold text-gray-800">Dữ liệu của tôi an toàn không?</p>
                            <p className="text-gray-600 mt-1">Dữ liệu được lưu trên server Supabase (bảo mật). Xoá cache chỉ ảnh hưởng dữ liệu tạm thời trên thiết bị.</p>
                        </div>

                        <div>
                            <p className="font-bold text-gray-800">Có thể xoá toàn bộ dữ liệu không?</p>
                            <p className="text-gray-600 mt-1">Không. Hệ thống được thiết kế để bảo vệ dữ liệu. Liên hệ quản trị viên nếu cần hỗ trợ.</p>
                        </div>

                        <div>
                            <p className="font-bold text-gray-800">Báo cáo có tính VAT không?</p>
                            <p className="text-gray-600 mt-1">Không. Báo cáo chỉ hiển thị doanh thu thực tế, không bao gồm VAT hay lợi nhuận kế toán.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
