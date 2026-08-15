# Applies DeepSeek icon into Electron binary (unpackaged Windows only).
$ErrorActionPreference = 'Stop'
$shellDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if ((Split-Path -Leaf $shellDir) -eq 'tools') {
  $shellDir = Split-Path -Parent $shellDir
}
$electronExe = Join-Path $shellDir 'node_modules\electron\dist\electron.exe'
$ico = Join-Path $shellDir 'assets\deepseek.ico'
if (-not (Test-Path $ico)) { $ico = Join-Path $shellDir 'deepseek.ico' }
$rcedit = Join-Path $shellDir 'tools\rcedit-x64.exe'
$stamp = Join-Path $shellDir 'tools\.electron-icon-stamp'

if (-not (Test-Path $electronExe)) { exit 0 }
if (-not (Test-Path $ico)) { Write-Host "icon missing: $ico"; exit 0 }
if (-not (Test-Path $rcedit)) { Write-Host "rcedit missing: $rcedit"; exit 0 }

$eleHash = (Get-FileHash $electronExe -Algorithm SHA256).Hash
$icoHash = (Get-FileHash $ico -Algorithm SHA256).Hash
$wanted = "$eleHash|$icoHash|DeepSeek Harness Alter"
if ((Test-Path $stamp) -and ((Get-Content $stamp -Raw).Trim() -eq $wanted)) { exit 0 }

& $rcedit $electronExe --set-icon $ico
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& $rcedit $electronExe --set-version-string FileDescription "DeepSeek Harness Alter" | Out-Null
& $rcedit $electronExe --set-version-string ProductName "DeepSeek Harness Alter" | Out-Null
$eleHash2 = (Get-FileHash $electronExe -Algorithm SHA256).Hash
Set-Content -Path $stamp -Value "$eleHash2|$icoHash|DeepSeek Harness Alter" -Encoding ASCII
Write-Host "Applied DeepSeek icon to electron.exe"
