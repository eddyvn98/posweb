@echo off
setlocal

echo [POSWEB] Starting services...

set "ROOT_DIR=d:\posweb"
set "CF_BIN=C:\Program Files (x86)\cloudflared\cloudflared.exe"
set "TUNNEL_ID=214e0dc2-0c10-427a-9060-74fe09b52486"

if not exist "%CF_BIN%" (
  echo [ERROR] cloudflared not found at:
  echo         %CF_BIN%
  echo Update CF_BIN in run_server.bat and try again.
  pause
  exit /b 1
)

echo [1/3] Backend: http://localhost:3001
start "POS Backend" cmd /k "cd /d %ROOT_DIR%\bot_backend && npm start"

echo [2/3] Frontend: http://localhost:5173
start "POS Frontend" cmd /k "cd /d %ROOT_DIR% && npm run dev -- --host 0.0.0.0 --port 5173"

echo [3/3] Cloudflare tunnel
start "POS Tunnel" cmd /k "\"%CF_BIN%\" tunnel run %TUNNEL_ID%"

echo.
echo Public URLs:
echo - https://posweb.vivutrade.io.vn
echo - https://api-posweb.vivutrade.io.vn
echo.
echo Keep all windows open while serving.

endlocal
