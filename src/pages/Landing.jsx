import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import './Landing.css'

function FeatureIcon({ type }) {
    if (type === 'sales') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v4H3zM5 9h14v10H5zM8 13h8M8 17h5" /></svg>
    if (type === 'inventory') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7l9-4 9 4-9 4zM3 7v10l9 4 9-4V7" /></svg>
    if (type === 'report') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V9M10 20V4M16 20v-7M22 20H2" /></svg>
    if (type === 'staff') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-2.5 2-4.5 4.5-4.5S11 17.5 11 20M13 20c0-2.8 2.2-5 5-5s5 2.2 5 5" /></svg>
    if (type === 'offline') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9a15 15 0 0 1 18 0M7 13a9 9 0 0 1 10 0M11 17a3 3 0 0 1 2 0M2 2l20 20" /></svg>
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20M2 12h20" /></svg>
}

const features = [
    { icon: 'sales', title: 'Bán hàng nhanh', desc: 'Giao diện POS tối ưu cho tốc độ, hỗ trợ quét barcode, tìm kiếm tức thì và thanh toán linh hoạt.' },
    { icon: 'inventory', title: 'Quản lý kho rõ ràng', desc: 'Nhập hàng, theo dõi tồn kho, cảnh báo hàng sắp hết và lịch sử nhập đầy đủ trong cùng một luồng xử lý.' },
    { icon: 'report', title: 'Báo cáo thực dụng', desc: 'Doanh thu theo ngày tháng, sản phẩm bán chạy, lợi nhuận gộp và sổ quỹ tiền mặt để quyết định nhanh.' },
    { icon: 'staff', title: 'Vận hành nhiều nhân viên', desc: 'Mỗi nhân viên một tài khoản, dữ liệu tập trung, phân quyền rõ ràng và dễ kiểm soát.' },
    { icon: 'offline', title: 'Làm việc cả khi mất mạng', desc: 'Vẫn bán hàng ở chế độ offline và tự động đồng bộ khi kết nối quay trở lại.' },
    { icon: 'free', title: 'Miễn phí không giới hạn', desc: 'Không giới hạn sản phẩm, giao dịch hoặc số cửa hàng. Bắt đầu ngay không cần thẻ ngân hàng.' },
]

const stats = [
    { label: 'Doanh thu', value: '< 1 tỷ/năm' },
    { label: 'Chi phí duy trì', value: '0đ' },
    { label: 'Cửa hàng tin dùng', value: '1.200+' },
    { label: 'Triển khai', value: '30 giây' },
]

export default function Landing() {
    const navigate = useNavigate()
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <div className="landing">
            <SEO
                title="Phần mềm quản lý bán hàng cho shop dưới 1 tỷ/năm"
                description="POSweb là giải pháp quản lý bán hàng miễn phí tốt nhất cho cửa hàng nhỏ. Quản lý kho, doanh thu và nhân viên tinh gọn, không tốn chi phí."
            />

            <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
                <div className="nav-brand">
                    <span className="nav-mark" aria-hidden="true" />
                    <span className="nav-name">POSweb</span>
                    <span className="nav-badge">Free</span>
                </div>
                <div className="nav-actions">
                    <button className="btn-outline" onClick={() => navigate('/login')}>Đăng nhập</button>
                    <button className="btn-primary" onClick={() => navigate('/app/sales')}>Dùng thử miễn phí</button>
                </div>
            </nav>

            <section className="hero">
                <div className="hero-content">
                    <div className="hero-tag">Tối ưu cho shop doanh thu dưới 1 tỷ/năm</div>
                    <h1 className="hero-title">Quản lý bán hàng tinh gọn,<br /><span className="accent-text">không lo chi phí phần mềm</span></h1>
                    <p className="hero-subtitle">Giải pháp POS miễn phí vĩnh viễn dành riêng cho cửa hàng nhỏ và hộ kinh doanh. Quản lý kho, doanh thu và nhân viên hiệu quả mà không tốn một đồng chi phí.</p>
                    <div className="hero-ctas">
                        <button className="cta-primary large" onClick={() => navigate('/app/sales')}>Dùng thử miễn phí ngay</button>
                    </div>
                    <div className="hero-stats">
                        {stats.map((s) => (
                            <div key={s.label} className="hero-stat">
                                <div className="stat-value">{s.value}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="hero-mockup">
                    <img 
                        src="/giao-dien-phan-mem-quan-ly-ban-hang-openpos.png" 
                        alt="Giao diện quản lý bán hàng chuyên nghiệp trên OpenPOS" 
                        className="hero-screenshot"
                    />
                </div>

            </section>

            <section className="features" id="features">
                <div className="section-header">
                    <div className="section-tag">Tính năng</div>
                    <h2>Mọi thứ cần để vận hành cửa hàng</h2>
                </div>
                <div className="features-grid">
                    {features.map((f) => (
                        <div key={f.title} className="feature-card">
                            <div className="feature-icon"><FeatureIcon type={f.icon} /></div>
                            <h3 className="feature-title">{f.title}</h3>
                            <p className="feature-desc">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="how-it-works">
                <div className="section-header">
                    <div className="section-tag">Bắt đầu</div>
                    <h2>3 bước vào vận hành</h2>
                </div>
                <div className="steps">
                    <div className="step">
                        <div className="step-num">01</div>
                        <h3 className="step-title">Tạo tài khoản</h3>
                        <p className="step-desc">Đăng ký nhanh bằng email. Cửa hàng được tạo ngay sau khi xác nhận.</p>
                    </div>
                    <div className="step">
                        <div className="step-num">02</div>
                        <h3 className="step-title">Nhập sản phẩm</h3>
                        <p className="step-desc">Thêm thủ công hoặc import file để bắt đầu quản lý kho ngay trong ngày.</p>
                    </div>
                    <div className="step">
                        <div className="step-num">03</div>
                        <h3 className="step-title">Bán hàng</h3>
                        <p className="step-desc">Quét mã, chọn số lượng và thanh toán. Dữ liệu cập nhật liên tục trên hệ thống.</p>
                    </div>
                </div>
            </section>

            <section className="final-cta">
                <h2>Sẵn sàng vận hành chuyên nghiệp hơn?</h2>
                <p>Dùng POSweb trên web ngay hôm nay, không cần cài đặt, không cần phí khởi tạo.</p>
                <button className="cta-primary large" onClick={() => navigate('/app/sales')}>Dùng thử miễn phí</button>
            </section>

            <footer className="landing-footer">
                <div className="footer-brand">
                    <span className="footer-name">POSweb by Vivutrade</span>
                    <span className="footer-tagline">Nền tảng POS gọn, rõ và bền bỉ cho cửa hàng Việt</span>
                </div>
                <div className="footer-links">
                    <button onClick={() => window.open('https://vivutrade.io.vn')}>Về Vivutrade</button>
                    <button onClick={() => navigate('/register')}>Đăng ký</button>
                    <button onClick={() => navigate('/login')}>Đăng nhập</button>
                </div>
                <div className="footer-copy">© 2026 POSweb. All rights reserved.</div>
            </footer>
        </div>
    )
}
