# Changelog

## 0.2.15 — 2026-08-16

### Added
- `dsh-ux-polish` 0.3.4: paperclip **添加文件** accepts any local file. Images still go to the draft attachment rail; non-images are copied into the workspace `.dsh-inbox/` and inserted as `@` path refs so the agent can read them (~32MB cap). Host route `POST /ux-polish/inbox`.

## 0.2.14 — 2026-08-16

### Added
- `dsh-ux-polish` 0.3.3: composer paperclip attach menu (OS image picker to draft AttachmentRail; @ workspace file via at-file). Keeps +/command slash list as session-ops only. Live-verified after hard refresh.

## 0.2.13 — 2026-08-16

### Fixed
- `dsh-dashscope-media` 0.1.2: compress oversized gens for session attachment (<= ~4.5MB JPEG) so chat inline display works; keep lossless JSON-safe tool returns.
- `dsh-ux-polish` 0.3.2: align `@file` / at-file dock with the composer card (stop chips hanging in the left gutter); strip UTF-8 BOM from `package.json` that broke profile boot.

### Changed
- Live-verified GPT-style `image_gen` card (creating -> large gallery) on real device.

## 0.2.12 — 2026-08-16

### Added
- `dsh-dashscope-media` 0.1.1: Token Plan `image_gen` / video / TTS tools; sanitize tool returns for DSH lossless JSON; GPT-style in-chat image toolview (no multi-model retry after success).
- `dsh-explorer-auto-refresh`: re-apply pack so Better Sidebar Explorer soft-refreshes expanded dirs (~2s / focus) instead of only the manual refresh button.

### Changed
- `dsh-ux-polish` 0.3.1: queue mode shows Queue↑ only (no companion gray Stop beside it); stock Stop returns when the draft is cleared.
- Alter boot re-applies `dsh-explorer-auto-refresh` / `dsh-github-iframe-loop` Python patches after syncing `plugins-local`.

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