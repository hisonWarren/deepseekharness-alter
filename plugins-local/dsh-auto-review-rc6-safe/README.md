# dsh-auto-review-rc6-safe

On `@deepseek-ai/dsh@0.1.0-rc.6`, `Session.append(..., { ignorable: true })` drops the marker. Cold history then refuses with:

`SessionFormatUnsupportedError: ... event type "autoReview/verdict" ... not marked ignorable`

## Fix already-broken sessions

```powershell
node plugins-local/dsh-session-log-repair/repair-session-logs.mjs repair --home $HOME/.dsh
```

## Prevent new breaks

```powershell
powershell -File plugins-local/dsh-auto-review-rc6-safe/apply.ps1
```

Re-run after upgrading/reinstalling `dsh-auto-review`. Then restart `dsh`. Reviewer deny/allow still works; only log-only `autoReview/*` audit rows are skipped.
