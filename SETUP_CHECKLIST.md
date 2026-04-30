# ✅ GOOGLE DRIVE BACKUP - SETUP CHECKLIST

## Phase 1: Developer Setup (5-10 mins)

### Step 1: Create Google Cloud Project
- [ ] Go to https://console.cloud.google.com
- [ ] Click "Select a Project" → "New Project"
- [ ] Name: `OpenPOS-Backup`
- [ ] Click "Create"
- [ ] Wait 1-2 minutes for project to initialize

### Step 2: Enable APIs
- [ ] Go to **APIs & Services** → **Enable APIs and Services**
- [ ] Search: `Google Drive API` → Click → **Enable**
- [ ] Back to APIs → Search: `Google Sheets API` → Click → **Enable**

### Step 3: Create OAuth Credentials
- [ ] Go to **APIs & Services** → **Credentials**
- [ ] Click **"+ Create Credentials"** → **OAuth client ID**
- [ ] If prompted, click **"Configure OAuth Consent Screen"**
  - [ ] Choose **"External"**
  - [ ] Click **"Create"**
- [ ] Fill OAuth Consent Screen:
  - [ ] App name: `OpenPOS`
  - [ ] User support email: `your-email@gmail.com`
  - [ ] Developer contact: `your-email@gmail.com`
  - [ ] Click **"Save and Continue"**
  - [ ] Click **"Save and Continue"** (scopes - optional)
  - [ ] Click **"Save and Continue"** (test users)

### Step 4: Create Web Application Credential
- [ ] Click **"+ Create Credentials"** → **OAuth client ID**
- [ ] Application type: **Web application**
- [ ] Name: `OpenPOS Web`
- [ ] **Authorized JavaScript origins** add:
  - [ ] `http://localhost:5173`
  - [ ] `http://localhost:3000` (if testing on another port)
- [ ] Click **"Create"**
- [ ] **COPY CLIENT ID** (save in safe place!)
- [ ] Click **OK**

---

## Phase 2: Code Setup (5 mins)

### Step 1: Create .env File
- [ ] In project root (`d:\posweb\.env`), create file with:
```env
REACT_APP_GOOGLE_CLIENT_ID=PASTE_YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
```
- [ ] Replace `PASTE_YOUR_CLIENT_ID_HERE` with actual Client ID from Step 4
- [ ] Save file

### Step 2: Restart Development Server
- [ ] Kill current `npm run dev` (Ctrl+C in terminal)
- [ ] Run: `npm run dev`
- [ ] Wait for vite to rebuild
- [ ] Check: http://localhost:5173 loads without errors

---

## Phase 3: Database Setup (5 mins)

### Step 1: Execute Migration SQL
- [ ] Open: `supabase/backup_logs_migration.sql`
- [ ] Copy all content
- [ ] Login to Supabase Dashboard
- [ ] Go to **SQL Editor** → **New Query**
- [ ] Paste SQL content
- [ ] Click **"Run"** (or Ctrl+Shift+Enter)
- [ ] Check: Success message appears

### Step 2: Verify Tables
- [ ] Go to **Table Editor**
- [ ] Look for new table: `backup_logs`
- [ ] Verify columns exist (id, shop_id, month, status, etc.)

---

## Phase 4: Feature Test (10 mins)

### Step 1: Settings Page
- [ ] Login to app
- [ ] Go to ⚙️ **Settings** (menu)
- [ ] Scroll to **☁️ Google Drive Backup**
- [ ] Check: "ĐĂNG NHẬP GOOGLE DRIVE" section visible

### Step 2: Google Login
- [ ] Click **"Sign in with Google"** button
- [ ] Sign in with Google account
- [ ] Grant "OpenPOS" access to Drive
- [ ] Check: User info displays (email, picture)
- [ ] Check: "Đã đăng nhập" (logged in) shows

### Step 3: Reports Page
- [ ] Go to **📊 Thống kê** (Reports)
- [ ] Select month with sales (if no sales, create test sale first)
- [ ] Check: Drive connection status shows (blue box saying "Google Drive đã kết nối")
- [ ] Check: Button "📊 Xuất báo cáo tháng" visible

### Step 4: Export Test
- [ ] Click **"📊 Xuất báo cáo tháng"**
- [ ] Check: File downloads (Bao-cao-POS-MM-YYYY.xlsx)
- [ ] Check: Toast notification appears:
  - [ ] "✅ Đã xuất báo cáo tháng thành công!"
  - [ ] "⏳ Đang sao lưu lên Google Drive..."
  - [ ] "✅ Báo cáo cũng đã được sao lưu..."
- [ ] Wait 2-3 seconds for upload

### Step 5: Verify Google Drive
- [ ] Open https://drive.google.com
- [ ] Look for folder: `OpenPOS-Backups` (at root of "My Drive")
- [ ] Open: `OpenPOS-Backups` → `[Your Shop Name]` → `2026` → `01` (or current month)
- [ ] Check: File exists: `Bao-cao-POS-01-2026.xlsx` (or current month)
- [ ] Download & open file
- [ ] Check: Has 6 sheets (Tổng quan, Chi tiết, Daily Revenue, etc.)

### Step 6: Verify Database
- [ ] Go to Supabase → **Table Editor** → `backup_logs`
- [ ] Check: New row exists with:
  - [ ] status: `SUCCESS`
  - [ ] file_name: `Bao-cao-POS-01-2026.xlsx`
  - [ ] month: `2026-01`
  - [ ] created_at: recent timestamp

---

## Phase 5: Settings Page Features (5 mins)

### Step 1: Backup Status
- [ ] Go to Settings → **Google Drive Backup**
- [ ] Under "LỊCH SỬ SAO LƯU" (Backup History)
- [ ] Check: Last backup status shows
  - [ ] ✓ Thành công (Success)
  - [ ] Date: just now
  - [ ] File name: Bao-cao-POS-01-2026.xlsx

### Step 2: Manual Backup Button
- [ ] Still in Settings → **Google Drive Backup**
- [ ] Under "SAO LƯU THỦ CÔNG" (Manual Backup)
- [ ] Click **"💾 Sao lưu ngay"** button
- [ ] Check: Success notification shows
- [ ] Check: New entry in backup_logs table

### Step 3: Auto Backup Toggle (Optional)
- [ ] Toggle: **"☑ Tự động sao lưu hàng tháng"**
- [ ] Check: Toggles ON (blue)
- [ ] Go to Supabase → Check `shops` table
- [ ] Verify: `drive_auto_backup` = true for your shop
- [ ] (Note: CRON job for auto execution not yet implemented)

---

## Phase 6: Advanced Features (Optional)

### Multiple Exports Test
- [ ] Export same month twice
- [ ] Check: 
  - [ ] Second file overwrites first (same Drive file)
  - [ ] backup_logs has 2 entries
  - [ ] Both status: SUCCESS

### Different Month Export
- [ ] Navigate to different month in Reports
- [ ] Click "📊 Xuất báo cáo"
- [ ] Check Google Drive:
  - [ ] New folder created: `/OpenPOS-Backups/[Shop]/2026/02/` (etc)
  - [ ] File: `Bao-cao-POS-02-2026.xlsx`

### Logout Test
- [ ] Go to Settings → Google Drive Backup
- [ ] Click **"Đăng xuất"** (Logout button)
- [ ] Check: User info disappears
- [ ] Check: Toggle & buttons become disabled
- [ ] Try export: Only downloads, no Drive upload

### Re-login Test
- [ ] Click "Sign in with Google" again
- [ ] Check: Full cycle works again

---

## 🚨 Troubleshooting Checklist

### If "Client ID không tìm thấy"
- [ ] Check `.env` file exists
- [ ] Check format: `REACT_APP_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com`
- [ ] No spaces before/after
- [ ] Restart `npm run dev`

### If "Unauthorized redirect URI"
- [ ] Go to Google Console → OAuth credentials
- [ ] Edit → Add `http://localhost:5173`
- [ ] Save
- [ ] Refresh browser

### If File doesn't upload to Drive
- [ ] Check browser console: F12 → Console
- [ ] Look for error messages
- [ ] Check: Were Drive permissions granted? (should see user info)
- [ ] Check: backup_logs has row with status = FAILED?
- [ ] Check error_message in backup_logs

### If File uploaded but can't find in Drive
- [ ] Refresh Drive page (F5)
- [ ] Check: Root folder for `OpenPOS-Backups`
- [ ] Navigate: `OpenPOS-Backups` → [Shop Name] → [Year] → [Month]
- [ ] File should be there

### If Database migration failed
- [ ] Check Supabase error message
- [ ] Verify: All tables in SQL script created (backup_logs)
- [ ] Re-run SQL if failed

---

## ✅ Final Checklist

### Before Considering Complete:
- [ ] Google Cloud Project created
- [ ] OAuth credentials obtained
- [ ] `.env` file configured
- [ ] Database migration executed
- [ ] npm run dev restarted
- [ ] Settings page Drive section loads
- [ ] Google login works
- [ ] Export → Drive upload works
- [ ] File appears in Google Drive folder
- [ ] backup_logs shows SUCCESS entry
- [ ] Manual backup button works
- [ ] Different month export creates new folder
- [ ] Logout/re-login works
- [ ] No errors in browser console

---

## 📞 If You Get Stuck

1. **Check file**: GOOGLE_SETUP.md (detailed step-by-step)
2. **Check logs**: 
   - Browser: F12 → Console
   - Supabase: SQL Editor → check backup_logs table
3. **Check config**:
   - `.env` file format
   - Google Console → Credentials → Check Client ID
4. **Contact**: Provide error message from console

---

## 🎉 Success!

If you've checked all items above, Google Drive Backup is ready to use!

- ✅ Users can backup reports to Drive
- ✅ Backup history is logged
- ✅ Drive folder structure is organized
- ✅ Settings page shows status

**Next**: Optionally implement Phase 2 (auto CRON, backend API, etc.)

---

**Last Updated**: January 6, 2026
