# dsh-diff-review-defaults

Re-applies Codex-parity default scope for `dsh-plugin-diff-review`.

Upstream `client.js` initializes scope with `useState("last-turn")`, which shows an empty 「最后一轮」view even when the working tree is dirty. Codex App defaults to **Unstaged**.

## Apply

```powershell
powershell -File plugins-local/dsh-diff-review-defaults/apply.ps1
```

Run after `dsh plugin --profile web add/update` of `dsh-plugin-diff-review`, then hard-refresh the Web UI (or restart `dsh`).
