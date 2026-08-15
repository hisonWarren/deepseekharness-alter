@echo off
setlocal
cd /d "%~dp0"
echo Cleaning stale DeepSeek Harness processes on port 3080...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Get-Process electron -EA SilentlyContinue | Stop-Process -Force -EA SilentlyContinue; ^
   Get-NetTCPConnection -LocalPort 3080 -State Listen -EA SilentlyContinue | ForEach-Object { taskkill /PID $_.OwningProcess /T /F 2>$null }; ^
   Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -match 'bin.js web|deepseek-harness' } | ForEach-Object { taskkill /PID $_.ProcessId /T /F 2>$null }; ^
   Start-Sleep -Seconds 1"
del /q dsh-server.pid 2>nul
echo Starting...
start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0."
endlocal
