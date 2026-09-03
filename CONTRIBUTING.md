# Contributing to V2UI

Thank you for helping improve V2UI. Contributions should strengthen the local preview review workflow without turning V2UI into a general-purpose editor or weakening its confirmation boundary.

## Before you start

Read [PRODUCT.md](./PRODUCT.md) and [AGENTS.md](./AGENTS.md). Open an issue before a large feature, new review surface, schema change, permission change, or distribution change so the intended scope can be agreed first.

Do not include recordings, review manifests, private source code, access tokens, `.codex/` state, plugin caches, or unrelated application source in an issue, commit, fixture, or release archive.

## Development setup

V2UI requires Node.js 20 or later and uses built-in Node modules; there is no dependency installation step for the current source tree.

Run the complete local checks:

```bash
npm run validate
npm test
```

For packaging or release changes, also run:

```bash
npm run build
```

Inspect all generated ZIP files with `unzip -t` and confirm the Chrome Web Store archive contains `manifest.json` at its root.

## Change rules

- Keep `browser-extension/overlay.js` and `scripts/overlay.js` identical.
- Preserve Manifest V3 and the minimal Chrome permission set.
- Request capture permissions only after an explicit user action.
- Keep audio recording usable when live transcription fails.
- Treat DOM targets as evidence, not source-edit authorization.
- Require a scope summary and explicit approval before code changes.
- Keep all product-facing copy in English.
- Update tests, `PRODUCT.md`, and `CHANGELOG.md` when behavior changes.

## Pull requests

Keep each pull request focused. Explain the user-visible problem, the product boundary affected, the implementation, and the verification performed. Include sanitized screenshots only when they contain no private project or review data.

By contributing, you agree that your contribution is licensed under the repository's MIT License.
