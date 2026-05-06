import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import { useNotification } from '../contexts/NotificationContext'
import SEO from '../components/SEO'
import { Copy, Trash2, Crown, User } from '../components/Icons'

export default function Staff() {
    const { user, isGuest } = useAuth()
    const { showNotification } = useNotification()
    const [staffList, setStaffList] = useState([])
    const [inviteCodes, setInviteCodes] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)

    const isOwner = user?.role === 'owner'

    const [inviteRole, setInviteRole] = useState('staff_sales')

    const roleMap = {
        'owner': 'Chủ Shop',
        'staff': 'Nhân viên',
        'staff_sales': 'Bán hàng',
        'staff_warehouse': 'Kho',
    }

    const roleColorMap = {
        'owner': 'bg-amber-100 text-amber-700',
        'staff': 'bg-blue-100 text-blue-700',
        'staff_sales': 'bg-green-100 text-green-700',
        'staff_warehouse': 'bg-purple-100 text-purple-700',
    }

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        if (isGuest) {
            setStaffList([])
            setInviteCodes([])
            setLoading(false)
            return
        }

        setLoading(true)
        try {
            const staffRes = await api.get('/staff')
            setStaffList(staffRes.data.staff || [])

            if (isOwner) {
                const codesRes = await api.get('/staff/invite-codes')
                setInviteCodes(codesRes.data.codes || [])
            }
        } catch (err) {
            console.error('Fetch staff error:', err)
            showNotification('Không thể tải dữ liệu nhân sự', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateInvite = async () => {
        setActionLoading(true)
        try {
            const res = await api.post('/staff/invite', { role: inviteRole })
            if (res.data.success) {
                showNotification(`Đã tạo mã mời cho quyền ${roleMap[inviteRole]}`, 'success')
                setInviteCodes(prev => [res.data.invite, ...prev])
            }
        } catch (err) {
            showNotification('Lỗi khi tạo mã mời: ' + (err.response?.data?.error || err.message), 'error')
        } finally {
            setActionLoading(false)
        }
    }

    const handleUpdateRole = async (memberId, newRole) => {
        setActionLoading(true)
        try {
            await api.patch(`/staff/${memberId}/role`, { role: newRole })
            showNotification('Đã cập nhật quyền hạn', 'success')
            setStaffList(prev => prev.map(s => s.id === memberId ? { ...s, role: newRole } : s))
        } catch (err) {
            showNotification('Lỗi khi cập nhật: ' + (err.response?.data?.error || err.message), 'error')
        } finally {
            setActionLoading(false)
        }
    }
    const handleDeleteInvite = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa mã mời này?')) return
        setActionLoading(true)
        try {
            await api.delete(`/staff/invite/${id}`)
            showNotification('Đã xóa mã mời', 'success')
            setInviteCodes(prev => prev.filter(c => c.id !== id))
        } catch (err) {
            showNotification('Lỗi khi xóa: ' + (err.response?.data?.error || err.message), 'error')
        } finally {
            setActionLoading(false)
        }
    }

    const handleDeleteStaff = async (id, email) => {
        if (!window.confirm(`Bạn có chắc muốn xóa nhân viên ${email} khỏi cửa hàng?`)) return
        setActionLoading(true)
        try {
            await api.delete(`/staff/${id}`)
            showNotification('Đã xóa nhân viên', 'success')
            setStaffList(prev => prev.filter(s => s.id !== id))
        } catch (err) {
            showNotification('Lỗi khi xóa: ' + (err.response?.data?.error || err.message), 'error')
        } finally {
            setActionLoading(false)
        }
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
        showNotification('Đã sao chép mã mời', 'success')
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-transparent p-4 pb-20">
            <SEO title="Nhân sự - POSWeb Free" />
            
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="mt-2 mb-4">
                    <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Nhân sự</h1>
                    <p className="text-gray-400 font-medium italic">Quản lý đội ngũ & quyền hạn</p>
                </div>
                {/* Invite Code Section (Owner Only) */}
                {isOwner && (
                    <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden text-white">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                        
                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                <div>
                                    <h2 className="text-xl font-black mb-1 uppercase tracking-tight">Mời nhân viên mới</h2>
                                    <p className="text-gray-400 text-xs font-medium">Chọn quyền hạn và tạo mã mời</p>
                                </div>
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <select 
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value)}
                                        className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-primary transition-all flex-1 md:flex-none"
                                    >
                                        <option value="staff_sales" className="text-black">Nhân viên Bán hàng</option>
                                        <option value="staff_warehouse" className="text-black">Nhân viên Kho</option>
                                        <option value="staff" className="text-black">Nhân viên Tổng hợp</option>
                                    </select>
                                    <button
                                        onClick={handleCreateInvite}
                                        disabled={actionLoading}
                                        className="bg-primary text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-pink-500/20 disabled:opacity-50 whitespace-nowrap"
                                    >
                                        {actionLoading ? 'Đang tạo...' : 'Tạo mã +'}
                                    </button>
                                </div>
                            </div>

                            {inviteCodes.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {inviteCodes.map(code => (
                                        <div key={code.id} className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between group">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl font-black tracking-widest text-primary font-mono">{code.code}</span>
                                                    <span className="text-[9px] font-black uppercase bg-white/10 px-2 py-0.5 rounded-full">{roleMap[code.role || 'staff']}</span>
                                                </div>
                                                <div className="text-[10px] text-gray-500 mt-1">
                                                    Hết hạn: {new Date(code.expires_at).toLocaleDateString('vi-VN')}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button 
                                                    onClick={() => copyToClipboard(code.code)}
                                                    className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors"
                                                    title="Copy"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteInvite(code.id)}
                                                    className="p-2 text-red-400 hover:text-red-500 transition-all"
                                                    title="Hủy mã"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-3xl text-gray-500 text-sm italic">
                                    Chưa có mã mời nào khả dụng. Hãy tạo mã mới!
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Staff List Section */}
                <section>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-4">Danh sách thành viên</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {staffList.map(member => (
                            <div key={member.id} className="bg-white rounded-[2rem] p-5 border border-pink-50 shadow-sm flex items-center gap-4 relative group">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${member.role === 'owner' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                    {member.role === 'owner' ? <Crown className="w-6 h-6" /> : <User className="w-6 h-6" />}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="font-bold text-gray-800 truncate">{member.email}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${roleColorMap[member.role] || 'bg-gray-100 text-gray-700'}`}>
                                            {roleMap[member.role] || 'Nhân viên'}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {new Date(member.created_at).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                </div>

                                {isOwner && member.role !== 'owner' && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <select 
                                            value={member.role}
                                            onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                                            className="text-[10px] font-bold border border-gray-100 rounded-lg p-1 outline-none focus:border-primary"
                                        >
                                            <option value="staff_sales">Bán hàng</option>
                                            <option value="staff_warehouse">Kho</option>
                                            <option value="staff">Tổng hợp</option>
                                        </select>
                                        <button
                                            onClick={() => handleDeleteStaff(member.id, member.email)}
                                            className="p-2 text-gray-300 hover:text-red-500 transition-all"
                                            title="Xóa nhân viên"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 text-blue-800">
                    <h4 className="font-black text-sm uppercase mb-2">💡 Hướng dẫn</h4>
                    <ul className="text-xs space-y-2 font-medium leading-relaxed opacity-80">
                        <li>• **Nhân viên Bán hàng**: Chỉ được bán hàng, xem tồn kho. KHÔNG được sửa giá bán, xem giá vốn hay vào các menu khác.</li>
                        <li>• **Nhân viên Kho**: Được nhập kho, quản lý sản phẩm. KHÔNG được thực hiện bán hàng.</li>
                        <li>• **Nhân viên Tổng hợp**: Có quyền cơ bản của cả bán hàng và kho.</li>
                        <li>• Chủ shop có toàn quyền quản lý và xem tất cả báo cáo tài chính.</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
