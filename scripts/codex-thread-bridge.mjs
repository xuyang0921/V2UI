import { spawn, spawnSync } from "node:child_process";
import { closeSync, mkdirSync, openSync } from "node:fs";
import { dirname, join } from "node:path";

const MAX_MESSAGE_CHARS = 24000;
const CAPABILITY_PROBE_THREAD_ID = "00000000-0000-0000-0000-000000000000";

function bridgeError(message, details = "") {
  const suffix = details.trim() ? ` ${details.trim()}` : "";
  return new Error(`${message}${suffix}`);
}

function formatSuggestion(item, index) {
  const text = String(item?.text || "").trim() || "(No transcript available)";
  const scope = item?.scope === "page" ? "Entire page" : item?.targetIds?.length ? "Linked page element" : "Unspecified";
  return `${index + 1}. ${text}\n   Scope: ${scope}`;
}

export function buildCodexReviewMessage(manifest, manifestPath) {
  const suggestions = Array.isArray(manifest?.suggestions) ? manifest.suggestions : [];
  const list = suggestions.length ? suggestions.map(formatSuggestion).join("\n") : "(No live transcript is available for this review.)";
  const recordingPaths = (manifest?.files?.recordings || []).map((filename) => join(dirname(manifestPath), filename));
  const needsTranscription = Boolean(manifest?.transcription?.requiresPostProcessing && recordingPaths.length);
  const transcriptionInstructions = needsTranscription ? [
    "",
    "Live transcription was not completed in the built-in browser, but the recordings were saved. Use the available audio or media tools to transcribe these files, then align the transcript with annotation, selection, and scroll timestamps in the manifest:",
    ...recordingPaths.map((path) => `- ${path}`),
    "If this environment cannot read the recordings, state that limitation explicitly. Do not infer the user's words from visual annotations.",
  ] : [];
  const message = [
    "I submitted this V2UI review:",
    "",
    list,
    ...transcriptionInstructions,
    "",
    `Structured review manifest: ${manifestPath}`,
    "",
    "Read the review manifest, summarize the suggestions above, and explain the possible source impact of each item: instance, list item, shared component, design token, responsive rule, or global style. Wait for my explicit confirmation before implementation. Do not modify code until I approve the scope.",
  ].join("\n");
  return message.slice(0, MAX_MESSAGE_CHARS);
}

export function createCodexResumeInvocation({ command = "codex", projectRoot, threadId, manifest, manifestPath }) {
  if (!threadId) throw bridgeError("V2UI is not bound to a Codex task, so this review cannot be delivered automatically.");
  const hasEvidence = Boolean(manifest?.suggestions?.length || manifest?.annotations?.length || manifest?.targets?.length || manifest?.files?.recordings?.length);
  if (!hasEvidence) throw bridgeError("The review has no suggestions, recordings, or visual evidence to deliver.");
  return {
    command,
    args: [
      "exec",
      "-C", projectRoot,
      "-s", "read-only",
      "--skip-git-repo-check",
      "resume",
      threadId,
      buildCodexReviewMessage(manifest, manifestPath),
    ],
  };
}

export async function probeCodexThread(threadId, { command = process.env.V2UI_CODEX_COMMAND || "codex", projectRoot = process.cwd() } = {}) {
  if (!threadId) return { available: false, reason: "missing-thread-id" };
  const result = spawnSync(command, [
    "exec",
    "--ephemeral",
    "-C", projectRoot,
    "-s", "read-only",
    "--skip-git-repo-check",
    "resume",
    CAPABILITY_PROBE_THREAD_ID,
    "V2UI delivery capability probe",
  ], { encoding: "utf8", timeout: 6000 });
  if (result.error) return { available: false, reason: result.error.message };
  const output = `${result.stdout || ""}\n${result.stderr || ""}`.trim();
  if (result.status !== 0 && !/no rollout found for thread id/i.test(output)) return { available: false, reason: output || "Codex resume command unavailable" };
  return { available: true, reason: null };
}

export async function sendReviewToCodex({ projectRoot, threadId, manifest, manifestPath }, { command = process.env.V2UI_CODEX_COMMAND || "codex" } = {}) {
  const invocation = createCodexResumeInvocation({ command, projectRoot, threadId, manifest, manifestPath });
  const runtimeRoot = join(projectRoot, ".codex", "v2ui");
  mkdirSync(runtimeRoot, { recursive: true });
  const log = openSync(join(runtimeRoot, "codex-delivery.log"), "a");
  try {
    const child = spawn(invocation.command, invocation.args, {
      cwd: projectRoot,
      stdio: ["ignore", log, log],
      env: { ...process.env, V2UI_DELIVERY_SESSION_ID: String(manifest.sessionId || "") },
    });
    const code = await new Promise((resolve, reject) => {
      child.once("close", resolve);
      child.once("error", reject);
    });
    if (code !== 0) throw bridgeError(`Codex delivery turn exited with code ${code}.`, `See ${join(runtimeRoot, "codex-delivery.log")}`);
    return { delivered: true, targetThreadId: threadId, status: "completed" };
  } catch (error) {
    throw bridgeError("Codex could not start the V2UI delivery turn.", error instanceof Error ? error.message : String(error));
  } finally {
    closeSync(log);
  }
}
