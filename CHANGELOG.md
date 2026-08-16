# Changelog

## 0.2.11 — 2026-08-16

### Fixed
- Opening GitHub (and other X-Frame-blocked sites) in the in-app sidebar no longer reloads the whole app in a loop: Electron `did-fail-load` now ignores subframe failures.
- Companion patch pack `dsh-github-iframe-loop` waits for embed probe / eagerly blocks `github.com` before mounting an iframe.

### Changed
- `dsh-ux-polish`: peer-match session header chrome (borderless AI 审查 aligned with 变动 / open-editor; drop unnecessary 润色 outline).
- Added local re-apply packs: `dsh-chrome-frames`, `dsh-diff-review-defaults`, `dsh-auto-review-rc6-safe`, `dsh-session-log-repair`.

## 0.2.10 — 2026-08-16

### Fixed
- Cursor queue UX did not load because npm `file:` installs copy plugins once into `~/.dsh/profiles/web/node_modules`. Alter now **force-syncs `plugins-local` on every boot**.
- Queue primary button no longer disables when `inputActions` is absent (falls back to `session.prompt(..., "queue")`).

## 0.2.9 — 2026-08-16

### Added
- Cursor-style mid-run queue UX in `dsh-ux-polish` 0.3.0:
  - While the agent is running and the draft is non-empty, the primary control becomes a **queue arrow** (stock Stop is hidden; a compact Stop remains).
  - Composer-aligned **Queued** strip above the input (always shows an `N Queued` header).
  - Hides the Todo / plan dock so it is not confused with the queue.

### Fixed
- README.md encoding (mojibake Chinese) rewritten as UTF-8.

## 0.2.8 — 2026-08-15

### Changed
- In-app pet default corner sits a bit higher (`bottom: 56px`) so it clears the composer/dock.

## 0.2.7 — 2026-08-15

### Changed
- In-app pet defaults to **bottom-left** (Explorer covers the right). Tray: 应用内行宠 → 左下角 / 右下角.

## 0.2.6 — 2026-08-15

### Fixed
- Sanitize `DEEPSEEK_BASE_URL` (strip `[...]` / quotes / trailing `/v1`) so a polluted Windows env var cannot break fetch with Invalid URL.

## 0.2.5 — 2026-08-15

### Added
- Tray **自定义代理**: users can set their own proxy URL/port (not only Clash 7897).

## 0.2.4 — 2026-08-15

### Fixed
- API calls ignored proxy because `api.deepseek.com` was on `NO_PROXY`.
- In-app pet could stay invisible when dual-buffer CSS hid every video before `.is-front` existed.
- User bubble actions: copy / edit use icons (aligned with official message chrome).

## 0.2.3 — 2026-08-15

### Fixed
- Packaged app `dsh exited early`: resolve `resources/dsh-runtime`; logs/prefs in userData.

## 0.2.2 — 2026-08-15

### Fixed
- App icon 1024×1024 for electron-builder.

## 0.2.1 / 0.2.0 / 0.1.0

- See git history.
