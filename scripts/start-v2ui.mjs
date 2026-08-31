#!/usr/bin/env node
import { closeSync, mkdirSync, openSync, readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const valueAfter = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
};
const projectRoot = resolve(valueAfter("--project") || process.cwd());
const previewUrl = valueAfter("--preview") || "http://127.0.0.1:5173/";
const mode = valueAfter("--mode") || "chrome";
const port = Number(valueAfter("--port") || process.env.V2UI_PORT || 47831);
const extensionInstallUrl = valueAfter("--extension-install-url") || process.env.V2UI_EXTENSION_INSTALL_URL || "";
const shouldOpen = !args.includes("--no-open");
const origin = `http://127.0.0.1:${port}`;
const scriptRoot = dirname(fileURLToPath(import.meta.url));
const serverScript = join(scriptRoot, "review-server.mjs");
const runtimeRoot = join(projectRoot, ".codex", "v2ui");

function validatedPreview(value) {
  const url = new URL(value);
  if (url.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(url.hostname)) throw new Error("V2UI preview must use localhost or 127.0.0.1.");
  return url.href;
}

if (!["chrome", "codex"].includes(mode)) throw new Error("V2UI mode must be chrome or codex.");

function codexPreview(value) {
  const url = new URL(value);
  url.searchParams.set("v2ui", "1");
  return url.href;
}

async function health() {
  const response = await fetch(`${origin}/health`, { signal: AbortSignal.timeout(500) });
  if (!response.ok) throw new Error(`Companion health check failed with ${response.status}.`);
  return response.json();
}

async function waitForCompanion() {
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    try { return await health(); } catch { await new Promise((resolveWait) => setTimeout(resolveWait, 120)); }
  }
  throw new Error(`V2UI companion did not become ready. See ${join(runtimeRoot, "companion.log")}`);
}

function openBrowser(url) {
  const command = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const commandArgs = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  const child = spawn(command, commandArgs, { detached: true, stdio: "ignore" });
  child.unref();
}

const preview = validatedPreview(previewUrl);
mkdirSync(runtimeRoot, { recursive: true });
const bindingTokenPath = join(runtimeRoot, "binding-token");
let bindingToken;
try { bindingToken = readFileSync(bindingTokenPath, "utf8").trim(); } catch {
  bindingToken = randomBytes(32).toString("hex");
  writeFileSync(bindingTokenPath, `${bindingToken}\n`, { mode: 0o600 });
}
let companion;
let reused = false;
try {
  companion = await health();
  reused = true;
  if (resolve(companion.projectRoot) !== projectRoot) {
    throw new Error(`Port ${port} is already serving another project: ${companion.projectRoot}`);
  }
} catch (error) {
  if (reused || String(error.message).includes("another project")) throw error;
  const logPath = join(runtimeRoot, "companion.log");
  const log = openSync(logPath, "a");
  const child = spawn(process.execPath, [serverScript, "--project", projectRoot, "--port", String(port)], {
    detached: true,
    stdio: ["ignore", log, log],
    env: { ...process.env, V2UI_CODEX_THREAD_ID: "", V2UI_BINDING_TOKEN: bindingToken, V2UI_EXTENSION_INSTALL_URL: extensionInstallUrl },
  });
  child.unref(); closeSync(log);
  companion = await waitForCompanion();
}

const bindingResponse = await fetch(`${origin}/binding`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-v2ui-binding-token": bindingToken },
  body: JSON.stringify({ threadId: process.env.CODEX_THREAD_ID || null }),
});
if (!bindingResponse.ok) throw new Error(`V2UI could not bind the companion to the current Codex task (${bindingResponse.status}).`);
const binding = await bindingResponse.json();
companion = await health();

const onboardingResponse = await fetch(`${origin}/onboarding`);
const onboarding = await onboardingResponse.json();
const setupUrl = `${origin}/setup?preview=${encodeURIComponent(preview)}&mode=chrome`;
const targetUrl = mode === "codex" ? codexPreview(preview) : onboarding.completed ? preview : setupUrl;
if (shouldOpen && mode === "chrome") openBrowser(targetUrl);
console.log(`V2UI_START_READY ${targetUrl}`);
console.log(`mode=${mode} companion=${reused ? "reused" : "started"} project=${projectRoot} onboarding=${mode === "codex" || onboarding.completed ? "complete" : "required"}`);
console.log(`codex-delivery=${companion.codexDelivery?.configured ? "automatic" : "manual"}`);
if (!companion.codexDelivery?.configured && binding.codexDelivery?.reason) console.log(`codex-delivery-reason=${String(binding.codexDelivery.reason).replace(/\s+/g, " ").slice(0, 500)}`);
if (shouldOpen && mode === "codex") console.log("Open the printed URL in the Codex built-in browser.");
