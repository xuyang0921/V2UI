(() => {
  if (window.__v2ui?.destroy) {
    window.__v2ui.destroy();
    return;
  }

  const loaderScript = document.currentScript;
  const SERVER_ORIGIN = (() => {
    try {
      const scriptUrl = new URL(loaderScript?.src || "");
      if (scriptUrl.protocol === "http:" && ["127.0.0.1", "localhost"].includes(scriptUrl.hostname)) return scriptUrl.origin;
    } catch {}
    return "http://127.0.0.1:47831";
  })();
  const SURFACE = loaderScript?.dataset?.v2uiSurface || (() => {
    try { return new URL(loaderScript?.src || location.href).searchParams.get("surface"); } catch { return null; }
  })() || "chrome";
  const PEN_COLOR = "#df5b4f";
  const HIGHLIGHT_COLOR = "#e5a13d";
  const host = document.createElement("div");
  host.id = "v2ui-overlay";
  host.style.cssText = "position:fixed;inset:0;z-index:2147483647;pointer-events:none;contain:layout style paint;";
  document.documentElement.appendChild(host);
  const root = host.attachShadow({ mode: "open" });

  root.innerHTML = `
    <style>
      :host{all:initial}*{box-sizing:border-box}button{font:inherit;cursor:pointer}
      .v2-canvas{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;touch-action:none}
      .v2-canvas.active{pointer-events:auto;cursor:crosshair}
      .v2-surface{border:1px solid rgba(145,111,55,.18);background:#fff;box-shadow:0 10px 30px rgba(82,62,29,.12);transition:box-shadow .18s ease,border-color .18s ease}
      .v2-surface:hover,.v2-surface:focus-within,.v2-surface.dragging{border-color:rgba(145,111,55,.28);box-shadow:0 14px 38px rgba(82,62,29,.16)}
      .v2-toolbar{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);display:flex;align-items:center;gap:5px;padding:7px;border-radius:14px;pointer-events:auto;font:12px/1.2 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif;color:#3b332a;user-select:none}
      .v2-drag{width:24px;height:32px;border:0;border-radius:8px;background:transparent;display:grid;grid-template-columns:repeat(2,3px);grid-template-rows:repeat(3,3px);place-content:center;gap:3px;opacity:.38;cursor:grab;padding:0}
      .v2-drag i{width:3px;height:3px;border-radius:50%;background:#6f6253}.v2-toolbar:hover .v2-drag{opacity:.8}.v2-drag:active{cursor:grabbing}
      .v2-divider{width:1px;height:24px;background:#eadfc9;margin:0 2px}
      .v2-btn{height:32px;border:0;border-radius:8px;background:transparent;color:#63584c;padding:0 10px;display:flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;transition:background-color .14s ease,color .14s ease,transform .14s ease}
      .v2-btn:hover{background:#fff1cf;color:#4f3b1f}.v2-btn:active{transform:translateY(1px)}.v2-btn:focus-visible{outline:2px solid #d49537;outline-offset:2px}
      .v2-btn.active{background:#ffedbd;color:#6c4814}.v2-btn.primary{background:#e7a343;color:#fff}.v2-btn.primary:hover{background:#d99435}.v2-btn.close{color:#a54d43}.v2-btn:disabled{opacity:.36;cursor:not-allowed;transform:none}
      .v2-record-toggle{width:32px;padding:0;color:#4eaa68}.v2-record-toggle:hover{background:#eaf6ed;color:#3c9055}.v2-record-toggle svg{width:14px;height:14px;fill:currentColor}.v2-record-toggle .v2-pause{display:none}.recording .v2-record-toggle{color:#3d9d59}.recording .v2-record-toggle .v2-play{display:none}.recording .v2-record-toggle .v2-pause{display:block}
      .v2-time{font-variant-numeric:tabular-nums;color:#8a7b69;min-width:38px;margin-left:-3px}.recording .v2-time{color:#3d8a52}
      .v2-panel{display:none;position:fixed;right:18px;top:18px;width:304px;border-radius:14px;pointer-events:auto;font:12px/1.5 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif;color:#3b332a;overflow:hidden}.v2-panel.visible{display:block}
      .v2-panel-head{padding:13px 14px;border-bottom:1px solid rgba(159,123,64,.13);display:flex;align-items:center;justify-content:space-between;cursor:grab;user-select:none}.v2-panel-head:active{cursor:grabbing}.v2-panel-head strong{font-size:14px;font-weight:600}.v2-status-dot{width:8px;height:8px;border-radius:50%;background:#c75a4e;box-shadow:0 0 0 3px rgba(199,90,78,.1)}.v2-status-dot.recording{background:#4eaa68;box-shadow:0 0 0 3px rgba(78,170,104,.12)}
      .v2-list{max-height:310px;overflow:auto;padding:8px}.v2-list::-webkit-scrollbar{width:8px}.v2-list::-webkit-scrollbar-thumb{background:#dccaa8;border:2px solid transparent;border-radius:99px;background-clip:padding-box}
      .v2-empty{padding:24px 14px;text-align:center;color:#8b8175}.v2-item{position:relative;display:grid;grid-template-columns:22px minmax(0,1fr) 24px;gap:7px;align-items:start;padding:10px 7px;border-radius:10px;transition:background-color .14s ease}
      .v2-item:hover,.v2-item.hovered{background:#fff2d3}.v2-index{display:flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:6px;background:#f7dfaa;color:#6e4d20;font-size:11px;font-variant-numeric:tabular-nums}
      .v2-copy{min-width:0;color:#463d33;overflow-wrap:anywhere}.v2-scope{display:block;margin-top:4px;color:#8a7b69;font-size:10px}
      .v2-delete{width:24px;height:24px;border:0;border-radius:7px;background:transparent;color:#c65349;opacity:0;display:grid;place-items:center;padding:0}.v2-item:hover .v2-delete,.v2-delete:focus-visible{opacity:1}.v2-delete:hover{background:#fde3dd}.v2-delete svg{width:12px;height:12px}
      .v2-send-wrap{display:none;padding:10px;border-top:1px solid rgba(159,123,64,.13)}.v2-send-wrap.visible{display:block}.v2-send{width:100%;height:36px;border:0;border-radius:9px;background:#e7a343;color:#fff;font-weight:570}.v2-send:hover{background:#d99435}.v2-send:focus-visible{outline:2px solid #d49537;outline-offset:2px}.v2-send:disabled{opacity:.48;cursor:not-allowed}
      .v2-brand{padding:0 3px 0 1px;color:#d99031;font-size:13px;font-style:italic;font-weight:650;letter-spacing:-.02em}
      .v2-toast{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:max-content;max-width:min(560px,calc(100vw - 48px));min-width:270px;padding:17px 24px;border-radius:16px;background:#4b443a;color:#fff8e9;box-shadow:0 12px 30px rgba(66,47,18,.2);pointer-events:none;font:500 17px/1.42 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif;text-align:center;opacity:0;transition:opacity .2s ease}.v2-toast.show{opacity:1}.v2-toast.intro{width:min(390px,calc(100vw - 48px));box-sizing:border-box}.v2-toast-line{display:block;width:100%}.v2-toast.intro .v2-toast-line{text-align:justify;text-align-last:justify}
      .v2-target-layer{position:fixed;inset:0;pointer-events:none}.v2-target{position:fixed;border:2px solid ${PEN_COLOR};border-radius:7px;box-shadow:0 0 0 3px rgba(223,91,79,.12)}.v2-target.highlight{border-color:${HIGHLIGHT_COLOR};box-shadow:0 0 0 5px rgba(229,161,61,.2)}
      .v2-target label{position:absolute;left:-2px;top:-24px;height:21px;display:flex;align-items:center;padding:0 7px;border-radius:6px;background:${PEN_COLOR};color:#fff;font:10px/1 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;white-space:nowrap}.v2-target.highlight label{background:${HIGHLIGHT_COLOR}}
      .v2-page-highlight{position:fixed;inset:7px;border:4px solid ${HIGHLIGHT_COLOR};border-radius:14px;box-shadow:inset 0 0 0 4px rgba(229,161,61,.16);pointer-events:none;opacity:0;transition:opacity .12s ease}.v2-page-highlight.visible{opacity:1}
      @keyframes v2Pulse{50%{opacity:.34;transform:scale(.78)}}
      @media(max-width:760px){.v2-panel{right:10px;top:10px;width:min(304px,calc(100vw - 20px))}.v2-toolbar{left:10px;right:10px;bottom:10px;transform:none;justify-content:center;flex-wrap:wrap}.v2-divider{display:none}.v2-btn{padding:0 8px}}
      @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
    </style>
    <canvas class="v2-canvas"></canvas>
    <div class="v2-target-layer"></div>
    <div class="v2-page-highlight"></div>
    <div class="v2-toast" role="status" aria-live="polite"></div>
    <aside class="v2-panel v2-surface" aria-label="调整建议">
      <div class="v2-panel-head"><strong>调整建议</strong><span class="v2-status-dot" aria-label="已暂停"></span></div>
      <div class="v2-list"><div class="v2-empty">开始审阅后，圈选页面元素或用画笔标记，再直接说出调整建议。</div></div>
      <div class="v2-send-wrap"><button class="v2-send">发送建议</button></div>
    </aside>
    <div class="v2-toolbar v2-surface">
      <button class="v2-drag" aria-label="拖动工具栏" title="拖动工具栏"><i></i><i></i><i></i><i></i><i></i><i></i></button>
      <span class="v2-brand" aria-label="V2UI">V2UI</span>
      <button class="v2-btn v2-record-toggle" aria-label="开始审阅" title="开始审阅"><svg class="v2-play" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.7c0-.78.86-1.25 1.52-.84l7.03 4.3a2.16 2.16 0 0 1 0 3.68l-7.03 4.3A.99.99 0 0 1 4 13.3V2.7Z"/></svg><svg class="v2-pause" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z"/></svg></button><span class="v2-time">00:00</span><span class="v2-divider"></span>
      <button class="v2-btn active" data-tool="browse">Browse</button>
      <button class="v2-btn" data-tool="select">Select</button>
      <button class="v2-btn" data-tool="pen">Pen</button>
      <button class="v2-btn v2-undo" disabled>Undo</button>
      <button class="v2-btn v2-clear" disabled>Clear</button><span class="v2-divider"></span>
      <button class="v2-btn close v2-close">Exit review</button>
    </div>`;

  const canvas = root.querySelector(".v2-canvas");
  const context = canvas.getContext("2d");
  const toolbar = root.querySelector(".v2-toolbar");
  const panel = root.querySelector(".v2-panel");
  const statusDot = root.querySelector(".v2-status-dot");
  const list = root.querySelector(".v2-list");
  const targetLayer = root.querySelector(".v2-target-layer");
  const pageHighlight = root.querySelector(".v2-page-highlight");
  const toast = root.querySelector(".v2-toast");
  const recordToggle = root.querySelector(".v2-record-toggle");
  const recordTime = root.querySelector(".v2-time");
  const undoButton = root.querySelector(".v2-undo");
  const clearButton = root.querySelector(".v2-clear");
  const sendWrap = root.querySelector(".v2-send-wrap");
  const sendButton = root.querySelector(".v2-send");

  const state = {
    sessionId: `v2ui-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    reviewStartedAt: performance.now(), recordingStartedAt: null, recordedMs: 0, tool: "browse", drawing: null,
    annotations: [], targets: [], suggestions: [], activeTargetId: null, pendingTargetIds: [], pendingAnnotationIds: [], activeSpeechSuggestionId: null, history: [],
    mediaRecorder: null, mediaChunks: [], streams: [], recognition: null, recognitionRestart: false, recognitionRestartTimer: null, recognitionRetryCount: 0, recognitionErrors: [], speechDraft: "", speechTimer: null, timer: null,
    recordingSegments: [], starting: false, ending: false, hasEnded: false,
    permissionStatus: { screen: "not-requested", microphone: "not-requested", audioRecording: "not-requested", speechRecognition: "not-requested" }, transcriptionStatus: "not-started", fallbackToastShown: false, highlightedSuggestionId: null, sent: false, codexDeliveryConfigured: false,
  };

  const elapsed = () => Math.round(performance.now() - state.reviewStartedAt);
  const recordingElapsed = () => state.recordedMs + (state.recordingStartedAt ? performance.now() - state.recordingStartedAt : 0);
  const point = (event) => ({ x: event.clientX + window.scrollX, y: event.clientY + window.scrollY });
  const id = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const unique = (values) => [...new Set(values)];
  const hasSavedRecording = () => state.recordingSegments.length > 0;
  const hasReviewEvidence = () => state.suggestions.length > 0 || state.annotations.length > 0 || state.targets.length > 0 || hasSavedRecording();
  const needsCodexTranscription = () => hasSavedRecording() && (state.transcriptionStatus === "deferred" || state.suggestions.length === 0);

  function showToast(message, duration = 3200) {
    toast.classList.remove("intro"); toast.textContent = message; toast.classList.add("show"); window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), duration);
  }

  const sendLabel = () => state.codexDeliveryConfigured ? "确认调整" : "发送建议";
  function markDirty() { state.sent = false; sendButton.disabled = false; sendButton.textContent = sendLabel(); updateControls(); }

  function selectorFor(element) {
    if (!element || element === document.documentElement) return "html";
    if (element.id) return `#${CSS.escape(element.id)}`;
    const parts = []; let current = element;
    while (current && current.nodeType === 1 && current !== document.body && parts.length < 6) {
      let part = current.tagName.toLowerCase();
      const stableClasses = [...current.classList].filter((name) => !/active|hover|focus|selected|open|closed|\d{4,}/i.test(name)).slice(0, 2);
      if (stableClasses.length) part += stableClasses.map((name) => `.${CSS.escape(name)}`).join("");
      else if (current.parentElement) part += `:nth-child(${[...current.parentElement.children].indexOf(current) + 1})`;
      parts.unshift(part); current = current.parentElement;
    }
    return `body > ${parts.join(" > ")}`;
  }

  function targetFromPoint(clientX, clientY) {
    host.style.display = "none"; const element = document.elementFromPoint(clientX, clientY); host.style.display = "";
    if (!element || element === document.body || element === document.documentElement) return null;
    return element;
  }

  function selectElement(element) {
    beginVisual();
    const rect = element.getBoundingClientRect(); const styles = getComputedStyle(element);
    const target = {
      id: id("target"), t: elapsed(), selector: selectorFor(element), tagName: element.tagName.toLowerCase(),
      text: (element.innerText || element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 240),
      ariaLabel: element.getAttribute("aria-label"), role: element.getAttribute("role"), classList: [...element.classList].slice(0, 12),
      rect: { x: rect.x + window.scrollX, y: rect.y + window.scrollY, width: rect.width, height: rect.height }, scroll: { x: window.scrollX, y: window.scrollY },
      computedStyle: { display: styles.display, position: styles.position, color: styles.color, backgroundColor: styles.backgroundColor, fontFamily: styles.fontFamily, fontSize: styles.fontSize, fontWeight: styles.fontWeight, lineHeight: styles.lineHeight, padding: styles.padding, margin: styles.margin, borderRadius: styles.borderRadius },
    };
    state.targets.push(target); state.activeTargetId = target.id; state.pendingTargetIds.push(target.id); state.history.push({ kind: "target", id: target.id });
    markDirty(); renderAll(); showToast("已圈选，可以直接说出调整建议。", 2600);
  }

  function suggestionVisuals(suggestion) { return { targets: new Set(suggestion?.targetIds || []), annotations: new Set(suggestion?.annotationIds || []) }; }

  function renderTargets() {
    targetLayer.textContent = "";
    const highlighted = state.suggestions.find((item) => item.id === state.highlightedSuggestionId);
    const visuals = suggestionVisuals(highlighted);
    const ids = highlighted ? [...visuals.targets] : state.activeTargetId ? [state.activeTargetId] : [];
    ids.forEach((targetId) => {
      const target = state.targets.find((item) => item.id === targetId); if (!target) return;
      const box = document.createElement("div"); box.className = `v2-target${highlighted ? " highlight" : ""}`;
      box.style.left = `${target.rect.x - window.scrollX}px`; box.style.top = `${target.rect.y - window.scrollY}px`; box.style.width = `${target.rect.width}px`; box.style.height = `${target.rect.height}px`;
      const label = document.createElement("label"); label.textContent = highlighted ? "对应组件" : "已圈选"; box.appendChild(label); targetLayer.appendChild(box);
    });
    pageHighlight.classList.toggle("visible", Boolean(highlighted?.scope === "page"));
  }

  function renderAnnotation(annotation, highlighted = false) {
    context.save(); context.strokeStyle = highlighted ? HIGHLIGHT_COLOR : PEN_COLOR; context.lineWidth = highlighted ? 5 : 3.5; context.lineCap = "round"; context.lineJoin = "round";
    if (highlighted) { context.shadowColor = "rgba(229,161,61,.45)"; context.shadowBlur = 10; }
    const points = annotation.points.map((item) => ({ x: item.x - window.scrollX, y: item.y - window.scrollY }));
    if (points.length) { context.beginPath(); context.moveTo(points[0].x, points[0].y); points.slice(1).forEach((item) => context.lineTo(item.x, item.y)); context.stroke(); }
    context.restore();
  }

  function renderCanvas() {
    context.clearRect(0, 0, innerWidth, innerHeight);
    const highlighted = state.suggestions.find((item) => item.id === state.highlightedSuggestionId); const visuals = suggestionVisuals(highlighted);
    state.annotations.forEach((annotation) => renderAnnotation(annotation, visuals.annotations.has(annotation.id)));
    if (state.drawing) renderAnnotation(state.drawing);
  }

  function scopeLabel(suggestion) {
    if (suggestion.scope === "page") return "整页建议";
    const componentCount = suggestion.targetIds.length; const drawingCount = suggestion.annotationIds.length;
    if (componentCount && drawingCount) return `关联 ${componentCount} 个组件 · ${drawingCount} 处画笔`;
    if (componentCount) return `关联 ${componentCount} 个组件`;
    return `关联 ${drawingCount} 处画笔`;
  }

  function deleteSuggestion(suggestionId) {
    const suggestion = state.suggestions.find((item) => item.id === suggestionId); if (!suggestion) return;
    state.suggestions = state.suggestions.filter((item) => item.id !== suggestionId);
    if (state.activeSpeechSuggestionId === suggestionId) state.activeSpeechSuggestionId = null;
    const remainingTargetIds = new Set(state.suggestions.flatMap((item) => item.targetIds)); const remainingAnnotationIds = new Set(state.suggestions.flatMap((item) => item.annotationIds));
    state.annotations = state.annotations.filter((item) => !suggestion.annotationIds.includes(item.id) || remainingAnnotationIds.has(item.id));
    state.targets = state.targets.filter((item) => !suggestion.targetIds.includes(item.id) || remainingTargetIds.has(item.id) || state.pendingTargetIds.includes(item.id));
    if (!state.targets.some((item) => item.id === state.activeTargetId)) state.activeTargetId = null;
    state.history = state.history.filter((entry) => state.targets.some((item) => item.id === entry.id) || state.annotations.some((item) => item.id === entry.id));
    state.highlightedSuggestionId = null; markDirty(); renderAll();
  }

  function renderList() {
    if (!state.suggestions.length) {
      list.innerHTML = `<div class="v2-empty">${state.hasEnded && hasSavedRecording() ? "录音已保存。确认调整后，将交给 Codex 完成转写并结合标注整理建议。" : "开始审阅后，圈选页面元素或用画笔标记，再直接说出调整建议。"}</div>`;
      return;
    }
    list.textContent = "";
    state.suggestions.forEach((suggestion, index) => {
      const item = document.createElement("div"); item.className = "v2-item"; item.dataset.suggestionId = suggestion.id;
      item.innerHTML = `<span class="v2-index"></span><div class="v2-copy"></div><button class="v2-delete" aria-label="删除这条建议" title="删除"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2L2 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>`;
      item.querySelector(".v2-index").textContent = String(index + 1);
      const copy = item.querySelector(".v2-copy"); copy.textContent = suggestion.text;
      const scope = document.createElement("span"); scope.className = "v2-scope"; scope.textContent = scopeLabel(suggestion); copy.appendChild(scope);
      item.addEventListener("mouseenter", () => { state.highlightedSuggestionId = suggestion.id; renderTargets(); renderCanvas(); });
      item.addEventListener("mouseleave", () => { state.highlightedSuggestionId = null; renderTargets(); renderCanvas(); });
      item.addEventListener("click", () => { const target = state.targets.find((candidate) => suggestion.targetIds.includes(candidate.id)); if (target) window.scrollTo({ left: target.scroll.x, top: target.scroll.y, behavior: "smooth" }); });
      item.querySelector(".v2-delete").addEventListener("click", (event) => { event.stopPropagation(); deleteSuggestion(suggestion.id); });
      list.appendChild(item);
    });
  }

  function updateControls() {
    const recording = Boolean(state.recordingStartedAt);
    toolbar.classList.toggle("recording", recording);
    statusDot.classList.toggle("recording", recording);
    statusDot.setAttribute("aria-label", recording ? "录制中" : "已暂停");
    panel.classList.toggle("visible", state.suggestions.length > 0 || (state.hasEnded && hasReviewEvidence()));
    recordToggle.disabled = state.starting || state.ending;
    recordToggle.setAttribute("aria-label", recording ? "暂停审阅" : "开始审阅");
    recordToggle.setAttribute("title", recording ? "暂停审阅" : "开始审阅");
    undoButton.disabled = !state.history.length; clearButton.disabled = !state.history.length && !state.suggestions.length;
    sendWrap.classList.toggle("visible", !recording && state.hasEnded && hasReviewEvidence());
  }

  function renderAll() { renderTargets(); renderCanvas(); renderList(); updateControls(); }

  function showIntroToast() {
    toast.innerHTML = '<span class="v2-toast-line">点击开始录制后，圈选页面元素或</span><span class="v2-toast-line">用画笔勾选，并直接说出调整建议。</span>';
    toast.classList.add("intro", "show"); window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => { toast.classList.remove("show", "intro"); }, 2800);
  }

  async function checkCompanion() {
    try {
      const response = await fetch(`${SERVER_ORIGIN}/health`, { signal: AbortSignal.timeout(900) });
      if (!response.ok) throw new Error("unavailable");
      const clientResponse = await fetch(`${SERVER_ORIGIN}/client`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ surface: SURFACE, pageUrl: location.href }) });
      const client = await clientResponse.json();
      if (!clientResponse.ok) throw new Error(client.error || "unavailable");
      state.codexDeliveryConfigured = Boolean(client.codexDelivery?.configured);
      sendButton.textContent = sendLabel();
    } catch {
      showToast("V2UI 本地服务未启动。请回到 Codex 输入“启动 V2UI”。", 7600);
    }
  }

  function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1; canvas.width = Math.round(innerWidth * ratio); canvas.height = Math.round(innerHeight * ratio); canvas.style.width = `${innerWidth}px`; canvas.style.height = `${innerHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0); renderAll();
  }

  function setTool(tool) {
    state.tool = tool; if (tool === "browse") state.activeTargetId = null;
    root.querySelectorAll("[data-tool]").forEach((button) => button.classList.toggle("active", button.dataset.tool === tool));
    canvas.classList.toggle("active", tool !== "browse"); renderTargets();
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (state.tool === "select") { const element = targetFromPoint(event.clientX, event.clientY); if (element) selectElement(element); return; }
    if (state.tool !== "pen") return;
    beginVisual();
    canvas.setPointerCapture(event.pointerId); state.drawing = { id: id("annotation"), type: "pen", tStart: elapsed(), tEnd: null, targetId: state.activeTargetId, scroll: { x: window.scrollX, y: window.scrollY }, points: [point(event)] }; renderCanvas();
  });
  canvas.addEventListener("pointermove", (event) => { if (state.drawing) { state.drawing.points.push(point(event)); renderCanvas(); } });
  canvas.addEventListener("pointerup", () => {
    if (!state.drawing) return;
    state.drawing.tEnd = elapsed(); state.annotations.push(state.drawing); state.pendingAnnotationIds.push(state.drawing.id); state.history.push({ kind: "annotation", id: state.drawing.id }); state.drawing = null;
    markDirty(); renderAll();
  });

  function addSuggestion(text) {
    const clean = text.trim().replace(/\s+/g, " "); if (!clean) return;
    const activeSuggestion = state.suggestions.find((item) => item.id === state.activeSpeechSuggestionId);
    if (activeSuggestion) { activeSuggestion.text = `${activeSuggestion.text} ${clean}`.trim(); markDirty(); renderAll(); return; }
    const targetIds = unique(state.pendingTargetIds.length ? state.pendingTargetIds : state.activeTargetId ? [state.activeTargetId] : []); const annotationIds = unique(state.pendingAnnotationIds);
    const suggestion = { id: id("suggestion"), t: elapsed(), text: clean, source: "speech", scope: targetIds.length || annotationIds.length ? "selection" : "page", targetIds, annotationIds, scroll: { x: window.scrollX, y: window.scrollY } };
    state.suggestions.push(suggestion); state.activeSpeechSuggestionId = suggestion.id;
    state.pendingTargetIds = []; state.pendingAnnotationIds = []; markDirty(); renderAll();
  }

  function queueSpeech(text) { const clean = text.trim(); if (!clean) return; state.speechDraft = `${state.speechDraft} ${clean}`.trim(); window.clearTimeout(state.speechTimer); state.speechTimer = window.setTimeout(flushSpeech, 1500); }
  function flushSpeech() { window.clearTimeout(state.speechTimer); if (state.speechDraft) addSuggestion(state.speechDraft); state.speechDraft = ""; }
  function beginVisual() { flushSpeech(); state.activeSpeechSuggestionId = null; state.pendingTargetIds = []; state.pendingAnnotationIds = []; }

  function deferTranscription(error = "unavailable", notify = true) {
    state.transcriptionStatus = "deferred";
    state.permissionStatus.speechRecognition = `error:${error}`;
    state.recognitionRestart = false;
    window.clearTimeout(state.recognitionRestartTimer);
    if (notify && !state.fallbackToastShown) {
      state.fallbackToastShown = true;
      showToast("实时转录暂不可用，录音仍会继续；确认调整后将由 Codex 完成转写。", 5200);
    }
  }

  function startSpeechRecognition() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      state.permissionStatus.speechRecognition = "unsupported";
      state.transcriptionStatus = "deferred";
      return false;
    }
    const recognition = new Recognition(); recognition.lang = "zh-CN"; recognition.continuous = true; recognition.interimResults = false;
    recognition.onresult = (event) => {
      state.recognitionRetryCount = 0; state.transcriptionStatus = "live"; state.permissionStatus.speechRecognition = "active";
      for (let index = event.resultIndex; index < event.results.length; index += 1) if (event.results[index].isFinal) queueSpeech(event.results[index][0].transcript);
    };
    recognition.onerror = (event) => {
      const error = event.error || "unknown"; state.recognitionErrors.push({ t: elapsed(), error });
      if (["no-speech", "aborted"].includes(error)) return;
      const retryable = ["network", "audio-capture"].includes(error) && state.recognitionRetryCount < 2;
      if (retryable) { state.recognitionRetryCount += 1; state.permissionStatus.speechRecognition = `retrying:${error}`; return; }
      deferTranscription(error);
    };
    recognition.onend = () => {
      if (!state.recognitionRestart || !state.recordingStartedAt) return;
      window.clearTimeout(state.recognitionRestartTimer);
      state.recognitionRestartTimer = window.setTimeout(() => {
        if (!state.recognitionRestart || !state.recordingStartedAt) return;
        try { recognition.start(); state.permissionStatus.speechRecognition = "active"; }
        catch { deferTranscription("restart"); }
      }, 260);
    };
    try {
      recognition.start(); state.recognition = recognition; state.recognitionRestart = true; state.transcriptionStatus = "live"; state.permissionStatus.speechRecognition = "active"; return true;
    } catch { deferTranscription("start", false); return false; }
  }

  async function startReview() {
    if (state.recordingStartedAt || state.starting) return; state.starting = true; state.hasEnded = false; markDirty(); updateControls(); const streams = [];
    try { const screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }); streams.push(screen); state.permissionStatus.screen = "granted"; } catch (error) { state.permissionStatus.screen = error?.name === "NotAllowedError" ? "denied" : "error"; }
    try { const microphone = await navigator.mediaDevices.getUserMedia({ audio: true }); streams.push(microphone); state.permissionStatus.microphone = "granted"; } catch (error) { state.permissionStatus.microphone = error?.name === "NotAllowedError" ? "denied" : "error"; }
    state.streams = streams; const tracks = streams.flatMap((stream) => stream.getTracks()); state.mediaChunks = []; state.mediaRecorder = null;
    if (tracks.length) {
      try { const recorder = new MediaRecorder(new MediaStream(tracks)); state.mediaRecorder = recorder; recorder.ondataavailable = (event) => { if (event.data.size) state.mediaChunks.push(event.data); }; recorder.start(500); }
      catch { state.permissionStatus.audioRecording = "error"; }
      streams.flatMap((stream) => stream.getVideoTracks()).forEach((track) => { track.onended = () => { if (state.recordingStartedAt) endReview(); }; });
    }
    if (state.permissionStatus.audioRecording !== "error") state.permissionStatus.audioRecording = streams.some((stream) => stream.getAudioTracks().length > 0) && state.mediaRecorder ? "active" : "unavailable";
    state.recordingStartedAt = performance.now(); state.starting = false; state.timer = window.setInterval(() => { recordTime.textContent = new Date(recordingElapsed()).toISOString().slice(14, 19); }, 250);
    const liveTranscription = startSpeechRecognition(); updateControls();
    if (liveTranscription) showToast("审阅已开始。圈选页面元素或使用红色画笔，再说出调整建议。", 4400);
    else if (state.permissionStatus.audioRecording === "active") { state.fallbackToastShown = true; showToast("审阅已开始并正在录音；实时转录不可用，确认后将由 Codex 完成转写。", 5600); }
    else if (tracks.length) showToast("审阅已开始，但未获得可用的麦克风音轨；屏幕和页面标注仍会保留。", 5200);
    else showToast("未获得录屏或录音权限；仍可进行页面标注。", 4400);
  }

  async function stopRecorder() {
    const recorder = state.mediaRecorder; if (!recorder || recorder.state === "inactive") return null;
    await new Promise((resolve) => { recorder.addEventListener("stop", resolve, { once: true }); recorder.stop(); });
    if (!state.mediaChunks.length) return null; return new Blob(state.mediaChunks, { type: recorder.mimeType || "video/webm" });
  }

  async function endReview() {
    if (!state.recordingStartedAt || state.ending) return; state.ending = true; recordToggle.disabled = true; flushSpeech(); state.recognitionRestart = false; state.recognition?.stop?.(); window.clearInterval(state.timer);
    const segmentStartedAt = state.recordedMs; const segmentDuration = performance.now() - state.recordingStartedAt; const blob = await stopRecorder(); state.recordedMs += segmentDuration;
    if (blob) { state.recordingSegments.push({ id: id("recording"), startedAtMs: Math.round(segmentStartedAt), durationMs: Math.round(segmentDuration), mimeType: blob.type, blob }); if (state.permissionStatus.audioRecording === "active") state.permissionStatus.audioRecording = "saved"; }
    state.streams.forEach((stream) => stream.getTracks().forEach((track) => track.stop())); state.streams = []; state.mediaRecorder = null; state.mediaChunks = []; state.recordingStartedAt = null; state.ending = false; state.hasEnded = true;
    recordTime.textContent = new Date(state.recordedMs).toISOString().slice(14, 19); updateControls();
    showToast(state.suggestions.length ? `录制已结束。可以继续开始，或${state.codexDeliveryConfigured ? "确认调整" : "发送现有建议"}。` : hasSavedRecording() ? `录音已保存。${state.codexDeliveryConfigured ? "确认调整" : "发送"}后将由 Codex 完成转写。` : "录制已结束，尚未识别到调整建议。", 4600);
  }

  function blobToBase64(blob) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1] || ""); reader.onerror = reject; reader.readAsDataURL(blob); }); }

  async function sendReview() {
    if (state.recordingStartedAt || !hasReviewEvidence()) return; sendButton.disabled = true; sendButton.textContent = "正在发送…";
    const recordings = await Promise.all(state.recordingSegments.map(async (segment, index) => ({ id: segment.id, index: index + 1, startedAtMs: segment.startedAtMs, durationMs: segment.durationMs, mimeType: segment.mimeType, base64: await blobToBase64(segment.blob) })));
    const payload = {
      sessionId: state.sessionId, product: "V2UI", surface: SURFACE, createdAt: new Date().toISOString(), durationMs: Math.round(state.recordedMs),
      page: { url: location.href, title: document.title, viewport: { width: innerWidth, height: innerHeight, devicePixelRatio: devicePixelRatio || 1 }, finalScroll: { x: scrollX, y: scrollY } }, permissionStatus: state.permissionStatus,
      targets: state.targets, annotations: state.annotations, suggestions: state.suggestions,
      transcription: { strategy: "browser-live-with-codex-fallback", status: state.transcriptionStatus, requiresPostProcessing: needsCodexTranscription(), recognitionErrors: state.recognitionErrors },
      transcriptSegments: state.suggestions.map(({ id: suggestionId, t, text, source, targetIds, annotationIds, scope, scroll }) => ({ id: suggestionId, t, text, source, targetIds, annotationIds, scope, scroll })), recordings,
    };
    try {
      const response = await fetch(`${SERVER_ORIGIN}/session`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }); const result = await response.json();
      if (!response.ok) throw new Error(result.error || "发送失败");
      if (!result.codex?.delivered) {
        try { await navigator.clipboard.writeText("V2UI 调整建议已发送。请先概括收到的建议并询问我是否确认执行；得到确认后再修改代码。"); } catch {}
      }
      resetRound(); showToast(result.codex?.delivered ? "修改建议已发到绑定的 Codex 对话，请回到对话中确认是否执行。" : "建议已保存。本轮内容已清空，请回到 Codex 对话并确认已发送。", 7600);
    } catch (error) { sendButton.disabled = false; sendButton.textContent = "重新发送"; showToast(`发送失败：${error.message}。请确认 V2UI 本地服务仍在运行。`, 9000); }
  }

  function undoLast() {
    const last = state.history.pop(); if (!last) return;
    const linkedSuggestions = state.suggestions.filter((item) => (last.kind === "annotation" ? item.annotationIds : item.targetIds).includes(last.id));
    if (linkedSuggestions.length) linkedSuggestions.forEach((item) => deleteSuggestion(item.id));
    else if (last.kind === "annotation") { state.annotations = state.annotations.filter((item) => item.id !== last.id); state.pendingAnnotationIds = state.pendingAnnotationIds.filter((item) => item !== last.id); }
    else { state.targets = state.targets.filter((item) => item.id !== last.id); state.pendingTargetIds = state.pendingTargetIds.filter((item) => item !== last.id); if (state.activeTargetId === last.id) state.activeTargetId = null; }
    markDirty(); renderAll();
  }

  function clearAll() {
    state.annotations = []; state.targets = []; state.suggestions = []; state.pendingTargetIds = []; state.pendingAnnotationIds = []; state.activeSpeechSuggestionId = null; state.history = []; state.activeTargetId = null; state.highlightedSuggestionId = null;
    markDirty(); renderAll();
  }

  function resetRound() {
    window.clearInterval(state.timer); window.clearTimeout(state.speechTimer); window.clearTimeout(state.recognitionRestartTimer);
    state.sessionId = "v2ui-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    state.reviewStartedAt = performance.now(); state.recordingStartedAt = null; state.recordedMs = 0; state.tool = "browse"; state.drawing = null;
    state.annotations = []; state.targets = []; state.suggestions = []; state.activeTargetId = null; state.pendingTargetIds = []; state.pendingAnnotationIds = []; state.activeSpeechSuggestionId = null; state.history = [];
    state.mediaRecorder = null; state.mediaChunks = []; state.streams = []; state.recognition = null; state.recognitionRestart = false; state.recognitionRestartTimer = null; state.recognitionRetryCount = 0; state.recognitionErrors = []; state.speechDraft = ""; state.speechTimer = null; state.timer = null;
    state.recordingSegments = []; state.starting = false; state.ending = false; state.hasEnded = false;
    state.permissionStatus = { screen: "not-requested", microphone: "not-requested", audioRecording: "not-requested", speechRecognition: "not-requested" }; state.transcriptionStatus = "not-started"; state.fallbackToastShown = false; state.highlightedSuggestionId = null; state.sent = false;
    recordTime.textContent = "00:00"; sendButton.disabled = false; sendButton.textContent = sendLabel(); setTool("browse"); markDirty(); renderAll();
  }

  function enableDrag() {
    const handle = root.querySelector(".v2-drag"); let drag = null;
    handle.addEventListener("pointerdown", (event) => {
      const rect = toolbar.getBoundingClientRect(); drag = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
      toolbar.style.left = `${rect.left}px`; toolbar.style.top = `${rect.top}px`; toolbar.style.right = "auto"; toolbar.style.bottom = "auto"; toolbar.style.transform = "none"; toolbar.classList.add("dragging"); handle.setPointerCapture(event.pointerId);
    });
    handle.addEventListener("pointermove", (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const left = Math.max(8, Math.min(innerWidth - toolbar.offsetWidth - 8, event.clientX - drag.offsetX)); const top = Math.max(8, Math.min(innerHeight - toolbar.offsetHeight - 8, event.clientY - drag.offsetY)); toolbar.style.left = `${left}px`; toolbar.style.top = `${top}px`;
    });
    handle.addEventListener("pointerup", () => { drag = null; toolbar.classList.remove("dragging"); });
  }

  function enablePanelDrag() {
    const handle = root.querySelector(".v2-panel-head"); let drag = null;
    handle.addEventListener("pointerdown", (event) => {
      const rect = panel.getBoundingClientRect(); drag = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
      panel.style.left = `${rect.left}px`; panel.style.top = `${rect.top}px`; panel.style.right = "auto"; panel.style.bottom = "auto"; panel.classList.add("dragging"); handle.setPointerCapture(event.pointerId);
    });
    handle.addEventListener("pointermove", (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const left = Math.max(8, Math.min(innerWidth - panel.offsetWidth - 8, event.clientX - drag.offsetX)); const top = Math.max(8, Math.min(innerHeight - panel.offsetHeight - 8, event.clientY - drag.offsetY)); panel.style.left = `${left}px`; panel.style.top = `${top}px`;
    });
    handle.addEventListener("pointerup", () => { drag = null; panel.classList.remove("dragging"); });
  }

  function destroy() {
    window.clearInterval(state.timer); window.clearTimeout(state.speechTimer); window.clearTimeout(state.recognitionRestartTimer); state.recognitionRestart = false; state.recognition?.stop?.(); state.streams.forEach((stream) => stream.getTracks().forEach((track) => track.stop())); host.remove(); delete window.__v2ui;
  }

  root.querySelectorAll("[data-tool]").forEach((button) => button.addEventListener("click", () => setTool(button.dataset.tool)));
  recordToggle.addEventListener("click", () => state.recordingStartedAt ? endReview() : startReview()); undoButton.addEventListener("click", undoLast); clearButton.addEventListener("click", clearAll); sendButton.addEventListener("click", sendReview); root.querySelector(".v2-close").addEventListener("click", destroy);
  window.addEventListener("resize", resizeCanvas); window.addEventListener("scroll", () => { renderCanvas(); renderTargets(); }, { passive: true });
  function seedDemoReview() {
    const firstCard = document.querySelector("article");
    if (firstCard) selectElement(firstCard);
    const heading = document.querySelector("h1")?.getBoundingClientRect();
    if (heading) {
      const annotation = { id: id("annotation"), type: "pen", tStart: elapsed(), tEnd: elapsed() + 300, targetId: state.activeTargetId, scroll: { x: 0, y: 0 }, points: [
        { x: heading.left + 18, y: heading.bottom + 8 }, { x: heading.left + heading.width * .35, y: heading.bottom + 14 }, { x: heading.left + heading.width * .7, y: heading.bottom + 7 }
      ] };
      state.annotations.push(annotation); state.pendingAnnotationIds.push(annotation.id); state.history.push({ kind: "annotation", id: annotation.id });
    }
    addSuggestion("主标题再精炼一些，并缩短为两行以内。 ");
    setTool("browse");
    addSuggestion("整体留白可以再舒展一点，保持清新、轻盈的感觉。 ");
    state.hasEnded = true;
    renderAll();
  }

  enableDrag(); enablePanelDrag(); resizeCanvas(); setTool("browse"); checkCompanion(); window.__v2ui = { state, surface: SURFACE, destroy, start: startReview, end: endReview, send: sendReview, setTool };
  if (window.__V2UI_DEMO_REVIEW__) seedDemoReview();
  showIntroToast();
})();
