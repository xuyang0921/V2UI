# 安全政策

<p align="right"><a href="./SECURITY.md">English</a> | <strong>中文</strong></p>

V2UI 仅用于用户拥有或获准评审的本地预览。请勿在 Issue 中公开评审录音、manifest、令牌、私有源码或 `.codex/` 内容。

## 支持的版本

安全修复面向最新公开 Beta 版本。条件允许时，请先升级到最新 GitHub Release 再报告问题。

## 报告漏洞

请使用 [GitHub Security Advisories](https://github.com/xuyang0921/V2UI/security/advisories/new) 私密报告漏洞，并提供受影响版本、评审表面、复现步骤、影响和可能的缓解方案。请删除或遮蔽私有项目与评审数据。

在修复或协调披露计划准备完成之前，不要创建公开漏洞 Issue。

## 安全边界

- Chrome 扩展使用 Manifest V3，仅申请 `activeTab` 和 `scripting`。
- 主机访问仅限 `localhost` 与 `127.0.0.1`。
- 只有在用户明确操作后才请求屏幕与麦克风权限。
- 评审数据保存在被评审项目，而不是 V2UI 运营的云端服务。
- 浏览器 Web Speech 可能依据浏览器厂商政策处理音频。
- 保存评审永远不等于授权修改源码。
