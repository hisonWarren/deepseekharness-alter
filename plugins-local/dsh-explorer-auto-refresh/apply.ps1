# Re-apply Explorer auto-refresh after dsh-better-sidebar updates.
$ErrorActionPreference = 'Stop'
$py = Join-Path $PSScriptRoot 'patch-client.py'
python $py
$reg = Join-Path $env:USERPROFILE '.dsh\profiles\web\node_modules\dsh-better-sidebar\lib\client-registry.js'
if (Test-Path $reg) { python $py $reg }

# Keep source ExplorerView in sync when present.
$src = Join-Path $env:USERPROFILE '.dsh\profiles\web\node_modules\dsh-better-sidebar\src\client\ExplorerView.tsx'
if (Test-Path $src) {
  $raw = [IO.File]::ReadAllText($src)
  if ($raw -notmatch 'AUTO_REFRESH_MS') {
    Write-Warning "ExplorerView.tsx missing AUTO_REFRESH_MS — restore from plugins-local patch notes"
  } else {
    Write-Output 'ExplorerView.tsx=OK'
  }
}

Write-Output 'DONE — hard-refresh DSH web / restart desktop-shell'
