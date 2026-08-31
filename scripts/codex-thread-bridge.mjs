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
  const text = String(item?.text || "").trim() || "（无文字内容）";
  const scope = item?.scope === "page" ? "整页" : item?.targetIds?.length ? "已关联页面元素" : "未指定范围";
  return `${index + 1}. ${text}\n   范围：${scope}`;
}

export function buildCodexReviewMessage(manifest, manifestPath) {
  const suggestions = Array.isArray(manifest?.suggestions) ? manifest.suggestions : [];
  const list = suggestions.length ? suggestions.map(formatSuggestion).join("\n") : "（本轮没有可用的实时转写文本）";
  const recordingPaths = (manifest?.files?.recordings || []).map((filename) => join(dirname(manifestPath), filename));
  const needsTranscription = Boolean(manifest?.transcription?.requiresPostProcessing && recordingPaths.length);
  const transcriptionInstructions = needsTranscription ? [
    "",
    "内置浏览器的实时语音转录未完成，但录音已经保存。请先使用当前可用的音频/媒体工具转写以下录音，再按录音时间与 manifest 中的标注、圈选和滚动时间对齐：",
    ...recordingPaths.map((path) => `- ${path}`),
    "如果当前环境确实无法读取录音，请明确说明缺失的转写能力，不要根据标注猜测用户说了什么。",
  ] : [];
  const message = [
    "我通过 V2UI 提交了这一轮调整建议：",
    "",
    list,
    ...transcriptionInstructions,
    "",
    `结构化评审文件：${manifestPath}`,
    "",
    "请读取该评审文件，概括上述建议，并说明每项可能影响的源码范围（实例、列表项、共享组件、设计 token、响应式规则或全局样式）。先让我确认是否执行；在我明确确认前不要修改代码。",
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
