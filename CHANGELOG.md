# Changelog

## 0.2.2 — 2026-08-15

### Fixed
- App icon too small for electron-builder (`icon.png` now 1024×1024; was 180×180).

## 0.2.1 — 2026-08-15

### Fixed
- Root `package.json` UTF-8 BOM broke electron-builder on CI.
- Sync latest desktop-shell `main.js`.
- `dsh-ux-polish` shadows `conversation.chat.node` at `priority: -10`.

### Notes
- Sidebar **归档会话** = hide from list, not permanent delete.

## 0.2.0 — 2026-08-15

### Added
- Inline user-message edit (`dsh-ux-polish`) with fork/branch semantics.
- Docs: archive ≠ delete.

## 0.1.0

- Initial desktop shell alter + Release CI (win/mac/linux).
