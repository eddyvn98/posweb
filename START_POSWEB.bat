@echo off
title POSWeb 1-Click Startup
echo ========================================================
echo   🚀 DANG KHOI DONG HE THONG POSWEB (FE + BE + DB)...
echo ========================================================
echo.

:: 1. Khoi dong Backend + Database (SQLite)
echo [1/3] Khoi dong Backend (Port 3001) & Database (SQLite)...
start "POS Backend (Port 3001)" cmd /k "cd /d "%~dp0bot_backend" && node server.js"

:: 2. Khoi dong Frontend Dev Server (Vite)
echo [2/3] Khoi dong Frontend Vite Server (Port 5173)...
start "POS Frontend (Port 5173)" cmd /k "cd /d "%~dp0" && npm run dev"

:: 3. Cho 3 giay de server khoi tao
echo [3/3] Dang cho dich vu san sang...
ping 127.0.0.1 -n 4 > nul

:: 4. Mo Web tren trinh duyet
echo 🌐 Mo trang web http://localhost:5173 ...
start http://localhost:5173

echo.
echo ========================================================
echo   ✅ KHOI DONG THANH CONG!
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://localhost:3001
echo ========================================================
echo Giu cac cua so terminal mo trong qua trình su dung.
timeout /t 5 > nul
