# Security

<p align="right"><strong>English</strong> | <a href="./SECURITY.zh-CN.md">中文</a></p>

V2UI is intended only for local previews that the user owns or is authorized to review. Do not publish review recordings, manifests, tokens, private source code, or `.codex/` content in an issue.

## Supported versions

Security fixes are provided for the latest published beta. Upgrade to the newest GitHub release before reporting a problem when practical.

## Reporting a vulnerability

Use [GitHub Security Advisories](https://github.com/xuyang0921/V2UI/security/advisories/new) to report a vulnerability privately. Include the affected version, review surface, reproduction steps, impact, and any proposed mitigation. Remove or redact private project and review data.

Do not open a public issue for a vulnerability until a fix or coordinated disclosure plan is available.

## Security boundaries

- The Chrome extension uses Manifest V3 with only `activeTab` and `scripting`.
- Host access is limited to `localhost` and `127.0.0.1`.
- Screen and microphone permissions are requested only after an explicit user action.
- Review data is stored under the reviewed project, not in a V2UI-operated cloud service.
- Browser Web Speech may process audio under the browser vendor's policy.
- Saving a review never grants permission to modify source code.
