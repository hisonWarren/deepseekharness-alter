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

插件目录：[`plugins-local/dsh-ux-polish`](https://github.com/hisonWarren/deepseekharness-alter/tree/main/plugins-local/dsh-ux-polish)  
（包内已声明 `dsh.bundle.patch`，符合 [awesome-deepseek-harness](https://github.com/0xsline/awesome-deepseek-harness) / 官方的 bundle 安装约定。）

社区常用装法（可直接照抄同类插件）：

| 模式 | 代表 | 适合你时 |
|------|------|----------|
| `dsh plugin add "github:owner/repo#tag"` | [dsh-composer-polish](https://github.com/tianji-qingtian/dsh-composer-polish) | 仓库**根目录就是插件**（一行装） |
| clone + `link:绝对路径` 写进 profile | [lbh1nb/dsh-plugins](https://github.com/lbh1nb/dsh-plugins)（含 steer-button） | **monorepo 子目录插件**（本仓库就是这种） |
| 官方总说明 | [awesome Install](https://github.com/0xsline/awesome-deepseek-harness#install) | `dsh plugin` 转发 pnpm；装完需重启 |

> 注意：awesome 写明旧的「仓库子路径 / Repository Plugin」装法已不在官方主流流程里。本仓库根目录是 Electron 壳，**不能**对仓库根直接 `github:hisonWarren/deepseekharness-alter`，否则会装错包。请用下面的 **方法 A / B**。

### 方法 A（推荐，monorepo 子包）：clone + `link:`（对齐 dsh-plugins）

```bash
git clone --depth 1 https://github.com/hisonWarren/deepseekharness-alter.git
```

编辑 `~/.dsh/profiles/web/package.json`（Windows：`%USERPROFILE%\.dsh\profiles\web\package.json`），加入依赖与 bundle（路径改成你的绝对路径，用正斜杠）：

```json
{
  "dependencies": {
    "dsh-ux-polish": "link:C:/path/to/deepseekharness-alter/plugins-local/dsh-ux-polish"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "dsh-ux-polish"
      ]
    }
  }
}
```

然后在 profile 目录安装并重启：

```bash
cd ~/.dsh/profiles/web   # Windows: %USERPROFILE%\.dsh\profiles\web
pnpm install             # 或: npx -y pnpm@11.21.0 install
dsh --profile web        # 重启；运行中的实例不会热加载新 bundle
```

`link:` 指向源码目录时，以后 `git pull` 更新 alter 仓库再重启即可（比 `file:` 拷贝更不容易装到旧版）。

### 方法 B：在插件目录里 `dsh plugin add .`

```bash
git clone --depth 1 https://github.com/hisonWarren/deepseekharness-alter.git
cd deepseekharness-alter/plugins-local/dsh-ux-polish
dsh plugin --profile web add .
```

（相对路径 `.` 会锚定到当前目录，与官方 CLI 行为一致。）

需要全局 CLI 时：

```bash
npm install -g @deepseek-ai/dsh
# 或: npx @deepseek-ai/dsh plugin --profile web add .
```

### 方法 C：强制覆盖已安装的旧拷贝

若以前用 `file:` 装过旧版，`node_modules` 里可能仍是一次性拷贝：

```powershell
# Windows PowerShell
$src = "C:\path\to\deepseekharness-alter\plugins-local\dsh-ux-polish"
$dst = "$env:USERPROFILE\.dsh\profiles\web\node_modules\dsh-ux-polish"
Copy-Item -Recurse -Force $src $dst
```

```bash
# macOS / Linux
SRC=./deepseekharness-alter/plugins-local/dsh-ux-polish
DST="$HOME/.dsh/profiles/web/node_modules/dsh-ux-polish"
rm -rf "$DST" && cp -R "$SRC" "$DST"
```

确认 `package.json` 的 `version` ≥ `0.3.0`，然后重启 `dsh web` 并硬刷新（Ctrl+Shift+R）。

### 装好后怎么确认

1. 设置 → Plugins 能看到 `dsh-ux-polish`
2. 运行中再输入一段文字：应出现「加入排队」箭头（空草稿时仍是「停止」，这是预期）

也可在应用内用社区的插件浏览器一键装其它插件（装法不同，但管理入口类似）：[dsh-find-plugin](https://github.com/topics/dsh-plugin) / [plugin-manager](https://github.com/0xsline/awesome-deepseek-harness) 等条目。
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
