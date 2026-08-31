# V2UI product baseline

## 定位

V2UI 是 Codex 生成网站的**预览审阅层**。它把“我在页面哪里、看到了什么、画了什么、说了什么、何时发生”保存为可追溯的本地证据，再由 Codex 映射到源码范围、等待确认、实施并验证。

V2UI 不是通用网页编辑器，不直接把运行时 DOM 当成源码，也不在用户提交建议时自动修改代码。

## 核心循环

1. 启动本地预览与 V2UI companion。
2. 在 Codex 内置浏览器或 Chrome 打开同一个预览审阅层。
3. 用户主动开始评审并授予屏幕/麦克风权限。
4. Browse 检查真实页面；Select 或 Pen 标记视觉对象，并同步说出建议。
5. 暂停后保留全部证据；再次开始会追加录音段。
6. 发送后 companion 把评审包保存到被审项目。
7. 有 task 绑定时，以只读 Codex turn 返回编号建议；Codex总结实例、列表项、共享组件、设计 token、响应式规则或全局样式等可能影响范围。
8. 用户明确确认后，Codex 才能修改、构建和验证。
9. 发送完成即开启干净的新一轮，直到用户接受结果。

## 两种表面，一个产品

- **Codex 内置浏览器**：通过开发期 adapter 在 `?v2ui=1` 时注入共享 overlay。
- **外部 Chrome**：通过 Manifest V3 扩展把同一 overlay 注入本地预览。

两种表面共用 companion、交互、评审 schema、存储位置和确认规则；不得分叉为两套产品行为。用户可按每轮需要选择表面。

## 证据与建议模型

- `manifest.json` 中的 DOM target、画笔 annotation、语音建议、时间戳、viewport、URL、滚动位置和权限状态是结构化事实来源。
- 屏幕录制是辅助证据；DOM 选择只证明用户指向了运行时实例。
- 一条 suggestion 是一条语音派生的调整请求，不等于 DOM target 数量。
- 新建视觉标记会结束上一条建议的关联边界；同一次表述中的短暂停顿继续合并到当前建议。
- Undo 撤销一个视觉动作，并移除只与它关联的建议；Clear 清空本轮；删除建议同时移除它独占的视觉证据。
- hovering 建议应高亮其关联组件、画笔或整页范围。

## 状态与故障降级

评审有 recording、ended-and-editable、sent-for-confirmation 三种明确状态。结束录制与发送建议是两个动作。

实时 Web Speech 是 best effort，音频录制是独立的必备路径。语音服务不可用、网络错误或嵌入浏览器不支持时：

- 继续录音；
- 继续保存 DOM 和画笔；
- 允许录音-only 评审提交；
- manifest 标记 `transcription.requiresPostProcessing`；
- 绑定的 Codex task 先转写录音并与视觉时间线对齐，不能根据标注猜测语音内容。

屏幕、麦克风或语音权限分别记录。部分权限缺失不应丢弃其余可用证据。

自动 Codex 回传在绑定时执行非投递能力探针。若本地 Codex 状态库或 app-server 因沙箱权限不可用，companion 必须降级为手动回传并公开原因，不得继续显示可用的自动回传状态。已运行的 companion 不会继承后来授予的权限，授权后必须重新启动。

## 授权与影响范围

DOM 选择只是证据，不自动授权改共享组件、全局 token、响应式规则、循环中的所有实例或跨页面样式。Codex 必须在写代码前说明每项建议的潜在影响范围。

“发送建议”或“确认调整”只授权保存和回传评审。回传桥固定为只读；用户在 Codex task 中明确确认实施前，不得修改代码。

## 视觉与交互基线

- 低饱和暖橙/黄色体系，画笔为 alert-but-not-harsh 红色。
- 工具条与建议面板是不透明白色表面，不使用模糊或半透明。
- 工具条在拖动 grip 后显示纯斜体暖橙 `V2UI` 字标，不显示图形 Logo。
- Chrome 扩展图标与 Codex 插件卡保留暖橙 V2UI 图形 Logo。
- 工具固定为 Browse、Select、Pen、Undo、Clear、Exit review；Browse 与标注模式严格分离。
- 单一 player control：可开始/继续时为绿色播放三角，录制中为绿色暂停图标，旁边显示累计时间。
- 建议面板 header 只显示小状态点：录制中绿色，暂停/空闲红色。面板可从 header 拖动。
- 建议面板在首条建议后出现；录音-only 降级场景可在结束后显示提交入口，以保证可交付性。
- 首次提示与所有反馈均使用屏幕居中的深棕圆角 Toast；首次提示是两行等视觉宽度的短说明。
- 发送成功后清空标记、建议、录音段和时长，直接进入新一轮。

## 安全与存储

- Chrome 使用 Manifest V3，只请求 `activeTab`、`scripting`。
- host permissions 仅为 `http://localhost/*` 与 `http://127.0.0.1/*`。
- 屏幕和麦克风只在用户点击开始评审后请求。
- unpacked 扩展必须由用户在 Chrome UI 中可见地手动加载；不得宣称静默安装。
- 每个被审项目拥有一次性 onboarding 状态；launcher 可安全重复启动或复用 companion。
- 评审包只保存到 `<reviewed-project>/.codex/v2ui-reviews`。运行状态只保存到 `<reviewed-project>/.codex/v2ui`。
- V2UI 源与发布包不得包含被审数据、onboarding 状态、录音、安装缓存或其他产品的 UI 源码。

## 0.3.1 基线

0.3.1 包含：Chrome 与 Codex 双表面、共享 overlay、项目级 onboarding、`start-v2ui`、review-server companion、Vite adapter、只读 task 回传、录屏/麦克风/DOM/画笔/结构化 manifest、Web Speech 降级、分段录音、建议与视觉一一关联、短暂停顿合并，以及发送后的新一轮重置。
