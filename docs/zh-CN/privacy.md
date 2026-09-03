---
layout: default
permalink: /zh-CN/privacy/
---
# V2UI 隐私政策

<p align="right"><a href="../../privacy/">English</a> | <strong>中文</strong></p>

生效日期：2026 年 9 月 3 日

V2UI 用于评审用户拥有或获准修改的本地网站预览。当前架构不运营接收评审数据的 V2UI 云端服务。

## 请求与存储的数据

V2UI 只在用户开始评审后请求屏幕和麦克风权限。录音、DOM 目标、画笔路径、建议和结构化 manifest 保存在被评审项目的 `.codex/v2ui-reviews/` 目录中。onboarding 状态和本地 companion 日志保存在该项目的 `.codex/v2ui/` 中。

## 数据处理边界

V2UI companion 不会把屏幕或麦克风录音上传给 V2UI 发布者。浏览器提供的实时语音识别可能依据浏览器厂商的政策处理音频。实时识别失败时，V2UI 会继续在本地录音并允许保存评审。

当用户选择把评审交给 Codex 时，结构化建议和本地证据引用会依据相应服务提供商的条款及隐私政策处理。

## Chrome 权限

Chrome 扩展使用 Manifest V3，只申请 `activeTab` 和 `scripting`。主机访问仅限 `http://localhost/*` 与 `http://127.0.0.1/*`。这些权限用于把评审界面加载到用户明确启用的本地预览页面。

## 保留与删除

V2UI 不运营评审数据云存储，因此不设置云端保留期限。删除被评审项目中的 `.codex/v2ui-reviews/` 和 `.codex/v2ui/`，即可删除本地评审数据与运行状态。你也可以随时移除 Chrome 扩展或 Codex 插件。

在浮层中删除一条建议，会从准备中的评审移除其文本或音频引用以及关联的 Select/Pen 证据。

## 联系方式

隐私问题请使用仓库的[支持流程](../support/)。公开 Issue 中不要包含录音、manifest、私有源码、凭据或其他敏感数据。
