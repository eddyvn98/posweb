@echo off
title POSWeb 1-Click Startup
cd /d "%~dp0"

echo ========================================================
echo   POSWEB AUTO-START (FE + BE + DB + TUNNEL)
echo ========================================================
echo.

:: 0. Don dep tien trinh cu de tranh trung lap
taskkill /f /im cloudflared.exe 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul

:: 1. Khoi dong Backend + SQLite
echo [1/3] Khoi dong Backend (Port 3001)...
start "POS Backend" /min cmd /k "cd /d "%~dp0bot_backend" && node server.js"

:: 2. Khoi dong Frontend Preview Server (Port 5173)
echo [2/3] Khoi dong Frontend Preview (Port 5173)...
start "POS Frontend" /min cmd /k "cd /d "%~dp0" && call npm run preview"

:: 3. Khoi dong Cloudflare Tunnel (nga302)
echo [3/3] Khoi dong Cloudflare Tunnel...
start "POS Tunnel" /min cmd /k "call "%~dp0run_tunnel.bat""

ping 127.0.0.1 -n 4 > nul

:: 4. Mo Web tren trinh duyet
start http://localhost:5173

echo.
echo ========================================================
echo   KHOI DONG THANH CONG!
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://localhost:3001
echo   - Tunnel:   https://nga302.vivutrade.io.vn
echo ========================================================
ping 127.0.0.1 -n 4 > nul
