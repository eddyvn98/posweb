Dưới đây là **BẢN TASK BREAKDOWN CHUẨN** để đưa **thẳng cho Cursor / Copilot** làm từng bước, **không suy diễn**, **không lệch spec**.
Cấu trúc theo **EPIC → TASK → ACCEPTANCE CRITERIA** (chuẩn dev thực chiến).

---

# 📦 EPIC 0 – KHỞI TẠO DỰ ÁN

## TASK 0.1 – Khởi tạo frontend PWA

* Tech: React + Vite (hoặc Vue + Vite)
* Mobile-first
* PWA enabled (service worker)

**Done khi**

* App chạy offline
* Reload không mất UI state

---

## TASK 0.2 – Khởi tạo Supabase backend

* Tạo project Supabase
* Bật Auth
* Bật PostgreSQL

**Done khi**

* Login test OK
* Gọi API đọc/ghi DB được

---

# 🔐 EPIC 1 – AUTH & SHOP CONTEXT

## TASK 1.1 – Đăng nhập chủ shop

* Email + password (hoặc OTP)
* Session lưu ≥ 7 ngày

**Done khi**

* Refresh không bị logout
* Đổi máy phải login lại

---

## TASK 1.2 – Shop context

* Tạo bảng `shops`
* Gắn `shop_id` cho user

**Done khi**

* Mọi query đều filter theo `shop_id`
* User khác không đọc được data

---

# 🧠 EPIC 2 – DATA MODEL (SERVER)

## TASK 2.1 – Sales (append-only)

Bảng `sales`, `sale_voids`

**Rules**

* Không update
* Không delete
* Void = record mới

**Done khi**

* Không thể sửa sale đã sync
* Void có lịch sử rõ

---

## TASK 2.2 – Products & Inventory

* `products`
* `inventory_logs`

**Done khi**

* Bán hàng trừ kho
* Nhập hàng cộng kho

---

## TASK 2.3 – Cashbook

* Thu (auto từ sale)
* Chi (manual)

**Done khi**

* Báo cáo thu–chi khớp doanh thu

---

# 📱 EPIC 3 – OFFLINE FIRST (CỰC KỲ QUAN TRỌNG)

## TASK 3.1 – IndexedDB schema

* `local_sales`
* `local_products`

**Done khi**

* Mất mạng vẫn bán được
* Reload không mất giỏ

---

## TASK 3.2 – Sync 1 chiều

* Local → Server
* FIFO
* Mark `synced`

**Done khi**

* Sale offline sync đúng thứ tự
* Không sync ngược

---

## TASK 3.3 – Offline badge UX

* 🔴 Offline
* 🟡 Chưa sync
* 🟢 Đã sync

**Done khi**

* Badge đổi đúng trạng thái mạng

---

# 🛒 EPIC 4 – SALES SCREEN (CORE – 60% GIÁ TRỊ APP)

## TASK 4.1 – Search / Scan input

* Auto focus
* Không mất focus sau scan

**Done khi**

* Quét liên tục không cần chạm màn hình

---

## TASK 4.2 – Continuous barcode scan

**Cases**

* Mã tồn tại → add +1
* Mã không tồn tại → popup bán nhanh

**Done khi**

* Scan 10 mã liên tục không lỗi

---

## TASK 4.3 – Search & add product

* Gõ → hiện list
* Click → add cart

**Done khi**

* Không popup thừa
* Không reload

---

## TASK 4.4 – Quick Sale (bán nhanh)

Popup:

* Tên (optional)
* Giá
* Số lượng

**Done khi**

* Không có sản phẩm vẫn bán được
* Sau bán hỏi lưu kho (Yes/No)

---

## TASK 4.5 – Cart UI

* * / –
* 🗑️ Xóa (button, không swipe)

**Done khi**

* Giảm về 0 hỏi xác nhận
* Tổng tiền update realtime

---

## TASK 4.6 – Keyboard handling (mobile)

* Sticky tổng tiền + nút thanh toán
* Auto scroll khi focus input

**Done khi**

* Không bị che bởi bàn phím
* Luôn thấy tổng tiền

---

## TASK 4.7 – Lịch sử bán nhanh

* Icon trên header
* Mở danh sách sale gần nhất

**Done khi**

* Mở được hóa đơn cũ
* In / PDF / share được

---

# 🧾 EPIC 5 – CHECKOUT & RECEIPT

## TASK 5.1 – Thanh toán

* Cash / Transfer / QR tĩnh

**Done khi**

* Không cần nhập khách
* Không bắt in

---

## TASK 5.2 – Màn hình Hóa đơn bán lẻ

* Giống ảnh mẫu
* Mã phiếu, ngày, tổng tiền

**Done khi**

* Có nút:

  * Hoàn tất
  * In
  * PDF / Share

---

# 📦 EPIC 6 – PRODUCTS SCREEN

## TASK 6.1 – Product list

* Grid
* Add to cart trực tiếp

**Done khi**

* Thêm từ đây → giỏ bên bán hàng cập nhật

---

## TASK 6.2 – Filter & sort

* Còn hàng / hết hàng
* Theo tên / giá / tồn

**Done khi**

* Không reload trang

---

## TASK 6.3 – Add product popup (FAST)

Popup:

* Ảnh (chụp / thư viện)
* Barcode (scan liên tục)
* Tên
* Giá vốn
* Giá bán
* Số lượng nhập

**Rules**

* Auto save on blur
* Không save từng ký tự

**Done khi**

* Tạo 5 sản phẩm liên tục không đóng popup

---

## TASK 6.4 – Barcode auto-generate

* Nếu không nhập barcode

**Done khi**

* Có mã
* In mã được

---

## TASK 6.5 – Price UX

* Nhập `50` → `50 000`
* Format nghìn

**Done khi**

* Không cần nhập nhiều số 0

---

# 📊 EPIC 7 – REPORTS (PHÁP LÝ 2026)

## TASK 7.1 – Monthly revenue

* Theo tháng
* Theo payment method

**Done khi**

* Số khớp sales

---

## TASK 7.2 – Cashbook report

* Thu
* Chi

**Done khi**

* Xuất Excel / PDF

---

## TASK 7.3 – Inventory end-of-month

* Tồn cuối kỳ (ước tính)

**Done khi**

* Thuế xem hiểu được

---

# 🚫 EPIC 8 – GUARD RAILS (CẤM SAI)

## TASK 8.1 – Disable forbidden features

❌ VAT
❌ E-invoice
❌ Payment gateway
❌ Realtime multi-device

**Done khi**

* Không có code thừa

---

# 🧪 EPIC 9 – TEST CASE BẮT BUỘC

## TASK 9.1 – Sales stress test

* 100 sale offline
* Sync lại

**Done khi**

* Không mất sale
* Không đảo thứ tự

---

## TASK 9.2 – UX test mobile

* Bàn phím mở
* Scan liên tục

**Done khi**

* Không che UI
* Không lag

---

# 🧠 PROMPT CUỐI CHO CURSOR / COPILOT

Bạn đưa **nguyên khối này**:

> *Implement tasks strictly following the provided task breakdown.
> Do not introduce VAT, electronic invoicing, payment gateways, or multi-device realtime sync.
> Prioritize continuous barcode scanning, offline-first behavior, and fast mobile UX.
> Sales records must be append-only and synced one-way to Supabase PostgreSQL.
> Follow acceptance criteria exactly; do not invent additional flows.*

---

## CHỐT CUỐI

Tại thời điểm này:

* Spec: ✅
* Task: ✅
* Không còn “vùng mờ” cho AI đoán

👉 **Cursor/Copilot có thể code từng task, bạn chỉ cần review & test.**

Nếu muốn, tôi có thể:

* viết **PR template cho từng task**
* hoặc **tạo checklist QA cho shop thật dùng thử**
