# Changelog

## 0.2.1 — 2026-08-15

### Fixed
- Root `package.json` UTF-8 BOM broke electron-builder on CI (v0.2.0 Release failed on all platforms).
- Sync latest desktop-shell `main.js` into the alter repo.
- Ensure `dsh-ux-polish` registers `conversation.chat.node` `user`/`steering` at `priority: -10`.

### Notes
- Sidebar **归档会话** still means hide-from-list, not permanent delete (upstream has no delete API).

## 0.2.0 — 2026-08-15

### Added
- **Inline user-message edit** (`dsh-ux-polish`): bubble becomes a textarea; submit forks/creates a session and re-prompts.
- Docs: archive ≠ delete.

### Fixed
- Plugin load failure when shadowing chat node slots (priority shadowing).

## 0.1.0

- Initial desktop shell alter: tray pets, network modes, stable boot, Windows icon, Release CI (win/mac/linux).
