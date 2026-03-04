# Deploy POSWeb (Docker + Cloudflare)

Tài liệu này là luồng deploy chính thức cho `https://posweb.vivutrade.io.vn` và `https://api-posweb.vivutrade.io.vn`.

## Kiến trúc production hiện tại

- Frontend: container `posweb-frontend` (Nginx, port `5173`)
- Backend: container `posweb-backend` (Node.js, port `3001`)
- Public domain: Cloudflare Tunnel route về 2 service local
- File cấu hình chính:
  - `docker-compose.posweb.yml`
  - `Dockerfile.frontend`
  - `bot_backend/Dockerfile`
  - `run_server.bat` (chạy local mode bằng npm + tunnel, dùng khi cần debug nhanh)

## Không dùng cho domain vivutrade

- Không deploy Firebase cho domain này.
- Không deploy Vercel cho domain này.
- Firebase/Vercel chỉ là tài liệu cũ/thử nghiệm.

## Quy trình deploy chuẩn

Chạy tại thư mục gốc project `d:\posweb`.

1. Build image mới

```powershell
docker compose -f docker-compose.posweb.yml build frontend backend
```

2. Cập nhật container

```powershell
docker compose -f docker-compose.posweb.yml up -d frontend backend
```

3. Kiểm tra trạng thái

```powershell
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
docker logs --tail 60 posweb-backend
docker logs --tail 40 posweb-frontend
```

4. Health check nhanh

```powershell
curl http://localhost:3001/health
curl http://localhost:5173/health
```

Nếu trả về `ok` là service chạy.

## Deploy không downtime dài

- Lệnh `up -d` sẽ recreate container, downtime thường chỉ vài giây.
- Không cần tắt Cloudflare tunnel.

## Khi cần rollback

1. Xem lịch sử image local:

```powershell
docker images | findstr posweb-
```

2. Re-tag image cũ (nếu có lưu tag), rồi `up -d` lại.

Nếu chưa có chiến lược tag, nên bổ sung bước tag theo ngày trước mỗi lần deploy.

## Checklist sau deploy

1. Vào `https://posweb.vivutrade.io.vn` tải trang thành công.
2. Đăng nhập và tạo/sửa sản phẩm thành công.
3. API hoạt động: `https://api-posweb.vivutrade.io.vn/health`.
4. Log backend không có lỗi crash.
5. Nếu liên quan Google Sheet: lưu 1 sản phẩm để trigger sync và kiểm tra sheet.

## Lỗi thường gặp

- `docker compose` build xong nhưng web chưa đổi:
  - Browser cache/PWA cache cũ. Hard refresh (`Ctrl+F5`) hoặc clear site data.
- Google Sheet không cập nhật:
  - Backend đang chạy code cũ hoặc env Google thiếu trong `bot_backend/.env`.
- Domain sống nhưng app lỗi API:
  - Kiểm tra `VITE_API_URL` trong build frontend đang là `https://api-posweb.vivutrade.io.vn/api`.

