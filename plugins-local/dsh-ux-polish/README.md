# dsh-ux-polish

DeepSeek Harness Web 插件：静音审批行、用户消息内联编辑，以及 **Cursor 式运行中排队**。

来自仓库：[hisonWarren/deepseekharness-alter](https://github.com/hisonWarren/deepseekharness-alter) → `plugins-local/dsh-ux-polish`

## 安装到已有 DSH

```bash
dsh plugin --profile web add "github:hisonWarren/deepseekharness-alter#main:plugins-local/dsh-ux-polish"
```

或 clone 后：

```bash
dsh plugin --profile web add "file:./deepseekharness-alter/plugins-local/dsh-ux-polish"
```

重启 `dsh web` 并硬刷新浏览器。完整说明见仓库 [README](https://github.com/hisonWarren/deepseekharness-alter#已有-deepseek-harness只装插件)。

## 行为摘要

| 状态 | 主控件 |
|------|--------|
| 空闲 | 发送 |
| 运行中 + 空草稿 | 停止 |
| 运行中 + 有草稿 | 排队箭头（旁侧保留停止） |

## License

MIT（随 alter 仓库）
