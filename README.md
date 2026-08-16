# DeepSeek Harness Alter

[![Release](https://img.shields.io/github/v/release/hisonWarren/deepseekharness-alter?display_name=tag)](https://github.com/hisonWarren/deepseekharness-alter/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的桌面壳增强版（Electron）：

- 稳定启动（端口回收、单实例、直连默认）
- 托盘控制：应用内 / 外行宠显示与尺寸
- UX 抛光：静音审批行 + 用户消息内联编辑并分支
- **Cursor 式排队**：运行中可继续输入；有草稿时主按钮变为排队箭头；输入框上方显示 Queued 条；Shift+Enter 换行
- Windows 任务栏 DeepSeek 图标

仓库：[hisonWarren/deepseekharness-alter](https://github.com/hisonWarren/deepseekharness-alter)

---

## 两种用法（选一）

| 你的情况 | 怎么用 |
|----------|--------|
| 想要完整桌面壳（托盘、行宠、网络偏好等） | 下 [Releases](https://github.com/hisonWarren/deepseekharness-alter/releases) 安装包 |
| **已有官方 / 自建 DeepSeek Harness，只要 Cursor 排队 + UX 抛光** | 只装插件 `dsh-ux-polish`（见下方） |

---

## 已有 DeepSeek Harness：只装插件

插件路径：仓库内 [`plugins-local/dsh-ux-polish`](https://github.com/hisonWarren/deepseekharness-alter/tree/main/plugins-local/dsh-ux-polish)

### 方法 A（推荐）：`dsh plugin add`

在已能跑 `dsh web` 的机器上：

```bash
# 装到 web profile（常见）
dsh plugin --profile web add "github:hisonWarren/deepseekharness-alter#main:plugins-local/dsh-ux-polish"

# 若 peer 依赖冲突，可先 clone 再本地装：
git clone --depth 1 https://github.com/hisonWarren/deepseekharness-alter.git
dsh plugin --profile web add "file:./deepseekharness-alter/plugins-local/dsh-ux-polish"
```

然后确认 profile 的 `bundles` 里包含 `dsh-ux-polish`（`dsh plugin add` 通常会自动写入）。  
重启 `dsh web`（或刷新页面），在设置 → Plugins 里应能看到 `dsh-ux-polish`。

### 方法 B：手动拷到 profile（npm `file:` 装过旧版时尤其有用）

`npm` 的 `file:` 依赖往往是**一次性拷贝**，改源码不会自动更新。可强制覆盖：

```bash
# Windows (PowerShell) — 把插件拷进已部署的 web profile
$src = "D:\path\to\deepseekharness-alter\plugins-local\dsh-ux-polish"
$dst = "$env:USERPROFILE\.dsh\profiles\web\node_modules\dsh-ux-polish"
Copy-Item -Recurse -Force $src $dst
```

```bash
# macOS / Linux
SRC=./deepseekharness-alter/plugins-local/dsh-ux-polish
DST="$HOME/.dsh/profiles/web/node_modules/dsh-ux-polish"
rm -rf "$DST" && cp -R "$SRC" "$DST"
```

并在 `~/.dsh/profiles/web/package.json` 中保证：

```json
{
  "dependencies": {
    "dsh-ux-polish": "file:../path-or-keep-existing"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "...",
        "dsh-ux-polish"
      ]
    }
  }
}
```

然后**重启** `dsh web`，浏览器硬刷新（Ctrl+Shift+R）。

### 升级后仍看不到排队箭头？

1. 看 `~/.dsh/profiles/web/node_modules/dsh-ux-polish/package.json` 的 `version` 是否 ≥ `0.3.0`
2. 若仍是旧版，用方法 B 强制覆盖
3. 运行中先**再输入一段文字**：空草稿时仍是「停止」；有草稿才会变成「加入排队」

---

## 下载安装包（完整 Alter 桌面壳）

从 [Releases](https://github.com/hisonWarren/deepseekharness-alter/releases) 下载对应平台安装包：

| 平台 | 产物 |
|------|------|
| Windows | `DeepSeekHarness-Alter-*-windows-x64.exe` |
| macOS | `DeepSeekHarness-Alter-*-macos-*.dmg` |
| Linux | `DeepSeekHarness-Alter-*-linux-x64.AppImage` |

首次使用前请配置 DeepSeek API Key（与官方 dsh 相同，写入 `~/.dsh/.credentials.yaml`）。

## 托盘菜单

- **应用内行宠**：隐藏 / 显示；尺寸 160 / 200 / 260 / 320
- **应用外行宠**：隐藏 / 显示；大小与位置
- **网络**：强制直连（推荐）/ 自动 / 强制代理；可自定义代理地址与端口（如 7890 / 7897 / SOCKS5）

## Cursor 式排队（dsh-ux-polish）

| 状态 | 主控件 |
|------|--------|
| 空闲 | 发送 |
| 运行中 + 输入框为空 | 停止 |
| 运行中 + 有草稿 | **排队箭头**（并保留小停止键） |

- Enter：运行中默认入队（核心 `busyEnter`）
- Shift+Enter：换行
- 输入框上方：**N Queued** 可折叠条（编辑 / 立即插话 steer / 删除）
- 隐藏 Todo「预排任务」条，避免与 Queue 混淆

## 说明

- 本仓库包含：**Electron 桌面壳** + **可单独安装的 `dsh-ux-polish` 插件**。
- 已有 DSH 部署时，不必换安装包，按上文「只装插件」即可。
- 安装包体积较大属预期（内含 dsh 运行时）。
- macOS / Windows 安装包默认未做代码签名。

## License

MIT
