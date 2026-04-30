-- ============ BACKUP LOGS TABLE ============
-- Lưu trữ log sao lưu tên backup lên Google Drive
-- Mục đích: Hiển thị trạng thái, debug, revert nếu cần

CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    month TEXT NOT NULL,  -- YYYY-MM format
    file_name TEXT NOT NULL,  -- Bao-cao-POS-01-2026.xlsx
    drive_file_id TEXT,  -- Google Drive File ID (null nếu upload fail)
    drive_folder_path TEXT,  -- /OpenPOS-Backups/Cua-hang-ABC/2026/01/
    status TEXT NOT NULL DEFAULT 'PENDING',  -- SUCCESS, FAILED, PENDING
    backup_type TEXT NOT NULL DEFAULT 'MANUAL',  -- AUTO, MANUAL
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    error_message TEXT,  -- Chi tiết lỗi nếu fail
    file_size_bytes BIGINT,  -- Dung lượng file (KB)
    backup_source TEXT  -- EXPORT (từ Reports page), CRON (tự động), API
);

-- Index để query nhanh
CREATE INDEX idx_backup_logs_shop_month ON backup_logs(shop_id, month DESC);
CREATE INDEX idx_backup_logs_shop_status ON backup_logs(shop_id, status);
CREATE INDEX idx_backup_logs_created ON backup_logs(created_at DESC);

-- RLS Policy: Mỗi shop chỉ xem log của shop mình
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their shop's backup logs"
    ON backup_logs FOR SELECT
    USING (
        shop_id IN (
            SELECT shop_id FROM profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert backup logs for their shop"
    ON backup_logs FOR INSERT
    WITH CHECK (
        shop_id IN (
            SELECT shop_id FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- ============ SHOP SETTINGS EXTENSION ============
-- Thêm cột để lưu trữ cài đặt Drive
ALTER TABLE shops ADD COLUMN IF NOT EXISTS 
    drive_auto_backup BOOLEAN DEFAULT FALSE;

ALTER TABLE shops ADD COLUMN IF NOT EXISTS 
    drive_folder_id TEXT;  -- Google Drive folder ID của cửa hàng

ALTER TABLE shops ADD COLUMN IF NOT EXISTS 
    drive_auth_token TEXT;  -- Encrypted token (optional, phức tạp hơn)

-- Index
CREATE INDEX idx_shops_drive_auto_backup ON shops(drive_auto_backup);
