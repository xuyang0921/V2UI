# V2UI 发布流程

<p align="right"><a href="./RELEASING.md">English</a> | <strong>中文</strong></p>

## 准备发布

1. 选择语义化版本，并更新 `package.json`、`.codex-plugin/plugin.json`、`browser-extension/manifest.json`、`.agents/plugins/marketplace.json` 中的 Marketplace 标签、提交材料、网站内容和 `CHANGELOG.md`。
2. 确认发布的产品 UI 与提交文案为英文，公开仓库文档具有对应的英文和中文页面，并且 `browser-extension/overlay.js` 与 `scripts/overlay.js` 完全一致。
3. 运行 `npm run build`，完成项目验证、全部测试与发布打包。
4. 对四个 ZIP 运行 `unzip -t` 并检查内容。Web Store 包的根目录必须包含 `manifest.json`；开发者包必须只有一个带版本号的顶层目录。
5. 确认所有归档都不包含 `.codex/`、录音、日志、onboarding 状态、安装缓存、父目录文件或无关产品源码。

## 发布 GitHub 源码与附件

1. 将发布源码提交并推送至 `xuyang0921/V2UI`。
2. 在发布提交上创建带注释的 `v<version>` 标签并推送。
3. 创建名为 `V2UI <version>` 的 GitHub Release，提供英文和中文发布说明。
4. 附加 Chrome 开发者 ZIP、Chrome Web Store ZIP、完整 Codex 插件 ZIP 和仅含 Skill 的 OpenAI 提交 ZIP。
5. 确认 Marketplace manifest 指向新发布标签，并验证 GitHub Pages 正确呈现当前隐私、条款和支持页面。

## 提交分发包

- **Chrome Beta：**将 `V2UI-Chrome-Web-Store-<version>.zip` 以 Unlisted 方式上传。审核通过后，把商店地址通过 `--extension-install-url` 传给 `start-v2ui.mjs`，并重新测试 onboarding。
- **Codex Beta：**从仓库 Marketplace 安装，验证插件卡片、版本、图形资源、默认提示和 `$v2ui` 流程。
- **OpenAI 目录：**使用仅含 Skill 的 ZIP、英文 listing、测试用例，以及公开隐私、条款和支持 URL。

只有完成本地运行兼容性、浏览器权限流程、政策文本和支持流程评审后，才可将可见性提升到 Beta 之外。
