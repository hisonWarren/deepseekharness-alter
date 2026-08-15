$ErrorActionPreference = 'Stop'
$shellDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$electronExe = Join-Path $shellDir 'node_modules\electron\dist\electron.exe'
$applyIcon = Join-Path $shellDir 'tools\apply-win-icon.ps1'
Set-Location $shellDir

if (-not (Test-Path $electronExe)) {
  npm install --prefix $shellDir | Out-Null
}

if (-not (Test-Path $electronExe)) {
  throw "Electron binary missing at $electronExe"
}

# Keep taskbar icon as DeepSeek (not default Electron) after npm reinstalls.
if (Test-Path $applyIcon) {
  try {
    powershell -NoProfile -ExecutionPolicy Bypass -File $applyIcon | Out-Null
  } catch {}
}

Start-Process -FilePath $electronExe -ArgumentList @($shellDir) -WorkingDirectory $shellDir
