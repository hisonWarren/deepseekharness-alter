# Changelog

## 0.2.0 — 2026-08-15

### Added
- **Inline user-message edit** (`dsh-ux-polish` 0.2.1): bubble becomes a textarea; submit forks (or creates) a session and re-prompts — ChatGPT-style branch semantics.
- Docs: clarify that sidebar **归档会话** hides chats and is **not** permanent delete (upstream has no session-delete API).

### Fixed
- Plugin load failure when shadowing `conversation.chat.node` `user`/`steering` — register at `priority: -10`.

### Notes
- No fake “删除对话” control: archive-only remains honest.

## 0.1.0

- Initial desktop shell alter: tray pets, network modes, stable boot, Windows icon, Release CI (win/mac/linux).
