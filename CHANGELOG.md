# Changelog

## Unreleased

### Fixed

- Codex-browser overlays now use the localhost companion origin that served the runtime script, so non-default ports cannot route reviews into another local project.
- Codex task delivery no longer passes the removed `-a` CLI option and continues to resume the bound task with a read-only sandbox.
- Task binding now probes Codex state and app-server availability, reports the concrete manual-delivery reason, and documents the sandbox permission required before companion startup.

## 0.4.0 - 2026-08-31

### Added

- GitHub Marketplace metadata and production Chrome Web Store onboarding.
- Separate Web Store, full Codex plugin, and skills-only submission archives.
- Public website, privacy, terms, support, security, and store-submission drafts.

### Changed

- Preserved the verified 0.3.1 review behavior while preparing a distributable beta.
- Clarified that browser Web Speech processing follows the browser vendor policy.


## 0.3.1 - 2026-08-31

### Added

- Resilient audio recording independent from live Web Speech transcription.
- Recording-only review delivery with Codex post-processing instructions.
- Multiple recording segments across pause/resume cycles.
- Unified project validation, contract tests, companion smoke test, and clean Chrome packaging.
- Independent V2UI product documentation and repository boundaries.

### Changed

- Established V2UI as an independent, standalone product root.
- Finalized the toolbar labels as Browse, Select, Pen, Undo, Clear, and Exit review.
- Added the suggestions-panel recording status dot while keeping the panel surface otherwise quiet.
- Kept the toolbar as an italic orange V2UI wordmark and retained graphic logos for Chrome and Codex plugin cards.
- Chrome release artifacts now build inside this project under `releases/`.

### Security

- Chrome remains Manifest V3 with only `activeTab` and `scripting` permissions.
- Host access remains restricted to `localhost` and `127.0.0.1`.
- Screen and microphone permissions are requested only after the user starts a review.
- Review packages remain local to the reviewed project's `.codex/v2ui-reviews` directory.
