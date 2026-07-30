# Quy trình làm việc theo nhánh Git (Git Branching Guide)

## Nhánh làm việc hiện tại (Active Working Branch)

- **Tên nhánh**: `dev-workspace`
- **Nhánh gốc**: `main`
- **Ngày khởi tạo**: 30/07/2026

## Quy tắc quản lý nhánh

1. **Khồng sửa trực tiếp trên `main`**: Nhánh `main` được giữ nguyên làm nhánh gốc và chuẩn cho môi trường production.
2. **Phát triển trên `dev-workspace`**: Tất cả các tính năng mới, chỉnh sửa giao diện, logic và kiểm thử đều được thực hiện trên nhánh `dev-workspace`.
3. **Commit & Sync**:
   - Kiểm tra nhánh trước khi làm việc: `git branch` (đảm bảo đang ở `dev-workspace`).
   - Lưu lại các thay đổi bằng commit:
     ```bash
     git add .
     git commit -m "Mô tả thay đổi..."
     ```
4. **Hợp nhất (Merge)**:
   - Khi hoàn thành và kiểm thử tính năng ổn định, nếu cần merge lại vào `main`:
     ```bash
     git checkout main
     git merge dev-workspace
     ```
