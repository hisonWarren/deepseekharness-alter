# dsh-ux-polish

DeepSeek Harness **Web 客户端插件**：更安静的审批行、用户消息内联编辑（分支）、以及 **Cursor 式中途排队**。

本插件位于 [hisonWarren/deepseekharness-alter](https://github.com/hisonWarren/deepseekharness-alter) 的 `plugins-local/dsh-ux-polish`。  
**不需要**安装 Electron 桌面壳；可直接装进你已有的 `dsh web` profile。

## 功能

- 隐藏嘈杂的审批 / permission 行
- 用户气泡：复制、编辑并分支到新对话
- 运行中可继续输入；有草稿时主控件变为 **排队箭头**（旁侧保留停止）
- 输入框上方 **N Queued** 条（编辑 / steer / 删除）
- 隐藏 Todo「预排任务」条，避免和 Queue 混淆

## 安装到已有 DeepSeek Harness

### 推荐

```bash
git clone --depth 1 https://github.com/hisonWarren/deepseekharness-alter.git
dsh plugin --profile web add "./deepseekharness-alter/plugins-local/dsh-ux-polish"
```

然后重启 `dsh web`，浏览器硬刷新。

### 或写入 `~/.dsh/profiles/web/package.json`

```json
{
  "dependencies": {
    "dsh-ux-polish": "github:hisonWarren/deepseekharness-alter#v0.2.10:plugins-local/dsh-ux-polish"
  },
  "dsh": {
    "profile": {
      "bundles": ["dsh-ux-polish"]
    }
  }
}
```

```bash
cd ~/.dsh/profiles/web
npm install --legacy-peer-deps
```

完整说明见仓库根 [README.md](../../README.md#已有-deepseek-harness只装完善后的插件)。

## 验证

```js
!!document.querySelector('style[data-plugin-css="dsh-ux-polish/style.css"]')
```

运行中输入草稿后，应出现「加入排队」按钮。

## License

MIT（与主仓库相同）
