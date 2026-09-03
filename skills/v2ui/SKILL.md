---
name: v2ui
description: Start, inspect, or apply a V2UI review of a local web preview using linked voice suggestions, component selections, and red drawing. Use when a user wants to point and speak UI changes, then confirm them before Codex edits the underlying frontend code.
---

# V2UI

Turn a live local preview review into scoped, verified code changes. The review surface records what the user saw, where they pointed, which DOM element was under each selection, what they said, and when each event happened.

## Boundaries

- This is for a local web preview the user is authorized to edit.
- A runtime DOM selection is evidence, not a source-code scope. Before writing, resolve whether it maps to an instance, loop item, shared component, token, responsive rule, or global style.
- V2UI saves review recordings under the active project's `.codex/v2ui-reviews/` directory and does not upload them to a V2UI-operated service. Browser live speech recognition may process audio under the browser vendor's policy; keep recording as the independent local evidence path.
- In Codex-browser mode, clicking **Save and return to Codex** saves the package and copies a prompt asking the current task to read the latest review. Codex Desktop keeps an active writer for the open task, so do not claim an external `codex exec resume` can inject a callback into that same task.
- In Chrome mode, keep the local-save flow: the button reads **Save feedback**, and the user returns to the chat manually. Experimental CLI resume may only be enabled explicitly and must never make a successfully saved package look failed.
- If browser permissions, speech recognition, or screen capture are unavailable, preserve any available drawing and DOM targets; state which evidence is missing.
- Live speech transcription is best-effort, but microphone recording is a required independent path. A review with saved audio and no live transcript must still be sendable. When the manifest marks `transcription.requiresPostProcessing`, transcribe the referenced recording files in the bound Codex task before summarizing the suggestions; never infer speech from annotations alone.
- Chrome should show interim and final speech text while recording; pauses stay in the current suggestion until a new Select/Pen marker. Codex mode should show playable local audio after each pause and group later pause segments under the same marker until a new visual marker is created.
- Sending suggestions does not authorize code changes. Summarize the received suggestions in the current chat and ask the user to confirm before editing.

## Start a review

Resolve `<v2ui-runtime-root>` before running commands. For a full plugin install it is the plugin root. For the skills-only distribution it is the `runtime/` directory beside this SKILL.md.

1. Resolve the local preview URL. If the app is not running, start its existing development command yourself and keep it running.
2. Resolve the requested surface. Use `codex` when the user asks for the built-in sidebar browser, and `chrome` when they ask for Chrome. If they do not specify, prefer the Codex built-in browser when available.
   Do not request `CODEX_HOME` write access for the default saved-review flow. An experimental CLI resume requires localhost network access and write access to `CODEX_HOME`, but still cannot resume a task held by an active Codex Desktop writer.
3. For Codex-browser mode in a Vite project, ensure the V2UI development adapter is installed once:

   ```bash
   node <v2ui-runtime-root>/scripts/install-vite-adapter.mjs --project "$PWD"
   ```

   Inspect the resulting Vite config change before continuing. The adapter is development-only and activates the overlay only when the preview URL contains `v2ui=1`. For non-Vite projects, add an equivalent development-only HTML transform; do not silently modify production output.
4. Run the idempotent launcher from the user's project root:

   ```bash
   node <v2ui-runtime-root>/scripts/start-v2ui.mjs --project "$PWD" --preview "<local-preview-url>" --mode <codex|chrome> --no-open
   ```

   The launcher starts or reuses the companion at `http://127.0.0.1:47831` and prints a target URL. In `codex` mode, open that URL in the built-in browser; the adapter loads the overlay automatically. In `chrome` mode, open it in Chrome; first use may route through extension onboarding. Keep the companion alive.
   The launcher prints `codex-delivery=manual` for the supported Desktop flow. Use the saved-review return-to-chat flow; do not claim the button can start a task turn.
5. In Chrome mode, ask the user to click the **V2UI** browser action. In Codex mode, confirm the overlay is already visible; do not ask for a Chrome extension. For a permission-free visual smoke test, open `http://127.0.0.1:47831/demo` instead.
6. Tell the user the overlay is open. Its single green play button starts or resumes review; while recording it becomes a pause icon. In Chrome, interim and final transcription appears in the current suggestion immediately while recording, and speech pauses remain merged until a new visual marker. In Codex mode, each pause adds a playable audio range to the current marker's suggestion; resuming appends another player unless a new Select/Pen marker starts the next item. If live speech recognition is unavailable, recording and submission must continue.
7. The user reviews the numbered suggestions and deletes any unwanted item. Deleting an item must also remove its linked Select/Pen evidence and active speech boundary. Codex mode shows **Save and return to Codex**; after saving, the user returns to the task and sends the copied prompt. Chrome shows **Save feedback** and uses the same manual return flow. Do not interact with the page while the user is reviewing.

## Apply a completed review

1. Run:

   ```bash
   node <v2ui-runtime-root>/scripts/read-latest-review.mjs --project "$PWD"
   ```

2. Read the reported `manifest.json`. Treat `suggestions` as the review list and inspect each suggestion's `scope`, `targetIds`, and `annotationIds`, plus the referenced targets, annotations, viewport, URL, and permission status. Use recording files only when the available media tools can read them.
   If `transcription.requiresPostProcessing` is true, transcribe every file listed in `files.recordings`, correlate it with recording and visual-evidence timestamps, and then present the recovered suggestions. If the current environment cannot read those audio files, report that limitation explicitly instead of guessing.
3. Summarize the numbered suggestions in the current chat, call out any ambiguous source impact, and ask whether to apply them. Stop and wait for explicit confirmation.
4. After confirmation, resolve each DOM target to source scope. Distinguish instance, loop item, shared component, token, responsive rule, and global style; do not broaden a selected instance silently.
5. Implement the confirmed suggestions as one batch. Rebuild and run the project's relevant tests, then open the same route and viewport to verify every change and check the console.
6. Report each suggestion as applied, skipped, or blocked. Keep the updated preview open so the user can start another round.

## Review package

The companion writes:

```text
.codex/v2ui-reviews/<session-id>/
├── manifest.json
├── recording-01.webm
└── recording-02.webm     # additional segments when the user resumes
```

`manifest.json` is the source of truth for numbered suggestions and DOM/annotation links. Recording media is supporting evidence.
