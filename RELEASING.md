# V2UI release process

<p align="right"><strong>English</strong> | <a href="./RELEASING.zh-CN.md">中文</a></p>

## Prepare the release

1. Choose a semantic version and update `package.json`, `.codex-plugin/plugin.json`, `browser-extension/manifest.json`, the Marketplace tag in `.agents/plugins/marketplace.json`, submission listings, website copy, and `CHANGELOG.md`.
2. Confirm that shipped product UI and submission copy are English, public repository documentation has matching English and Chinese pages, and `browser-extension/overlay.js` is identical to `scripts/overlay.js`.
3. Run `npm run build`. It must complete project validation, all tests, and release packaging.
4. Run `unzip -t` on all four ZIP files and inspect their contents. The Web Store archive must have `manifest.json` at its root; the developer archive must contain one versioned top-level directory.
5. Confirm that no archive contains `.codex/`, recordings, logs, onboarding state, installation caches, parent-directory files, or unrelated product source.

## Publish GitHub source and assets

1. Commit and push the release source to `xuyang0921/V2UI`.
2. Create an annotated `v<version>` tag at the release commit and push it.
3. Create a GitHub Release named `V2UI <version>` with English and Chinese release notes.
4. Attach the developer Chrome ZIP, Chrome Web Store ZIP, complete Codex plugin ZIP, and skills-only OpenAI submission ZIP.
5. Verify that the Marketplace manifest points to the newly published tag and that GitHub Pages renders the current privacy, terms, and support pages.

## Submit distribution packages

- **Chrome beta:** upload `V2UI-Chrome-Web-Store-<version>.zip` as Unlisted. After approval, pass the store URL to `start-v2ui.mjs` with `--extension-install-url` and retest onboarding.
- **Codex beta:** install from the repository marketplace and verify the plugin card, version, artwork, default prompts, and `$v2ui` workflow.
- **OpenAI directory:** use the skills-only ZIP, English listing, test cases, and public privacy, terms, and support URLs.

Move visibility beyond beta only after the local-runtime compatibility, browser permission flow, policy text, and support process have been reviewed.
