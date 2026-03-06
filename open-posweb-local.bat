@echo off
setlocal

set "EDGE=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=C:\Program Files\Microsoft\Edge\Application\msedge.exe"

if not exist "%EDGE%" (
  echo Microsoft Edge not found.
  exit /b 1
)

set "PROFILE_DIR=%TEMP%\posweb-local-edge"
if not exist "%PROFILE_DIR%" mkdir "%PROFILE_DIR%"

start "" "%EDGE%" ^
  --user-data-dir="%PROFILE_DIR%" ^
  --host-resolver-rules="MAP posweb.vivutrade.io.vn 127.0.0.1" ^
  --disable-features=HttpsUpgrades,UseDnsHttpsSvcb ^
  --new-window ^
  "http://posweb.vivutrade.io.vn"

endlocal
