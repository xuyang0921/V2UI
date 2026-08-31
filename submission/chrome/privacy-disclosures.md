# Chrome Web Store privacy disclosures

- Single purpose: collect structured review evidence for user-authorized local web previews.
- Permissions: `activeTab` injects only after the user clicks the action; `scripting` loads the review overlay; host access is limited to localhost and 127.0.0.1.
- User data: screen/microphone media, speech text, DOM evidence, annotations and suggestions may be handled during an active review.
- Transfer: the extension sends review data only to the local companion on 127.0.0.1. Browser Web Speech may be processed by the browser vendor. A user-triggered Codex delivery is governed by that service.
- Sale/advertising: no sale, advertising use, credit use or unrelated personalization.
- Retention/deletion: local project storage only; delete `.codex/v2ui-reviews/` and `.codex/v2ui/`.
