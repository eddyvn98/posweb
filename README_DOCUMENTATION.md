# POSWeb Documentation Index

## Production Deploy (Official)

Luon uu tien tai lieu nay cho deploy production:

- [DEPLOY_DOCKER_CLOUDFLARE.md](DEPLOY_DOCKER_CLOUDFLARE.md)

Ly do: domain `posweb.vivutrade.io.vn` dang chay theo Docker + Cloudflare Tunnel.

## Deployment Notes

- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md): ghi chu legacy va canh bao nham luong.
- Khong dung Vercel/Firebase cho domain vivutrade.

## Core Product Docs

- [TECHNICAL CONSENSUS SPEC.md](TECHNICAL%20CONSENSUS%20SPEC.md): yeu cau va kien truc tong quan.
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md): tinh trang implement cac phan he.
- [new1.md](new1.md): reports/export.
- [new2.md](new2.md): imports/cashbook/settings.
- [SUPABASE_MIGRATIONS.md](SUPABASE_MIGRATIONS.md): migration schema.

## Google Drive Backup Docs

- [QUICK_START_DRIVE_BACKUP.md](QUICK_START_DRIVE_BACKUP.md): huong dan nhanh.
- [GOOGLE_SETUP.md](GOOGLE_SETUP.md): setup chi tiet.
- [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md): test va verify.
- [IMPLEMENTATION_DRIVE_BACKUP.md](IMPLEMENTATION_DRIVE_BACKUP.md): chi tiet ky thuat.
- [DRIVE_BACKUP_SUMMARY.md](DRIVE_BACKUP_SUMMARY.md): tong hop implementation.

## Testing Docs

- [TEST_CASES_EPIC_9.md](TEST_CASES_EPIC_9.md)
- [TEST_REPORT_TEMPLATE.md](TEST_REPORT_TEMPLATE.md)

## UI/Styling

- [css.md](css.md)

## Customer Storefront

- Mở storefront tại `/shop`.
- Các luồng chính: sản phẩm, chi tiết, giỏ hàng, checkout, đơn mua, hồ sơ và địa chỉ nhận hàng.
- Storefront ưu tiên ba nhóm: văn phòng phẩm, vật dụng nhà cửa nhỏ và đồ chơi.
- Thông tin mặc định của storefront: Văn phòng phẩm 302 Vườn Lài, 302 Vườn Lài, An Phú Đông, Quận 12, TP.HCM; dùng cho thông điệp địa phương, SEO/geo và cam kết giao khu vực.
- Homepage có trust bar, bộ sưu tập mua nhanh (dưới 50.000đ, bán chạy, mới về), badge sản phẩm, popup voucher trì hoãn trên phiên đầu, sticky cart mobile, mua lại, sản phẩm vừa xem và gợi ý mua kèm.
- Giá trong form sản phẩm được tách thành `price` (offline), `online_price` (giá online) và `promo_price` (giá khuyến mãi online). Để trống giá online sẽ dùng giá offline; giá khuyến mãi hợp lệ phải thấp hơn giá online.
- Storefront hiển thị giá hiệu lực, gạch ngang giá online gốc khi có khuyến mãi, đồng thời hỗ trợ voucher `SAVE20K`, `SHOP10` và `SAVE50K` với tự động chọn mức giảm tốt nhất.
- Để kết nối tồn kho thật cho khách chưa đăng nhập, cấu hình biến frontend `VITE_PUBLIC_SHOP_ID` bằng `shops.id`; cũng có thể truyền `?shop_id=...` khi dùng thử.
- Backend storefront dùng các endpoint `/api/storefront/products`, `/api/storefront/orders` và yêu cầu `DB_PROVIDER=sqlite` cho luồng ghi đơn atomic.

## Suggested Reading Order

1. [START_HERE.md](START_HERE.md)
2. [DEPLOY_DOCKER_CLOUDFLARE.md](DEPLOY_DOCKER_CLOUDFLARE.md)
3. [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)
4. [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)
