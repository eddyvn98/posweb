# START HERE

## Muc tieu tai lieu

File nay la diem bat dau nhanh de van hanh va deploy POSWeb dung luong production hien tai.

## Production hien tai

- Frontend domain: `https://posweb.vivutrade.io.vn`
- Backend domain: `https://api-posweb.vivutrade.io.vn`
- Ha tang: Docker containers + Cloudflare Tunnel

## Tai lieu quan trong

1. Deploy production:
   - [DEPLOY_DOCKER_CLOUDFLARE.md](DEPLOY_DOCKER_CLOUDFLARE.md)
2. Checklist deploy (legacy notice + dinh huong):
   - [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
3. Tong hop tai lieu:
   - [README_DOCUMENTATION.md](README_DOCUMENTATION.md)

## Lenh deploy nhanh

Chay tai thu muc goc `d:\posweb`:

```powershell
docker compose -f docker-compose.posweb.yml build frontend backend
docker compose -f docker-compose.posweb.yml up -d frontend backend
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

## Luu y quan trong

- Khong dung Vercel/Firebase de deploy cho domain vivutrade.
- Neu co thay doi Google Sheet sync, can test bang cach sua/tao 1 san pham sau deploy.
- Neu browser hien ban cu, hard refresh (`Ctrl+F5`) hoac clear PWA cache.

