# Re-apply GitHub iframe reload-loop fixes after plugin/desktop updates.
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path (Join-Path $root 'desktop-shell\main.js'))) {
  $root = 'D:\Programs\deepseek-harness'
}

# 1) Electron: ignore subframe did-fail-load
$main = Join-Path $root 'desktop-shell\main.js'
$mainRaw = [IO.File]::ReadAllText($main)
if ($mainRaw -match 'isMainFrame === false') {
  Write-Output 'main.js=ALREADY'
} elseif ($mainRaw -match "webContents\.on\('did-fail-load'") {
  Write-Error 'main.js did-fail-load present but isMainFrame gate missing — patch manually'
} else {
  Write-Error 'main.js did-fail-load handler not found'
}

# 2) better-sidebar: probe-before-iframe + github early block
$py = Join-Path $PSScriptRoot 'patch-client.py'
python $py
$reg = Join-Path $env:USERPROFILE '.dsh\profiles\web\node_modules\dsh-better-sidebar\lib\client-registry.js'
if (Test-Path $reg) {
  python $py $reg
}

Write-Output 'DONE — restart desktop-shell / hard-refresh web'
