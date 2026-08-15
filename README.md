# DeepSeek Harness Alter

[![Release](https://img.shields.io/github/v/release/hisonWarren/deepseekharness-alter?display_name=tag)](https://github.com/hisonWarren/deepseekharness-alter/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的桌面壳增强版（Electron）：

- 稳定启动（端口回收、单实例、直连默认）
- 托盘控制：应用内/外桌宠显示与尺寸
- UX 抛光：静音杂讯行 + 用户消息内联编辑并分支
- Windows 任务栏 DeepSeek 图标

## 下载

从 [Releases](https://github.com/hisonWarren/deepseekharness-alter/releases) 下载对应平台安装包：

| 平台 | 产物 |
|------|------|
| Windows | `DeepSeekHarness-Alter-*-windows-x64.exe` |
| macOS | `DeepSeekHarness-Alter-*-macos-*.dmg` |
| Linux | `DeepSeekHarness-Alter-*-linux-x64.AppImage` |

首次使用前请配置 DeepSeek API Key（与官方 dsh 相同，写入 `~/.dsh/.credentials.yaml`）。

## 托盘菜单

- **应用内宠物**：隐藏/显示；尺寸 160/200/260/320
- **应用外桌宠**：隐藏/显示；大小档位
- **网络**：强制直连（推荐）/ 自动 / 强制代理

## 说明

- 本仓库是桌面壳与本地插件的增强版；更多社区插件仍可通过官方 dsh 配置安装。
- 安装包体积较大属预期（内含 dsh 运行时）。
- macOS / Windows 安装包默认未做代码签名。

## License

MIT
