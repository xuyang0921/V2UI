---
layout: default
permalink: /privacy/
---
# V2UI Privacy Policy

Effective date: September 3, 2026

V2UI reviews local website previews that the user owns or is authorized to modify. The current architecture does not operate a V2UI cloud service that receives review data.

## Data requested and stored

V2UI requests screen and microphone access only after the user starts a review. Recordings, DOM targets, pen paths, suggestions, and the structured manifest are stored under the reviewed project's `.codex/v2ui-reviews/` directory. Onboarding state and local companion logs are stored under `.codex/v2ui/` in that project.

## Data processing boundaries

The V2UI companion does not upload screen or microphone recordings to the V2UI publisher. Live speech recognition provided by the browser may process audio under the browser vendor's policy. If live recognition fails, V2UI continues recording locally and allows the review to be saved.

When a user chooses to hand a review to Codex, the structured suggestions and references to local evidence are processed under the applicable service provider's terms and privacy policy.

## Chrome permissions

The Chrome extension uses Manifest V3 and requests only `activeTab` and `scripting`. Host access is limited to `http://localhost/*` and `http://127.0.0.1/*`. These permissions load the review interface into the local preview page the user explicitly activates.

## Retention and deletion

V2UI does not set a cloud retention period because it does not operate review-data storage. Delete `.codex/v2ui-reviews/` and `.codex/v2ui/` from the reviewed project to remove local review data and runtime state. You may also remove the Chrome extension or Codex plugin at any time.

Deleting a suggestion in the overlay removes its text or linked audio reference and its associated Select/Pen evidence from the review being prepared.

## Contact

For privacy questions, use the repository's [support process](../support/). Do not include recordings, manifests, private source, credentials, or other sensitive data in a public issue.
