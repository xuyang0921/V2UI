# V2UI Chrome 扩展

<p align="right"><a href="./README.md">English</a> | <strong>中文</strong></p>

这个 Manifest V3 扩展是 V2UI 的外部 Chrome 评审表面。只有用户在 `localhost` 或 `127.0.0.1` 页面上点击浏览器操作按钮后，它才会注入共享 V2UI 浮层。

## 启动引导流程

在需要评审的项目中运行：

```bash
node <plugin-root>/scripts/start-v2ui.mjs \
  --project "$PWD" \
  --preview "http://127.0.0.1:5173/" \
  --mode chrome
```

首次启动会打开项目专属 onboarding。生产配置可以引导用户进入 Chrome Web Store；开发构建会展示可见的“加载已解压扩展程序”说明。后续启动会复用健康的本地 companion，并直接打开预览。

## 评审行为

点击 V2UI 扩展图标可显示或隐藏浮层。Browse 不拦截页面交互；Select 和 Pen 用于关联 DOM 或绘制证据。只有用户点击绿色开始评审控制后，才会请求屏幕和麦克风权限。

Chrome 会在录制期间把 Web Speech 的中间及最终结果呈现在当前建议中。短暂停顿保持在同一项，直到另一个 Select/Pen 标记开始新建议。实时转录失败时，本地录音仍会继续，评审仍可保存并由 Codex 后续转写。

点击建议的 `×` 会删除该建议、关联视觉证据和当前语音边界。新的语音会开始一条干净建议。

Codex Desktop 对打开的任务持有独占写入，因此 V2UI 保存评审包并提供返回当前任务的提示，而不承诺外部回调。保存评审不等于授权修改代码。

## 权限

扩展只申请：

- `activeTab`：仅作用于用户明确选择的本地页面；
- `scripting`：加载评审浮层；
- `http://localhost/*` 与 `http://127.0.0.1/*` 的主机访问权限。

同一浮层通过 `../adapters/vite.mjs` 在 Codex 内置浏览器中运行；该表面不使用 Chrome 扩展。
