# Applies DeepSeek icon into Electron binary so the Windows taskbar
# does not show the default Electron logo when running unpackaged.
$ErrorActionPreference = 'Stop'
$shellDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if ((Split-Path -Leaf $shellDir) -eq 'tools') {
  $shellDir = Split-Path -Parent $shellDir
}
$electronExe = Join-Path $shellDir 'node_modules\electron\dist\electron.exe'
$ico = Join-Path (Split-Path -Parent $shellDir) 'deepseek.ico'
if (-not (Test-Path $ico)) {
  $ico = Join-Path $shellDir 'deepseek.ico'
}
$rcedit = Join-Path $shellDir 'tools\rcedit-x64.exe'
$stamp = Join-Path $shellDir 'tools\.electron-icon-stamp'

if (-not (Test-Path $electronExe)) { exit 0 }
if (-not (Test-Path $ico)) { Write-Host "icon missing: $ico"; exit 0 }
if (-not (Test-Path $rcedit)) { Write-Host "rcedit missing: $rcedit"; exit 0 }

$eleHash = (Get-FileHash $electronExe -Algorithm SHA256).Hash
$icoHash = (Get-FileHash $ico -Algorithm SHA256).Hash
$wanted = "$eleHash|$icoHash|DeepSeek Harness"
if ((Test-Path $stamp) -and ((Get-Content $stamp -Raw).Trim() -eq $wanted)) {
  exit 0
}

& $rcedit $electronExe --set-icon $ico
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& $rcedit $electronExe --set-version-string FileDescription "DeepSeek Harness" | Out-Null
& $rcedit $electronExe --set-version-string ProductName "DeepSeek Harness" | Out-Null
# Recompute hash after patch (file changed)
$eleHash2 = (Get-FileHash $electronExe -Algorithm SHA256).Hash
Set-Content -Path $stamp -Value "$eleHash2|$icoHash|DeepSeek Harness" -Encoding ASCII
Write-Host "Applied DeepSeek icon to electron.exe"
