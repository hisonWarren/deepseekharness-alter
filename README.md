# DeepSeek Harness Alter

[![Release](https://img.shields.io/github/v/release/hisonWarren/deepseekharness-alter?display_name=tag)](https://github.com/hisonWarren/deepseekharness-alter/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的桌面壳增强版（Electron）：

- 稳定启动（端口回收、单实例、直连默认）
- 托盘控制：应用内/外桌宠显示与尺寸
- UX 抛光插件：`plugins-local/dsh-ux-polish`（静音杂讯行 + 安全「编辑」填回）
- Windows 任务栏 DeepSeek 图标

仓库：https://github.com/hisonWarren/deepseekharness-alter

## 下载

从 [Releases](https://github.com/hisonWarren/deepseekharness-alter/releases) 下载：

| 平台 | 产物 |
|------|------|
| Windows | `DeepSeekHarness-Alter-*-windows-x64.exe` |
| macOS | `DeepSeekHarness-Alter-*-macos-*.dmg` |
| Linux | `DeepSeekHarness-Alter-*-linux-x64.AppImage` |

首次使用前请配置 DeepSeek API Key（与官方 dsh 相同，写入 `~/.dsh/.credentials.yaml`）。

## 本地开发

```bash
npm install
npm run prepare:dsh   # 安装便携 dsh 运行时到 ./dsh-runtime
npm start
```

若本机已有 `../deepseek-harness` 官方安装，也可直接复用该目录作为运行时。

### 托盘菜单

- **应用内宠物**：隐藏/显示；尺寸 160/200/260/320
- **应用外桌宠**：隐藏/显示；大小档位
- **网络**：强制直连（推荐）/ 自动 / 强制代理

## 发版（与 Lumina 相同：打 tag 触发 CI）

1. 更新 `package.json` 的 `version`（如 `0.1.1`）
2. 提交并推送到 `main`
3. 打 tag 并推送：

```bash
git tag v0.1.1
git push origin v0.1.1
```

GitHub Actions [Release](.github/workflows/release.yml) 会构建 Win / macOS / Linux 并上传到 Releases。

本地仅打 Windows 包：

```bash
npm run dist:win
```

## 说明

- 本仓库是 **桌面壳 + 本地插件** 的 alter；完整社区插件集仍可通过官方 dsh 配置文件安装。
- 打包产物内含 `dsh-runtime`（`@deepseek-ai/dsh`）。体积较大属预期。
- macOS / Windows 默认 **未签名**（与未配置证书时的 Lumina CI 行为类似）。

## License

MIT
