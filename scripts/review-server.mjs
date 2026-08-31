#!/usr/bin/env node
import http from "node:http";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { probeCodexThread, sendReviewToCodex } from "./codex-thread-bridge.mjs";

const args = process.argv.slice(2);
const projectIndex = args.indexOf("--project");
const portIndex = args.indexOf("--port");
const projectRoot = resolve(projectIndex >= 0 ? args[projectIndex + 1] : process.cwd());
const port = Number(portIndex >= 0 ? args[portIndex + 1] : process.env.V2UI_PORT || process.env.UI_REVIEW_PORT || 47831);
const scriptRoot = dirname(fileURLToPath(import.meta.url));
const overlayPath = join(scriptRoot, "overlay.js");
const reviewsRoot = join(projectRoot, ".codex", "v2ui-reviews");
const runtimeRoot = join(projectRoot, ".codex", "v2ui");
const onboardingPath = join(runtimeRoot, "onboarding.json");
const extensionRoot = resolve(scriptRoot, "..", "browser-extension");
const extensionInstallUrl = (() => {
  const value = process.env.V2UI_EXTENSION_INSTALL_URL;
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch { return null; }
})();
const MAX_BODY_BYTES = 120 * 1024 * 1024;
const activeClients = new Map();
let codexThreadId = process.env.V2UI_CODEX_THREAD_ID || null;
const bindingToken = process.env.V2UI_BINDING_TOKEN || await readFile(join(runtimeRoot, "binding-token"), "utf8").then((value) => value.trim()).catch(() => null);

await stat(projectRoot).catch(() => {
  console.error(`Project directory does not exist: ${projectRoot}`);
  process.exit(1);
});
await mkdir(reviewsRoot, { recursive: true });
await mkdir(runtimeRoot, { recursive: true });

async function readOnboarding() {
  try {
    return JSON.parse(await readFile(onboardingPath, "utf8"));
  } catch {
    return { completed: false, completedAt: null, previewUrl: null };
  }
}

function localPreview(value) {
  if (typeof value !== "string" || !value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname) ? url.href : null;
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function setupPage(previewUrl) {
  const preview = localPreview(previewUrl) || "http://127.0.0.1:5173/";
  const extension = escapeHtml(extensionRoot);
  const safePreview = escapeHtml(preview);
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>设置 V2UI</title>
    <style>
      :root{color-scheme:light;--ink:#342d27;--muted:#766d64;--line:#eadfd2;--orange:#d98938;--orange-soft:#fff0d8;--yellow:#f6d678;--green:#4f8a68;--paper:#fffdf8}
      *{box-sizing:border-box}body{margin:0;min-height:100vh;background:linear-gradient(145deg,#fff9ef 0%,#fffdf9 54%,#f7f1ea 100%);color:var(--ink);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      main{width:min(720px,calc(100% - 32px));margin:0 auto;padding:72px 0 88px}.brand{display:flex;align-items:center;gap:10px;color:var(--orange);font-style:italic;font-weight:650;letter-spacing:-.03em}.mark{width:30px;height:30px;border-radius:9px;background:var(--orange);display:grid;place-items:center;color:white;font-style:normal}
      h1{font-size:clamp(38px,7vw,64px);line-height:1.02;letter-spacing:-.055em;margin:28px 0 14px;max-width:640px}header p{font-size:18px;line-height:1.65;color:var(--muted);margin:0 0 38px;max-width:610px}
      .steps{display:grid;gap:12px}.step{display:grid;grid-template-columns:40px 1fr;gap:14px;padding:20px;border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.88);box-shadow:0 12px 38px rgba(90,64,39,.06)}.number{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:var(--orange-soft);color:#9a5d25;font-weight:650}.step.done .number{background:#dcecdf;color:var(--green)}
      h2{font-size:17px;margin:4px 0 7px;letter-spacing:-.015em}.step p{margin:0;color:var(--muted);font-size:14px;line-height:1.55}.status{display:inline-flex;align-items:center;gap:7px;color:var(--green);font-size:13px;font-weight:600}.status:before{content:"";width:7px;height:7px;border-radius:50%;background:#66aa7b}
      .copy-row{display:flex;gap:8px;margin-top:12px}.copy-row code,.preview-input{min-width:0;flex:1;border:1px solid var(--line);border-radius:8px;background:#faf7f2;padding:10px 11px;color:#5f554c;font:12px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.copy{border:1px solid var(--line);border-radius:8px;background:white;color:var(--ink);padding:0 13px;cursor:pointer}.copy:hover{border-color:#d8c4ae;background:#fffaf2}
      label.confirm{display:flex;align-items:flex-start;gap:10px;margin-top:13px;color:#5d554e;font-size:13px;line-height:1.45}.confirm input{margin-top:2px;accent-color:var(--orange)}.preview-input{width:100%;margin-top:12px;white-space:normal;font-size:13px}
      .actions{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:24px}.privacy{font-size:12px;line-height:1.5;color:#8b8279;max-width:370px}.primary{border:0;border-radius:10px;background:var(--ink);color:white;padding:13px 18px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 8px 18px rgba(52,45,39,.15)}.primary:disabled{cursor:not-allowed;opacity:.38;box-shadow:none}.hint{margin-top:14px;text-align:right;color:#a35f25;font-size:12px;min-height:18px}
      @media(max-width:620px){main{padding-top:38px}.actions{align-items:stretch;flex-direction:column}.primary{width:100%}.hint{text-align:left}.copy-row{flex-wrap:wrap}.copy{height:38px}}
    </style>
  </head>
  <body>
    <main>
      <header><div class="brand"><span class="mark">V</span>V2UI</div><h1>第一次设置，之后直接开始评审。</h1><p>扩展只作用于本地预览，companion 只把结构化建议和录制文件保存在当前项目。</p></header>
      <section class="steps">
        ${extensionInstallUrl ? `<article class="step"><div class="number">1</div><div><h2>安装 Chrome 扩展</h2><p>从 Chrome Web Store 安装 V2UI，然后将它固定到工具栏。</p><div class="copy-row"><a class="copy" href="${escapeHtml(extensionInstallUrl)}" target="_blank" rel="noreferrer" style="display:inline-flex;align-items:center;text-decoration:none;height:40px">从 Chrome Web Store 安装</a></div><label class="confirm"><input id="extensionConfirmed" type="checkbox" />我已经在 Chrome 工具栏中看到 V2UI 图标</label></div></article>` : `<article class="step"><div class="number">1</div><div><h2>加载开发版 Chrome 扩展</h2><p>打开 <strong>chrome://extensions</strong>，开启开发者模式，选择“加载已解压的扩展程序”，然后使用下面的目录。</p><div class="copy-row"><code id="extensionPath">${extension}</code><button class="copy" data-copy="extensionPath">复制目录</button></div><label class="confirm"><input id="extensionConfirmed" type="checkbox" />我已经在 Chrome 工具栏中看到 V2UI 图标</label></div></article>`}
        <article class="step done"><div class="number">✓</div><div><h2>本地 companion 已连接</h2><span class="status">运行于 127.0.0.1:${port}</span><p>后续启动会自动复用该服务，不需要再手动运行命令。</p></div></article>
        <article class="step"><div class="number">3</div><div><h2>确认本地预览</h2><p>完成后会打开这个地址。点击 V2UI 图标，再按绿色播放按钮申请屏幕和麦克风权限。</p><input id="previewUrl" class="preview-input" value="${safePreview}" aria-label="本地预览地址" /></div></article>
      </section>
      <div class="actions"><div class="privacy">权限只在开始评审后申请；录制由 V2UI 保存在本地。浏览器的实时语音识别可能按浏览器供应商政策处理音频。</div><button id="complete" class="primary" disabled>完成设置并打开预览</button></div><div id="hint" class="hint"></div>
    </main>
    <script>
      const checkbox = document.querySelector('#extensionConfirmed');
      const complete = document.querySelector('#complete');
      const previewInput = document.querySelector('#previewUrl');
      const hint = document.querySelector('#hint');
      checkbox.addEventListener('change', () => { complete.disabled = !checkbox.checked; });
      document.querySelectorAll('[data-copy]').forEach((button) => button.addEventListener('click', async () => {
        const text = document.querySelector('#' + button.dataset.copy).textContent;
        await navigator.clipboard.writeText(text); button.textContent = '已复制'; setTimeout(() => button.textContent = '复制目录', 1400);
      }));
      complete.addEventListener('click', async () => {
        hint.textContent = ''; complete.disabled = true; complete.textContent = '正在保存…';
        try {
          const response = await fetch('/onboarding/complete', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ extensionConfirmed:true, previewUrl:previewInput.value }) });
          const result = await response.json(); if (!response.ok) throw new Error(result.error || '设置保存失败');
          location.href = result.previewUrl;
        } catch (error) { hint.textContent = error.message; complete.disabled = false; complete.textContent = '完成设置并打开预览'; }
      });
    </script>
  </body>
</html>`;
}

function send(response, status, payload, contentType = "application/json; charset=utf-8") {
  response.writeHead(status, {
    "content-type": contentType,
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "cache-control": "no-store",
  });
  response.end(typeof payload === "string" ? payload : JSON.stringify(payload));
}

async function readJson(request) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) throw new Error("V2UI review package is larger than 120 MB.");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function safeSessionId(value) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{8,80}$/.test(value)) throw new Error("Invalid session id.");
  return value;
}

function currentClients() {
  const cutoff = Date.now() - 30 * 60 * 1000;
  return [...activeClients.values()].filter((client) => client.lastSeenAt >= cutoff);
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "OPTIONS") return send(response, 204, "", "text/plain");
    const requestUrl = new URL(request.url, `http://127.0.0.1:${port}`);
    if (request.method === "GET" && requestUrl.pathname === "/health") return send(response, 200, { ok: true, projectRoot, reviewsRoot, extensionRoot, extensionInstallUrl, codexDelivery: { configured: Boolean(codexThreadId) }, clients: currentClients() });
    if (request.method === "POST" && requestUrl.pathname === "/binding") {
      if (!bindingToken || request.headers["x-v2ui-binding-token"] !== bindingToken) throw new Error("Unauthorized V2UI task binding request.");
      const input = await readJson(request);
      if (input.threadId != null && (typeof input.threadId !== "string" || !/^[a-zA-Z0-9_-]{8,160}$/.test(input.threadId))) throw new Error("Invalid Codex thread id.");
      const candidate = input.threadId || null;
      const probe = await probeCodexThread(candidate);
      codexThreadId = probe.available ? candidate : null;
      return send(response, 200, { ok: true, codexDelivery: { configured: Boolean(codexThreadId), reason: probe.reason } });
    }
    if (request.method === "POST" && requestUrl.pathname === "/client") {
      const input = await readJson(request);
      const pageUrl = localPreview(input.pageUrl);
      if (!pageUrl) throw new Error("V2UI client must be a localhost or 127.0.0.1 page.");
      const surface = ["chrome", "codex"].includes(input.surface) ? input.surface : "unknown";
      const client = { id: `${surface}:${pageUrl}`, surface, pageUrl, lastSeenAt: Date.now() };
      activeClients.set(client.id, client);
      return send(response, 200, { ok: true, client, codexDelivery: { configured: Boolean(codexThreadId) } });
    }
    if (request.method === "GET" && requestUrl.pathname === "/onboarding") return send(response, 200, { ...(await readOnboarding()), extensionRoot, extensionInstallUrl, projectRoot });
    if (request.method === "GET" && requestUrl.pathname === "/setup") return send(response, 200, setupPage(requestUrl.searchParams.get("preview")), "text/html; charset=utf-8");
    if (request.method === "POST" && requestUrl.pathname === "/onboarding/complete") {
      const input = await readJson(request);
      const previewUrl = localPreview(input.previewUrl);
      if (input.extensionConfirmed !== true) throw new Error("请先确认 Chrome 扩展已经加载。");
      if (!previewUrl) throw new Error("预览地址必须使用 localhost 或 127.0.0.1。");
      const onboarding = { completed: true, completedAt: new Date().toISOString(), previewUrl };
      await writeFile(onboardingPath, `${JSON.stringify(onboarding, null, 2)}\n`, "utf8");
      return send(response, 200, { ok: true, ...onboarding });
    }
    if (request.method === "GET" && requestUrl.pathname === "/overlay.js") return send(response, 200, await readFile(overlayPath, "utf8"), "text/javascript; charset=utf-8");
    if (request.method === "GET" && ["/demo", "/demo-review"].includes(requestUrl.pathname)) {
      const demoReview = requestUrl.pathname === "/demo-review";
      return send(response, 200, `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>V2UI Demo</title>
    <style>
      body{margin:0;font-family:Inter,ui-sans-serif,system-ui;background:#fffaf0;color:#332d26}
      main{max-width:1040px;margin:0 auto;padding:96px 28px}
      h1{max-width:720px;font-size:clamp(44px,7vw,84px);line-height:.98;letter-spacing:-.055em;margin:18px 0}
      p{max-width:650px;color:#6f6b78;font-size:20px;line-height:1.6}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:54px}
      article{min-height:150px;padding:24px;border:1px solid #e4e0ea;border-radius:20px;background:#fff}@media(max-width:720px){.cards{grid-template-columns:1fr}}
    </style>
  </head>
  <body>
    <main>
      <h1>用圈选和语音，把网页改到满意为止。</h1>
      <p>这是 V2UI 的安全演示页。圈选组件或使用红色画笔，再说出调整建议；结束录制后即可发送给 Codex。</p>
      <section class="cards">
        <article><h2>选择元素</h2><p>记录 DOM、位置与样式上下文。</p></article>
        <article><h2>边看边说</h2><p>语音片段和标注共享时间轴。</p></article>
        <article><h2>交给 Codex</h2><p>映射源码范围，修改并验证。</p></article>
      </section>
    </main>
    ${demoReview ? "<script>window.__V2UI_DEMO_REVIEW__=true</script>" : ""}
    <script src="/overlay.js"></script>
  </body>
</html>`, "text/html; charset=utf-8");
    }
    if (request.method === "POST" && requestUrl.pathname === "/session") {
      const packageData = await readJson(request);
      const sessionId = safeSessionId(packageData.sessionId);
      const sessionRoot = join(reviewsRoot, sessionId);
      await mkdir(sessionRoot, { recursive: true });

      const { recordingBase64, recordings = [], ...manifest } = packageData;
      const recording = typeof recordingBase64 === "string" && recordingBase64.length > 0;
      if (recording) {
        await writeFile(join(sessionRoot, "recording.webm"), Buffer.from(recordingBase64, "base64"));
      }
      const recordingFiles = [];
      const recordingMetadata = [];
      for (const [index, segment] of (Array.isArray(recordings) ? recordings : []).entries()) {
        if (!segment || typeof segment.base64 !== "string" || !segment.base64.length) continue;
        const filename = `recording-${String(index + 1).padStart(2, "0")}.webm`;
        await writeFile(join(sessionRoot, filename), Buffer.from(segment.base64, "base64"));
        recordingFiles.push(filename);
        const { base64, ...metadata } = segment;
        recordingMetadata.push(metadata);
      }
      const finalized = {
        ...manifest,
        surface: ["chrome", "codex"].includes(manifest.surface) ? manifest.surface : "unknown",
        recordings: recordingMetadata,
        schemaVersion: 3,
        savedAt: new Date().toISOString(),
        projectRoot,
        files: { manifest: "manifest.json", recording: recording ? "recording.webm" : null, recordings: recordingFiles },
      };
      const manifestPath = join(sessionRoot, "manifest.json");
      await writeFile(manifestPath, `${JSON.stringify(finalized, null, 2)}\n`, "utf8");
      if (codexThreadId) {
        const codex = await sendReviewToCodex({ projectRoot, threadId: codexThreadId, manifest: finalized, manifestPath });
        return send(response, 201, { ok: true, sessionId, sessionRoot, manifestPath, codex });
      }
      return send(response, 201, { ok: true, sessionId, sessionRoot, manifestPath, codex: { delivered: false, reason: "no-codex-task-binding" } });
    }
    return send(response, 404, { ok: false, error: "Not found" });
  } catch (error) {
    return send(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`V2UI_SERVER_READY http://127.0.0.1:${port} project=${projectRoot}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
