# 参与 V2UI 开发

<p align="right"><a href="./CONTRIBUTING.md">English</a> | <strong>中文</strong></p>

感谢你帮助改进 V2UI。贡献应强化本地预览评审流程，不应把 V2UI 变成通用网页编辑器，也不应削弱确认边界。

## 开始之前

请阅读[产品基线](./PRODUCT.zh-CN.md)和 [AGENTS.md](./AGENTS.md)。大型功能、新评审表面、schema 变更、权限变更或分发变更应先创建 Issue，以便提前确认范围。

不要在 Issue、提交、测试夹具或发布包中包含录音、评审 manifest、私有源码、访问令牌、`.codex/` 状态、插件缓存或无关应用源码。

## 开发环境

V2UI 需要 Node.js 20 或更高版本，当前源码只使用 Node 内置模块，不需要安装依赖。

运行完整本地检查：

```bash
npm run validate
npm test
```

涉及打包或发布时，还需运行：

```bash
npm run build
```

使用 `unzip -t` 检查所有 ZIP，并确认 Chrome Web Store 包的根目录包含 `manifest.json`。

## 变更规则

- 保持 `browser-extension/overlay.js` 与 `scripts/overlay.js` 完全一致。
- 保留 Manifest V3 与最小 Chrome 权限集合。
- 只有明确的用户操作后才请求采集权限。
- 实时转录失败时仍须保证录音可用。
- DOM 目标是证据，不是源码修改授权。
- 修改代码前必须概括范围并取得明确批准。
- 发布的产品 UI 与商店提交包保持英文；公开仓库文档须维护英文与中文一致性。
- 行为变化时同步更新测试、`PRODUCT.md` 与 `CHANGELOG.md`。

## Pull Request

每个 Pull Request 应保持聚焦，并说明用户可见问题、涉及的产品边界、实现方式和验证结果。只有在不包含私有项目或评审数据时，才可附上经过脱敏的截图。

提交贡献即表示你同意该贡献遵循仓库的 MIT License。
