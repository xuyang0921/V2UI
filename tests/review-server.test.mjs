import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function availablePort() {
  const server = createServer();
  await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
  const { port } = server.address();
  await new Promise((resolveClose) => server.close(resolveClose));
  return port;
}

async function waitForHealth(origin) {
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${origin}/health`);
      if (response.ok) return response.json();
    } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 80));
  }
  throw new Error("review-server health check timed out");
}

test("review companion serves demo and saves a local structured package", async (context) => {
  const project = await mkdtemp(join(tmpdir(), "v2ui-smoke-"));
  const port = await availablePort();
  const origin = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [join(root, "scripts/review-server.mjs"), "--project", project, "--port", String(port)], { stdio: "ignore", env: { ...process.env, V2UI_BINDING_TOKEN: "test-binding-token", V2UI_EXTENSION_INSTALL_URL: "https://chromewebstore.google.com/detail/v2ui/example" } });
  context.after(async () => {
    child.kill("SIGTERM");
    await new Promise((resolveExit) => child.once("exit", resolveExit));
    await rm(project, { recursive: true, force: true });
  });

  const health = await waitForHealth(origin);
  assert.equal(health.ok, true);
  assert.equal(health.projectRoot, project);
  assert.match(await (await fetch(`${origin}/demo-review`)).text(), /__V2UI_DEMO_REVIEW__/);
  const setup = await (await fetch(`${origin}/setup`)).text();
  assert.match(setup, /从 Chrome Web Store 安装/);
  assert.equal(setup.includes("chrome://extensions"), false);
  const bindingResponse = await fetch(`${origin}/binding`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-v2ui-binding-token": "test-binding-token" },
    body: JSON.stringify({ threadId: "desktop-thread-1" }),
  });
  const binding = await bindingResponse.json();
  assert.equal(binding.codexDelivery.configured, false);
  assert.match(binding.codexDelivery.reason, /active writer/);

  const payload = {
    sessionId: "v2ui-smoke-0001",
    product: "V2UI",
    surface: "codex",
    suggestions: [{ id: "suggestion-1", text: "缩小标题", scope: "page", targetIds: [], annotationIds: [] }],
    annotations: [],
    targets: [],
    recordings: [],
    transcription: { requiresPostProcessing: false },
  };
  const response = await fetch(`${origin}/session`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  assert.equal(response.status, 201);
  const saved = await response.json();
  assert.equal(saved.codex.delivered, false);
  const manifest = JSON.parse(await readFile(join(project, ".codex/v2ui-reviews/v2ui-smoke-0001/manifest.json"), "utf8"));
  assert.equal(manifest.schemaVersion, 3);
  assert.equal(manifest.suggestions[0].text, "缩小标题");
});

test("review companion invokes the Codex bridge with supported read-only arguments", async (context) => {
  const project = await mkdtemp(join(tmpdir(), "v2ui-codex-bridge-"));
  const port = await availablePort();
  const origin = `http://127.0.0.1:${port}`;
  const fakeCodex = join(project, "fake-codex.mjs");
  const capturePath = join(project, "captured-args.json");
  await writeFile(fakeCodex, `#!/usr/bin/env node\nimport { writeFileSync } from "node:fs";\nwriteFileSync(process.env.V2UI_TEST_CAPTURE, JSON.stringify(process.argv.slice(2)));\n`);
  await chmod(fakeCodex, 0o755);
  const child = spawn(process.execPath, [join(root, "scripts/review-server.mjs"), "--project", project, "--port", String(port)], {
    stdio: "ignore",
    env: {
      ...process.env,
      V2UI_BINDING_TOKEN: "test-binding-token",
      V2UI_ENABLE_CODEX_RESUME: "1",
      V2UI_CODEX_COMMAND: fakeCodex,
      V2UI_TEST_CAPTURE: capturePath,
    },
  });
  context.after(async () => {
    child.kill("SIGTERM");
    await new Promise((resolveExit) => child.once("exit", resolveExit));
    await rm(project, { recursive: true, force: true });
  });

  await waitForHealth(origin);
  const bindingResponse = await fetch(`${origin}/binding`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-v2ui-binding-token": "test-binding-token" },
    body: JSON.stringify({ threadId: "thread-1" }),
  });
  assert.equal(bindingResponse.status, 200);
  assert.equal((await bindingResponse.json()).codexDelivery.configured, true);
  const response = await fetch(`${origin}/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      sessionId: "v2ui-bridge-0001",
      product: "V2UI",
      surface: "codex",
      suggestions: [{ id: "suggestion-1", text: "缩小标题", scope: "page", targetIds: [], annotationIds: [] }],
      annotations: [],
      targets: [],
      recordings: [],
      transcription: { requiresPostProcessing: false },
    }),
  });
  assert.equal(response.status, 201);
  const saved = await response.json();
  assert.equal(saved.codex.delivered, true);
  const args = JSON.parse(await readFile(capturePath, "utf8"));
  assert.deepEqual(args.slice(0, -1), [
    "exec",
    "-C", project,
    "-s", "read-only",
    "--skip-git-repo-check",
    "resume",
    "thread-1",
  ]);
  assert.equal(args.includes("-a"), false);
});
