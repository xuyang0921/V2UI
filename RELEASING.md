# V2UI 发布流程

1. 同步 `package.json`、`.codex-plugin/plugin.json`、Chrome manifest、Marketplace ref 和 CHANGELOG 版本。
2. 运行 `npm run build`，检查四个 ZIP：开发者 Chrome、Web Store、完整 Codex、skills-only submission。
3. 将源码推送到 `xuyang0921/V2UI`，创建同版本 tag 和 GitHub Release；启用 `docs/` GitHub Pages。
4. Beta：将 Chrome Web Store ZIP 提交为 Unlisted；取得商店 URL 后，用 `--extension-install-url` 验证生产 onboarding。
5. 提交 OpenAI public plugin portal：使用 skills-only ZIP、listing、8 个测试用例、隐私/条款/支持 URL。
6. 公测稳定且法律文本确认后，分别将 Chrome visibility 与 OpenAI availability 调整为公开范围。

切勿发布 `releases/` 以外的临时产物，也不要把 `.codex/`、录音、安装缓存或无关产品源码加入 ZIP。
