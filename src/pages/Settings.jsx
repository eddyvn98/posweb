import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import { useNotification } from '../contexts/NotificationContext'

export default function Settings() {
    const { user, shop, updateShopInfo } = useAuth()
    const { showNotification } = useNotification()

    const [loading, setLoading] = useState(false)
    const [editingShop, setEditingShop] = useState(false)
    const [clearingCache, setClearingCache] = useState(false)
    const [changingPassword, setChangingPassword] = useState(false)

    const [shopData, setShopData] = useState({
        name: shop?.name || '',
        address: shop?.address || ''
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
                address: shop.address || ''
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
                address: shopData.address || null
            })

            updateShopInfo({
                name: shopData.name,
                address: shopData.address
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
                <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Settings</h1>
                <p className="text-gray-400 font-medium italic">Shop and account configuration</p>
            </div>

            <div className="max-w-2xl space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-pink-50 shadow-sm">
                    <h2 className="text-lg font-black text-gray-800 mb-4 uppercase">Account</h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">Email / Telegram ID</p>
                            <p className="text-gray-800 font-bold mt-1">{user?.email || user?.telegram_id}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-pink-50 shadow-sm">
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
                            className="w-full btn bg-primary text-white font-black rounded-2xl hover:bg-pink-600 transition disabled:opacity-50"
                        >
                            {changingPassword ? 'Saving...' : 'Change Password'}
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-pink-50 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-black text-gray-800 uppercase">Shop Info</h2>
                        {!editingShop && (
                            <button onClick={() => setEditingShop(true)} className="text-sm btn bg-pink-100 text-pink-600 font-bold px-3 py-1 rounded-xl hover:bg-pink-200 transition">
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
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setEditingShop(false)} className="flex-1 btn bg-gray-100 text-gray-700 font-black rounded-2xl hover:bg-gray-200 transition">Cancel</button>
                                <button type="submit" disabled={loading} className="flex-1 btn bg-primary text-white font-black rounded-2xl hover:bg-pink-600 transition disabled:opacity-50">
                                    {loading ? 'Saving...' : 'Save'}
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
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-3xl p-6 border border-pink-50 shadow-sm">
                    <h2 className="text-lg font-black text-gray-800 mb-4 uppercase">System</h2>
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                        <p className="text-sm font-bold text-blue-800 mb-1">Clear offline cache</p>
                        <p className="text-xs text-blue-700 mb-3">Server SQLite data will not be affected.</p>
                        <button onClick={handleClearCache} disabled={clearingCache} className="w-full btn bg-blue-500 text-white font-bold py-2 rounded-xl hover:bg-blue-600 transition disabled:opacity-50">
                            {clearingCache ? 'Clearing...' : 'Clear cache on this device'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
