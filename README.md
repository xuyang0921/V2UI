# V2UI

<p align="right"><strong>English</strong> | <a href="./README.zh-CN.md">中文</a></p>

> Point at the interface. Say what should change. Keep the code under your control.

V2UI is a local preview review layer for websites built with Codex. It keeps feedback connected to the running product: browse the real page, select a DOM element or draw directly on the preview, and describe the intended change by voice.

V2UI saves the resulting transcript, recording, visual evidence, viewport, URL, and timing as a structured review package. Codex then explains the likely source impact and waits for explicit approval before editing code.

Current release: **0.4.1 Beta**. Chrome and the Codex built-in browser use the same review overlay, local companion, and review-package format.

## Review the running website

V2UI keeps visual feedback attached to the exact page state instead of moving it into a detached document:

- Navigate the real preview in Browse mode.
- Point to a specific interface element with Select.
- Draw a red freehand annotation with Pen.
- Speak naturally while Chrome streams interim and final transcription.
- Keep playable local audio when live transcription is unavailable.
- Review every suggestion before saving it for Codex.

V2UI is a review surface, not a general-purpose web editor. A selected DOM node is evidence of what the user meant; it does not automatically authorize changing a shared component, design token, responsive rule, or global style.

## Complete a review with Codex

Each review follows one repeatable loop. You control the preview and approve the scope; Codex handles source analysis and implementation.

### 1. Start the local preview

Run the website you want to review on `localhost` or `127.0.0.1`. V2UI requires Node.js 20 or later.

### 2. Start V2UI

From the reviewed project root, run:

```bash
node /absolute/path/to/v2ui/scripts/start-v2ui.mjs \
  --project "$PWD" \
  --preview "http://127.0.0.1:5173/" \
  --mode codex
```

For a Vite project using the Codex built-in browser, install the development-only adapter once:

```bash
node /absolute/path/to/v2ui/scripts/install-vite-adapter.mjs --project "$PWD"
```

The adapter activates only when the preview URL contains `v2ui=1`; it does not change the production build.

Use `--mode chrome` for external Chrome. A production launcher can also receive `--extension-install-url <Chrome-Web-Store-URL>` to guide first-time users to the store. Development builds without a store URL show the visible unpacked-extension flow. V2UI does not silently install browser extensions.

### 3. Reproduce the right page state

Use Browse to navigate, scroll, and interact with the website normally. Switch to Select or Pen only when you are ready to attach visual evidence.

### 4. Describe the change

Click the green play control. Screen and microphone permissions are requested only at this point.

In Chrome, interim and final Web Speech results appear in the current suggestion while recording. A speech pause stays in the same suggestion until a new Select or Pen marker begins another item.

In the Codex built-in browser, live transcription is not required. Pausing adds a playable local audio range to the current visual marker; resuming can append another range to the same suggestion.

Clicking a suggestion's `×` discards the complete item: text or linked audio, its Select/Pen evidence, and the active speech boundary. Speaking again creates a new suggestion and does not restore the deleted region.

### 5. Save and confirm

V2UI saves the review first. Codex mode then copies a prompt that asks the current task to read the latest package. Codex Desktop keeps an exclusive writer for the open task, so an external process cannot reliably inject a callback into that same task.

Saving feedback is not permission to edit code. Codex must summarize each suggestion and its possible source impact, then wait for explicit confirmation before making changes.

After a review is saved, V2UI clears the current suggestions, annotations, recordings, and timer so the next round starts cleanly.

## What you can do today

The current beta lets you:

- Review local web previews in Chrome or the Codex built-in browser.
- Keep Browse separate from Select and Pen annotation modes.
- Capture screen, microphone, DOM targets, freehand drawing, scroll, viewport, and timing evidence.
- See live interim/final transcription in Chrome without pausing the recording.
- Continue recording when live speech recognition fails and let Codex transcribe saved audio later.
- Group speech pauses under one visual marker and start a new suggestion with the next marker.
- Delete a suggestion together with its linked visual evidence.
- Save every review under the reviewed project rather than the V2UI repository.
- Require a scope summary and explicit approval before code changes.

## Where review data is stored

Every review package stays in the project being reviewed:

```text
<reviewed-project>/.codex/v2ui-reviews/<session-id>/
├── manifest.json
├── recording-01.webm
└── recording-02.webm
```

Onboarding state and companion logs stay under `<reviewed-project>/.codex/v2ui/`. The V2UI source repository and release archives exclude review packages, recordings, logs, installation caches, and unrelated product source.

## Project structure

```text
.codex-plugin/       Codex plugin manifest
skills/v2ui/         Codex skill and interface metadata
scripts/             Launcher, companion, bridge, reader, and packaging tools
browser-extension/   Chrome Manifest V3 extension source
adapters/            Development-only Codex browser adapters
tests/               Contract, bridge, and companion smoke tests
assets/              Codex plugin card artwork
docs/                Website, privacy, terms, and support pages
submission/          Chrome and OpenAI submission materials
releases/            Generated archives; excluded from source control
```

## Install

### Codex plugin beta

Add the repository as a Codex plugin marketplace and install `v2ui`:

```bash
codex plugin marketplace add xuyang0921/V2UI
```

Then choose V2UI from the marketplace in Codex. The marketplace manifest pins the current release tag.

### Chrome developer build

Download `V2UI-Chrome-0.4.1.zip` from the latest GitHub release, unzip it, open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select the extracted `V2UI-Chrome-0.4.1` directory.

The separate `V2UI-Chrome-Web-Store-0.4.1.zip` archive is for Chrome Web Store submission and has `manifest.json` at the ZIP root.

## Develop from source

```bash
npm test
npm run validate
npm run build
```

`npm run build` validates JavaScript syntax, manifests, the Codex skill, dual-overlay parity, and the test suite before creating:

```text
releases/V2UI-Chrome-0.4.1.zip
releases/V2UI-Chrome-Web-Store-0.4.1.zip
releases/V2UI-Codex-0.4.1.zip
releases/V2UI-Skill-Submission-0.4.1.zip
```

Chrome archives use an explicit allowlist containing only runtime files and extension artwork.

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before making a change. Product invariants live in [PRODUCT.md](./PRODUCT.md), and Codex development rules live in [AGENTS.md](./AGENTS.md).

## Keep your project under your control

V2UI operates only on local previews that you explicitly choose. The Chrome extension uses Manifest V3 with only `activeTab` and `scripting`; host access is limited to `http://localhost/*` and `http://127.0.0.1/*`.

The local companion does not upload screen or microphone recordings to a V2UI-operated cloud service. Browser-provided live speech recognition may process audio under the browser vendor's policy. Review all agent-made changes with your normal Git workflow and never commit private review evidence.

## Current scope

V2UI currently targets local website previews and Codex-led implementation workflows. The beta supports one review round at a time and expects the user to return to the active Codex task after saving.

The repository does not include a hosted review service, a silent extension installer, or a general-purpose production-site editor. Browser permission behavior and live speech availability can vary by environment.

## Roadmap

The roadmap focuses on:

- A public Chrome Web Store listing after beta review.
- A public OpenAI plugin listing after local-runtime compatibility review.
- Clearer onboarding and recovery diagnostics.
- Broader framework adapters without changing production builds.
- Improved local transcription and audio-to-visual alignment.

## Contribute

Read [CONTRIBUTING.md](./CONTRIBUTING.md) and follow the [Code of Conduct](./CODE_OF_CONDUCT.md). Open an issue before a large change so scope and product boundaries can be confirmed first.

For help, see [SUPPORT.md](./SUPPORT.md). Report security issues through the private process in [SECURITY.md](./SECURITY.md).

## License

V2UI is available under the [MIT License](./LICENSE).
