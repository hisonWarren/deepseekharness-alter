# Skip dsh-auto-review session-log audit writes on hosts that strip `ignorable`
# (0.1.0-rc.6). Unmarked autoReview/* events make cold history refuse with
# SessionFormatUnsupportedError. Deny feedback to the model still works via
# tool-result markers; only the log-only audit rows are skipped.
$ErrorActionPreference = 'Stop'
$root = Join-Path $env:USERPROFILE '.dsh\profiles\web\node_modules\dsh-auto-review'
$targets = @(
  (Join-Path $root 'lib\index.js'),
  (Join-Path $root 'lib\types\runtime.js')
)
$marker = 'RC6_SAFE_SKIP_AUTOREVIEW_AUDIT'
foreach ($file in $targets) {
  if (-not (Test-Path $file)) { Write-Error "missing $file" }
  $raw = [IO.File]::ReadAllText($file)
  if ($raw.Contains($marker)) {
    Write-Output "ALREADY_APPLIED $file"
    continue
  }
  if ($raw -notmatch '\.append\(\s*["'']autoReview/') {
    Write-Output "NO_APPEND_SITES $file"
    continue
  }
  $helper = @"
/* $marker */
function __dshArSkipAudit(session, type, data, opt) { return; }
"@
  # Insert helper after first import block roughly at start of file content we can prepend
  $raw2 = $helper + "`n" + $raw
  $raw2 = [regex]::Replace($raw2, '(?<recv>[\w\.]+)\.append\(\s*(?<q>["''])autoReview/', '__dshArSkipAudit(${recv}, ${q}autoReview/')
  if ($raw2 -eq ($helper + "`n" + $raw)) {
    Write-Error "Replace made no changes in $file"
  }
  $bak = "$file.bak-rc6-safe"
  if (-not (Test-Path $bak)) { Copy-Item $file $bak }
  [IO.File]::WriteAllText($file, $raw2)
  Write-Output "PATCHED $file"
}
Write-Output 'DONE'
