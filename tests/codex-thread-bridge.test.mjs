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
  assert.match(invocation.args.at(-1), /没有可用的实时转写文本/);
  assert.match(invocation.args.at(-1), /recording-01\.webm/);
  assert.match(invocation.args.at(-1), /不要根据标注猜测/);
});

test("empty reviews are still rejected", () => {
  assert.throws(
    () => createCodexResumeInvocation({ projectRoot: "/tmp/project", threadId: "thread-1", manifest: {}, manifestPath }),
    /no suggestions, recordings, or visual evidence/,
  );
});

test("live transcripts keep the normal suggestion handoff", () => {
  const message = buildCodexReviewMessage({ suggestions: [{ text: "把标题缩小", scope: "page" }], files: { recordings: [] } }, manifestPath);
  assert.match(message, /1\. 把标题缩小/);
  assert.doesNotMatch(message, /实时语音转录未完成/);
});
