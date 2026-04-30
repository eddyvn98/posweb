# POSweb Free — Deploy Script
# Usage: .\deploy\update.ps1

$ErrorActionPreference = "Stop"
$ProjectDir = "d:\posweb-free"

Write-Host "=== POSweb Free: Deploy ===" -ForegroundColor Cyan

Set-Location $ProjectDir

# 1. Install/update dependencies
Write-Host "[1/3] Installing dependencies..." -ForegroundColor Yellow
npm install

# 2. Build frontend
Write-Host "[2/3] Building frontend..." -ForegroundColor Yellow
npm run build

# 3. Reload PM2
Write-Host "[3/3] Reloading PM2 services..." -ForegroundColor Yellow
pm2 reload posweb-free-backend --update-env
pm2 restart posweb-free-frontend

pm2 status

Write-Host "=== Deploy complete ===" -ForegroundColor Green
