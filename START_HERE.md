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

## Khoi dong day du FE + BE + DB (posweb-free)

Ap dung cho may local Windows dang chay PM2.

1. Bat PostgreSQL service:

```powershell
Get-Service postgresql-x64-16
Start-Service postgresql-x64-16
```

2. Kiem tra DB port:

```powershell
Test-NetConnection 127.0.0.1 -Port 5432
```

3. Khoi dong PM2 cho ban free:

```powershell
cd D:\posweb-free
pm2 start ecosystem.config.cjs --only posweb-free-backend
pm2 start ecosystem.config.cjs --only posweb-free-frontend
pm2 save
```

4. Kiem tra nhanh backend + postgres sync:

```powershell
Invoke-RestMethod http://127.0.0.1:3011/health | ConvertTo-Json -Depth 6
pm2 logs posweb-free-backend --lines 50 --nostream
```

Mong doi:
- `provider = "sqlite"` (offline local)
- `postgres.connected = true`
- log co dong `[postgres-sync] synced ... rows`

5. Kiem tra frontend:

```powershell
Invoke-WebRequest http://127.0.0.1:4011 -UseBasicParsing | Select-Object -ExpandProperty StatusCode
```

Mong doi: `200`

## Backup Postgres tu dong

- Script: `D:\posweb-free\scripts\backup_postgres.ps1`
- Thu muc backup: `D:\posweb-free\backups\postgres`
- Lich Task Scheduler: `Posweb-Postgres-Daily-Backup` (02:40 AM moi ngay)

Lenh check nhanh:

```powershell
schtasks /Query /TN "Posweb-Postgres-Daily-Backup" /V /FO LIST
Get-ChildItem D:\posweb-free\backups\postgres | Sort-Object LastWriteTime -Descending | Select-Object -First 5 Name,Length,LastWriteTime
```
