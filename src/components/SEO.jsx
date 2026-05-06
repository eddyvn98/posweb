import { Helmet } from 'react-helmet-async';

export default function SEO({ 
    title, 
    description, 
    keywords,
    url,
    image,
    noindex = false 
}) {
    const siteTitle = 'POSweb Free - Phần mềm quản lý bán hàng miễn phí vĩnh viễn';
    const finalTitle = title ? `${title} | POSweb` : siteTitle;
    const finalDescription = description || "Giải pháp quản lý bán hàng, kho hàng và doanh thu hoàn toàn miễn phí cho cửa hàng nhỏ. Không giới hạn tính năng, không cần cài đặt. Thuộc hệ sinh thái Vivutrade.";
    const finalUrl = url || "https://poswebfree.vivutrade.io.vn/";
    const finalImage = image || "https://poswebfree.vivutrade.io.vn/og-image.png";

    return (
        <Helmet>
            <title>{finalTitle}</title>
            <meta name="description" content={finalDescription} />
            {keywords && <meta name="keywords" content={keywords} />}
            
            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={finalUrl} />
            <meta property="og:title" content={finalTitle} />
            <meta property="og:description" content={finalDescription} />
            <meta property="og:image" content={finalImage} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={finalUrl} />
            <meta property="twitter:title" content={finalTitle} />
            <meta property="twitter:description" content={finalDescription} />
            <meta property="twitter:image" content={finalImage} />

            {/* Canonical Link */}
            <link rel="canonical" href={finalUrl} />

            {/* Robot Control */}
            {noindex && <meta name="robots" content="noindex, nofollow" />}
        </Helmet>
    );
}
