# V2UI browser helper

This Manifest V3 extension is the external-Chrome adapter for V2UI. The one-time setup
page shows this directory and guides the user through loading it as an unpacked
extension. Later launches skip setup, open the local preview, and reuse the
project companion when it is already healthy.

Start the guided flow from the project root:

```bash
node <plugin-root>/scripts/start-v2ui.mjs --project "$PWD" --preview "http://127.0.0.1:5173/"
```

After setup, click the V2UI browser action on a `localhost` or `127.0.0.1`
preview to toggle the review overlay.

When the launcher is run from a Codex task, the companion binds both Chrome and
the sidebar-browser surface to that task. The action button becomes **确认调整**:
it saves the local review package, resumes the bound task in read-only mode, and
asks Codex to summarize scope and wait for explicit confirmation. If Chrome is
started without a Codex task binding, the button remains **发送建议** and keeps the
manual return-to-chat flow.

The same overlay also runs in the Codex built-in sidebar browser through the
development-server adapter in `../adapters/vite.mjs`; that mode does not use a
Chrome extension.

It intentionally requests only `activeTab`, `scripting`, and local-preview host
access. Screen and microphone permissions are requested by the overlay only
after the user clicks **开始录制**.

Live speech transcription is attempted on both Chrome and the Codex built-in
browser. If the embedded speech service is unavailable, audio recording remains
active and a recording-only review can still be confirmed. The companion saves
the audio in the review package and asks the bound Codex task to transcribe it
before resolving the linked suggestions.
