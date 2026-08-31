#!/usr/bin/env node
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const projectIndex = args.indexOf("--project");
const projectRoot = resolve(projectIndex >= 0 ? args[projectIndex + 1] : process.cwd());
const scriptRoot = dirname(fileURLToPath(import.meta.url));
const sourceAdapter = resolve(scriptRoot, "..", "adapters", "vite.mjs");
const runtimeRoot = join(projectRoot, ".codex", "v2ui");
const targetAdapter = join(runtimeRoot, "vite-plugin.mjs");
const candidates = ["vite.config.mjs", "vite.config.js", "vite.config.ts", "vite.config.mts"];
let configPath = null;

for (const candidate of candidates) {
  const path = join(projectRoot, candidate);
  try { await readFile(path, "utf8"); configPath = path; break; } catch {}
}
if (!configPath) throw new Error("No Vite config found. Add the V2UI browser adapter manually for this framework.");

await mkdir(runtimeRoot, { recursive: true });
await copyFile(sourceAdapter, targetAdapter);
let config = await readFile(configPath, "utf8");
if (!config.includes("v2uiBrowserAdapter")) {
  const pluginsPattern = /plugins\s*:\s*\[/;
  if (!pluginsPattern.test(config)) throw new Error(`Could not safely find a plugins array in ${configPath}. Add v2uiBrowserAdapter() manually.`);
  const importPath = `./${relative(projectRoot, targetAdapter).split("\\").join("/")}`;
  config = `import { v2uiBrowserAdapter } from "${importPath}";\n${config}`;
  config = config.replace(pluginsPattern, (match) => `${match}v2uiBrowserAdapter(), `);
  await writeFile(configPath, config, "utf8");
}

console.log(`V2UI_VITE_ADAPTER_READY config=${configPath} adapter=${targetAdapter}`);
