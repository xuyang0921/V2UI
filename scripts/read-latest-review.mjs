#!/usr/bin/env node
import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const projectIndex = args.indexOf("--project");
const projectRoot = resolve(projectIndex >= 0 ? args[projectIndex + 1] : process.cwd());
const reviewsRoot = join(projectRoot, ".codex", "v2ui-reviews");

const names = await readdir(reviewsRoot).catch(() => []);
const sessions = await Promise.all(names.map(async (name) => {
  const manifestPath = join(reviewsRoot, name, "manifest.json");
  const info = await stat(manifestPath).catch(() => null);
  return info ? { name, manifestPath, mtimeMs: info.mtimeMs } : null;
}));
const latest = sessions.filter(Boolean).sort((a, b) => b.mtimeMs - a.mtimeMs)[0];

if (!latest) {
  console.error(`No completed V2UI review exists under ${reviewsRoot}`);
  process.exit(1);
}

const manifest = JSON.parse(await readFile(latest.manifestPath, "utf8"));
console.log(JSON.stringify({
  manifestPath: latest.manifestPath,
  sessionId: manifest.sessionId,
  page: manifest.page,
  durationMs: manifest.durationMs,
  targets: manifest.targets?.length || 0,
  annotations: manifest.annotations?.length || 0,
  suggestions: manifest.suggestions?.length || 0,
  transcriptSegments: manifest.transcriptSegments?.length || 0,
  recording: manifest.files?.recording ? join(reviewsRoot, latest.name, manifest.files.recording) : null,
  recordings: (manifest.files?.recordings || []).map((name) => join(reviewsRoot, latest.name, name)),
  permissionStatus: manifest.permissionStatus,
}, null, 2));
