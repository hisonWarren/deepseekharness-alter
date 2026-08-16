# Chrome frames patch (advisor Option C)

Re-applies after plugin reinstall:

1. `dsh-composer-polish` — remove `.cpol-btn` gray outline (`src` + `lib`).
2. `dsh-auto-review` — remove `[data-dsh-auto-review-button]` outline (peer-match session header).
3. `dsh-ux-polish` (plugins-local) already injects:
   - borderless polish / header close / AI 审查
   - hide host sidebar toggle cluster while `.dsdr-overlay-docked`

```powershell
.\plugins-local\dsh-chrome-frames\apply.ps1
```

Then hard-refresh http://127.0.0.1:3080.
