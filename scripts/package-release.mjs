#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { cp, mkdir, readFile, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptRoot, "..");
const releasesRoot = join(projectRoot, "releases");
const { version } = JSON.parse(await readFile(join(projectRoot, "package.json"), "utf8"));
const chrome = spawnSync(process.execPath, [join(scriptRoot, "package-chrome-extension.mjs")], { cwd: projectRoot, encoding: "utf8" });
if (chrome.status !== 0) throw new Error(chrome.stderr || chrome.stdout);
process.stdout.write(chrome.stdout);

async function stage(name, entries) {
  const root = join(releasesRoot, name);
  const archive = join(releasesRoot, `${name}.zip`);
  await rm(root, { recursive: true, force: true });
  await rm(archive, { force: true });
  await mkdir(root, { recursive: true });
  for (const [source, destination = source] of entries) await cp(join(projectRoot, source), join(root, destination), { recursive: true });
  const zip = spawnSync("/usr/bin/zip", ["-r", "-X", archive, name], { cwd: releasesRoot, encoding: "utf8" });
  if (zip.status !== 0) throw new Error(zip.stderr || zip.stdout);
  return archive;
}

const codexZip = await stage(`V2UI-Codex-${version}`, [
  [".codex-plugin"], ["skills"], ["scripts"], ["browser-extension"], ["adapters"], ["assets"],
  ["README.md"], ["PRODUCT.md"], ["CHANGELOG.md"], ["LICENSE"], ["package.json"]
]);
const skillName = `V2UI-Skill-Submission-${version}`;
const skillRoot = join(releasesRoot, skillName, "v2ui");
await rm(join(releasesRoot, skillName), { recursive: true, force: true });
await rm(join(releasesRoot, `${skillName}.zip`), { force: true });
await mkdir(join(skillRoot, "runtime"), { recursive: true });
await cp(join(projectRoot, "skills/v2ui"), skillRoot, { recursive: true });
for (const name of ["scripts", "browser-extension", "adapters", "assets"]) await cp(join(projectRoot, name), join(skillRoot, "runtime", name), { recursive: true });
const skillZip = join(releasesRoot, `${skillName}.zip`);
const zip = spawnSync("/usr/bin/zip", ["-r", "-X", skillZip, skillName], { cwd: releasesRoot, encoding: "utf8" });
if (zip.status !== 0) throw new Error(zip.stderr || zip.stdout);
console.log(JSON.stringify({ codexZip, skillZip }, null, 2));
