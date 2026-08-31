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

Codex Desktop keeps an exclusive writer for the open task, so an external
`codex exec resume` cannot safely inject a callback into that same task. The
sidebar action therefore becomes **保存并返回 Codex**: it saves the package and
copies a prompt that asks the current task to read the latest review. Independent
Chrome usage keeps **发送建议** and the same manual return-to-chat flow.

The same overlay also runs in the Codex built-in sidebar browser through the
development-server adapter in `../adapters/vite.mjs`; that mode does not use a
Chrome extension.

It intentionally requests only `activeTab`, `scripting`, and local-preview host
access. Screen and microphone permissions are requested by the overlay only
after the user clicks **开始录制**.

Live speech transcription is used where the review surface supports it. Chrome
renders interim and final
results into the current suggestion while recording; pauses stay in the same
item until the next Select/Pen marker. The Codex built-in browser instead adds
playable audio ranges after each pause and groups multiple pause segments under
the same marker. The companion saves every audio segment for later transcription.
