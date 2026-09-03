# V2UI

<p align="right"><a href="./README.md">English</a> | <strong>中文</strong></p>

> 指向界面，说出需要调整的地方，代码始终由你掌控。

V2UI 是面向 Codex 生成网站的本地预览评审层。它让反馈始终与正在运行的产品保持关联：你可以浏览真实页面、选择 DOM 元素或直接在预览上绘制标记，并通过语音描述希望进行的调整。

V2UI 会把转录文本、录音、视觉证据、视口、URL 和时间信息保存为结构化评审包。随后，Codex 会先说明建议可能影响的源码范围，并在修改代码之前等待你的明确确认。

当前版本：**0.4.1 Beta**。Chrome 和 Codex 内置浏览器共用同一套评审浮层、本地 companion 服务和评审包格式。

## 评审正在运行的网站

V2UI 将视觉反馈保留在实际页面状态上，避免反馈脱离产品进入单独文档：

- 在 Browse 模式中浏览真实预览。
- 使用 Select 指向具体界面元素。
- 使用 Pen 绘制红色手绘标记。
- 在 Chrome 中自然说话，并实时看到中间及最终转录结果。
- 实时转录不可用时，仍保留可播放的本地录音。
- 保存给 Codex 之前检查每一条调整建议。

V2UI 是评审界面，不是通用网页编辑器。选中的 DOM 节点只是对用户意图的证据，并不自动授权修改共享组件、设计 token、响应式规则或全局样式。

## 与 Codex 完成一轮评审

每轮评审遵循同一套流程。你控制预览并确认影响范围，Codex 负责源码分析和实现。

### 1. 启动本地预览

在 `localhost` 或 `127.0.0.1` 上运行需要评审的网站。V2UI 需要 Node.js 20 或更高版本。

### 2. 启动 V2UI

在被评审项目的根目录中运行：

```bash
node /absolute/path/to/v2ui/scripts/start-v2ui.mjs \
  --project "$PWD" \
  --preview "http://127.0.0.1:5173/" \
  --mode codex
```

对于使用 Codex 内置浏览器的 Vite 项目，需要一次性安装仅用于开发环境的适配器：

```bash
node /absolute/path/to/v2ui/scripts/install-vite-adapter.mjs --project "$PWD"
```

适配器仅在预览 URL 包含 `v2ui=1` 时启用，不会改变生产构建。

外部 Chrome 使用 `--mode chrome`。生产启动器也可以接收 `--extension-install-url <Chrome-Web-Store-URL>`，引导首次使用者进入商店。没有商店地址的开发构建会展示可见的“加载已解压扩展程序”流程。V2UI 不会声称或尝试静默安装浏览器扩展。

### 3. 还原正确的页面状态

使用 Browse 正常导航、滚动并操作网站。只有准备添加视觉证据时，再切换到 Select 或 Pen。

### 4. 描述需要调整的内容

点击绿色播放控制。屏幕和麦克风权限只会在此时请求。

在 Chrome 中，录制期间会把 Web Speech 的中间结果和最终结果显示在当前建议里。短暂停顿仍归入同一条建议，直到新的 Select 或 Pen 标记开始下一条建议。

在 Codex 内置浏览器中，产品不依赖实时转录。暂停录制会为当前视觉标记添加一段可播放的本地音频；恢复录制后，可以继续向同一条建议追加音频片段。

点击建议右侧的 `×` 会完整丢弃这一项：包括文本或关联音频、对应的 Select/Pen 证据以及当前语音边界。再次说话会创建全新建议，被删除的区域不会因延迟到达的转录结果而恢复。

### 5. 保存并确认

V2UI 会先保存评审。Codex 模式随后复制一段提示词，请当前任务读取最新评审包。Codex Desktop 对打开的任务持有独占写入，因此外部进程无法可靠地向同一任务注入回调消息。

保存反馈不等于授权修改代码。Codex 必须先概括每条建议及其可能影响的源码范围，再等待用户明确确认。

评审保存后，V2UI 会清空当前建议、标注、录音和计时器，让下一轮从干净状态开始。

## 当前能力

当前 Beta 版本支持：

- 在 Chrome 或 Codex 内置浏览器中评审本地网页预览。
- 严格分离 Browse 与 Select/Pen 标注模式。
- 采集屏幕、麦克风、DOM 目标、自由绘制、滚动位置、视口和时间证据。
- 在 Chrome 中无需暂停录制即可看到实时的中间及最终转录文本。
- 实时语音识别失败时继续录音，并由 Codex 后续转写。
- 将语音停顿合并到同一视觉标记下，并在下一个标记出现时开始新建议。
- 删除建议时同步删除关联的视觉证据。
- 将所有评审数据保存在被评审项目中，而不是 V2UI 仓库。
- 修改代码前必须先说明影响范围并获得明确批准。

## 评审数据的保存位置

每个评审包都保存在被评审的项目中：

```text
<reviewed-project>/.codex/v2ui-reviews/<session-id>/
├── manifest.json
├── recording-01.webm
└── recording-02.webm
```

onboarding 状态和 companion 日志保存在 `<reviewed-project>/.codex/v2ui/`。V2UI 源码仓库和发布压缩包不会包含评审包、录音、日志、安装缓存或其他产品的源码。

## 项目结构

```text
.codex-plugin/       Codex 插件清单
skills/v2ui/         Codex Skill 与界面元数据
scripts/             启动器、companion、桥接、读取和打包工具
browser-extension/   Chrome Manifest V3 扩展源码
adapters/            仅用于开发环境的 Codex 浏览器适配器
tests/               契约、桥接与 companion 冒烟测试
assets/              Codex 插件卡片素材
docs/                网站、隐私、条款和支持页面
submission/          Chrome 与 OpenAI 提交材料
releases/            生成的发布包，不纳入源码版本控制
```

## 安装

### Codex 插件 Beta

将此仓库添加为 Codex 插件 marketplace，并安装 `v2ui`：

```bash
codex plugin marketplace add xuyang0921/V2UI
```

然后在 Codex marketplace 中选择 V2UI。marketplace 清单已固定到当前发布标签。

### Chrome 开发版本

从最新 GitHub Release 下载 `V2UI-Chrome-0.4.1.zip` 并解压。打开 `chrome://extensions`，启用开发者模式，选择“加载已解压的扩展程序”，然后选中解压后的 `V2UI-Chrome-0.4.1` 目录。

单独的 `V2UI-Chrome-Web-Store-0.4.1.zip` 用于提交 Chrome Web Store，ZIP 根目录直接包含 `manifest.json`。

## 从源码开发

```bash
npm test
npm run validate
npm run build
```

`npm run build` 会验证 JavaScript 语法、manifest、Codex Skill、两份浮层的一致性和完整测试，然后生成：

```text
releases/V2UI-Chrome-0.4.1.zip
releases/V2UI-Chrome-Web-Store-0.4.1.zip
releases/V2UI-Codex-0.4.1.zip
releases/V2UI-Skill-Submission-0.4.1.zip
```

Chrome 发布包使用明确的允许清单，只包含运行文件和扩展图形资源。

修改前请阅读[贡献指南](./CONTRIBUTING.zh-CN.md)。产品不可变约定位于[产品基线](./PRODUCT.zh-CN.md)，面向 Codex 的开发规则位于 [AGENTS.md](./AGENTS.md)。

## 始终掌控你的项目

V2UI 只处理你明确选择的本地预览。Chrome 扩展采用 Manifest V3，只请求 `activeTab` 和 `scripting`；主机访问范围仅限 `http://localhost/*` 与 `http://127.0.0.1/*`。

本地 companion 不会把屏幕或麦克风录音上传至 V2UI 运营的云端服务。浏览器提供的实时语音识别可能依据浏览器厂商的政策处理音频。请使用正常的 Git 工作流检查 Agent 所做的修改，不要提交私有评审证据。

## 当前范围

V2UI 当前面向本地网站预览和由 Codex 主导的实现流程。Beta 版本一次处理一轮评审，并要求用户保存后回到当前 Codex 任务。

仓库不包含托管评审服务、静默扩展安装器或通用生产网站编辑器。浏览器权限行为和实时语音能力可能因环境而异。

## 路线图

当前路线图聚焦于：

- Beta 评审完成后公开发布 Chrome Web Store 条目。
- 本地运行兼容性评审完成后公开发布 OpenAI 插件条目。
- 更清晰的 onboarding 与故障恢复提示。
- 在不改变生产构建的前提下扩展更多框架适配器。
- 改进本地转录以及音频与视觉证据的对齐。

## 参与贡献

请阅读[贡献指南](./CONTRIBUTING.zh-CN.md)并遵守[行为准则](./CODE_OF_CONDUCT.zh-CN.md)。较大的改动应先创建 Issue，以便确认范围和产品边界。

如需帮助，请查看[支持说明](./SUPPORT.zh-CN.md)。安全问题请通过[安全政策](./SECURITY.zh-CN.md)中的私密流程报告。

## 许可证

V2UI 采用 [MIT License](./LICENSE)。
