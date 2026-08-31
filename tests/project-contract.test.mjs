import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readText = (path) => readFile(join(root, path), "utf8");

test("Chrome permissions remain local and minimal", async () => {
  const manifest = JSON.parse(await readText("browser-extension/manifest.json"));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ["activeTab", "scripting"]);
  assert.deepEqual(manifest.host_permissions, ["http://127.0.0.1/*", "http://localhost/*"]);
});

test("both review surfaces share one overlay", async () => {
  assert.equal(await readText("browser-extension/overlay.js"), await readText("scripts/overlay.js"));
});

test("Codex overlays use the local companion origin that served the script", async () => {
  const overlay = await readText("scripts/overlay.js");
  assert.match(overlay, /new URL\(loaderScript\?\.src \|\| ""\)/);
  assert.match(overlay, /\["127\.0\.0\.1", "localhost"\]\.includes\(scriptUrl\.hostname\)/);
  assert.match(overlay, /return scriptUrl\.origin/);
  assert.match(overlay, /return "http:\/\/127\.0\.0\.1:47831"/);
});

test("final visual and round boundaries are encoded", async () => {
  const overlay = await readText("browser-extension/overlay.js");
  for (const label of ["Browse", "Select", "Pen", "Undo", "Clear", "Exit review"]) assert.match(overlay, new RegExp(`>${label}<`));
  assert.match(overlay, /v2-status-dot/);
  assert.match(overlay, /background:#fff/);
  assert.match(overlay, /PEN_COLOR = "#df5b4f"/);
  assert.match(overlay, /resetRound\(\)/);
  assert.match(overlay, /recordingSegments/);
});

test("Chrome streams interim speech into one suggestion until the next visual marker", async () => {
  const overlay = await readText("browser-extension/overlay.js");
  assert.match(overlay, /recognition\.interimResults = true/);
  assert.match(overlay, /ingestSpeechResult\(interim\.join\(" "\), false\)/);
  assert.match(overlay, /function beginVisual\(\)/);
  assert.match(overlay, /state\.activeSpeechSuggestionId = null/);
  assert.doesNotMatch(overlay, /setTimeout\(flushSpeech, 1500\)/);
});

test("Codex groups playable pause recordings by visual marker", async () => {
  const overlay = await readText("browser-extension/overlay.js");
  assert.match(overlay, /SURFACE === "codex"/);
  assert.match(overlay, /unsupported:codex-surface/);
  assert.match(overlay, /function closeAudioRange\(endMs, force = false\)/);
  assert.match(overlay, /suggestion\.audioRanges/);
  assert.match(overlay, /document\.createElement\("audio"\)/);
  assert.match(overlay, /语音 \$\{audioIndex \+ 1\}/);
});

test("Codex handoff is read-only and requires confirmation", async () => {
  const bridge = await readText("scripts/codex-thread-bridge.mjs");
  assert.match(bridge, /"-s", "read-only"/);
  assert.match(bridge, /明确确认前不要修改代码/);
});
