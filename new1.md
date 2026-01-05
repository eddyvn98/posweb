II. SPEC CHI TIẾT CÁC MỤC CÒN THIẾU (CHO AI CODE)
A. REPORTS – LOGIC BACKEND (BẮT BUỘC)
A1. API lấy dữ liệu báo cáo tháng

Input

shop_id
month = YYYY-MM
timezone = Asia/Ho_Chi_Minh


Query bắt buộc

sales (đã sync)

sale_voids

cashbook

inventory_logs (để snapshot cuối kỳ)

❌ Không lấy local data

A2. Chuẩn hóa dữ liệu bán

AI PHẢI đảm bảo:

1 sale = 1 record

Sale bị huỷ:

vẫn xuất

có status = "HUY"

Doanh thu:

chỉ tính sale không huỷ

B. REPORTS – UI CÒN THIẾU
B1. Doanh thu theo ngày (MỚI)

UI

Table:

Ngày

Doanh thu

Số giao dịch

Logic

Group theo sale_local_date (GMT+7)

Chỉ tính sale không huỷ

B2. Theo phương thức thanh toán (MỚI)

UI

Table:

Phương thức (Tiền mặt / Chuyển khoản / QR)

Tổng tiền

Số giao dịch

Mục đích

Đối chiếu sao kê ngân hàng

B3. Thu – Chi (MỚI)

UI

Table:

Ngày

Loại (Thu / Chi)

Số tiền

Ghi chú

Logic

Thu:

auto từ sales

Chi:

từ cashbook

B4. Tồn kho cuối kỳ (MỚI – ĐƠN GIẢN)

UI

Table:

Tên SP

SL tồn

Giá vốn ước tính

Giá trị tồn

⚠️ Không cần realtime, chỉ snapshot cuối tháng

III. SPEC XUẤT FILE EXCEL (PHẦN QUAN TRỌNG NHẤT)
1. TÊN FILE
Doanh-thu-01-2026.xlsx

2. CẤU TRÚC FILE – AI PHẢI TẠO ĐỦ 6 SHEET
SHEET 1 – Tổng quan

Tên cửa hàng

Tháng báo cáo

Ngày xuất file

Tổng doanh thu

Tổng giao dịch

Doanh thu TB/giao dịch

SHEET 2 – Chi tiết bán hàng (BẮT BUỘC)

Cột

Ngày bán (dd/mm/yyyy – GMT+7)

Giờ bán (hh:mm)

Mã phiếu (HD-xxxxx)

Tổng tiền

Phương thức TT

Trạng thái (Binh thuong / Huy)

👉 Đây là sheet thuế xem kỹ nhất

SHEET 3 – Doanh thu theo ngày

| Ngày | Doanh thu | Số giao dịch |

SHEET 4 – Theo phương thức thanh toán

| Phương thức | Tổng tiền | Số GD |

SHEET 5 – Thu - Chi

| Ngày | Thu/Chi | Số tiền | Nội dung |

SHEET 6 – Tồn kho cuối kỳ

| Tên SP | SL tồn | Giá vốn | Giá trị tồn |

3. QUY TẮC CỨNG (AI KHÔNG ĐƯỢC SAI)

❌ Không VAT
❌ Không thuế phải nộp
❌ Không lợi nhuận kế toán
❌ Không sửa/xoá sale

✅ Chỉ phản ánh doanh thu thực

4. METADATA CUỐI FILE (BẮT BUỘC)

Cuối sheet Tổng quan:

Dữ liệu được xuất tự động từ hệ thống POS, không chỉnh sửa thủ công.

5. KỸ THUẬT XUẤT EXCEL

Khuyến nghị

Node.js

exceljs

Flow

Query DB

Build workbook

Format số (VND)

Xuất file

(Optional) upload Drive

IV. PROMPT CUỐI – COPY ĐƯA CHO AI

Implement missing report features and a compliant Excel export for a POS system serving Vietnamese household businesses under 500M VND revenue.
Complete monthly reports including daily revenue, payment methods, cashbook, and end-of-month inventory.
Generate a multi-sheet Excel file with overview, detailed sales (append-only, voids as status), daily revenue, payment breakdown, cashbook, and inventory snapshot.
Use Vietnam local timezone (GMT+7).
Do not include VAT, tax calculation, or profit accounting.
The output must be suitable for tax inspection.