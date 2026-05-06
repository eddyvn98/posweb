import React, { useState } from 'react'
import SEO from '../components/SEO'
import './WebSales.css'

export default function WebSales() {
    const [billingCycle, setBillingCycle] = useState('lifetime') // 'lifetime' or 'monthly'
    const [selectedDomain, setSelectedDomain] = useState('shared') // 'shared' or 'private'

    const packages = [
        {
            id: 'startup',
            name: 'Gói Khởi Nghiệp',
            price: billingCycle === 'lifetime' ? '500.000' : '50.000',
            save: billingCycle === 'lifetime' ? 'Tiết kiệm 20%' : '',
            preview: '/previews/startup.png',
            features: [
                'Giao diện mẫu chuẩn SEO',
                'Quản lý 100 sản phẩm',
                'Tích hợp Zalo/Messenger',
                'Băng thông 10GB/tháng',
                'Hỗ trợ qua tài liệu'
            ],
            popular: false
        },
        {
            id: 'pro',
            name: 'Gói Chuyên Nghiệp',
            price: billingCycle === 'lifetime' ? '5.000.000' : '450.000',
            save: billingCycle === 'lifetime' ? 'Bán chạy nhất' : 'Khuyên dùng',
            preview: '/previews/pro.png',
            features: [
                'Thiết kế giao diện riêng',
                'Sản phẩm không giới hạn',
                'Tích hợp thanh toán QR',
                'Băng thông không giới hạn',
                'Hỗ trợ kỹ thuật 24/7'
            ],
            popular: true
        },
        {
            id: 'enterprise',
            name: 'Gói Doanh Nghiệp',
            price: billingCycle === 'lifetime' ? '50.000.000' : '4.500.000',
            save: billingCycle === 'lifetime' ? 'Tối ưu nhất' : '',
            preview: '/previews/enterprise.png',
            features: [
                'Toàn quyền sở hữu Source Code',
                'App Mobile (iOS/Android)',
                'Hệ thống quản lý chuỗi',
                'Server riêng biệt tối ưu',
                'Cố vấn chiến lược 1-1'
            ],
            popular: false
        }
    ]

    const CheckIcon = () => (
        <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
        </svg>
    )

    return (
        <div className="websales-page">
            <SEO 
                title="Thiết kế Website Bán hàng Chuyên nghiệp | OpenPOS"
                description="Sở hữu website bán hàng chuẩn SEO, tích hợp POS chuyên nghiệp. Giá chỉ từ 500k. Domain riêng hoặc chung, sở hữu vĩnh viễn."
            />
            
            <div className="bg-blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            <header className="websales-header animate-fade-in">
                <div className="flex justify-center mb-6">
                    <span className="premium-badge">
                        <span className="pulse-dot"></span>
                        Module Sắp ra mắt
                    </span>
                </div>
                <h1>Giải pháp Web Bán hàng <br/><span className="gradient-text">Toàn diện & Chuyên nghiệp</span></h1>
                <p>Nâng tầm thương hiệu với website bán hàng chuẩn SEO, đồng bộ 100% dữ liệu với hệ thống OpenPOS của bạn.</p>
            </header>

            <div className="pricing-toggle-container animate-slide-up">
                <div className="pricing-toggle">
                    <button 
                        className={`toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                        onClick={() => setBillingCycle('monthly')}
                    >
                        Thuê bao tháng
                    </button>
                    <button 
                        className={`toggle-btn ${billingCycle === 'lifetime' ? 'active' : ''}`}
                        onClick={() => setBillingCycle('lifetime')}
                    >
                        Sở hữu vĩnh viễn
                        <span className="save-tag">Ưu đãi</span>
                    </button>
                </div>
            </div>

            <div className="pricing-grid">
                {packages.map((pkg, idx) => (
                    <div 
                        key={pkg.id} 
                        className={`pricing-card ${pkg.popular ? 'popular' : ''} animate-card`}
                        style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                        {pkg.popular && <div className="popular-badge">PHỔ BIẾN NHẤT</div>}
                        {pkg.save && <div className="save-badge">{pkg.save}</div>}
                        
                        <div className="card-header">
                            <h2 className="pkg-name">{pkg.name}</h2>
                        </div>

                        <div className="template-preview-wrapper">
                            <div className="template-preview">
                                <img src={pkg.preview} alt={pkg.name} loading="lazy" />
                                <div className="preview-overlay">
                                    <span>Xem Demo</span>
                                </div>
                            </div>
                        </div>

                        <div className="price-container">
                            <div className="price-main">
                                <span className="currency">₫</span>
                                <span className="price-value">{pkg.price}</span>
                            </div>
                            <span className="price-unit">/{billingCycle === 'lifetime' ? 'trọn đời' : 'tháng'}</span>
                        </div>

                        <div className="divider"></div>

                        <ul className="feature-list">
                            {pkg.features.map((feat, i) => (
                                <li key={i} className="feature-item">
                                    <div className="icon-wrapper">
                                        <CheckIcon />
                                    </div>
                                    <span>{feat}</span>
                                </li>
                            ))}
                        </ul>

                        <button 
                            className={`btn-choose ${pkg.popular ? 'primary' : 'secondary'}`}
                            onClick={() => alert(`Cảm ơn bạn! Module ${pkg.name} đang được hoàn thiện. Chúng tôi sẽ liên hệ sớm.`)}
                        >
                            Đăng ký nhận ưu đãi ngay
                        </button>
                    </div>
                ))}
            </div>

            <div className="domain-section animate-slide-up">
                <div className="section-header">
                    <h2>Tùy chọn Tên miền</h2>
                    <p>Linh hoạt lựa chọn địa chỉ truy cập cho cửa hàng của bạn</p>
                </div>
                <div className="domain-grid">
                    <div 
                        className={`domain-card ${selectedDomain === 'shared' ? 'selected' : ''}`}
                        onClick={() => setSelectedDomain('shared')}
                    >
                        <div className="domain-icon free">FREE</div>
                        <h3 className="domain-title">Tên miền chung</h3>
                        <p className="domain-desc">Sử dụng định dạng của OpenPOS, hoàn toàn miễn phí.</p>
                        <div className="domain-preview">yourshop.vivutrade.io.vn</div>
                    </div>
                    <div 
                        className={`domain-card ${selectedDomain === 'private' ? 'selected' : ''}`}
                        onClick={() => setSelectedDomain('private')}
                    >
                        <div className="domain-icon pro">PRO</div>
                        <h3 className="domain-title">Tên miền riêng</h3>
                        <p className="domain-desc">Khẳng định thương hiệu với tên miền riêng (com, net, vn...)</p>
                        <div className="domain-preview">www.yourbrand.com</div>
                    </div>
                </div>
            </div>

            <section className="contact-section animate-fade-in">
                <div className="contact-card">
                    <div className="contact-content">
                        <h2 className="text-3xl font-black mb-4">Bạn cần hỗ trợ tư vấn?</h2>
                        <p className="text-gray-500 mb-8 max-w-lg mx-auto">Đội ngũ kỹ thuật của chúng tôi luôn sẵn sàng hỗ trợ bạn xây dựng giải pháp bán hàng tối ưu nhất.</p>
                        <div className="contact-buttons">
                            <a href="https://zalo.me/0932690949" target="_blank" rel="noopener noreferrer" className="btn-contact zalo">
                                <span className="icon">Z</span>
                                <span>Liên hệ qua Zalo</span>
                            </a>
                            <a href="https://t.me/htt711" target="_blank" rel="noopener noreferrer" className="btn-contact telegram">
                                <span className="icon">T</span>
                                <span>Liên hệ qua Telegram</span>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
