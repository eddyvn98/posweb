📌 SPEC HOÀN CHỈNH – SALE SCREEN (POS WEB / PWA)
0. Mục tiêu

Thiết kế lại khu vực Bán hàng (Sales Screen) để:

Chạy tốt trên mobile / tablet / desktop

Không chật giao diện mobile

Không trống trải desktop

Tối ưu cho bán nhanh – quét mã – tìm kiếm liên tục

Camera không chiếm chỗ khi nhập liệu

Hành vi giống POS thật (KiotViet / iPOS / Square)

1. Nguyên tắc UX cốt lõi (KHÓA)

Sales screen KHÔNG phải 1 layout cố định

Giao diện thay đổi theo hành vi người dùng

Mobile ưu tiên không gian thao tác

Camera là công cụ phụ trợ, không phải nội dung chính

Khi người dùng đang gõ → mọi thứ không liên quan phải nhường chỗ

2. Định nghĩa STATE (BẮT BUỘC)

Chỉ dùng 1 state duy nhất, không được sinh thêm state rác.

isSearching =
  isSearchInputFocused === true
  OR searchText.length > 0
  OR isScannerActive === true


❗ Mọi quyết định UI đều dựa vào isSearching

3. Cấu trúc layout tổng (Sale Screen)
Thành phần chính

Camera Preview

Search Input

Product Grid (danh sách sản phẩm)

Search Result List

Cart Panel (giỏ hàng)

Total + Checkout (sticky)

4. HÀNH VI CAMERA (CỰC KỲ QUAN TRỌNG)
4.1 Quy tắc camera
Trạng thái	Camera
Không search	Hiện FULL
Đang search / gõ	COLLAPSE hoặc thu nhỏ
Xoá search / blur	HIỆN LẠI

❌ Không được unmount camera
❌ Không được stop stream khi gõ
✔ Chỉ ẩn bằng CSS

4.2 Kỹ thuật camera
<div className={`camera-wrapper ${isSearching ? 'collapsed' : 'full'}`}>
  <CameraPreview />
</div>

.camera-wrapper {
  overflow: hidden;
  transition: height 0.25s ease, opacity 0.2s ease;
}

.camera-wrapper.full {
  height: 220px; /* mobile */
}

.camera-wrapper.collapsed {
  height: 0;
  opacity: 0;
}

5. HÀNH VI SEARCH INPUT
5.1 Khi focus search

Set isSearchInputFocused = true

Camera collapse

Product Grid ẨN (mobile)

5.2 Khi blur search

Nếu searchText === ""

Set isSearchInputFocused = false

Camera hiện lại

Grid hiện lại

6. PRODUCT GRID (DANH SÁCH SẢN PHẨM)
6.1 Desktop / Tablet

Grid LUÔN HIỆN

3–5 cột

Không bị ảnh hưởng bởi search

6.2 Mobile
Trạng thái	Grid
Không search	HIỆN
Đang search	ẨN HOÀN TOÀN
@media (max-width: 640px) {
  .product-grid {
    display: none;
  }

  .product-grid.show {
    display: grid;
  }
}


Logic:

showGrid = !isSearching

7. SEARCH RESULT + ADD TO CART
Khi đang search:

Kết quả search:

Hiện dạng LIST (1 cột)

Mỗi item có:

Tên

Giá

Nút “+” thêm nhanh

Thêm vào giỏ NGAY

Không điều hướng trang

8. BÁN NHANH (KHÔNG CÓ SẢN PHẨM)
Nút “⚡ BÁN NHANH”

Luôn hiển thị gần search

Khi bấm:

Popup nhập:

Tên (optional)

Giá (required)

Số lượng (default = 1)

Thêm thẳng vào giỏ

Không tạo product inventory

9. GIỎ HÀNG (CART)
Yêu cầu

Luôn hiển thị (desktop + mobile)

Có:

Tăng / giảm số lượng

Xoá item (nút rõ ràng, không swipe)

Không dùng gesture swipe trên web

10. TỔNG TIỀN & THANH TOÁN
Mobile

Sticky bottom bar

Không bị che bởi bàn phím

Khi bàn phím mở:

Auto scroll lên

Giữ visible tổng tiền + nút thanh toán

Desktop

Hiển thị panel phải

11. BÀN PHÍM MOBILE (BẮT BUỘC)

Khi input focus:

Auto scrollIntoView()

Không để:

Search input

Tổng tiền

Nút thanh toán
bị bàn phím che

12. LUỒNG HOÀN CHỈNH (SALE FLOW)

Vào bán hàng → camera full

Gõ / quét → camera collapse + grid ẩn

Thêm hàng → cart update realtime

Clear search → camera + grid hiện lại

Thanh toán → hoá đơn

Xong bill → quay lại sale screen (camera full)

13. TUYỆT ĐỐI KHÔNG ĐƯỢC

❌ Giữ grid sản phẩm khi đang gõ trên mobile
❌ Để camera chiếm chiều cao khi nhập liệu
❌ Unmount camera mỗi lần search
❌ Dùng 2–3 state chồng chéo khó debug
❌ Cố làm mobile giống desktop

14. CÂU CHỐT CHO AI

“Sales screen phải có 2 mode:
rảnh tay → xem sản phẩm
nhập liệu → tập trung giỏ hàng
Camera và grid phải tự nhường chỗ.”