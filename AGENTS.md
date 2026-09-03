# V2UI development instructions

This directory is the independent V2UI product root. Do not import another product's `src/`, website worker, research material, or release scripts. Never use a personal plugin directory or `~/.codex/plugins/cache` as source code.

Read `PRODUCT.md` before changing behavior. Preserve these boundaries:

- V2UI reviews authorized local previews; it is not a general-purpose web editor.
- Browse remains separate from Select/Pen annotation modes.
- A DOM selection is evidence. It does not automatically authorize changes to a shared component, token, responsive rule, or global style.
- Codex Desktop holds an exclusive writer for the open task, so an external `codex exec resume` cannot reliably inject a callback. Save the review and guide the user back to the task. Experimental resume must remain read-only. Saving suggestions does not authorize code changes; Codex must summarize impact and wait for explicit approval.
- Chrome remains Manifest V3 with only `activeTab` and `scripting`; hosts remain limited to `localhost` and `127.0.0.1`.
- Request screen and microphone access only after the user starts a review. A live-transcription failure must not block recording or submission.
- Chrome must show interim and final Web Speech results while recording, merging pauses under the same visual marker. Codex must not depend on live transcription; after a pause it groups playable audio by visual marker.
- A suggestion card's `×` discards its text/audio and linked Select/Pen evidence, then cuts the active recognition or audio boundary. New speech creates a new suggestion, and late results must not restore deleted content.
- Store session data only under the reviewed project's `.codex/v2ui-reviews`; store onboarding state and runtime logs under that project's `.codex/v2ui`.

Chrome and the Codex built-in browser must continue to share one overlay. After editing `browser-extension/overlay.js`, copy it exactly to `scripts/overlay.js` and verify byte-for-byte equality.

Visual baseline: low-saturation warm orange/yellow, a soft red pen, opaque white toolbar and suggestion panel, italic orange `V2UI` wordmark without a graphic logo in the toolbar, graphic logos only for Chrome and Codex cards, Browse/Select/Pen/Undo/Clear/Exit review tools, a green play/pause control, a status-dot-only panel header, centered dark-brown rounded toasts, and a draggable panel that appears after the first suggestion.

After any source change, run at least:

```bash
npm run validate
npm test
```

For release changes, run `npm run build`, test every ZIP, and inspect the package allowlist. Never package `.codex/`, recordings, logs, installation caches, or parent-directory content. `scripts/package-chrome-extension.mjs` is the Chrome packaging source of truth.
