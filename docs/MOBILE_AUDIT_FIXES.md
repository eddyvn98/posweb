# 📋 BÁO CÁO KHẮC PHỤC CÁC LỖI POS MOBILE (PHẢN HỒI AUDIT COMMIT e017b1fa)

Tài liệu này phản hồi chi tiết các vấn đề được nêu trong báo cáo **"Kết quả kiểm tra PosWeb Mobile"** từ ChatGPT, liệt kê chi tiết nguyên nhân gốc và các thay đổi mã nguồn đã được thực hiện và đẩy lên GitHub.

---

## 1. Khắc phục lỗi P0 & P1 (Nghiêm trọng)

### 🔴 P0: Quét mã fallback xóa toàn bộ cache sản phẩm offline
* **Hiện trạng cũ:** Tại `src/pages/Sales.jsx`, khi quét mã vạch không thấy trong local IndexedDB, hệ thống gọi API backend và chạy `saveProductsToLocal([match])`. Hàm này gọi `tx.store.clear()` khiến **toàn bộ sản phẩm offline khác bị xóa sạch**, chỉ giữ lại duy nhất 1 sản phẩm vừa tìm.
* **Khắc phục:** 
  * Bổ sung hàm `upsertProductsToLocal(products)` trong [`src/lib/db.js`](../src/lib/db.js) sử dụng `tx.store.put()` mà không xóa dữ liệu cũ.
  * Cập nhật [`src/pages/Sales.jsx`](../src/pages/Sales.jsx) gọi `upsertProductsToLocal([match])` khi fallback API thành công.

---

### 🔴 P0: Đơn hàng đã đồng bộ online vẫn bị đánh dấu `synced: 0`
* **Hiện trạng cũ:** Khi thanh toán online thành công tại `CheckoutModal.jsx`, `saleData.synced = 1` đã được gán, nhưng hàm `saveOfflineSale` trong `src/lib/db.js` lại hardcode `synced: 0`. Điều này làm `SyncContext` hiểu nhầm là đơn chưa đồng bộ và gửi lại đơn lần 2 khi chạy `pushSales()`.
* **Khắc phục:** Cập nhật `saveOfflineSale` trong [`src/lib/db.js`](../src/lib/db.js) giữ nguyên giá trị `synced` nếu đơn hàng đã được đồng bộ trước (`synced: saleData.synced !== undefined ? Number(saleData.synced) : 0`).

---

### 🟡 P1: Trang Sản phẩm (`/products`) không đọc cache khi mất mạng
* **Hiện trạng cũ:** Hàm `fetchProducts` trong `src/pages/Products.jsx` sử dụng `Promise.all([api.get('/products'), getAllLocalProducts()])`. Khi mất mạng hoặc API lỗi, `Promise.all` lập tức reject và nhảy sang `catch`, khiến `allProducts` không được gán dữ liệu local.
* **Khắc phục:** Chuyển sang `Promise.allSettled` trong [`src/pages/Products.jsx`](../src/pages/Products.jsx). Nếu API thất bại nhưng local cache có dữ liệu, danh sách sản phẩm vẫn hiển thị bình thường kèm thông báo cảnh báo offline.

---

## 2. Khắc phục lỗi Bán nhanh & Ràng buộc Foreign Key Backend

### 🔴 P0/P1: Luồng Bán nhanh (QuickSale) gây lỗi Foreign Key SQLite
* **Hiện trạng cũ:** `QuickSaleModal` tạo sản phẩm với UUID mới. Khi thanh toán với lựa chọn không lưu vào catalog (`saveToCatalog = false`), backend SQLite cố gắng insert vào `sale_items` và `inventory_logs` với `product_id` không tồn tại trong bảng `products`. Do SQLite có ràng buộc `FOREIGN KEY (product_id) REFERENCES products(id)`, transaction bán hàng bị lỗi `FOREIGN KEY constraint failed`, dẫn đến đơn kẹt trong hàng đợi offline vĩnh viễn. Ngoài ra, việc trừ tồn kho chưa lọc theo `shop_id`.
* **Khắc phục:** Cập nhật `createSale` trong [`bot_backend/repositories/sales.repo.js`](../bot_backend/repositories/sales.repo.js):
  * Kiểm tra tồn tại của sản phẩm theo `id` và `shop_id`.
  * Nếu sản phẩm chưa có trong danh mục (sản phẩm Bán nhanh), backend tự động tạo bản ghi sản phẩm nhanh với `stock_quantity = 0` để thỏa mãn toàn vẹn khóa ngoại.
  * Trừ tồn kho và ghi nhật ký kho chặt chẽ theo cả `product_id` và `shop_id`.

---

## 3. Tối ưu Công thái học & Giao diện Mobile (P1 & P2)

### 📱 Tăng kích thước vùng chạm nút giỏ hàng (Touch Target)
* **Tệp:** [`src/components/CartItem.jsx`](../src/components/CartItem.jsx)
* **Thay đổi:** 
  * Tăng chiều cao thanh điều khiển từ `h-7` (28px) lên `h-9 sm:h-8` (36-40px).
  * Tăng diện tích nút `-`, `+` lên `w-9` và nút xóa `Trash2` lên `w-9 h-9` (đáp ứng tiêu chuẩn chạm ngón tay trên mobile).
  * Thêm thuộc tính `aria-label` cho các nút hỗ trợ accessibility.

### 📱 Sửa lỗi ô số lượng: không xóa sản phẩm ngay khi xóa trắng số
* **Tệp:** [`src/components/CartItem.jsx`](../src/components/CartItem.jsx)
* **Thay đổi:** Quản lý state chuỗi cục bộ (`localQty`). Người dùng có thể xóa trắng để gõ số mới mà không bị trigger xóa sản phẩm ngay lập tức; chỉ xác thực và cập nhật khi `onBlur`.

### 📱 Tắt autoFocus ô tìm kiếm trên Mobile
* **Tệp:** [`src/pages/Sales.jsx`](../src/pages/Sales.jsx)
* **Thay đổi:** Đặt `autoFocus={typeof window !== 'undefined' && window.innerWidth >= 768}` để không tự động bật bàn phím ảo che khuất màn hình khi vừa vào trang trên điện thoại.

### 📱 Lớp hiển thị (Z-Index) Camera & Modal trên Bottom Navigation
* **Tệp:** [`src/pages/Sales.jsx`](../src/pages/Sales.jsx), [`src/components/CheckoutModal.jsx`](../src/components/CheckoutModal.jsx), [`src/components/QuickSaleModal.jsx`](../src/components/QuickSaleModal.jsx)
* **Thay đổi:** Nâng `z-index` của Camera Scanner Modal, Checkout Modal và Quick Sale Modal lên `z-[200]` để luôn nổi trên thanh điều hướng dưới (`z-[100]`), không bị che khuất nút thao tác hay chân trang.

### 📱 Cho phép phóng to hai ngón (Pinch-to-zoom)
* **Tệp:** [`index.html`](../index.html)
* **Thay đổi:** Loại bỏ `maximum-scale=1.0, user-scalable=no` khỏi thẻ meta viewport để đảm bảo tuân thủ tiêu chuẩn trợ năng WCAG trên thiết bị di động.
