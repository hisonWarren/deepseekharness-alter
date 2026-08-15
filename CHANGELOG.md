# Changelog

## 0.2.8 — 2026-08-15

### Changed
- In-app pet default corner sits a bit higher (`bottom: 56px`) so it clears the composer/dock.
## 0.2.7 鈥?2026-08-15

### Changed
- In-app pet defaults to **bottom-left** (Explorer covers the right). Tray: 搴旂敤鍐呭疇鐗?鈫?宸︿笅瑙?/ 鍙充笅瑙?
## 0.2.6 閳?2026-08-15

### Fixed
- Sanitize `DEEPSEEK_BASE_URL` (strip `[...]` / quotes / trailing `/v1`) so a polluted Windows env var cannot break fetch with Invalid URL.
## 0.2.5 闁?2026-08-15

### Added
- Tray **缂傚啯鍨圭划?闁?閻犱礁澧介悿鍡樼閿濆洦鍊為柛锔芥緲濞煎啴鍨?*: users can set their own proxy URL/port (not only Clash 7897).

## 0.2.4 闁?2026-08-15

### Fixed
- API calls ignored 闁炽儲绮屽閬嶅礆閺堥潧鏁╅柣鐐叉閳?because `api.deepseek.com` was on `NO_PROXY`.
- In-app pet could stay invisible when dual-buffer CSS hid every video before `.is-front` existed.
- User bubble actions: copy / edit use icons (aligned with official message chrome).

## 0.2.3 闁?2026-08-15

### Fixed
- Packaged app `dsh exited early`: resolve `resources/dsh-runtime`; logs/prefs in userData.

## 0.2.2 闁?2026-08-15

### Fixed
- App icon 1024閼?024 for electron-builder.

## 0.2.1 / 0.2.0 / 0.1.0

- See git history.
