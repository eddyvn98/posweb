# Google Drive Backup Implementation Summary

## ✅ Đã Triển Khai

### 1. Database Layer
- ✅ Bảng `backup_logs` với các cột:
  - `id`, `shop_id`, `month`, `file_name`, `drive_file_id`, `status`
  - RLS policies để mỗi shop chỉ xem log của shop mình
  - Indexes để query nhanh

### 2. Frontend Components
- ✅ **DriveContext.jsx**: Quản lý Google OAuth authentication
  - `useDriveAuth()`: Hook để access auth state
  - `DriveProvider`: Wrapper provider
  - `DriveLoginButton`: Component đăng nhập/logout

- ✅ **BackupStatus.jsx**: Hiển thị trạng thái sao lưu
  - `BackupStatus`: Hiển thị lần sao lưu gần nhất
  - `BackupButton`: Nút sao lưu ngay

- ✅ **Settings.jsx**: Cài đặt Google Drive backup
  - Toggle tự động sao lưu
  - Đăng nhập/logout Google Drive
  - Hiển thị status sao lưu cuối cùng

- ✅ **Reports.jsx**: Tích hợp auto-upload
  - Auto log lên backup_logs sau khi export
  - Hiển thị Drive status info
  - Gợi ý đăng nhập nếu chưa

### 3. Utility Functions
- ✅ **driveBackup.js**: Google Drive API helpers
  - `getDriveApi()`: Lấy Drive API instance
  - `ensureFolderExists()`: Tạo folder structure
  - `uploadToDrive()`: Upload file Excel
  - `makeFilePublic()`: Làm public link (optional)
  - `openDriveFolder()`: Mở folder trên Drive

### 4. Configuration
- ✅ **GOOGLE_SETUP.md**: Hướng dẫn setup Google OAuth
  - Từng bước tạo Google Cloud Project
  - Enable APIs (Drive, Sheets)
  - Tạo OAuth 2.0 credentials
  - Copy Client ID

- ✅ **.env.example**: Template cho env variables

- ✅ **main.jsx**: GoogleOAuthProvider wrapper

- ✅ **App.jsx**: DriveProvider wrapper

---

## ⏳ Còn Cần Làm (Optional/Phase 2)

### 1. Tạo Backend API Endpoints
**Endpoint 1: Manual Backup Trigger**
```
POST /api/backup/manual
Body: { shop_id, shop_name, month, year }
Response: { fileId, fileName, driveLink }
```

**Endpoint 2: Auto Backup (CRON)**
```
POST /api/backup/cron (mỗi ngày 1 hàng tháng lúc 02:00 GMT+7)
- Query DB tháng trước
- Build Excel file (server-side)
- Upload Drive
- Log vào backup_logs
```

### 2. Improve Excel Export
Hiện tại export download xuống local, cần:
- Return blob thay vì download ngay
- Truyền blob tới `uploadToDrive()`
- Không cần download nếu auto-upload thành công

### 3. Cron Job cho Auto Backup
```javascript
// Dùng node-cron hoặc Firebase Cloud Functions
const schedule = require('node-cron')
schedule.scheduleJob('0 2 1 * *', async () => {
  // Chạy lúc 02:00 sáng ngày 1 hàng tháng
  // Backup tháng trước cho tất cả shops
})
```

### 4. Share Link Feature
```javascript
// Cho chủ shop share link báo cáo với kế toán
// Cần permission management
```

### 5. Restore Functionality
```javascript
// Cho chủ shop download báo cáo cũ từ Drive
// List các file đã backup
```

---

## 🚀 Deployment Checklist

### Trước khi deploy:
- [ ] Tạo Google Cloud Project (production)
- [ ] Copy Client ID vào `.env.production`
- [ ] Thêm domain production vào Google OAuth scopes
- [ ] Execute migration SQL: `backup_logs_migration.sql`
- [ ] Test flow: 
  1. Đăng nhập Settings
  2. Bấm nút "Sign in with Google"
  3. Cấp quyền Drive
  4. Vào Reports → Xuất báo cáo
  5. Kiểm tra backup_logs table

---

## 📋 Testing Checklist

### Unit Tests
```javascript
// test/driveBackup.test.js
- ensureFolderExists() tạo folder đúng structure
- uploadToDrive() upload file đúng
- methodMap trong export.js tính đúng
```

### Integration Tests
```javascript
// test/backup.integration.test.js
- Export → Drive flow
- Backup logs được ghi đúng
- Google auth flow
```

### Manual Testing
- [ ] Export Excel → file có 6 sheets
- [ ] Dates tính GMT+7 đúng
- [ ] Numbers format VND đúng
- [ ] Upload Drive → file tên đúng
- [ ] Folder structure `/OpenPOS-Backups/{shop}/{year}/{month}/`
- [ ] Backup log được ghi status SUCCESS
- [ ] Lần export tiếp theo không ghi đè file cũ

---

## 🔐 Security Notes

1. **Token Management**
   - Token lưu localStorage (client-side)
   - Tự động hết hạn sau vài giờ
   - Không gửi về backend
   
2. **Scopes**
   - `https://www.googleapis.com/auth/drive.file`
   - Chỉ tạo/sửa file do app tạo
   - Không đọc file khác của user

3. **Data Protection**
   - Backup logs chỉ lưu metadata (file_id, status, tên file)
   - Không lưu content file
   - RLS policies bảo vệ dữ liệu mỗi shop

4. **Audit Trail**
   - Mỗi backup được log: created_at, completed_at, status
   - Nếu fail, error_message được ghi
   - Có thể trace ai/khi nào backup

---

## 📊 Database Schema Reference

### backup_logs table
```sql
id (UUID)
shop_id (UUID, FK)
month (TEXT) -- YYYY-MM
file_name (TEXT) -- Bao-cao-POS-01-2026.xlsx
drive_file_id (TEXT) -- Google Drive File ID
drive_folder_path (TEXT) -- Folder path trên Drive
status (TEXT) -- SUCCESS, FAILED, PENDING
backup_type (TEXT) -- AUTO, MANUAL
created_at (TIMESTAMP)
completed_at (TIMESTAMP)
error_message (TEXT)
file_size_bytes (BIGINT)
backup_source (TEXT) -- EXPORT, CRON, API
```

### shops table (mở rộng)
```sql
drive_auto_backup (BOOLEAN) -- Toggle auto backup
drive_folder_id (TEXT) -- Root folder ID trên Drive
drive_auth_token (TEXT) -- (Optional) Encrypted token
```

---

## 🎯 MVP vs Phase 2

### MVP (Done)
- ✅ Google OAuth login
- ✅ Manual backup từ Reports page
- ✅ Backup logs table
- ✅ Drive folder structure
- ✅ UI trong Settings

### Phase 2 (Optional)
- ⏳ Auto backup CRON (ngày 1 hàng tháng 02:00)
- ⏳ Restore download từ Drive
- ⏳ Share link với kế toán
- ⏳ Backup analytics dashboard

---

## 📚 File Changes Summary

**Created:**
- `supabase/backup_logs_migration.sql` - Database schema
- `src/lib/driveBackup.js` - Drive API utilities
- `src/contexts/DriveContext.jsx` - Auth context
- `src/components/BackupStatus.jsx` - Status UI
- `GOOGLE_SETUP.md` - Setup guide
- `.env.example` - Template

**Modified:**
- `src/pages/Settings.jsx` - Added Drive section
- `src/pages/Reports.jsx` - Added auto-upload logic
- `src/main.jsx` - GoogleOAuthProvider wrapper
- `src/App.jsx` - DriveProvider wrapper

---

## 🔗 References

- Google Drive API: https://developers.google.com/drive/api
- @react-oauth/google: https://www.npmjs.com/package/@react-oauth/google
- new3.md: Spec gốc cho backup

---

**Status**: ✅ MVP Ready for Testing
**Last Updated**: January 6, 2026
