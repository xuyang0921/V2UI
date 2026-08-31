# Chrome reviewer instructions

1. Start the bundled companion with a temporary project: `node scripts/review-server.mjs --project <temp-directory> --port 47831`.
2. Open `http://127.0.0.1:47831/demo`.
3. Click the V2UI extension icon; verify the white toolbar appears.
4. Browse without interception, then choose Select or Pen and add evidence.
5. Click the green play control. Chrome should request capture/microphone only now. Denying either permission must not crash the overlay.
6. Pause and send. Verify a structured package is saved under `<temp-directory>/.codex/v2ui-reviews/`.

No account or remote server is required. The extension intentionally does not run on non-localhost pages.
