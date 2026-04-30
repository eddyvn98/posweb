import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './Landing.css'

const features = [
    {
        icon: '🛒',
        title: 'Bán hàng nhanh chóng',
        desc: 'Giao diện POS tối ưu cho tốc độ, hỗ trợ quét barcode, tìm kiếm tức thì và thanh toán nhiều phương thức.',
    },
    {
        icon: '📦',
        title: 'Quản lý kho thông minh',
        desc: 'Nhập hàng, theo dõi tồn kho, cảnh báo sắp hết hàng và lịch sử nhập hàng đầy đủ.',
    },
    {
        icon: '📊',
        title: 'Báo cáo & phân tích',
        desc: 'Doanh thu theo ngày/tháng, sản phẩm bán chạy, lợi nhuận gộp và sổ quỹ tiền mặt.',
    },
    {
        icon: '👥',
        title: 'Nhiều nhân viên, 1 cửa hàng',
        desc: 'Tạo tài khoản riêng cho từng nhân viên. Dữ liệu tập trung, phân quyền rõ ràng.',
    },
    {
        icon: '📱',
        title: 'Hoạt động offline',
        desc: 'Vẫn bán hàng được khi mất mạng. Dữ liệu tự đồng bộ khi có kết nối trở lại.',
    },
    {
        icon: '🆓',
        title: 'Hoàn toàn miễn phí',
        desc: 'Không giới hạn sản phẩm, không giới hạn giao dịch. Bắt đầu ngay, không cần thẻ ngân hàng.',
    },
]

const stats = [
    { label: 'Sản phẩm', value: '500+' },
    { label: 'Giao dịch/ngày', value: '200+' },
    { label: 'Cửa hàng', value: '∞' },
    { label: 'Chi phí', value: '0đ' },
]

const testimonials = [
    {
        name: 'Chị Lan',
        shop: 'Tiệm Tạp Hóa Lan Anh',
        quote: 'Phần mềm cực kỳ dễ dùng, tôi không rành công nghệ nhưng vẫn tự tạo sản phẩm và bán hàng được ngay. Đặc biệt là nó hoàn toàn miễn phí!',
        avatar: 'L'
    },
    {
        name: 'Anh Tuấn',
        shop: 'Cửa hàng Phụ kiện Mobile',
        quote: 'Tôi thích tính năng quản lý kho và báo cáo doanh thu. Rất rõ ràng và minh bạch. Cảm ơn đội ngũ Vivutrade!',
        avatar: 'T'
    },
    {
        name: 'Minh Thư',
        shop: 'Shop Quần áo Online',
        quote: 'Giao diện đẹp, chuyên nghiệp. Khách hàng của tôi rất ấn tượng khi nhận được hóa đơn chuyên nghiệp từ shop.',
        avatar: 'M'
    }
]

export default function Landing() {
    const navigate = useNavigate()
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <div className="landing">
            {/* Navbar */}
            <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
                <div className="nav-brand">
                    <span className="nav-logo">🏪</span>
                    <span className="nav-name">POSweb</span>
                    <span className="nav-badge">Free</span>
                </div>
                <div className="nav-actions">
                    <button className="btn-outline" onClick={() => navigate('/login')}>
                        Đăng nhập
                    </button>
                    <button className="btn-primary" onClick={() => navigate('/register')}>
                        Dùng miễn phí
                    </button>
                </div>
            </nav>

            {/* Hero */}
            <section className="hero">
                <div className="hero-bg" aria-hidden="true">
                    <div className="hero-blob blob-1" />
                    <div className="hero-blob blob-2" />
                    <div className="hero-blob blob-3" />
                </div>
                <div className="hero-content">
                    <div className="hero-tag">✨ Miễn phí · Không giới hạn · Bắt đầu ngay</div>
                    <h1 className="hero-title">
                        Phần mềm bán hàng<br />
                        <span className="gradient-text">dành cho mọi cửa hàng</span>
                    </h1>
                    <p className="hero-subtitle">
                        POSweb giúp bạn quản lý bán hàng, kho hàng và doanh thu
                        chỉ trong một ứng dụng — hoàn toàn miễn phí, không cần cài đặt.
                    </p>
                    <div className="hero-ctas">
                        <button className="cta-primary large" onClick={() => navigate('/register')}>
                            Tạo tài khoản miễn phí ngay
                            <span className="cta-arrow">→</span>
                        </button>
                    </div>
                    <div className="hero-stats">
                        {stats.map(s => (
                            <div key={s.label} className="hero-stat">
                                <div className="stat-value">{s.value}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Preview mockup */}
                <div className="hero-mockup" aria-hidden="true">
                    <div className="mockup-window">
                        <div className="mockup-bar">
                            <span /><span /><span />
                        </div>
                        <div className="mockup-screen">
                            <div className="mock-sidebar">
                                {['🛒 Bán hàng', '📦 Kho hàng', '📊 Báo cáo', '💰 Sổ quỹ'].map(item => (
                                    <div key={item} className={`mock-nav-item ${item.includes('Bán') ? 'active' : ''}`}>
                                        {item}
                                    </div>
                                ))}
                            </div>
                            <div className="mock-content">
                                <div className="mock-search">🔍 Tìm sản phẩm...</div>
                                {['Áo thun trắng', 'Quần jeans xanh', 'Giày sneaker'].map((p, i) => (
                                    <div key={p} className="mock-product">
                                        <div className="mock-product-color" style={{ background: ['#6366f1', '#10b981', '#f59e0b'][i] }} />
                                        <div className="mock-product-info">
                                            <div className="mock-product-name">{p}</div>
                                            <div className="mock-product-price">{['150,000đ', '350,000đ', '580,000đ'][i]}</div>
                                        </div>
                                        <div className="mock-product-qty">{['+', '+', '+'][i]}</div>
                                    </div>
                                ))}
                                <div className="mock-total">
                                    <span>Tổng cộng</span>
                                    <strong>1,080,000đ</strong>
                                </div>
                                <div className="mock-pay-btn">💳 Thanh toán</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="features" id="features">
                <div className="section-header">
                    <div className="section-tag">Tính năng</div>
                    <h2>Mọi thứ bạn cần để<br />vận hành cửa hàng</h2>
                </div>
                <div className="features-grid">
                    {features.map(f => (
                        <div key={f.title} className="feature-card">
                            <div className="feature-icon">{f.icon}</div>
                            <h3 className="feature-title">{f.title}</h3>
                            <p className="feature-desc">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Comparison */}
            <section className="comparison">
                <div className="section-header">
                    <div className="section-tag">Tính năng</div>
                    <h2>Mọi thứ bạn cần đều Miễn phí.<br />Mở rộng hơn với Module.</h2>
                </div>
                <div className="comparison-table-wrapper">
                    <table className="comparison-table">
                        <thead>
                            <tr>
                                <th>Tính năng cốt lõi</th>
                                <th><span className="badge-free">Bản Miễn Phí</span></th>
                                <th><span className="badge-pro">Module Mở Rộng</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Bán hàng & Quét mã</td>
                                <td><span className="check-icon">✓</span></td>
                                <td>Sẵn có</td>
                            </tr>
                            <tr>
                                <td>Quản lý kho hàng</td>
                                <td><span className="check-icon">✓</span></td>
                                <td>Sẵn có</td>
                            </tr>
                            <tr>
                                <td>Báo cáo doanh thu</td>
                                <td><span className="check-icon">✓</span></td>
                                <td>Sẵn có</td>
                            </tr>
                            <tr>
                                <td>Không giới hạn sản phẩm</td>
                                <td><span className="check-icon">✓</span></td>
                                <td>Sẵn có</td>
                            </tr>
                            <tr>
                                <td>Quản lý nhân viên</td>
                                <td><span className="check-icon">✓</span></td>
                                <td>Tối ưu hơn</td>
                            </tr>
                            <tr>
                                <td>Đồng bộ Telegram Bot</td>
                                <td><span className="cross-icon">✕</span></td>
                                <td>Cần Module</td>
                            </tr>
                            <tr>
                                <td>Tích hợp thanh toán QR</td>
                                <td><span className="cross-icon">✕</span></td>
                                <td>Cần Module</td>
                            </tr>
                            <tr>
                                <td>AI Phân tích & Dự báo</td>
                                <td><span className="cross-icon">✕</span></td>
                                <td>Cần Module</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Testimonials */}
            <section className="testimonials">
                <div className="section-header">
                    <div className="section-tag">Đánh giá</div>
                    <h2>Đồng hành cùng<br />hàng nghìn chủ shop</h2>
                </div>
                <div className="testimonials-grid">
                    {testimonials.map((t, idx) => (
                        <div key={idx} className="testimonial-card">
                            <p className="testimonial-quote">"{t.quote}"</p>
                            <div className="testimonial-author">
                                <div className="author-avatar">{t.avatar}</div>
                                <div className="author-info">
                                    <h4>{t.name}</h4>
                                    <p>{t.shop}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section className="how-it-works">
                <div className="section-header">
                    <div className="section-tag">Bắt đầu</div>
                    <h2>3 bước để bắt đầu</h2>
                </div>
                <div className="steps">
                    {[
                        { num: '01', title: 'Tạo tài khoản', desc: 'Đăng ký miễn phí với email. Cửa hàng của bạn được tạo ngay lập tức.' },
                        { num: '02', title: 'Thêm sản phẩm', desc: 'Nhập danh sách sản phẩm thủ công hoặc import từ file Excel.' },
                        { num: '03', title: 'Bắt đầu bán hàng', desc: 'Quét barcode hoặc tìm kiếm sản phẩm, chọn số lượng và thanh toán.' },
                    ].map((s, i) => (
                        <div key={s.num} className="step">
                            <div className="step-num">{s.num}</div>
                            {i < 2 && <div className="step-line" aria-hidden="true" />}
                            <h3 className="step-title">{s.title}</h3>
                            <p className="step-desc">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Final CTA */}
            <section className="final-cta">
                <h2>Sẵn sàng bắt đầu?</h2>
                <p>Tham gia hàng nghìn cửa hàng đang dùng POSweb mỗi ngày.</p>
                <button className="cta-primary large" onClick={() => navigate('/register')}>
                    Tạo tài khoản miễn phí ngay →
                </button>
                <div className="final-note">Không cần thẻ ngân hàng · Không có phí ẩn · Thuộc hệ sinh thái Vivutrade</div>
            </section>

            {/* Vivutrade Ecosystem */}
            <section className="ecosystem-section">
                <div className="section-header">
                    <div className="section-tag" style={{ color: '#ff80ab' }}>Vivutrade Ecosystem</div>
                    <h2 style={{ color: '#fff' }}>Hơn cả một phần mềm POS</h2>
                </div>
                <p style={{ color: '#a1a1aa', maxWidth: '600px', margin: '0 auto' }}>
                    Khám phá các công cụ mạnh mẽ khác giúp doanh nghiệp của bạn phát triển toàn diện.
                </p>
                <div className="ecosystem-grid">
                    <div className="ecosystem-item">
                        <h4>🤖 Vivu Bot</h4>
                        <p>Quản lý và nhận báo cáo qua Telegram tức thì.</p>
                    </div>
                    <div className="ecosystem-item">
                        <h4>🔗 Vivu Pay</h4>
                        <p>Giải pháp thanh toán QR tự động chuyên nghiệp.</p>
                    </div>
                    <div className="ecosystem-item">
                        <h4>🧠 Vivu AI</h4>
                        <p>Phân tích dữ liệu và dự báo xu hướng kinh doanh.</p>
                    </div>
                </div>
            </section>

            {/* Support Contact */}
            <section className="landing-support">
                <div className="section-header">
                    <div className="section-tag">Hỗ trợ 24/7</div>
                    <h2>Bạn cần giải đáp thắc mắc?</h2>
                    <p>Đội ngũ kỹ thuật của Vivutrade luôn sẵn sàng hỗ trợ bạn.</p>
                </div>
                <div className="support-actions">
                    <a href="https://zalo.me/0932690949" target="_blank" rel="noopener noreferrer" className="support-btn-icon zalo" title="Chat qua Zalo">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.001 3.333c-4.786 0-8.667 3.88-8.667 8.667 0 1.633.453 3.16 1.24 4.467l-.72 2.738a.5.5 0 0 0 .663.585l3.323-1.343a8.62 8.62 0 0 0 4.161 1.053c4.787 0 8.667-3.881 8.667-8.667 0-4.787-3.88-8.667-8.667-8.667zm3.567 11.454c-.16.142-.408.204-.73.187-.322-.018-.62-.128-.88-.33l-1.633-1.282c-.225-.175-.487-.263-.787-.263s-.562.088-.787.263l-1.633 1.282c-.26.202-.558.312-.88.33-.322.017-.57-.045-.73-.187-.16-.142-.24-.34-.24-.593 0-.175.053-.338.16-.487l.953-1.343c.175-.247.263-.523.263-.827s-.088-.58-.263-.827l-.953-1.343a.855.855 0 0 1-.16-.487c0-.253.08-.451.24-.593.16-.142.408-.204.73-.187s.62.128.88.33l1.633 1.282c.225.175.487.263.787.263s.562-.088.787-.263l1.633-1.282c.26-.202.558-.312.88-.33.322-.017.57.045.73.187.16.142.24.34.24.593 0 .175-.053.338-.16.487l-.953 1.343c-.175.247-.263.523-.263.827s.088.58.263.827l.953 1.343c.107.149.16.312.16.487 0 .253-.08.451-.24.593z"/>
                        </svg>
                    </a>
                    <a href="https://t.me/htt711" target="_blank" rel="noopener noreferrer" className="support-btn-icon telegram" title="Chat qua Telegram">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42l10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.703l-.328 4.922c.483 0 .697-.221.967-.483l2.324-2.259l4.834 3.571c.89.491 1.53.238 1.752-.823l3.167-14.925c.325-1.302-.5-1.898-1.356-1.517z"/>
                        </svg>
                    </a>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-brand">
                    <span>🏪 POSweb</span>
                    <span className="footer-tagline">By Vivutrade - All in one POS</span>
                </div>
                <div className="footer-links">
                    <button onClick={() => window.open('https://vivutrade.io.vn')}>Về Vivutrade</button>
                    <button onClick={() => navigate('/register')}>Đăng ký</button>
                    <button onClick={() => navigate('/login')}>Đăng nhập</button>
                </div>
                <div className="footer-copy">© 2025 POSweb · Built with ❤️ for Shop Owners</div>
            </footer>
        </div>
    )
}
