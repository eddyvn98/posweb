1. MỤC TIÊU SAO LƯU (AI PHẢI HIỂU ĐÚNG)

Sao lưu để:

Chủ shop có file cầm tay

Khi:

mất máy

hỏng trình duyệt

thuế gọi đột xuất

KHÔNG dùng Drive làm DB

KHÔNG sync ngược về hệ thống

👉 Drive = két sắt, không phải database.

2. SAO LƯU NHỮNG GÌ? (RẤT QUAN TRỌNG)
A. BẮT BUỘC PHẢI LƯU (MVP)
1️⃣ File Excel báo cáo tháng (QUAN TRỌNG NHẤT)

Tên file

Bao-cao-POS-01-2026.xlsx


Nội dung file (đã chốt trước đó – nhắc lại để AI nhớ):

Sheet 1: Tổng quan

Sheet 2: Chi tiết bán hàng

Sheet 3: Doanh thu theo ngày

Sheet 4: Theo phương thức thanh toán

Sheet 5: Thu – Chi

Sheet 6: Tồn kho cuối kỳ

👉 Đây là file thuế cần

2️⃣ File PDF hóa đơn lẻ

Mỗi sale:

có thể xuất PDF

Nhưng:

KHÔNG auto backup từng hóa đơn

Chỉ khi user bấm “Share / Lưu”

B. TUYỆT ĐỐI KHÔNG LƯU

❌ Database dump
❌ Token đăng nhập
❌ Thông tin nhạy cảm
❌ File realtime sync

3. CẤU TRÚC THƯ MỤC TRÊN DRIVE (AI PHẢI TẠO ĐÚNG)
/OpenPOS-Backups/
  /Cua-hang-ABC/
    /2026/
      /01/
        Bao-cao-POS-01-2026.xlsx
      /02/
        Bao-cao-POS-02-2026.xlsx


👉 Mỗi cửa hàng 1 folder riêng
👉 Mỗi tháng 1 folder

4. KHI NÀO SAO LƯU?
A. TỰ ĐỘNG (AUTO)

Thời điểm:

Ngày 1 hàng tháng

Giờ: 02:00 sáng (GMT+7)

Việc làm:

Generate Excel tháng trước

Upload Drive

Ghi log

B. THỦ CÔNG (MANUAL)

Trong Cài đặt:

Nút: “Sao lưu ngay”

Cho chọn:

Tháng

Bấm → export + upload

5. LOGIC KỸ THUẬT (AI CODE THEO)
1️⃣ OAuth Google Drive

Scope:

https://www.googleapis.com/auth/drive.file


👉 Chỉ tạo / sửa file do app tạo

2️⃣ Backend Flow (BẮT BUỘC)
CRON / Manual Trigger
→ Query DB theo tháng
→ Build Excel (exceljs)
→ Check folder tồn tại?
   - chưa có → tạo
→ Upload file
→ Save backup_log

3️⃣ BẢNG LOG SAO LƯU (PHẢI CÓ)
backup_logs

id

shop_id

month (YYYY-MM)

file_name

drive_file_id

status (SUCCESS / FAIL)

created_at

error_message (nếu fail)

👉 Để hiển thị trong UI

6. UI TRONG CÀI ĐẶT (AI PHẢI LÀM)
A. Toggle

☑ Tự động sao lưu Google Drive

B. Trạng thái

Lần sao lưu gần nhất

Trạng thái:

Thành công / Thất bại

C. Hành động

Nút:

“Sao lưu ngay”

“Mở thư mục Drive”

7. ACCEPTANCE CRITERIA (AI TỰ TEST)

File Excel mở được

Đúng tháng

Đúng số liệu UI

Upload đúng thư mục

Không ghi đè file cũ

Fail có log

Không ảnh hưởng data đang chạy

8. PROMPT NGẮN – COPY CHO AI

Implement automatic Google Drive backup for a POS system.
The backup must upload a monthly Excel report containing sales, daily revenue, payment breakdown, cashbook, and end-of-month inventory.
Organize files by shop and month in Drive.
Drive is used as cold storage only, not as a database.
Include manual backup, status logs, and do not store sensitive credentials.

9. CÂU CHỐT CUỐI

Drive không phải để sync – Drive là két sắt.
Chỉ cần Excel đúng + lưu đều → thuế không làm khó.