# V2UI

V2UI 是 Codex 生成网站的本地预览审阅层。它让你在真实预览中浏览页面、选择 DOM 元素、用红色画笔标记并同步说出建议；随后把结构化证据保存到被审项目，并在获得明确确认后交给 Codex 修改和验证代码。

当前版本：**0.4.0 Beta**。0.3.1 的已验证评审能力保持不变，0.4.0 增加可分发安装包、Marketplace 和商店提交基线。Chrome 与 Codex 内置浏览器共用同一套 overlay、review companion 和评审包格式。

## 开始评审

要求 Node.js 20 或更高版本，以及一个运行在 `localhost` 或 `127.0.0.1` 的本地网页预览。

在被审项目根目录启动：

```bash
node /absolute/path/to/v2ui/scripts/start-v2ui.mjs \
  --project "$PWD" \
  --preview "http://127.0.0.1:5173/" \
  --mode codex
```

`--mode codex` 会输出带 `?v2ui=1` 的地址，供 Codex 内置浏览器打开。Vite 项目首次使用前安装开发期 adapter：

```bash
node /absolute/path/to/v2ui/scripts/install-vite-adapter.mjs --project "$PWD"
```

使用外部 Chrome 时把模式改为 `chrome`。正式发布时给启动器传入 `--extension-install-url <Chrome-Web-Store-URL>`，首次 onboarding 会引导用户主动从商店安装；开发构建未提供该 URL 时，才显示 `chrome://extensions` 的 unpacked 安装说明。V2UI 不会也不宣称可以静默安装扩展。

评审中的屏幕和麦克风权限只在用户点击绿色播放按钮后申请。实时 Web Speech 转录不可用时，录音继续进行，仍可提交录音与视觉证据，由绑定的 Codex task 后续转写。

## 评审与确认

- Browse 用于正常滚动和检查页面；Select 与 Pen 才进入标注。
- 每个新视觉标记开启一条新的语音建议；同一段话中的短暂停顿继续合并到当前建议。
- 暂停后可以再次播放并追加新的录音段，不丢失已有建议。
- Codex 内置浏览器显示“保存并返回 Codex”：评审先可靠保存，再复制一条读取提示，用户回到当前 task 粘贴发送。Codex Desktop 目前不允许外部进程向正在打开、持有 writer 的同一 task 自动回调。
- 发送只代表保存并交付建议，不代表授权修改代码。Codex 必须先总结每项影响范围并等待明确确认。
- 发送成功后清空本轮建议、标记、录音与计时，开始新一轮。

所有评审包只写入**被审项目**：

```text
<reviewed-project>/.codex/v2ui-reviews/<session-id>/
├── manifest.json
├── recording-01.webm
└── recording-02.webm
```

## 项目目录

```text
.codex-plugin/       Codex 插件清单
skills/v2ui/         Codex Skill 与 UI 元数据
scripts/             启动器、companion、回传桥、读取与打包脚本
browser-extension/   Chrome Manifest V3 源
adapters/            Codex 内置浏览器的 Vite 开发期 adapter
tests/               合同测试、桥接测试与 companion smoke test
assets/              Codex 插件卡图形 Logo
releases/            构建生成的 Chrome 解压目录和 ZIP（不入源码）
```

本仓库不包含其他产品的 UI 源码，也不应保存任何被审项目的 `.codex/v2ui-reviews`、onboarding 状态、录音、日志或 Codex 安装缓存。

## 测试与构建

```bash
npm test
npm run validate
npm run build
```

`npm run build` 会完成验证与测试，然后生成四类发布物：

```text
releases/V2UI-Chrome-0.4.0.zip                 # 开发者手动安装，含顶层目录
releases/V2UI-Chrome-Web-Store-0.4.0.zip       # manifest 位于 ZIP 根目录
releases/V2UI-Codex-0.4.0.zip                  # 完整 Codex 插件
releases/V2UI-Skill-Submission-0.4.0.zip       # OpenAI skills-only 提交包
```

Chrome 包采用显式 allowlist，只包含运行时文件和图标；不会包含录音、onboarding 状态或安装缓存。

## 发布

### Chrome

1. 同步更新 `package.json`、`.codex-plugin/plugin.json` 与 `browser-extension/manifest.json` 的版本。
2. 运行 `npm run build`。
3. 对 ZIP 执行 `unzip -t releases/V2UI-Chrome-<version>.zip`，并检查解压目录只含允许文件。
4. Beta 使用 `V2UI-Chrome-Web-Store-<version>.zip` 提交为 Unlisted；商店审核通过后把 URL 配给启动器。开发者 ZIP 仅用于本地测试，不作为普通用户安装方式。

### Codex 插件

1. 将仓库发布到 `xuyang0921/V2UI` 并创建对应版本 tag；`.agents/plugins/marketplace.json` 将插件根指向该 tag。
2. Beta 用户执行 `codex plugin marketplace add xuyang0921/V2UI`，再从 Marketplace 安装 `v2ui`。OpenAI 目录提交使用 `V2UI-Skill-Submission-<version>.zip`。
3. 使用 Skill validator 检查 `skills/v2ui`，再运行插件清单验证。
4. 同步到真实 marketplace/source repository 后再安装或升级。不要编辑或复制 `~/.codex/plugins/cache`，它只是安装缓存。
5. 安装后核对插件卡版本、图形 Logo，以及 `$v2ui` 的默认提示。

更改产品行为前先读 [PRODUCT.md](./PRODUCT.md)；后续 Codex 开发约束见 [AGENTS.md](./AGENTS.md)。

V2UI 使用 [MIT License](./LICENSE)。
