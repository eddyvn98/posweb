import React from 'react'
import './Modules.css'

const modules = [
    {
        id: 'ai-insight',
        title: 'AI Insight Pro',
        icon: '🧠',
        desc: 'Phân tích dữ liệu bán hàng thông minh bằng AI. Tự động dự báo doanh thu và gợi ý tối ưu nhập hàng.',
        features: ['Dự báo doanh thu 30 ngày', 'Phân tích hành vi mua sắm', 'Gợi ý sản phẩm kèm theo', 'Cảnh báo tồn kho thông minh'],
        price: '49,000đ',
        billingCycle: 'tháng',
        comingSoon: true,
        color: '#6366f1',
        shadow: 'rgba(99, 102, 241, 0.4)'
    },
    {
        id: 'vivu-connect',
        title: 'Vivu Connect',
        icon: '🔗',
        desc: 'Đồng bộ sản phẩm và đơn hàng từ Lazada, Shopee, TikTok Shop về một nơi duy nhất.',
        features: ['Đồng bộ tồn kho thời gian thực', 'Quản lý đơn hàng tập trung', 'In vận đơn tự động', 'Thống kê kênh bán hiệu quả'],
        price: '99,000đ',
        billingCycle: 'vĩnh viễn',
        comingSoon: true,
        color: '#10b981',
        shadow: 'rgba(16, 185, 129, 0.4)'
    },
    {
        id: 'loyalty-prime',
        title: 'Loyalty Prime',
        icon: '💖',
        desc: 'Hệ thống chăm sóc khách hàng chuyên nghiệp. Tích điểm, hạng thành viên và gửi voucher tự động.',
        features: ['Quản lý hạng thành viên', 'Tích điểm đổi quà linh hoạt', 'Gửi SMS/Zalo Marketing', 'Báo cáo lòng trung thành'],
        price: '99,000đ',
        billingCycle: 'vĩnh viễn',
        comingSoon: true,
        color: '#ec4899',
        shadow: 'rgba(236, 72, 153, 0.4)'
    },
    {
        id: 'warehouse-master',
        title: 'Warehouse Master',
        icon: '🏢',
        desc: 'Mở rộng khả năng quản lý kho. Hỗ trợ đa kho, chuyển kho nội bộ và kiểm kê chuyên sâu.',
        features: ['Quản lý không giới hạn kho', 'Lệnh chuyển kho nội bộ', 'Kiểm kê barcode cầm tay', 'Theo dõi serial/IMEI'],
        price: '99,000đ',
        billingCycle: 'vĩnh viễn',
        comingSoon: true,
        color: '#f59e0b',
        shadow: 'rgba(245, 158, 11, 0.4)'
    },
    {
        id: 'finance-hub',
        title: 'Finance Hub',
        icon: '📊',
        desc: 'Quản trị tài chính doanh nghiệp toàn diện. Dòng tiền, công nợ và báo cáo lãi lỗ chi tiết.',
        features: ['Quản lý công nợ NCC/Khách', 'Sổ quỹ tiền mặt & Ngân hàng', 'Báo cáo P&L tự động', 'Tích hợp hóa đơn điện tử'],
        price: '99,000đ',
        billingCycle: 'vĩnh viễn',
        comingSoon: true,
        color: '#06b6d4',
        shadow: 'rgba(6, 182, 212, 0.4)'
    },
    {
        id: 'vivu-pay-pro',
        title: 'Vivu Pay Pro',
        icon: '💳',
        desc: 'Giải pháp thanh toán QR động. Tự động xác nhận giao dịch và gạch nợ hóa đơn tức thì.',
        features: ['Tạo mã QR theo từng đơn', 'Xác thực qua Bank Webhook', 'Không cần can thiệp thủ công', 'Tương thích mọi ngân hàng'],
        price: '99,000đ',
        billingCycle: 'vĩnh viễn',
        comingSoon: true,
        color: '#8b5cf6',
        shadow: 'rgba(139, 92, 246, 0.4)'
    }
]

export default function Modules() {
    return (
        <div className="modules-page">
            <div className="bg-blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            <header className="modules-header">
                <div className="flex justify-center mb-4">
                    <span className="px-4 py-1 bg-pink-100 text-pink-600 rounded-full text-sm font-bold tracking-widest uppercase">
                        Plugin Ecosystem
                    </span>
                </div>
                <h1>Cửa hàng Module</h1>
                <p>Nâng cấp cửa hàng của bạn với các tính năng chuyên sâu. Chỉ mua những gì bạn thực sự cần.</p>
            </header>

            <div className="modules-grid">
                {modules.map(mod => (
                    <div 
                        key={mod.id} 
                        className={`module-card ${mod.comingSoon ? 'coming-soon' : ''}`}
                        style={{ '--module-color': mod.color, '--module-shadow': mod.shadow }}
                    >
                        {mod.comingSoon && (
                            <div className="coming-soon-badge">Sắp ra mắt</div>
                        )}
                        <div className="module-icon">{mod.icon}</div>
                        <h2 className="module-title">{mod.title}</h2>
                        <p className="module-desc">{mod.desc}</p>
                        <ul className="module-features">
                            {mod.features.map((feat, i) => (
                                <li key={i}>{feat}</li>
                            ))}
                        </ul>
                        <div className="module-footer">
                            <div className="module-price">
                                <span className="price-period">{mod.billingCycle === 'tháng' ? 'Thuê bao tháng' : 'Mua một lần'}</span>
                                <div className="flex items-center gap-1">
                                    <span className="price-amount">{mod.price}</span>
                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1 rounded uppercase">
                                        {mod.billingCycle}
                                    </span>
                                </div>
                            </div>
                            <button 
                                className={`btn-buy ${mod.comingSoon ? 'disabled' : ''}`} 
                                onClick={() => !mod.comingSoon && alert(`Bạn đã chọn mua module: ${mod.title}`)}
                                disabled={mod.comingSoon}
                            >
                                {mod.comingSoon ? 'Chờ ra mắt' : 'Mua ngay'}
                            </button>
                        </div>
                    </div>
                ))}

                {/* Custom Module Request Card */}
                <div 
                    className="module-card custom-request-card" 
                    style={{ '--module-color': '#ec4899', '--module-shadow': 'rgba(236, 72, 153, 0.3)' }}
                >
                    <div className="module-icon">🛠️</div>
                    <h2 className="module-title">Yêu cầu Module riêng</h2>
                    <p className="module-desc">Bạn cần tính năng đặc thù cho doanh nghiệp? Chúng tôi nhận phát triển module riêng theo quy trình nghiệp vụ của bạn.</p>
                    <ul className="module-features">
                        <li>Thiết kế theo yêu cầu riêng</li>
                        <li>Tối ưu cho quy trình sẵn có</li>
                        <li>Bảo mật và độc quyền</li>
                        <li>Hỗ trợ triển khai tận nơi</li>
                    </ul>
                    <div className="module-footer flex-col gap-4 items-stretch border-none">
                        <a 
                            href="https://zalo.me/0932690949" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn-contact zalo-btn"
                        >
                            <span>💬 Liên hệ qua Zalo</span>
                        </a>
                        <a 
                            href="https://t.me/htt711" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn-contact telegram-btn"
                        >
                            <span>✈️ Liên hệ qua Telegram</span>
                        </a>
                    </div>
                </div>
            </div>

            <footer className="mt-20 text-center text-gray-400 text-sm pb-10">
                <p>Mọi module đều đi kèm hỗ trợ kỹ thuật 24/7 và cập nhật tính năng liên tục.</p>
                <p className="mt-2">© 2025 Vivutrade Ecosystem</p>
            </footer>
        </div>
    )
}
