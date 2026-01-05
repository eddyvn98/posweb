# Google OAuth Setup cho POS Backup

## Mục đích
Cho phép app truy cập Google Drive để tự động sao lưu file Excel báo cáo hàng tháng.

## Bước 1: Tạo Google Cloud Project

1. Vào https://console.cloud.google.com
2. Nhấn **"Select a Project"** → **"New Project"**
3. Tên project: `OpenPOS-Backup`
4. Nhấn **"Create"**
5. Chờ project được tạo (1-2 phút)

## Bước 2: Enable APIs

1. Vào **APIs & Services** (menu bên trái)
2. Nhấn **"Enable APIs and Services"** (nút xanh ở trên)
3. Tìm kiếm: `Google Drive API`
   - Nhấn vào → **"Enable"**
4. Quay lại, tìm kiếm: `Google Sheets API`
   - Nhấn vào → **"Enable"**

## Bước 3: Tạo OAuth 2.0 Credential

1. Vào **APIs & Services** → **Credentials** (menu trái)
2. Nhấn **"+ Create Credentials"** → **"OAuth client ID"**
3. Nếu được hỏi "Configure OAuth consent screen":
   - Chọn **"External"**
   - Nhấn **"Create"**
4. Điền form (User Consent Screen):
   - App name: `OpenPOS`
   - User support email: `your-email@gmail.com`
   - Developer contact: `your-email@gmail.com`
   - Nhấn **"Save and Continue"**
5. **Scopes** → **"Save and Continue"**
6. **Test users** → **"Save and Continue"** (skip)
7. Quay lại **Credentials**

8. Nhấn **"+ Create Credentials"** → **"OAuth client ID"**
9. Application type: **Web application**
10. Tên: `OpenPOS Web Client`
11. **Authorized JavaScript origins**:
    ```
    http://localhost:5173
    http://localhost:3000
    ```
12. **Authorized redirect URIs** (leave empty or add):
    ```
    http://localhost:5173/callback
    http://localhost:3000/callback
    ```
13. Nhấn **"Create"**

## Bước 4: Copy Client ID

1. Popup sẽ hiện **Client ID** và **Client Secret**
2. **Copy Client ID** (chuỗi dài kết thúc bằng `.apps.googleusercontent.com`)
3. Nhấn **OK**

## Bước 5: Thêm Client ID vào project

### Option A: Biến môi trường (.env)

Tạo file `.env` ở thư mục gốc project:

```env
REACT_APP_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
```

Thay `YOUR_CLIENT_ID_HERE` bằng Client ID từ bước 4.

### Option B: Hardcode trong code (không khuyến nghị)

Trong `src/main.jsx`:

```jsx
import { GoogleOAuthProvider } from '@react-oauth/google'

const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com'

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
)
```

## Bước 6: Cập nhật main.jsx

Đảm bảo `GoogleOAuthProvider` wrap `<App />`:

```jsx
import { GoogleOAuthProvider } from '@react-oauth/google'

const GOOGLE_CLIENT_ID = import.meta.env.REACT_APP_GOOGLE_CLIENT_ID

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>,
  document.getElementById('root')
)
```

## Bước 7: Test

1. Chạy `npm run dev`
2. Vào Settings → Google Drive Backup
3. Nhấn nút "Sign in with Google"
4. Đăng nhập tài khoản Google
5. Cấp quyền truy cập Google Drive
6. Nhấn "Sao lưu ngay"

## Troubleshooting

### Lỗi "Invalid Client ID"
- Kiểm tra Client ID trong `.env`
- Đảm bảo không có khoảng trắng ở đầu/cuối
- Restart `npm run dev`

### Lỗi "Unauthorized redirect URI"
- Kiểm tra URI trong Google Console
- Đảm bảo `http://localhost:5173` được thêm vào
- Nếu deploy, thêm domain production vào

### Lỗi "User hasn't granted access"
- Người dùng chưa cấp quyền Drive
- Bấm lại "Sign in" và accept permissions

### File không upload được
- Kiểm tra quyền Drive được grant
- Xem console browser để debug (F12 → Console)
- Check backup_logs table để xem error message

## Scopes được sử dụng

```
https://www.googleapis.com/auth/drive.file
```

**Ý nghĩa**: App chỉ có quyền tạo/sửa file do app tạo ra, không được xem các file khác.

## Security Note

- **KHÔNG** lưu trữ access token ở backend
- Token được lưu ở localStorage (client-side)
- Mỗi session người dùng cấp quyền lại
- Token tự động hết hạn sau vài giờ

## Production Deployment

1. Vào Google Cloud Console → Credentials
2. Thêm domain production:
   ```
   https://yourdomain.com
   https://www.yourdomain.com
   ```
3. Update `.env` production:
   ```env
   REACT_APP_GOOGLE_CLIENT_ID=YOUR_PRODUCTION_CLIENT_ID
   ```
4. Deploy lại

---

**Tài liệu tham khảo**: https://developers.google.com/drive/api/guides/about-auth
