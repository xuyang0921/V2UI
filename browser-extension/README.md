# V2UI Chrome extension

<p align="right"><strong>English</strong> | <a href="./README.zh-CN.md">中文</a></p>

This Manifest V3 extension is the external-Chrome review surface for V2UI. It injects the shared V2UI overlay only after the user clicks the browser action on a `localhost` or `127.0.0.1` page.

## Start the guided flow

From the project you want to review, run:

```bash
node <plugin-root>/scripts/start-v2ui.mjs \
  --project "$PWD" \
  --preview "http://127.0.0.1:5173/" \
  --mode chrome
```

The first launch opens project-specific onboarding. A production configuration can direct the user to the Chrome Web Store; a development build shows the visible Load unpacked instructions. Later launches reuse the healthy local companion and open the preview directly.

## Review behavior

Click the V2UI extension icon to toggle the overlay. Browse remains non-intercepting; Select and Pen attach DOM or drawing evidence. Screen and microphone permissions are requested only after the user clicks the green start-review control.

Chrome renders interim and final Web Speech results in the active suggestion while recording. Brief pauses stay in the same item until another Select/Pen marker starts a new suggestion. If live transcription fails, local recording continues and the review remains saveable for later Codex transcription.

Clicking a suggestion's `×` removes that suggestion, its linked visual evidence, and the active speech boundary. New speech begins a clean suggestion.

Codex Desktop keeps an exclusive writer for the open task, so V2UI saves the package and provides a return-to-task prompt instead of promising an external callback. Saving a review does not authorize code changes.

## Permissions

The extension intentionally requests only:

- `activeTab`, to act on the local page the user explicitly selected;
- `scripting`, to load the review overlay; and
- host access to `http://localhost/*` and `http://127.0.0.1/*`.

The same overlay runs in the Codex built-in browser through `../adapters/vite.mjs`; that surface does not use the Chrome extension.
