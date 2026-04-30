@echo off
echo 🚀 Starting POS Web Project...

echo [1/3] Launching Backend Server...
start "POS Backend" cmd /k "cd bot_backend && node server.js"

echo ⏳ Waiting 6 seconds for backend to initialize...
timeout /t 6 /nobreak > nul

echo [2/3] Launching Frontend Dev Server...
start "POS Frontend" cmd /k "npm run dev"

echo [3/3] Launching Cloudflare Tunnels...
start "POS Tunnels" cmd /k "python start_tunnel_v2.py"

echo.
echo ✅ All services launched!
echo    - Backend:  http://localhost:3001
echo    - Frontend: http://localhost:5173
echo    - Tunnels:  See "POS Tunnels" window for public URLs
timeout /t 3 /nobreak > nul
