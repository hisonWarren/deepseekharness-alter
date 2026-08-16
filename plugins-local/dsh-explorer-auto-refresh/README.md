# dsh-explorer-auto-refresh

`dsh-better-sidebar` Explorer only cached each directory once and refreshed on the header button. New files (e.g. `dashscope-media/` gens) did not appear until manual refresh.

## Fix

Soft-refresh root + expanded dirs every 2s while the page is visible, and on window focus / visibility. Unchanged listings skip React state updates.

## Apply

```powershell
powershell -File plugins-local/dsh-explorer-auto-refresh/apply.ps1
```

Then hard-refresh the DSH web UI (or restart desktop-shell).
