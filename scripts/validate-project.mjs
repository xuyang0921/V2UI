#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readText = (path) => readFile(join(projectRoot, path), "utf8");
const readJson = async (path) => JSON.parse(await readText(path));
const fail = (message) => { throw new Error(message); };
const requiredVersion = "0.4.0";
const [packageJson, plugin, manifest, marketplace, skill, skillUi, extensionOverlay, companionOverlay, packager, releasePackager] = await Promise.all([
  readJson("package.json"), readJson(".codex-plugin/plugin.json"), readJson("browser-extension/manifest.json"),
  readJson(".agents/plugins/marketplace.json"), readText("skills/v2ui/SKILL.md"), readText("skills/v2ui/agents/openai.yaml"),
  readText("browser-extension/overlay.js"), readText("scripts/overlay.js"), readText("scripts/package-chrome-extension.mjs"), readText("scripts/package-release.mjs"),
]);

if (packageJson.version !== requiredVersion || plugin.version !== packageJson.version || manifest.version !== packageJson.version) fail(`Package, Codex plugin, and Chrome versions must all be ${requiredVersion}.`);
if (manifest.manifest_version !== 3) fail("Chrome extension must use Manifest V3.");
if (JSON.stringify(manifest.permissions) !== JSON.stringify(["activeTab", "scripting"])) fail("Chrome permissions exceed the approved boundary.");
if (JSON.stringify(manifest.host_permissions) !== JSON.stringify(["http://127.0.0.1/*", "http://localhost/*"])) fail("Chrome host permissions exceed local previews.");
if (!skill.startsWith("---\nname: v2ui\ndescription:")) fail("V2UI Skill frontmatter is missing or malformed.");
if (!skill.includes("Sending suggestions does not authorize code changes") || !skill.includes("runtime DOM selection is evidence")) fail("V2UI Skill is missing the approval or source-scope boundary.");
if (!skill.includes("<v2ui-runtime-root>")) fail("Skill must resolve both full-plugin and skills-only runtime layouts.");
if (!skillUi.includes('default_prompt: "Use $v2ui')) fail("Skill UI default prompt must explicitly invoke $v2ui.");
if (extensionOverlay !== companionOverlay) fail("Chrome and Codex surfaces must use the same overlay source.");
if (marketplace.plugins?.[0]?.source?.ref !== `v${requiredVersion}`) fail("Marketplace ref must match the release tag.");
if (marketplace.plugins?.[0]?.source?.url !== "https://github.com/xuyang0921/V2UI.git") fail("Marketplace source must target the canonical repository.");
for (const url of [plugin.homepage, plugin.repository, plugin.interface?.websiteURL, plugin.interface?.privacyPolicyURL, plugin.interface?.termsOfServiceURL]) {
  if (typeof url !== "string" || !url.startsWith("https://")) fail("Plugin public URLs must be HTTPS.");
}
for (const file of ["LICENSE", "docs/index.md", "docs/privacy.md", "docs/terms.md", "docs/support.md", "SECURITY.md", "RELEASING.md", "submission/openai/test-cases.md", "submission/chrome/privacy-disclosures.md"]) await readText(file);
if (plugin.license !== "MIT") fail("Public release must declare the confirmed MIT license.");
for (const expected of ["Browse", "Select", "Pen", "Undo", "Clear", "Exit review", "v2-status-dot", "SpeechRecognition", "MediaRecorder", "recordingSegments", "resetRound"]) {
  if (!extensionOverlay.includes(expected)) fail(`Overlay invariant missing: ${expected}`);
}
if (!extensionOverlay.includes('<span class="v2-brand" aria-label="V2UI">V2UI</span>')) fail("Toolbar must use the standalone italic V2UI wordmark.");
if (!packager.includes('const runtimeAllowlist = ["manifest.json", "background.js", "overlay.js", "assets"]')) fail("Chrome package must use an explicit runtime allowlist.");
if (!packager.includes('zip(["-r", "-X", storeZip, "."], storeRoot)')) fail("Web Store ZIP must place manifest.json at archive root.");
if (!releasePackager.includes("V2UI-Skill-Submission")) fail("Release build must produce a skills-only submission archive.");

const codeFiles = [];
async function collect(relativeRoot) {
  for (const entry of await readdir(join(projectRoot, relativeRoot), { withFileTypes: true })) {
    const relativePath = join(relativeRoot, entry.name);
    if (entry.isDirectory()) await collect(relativePath);
    else if ([".js", ".mjs"].includes(extname(entry.name))) codeFiles.push(relativePath);
  }
}
for (const root of ["adapters", "browser-extension", "scripts", "tests"]) await collect(root);
for (const file of codeFiles) {
  const result = spawnSync(process.execPath, ["--check", join(projectRoot, file)], { encoding: "utf8" });
  if (result.status !== 0) fail(`Node syntax validation failed for ${file}: ${result.stderr || result.stdout}`);
}
console.log(`V2UI_PROJECT_VALID version=${packageJson.version} syntaxFiles=${codeFiles.length} skill=v2ui manifest=MV3 marketplace=v2ui-beta`);
