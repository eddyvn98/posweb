# 🚀 Quick Start: Google Drive Backup

## Mục đích
Tự động sao lưu báo cáo tháng lên Google Drive để:
- Chủ shop có file cầm tay
- An toàn nếu máy/trình duyệt bị mất
- Thuế gọi đột xuất có bằng chứng

## 3 Bước Setup

### 1️⃣ Lấy Google Client ID (5 phút)
Làm theo file **GOOGLE_SETUP.md**:
1. Vào https://console.cloud.google.com
2. Tạo project mới: `OpenPOS-Backup`
3. Enable API: Google Drive + Google Sheets
4. Tạo OAuth credential (Web)
5. Copy **Client ID**

### 2️⃣ Cấu hình Project (1 phút)
Tạo/edit file `.env` tại thư mục gốc:
```env
REACT_APP_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
```
Thay `YOUR_CLIENT_ID_HERE` bằng ID từ bước 1.

Restart dev server:
```bash
npm run dev
```

### 3️⃣ Execute Migration SQL (2 phút)
Chạy SQL trong Supabase SQL Editor:
- Copy nội dung file: `supabase/backup_logs_migration.sql`
- Paste vào Supabase → SQL Editor
- Bấm "Run"

---

## 💡 Sử Dụng

### Đăng nhập Google Drive
1. Vào **⚙️ Cài đặt** (menu dưới)
2. Scroll xuống → **☁️ Google Drive Backup**
3. Bấm nút **"Sign in with Google"**
4. Chọn tài khoản Google
5. Cho phép truy cập Drive

### Sao lưu thủ công
1. Vào **📊 Thống kê**
2. Chọn tháng cần xuất
3. Bấm **"📊 Xuất báo cáo tháng"**
4. File sẽ:
   - Download xuống máy
   - Tự động lưu lên Google Drive
   - Ghi log vào `backup_logs`

### Bật tự động sao lưu (optional)
Trong **Cài đặt** → **Google Drive Backup**:
- Toggle: "☑ Tự động sao lưu hàng tháng"
- Mỗi ngày 1 hàng tháng lúc 02:00 sáng sẽ tự động backup
- (Cần backend API để chạy - đang phát triển)

---

## 📍 File được lưu ở đâu?
```
Google Drive
└── My Drive
    └── OpenPOS-Backups/
        └── Cửa Hàng ABC/
            └── 2026/
                └── 01/
                    └── Bao-cao-POS-01-2026.xlsx
```

Mỗi tháng 1 file, mỗi cửa hàng 1 folder riêng.

---

## ✅ Checklist Test

- [ ] Đã lấy Google Client ID
- [ ] Đã cấu hình .env
- [ ] Đã execute migration SQL
- [ ] Đã restart `npm run dev`
- [ ] Đăng nhập Google Drive thành công
- [ ] Xuất báo cáo → file download + upload Drive
- [ ] Vào Google Drive kiểm tra folder `/OpenPOS-Backups/`
- [ ] File tên đúng: `Bao-cao-POS-MM-YYYY.xlsx`

---

## ❓ Troubleshooting

### Lỗi "Client ID không tìm thấy"
→ Kiểm tra `.env` file có đúng không
→ Restart `npm run dev` 

### Lỗi "Unauthorized redirect URI"
→ Vào Google Console → Edit OAuth credential
→ Thêm: `http://localhost:5173`

### File không upload được
→ Kiểm tra đã cấp quyền Drive chưa (bấm lại Sign In)
→ Xem console browser (F12) tìm error

### File upload thành công nhưng không thấy trên Drive
→ Refresh page Drive
→ Kiểm tra folder `/OpenPOS-Backups/` cấp cao nhất

---

## 🔐 An toàn?
✅ **Có, vì:**
- Chỉ tạo file, không đọc file khác
- Token không lưu ở server
- Mỗi user tự cấp quyền
- Backup logs chỉ lưu metadata

---

## 📞 Hỗ trợ

Nếu gặp lỗi:
1. Xem **GOOGLE_SETUP.md** phần "Troubleshooting"
2. Xem console browser: F12 → Console tab
3. Kiểm tra network request (F12 → Network)
4. Đọc error message của Google

---

**Status**: ✅ Ready to use
**Last Updated**: January 6, 2026
