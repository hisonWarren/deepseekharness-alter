# Changelog

## 0.2.3 — 2026-08-15

### Fixed
- Packaged app failed with `dsh exited early (code=1)`: resolve runtime from `resources/dsh-runtime` instead of the parent of `app.asar`.
- Write `desktop.log` / prefs / pid into userData (asar is read-only).

## 0.2.2 — 2026-08-15

### Fixed
- App icon too small for electron-builder (`icon.png` now 1024×1024).

## 0.2.1 — 2026-08-15

### Fixed
- Root `package.json` UTF-8 BOM broke electron-builder on CI.
- Sync latest desktop-shell `main.js`.
- `dsh-ux-polish` shadows chat nodes at `priority: -10`.

## 0.2.0 — 2026-08-15

### Added
- Inline user-message edit (`dsh-ux-polish`) with fork/branch semantics.

## 0.1.0

- Initial desktop shell alter + Release CI (win/mac/linux).
