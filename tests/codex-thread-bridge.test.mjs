import test from "node:test";
import assert from "node:assert/strict";
import { buildCodexReviewMessage, createCodexResumeInvocation } from "../scripts/codex-thread-bridge.mjs";

const manifestPath = "/tmp/project/.codex/v2ui-reviews/session-1/manifest.json";

test("recording-only reviews can be delivered for Codex transcription", () => {
  const manifest = {
    sessionId: "session-1",
    suggestions: [],
    annotations: [{ id: "annotation-1" }],
    files: { recordings: ["recording-01.webm"] },
    transcription: { requiresPostProcessing: true },
  };
  const invocation = createCodexResumeInvocation({ projectRoot: "/tmp/project", threadId: "thread-1", manifest, manifestPath });
  assert.equal(invocation.command, "codex");
  assert.deepEqual(invocation.args.slice(0, -1), [
    "exec",
    "-C", "/tmp/project",
    "-s", "read-only",
    "--skip-git-repo-check",
    "resume",
    "thread-1",
  ]);
  assert.equal(invocation.args.includes("-a"), false);
  assert.match(invocation.args.at(-1), /No live transcript is available/);
  assert.match(invocation.args.at(-1), /recording-01\.webm/);
  assert.match(invocation.args.at(-1), /Do not infer the user's words/);
});

test("empty reviews are still rejected", () => {
  assert.throws(
    () => createCodexResumeInvocation({ projectRoot: "/tmp/project", threadId: "thread-1", manifest: {}, manifestPath }),
    /no suggestions, recordings, or visual evidence/,
  );
});

test("live transcripts keep the normal suggestion handoff", () => {
  const message = buildCodexReviewMessage({ suggestions: [{ text: "Reduce the heading size", scope: "page" }], files: { recordings: [] } }, manifestPath);
  assert.match(message, /1\. Reduce the heading size/);
  assert.doesNotMatch(message, /Live transcription was not completed/);
});
