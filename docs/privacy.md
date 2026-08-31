---
layout: default
permalink: /privacy/
---
# V2UI 隐私政策

生效日期：2026-08-31

V2UI 用于审阅用户有权修改的本地网页预览。当前架构不运营接收评审数据的 V2UI 云服务。

## 收集和保存

V2UI 在用户主动开始评审后才请求屏幕和麦克风权限。录音、DOM 目标、画笔轨迹、建议和结构化 manifest 保存在被审项目的 `.codex/v2ui-reviews/`。onboarding 状态及本地 companion 日志保存在 `.codex/v2ui/`。

## 数据处理边界

V2UI companion 不会把屏幕或麦克风录制上传到 V2UI 运营方。浏览器提供的实时语音识别能力可能依据浏览器供应商的政策处理音频；实时识别失败时，V2UI 仍在本地录音并允许提交。用户把评审发送到绑定的 Codex 任务时，结构化建议及本地文件引用会交给该服务处理，适用相应服务提供方的条款和隐私政策。

## 权限

Chrome 扩展使用 Manifest V3，仅申请 `activeTab` 与 `scripting`，站点权限仅限 `http://localhost/*` 和 `http://127.0.0.1/*`。权限用于在用户当前激活的本地预览页加载评审界面。

## 删除与保留

V2UI 不设置云端保留期。用户可删除被审项目中的 `.codex/v2ui-reviews/` 和 `.codex/v2ui/` 来移除本地评审数据与运行状态，也可随时移除 Chrome 扩展或 Codex 插件。

## 联系

公开支持渠道将在 GitHub 仓库启用后列于[支持页](../support/)。在该渠道上线前，本政策不得作为已开放公众支持的声明。
