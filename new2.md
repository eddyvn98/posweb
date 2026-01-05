I. NHẬP HÀNG (CHƯA CÓ) – SPEC BẮT BUỘC
1. MỤC TIÊU

Ghi nhận CHI PHÍ NHẬP

Cộng TỒN KHO

Phục vụ:

báo cáo chi

tồn kho cuối kỳ

giải trình tiền đi đâu

❗ KHÔNG tạo doanh thu

2. DATA MODEL (AI PHẢI CÓ)
imports

id

shop_id

import_date (local date GMT+7)

supplier_name (TEXT, không FK)

total_cost

note

created_at

import_items (optional, MVP có thể bỏ)

import_id

product_id

quantity

cost_price

inventory_logs

product_id

change_qty (+)

reason = IMPORT

ref_id = import_id

3. UI NHẬP HÀNG (MVP – ĐƠN GIẢN)
Form

Ngày nhập (default hôm nay)

Nhà cung cấp (text)

Tổng tiền nhập (bắt buộc)

Ghi chú

Hành vi

Submit → tạo import

Cộng tồn kho

Ghi 1 dòng CHI vào sổ thu chi

4. ACCEPTANCE CRITERIA (AI TỰ CHECK)

Nhập hàng KHÔNG làm tăng doanh thu

Sau nhập, tồn kho tăng

Sổ thu chi có dòng CHI

Có thể export nhập hàng ra Excel (qua sheet Thu–Chi)

II. SỔ THU CHI (CHƯA CÓ) – SPEC BẮT BUỘC
1. MỤC TIÊU

Thuế luôn hỏi

Không có → thuế tự ước chi (bất lợi)

2. DATA MODEL
cashbook

id

shop_id

date (local date)

type = INCOME | EXPENSE

amount

category (text)

note

source = SALE | IMPORT | MANUAL

3. LOGIC CHUẨN (AI PHẢI PHÂN BIỆT)
Thu

Auto từ:

sale không huỷ

Read-only

Chi

Từ:

nhập hàng

chi tay (điện, nước, thuê nhà)

4. UI

Table:

Ngày

Thu / Chi

Số tiền

Nội dung

Filter theo tháng

5. ACCEPTANCE CRITERIA

Tổng THU = tổng doanh thu

Tổng CHI = nhập hàng + chi tay

Xuất Excel có sheet Thu–Chi

III. LỊCH SỬ BÁN (ĐÃ LÀM – NHƯNG PHẢI ĐẠT CHUẨN)
1. KIỂM TRA LOGIC BẮT BUỘC

AI PHẢI KIỂM:

Mỗi sale có:

Mã phiếu (hiển thị ngắn)

Ngày + giờ (GMT+7)

Tổng tiền

Phương thức thanh toán

Trạng thái:

Bình thường

Huỷ

2. HUỶ PHIẾU (RẤT QUAN TRỌNG)
YÊU CẦU

❌ Không xoá sale

✅ Tạo sale_void

UI

Nút Huỷ phiếu

Popup:

chọn lý do

Sau huỷ

Doanh thu báo cáo giảm

Sale vẫn xuất trong Excel (status = HUỶ)

3. ACCEPTANCE CRITERIA

Huỷ không làm mất dữ liệu

Excel vẫn có sale bị huỷ

Doanh thu tháng tính đúng

IV. BÁO CÁO (ĐÃ LÀM – KIỂM TRA ĐẠT CHUẨN CHƯA)
1. BẮT BUỘC PHẢI CÓ (NẾU THIẾU → FAIL)
A. Doanh thu theo tháng

Tổng tiền

Tổng giao dịch

Trung bình/giao dịch

B. Doanh thu theo NGÀY

Group theo local date

Không tính sale huỷ

C. Theo phương thức thanh toán

Cash / Transfer / QR

D. Thu – Chi

Lấy từ cashbook

E. Tồn kho cuối kỳ

Snapshot cuối tháng

2. KIỂM TRA THỜI GIAN (HAY SAI)

Bán 23:xx → vẫn thuộc ngày đó

Không group theo UTC

3. ACCEPTANCE CRITERIA

Số liệu UI = số liệu Excel

Không có VAT

Không có lợi nhuận kế toán

Thuế xem hiểu ngay

V. CÀI ĐẶT (CHƯA MÔ TẢ – SPEC ĐẦY ĐỦ)
1. MỤC TIÊU

Ít

Dùng được

Không phá dữ liệu

2. MỤC TRONG CÀI ĐẶT (CHỐT)
Thông tin cửa hàng

Tên cửa hàng

Địa chỉ (optional)

Sao lưu

Toggle:

Tự động sao lưu Google Drive

Hiện:

lần backup gần nhất

link Drive

Xuất dữ liệu

Nút:

Xuất báo cáo tháng

Chọn tháng

Excel / PDF

Cache

Nút:

Xoá dữ liệu offline (IndexedDB)

❌ KHÔNG ảnh hưởng server

3. CẤM TUYỆT ĐỐI TRONG CÀI ĐẶT

❌ Reset dữ liệu
❌ Xoá toàn bộ
❌ Chỉnh sửa doanh thu
❌ Cấu hình thuế

4. ACCEPTANCE CRITERIA

User không thể làm mất dữ liệu

Sao lưu chạy được

Xuất file đúng chuẩn

VI. PROMPT KIỂM TRA CHO AI (COPY NGUYÊN)

Verify and complete the missing modules: Imports, Cashbook, Settings.
Audit existing Sales History and Reports against the defined acceptance criteria.
Ensure imports increase inventory and create expenses, cashbook separates income and expense, sales voiding is append-only, and reports include daily revenue, payment methods, cashbook, and end-of-month inventory.
Implement Settings with shop info, manual export, Google Drive backup, and local cache clearing only.
Do not implement VAT, tax calculation, or destructive data operations.

CHỐT CUỐI

Nếu AI:

làm đủ Nhập hàng + Sổ thu chi

kiểm tra & fix Lịch sử bán + Báo cáo theo checklist

code Cài đặt đúng scope

👉 thì hệ thống đã đủ để dùng thật & đưa thuế cho hộ <500tr.