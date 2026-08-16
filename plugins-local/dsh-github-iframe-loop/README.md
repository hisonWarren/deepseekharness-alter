# Fix: opening GitHub in the in-app sidebar caused continuous full-page reloads

## Cause
1. Sidebar `BrowserView` mounts an iframe before the embed probe finishes.
2. GitHub refuses iframe embedding (`X-Frame-Options` / `frame-ancestors`).
3. Electron `did-fail-load` on the **subframe** incorrectly reloaded the **whole** app.
4. Session restore brought back the GitHub browser tab → loop until a new session.

## Fixes
1. `desktop-shell/main.js` — only reload on `isMainFrame` failures for the app origin.
2. `dsh-better-sidebar` — wait for embed probe before iframe; eagerly block `github.com`.

```powershell
.\plugins-local\dsh-github-iframe-loop\apply.ps1
```

Restart the desktop shell (or `dsh web`) after applying.
