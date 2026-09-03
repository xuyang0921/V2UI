# 更新日志

<p align="right"><a href="./CHANGELOG.md">English</a> | <strong>中文</strong></p>

## 尚未发布

### 变更

- 为仓库 README、产品文档、贡献指南、政策、支持页面、发布指南和公开网站添加英文与中文切换。

## 0.4.1 - 2026-09-03

### 新增

- 英文产品界面、onboarding、演示、网站、政策页面、贡献文档、商店 listing 和发布说明。
- 新增契约测试，防止非英文产品文案重新进入源码或分发文本文件。

### 变更

- 围绕实际产品流程、当前能力、安装、安全边界、适用范围、路线图和贡献路径重构 README。
- Chrome 语音识别现在优先使用用户浏览器语言，并以英文作为回退。

### 修复

- Codex 浏览器浮层现在使用提供运行脚本的 localhost companion 地址，非默认端口不会再把评审发送到另一个本地项目。
- Codex 任务投递不再传入已移除的 `-a` CLI 参数，并继续以只读 sandbox 恢复绑定任务。
- 任务绑定现在会探测 Codex 状态和 app-server 可用性，报告具体的手动投递原因，并记录 companion 启动前所需的 sandbox 权限。
- 由于打开任务的 active writer 会拒绝外部 `codex exec resume` 回调，Codex Desktop 评审改用可靠的“保存并返回”流程；可选投递无法启动时，不再把已保存评审显示为失败。
- Chrome 建议在录制时显示中间语音结果，并将停顿合并到下一个视觉标记出现前；Codex 评审在每次暂停后提供与标记关联的可播放音频，同一调整项可保留多个暂停片段。
- 删除建议会清除文本或音频、移除关联 Select/Pen 证据，并重置当前识别边界，使延迟语音结果无法恢复已删除内容。

## 0.4.0 - 2026-08-31

### 新增

- GitHub Marketplace 元数据和生产版 Chrome Web Store onboarding。
- 独立的 Web Store、完整 Codex 插件和仅含 Skill 的提交包。
- 公开网站、隐私、条款、支持、安全及商店提交草稿。

### 变更

- 在准备可分发 Beta 的同时保留已验证的 0.3.1 评审行为。
- 明确浏览器 Web Speech 的数据处理遵循浏览器厂商政策。

## 0.3.1 - 2026-08-31

### 新增

- 不依赖实时 Web Speech 转录的弹性音频录制。
- 仅录音评审投递与 Codex 后处理指引。
- 暂停与恢复之间保留多个录音片段。
- 统一项目验证、契约测试、companion 冒烟测试与干净 Chrome 打包。
- 独立 V2UI 产品文档与仓库边界。

### 变更

- 将 V2UI 建立为独立产品根目录。
- 最终确定 Browse、Select、Pen、Undo、Clear 和 Exit review 工具。
- 增加建议面板录制状态点，同时保持面板界面安静克制。
- 工具条保留橙色斜体 V2UI 字标，Chrome 与 Codex 插件卡保留图形 Logo。
- Chrome 发布产物在本项目的 `releases/` 目录生成。

### 安全

- Chrome 保持 Manifest V3，仅使用 `activeTab` 和 `scripting` 权限。
- 主机访问继续限制在 `localhost` 与 `127.0.0.1`。
- 屏幕与麦克风权限只在用户开始评审后请求。
- 评审包只保存在被评审项目的 `.codex/v2ui-reviews` 目录。
