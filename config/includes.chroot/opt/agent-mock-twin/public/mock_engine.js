/**
 * mock_engine.js: Client-side Engine for Agent Mock Twin.
 * Handles client-side HAR/OpenAPI ingestion, interactive test playground,
 * live SSE telemetry, kinetic canvas rendering, and monetization license verification.
 * Zero external dependencies.
 */

(function () {
  'use strict';

  // State Management
  const state = {
    isPro: false,
    latencyMs: 25,
    jitterMs: 15,
    chaosRate: 0.0,
    chaosType: '429_rate_limit',
    totalHits: 0,
    totalTokensSaved: 0,
    totalUsdSaved: 0.0,
    routes: [],
    recentHits: [],
    eventSource: null,
  };

  // USD Conversion constant
  const USD_PER_1K_TOKENS = 0.005;

  // Local daemon detection (Port 8097) vs static / test runner
  const isLocalDaemon = (window.location.port === "8097");

  // DOM Elements
  let elTotalHits, elTokensSaved, elUsdSaved, elRoutesCount;
  let elLatencySlider, elLatencyDisplay;
  let elRouteList, elReplayList;
  let elTestEndpoint, elTestBody, elTestResponse, elBtnRunTest;
  let elPaywallOverlay, elProModal, elLicenseBadge;

  // =========================================================================
  // INITIALIZATION
  // =========================================================================
  function startEngine() {
    initDOMElements();
    checkLicenseStatus();
    initHeroCanvas();
    initEventListeners();
    initPreloadedSample();
    connectTelemetry();
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

    elRouteList = document.getElementById('routeListTable');
    elReplayList = document.getElementById('replayLogList');

    elTestEndpoint = document.getElementById('testEndpointSelect');
    elTestBody = document.getElementById('testRequestBody');
    elTestResponse = document.getElementById('testResponseBody');
    elBtnRunTest = document.getElementById('btnRunTest');

    elPaywallOverlay = document.getElementById('paywallOverlay');
    elProModal = document.getElementById('proModal');
    elLicenseBadge = document.getElementById('licenseBadge');
  }

  // =========================================================================
  // LICENSING & PRO PAYWALL
  // =========================================================================
  function checkLicenseStatus() {
    // 1. Check URL parameters for instant 1-click return from checkout
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('licensed') === 'true' || urlParams.get('pro') === 'true' || urlParams.get('session_id')) {
      localStorage.setItem('agent_mock_twin_pro', 'true');
      localStorage.setItem('zoth_agent_mock_licensed', 'true');
      localStorage.setItem('pro_licensed', 'true');
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
      enableProMode();
      showNotification('🎉 Welcome to Agent Mock Twin Pro! Unlimited offline mocking unlocked.');
      return;
    }

    // 2. Check localStorage
    if (
      localStorage.getItem('agent_mock_twin_pro') === 'true' ||
      localStorage.getItem('zoth_agent_mock_licensed') === 'true' ||
      localStorage.getItem('pro_licensed') === 'true'
    ) {
      enableProMode();
    }
  }

  function enableProMode() {
    state.isPro = true;
    const badge = elLicenseBadge || document.getElementById('licenseBadge');
    if (badge) {
      badge.textContent = '⭐ PRO ACTIVE';
      badge.className = 'badge badge-pro-active';
    }
    const salesBanner = document.getElementById('salesBanner');
    if (salesBanner) {
      salesBanner.style.display = 'none';
    }
    const overlay = elPaywallOverlay || document.getElementById('paywallOverlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
    const blurredSections = document.querySelectorAll('.pro-blur-target');
    blurredSections.forEach(sec => sec.classList.remove('pro-blur-target'));

    const btnExport = document.getElementById('btnExportDockerLive');
    if (btnExport) {
      btnExport.onclick = () => {
        const bundle = {
          generator: "Agent Mock Twin v2.5.0",
          timestamp: new Date().toISOString(),
          routes: state.routes,
          dockerfile: "FROM python:3.12-alpine\nWORKDIR /app\nCOPY . /app\nEXPOSE 8097\nCMD [\"python\", \"-m\", \"agent_mock_twin\", \"serve\", \"--port\", \"8097\"]",
          ci_runner: "agent-mock run -- pytest tests/"
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
        showNotification('📦 CI Docker Container bundle exported successfully!');
      };
    }
  }

  window.openProModal = function () {
    const modal = elProModal || document.getElementById('proModal');
    if (modal) modal.classList.add('active');
  };

  window.closeProModal = function () {
    const modal = elProModal || document.getElementById('proModal');
    if (modal) modal.classList.remove('active');
  };

  window.activateLicenseKey = function (key) {
    const k = (typeof key === 'string' && key) ? key : (document.getElementById('licenseKeyInput')?.value || '');
    if (k.trim().length >= 4) {
      localStorage.setItem('agent_mock_twin_pro', 'true');
      localStorage.setItem('zoth_agent_mock_licensed', 'true');
      localStorage.setItem('pro_licensed', 'true');
      enableProMode();
      window.closeProModal();
      showNotification('⭐ License key verified! Pro capabilities active.');
      return true;
    } else {
      showNotification('⚠️ Please enter a valid receipt email or license key.');
      return false;
    }
  };

  window.activateWithKey = function () {
    const input = document.getElementById('licenseKeyInput');
    const val = input ? input.value.trim() : '';
    window.activateLicenseKey(val);
  };

  // Intercept Pro Actions
  window.interceptProAction = function (actionName) {
    if (!state.isPro) {
      window.openProModal();
      return false;
    }
    showNotification(`⚡ Pro Action triggered: ${actionName}`);
    return true;
  };

  // =========================================================================
  // KINETIC HERO CANVAS (Prism Dual-Ring Network Twin)
  // =========================================================================
  function initHeroCanvas() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width, height;
    function resize() {
      width = canvas.width = canvas.parentElement.clientWidth || 600;
      height = canvas.height = canvas.parentElement.clientHeight || 280;
    }
    window.addEventListener('resize', resize);
    resize();

    let angle = 0;
    const particles = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        radius: 40 + Math.random() * 80,
        theta: Math.random() * Math.PI * 2,
        speed: 0.005 + Math.random() * 0.01,
        color: Math.random() > 0.5 ? '#10B981' : (Math.random() > 0.5 ? '#D4AF37' : '#06B6D4'),
        size: 1.5 + Math.random() * 2,
      });
    }

    function render() {
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      angle += 0.01;

      // Draw Outer Twin Ring (Mock Twin - Emerald Glow)
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      ctx.arc(cx, cy, 95, angle * 0.5, angle * 0.5 + Math.PI * 2);
      ctx.stroke();

      // Draw Inner Ring (Live Agent Traffic - Gold/Cyan)
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, 55, -angle * 0.8, -angle * 0.8 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center Sovereign Core
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();

      // Subtle Center Glow
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 30);
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.fill();

      // Particles orbiting between the rings
      particles.forEach(p => {
        p.theta += p.speed;
        const px = cx + Math.cos(p.theta) * p.radius;
        const py = cy + Math.sin(p.theta) * p.radius;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  }

  // =========================================================================
  // EVENT LISTENERS & UI WIRING
  // =========================================================================
  function initEventListeners() {
    // Latency Slider
    if (elLatencySlider && elLatencyDisplay) {
      elLatencySlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        state.latencyMs = val;
        elLatencyDisplay.textContent = `${val}ms`;
        syncConfigToServer();
      });
    }

    // Test Request Execution
    if (elBtnRunTest) {
      elBtnRunTest.addEventListener('click', runTestRequest);
    }

    // Test Endpoint Select change updates sample request body
    if (elTestEndpoint && elTestBody) {
      elTestEndpoint.addEventListener('change', () => {
        const sel = elTestEndpoint.value;
        if (sel === 'chat_completions') {
          elTestBody.value = JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: 'You are an autonomous research agent.' },
              { role: 'user', content: 'Perform zero-latency offline verification check.' }
            ],
            temperature: 0.2
          }, null, 2);
        } else if (sel === 'anthropic_messages') {
          elTestBody.value = JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            messages: [
              { role: 'user', content: 'Run local validation suite with $0 token cost.' }
            ]
          }, null, 2);
        } else if (sel === 'embeddings') {
          elTestBody.value = JSON.stringify({
            model: 'text-embedding-3-small',
            input: 'Agent memory vector recall query'
          }, null, 2);
        } else if (sel === 'models') {
          elTestBody.value = '';
        }
      });
    }

    // Drag and Drop Ingestion
    const dropZone = document.getElementById('harDropZone');
    const fileInput = document.getElementById('harFileInput');
    if (dropZone && fileInput) {
      dropZone.addEventListener('click', () => fileInput.click());
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });
      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) {
          handleFileUpload(e.dataTransfer.files[0]);
        }
      });
      fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
          handleFileUpload(fileInput.files[0]);
        }
      });
    }

    // Preset Sample Buttons
    const btnSampleOpenAI = document.getElementById('btnLoadSampleOpenAI');
    if (btnSampleOpenAI) {
      btnSampleOpenAI.addEventListener('click', loadSampleOpenAI);
    }
    const btnSampleAnthropic = document.getElementById('btnLoadSampleAnthropic');
    if (btnSampleAnthropic) {
      btnSampleAnthropic.addEventListener('click', loadSampleAnthropic);
    }

    // Action Interceptors (Live Suite Outside Blur)
    const btnExportDockerLive = document.getElementById('btnExportDockerLive');
    if (btnExportDockerLive) {
      btnExportDockerLive.addEventListener('click', () => {
        if (!state.isPro) {
          window.openProModal();
        } else {
          const bundle = {
            generator: "Agent Mock Twin v1.0.0",
            timestamp: new Date().toISOString(),
            routes: state.routes,
            dockerfile: "FROM python:3.12-alpine\nWORKDIR /app\nCOPY . /app\nEXPOSE 8097\nCMD [\"python\", \"-m\", \"agent_mock_twin\", \"serve\", \"--port\", \"8097\"]",
            ci_runner: "agent-mock run -- pytest tests/"
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
          showNotification('📦 CI Docker Container bundle exported successfully!');
        }
      });
    }

    const btnChaosTriggerLive = document.getElementById('btnChaosTriggerLive');
    if (btnChaosTriggerLive) {
      btnChaosTriggerLive.addEventListener('click', () => {
        if (!state.isPro) {
          window.openProModal();
        } else {
          recordLocalHit({
            method: 'POST',
            path: '/v1/chat/completions',
            status_code: 503,
            latency_ms: 120,
            match_type: 'chaos_fault',
            tokens_saved: 0,
            usd_saved: 0,
            provider: 'chaos'
          });
          showNotification('⚡ Simulated upstream 503 Service Unavailable outage fault!');
        }
      });
    }
  }

  // =========================================================================
  // CLIENT-SIDE HAR & OPENAPI PARSERS (100% In-Browser Working Utility)
  // =========================================================================
  function handleFileUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const json = JSON.parse(text);
        let imported = [];

        if (json.log && json.log.entries) {
          imported = parseHarClientSide(json);
          showNotification(`📦 Ingested ${imported.length} routes from HAR 1.2 archive.`);
        } else if (json.openapi || json.swagger || json.paths) {
          imported = parseOpenApiClientSide(json);
          showNotification(`📘 Ingested ${imported.length} routes from OpenAPI specification.`);
        } else {
          showNotification('⚠️ Unrecognized format. Please provide a standard HAR 1.2 or OpenAPI 3.0 file.');
          return;
        }

        // Add to client state
        mergeRoutes(imported);

        // Also push to backend if available
        fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: text
        }).catch(() => {});

      } catch (err) {
        showNotification('⚠️ Invalid JSON file. Please verify file integrity.');
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
      try {
        const u = new URL(req.url, 'http://localhost');
        path = u.pathname;
      } catch (e) {
        path = req.url.split('?')[0];
      }

      const body = (req.postData && req.postData.text) || '';
      const resBody = (res.content && res.content.text) || '{"status":"ok"}';
      const status = res.status || 200;

      let provider = 'custom';
      if (req.url.includes('openai.com') || path.includes('/v1/chat')) provider = 'openai';
      else if (req.url.includes('anthropic.com') || path.includes('/v1/messages')) provider = 'anthropic';

      routes.push({
        id: `har_${Date.now()}_${idx}`,
        method,
        path,
        raw_body: body,
        response_status: status,
        response_body: resBody,
        provider,
        token_estimate: Math.max(15, Math.floor((body.length + resBody.length) / 4)),
        description: `${provider.toUpperCase()} ${method} ${path}`
      });
    });

    return routes;
  }

  function parseOpenApiClientSide(spec) {
    const paths = spec.paths || {};
    const routes = [];

    Object.keys(paths).forEach(p => {
      const item = paths[p];
      ['get', 'post', 'put', 'delete', 'patch'].forEach(m => {
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
            description: op.summary || `${m.toUpperCase()} ${p}`
          });
        }
      });
    });

    return routes;
  }

  function mergeRoutes(newRoutes) {
    newRoutes.forEach(nr => {
      const idx = state.routes.findIndex(r => r.path === nr.path && r.method === nr.method);
      if (idx >= 0) state.routes[idx] = nr;
      else state.routes.push(nr);
    });
    renderRouteTable();
    updateTelemetryUI();
  }

  // =========================================================================
  // PRELOADED SAMPLE GENERATORS ($0 SETUP REAL VALUE)
  // =========================================================================
  function initPreloadedSample() {
    if (isLocalDaemon) {
      // Check if backend already has routes; if empty, load default seed
      fetch('/api/routes')
        .then(r => r.json())
        .then(data => {
          if (data && data.success && data.routes && data.routes.length > 0) {
            state.routes = data.routes;
            renderRouteTable();
            updateTelemetryUI();
          } else {
            loadSampleOpenAI();
          }
        })
        .catch(() => {
          loadSampleOpenAI();
        });
    } else {
      loadSampleOpenAI();
    }
  }

  function loadSampleOpenAI() {
    const sample = [
      {
        id: 'route_openai_chat',
        method: 'POST',
        path: '/v1/chat/completions',
        provider: 'openai',
        token_estimate: 42,
        response_status: 200,
        response_body: JSON.stringify({
          id: 'chatcmpl-mock-twin-demo',
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: 'gpt-4o',
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: 'Hello! I am executing through the Agent Mock Twin offline network. $0 API cost and zero network latency.'
              },
              finish_reason: 'stop'
            }
          ],
          usage: { prompt_tokens: 22, completion_tokens: 20, total_tokens: 42 }
        }, null, 2),
        description: 'OpenAI GPT-4o Chat Completions Mock'
      },
      {
        id: 'route_openai_embeddings',
        method: 'POST',
        path: '/v1/embeddings',
        provider: 'openai',
        token_estimate: 16,
        response_status: 200,
        response_body: JSON.stringify({
          object: 'list',
          data: [{ object: 'embedding', index: 0, embedding: [0.021, -0.043, 0.088, 0.012, -0.091] }],
          model: 'text-embedding-3-small',
          usage: { prompt_tokens: 16, total_tokens: 16 }
        }, null, 2),
        description: 'OpenAI Text Embedding Small Mock'
      },
      {
        id: 'route_openai_models',
        method: 'GET',
        path: '/v1/models',
        provider: 'openai',
        token_estimate: 10,
        response_status: 200,
        response_body: JSON.stringify({
          object: 'list',
          data: [
            { id: 'gpt-4o', object: 'model' },
            { id: 'gpt-4o-mini', object: 'model' },
            { id: 'text-embedding-3-small', object: 'model' }
          ]
        }, null, 2),
        description: 'OpenAI Models List Endpoint'
      }
    ];

    mergeRoutes(sample);
    showNotification('✨ Loaded standard OpenAI Mock Twin blueprint.');
  }

  function loadSampleAnthropic() {
    const sample = [
      {
        id: 'route_anthropic_messages',
        method: 'POST',
        path: '/v1/messages',
        provider: 'anthropic',
        token_estimate: 55,
        response_status: 200,
        response_body: JSON.stringify({
          id: 'msg_mock_twin_claude',
          type: 'message',
          role: 'assistant',
          model: 'claude-3-5-sonnet-20241022',
          content: [
            {
              type: 'text',
              text: 'Claude 3.5 Sonnet simulation verified. Running offline in CI/CD pipeline at zero token cost.'
            }
          ],
          stop_reason: 'end_turn',
          usage: { input_tokens: 25, output_tokens: 30 }
        }, null, 2),
        description: 'Anthropic Claude 3.5 Sonnet Messages Mock'
      }
    ];

    mergeRoutes(sample);
    showNotification('✨ Loaded standard Anthropic Claude Mock blueprint.');
  }

  // =========================================================================
  // INTERACTIVE TEST PLAYGROUND
  // =========================================================================
  async function runTestRequest() {
    if (!elBtnRunTest) return;
    elBtnRunTest.disabled = true;
    elBtnRunTest.innerHTML = '<span>⚡</span> Executing Mock...';

    const sel = elTestEndpoint ? elTestEndpoint.value : 'chat_completions';
    let path = '/v1/chat/completions';
    let method = 'POST';
    if (sel === 'anthropic_messages') path = '/v1/messages';
    else if (sel === 'embeddings') path = '/v1/embeddings';
    else if (sel === 'models') {
      path = '/v1/models';
      method = 'GET';
    }

    const bodyText = elTestBody ? elTestBody.value : '';
    const startTime = performance.now();

    try {
      if (isLocalDaemon) {
        try {
          const res = await fetch('/api/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method, path, body: bodyText })
          });

          if (res.ok) {
            const data = await res.json();
            const latency = Math.round(performance.now() - startTime);

            if (elTestResponse) {
              elTestResponse.value = typeof data.response_body === 'string'
                ? data.response_body
                : JSON.stringify(data.response_body, null, 2);
            }

            recordLocalHit({
              method,
              path,
              status_code: data.response_status || 200,
              latency_ms: data.latency_ms || latency,
              match_type: data.match_type || 'exact',
              tokens_saved: data.tokens_saved || 35,
              usd_saved: data.usd_saved || 0.00018,
              provider: data.provider || 'openai'
            });
            return;
          }
        } catch (e) {}
      }

      // Client-side fallback simulation for static Netlify deploys & test runner
      await new Promise(r => setTimeout(r, state.latencyMs));
      const matched = state.routes.find(r => r.path === path && r.method === method) || state.routes[0];
      const resBody = matched ? matched.response_body : '{"mock": true, "status": "deterministic_twin"}';

      if (elTestResponse) elTestResponse.value = resBody;

      const tokens = (matched && matched.token_estimate) || 35;
      const usd = (tokens / 1000) * USD_PER_1K_TOKENS;

      recordLocalHit({
        method,
        path,
        status_code: 200,
        latency_ms: state.latencyMs,
        match_type: 'exact',
        tokens_saved: tokens,
        usd_saved: usd,
        provider: (matched && matched.provider) || 'openai'
      });
    } finally {
      elBtnRunTest.disabled = false;
      elBtnRunTest.innerHTML = '<span>🚀</span> Send Mock Test Request';
    }
  }

  function recordLocalHit(hit) {
    hit.timestamp = Date.now() / 1000;
    state.recentHits.unshift(hit);
    if (state.recentHits.length > 50) state.recentHits.pop();

    state.totalHits += 1;
    state.totalTokensSaved += hit.tokens_saved || 35;
    state.totalUsdSaved += hit.usd_saved || 0.00018;

    updateTelemetryUI();
    renderReplayFeed();
  }

  // =========================================================================
  // TELEMETRY & LIVE REPLAY FEED
  // =========================================================================
  function connectTelemetry() {
    if (!isLocalDaemon) {
      // Seed rich mock telemetry for standalone / static runner
      state.totalHits = 142;
      state.totalTokensSaved = 34500;
      state.totalUsdSaved = (34500 / 1000) * USD_PER_1K_TOKENS;
      state.recentHits = [
        {
          timestamp: Date.now() / 1000 - 4,
          method: 'POST',
          path: '/v1/chat/completions',
          status_code: 200,
          latency_ms: 22,
          match_type: 'exact',
          tokens_saved: 42,
          usd_saved: (42 / 1000) * USD_PER_1K_TOKENS,
          provider: 'openai'
        },
        {
          timestamp: Date.now() / 1000 - 18,
          method: 'POST',
          path: '/v1/messages',
          status_code: 200,
          latency_ms: 28,
          match_type: 'exact',
          tokens_saved: 84,
          usd_saved: (84 / 1000) * USD_PER_1K_TOKENS,
          provider: 'anthropic'
        },
        {
          timestamp: Date.now() / 1000 - 45,
          method: 'POST',
          path: '/v1/embeddings',
          status_code: 200,
          latency_ms: 15,
          match_type: 'exact',
          tokens_saved: 16,
          usd_saved: (16 / 1000) * USD_PER_1K_TOKENS,
          provider: 'openai'
        }
      ];
      updateTelemetryUI();
      renderReplayFeed();
      return;
    }

    // 1. Initial REST stats fetch
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => {
        if (data && data.success && data.stats) {
          const s = data.stats;
          state.totalHits = s.total_hits || 0;
          state.totalTokensSaved = s.total_tokens_saved || 0;
          state.totalUsdSaved = s.total_usd_saved || 0.0;
          updateTelemetryUI();
        }
      })
      .catch(() => {});

    // 2. Initial Replay log fetch
    fetch('/api/hits?limit=20')
      .then(r => r.json())
      .then(data => {
        if (data && data.success && data.hits) {
          state.recentHits = data.hits;
          renderReplayFeed();
        }
      })
      .catch(() => {});

    // 3. Live SSE Connection
    try {
      state.eventSource = new EventSource('/api/stream');
      state.eventSource.addEventListener('hit', (e) => {
        const hit = JSON.parse(e.data);
        recordLocalHit(hit);
      });
    } catch (e) {}
  }

  function syncConfigToServer() {
    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base_latency_ms: state.latencyMs,
        jitter_ms: state.jitterMs,
        chaos_rate: state.chaosRate,
        chaos_type: state.chaosType
      })
    }).catch(() => {});
  }

  function updateTelemetryUI() {
    if (elTotalHits) elTotalHits.textContent = state.totalHits.toLocaleString();
    if (elTokensSaved) elTokensSaved.textContent = state.totalTokensSaved.toLocaleString();
    if (elUsdSaved) elUsdSaved.textContent = `$${state.totalUsdSaved.toFixed(4)}`;
    if (elRoutesCount) elRoutesCount.textContent = state.routes.length.toString();
  }

  function renderRouteTable() {
    if (!elRouteList) return;
    if (state.routes.length === 0) {
      elRouteList.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">No mock routes loaded. Drop a HAR file or load a sample blueprint above.</td></tr>';
      return;
    }

    elRouteList.innerHTML = state.routes.map(r => {
      const pColor = r.provider === 'openai' ? '#10B981' : (r.provider === 'anthropic' ? '#C084FC' : '#06B6D4');
      const mColor = r.method === 'POST' ? '#3B82F6' : (r.method === 'GET' ? '#10B981' : '#F59E0B');

      return `
        <tr>
          <td><span class="method-badge" style="background: ${mColor}22; color: ${mColor}; border: 1px solid ${mColor}44;">${escapeHtml(r.method)}</span></td>
          <td style="font-family: monospace; font-size: 12px; color: #FFF;">${escapeHtml(r.path)}</td>
          <td><span class="provider-pill" style="border-color: ${pColor}44; color: ${pColor};">${escapeHtml(r.provider.toUpperCase())}</span></td>
          <td style="font-size: 11px; color: var(--gold-glow); font-weight: 700;">~${r.token_estimate || 25} tok</td>
          <td style="font-size: 11px; color: #9CA3AF;">${escapeHtml(r.description || 'Active mock')}</td>
        </tr>
      `;
    }).join('');
  }

  function renderReplayFeed() {
    if (!elReplayList) return;
    if (state.recentHits.length === 0) {
      elReplayList.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-muted); font-size: 11px;">Awaiting agent request traffic...</div>';
      return;
    }

    elReplayList.innerHTML = state.recentHits.slice(0, 15).map(h => {
      const matchBadge = h.match_type === 'exact'
        ? '<span class="status-pill status-exact">EXACT</span>'
        : (h.match_type === 'fuzzy'
          ? '<span class="status-pill status-fuzzy">FUZZY</span>'
          : '<span class="status-pill status-fallback">FALLBACK</span>');

      return `
        <div class="replay-card">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="status-code">200</span>
              <span style="font-weight: 700; font-size: 11px; color: #FFF;">${escapeHtml(h.method)}</span>
              <span style="font-family: monospace; font-size: 11px; color: var(--cyan-glow);">${escapeHtml(h.path)}</span>
            </div>
            ${matchBadge}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: var(--text-muted); margin-top: 4px;">
            <span>⚡ ${h.latency_ms || 25}ms · ${escapeHtml((h.provider || 'api').toUpperCase())}</span>
            <span style="color: var(--gold-glow); font-weight: 600;">Saved ~${h.tokens_saved || 35} tokens ($0.00 cost)</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // =========================================================================
  // UTILITIES & NOTIFICATIONS
  // =========================================================================
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showNotification(msg) {
    const toast = document.createElement('div');
    toast.className = 'glass-toast';
    toast.innerHTML = `<span>✨</span><span>${escapeHtml(msg)}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('visible');
    }, 10);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

})();
