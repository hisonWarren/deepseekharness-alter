# Re-apply Unstaged default scope after dsh-plugin-diff-review install/update.
$ErrorActionPreference = 'Stop'
$client = Join-Path $env:USERPROFILE '.dsh\profiles\web\node_modules\dsh-plugin-diff-review\client.js'
if (-not (Test-Path $client)) {
  Write-Error "client.js not found: $client"
}
$raw = [IO.File]::ReadAllText($client)
if ($raw -notmatch 'useState\)\("last-turn"\)' -and $raw -match 'useState\)\("unstaged"\)') {
  Write-Output 'ALREADY_APPLIED'
  exit 0
}
if ($raw -notmatch 'useState\)\("last-turn"\)') {
  Write-Error 'Pattern useState)("last-turn") not found — upstream may have changed.'
}
$patched = $raw.Replace('useState)("last-turn")', 'useState)("unstaged")')
[IO.File]::WriteAllText($client, $patched)
Write-Output 'PATCHED_DEFAULT_SCOPE_UNSTAGED'
