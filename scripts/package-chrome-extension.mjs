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
await writeFile(join(manualRoot, "INSTALL.md"), `# 安装 V2UI Chrome 扩展\n\n1. 解压 ${manualName}.zip。\n2. 在 Chrome 打开 \`chrome://extensions\`。\n3. 开启“开发者模式”。\n4. 点击“加载已解压的扩展程序”，选择解压后的 \`${manualName}\` 文件夹。\n5. 从 Codex 启动 V2UI companion，再在 localhost 或 127.0.0.1 预览页点击 V2UI 图标。\n\n版本：${manifest.version}\n`, "utf8");

function zip(args, cwd) {
  const result = spawnSync("/usr/bin/zip", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || "Failed to create archive.");
}
zip(["-r", "-X", manualZip, manualName], releasesRoot);
zip(["-r", "-X", storeZip, "."], storeRoot);
console.log(JSON.stringify({ version: manifest.version, manualRoot, manualZip, storeRoot, storeZip }, null, 2));
