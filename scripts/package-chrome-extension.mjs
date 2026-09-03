#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(scriptRoot, "..");
const extensionRoot = join(pluginRoot, "browser-extension");
const releasesRoot = join(pluginRoot, "releases");
const manifest = JSON.parse(await readFile(join(extensionRoot, "manifest.json"), "utf8"));

if (manifest.manifest_version !== 3) throw new Error("Chrome package must use Manifest V3.");
if (JSON.stringify(manifest.permissions) !== JSON.stringify(["activeTab", "scripting"])) throw new Error("Unexpected Chrome permissions.");
if (JSON.stringify(manifest.host_permissions) !== JSON.stringify(["http://127.0.0.1/*", "http://localhost/*"])) throw new Error("Unexpected Chrome host permissions.");
if (!/^\d+\.\d+\.\d+(?:\.\d+)?$/.test(manifest.version)) throw new Error("Invalid Chrome extension version.");

const manualName = `V2UI-Chrome-${manifest.version}`;
const manualRoot = join(releasesRoot, manualName);
const manualZip = join(releasesRoot, `${manualName}.zip`);
const storeName = `V2UI-Chrome-Web-Store-${manifest.version}`;
const storeRoot = join(releasesRoot, storeName);
const storeZip = join(releasesRoot, `${storeName}.zip`);
const runtimeAllowlist = ["manifest.json", "background.js", "overlay.js", "assets"];

await mkdir(releasesRoot, { recursive: true });
for (const target of [manualRoot, manualZip, storeRoot, storeZip]) await rm(target, { recursive: true, force: true });
await mkdir(manualRoot, { recursive: true });
await mkdir(storeRoot, { recursive: true });
for (const name of runtimeAllowlist) {
  await cp(join(extensionRoot, name), join(manualRoot, name), { recursive: true });
  await cp(join(extensionRoot, name), join(storeRoot, name), { recursive: true });
}
await cp(join(extensionRoot, "README.md"), join(manualRoot, "README.md"));
await writeFile(join(manualRoot, "INSTALL.md"), `# Install the V2UI Chrome extension\n\n1. Unzip ${manualName}.zip.\n2. Open \`chrome://extensions\` in Chrome.\n3. Enable Developer mode.\n4. Click Load unpacked and select the extracted \`${manualName}\` directory.\n5. Start the V2UI companion from Codex, open a localhost or 127.0.0.1 preview, and click the V2UI icon.\n\nVersion: ${manifest.version}\n`, "utf8");

function zip(args, cwd) {
  const result = spawnSync("/usr/bin/zip", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || "Failed to create archive.");
}
zip(["-r", "-X", manualZip, manualName], releasesRoot);
zip(["-r", "-X", storeZip, "."], storeRoot);
console.log(JSON.stringify({ version: manifest.version, manualRoot, manualZip, storeRoot, storeZip }, null, 2));
