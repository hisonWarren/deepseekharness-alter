# Re-apply chrome-frame cleanup (Option C) after plugin reinstall/update.
$ErrorActionPreference = 'Stop'
$polishSrc = Join-Path $env:USERPROFILE '.dsh\profiles\web\node_modules\dsh-composer-polish\src\client\index.js'
$polishLib = Join-Path $env:USERPROFILE '.dsh\profiles\web\node_modules\dsh-composer-polish\lib\client.js'
$arClient = Join-Path $env:USERPROFILE '.dsh\profiles\web\node_modules\dsh-auto-review\lib\client.js'
$ux = Join-Path $PSScriptRoot '..\dsh-ux-polish\lib\client.js'

$old = 'border: 1px solid rgba(127,127,127,.35); background: transparent; color: inherit;'
$new = 'border: 0; background: transparent; color: inherit;'
$arOld = @"
[data-dsh-auto-review-button] {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--ar-border);
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 12px;
  color: var(--ar-fg);
}
[data-dsh-auto-review-button]:hover {
  background: rgba(128, 128, 128, 0.12);
}
"@
$arNew = @"
[data-dsh-auto-review-button] {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 28px;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 6px;
  padding: 3px 6px;
  font: inherit;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-tertiary, #81858c);
}
[data-dsh-auto-review-button]:hover {
  color: var(--dsw-alias-label-secondary, #61666b);
  background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.12));
}
"@

function Patch-Text([string]$path, [string]$from, [string]$to) {
  if (-not (Test-Path $path)) { Write-Warning "missing $path"; return 'MISSING' }
  $raw = [IO.File]::ReadAllText($path)
  if ($raw.Contains($to)) { return 'ALREADY' }
  if (-not $raw.Contains($from)) {
    # tolerate already borderless but not yet peer-matched
    $from2 = $from.Replace("border: 1px solid var(--ar-border);", "border: 0;")
    if ($raw.Contains($from2) -and -not $raw.Contains($to)) {
      [IO.File]::WriteAllText($path, $raw.Replace($from2, $to))
      return 'PATCHED_FROM_BORDERLESS'
    }
    Write-Error "pattern not found in $path"; return 'FAIL'
  }
  [IO.File]::WriteAllText($path, $raw.Replace($from, $to))
  return 'PATCHED'
}

$r1 = Patch-Text $polishSrc $old $new
$r2 = Patch-Text $polishLib $old $new
$r3 = Patch-Text $arClient $arOld $arNew
Write-Output "polish_src=$r1 polish_lib=$r2 auto_review=$r3"

# Peer-match: shield icon before label (同排都是 icon+text)
$arRaw = [IO.File]::ReadAllText($arClient)
if ($arRaw -notmatch 'M12 22s8-4 8-10') {
  $needle = 'onClick: toggle,`r`n`t`t`t`t`tchildren: t("label")'
  $needle2 = 'onClick: toggle,`n`t`t`t`t`tchildren: t("label")'
  $needle3 = 'onClick: toggle,\n\t\t\t\t\tchildren: t("label")'
  $iconKids = @'
onClick: toggle,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
							width: "14",
							height: "14",
							viewBox: "0 0 24 24",
							fill: "none",
							stroke: "currentColor",
							strokeWidth: "2",
							strokeLinecap: "round",
							strokeLinejoin: "round",
							"aria-hidden": true,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
								d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
							})
						}),
						t("label")
					]
'@
  if ($arRaw.Contains('onClick: toggle,') -and $arRaw.Contains('children: t("label")')) {
    $patched = [regex]::Replace($arRaw, 'onClick:\s*toggle,\s*children:\s*t\("label"\)', ($iconKids -replace "`r`n","`n"), 1)
    if ($patched -eq $arRaw) { Write-Warning 'auto-review icon pattern not replaced' }
    else { [IO.File]::WriteAllText($arClient, $patched); Write-Output 'auto_review_icon=PATCHED' }
  } else {
    Write-Output 'auto_review_icon=SKIP'
  }
} else {
  Write-Output 'auto_review_icon=ALREADY'
}

if (-not (Test-Path $ux)) { Write-Error "ux-polish missing: $ux" }
$uxRaw = [IO.File]::ReadAllText($ux)
if ($uxRaw -notmatch 'Chrome frames \(advisor C\)') {
  Write-Error 'dsh-ux-polish lib/client.js missing Chrome frames CSS block — restore from repo.'
}
if ($uxRaw -notmatch 'data-dsh-auto-review-button') {
  Write-Error 'dsh-ux-polish missing AI 审查 borderless rule.'
}
Write-Output 'ux_polish_css=OK'
Write-Output 'DONE — hard-refresh DSH web'
