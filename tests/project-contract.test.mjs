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
  assert.match(overlay, /Audio \$\{audioIndex \+ 1\}/);
});

test("deleting an adjustment discards its visual and live speech boundary", async () => {
  const overlay = await readText("browser-extension/overlay.js");
  assert.match(overlay, /function resetActiveSuggestionBoundary\(\)/);
  assert.match(overlay, /previousRecognition\.onresult = null/);
  assert.match(overlay, /previousRecognition\.abort\(\)/);
  assert.match(overlay, /state\.audioBoundaryMs = recordingElapsed\(\)/);
  assert.match(overlay, /state\.targets = state\.targets\.filter\(\(item\) => !deletedTargetIds\.has\(item\.id\)\)/);
  assert.match(overlay, /state\.annotations = state\.annotations\.filter\(\(item\) => !deletedAnnotationIds\.has\(item\.id\)\)/);
  assert.match(overlay, /state\.pendingTargetIds = state\.pendingTargetIds\.filter/);
  assert.match(overlay, /if \(wasActiveSuggestion\) resetActiveSuggestionBoundary\(\)/);
});

test("Codex handoff is read-only and requires confirmation", async () => {
  const bridge = await readText("scripts/codex-thread-bridge.mjs");
  assert.match(bridge, /"-s", "read-only"/);
  assert.match(bridge, /Do not modify code until I approve the scope/);
});

test("shipped product and English documentation remain English-only", async () => {
  const files = [
    "README.md", "PRODUCT.md", "AGENTS.md", "RELEASING.md", "SECURITY.md", "CONTRIBUTING.md", "SUPPORT.md", "CODE_OF_CONDUCT.md",
    "browser-extension/README.md", "browser-extension/manifest.json", "browser-extension/overlay.js", "scripts/overlay.js", "scripts/review-server.mjs",
    "scripts/codex-thread-bridge.mjs", "scripts/package-chrome-extension.mjs", "skills/v2ui/SKILL.md", "docs/index.md", "docs/privacy.md", "docs/support.md", "docs/terms.md",
    "submission/chrome/listing.md", "submission/chrome/privacy-disclosures.md", "submission/chrome/test-instructions.md", "submission/openai/listing.md", "submission/openai/test-cases.md",
  ];
  for (const file of files) {
    const content = (await readText(file)).replaceAll("中文", "");
    assert.doesNotMatch(content, /[\u3400-\u9fff]/u, `${file} contains non-English product copy outside the language switch`);
  }
});

test("public repository documentation provides an English and Chinese switch", async () => {
  const pairs = [
    ["README.md", "README.zh-CN.md"],
    ["PRODUCT.md", "PRODUCT.zh-CN.md"],
    ["CHANGELOG.md", "CHANGELOG.zh-CN.md"],
    ["CONTRIBUTING.md", "CONTRIBUTING.zh-CN.md"],
    ["CODE_OF_CONDUCT.md", "CODE_OF_CONDUCT.zh-CN.md"],
    ["SECURITY.md", "SECURITY.zh-CN.md"],
    ["SUPPORT.md", "SUPPORT.zh-CN.md"],
    ["RELEASING.md", "RELEASING.zh-CN.md"],
    ["browser-extension/README.md", "browser-extension/README.zh-CN.md"],
    ["docs/index.md", "docs/zh-CN/index.md"],
    ["docs/privacy.md", "docs/zh-CN/privacy.md"],
    ["docs/support.md", "docs/zh-CN/support.md"],
    ["docs/terms.md", "docs/zh-CN/terms.md"],
  ];
  for (const [englishFile, chineseFile] of pairs) {
    const [english, chinese] = await Promise.all([readText(englishFile), readText(chineseFile)]);
    assert.match(english, /English<\/strong>.*中文/s, `${englishFile} is missing the language switch`);
    assert.match(chinese, /English.*中文<\/strong>/s, `${chineseFile} is missing the language switch`);
    assert.match(chinese, /[\u3400-\u9fff]/u, `${chineseFile} does not contain Chinese documentation`);
  }
});
