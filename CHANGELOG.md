# Changelog

## 0.2.7 — 2026-08-15

### Changed
- In-app pet defaults to **bottom-left** (Explorer covers the right). Tray: 应用内宠物 → 左下角 / 右下角.
## 0.2.6 鈥?2026-08-15

### Fixed
- Sanitize `DEEPSEEK_BASE_URL` (strip `[...]` / quotes / trailing `/v1`) so a polluted Windows env var cannot break fetch with Invalid URL.
## 0.2.5 閳?2026-08-15

### Added
- Tray **缂冩垹绮?閳?鐠佸墽鐤嗘禒锝囨倞閸︽澘娼冮垾?*: users can set their own proxy URL/port (not only Clash 7897).

## 0.2.4 閳?2026-08-15

### Fixed
- API calls ignored 閳ユ粌宸遍崚鏈靛敩閻炲棌鈧?because `api.deepseek.com` was on `NO_PROXY`.
- In-app pet could stay invisible when dual-buffer CSS hid every video before `.is-front` existed.
- User bubble actions: copy / edit use icons (aligned with official message chrome).

## 0.2.3 閳?2026-08-15

### Fixed
- Packaged app `dsh exited early`: resolve `resources/dsh-runtime`; logs/prefs in userData.

## 0.2.2 閳?2026-08-15

### Fixed
- App icon 1024鑴?024 for electron-builder.

## 0.2.1 / 0.2.0 / 0.1.0

- See git history.
