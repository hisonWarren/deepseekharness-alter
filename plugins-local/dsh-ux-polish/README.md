# dsh-ux-polish

DeepSeek Harness Web 插件：静音审批行、用户消息内联编辑，以及 **Cursor 式运行中排队**。

来自：[hisonWarren/deepseekharness-alter](https://github.com/hisonWarren/deepseekharness-alter) → `plugins-local/dsh-ux-polish`

## 安装（已有 DSH）

本包在 monorepo 子目录，推荐与 [dsh-plugins](https://github.com/lbh1nb/dsh-plugins) 相同：

```bash
git clone --depth 1 https://github.com/hisonWarren/deepseekharness-alter.git
# 编辑 ~/.dsh/profiles/web/package.json：
#   dependencies["dsh-ux-polish"] = "link:/abs/path/.../plugins-local/dsh-ux-polish"
#   dsh.profile.bundles 加入 "dsh-ux-polish"
cd ~/.dsh/profiles/web && npx -y pnpm@11.21.0 install
dsh --profile web
```

或：

```bash
cd deepseekharness-alter/plugins-local/dsh-ux-polish
dsh plugin --profile web add .
dsh --profile web
```

官方约定见 [awesome-deepseek-harness · Install](https://github.com/0xsline/awesome-deepseek-harness#install)：`dsh plugin --profile web add "github:owner/repo#ref"`，且须有 `dsh.bundle.patch`。

## License

MIT
