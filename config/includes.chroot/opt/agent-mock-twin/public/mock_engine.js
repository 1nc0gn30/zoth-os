/**
 * mock_engine.js: Client-side Engine for Agent Mock Twin v2.6.0.
 * Handles HAR 1.2 / OpenAPI 3.0 ingestion, live :8097 backend sync, deduplicated SSE telemetry,
 * real latency/jitter/chaos controls, dual-theme canvas rendering, and offline browser fallback.
 * Zero external dependencies.
 */

(function () {
  'use strict';

  const VERSION = '2.6.0';
  const USD_PER_1K_TOKENS = 0.005;

  const state = {
    daemonOnline: false,
    sseConnected: false,
    latencyMs: 25,
    jitterMs: 15,
    chaosRate: 0.0,
    chaosType: '429_rate_limit',
    totalHits: 0,
    totalTokensSaved: 0,
    totalUsdSaved: 0.0,
    routes: [],
    recentHits: [],
    seenHitIds: new Set(),
    eventSource: null,
    configTimer: null,
  };

  let elTotalHits, elTokensSaved, elUsdSaved, elRoutesCount;
  let elLatencySlider, elLatencyDisplay;
  let elJitterSlider, elJitterDisplay;
  let elChaosRateSlider, elChaosRateDisplay, elChaosTypeSelect;
  let elDaemonBadge, elSseLabel, elConfigBadge;
  let elRouteList, elReplayList;
  let elTestEndpoint, elTestBody, elTestResponse, elBtnRunTest;

  // =========================================================================
  // INITIALIZATION
  // =========================================================================
  async function startEngine() {
    initDOMElements();
    initThemeToggle();
    initHeroCanvas();
    initEventListeners();
    await detectAndConnectBackend();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startEngine);
  } else {
    startEngine();
  }

  function initDOMElements() {
    elTotalHits = document.getElementById('statTotalHits');
    elTokensSaved = document.getElementById('statTokensSaved');
    elUsdSaved = document.getElementById('statUsdSaved');
    elRoutesCount = document.getElementById('statRoutesCount');

    elLatencySlider = document.getElementById('latencySlider');
    elLatencyDisplay = document.getElementById('latencyDisplay');
    elJitterSlider = document.getElementById('jitterSlider');
    elJitterDisplay = document.getElementById('jitterDisplay');
    elChaosRateSlider = document.getElementById('chaosRateSlider');
    elChaosRateDisplay = document.getElementById('chaosRateDisplay');
    elChaosTypeSelect = document.getElementById('chaosTypeSelect');

    elDaemonBadge = document.getElementById('daemonStatusBadge');
    elSseLabel = document.getElementById('sseStatusLabel');
    elConfigBadge = document.getElementById('configSyncBadge');

    elRouteList = document.getElementById('routeListTable');
    elReplayList = document.getElementById('replayLogList');

    elTestEndpoint = document.getElementById('testEndpointSelect');
    elTestBody = document.getElementById('testRequestBody');
    elTestResponse = document.getElementById('testResponseBody');
    elBtnRunTest = document.getElementById('btnRunTest');
  }

  function initThemeToggle() {
    const btn = document.getElementById('btnThemeToggle');
    const lbl = document.getElementById('themeToggleLabel');
    function syncLabel() {
      const cur = document.documentElement.getAttribute('data-theme') || 'dark';
      if (lbl) lbl.textContent = cur === 'light' ? '☾ Dark' : '☀ Light';
    }
    syncLabel();
    if (btn) {
      btn.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = cur === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('amt-theme', next); } catch (_) {}
        syncLabel();
      });
    }
  }

  // =========================================================================
  // KINETIC HERO CANVAS (Dual-Theme Aware Prism Dual-Ring)
  // =========================================================================
  function initHeroCanvas() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 560;
    let height = 186;
    function resize() {
      width = canvas.width = canvas.parentElement.clientWidth || 560;
      height = canvas.height = canvas.parentElement.clientHeight || 186;
    }
    window.addEventListener('resize', resize);
    resize();

    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let angle = 0;
    const particles = [];
    for (let i = 0; i < 32; i++) {
      particles.push({
        radius: 34 + (i % 8) * 7,
        theta: (i / 32) * Math.PI * 2,
        speed: 0.004 + (i % 5) * 0.0018,
        kind: i % 3,
        size: 1.6 + (i % 3) * 0.6,
      });
    }

    function render() {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.min(cx, cy) - 12;
      const outerR = Math.max(54, Math.min(82, maxR));
      const innerR = Math.round(outerR * 0.58);
      if (!reducedMotion) angle += 0.01;

      const emerald = isLight ? '#047857' : '#10B981';
      const gold = isLight ? '#9A7209' : '#D4AF37';
      const cyan = isLight ? '#0369A1' : '#22D3EE';

      // Outer Twin Ring
      ctx.strokeStyle = isLight ? 'rgba(4, 120, 87, 0.42)' : 'rgba(16, 185, 129, 0.38)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 10]);
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, angle * 0.5, angle * 0.5 + Math.PI * 2);
      ctx.stroke();

      // Inner Ring
      ctx.strokeStyle = isLight ? 'rgba(154, 114, 9, 0.52)' : 'rgba(212, 175, 55, 0.48)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, -angle * 0.8, -angle * 0.8 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Core Glow
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 28);
      grad.addColorStop(0, isLight ? 'rgba(4, 120, 87, 0.28)' : 'rgba(16, 185, 129, 0.42)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 28, 0, Math.PI * 2);
      ctx.fill();

      // Core Node
      ctx.fillStyle = emerald;
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();

      particles.forEach((p) => {
        if (!reducedMotion) p.theta += p.speed;
        const r = Math.min(outerR - 4, p.radius);
        const px = cx + Math.cos(p.theta) * r;
        const py = cy + Math.sin(p.theta) * r;
        ctx.fillStyle = p.kind === 0 ? emerald : (p.kind === 1 ? gold : cyan);
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      if (!reducedMotion) {
        requestAnimationFrame(render);
      }
    }
    requestAnimationFrame(render);
  }

  // =========================================================================
  // BACKEND DETECTION & LIVE SYNC (No hardcoded port 8097 or fake seed stats)
  // =========================================================================
  async function detectAndConnectBackend() {
    try {
      const resp = await fetch('/health', { cache: 'no-store' });
      if (resp.ok) {
        const health = await resp.json();
        if (health && health.service === 'agent-mock-twin') {
          state.daemonOnline = true;
          if (elDaemonBadge) {
            elDaemonBadge.textContent = `● LIVE :${health.port || location.port || 8097}`;
          }
          await refreshAllFromDaemon();
          connectSSE();
          return;
        }
      }
    } catch (_) {}

    // Honest Offline Browser Mode (Static deploy — 0 fake hits)
    state.daemonOnline = false;
    if (elDaemonBadge) elDaemonBadge.textContent = '○ OFFLINE BROWSER MODE';
    if (elSseLabel) elSseLabel.textContent = '○ LOCAL BROWSER ENGINE';
    if (elConfigBadge) elConfigBadge.textContent = 'LOCAL BROWSER SIM';
    renderRouteTable();
    renderReplayFeed();
    updateTelemetryUI();
  }

  async function refreshAllFromDaemon() {
    if (!state.daemonOnline) return;
    try {
      const [routesRes, statsRes, hitsRes, cfgRes] = await Promise.all([
        fetch('/api/routes', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
        fetch('/api/stats', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
        fetch('/api/hits?limit=25', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
        fetch('/api/config', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
      ]);

      if (routesRes && routesRes.success && Array.isArray(routesRes.routes)) {
        state.routes = routesRes.routes;
      }
      if (statsRes && statsRes.success && statsRes.stats) {
        const s = statsRes.stats;
        state.totalHits = s.total_hits ?? 0;
        state.totalTokensSaved = s.total_tokens_saved ?? 0;
        state.totalUsdSaved = s.total_usd_saved ?? 0.0;
      }
      if (hitsRes && hitsRes.success && Array.isArray(hitsRes.hits)) {
        state.recentHits = hitsRes.hits;
        state.seenHitIds = new Set(hitsRes.hits.map((h) => h.id).filter((id) => id != null));
      }
      if (cfgRes && cfgRes.success && cfgRes.config) {
        applyConfigToControls(cfgRes.config);
      }
    } catch (_) {}

    renderRouteTable();
    renderReplayFeed();
    updateTelemetryUI();
  }

  function applyConfigToControls(cfg) {
    state.latencyMs = cfg.base_latency_ms ?? 25;
    state.jitterMs = cfg.jitter_ms ?? 15;
    state.chaosRate = cfg.chaos_rate ?? 0.0;
    state.chaosType = cfg.chaos_type || '429_rate_limit';

    if (elLatencySlider) elLatencySlider.value = String(state.latencyMs);
    if (elLatencyDisplay) elLatencyDisplay.textContent = `${state.latencyMs}ms`;
    if (elJitterSlider) elJitterSlider.value = String(state.jitterMs);
    if (elJitterDisplay) elJitterDisplay.textContent = `±${state.jitterMs}ms`;
    const pct = Math.round(state.chaosRate * 100);
    if (elChaosRateSlider) elChaosRateSlider.value = String(pct);
    if (elChaosRateDisplay) elChaosRateDisplay.textContent = `${pct}%`;
    if (elChaosTypeSelect) elChaosTypeSelect.value = state.chaosType;
  }

  function connectSSE() {
    if (!state.daemonOnline || typeof EventSource === 'undefined') return;
    try {
      state.eventSource = new EventSource('/api/stream');
      state.eventSource.addEventListener('connect', () => {
        state.sseConnected = true;
        if (elSseLabel) elSseLabel.textContent = '● SSE STREAMING';
      });
      state.eventSource.addEventListener('hit', (e) => {
        try {
          const hit = JSON.parse(e.data);
          recordLocalHit(hit);
        } catch (_) {}
      });
      state.eventSource.addEventListener('clear', () => {
        state.routes = [];
        state.recentHits = [];
        state.seenHitIds.clear();
        state.totalHits = 0;
        state.totalTokensSaved = 0;
        state.totalUsdSaved = 0.0;
        renderRouteTable();
        renderReplayFeed();
        updateTelemetryUI();
      });
      state.eventSource.onerror = () => {
        state.sseConnected = false;
      };
    } catch (_) {}
  }

  // =========================================================================
  // EVENT LISTENERS
  // =========================================================================
  function initEventListeners() {
    if (elLatencySlider && elLatencyDisplay) {
      elLatencySlider.addEventListener('input', (e) => {
        state.latencyMs = parseInt(e.target.value, 10) || 0;
        elLatencyDisplay.textContent = `${state.latencyMs}ms`;
        scheduleConfigSync();
      });
    }

    if (elJitterSlider && elJitterDisplay) {
      elJitterSlider.addEventListener('input', (e) => {
        state.jitterMs = parseInt(e.target.value, 10) || 0;
        elJitterDisplay.textContent = `±${state.jitterMs}ms`;
        scheduleConfigSync();
      });
    }

    if (elChaosRateSlider && elChaosRateDisplay) {
      elChaosRateSlider.addEventListener('input', (e) => {
        const pct = parseInt(e.target.value, 10) || 0;
        state.chaosRate = Math.max(0, Math.min(1, pct / 100));
        elChaosRateDisplay.textContent = `${pct}%`;
        scheduleConfigSync();
      });
    }

    if (elChaosTypeSelect) {
      elChaosTypeSelect.addEventListener('change', (e) => {
        state.chaosType = e.target.value;
        scheduleConfigSync(true);
      });
    }

    if (elBtnRunTest) {
      elBtnRunTest.addEventListener('click', () => runTestRequest(false));
    }

    if (elTestEndpoint && elTestBody) {
      elTestEndpoint.addEventListener('change', () => {
        const sel = elTestEndpoint.value;
        if (sel === 'chat_completions') {
          elTestBody.value = JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: 'You are an autonomous research agent.' },
              { role: 'user', content: 'Perform zero-latency offline verification check.' },
            ],
            temperature: 0.2,
          }, null, 2);
        } else if (sel === 'anthropic_messages') {
          elTestBody.value = JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            messages: [{ role: 'user', content: 'Run local validation suite with $0 token cost.' }],
          }, null, 2);
        } else if (sel === 'embeddings') {
          elTestBody.value = JSON.stringify({
            model: 'text-embedding-3-small',
            input: 'Agent memory vector recall query',
          }, null, 2);
        } else {
          elTestBody.value = '';
        }
      });
    }

    // Accessible Drag & Drop + Keyboard Upload
    const dropZone = document.getElementById('harDropZone');
    const fileInput = document.getElementById('harFileInput');
    if (dropZone && fileInput) {
      dropZone.addEventListener('click', () => fileInput.click());
      dropZone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInput.click();
        }
      });
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });
      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) handleFileUpload(e.dataTransfer.files[0]);
      });
      fileInput.addEventListener('change', () => {
        if (fileInput.files.length) handleFileUpload(fileInput.files[0]);
      });
    }

    const btnSampleOpenAI = document.getElementById('btnLoadSampleOpenAI');
    if (btnSampleOpenAI) btnSampleOpenAI.addEventListener('click', loadSampleOpenAI);

    const btnSampleAnthropic = document.getElementById('btnLoadSampleAnthropic');
    if (btnSampleAnthropic) btnSampleAnthropic.addEventListener('click', loadSampleAnthropic);

    const btnExportDockerLive = document.getElementById('btnExportDockerLive');
    if (btnExportDockerLive) {
      btnExportDockerLive.addEventListener('click', () => {
        const bundle = {
          generator: `Agent Mock Twin v${VERSION}`,
          timestamp: new Date().toISOString(),
          routes: state.routes,
          dockerfile: 'FROM python:3.12-alpine\nWORKDIR /app\nCOPY . /app\nEXPOSE 8097\nCMD ["python3", "server.py", "--host", "127.0.0.1", "--port", "8097"]',
          ci_runner: 'agent-mock-twin run -- pytest tests/',
        };
        const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agent-mock-twin-ci-bundle-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('CI Docker bundle exported (v2.6.0).');
      });
    }

    // Real Live Chaos Probe (wired to POST /api/config + POST /api/test)
    const btnChaosTriggerLive = document.getElementById('btnChaosTriggerLive');
    if (btnChaosTriggerLive) {
      btnChaosTriggerLive.addEventListener('click', triggerRealChaosProbe);
    }

    // Real Clear Routes & Hits (wired to POST /api/clear)
    const btnClearAll = document.getElementById('btnClearAll');
    if (btnClearAll) {
      btnClearAll.addEventListener('click', clearAllRoutesAndHits);
    }
  }

  function scheduleConfigSync(immediate) {
    if (!state.daemonOnline) return;
    if (state.configTimer) clearTimeout(state.configTimer);
    if (immediate) {
      syncConfigToServer();
    } else {
      state.configTimer = setTimeout(syncConfigToServer, 120);
    }
  }

  async function syncConfigToServer(overrideCfg) {
    if (!state.daemonOnline) return null;
    const payload = overrideCfg || {
      base_latency_ms: state.latencyMs,
      jitter_ms: state.jitterMs,
      chaos_rate: state.chaosRate,
      chaos_type: state.chaosType,
    };
    try {
      const resp = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (elConfigBadge) elConfigBadge.textContent = 'SYNCED TO /api/config';
        return data.config;
      }
    } catch (_) {}
    return null;
  }

  async function triggerRealChaosProbe() {
    if (state.daemonOnline) {
      const prevRate = state.chaosRate;
      await syncConfigToServer({
        base_latency_ms: state.latencyMs,
        jitter_ms: state.jitterMs,
        chaos_rate: 1.0,
        chaos_type: state.chaosType,
      });
      try {
        await runTestRequest(true);
      } finally {
        await syncConfigToServer({
          base_latency_ms: state.latencyMs,
          jitter_ms: state.jitterMs,
          chaos_rate: prevRate,
          chaos_type: state.chaosType,
        });
      }
      showNotification(`Live ${state.chaosType} chaos fault executed on daemon.`);
      return;
    }

    // Offline client fallback
    const statusMap = {
      '429_rate_limit': 429,
      '500_internal_error': 500,
      '503_service_unavailable': 503,
      'timeout_hang': 504,
    };
    const code = statusMap[state.chaosType] || 503;
    const errPayload = JSON.stringify({ error: { code, type: state.chaosType, message: 'Offline chaos simulation' } }, null, 2);
    if (elTestResponse) elTestResponse.value = errPayload;
    recordLocalHit({
      id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      method: 'POST',
      path: '/v1/chat/completions',
      status_code: code,
      latency_ms: state.latencyMs,
      match_type: 'chaos',
      tokens_saved: 0,
      usd_saved: 0.0,
      provider: 'custom',
    });
    showNotification(`Simulated HTTP ${code} chaos fault.`);
  }

  async function clearAllRoutesAndHits() {
    if (state.daemonOnline) {
      try {
        const resp = await fetch('/api/clear', { method: 'POST' });
        if (resp.ok) {
          state.routes = [];
          state.recentHits = [];
          state.seenHitIds.clear();
          state.totalHits = 0;
          state.totalTokensSaved = 0;
          state.totalUsdSaved = 0.0;
          renderRouteTable();
          renderReplayFeed();
          updateTelemetryUI();
          showNotification('Cleared all SQLite routes and telemetry hits.');
          return;
        }
      } catch (_) {}
    }
    state.routes = [];
    state.recentHits = [];
    state.seenHitIds.clear();
    state.totalHits = 0;
    state.totalTokensSaved = 0;
    state.totalUsdSaved = 0.0;
    renderRouteTable();
    renderReplayFeed();
    updateTelemetryUI();
    showNotification('Cleared local preview routes and hits.');
  }

  // =========================================================================
  // HAR & OPENAPI UPLOAD + SAMPLE BLUEPRINTS (PERSISTED TO /api/upload)
  // =========================================================================
  async function persistPayloadToDaemon(payloadObj, label) {
    if (!state.daemonOnline) return false;
    try {
      const resp = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadObj),
      });
      const data = await resp.json();
      if (resp.ok && data && data.success) {
        await refreshAllFromDaemon();
        showNotification(`Persisted ${data.imported_count} ${label} routes to SQLite.`);
        return true;
      }
      showNotification(`Upload rejected: ${(data && data.error) || resp.status}`);
      return false;
    } catch (_) {
      return false;
    }
  }

  function handleFileUpload(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const json = JSON.parse(text);

        if (state.daemonOnline) {
          await persistPayloadToDaemon(json, file.name);
          return;
        }

        let imported = [];
        if (json.log && json.log.entries) {
          imported = parseHarClientSide(json);
        } else if (json.openapi || json.swagger || json.paths) {
          imported = parseOpenApiClientSide(json);
        } else {
          showNotification('Unrecognized format. Provide HAR 1.2 or OpenAPI 3.0 JSON.');
          return;
        }
        mergeRoutes(imported);
        showNotification(`Ingested ${imported.length} routes from ${file.name}.`);
      } catch (_) {
        showNotification('Invalid JSON file. Verify file integrity.');
      }
    };
    reader.readAsText(file);
  }

  function parseHarClientSide(har) {
    const entries = (har.log && har.log.entries) || [];
    const routes = [];
    entries.forEach((ent, idx) => {
      const req = ent.request || {};
      const res = ent.response || {};
      if (!req.url) return;
      const method = (req.method || 'GET').toUpperCase();
      let path = '/';
      try { path = new URL(req.url, 'http://localhost').pathname; } catch (_) { path = req.url.split('?')[0]; }
      const body = (req.postData && req.postData.text) || '';
      const resBody = (res.content && res.content.text) || '{"status":"ok"}';
      let provider = 'custom';
      if (req.url.includes('openai.com') || path.includes('/v1/chat')) provider = 'openai';
      else if (req.url.includes('anthropic.com') || path.includes('/v1/messages')) provider = 'anthropic';
      routes.push({
        id: `har_${Date.now()}_${idx}`,
        method,
        path,
        raw_body: body,
        response_status: res.status || 200,
        response_body: resBody,
        provider,
        token_estimate: Math.max(15, Math.floor((body.length + resBody.length) / 4)),
        description: `${provider.toUpperCase()} ${method} ${path}`,
      });
    });
    return routes;
  }

  function parseOpenApiClientSide(spec) {
    const paths = spec.paths || {};
    const routes = [];
    Object.keys(paths).forEach((p) => {
      const item = paths[p];
      ['get', 'post', 'put', 'delete', 'patch'].forEach((m) => {
        if (item[m]) {
          const op = item[m];
          routes.push({
            id: `oapi_${Date.now()}_${p}_${m}`,
            method: m.toUpperCase(),
            path: p,
            raw_body: '',
            response_status: 200,
            response_body: JSON.stringify({ mock: true, endpoint: p, status: 'synthesized' }),
            provider: p.includes('messages') ? 'anthropic' : (p.includes('chat') ? 'openai' : 'custom'),
            token_estimate: 25,
            description: op.summary || `${m.toUpperCase()} ${p}`,
          });
        }
      });
    });
    return routes;
  }

  function mergeRoutes(newRoutes) {
    newRoutes.forEach((nr) => {
      const idx = state.routes.findIndex((r) => r.path === nr.path && r.method === nr.method);
      if (idx >= 0) state.routes[idx] = nr;
      else state.routes.push(nr);
    });
    renderRouteTable();
    updateTelemetryUI();
  }

  async function loadSampleOpenAI() {
    const sampleRoutes = [
      {
        id: 'route_openai_chat',
        method: 'POST',
        path: '/v1/chat/completions',
        raw_body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are an autonomous research agent.' },
            { role: 'user', content: 'Perform zero-latency offline verification check.' },
          ],
          temperature: 0.2,
        }),
        provider: 'openai',
        token_estimate: 42,
        response_status: 200,
        response_headers: { 'content-type': 'application/json' },
        response_body: JSON.stringify({
          id: 'chatcmpl-mock-twin-demo',
          object: 'chat.completion',
          created: 1700000000,
          model: 'gpt-4o',
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: 'Verified through Agent Mock Twin offline network ($0 token cost, deterministic replay).',
            },
            finish_reason: 'stop',
          }],
          usage: { prompt_tokens: 22, completion_tokens: 20, total_tokens: 42 },
        }, null, 2),
        description: 'OpenAI GPT-4o Chat Completions Mock',
      },
      {
        id: 'route_openai_embeddings',
        method: 'POST',
        path: '/v1/embeddings',
        raw_body: JSON.stringify({ model: 'text-embedding-3-small', input: 'Agent memory vector recall query' }),
        provider: 'openai',
        token_estimate: 16,
        response_status: 200,
        response_headers: { 'content-type': 'application/json' },
        response_body: JSON.stringify({
          object: 'list',
          data: [{ object: 'embedding', index: 0, embedding: [0.021, -0.043, 0.088, 0.012, -0.091] }],
          model: 'text-embedding-3-small',
          usage: { prompt_tokens: 16, total_tokens: 16 },
        }, null, 2),
        description: 'OpenAI Text Embedding Small Mock',
      },
      {
        id: 'route_openai_models',
        method: 'GET',
        path: '/v1/models',
        raw_body: '',
        provider: 'openai',
        token_estimate: 10,
        response_status: 200,
        response_headers: { 'content-type': 'application/json' },
        response_body: JSON.stringify({
          object: 'list',
          data: [
            { id: 'gpt-4o', object: 'model' },
            { id: 'gpt-4o-mini', object: 'model' },
            { id: 'text-embedding-3-small', object: 'model' },
          ],
        }, null, 2),
        description: 'OpenAI Models List Endpoint',
      },
    ];

    if (state.daemonOnline) {
      await persistPayloadToDaemon(sampleRoutes, 'OpenAI');
      return;
    }
    mergeRoutes(sampleRoutes);
    showNotification('Loaded OpenAI blueprint into local preview.');
  }

  async function loadSampleAnthropic() {
    const sampleSpec = {
      openapi: '3.0.0',
      info: { title: 'Anthropic + REST Template Blueprint', version: VERSION },
      paths: {
        '/v1/messages': {
          post: {
            summary: 'Anthropic Claude 3.5 Sonnet Messages Mock',
            requestBody: {
              content: {
                'application/json': {
                  example: {
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 1024,
                    messages: [{ role: 'user', content: 'Run local validation suite with $0 token cost.' }],
                  },
                },
              },
            },
            responses: {
              '200': {
                content: {
                  'application/json': {
                    example: {
                      id: 'msg_mock_twin_claude',
                      type: 'message',
                      role: 'assistant',
                      model: 'claude-3-5-sonnet-20241022',
                      content: [{ type: 'text', text: 'Claude 3.5 Sonnet deterministic mock verified ($0 token cost).' }],
                      stop_reason: 'end_turn',
                      usage: { input_tokens: 25, output_tokens: 30 },
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/users/{id}': {
          get: {
            summary: 'OpenAPI {id} Path-Template User Lookup',
            responses: {
              '200': {
                content: {
                  'application/json': {
                    example: { id: '42', role: 'autonomous-agent', tier: 'open-access', verified: true },
                  },
                },
              },
            },
          },
        },
      },
    };

    if (state.daemonOnline) {
      await persistPayloadToDaemon(sampleSpec, 'Anthropic + OpenAPI');
      return;
    }
    mergeRoutes(parseOpenApiClientSide(sampleSpec));
    showNotification('Loaded Anthropic + OpenAPI {id} blueprint into local preview.');
  }

  // =========================================================================
  // INTERACTIVE TEST PLAYGROUND (DEDUPLICATED WITH SSE)
  // =========================================================================
  async function runTestRequest(isChaosProbe) {
    if (!elBtnRunTest) return;
    elBtnRunTest.disabled = true;
    elBtnRunTest.textContent = isChaosProbe ? '⚡ Running Chaos Probe...' : '⚡ Executing Mock...';

    const sel = elTestEndpoint ? elTestEndpoint.value : 'chat_completions';
    let path = '/v1/chat/completions';
    let method = 'POST';
    if (sel === 'anthropic_messages') path = '/v1/messages';
    else if (sel === 'embeddings') path = '/v1/embeddings';
    else if (sel === 'models') { path = '/v1/models'; method = 'GET'; }
    else if (sel === 'openapi_user') { path = '/v1/users/42'; method = 'GET'; }

    const bodyText = elTestBody ? elTestBody.value : '';
    const startTime = performance.now();

    try {
      if (state.daemonOnline) {
        const res = await fetch('/api/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method, path, body: bodyText }),
        });
        if (res.ok) {
          const data = await res.json();
          if (elTestResponse) {
            elTestResponse.value = typeof data.response_body === 'string'
              ? data.response_body
              : JSON.stringify(data.response_body, null, 2);
          }
          // Deduplicate with SSE by SQLite hit.id (zero double-counting!)
          if (data.hit) {
            recordLocalHit(data.hit);
          } else {
            recordLocalHit({
              method,
              path,
              status_code: data.response_status ?? 200,
              latency_ms: data.latency_ms ?? Math.round(performance.now() - startTime),
              match_type: data.match_type || 'exact',
              tokens_saved: data.tokens_saved ?? 0,
              usd_saved: data.usd_saved ?? 0.0,
              provider: data.provider || 'custom',
            });
          }
          return;
        }
      }

      // Offline browser simulation fallback
      await new Promise((r) => setTimeout(r, Math.min(200, state.latencyMs)));
      const matched = state.routes.find((r) => r.path === path && r.method === method);
      const resBody = matched
        ? matched.response_body
        : JSON.stringify({ mock: true, twin: 'agent-mock-twin', path, status: 'offline_synthesized' }, null, 2);
      if (elTestResponse) elTestResponse.value = resBody;

      const tokens = matched ? (matched.token_estimate ?? 0) : 35;
      const usd = (tokens / 1000) * USD_PER_1K_TOKENS;
      recordLocalHit({
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        method,
        path,
        status_code: matched ? (matched.response_status ?? 200) : 200,
        latency_ms: state.latencyMs,
        match_type: matched ? 'exact' : 'fallback',
        tokens_saved: tokens,
        usd_saved: usd,
        provider: (matched && matched.provider) || 'custom',
      });
    } finally {
      elBtnRunTest.disabled = false;
      elBtnRunTest.textContent = '★ Send Mock Test Request';
    }
  }

  function recordLocalHit(hit) {
    if (!hit) return;
    if (hit.id != null) {
      if (state.seenHitIds.has(hit.id)) return;
      state.seenHitIds.add(hit.id);
    }

    const normalized = {
      id: hit.id,
      timestamp: hit.timestamp ?? (Date.now() / 1000),
      method: hit.method || 'POST',
      path: hit.path || '/',
      status_code: hit.status_code ?? 200,
      latency_ms: hit.latency_ms ?? 0,
      match_type: hit.match_type || 'fallback',
      tokens_saved: hit.tokens_saved ?? 0,
      usd_saved: hit.usd_saved ?? 0.0,
      provider: hit.provider || 'custom',
    };

    state.recentHits.unshift(normalized);
    if (state.recentHits.length > 50) state.recentHits.pop();

    state.totalHits += 1;
    state.totalTokensSaved += normalized.tokens_saved;
    state.totalUsdSaved += normalized.usd_saved;

    updateTelemetryUI();
    renderReplayFeed();
  }

  // =========================================================================
  // RENDERERS
  // =========================================================================
  function updateTelemetryUI() {
    if (elTotalHits) elTotalHits.textContent = state.totalHits.toLocaleString();
    if (elTokensSaved) elTokensSaved.textContent = state.totalTokensSaved.toLocaleString();
    if (elUsdSaved) elUsdSaved.textContent = `$${Number(state.totalUsdSaved || 0).toFixed(4)}`;
    if (elRoutesCount) elRoutesCount.textContent = state.routes.length.toString();
  }

  function renderRouteTable() {
    if (!elRouteList) return;
    if (state.routes.length === 0) {
      elRouteList.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">No mock routes loaded yet. Click a sample blueprint above or drop a HAR / OpenAPI file.</td></tr>';
      return;
    }

    elRouteList.innerHTML = state.routes.map((r) => {
      const prov = String(r.provider || 'custom');
      const pVar = prov === 'openai' ? 'var(--accent-emerald)' : (prov === 'anthropic' ? 'var(--accent-purple)' : 'var(--accent-cyan)');
      const mVar = r.method === 'POST' ? 'var(--accent-cyan)' : (r.method === 'GET' ? 'var(--accent-emerald)' : 'var(--accent-gold)');
      return `
        <tr>
          <td><span class="method-badge" style="color: ${mVar}; border: 1px solid ${mVar};">${escapeHtml(r.method)}</span></td>
          <td style="font-family: var(--font-mono); font-size: 12px;">${escapeHtml(r.path)}</td>
          <td><span class="provider-pill" style="border-color: ${pVar}; color: ${pVar};">${escapeHtml(prov.toUpperCase())}</span></td>
          <td style="font-family: var(--font-mono); font-size: 11px; color: var(--accent-gold); font-weight: 700;">~${r.token_estimate ?? 0} tok</td>
          <td style="font-size: 11px; color: var(--text-secondary);">${escapeHtml(r.description || 'Active mock')}</td>
        </tr>
      `;
    }).join('');
  }

  function renderReplayFeed() {
    if (!elReplayList) return;
    if (state.recentHits.length === 0) {
      elReplayList.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-muted); font-family: var(--font-mono); font-size: 11px;">Awaiting agent request traffic...</div>';
      return;
    }

    elReplayList.innerHTML = state.recentHits.slice(0, 15).map((h) => {
      const code = h.status_code ?? 200;
      const isError = code >= 400 || h.match_type === 'chaos';
      const tier = String(h.match_type || 'fallback').toLowerCase();
      const pillClass = isError
        ? 'status-chaos'
        : (tier === 'exact' ? 'status-exact' : (tier === 'template' ? 'status-template' : (tier === 'fuzzy' ? 'status-fuzzy' : 'status-fallback')));
      const pillLabel = isError ? 'CHAOS' : tier.toUpperCase();
      const lat = h.latency_ms ?? 0;
      const toks = h.tokens_saved ?? 0;

      return `
        <div class="replay-card ${isError ? 'is-error' : ''}">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
              <span class="status-code ${isError ? 'is-error' : ''}">${code}</span>
              <span style="font-weight: 700; font-size: 11px; color: var(--text-primary);">${escapeHtml(h.method)}</span>
              <span style="font-family: var(--font-mono); font-size: 11px; color: var(--accent-cyan); word-break: break-all;">${escapeHtml(h.path)}</span>
            </div>
            <span class="status-pill ${pillClass}">${escapeHtml(pillLabel)}</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: var(--text-muted); margin-top: 4px; gap: 8px;">
            <span>⚡ ${lat}ms · ${escapeHtml(String(h.provider || 'custom').toUpperCase())}</span>
            <span style="color: ${isError ? 'var(--accent-crimson)' : 'var(--accent-gold)'}; font-weight: 700;">
              ${isError ? `Chaos HTTP ${code} (0 tokens saved)` : `Saved ~${toks} tokens ($0.00 cost)`}
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  // =========================================================================
  // UTILITIES & NOTIFICATIONS
  // =========================================================================
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showNotification(msg) {
    document.querySelectorAll('.glass-toast').forEach((el) => el.remove());
    const toast = document.createElement('div');
    toast.className = 'glass-toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML = `<span style="color: var(--accent-emerald); font-weight: 800;">✦</span><span>${escapeHtml(msg)}</span>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  window.showNotification = showNotification;
})();
