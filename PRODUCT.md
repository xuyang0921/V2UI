# V2UI product baseline

## Positioning

V2UI is a **preview review layer** for websites built with Codex. It preserves where the user was, what was visible, what they selected or drew, what they said, and when each event happened. Codex uses that evidence to resolve source scope, explain possible impact, wait for approval, implement the confirmed change, and verify the result.

V2UI is not a general-purpose web editor. It does not treat the runtime DOM as source code and does not modify code when feedback is saved.

## Core loop

1. Start the website's local preview and the V2UI companion.
2. Open the same review layer in the Codex built-in browser or Chrome.
3. The user starts a review and explicitly grants screen or microphone access.
4. Browse the real page; use Select or Pen to identify visual evidence while speaking.
5. Pause without losing evidence; resume to append another recording segment.
6. Save the review package into the project being reviewed.
7. Return to the current Codex task. Codex summarizes the suggestions and identifies possible instance, list-item, shared-component, design-token, responsive-rule, or global-style impact.
8. Modify, build, and verify code only after the user explicitly confirms the scope.
9. Start a clean review round after delivery and repeat until the result is accepted.

## Two surfaces, one product

- **Codex built-in browser:** a development-only adapter injects the shared overlay when the URL contains `?v2ui=1`.
- **External Chrome:** a Manifest V3 extension injects the same overlay into an authorized local preview.

Both surfaces share the companion, interaction model, review schema, storage location, and confirmation rule. They must not become separate products.

## Evidence and suggestion model

- `manifest.json` is the structured source of truth for DOM targets, pen annotations, voice suggestions, timestamps, viewport, URL, scroll position, and permission state.
- Screen recording is supporting evidence. A DOM selection proves only which runtime instance the user indicated.
- One suggestion represents one voice-derived change request; it does not equal the number of DOM targets.
- A new visual marker closes the previous suggestion boundary. Brief speech pauses continue in the current suggestion.
- Chrome renders interim and final Web Speech results immediately while recording. Pauses do not create a new suggestion; a new Select/Pen marker does.
- The Codex built-in browser does not depend on live transcription. Each pause adds a playable audio range to the current suggestion, and later pauses remain grouped under the same marker until a new visual marker is created.
- Undo removes one visual action and any suggestion linked only to it. Clear removes the current round.
- Clicking a suggestion's `×` is a complete discard: remove its text or linked audio, all associated Select/Pen evidence, and the active speech/audio boundary. New speech creates a new suggestion; late recognition results must not restore deleted content or regions.
- Hovering a suggestion highlights its associated component, drawing, or page scope.

## State and graceful degradation

A review has three explicit states: recording, ended-and-editable, and sent-for-confirmation. Stopping a recording and saving feedback are separate actions.

Live Web Speech is best effort. Local audio recording is the independent evidence path. If the speech service is unavailable, the network fails, or an embedded browser does not support live recognition, V2UI must:

- continue recording;
- preserve DOM and pen evidence;
- allow an audio-only review to be saved;
- set `transcription.requiresPostProcessing` in the manifest; and
- instruct the bound Codex task to transcribe the referenced recordings and align them with the visual timeline instead of guessing from annotations.

Chrome and Codex share the overlay and schema but adapt presentation to surface capabilities: Chrome prioritizes live text; Codex prioritizes playable local audio after a pause. A Codex transcription limitation must never delay Chrome's live suggestions.

Screen, microphone, recording, and speech-recognition permissions are recorded separately. Missing one permission must not discard the remaining evidence.

Codex Desktop holds an exclusive writer for the open task. External `codex exec resume` calls can fail with `already has an active writer`, so the default product flow must not promise automatic callbacks. The companion saves first and provides a reliable return-to-Codex prompt. Experimental delivery must be explicitly enabled, remain read-only, and never present a successfully saved review as failed.

## Authorization and impact scope

A DOM selection is evidence, not authorization to change a shared component, global token, responsive rule, every loop instance, or cross-page styling. Codex must explain potential source impact before writing.

**Save feedback**, **Send suggestions**, or **Save and return to Codex** authorizes only local review storage and handoff. No code may be changed until the user explicitly confirms the summarized scope.

## Visual and interaction baseline

- Use a low-saturation warm orange/yellow palette and an alert-but-not-harsh red pen.
- The toolbar and suggestion panel are opaque white surfaces without blur or transparency.
- The toolbar shows an italic warm-orange `V2UI` wordmark, not the graphic logo.
- Chrome extension and Codex plugin cards keep the warm-orange graphic mark.
- Tools remain Browse, Select, Pen, Undo, Clear, and Exit review. Browse and annotation modes remain strictly separate.
- One green player control shows play when ready and pause while recording, with accumulated time beside it.
- The suggestion-panel header shows only a status dot: green while recording, red while paused or idle. The header drags the panel.
- The suggestion panel appears after the first suggestion. An audio-only fallback may reveal the save action after recording ends.
- First-use guidance and feedback use a centered, rounded dark-brown toast. Initial guidance uses two visually balanced lines.
- A successful save clears annotations, suggestions, recording segments, and elapsed time before the next round.

## Security and storage

- Chrome uses Manifest V3 with only `activeTab` and `scripting`.
- Host permissions are limited to `http://localhost/*` and `http://127.0.0.1/*`.
- Screen and microphone access is requested only after the user starts a review.
- An unpacked extension must be loaded visibly by the user in Chrome; V2UI never claims silent installation.
- Each reviewed project owns its one-time onboarding state. The launcher can safely start or reuse the companion.
- Review packages are stored only under `<reviewed-project>/.codex/v2ui-reviews`.
- Runtime state and logs are stored only under `<reviewed-project>/.codex/v2ui`.
- Source and release archives must exclude review data, onboarding state, recordings, logs, installation caches, and unrelated product source.

## Release baseline

Version 0.4.1 preserves the verified 0.3.1 dual-surface review foundation and the 0.4.0 distribution baseline. It includes project onboarding, `start-v2ui`, the review-server companion, the Vite adapter, read-only handoff, screen/microphone/DOM/pen evidence, resilient audio, live Chrome transcription, playable Codex audio, clean suggestion deletion, structured manifests, clean-round reset, English product UI, and English publication materials.
