# V2UI development instructions

本目录是独立 V2UI 产品根。不要引入其他产品的 `src/`、站点 worker、研究资料或发布脚本，也不要把个人插件目录或任何 `~/.codex/plugins/cache` 当成当前源码。

开始修改前阅读 `PRODUCT.md`。保留以下边界：

- V2UI 只审阅本地预览，不是通用网页编辑器。
- 浏览与 Select/Pen 标注分离。
- DOM 选择是证据，不自动授权更改共享组件、token、响应式规则或全局样式。
- “确认调整”通过 `codex exec -s read-only resume` 回传；发送建议不授权写代码。Codex 必须先总结影响范围并等待明确确认。
- Chrome 保持 Manifest V3、`activeTab` 和 `scripting`，host 仅限 `localhost` 与 `127.0.0.1`。
- 屏幕与麦克风权限只在用户开始评审后申请；实时转录失败不能阻断录音或提交。
- 所有会话数据只能写入被审项目的 `.codex/v2ui-reviews`；onboarding 与运行日志写入被审项目的 `.codex/v2ui`。

Chrome 与 Codex 内置浏览器必须继续共用同一 overlay。修改 `browser-extension/overlay.js` 时同步更新 `scripts/overlay.js`，并让验证检查两者完全一致。

视觉基线：低饱和暖橙/黄色、柔和红色画笔、不透明白色工具条和建议面板；工具条只用斜体橙色 `V2UI` 字标，图形 Logo 仅用于 Chrome 和 Codex 插件卡；工具标签固定为 Browse、Select、Pen、Undo、Clear、Exit review；播放/暂停控制为绿色；建议面板 header 只保留录制状态点；居中深棕圆角 Toast；面板在产生建议后出现且可拖动。

任何源代码修改后至少运行：

```bash
npm run validate
npm test
```

发布相关修改必须运行 `npm run build`，再检查 ZIP 完整性与 allowlist。不得把 `.codex/`、录音、日志、安装缓存或父目录内容打包。`scripts/package-chrome-extension.mjs` 是 Chrome 打包实现来源。
