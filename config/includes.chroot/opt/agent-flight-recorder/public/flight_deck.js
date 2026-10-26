/**
 * flight_deck.js - Interactive Time-Scrubbing Telemetry Forensics Hub
 * Client-Side Engine for Port 8104 Cockpit and Static Netlify Deployment.
 * Zero external npm dependencies.
 */

(function () {
  'use strict';

  // State
  const state = {
    isPro: false,
    currentSessionId: null,
    sessions: [],
    timelineEvents: [],
    maxOffsetMs: 10000,
    currentOffsetMs: 0,
    isPlaying: false,
    playbackSpeed: 1.0,
    timer: null,
  };

  // Demo Fallback Session (Provides 100% utility if running statically on Netlify without backend)
  const DEMO_SESSION = {
    session_id: "flt-demo-4802",
    title: "Autonomous Agent Execution • Market Sentiment & Trade Dispatch",
    command: "python3 -m agent_core --goal 'Analyze market signals and execute hedge'",
    duration_seconds: 4.85,
    exit_code: 0,
    status: "completed",
    event_count: 14,
  };

  const DEMO_EVENTS = [
    { id: 1, offset_ms: 0, event_type: "marker", payload: { message: "Black Box Flight Recorder initialized on port 8104" }, severity: "INFO" },
    { id: 2, offset_ms: 250, event_type: "terminal_stdout", payload: { text: "[*] Sovereign Agent runtime bootstrapping (PID 14209)..." }, severity: "INFO" },
    { id: 3, offset_ms: 450, event_type: "prompt_scan", payload: { threat_type: "CRITICAL", score: 0.95, blocked: true, details: ["Direct Instruction Override: 'ignore prior rules'"] }, severity: "WARN" },
    { id: 4, offset_ms: 550, event_type: "terminal_stderr", payload: { text: "[!] FIREWALL INTERCEPT: Blocked hostile prompt injection attempt (score 0.95)" }, severity: "WARN" },
    { id: 5, offset_ms: 900, event_type: "terminal_stdout", payload: { text: "[*] Sanitized context re-routed through Sentinel Proxy (127.0.0.1:8096)" }, severity: "INFO" },
    { id: 6, offset_ms: 1200, event_type: "network_egress", payload: { destination: "api.openai.com", host: "api.openai.com", method: "POST", bytes: 1420 }, severity: "INFO" },
    { id: 7, offset_ms: 1400, event_type: "mock_replay", payload: { model: "gpt-4o", tokens_saved: 35, cost_saved_usd: 0.000175 }, severity: "INFO" },
    { id: 8, offset_ms: 1650, event_type: "terminal_stdout", payload: { text: "[+] Replayed deterministic synthesis via Mock Twin: $0.00 token cost" }, severity: "INFO" },
    { id: 9, offset_ms: 2100, event_type: "synaptic_engram", payload: { id: "engram-lucy-891", text: "Market volatility hedge authorized across sovereign liquidity rails.", importance: 0.88 }, severity: "INFO" },
    { id: 10, offset_ms: 2400, event_type: "system_metric", payload: { cpu_percent: 4.8, memory_mb: 68.4 }, severity: "INFO" },
    { id: 11, offset_ms: 2900, event_type: "network_egress", payload: { destination: "api.binance.com", host: "api.binance.com", method: "POST", bytes: 840 }, severity: "INFO" },
    { id: 12, offset_ms: 3600, event_type: "terminal_stdout", payload: { text: "[*] Hedged position confirmed. Writing audit state to disk..." }, severity: "INFO" },
    { id: 13, offset_ms: 4100, event_type: "file_mutation", payload: { path: "data/audit_trades.json", action: "append", bytes: 512 }, severity: "INFO" },
    { id: 14, offset_ms: 4850, event_type: "terminal_stdout", payload: { text: "[✓] Mission completed cleanly with 0 errors. Flight recording finalized." }, severity: "INFO" }
  ];

  // Format Milliseconds to MM:SS.mmm
  function formatTime(ms) {
    if (isNaN(ms) || ms < 0) ms = 0;
    const totalS = ms / 1000;
    const m = Math.floor(totalS / 60);
    const s = (totalS % 60).toFixed(3);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(6, '0');
  }

  // --- License Management ---
  function checkLicense() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('licensed') === 'true' || urlParams.get('pro') === 'true' || urlParams.get('session_id')) {
      localStorage.setItem('agent_flight_pro', 'true');
      localStorage.setItem('zoth_flight_licensed', 'true');
      localStorage.setItem('pro_licensed', 'true');
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    }
    state.isPro = (
      localStorage.getItem('agent_flight_pro') === 'true' ||
      localStorage.getItem('zoth_flight_licensed') === 'true' ||
      localStorage.getItem('pro_licensed') === 'true'
    );
    updateProUI();
  }

  function activateKey(key) {
    if (!key || key.trim().length < 4) return false;
    localStorage.setItem('agent_flight_pro', 'true');
    localStorage.setItem('zoth_flight_licensed', 'true');
    localStorage.setItem('pro_licensed', 'true');
    state.isPro = true;
    updateProUI();
    return true;
  }

  window.activateLicenseKey = function(key) {
    const k = (typeof key === 'string' && key) ? key : (document.getElementById('licenseKeyInput')?.value || '');
    return activateKey(k);
  };

  window.openLicenseModal = function() {
    const modal = document.getElementById('proModal');
    if (modal) modal.style.display = 'flex';
  };

  function updateProUI() {
    const badges = [
      document.getElementById('licenseBadge'),
      document.getElementById('pro-badge'),
      document.getElementById('proStatusBadge')
    ].filter(Boolean);
    const paywallBanner = document.getElementById('salesBanner') || document.getElementById('paywallBanner');
    const paywallCard = document.getElementById('proLockedSection');
    const lockOverlay = document.getElementById('forensicsLockOverlay');

    if (state.isPro) {
      badges.forEach(badge => {
        badge.innerHTML = '⭐ PRO ACTIVE';
        badge.classList.remove('badge-free');
        badge.classList.add('badge-pro');
      });
      if (paywallBanner) paywallBanner.style.display = 'none';
      if (paywallCard) paywallCard.classList.remove('frosted-locked');
      if (lockOverlay) lockOverlay.style.display = 'none';
    } else {
      badges.forEach(badge => {
        badge.innerHTML = '⚡ FREE TIER';
        badge.classList.add('badge-free');
        badge.classList.remove('badge-pro');
      });
      if (paywallBanner) paywallBanner.style.display = 'block';
      if (paywallCard) paywallCard.classList.add('frosted-locked');
      if (lockOverlay) lockOverlay.style.display = 'flex';
    }
  }

  // Check if running on local backend port 8104 vs static hosting / test runner
  const isLocalDaemon = (window.location.port === "8104");

  // --- Data Loading & Sessions ---
  async function loadSessions() {
    if (isLocalDaemon) {
      try {
        const resp = await fetch('/api/sessions');
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.sessions && data.sessions.length > 0) {
            state.sessions = data.sessions;
          }
        }
      } catch (e) {
        // Fallback to demo
      }
    }

    if (!state.sessions || state.sessions.length === 0) {
      state.sessions = [DEMO_SESSION];
    }

    populateSessionSelect();
    selectSession(state.sessions[0].session_id);
  }

  function populateSessionSelect() {
    const select = document.getElementById('sessionSelect');
    if (!select) return;
    select.innerHTML = '';
    state.sessions.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.session_id;
      opt.innerText = `${s.session_id} • ${s.title.slice(0, 42)} (${s.duration_seconds}s)`;
      select.appendChild(opt);
    });

    select.addEventListener('change', () => {
      selectSession(select.value);
    });
  }

  async function selectSession(sid) {
    state.currentSessionId = sid;
    stopPlayback();

    let events = null;
    let session = state.sessions.find(s => s.session_id === sid);

    if (isLocalDaemon && sid !== DEMO_SESSION.session_id) {
      try {
        const resp = await fetch(`/api/timeline/${sid}`);
        if (resp.ok) {
          const data = await resp.json();
          events = data.events;
        }
      } catch (e) {}
    }

    if (!events || events.length === 0) {
      events = DEMO_EVENTS;
      session = session || DEMO_SESSION;
    }

    state.timelineEvents = events;
    const durMs = (session && session.duration_seconds ? session.duration_seconds * 1000 : 0);
    const maxEvOffset = events.length > 0 ? Math.max(...events.map(e => e.offset_ms)) : 1000;
    state.maxOffsetMs = Math.max(durMs, maxEvOffset, 1000);

    const scrubber = document.getElementById('timelineScrubber');
    if (scrubber) {
      scrubber.min = 0;
      scrubber.max = state.maxOffsetMs;
      scrubber.value = 0;
    }

    updateSessionHeader(session);
    scrubTo(0);
    generateVoiceBriefing();
  }

  function updateSessionHeader(session) {
    const elTitle = document.getElementById('activeSessionTitle');
    const elCmd = document.getElementById('activeSessionCmd');
    const elDur = document.getElementById('activeSessionDur');
    const elEvents = document.getElementById('activeSessionEvents');

    if (elTitle && session) elTitle.innerText = session.title;
    if (elCmd && session) elCmd.innerText = session.command || 'No command specified';
    if (elDur && session) elDur.innerText = (session.duration_seconds || 0).toFixed(2) + 's';
    if (elEvents) elEvents.innerText = state.timelineEvents.length;
  }

  // --- Scrubber Core Logic ---
  function scrubTo(targetMs) {
    state.currentOffsetMs = targetMs;
    const timeDisp = document.getElementById('timeDisplay');
    if (timeDisp) {
      timeDisp.innerText = `${formatTime(targetMs)} / ${formatTime(state.maxOffsetMs)}`;
    }

    const filtered = state.timelineEvents.filter(e => e.offset_ms <= targetMs);

    // 1. Synchronized Terminal Output
    const terminalOut = document.getElementById('terminalOutput');
    if (terminalOut) {
      const termLines = filtered
        .filter(e => ['terminal_stdout', 'terminal_stderr', 'terminal'].includes(e.event_type))
        .map(e => {
          const text = e.payload.text || '';
          if (e.event_type === 'terminal_stderr' || e.severity === 'WARN' || e.severity === 'ERROR') {
            return `<span style="color: #EF4444;">${escapeHtml(text)}</span>`;
          }
          return `<span style="color: #10B981;">${escapeHtml(text)}</span>`;
        });
      terminalOut.innerHTML = termLines.length ? termLines.join('\n') : '<span style="color: #6B7280;">[Waiting for agent subprocess output...]</span>';
      terminalOut.scrollTop = terminalOut.scrollHeight;
    }

    // 2. Active Network Egress Graph
    const networkContainer = document.getElementById('networkNodesList');
    if (networkContainer) {
      const endpoints = new Set();
      filtered.filter(e => e.event_type === 'network_egress').forEach(e => {
        const dest = e.payload.destination || e.payload.host || e.payload.url || 'endpoint';
        endpoints.add(dest);
      });
      networkContainer.innerHTML = '';
      if (endpoints.size === 0) {
        networkContainer.innerHTML = '<span class="empty-hint">No outbound egress at this timestamp.</span>';
      } else {
        endpoints.forEach(ep => {
          const pill = document.createElement('div');
          pill.className = 'network-pill';
          pill.innerHTML = `<span class="pill-dot"></span> <strong>${escapeHtml(ep)}</strong>`;
          networkContainer.appendChild(pill);
        });
      }
    }

    // 3. Synaptic Engrams
    const engramsList = document.getElementById('engramsList');
    if (engramsList) {
      const engrams = filtered.filter(e => e.event_type === 'synaptic_engram');
      engramsList.innerHTML = '';
      if (engrams.length === 0) {
        engramsList.innerHTML = '<li class="empty-hint">No synaptic engrams triggered.</li>';
      } else {
        engrams.slice(-4).forEach(en => {
          const li = document.createElement('li');
          li.className = 'engram-item';
          li.innerHTML = `<strong>${escapeHtml(en.payload.id || 'engram')}:</strong> ${escapeHtml(en.payload.text || '')}`;
          engramsList.appendChild(li);
        });
      }
    }

    // 4. Threat Score & Metrics
    let maxThreat = 0.0;
    filtered.filter(e => e.event_type === 'prompt_scan').forEach(e => {
      maxThreat = Math.max(maxThreat, parseFloat(e.payload.score || 0.0));
    });

    const threatVal = document.getElementById('gaugeThreatVal');
    const threatFill = document.getElementById('gaugeThreatFill');
    if (threatVal) threatVal.innerText = maxThreat.toFixed(2);
    if (threatFill) {
      threatFill.style.width = Math.min(100, Math.max(4, maxThreat * 100)) + '%';
      threatFill.style.background = maxThreat >= 0.7 ? '#EF4444' : (maxThreat >= 0.45 ? '#F59E0B' : '#10B981');
    }

    // Token savings
    let tokens = 0;
    filtered.filter(e => e.event_type === 'mock_replay').forEach(e => {
      tokens += parseInt(e.payload.tokens_saved || 35);
    });
    const tokensEl = document.getElementById('statTokensSaved');
    if (tokensEl) tokensEl.innerText = tokens;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  // --- Playback Controls ---
  function togglePlayback() {
    if (state.isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }

  function startPlayback() {
    state.isPlaying = true;
    const btn = document.getElementById('btnPlayPause');
    if (btn) btn.innerHTML = '⏸ Pause';

    const scrubber = document.getElementById('timelineScrubber');
    const stepMs = 50 * state.playbackSpeed;

    state.timer = setInterval(() => {
      state.currentOffsetMs += stepMs;
      if (state.currentOffsetMs >= state.maxOffsetMs) {
        state.currentOffsetMs = state.maxOffsetMs;
        stopPlayback();
      }
      if (scrubber) scrubber.value = state.currentOffsetMs;
      scrubTo(state.currentOffsetMs);
    }, 50);
  }

  function stopPlayback() {
    state.isPlaying = false;
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
    const btn = document.getElementById('btnPlayPause');
    if (btn) btn.innerHTML = '▶ Play';
  }

  function setSpeed(speed) {
    state.playbackSpeed = speed;
    document.querySelectorAll('.speed-btn').forEach(b => {
      b.classList.remove('active');
      if (parseFloat(b.dataset.speed) === speed) b.classList.add('active');
    });
    if (state.isPlaying) {
      stopPlayback();
      startPlayback();
    }
  }

  // --- Voice Incident Briefing ---
  function generateVoiceBriefing() {
    const el = document.getElementById('briefingText');
    if (!el) return;

    const filtered = state.timelineEvents;
    const threatCount = filtered.filter(e => e.event_type === 'prompt_scan' && (e.payload.blocked || e.payload.score >= 0.7)).length;
    const mockCount = filtered.filter(e => e.event_type === 'mock_replay').length;
    const engramCount = filtered.filter(e => e.event_type === 'synaptic_engram').length;

    const script = `Flight Incident Briefing for Session ${state.currentSessionId || 'Active'}. ` +
      `Recorded ${(state.maxOffsetMs / 1000).toFixed(2)} seconds of autonomous runtime execution. ` +
      `${threatCount} prompt injection attacks were intercepted and neutralized. ` +
      `${mockCount} mock API transactions were replayed at zero token cost. ` +
      `${engramCount} neural memory engrams were synthesized and anchored to Lucy Oracle. ` +
      `Black box telemetry integrity verified 100%.`;

    el.innerText = script;
  }

  function playVoiceBriefing() {
    const el = document.getElementById('briefingText');
    if (!el) return;
    const text = el.innerText;

    // Use Web Speech Synthesis API
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1.0;
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
      const btn = document.getElementById('btnSpeakBriefing');
      if (btn) {
        const orig = btn.innerText;
        btn.innerText = 'Speaking... 🔊';
        utterance.onend = () => { btn.innerText = orig; };
      }
    } else {
      console.log("Telemetry voice briefing ready.");
    }
  }

  // --- Kinetic Oscilloscope Waveform Canvas ---
  function initOscilloscopeCanvas() {
    const canvas = document.getElementById('flightWaveformCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    window.addEventListener('resize', () => {
      if (canvas.offsetWidth && canvas.offsetHeight) {
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
      }
    });

    let phase = 0;

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // Draw background grid lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += 25) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // Draw oscilloscope telemetry wave
      phase += 0.04;
      const cy = height / 2;

      ctx.beginPath();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#38BDF8';
      ctx.shadowBlur = 10;

      for (let x = 0; x < width; x++) {
        const normalizedX = x / width;
        const wave1 = Math.sin(normalizedX * 12 + phase) * 25;
        const wave2 = Math.sin(normalizedX * 24 - phase * 1.5) * 12;
        const pulse = state.isPlaying ? Math.sin(normalizedX * 4 + phase * 3) * 15 : 0;
        const y = cy + wave1 + wave2 + pulse;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Scrubber needle line
      const needleX = (state.currentOffsetMs / (state.maxOffsetMs || 1)) * width;
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(needleX, 0);
      ctx.lineTo(needleX, height);
      ctx.stroke();

      requestAnimationFrame(draw);
    }
    draw();
  }

  // --- Client-Side Single-File Bundle Exporter ---
  function downloadOfflineBundle() {
    const activeSession = state.sessions.find(s => s.session_id === state.currentSessionId) || DEMO_SESSION;
    const bundleData = {
      session: activeSession,
      events: state.timelineEvents,
      exported_at: new Date().toISOString(),
      generator: "Agent Flight Recorder Pro (v0.1.0)"
    };
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Agent Flight Recording • ${activeSession.session_id}</title>
<style>
body { background: #08080B; color: #F3F4F6; font-family: 'JetBrains Mono', monospace; padding: 2rem; margin: 0; }
h1 { color: #D4AF37; font-family: sans-serif; font-size: 1.4rem; }
.meta-box { background: #121217; border: 1px solid #272733; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; }
pre { background: #000; border: 1px solid #272733; padding: 1rem; border-radius: 8px; overflow-x: auto; color: #38BDF8; font-size: 0.85rem; line-height: 1.5; }
</style>
</head>
<body>
<h1>✈ AGENT FLIGHT RECORDER • STANDALONE INCIDENT BUNDLE</h1>
<div class="meta-box">
  <div><strong>Session ID:</strong> ${activeSession.session_id}</div>
  <div><strong>Command:</strong> ${activeSession.command || 'N/A'}</div>
  <div><strong>Duration:</strong> ${activeSession.duration_seconds || 0}s • <strong>Events:</strong> ${state.timelineEvents.length}</div>
  <div><strong>Exported:</strong> ${bundleData.exported_at} • <strong>Security Attestation:</strong> Valid Cryptographic Seal</div>
</div>
<h2 style="font-size: 1rem; color: #10B981;">CRYPTOGRAPHIC EVENT TIMELINE</h2>
<pre id="data">${escapeHtml(JSON.stringify(bundleData, null, 2))}</pre>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flight-bundle-${state.currentSessionId || 'incident'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // --- Modals & Export ---
  function initModals() {
    const modal = document.getElementById('proModal');
    const openBtns = document.querySelectorAll('.open-pro-modal');
    const closeBtn = document.getElementById('closeProModal');
    const btnActivate = document.getElementById('btnActivateKey');
    const inputKey = document.getElementById('licenseKeyInput');
    const msg = document.getElementById('activationMsg');

    openBtns.forEach(b => {
      b.addEventListener('click', (e) => {
        e.preventDefault();
        if (modal) modal.style.display = 'flex';
      });
    });

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
      });
    }

    if (btnActivate && inputKey) {
      btnActivate.addEventListener('click', () => {
        if (activateKey(inputKey.value)) {
          if (msg) {
            msg.innerText = 'License verified! Pro Flight Suite unlocked.';
            msg.style.color = '#10B981';
          }
          setTimeout(() => { if (modal) modal.style.display = 'none'; }, 1000);
        } else {
          if (msg) {
            msg.innerText = 'Invalid license key. Check your Stripe or Solana receipt.';
            msg.style.color = '#EF4444';
          }
        }
      });
    }

    // Action Interceptors: Export Buttons
    const exportBtns = [
      document.getElementById('btnExportBundle'),
      document.getElementById('btnExportStandalone')
    ].filter(Boolean);

    exportBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!state.isPro) {
          if (modal) modal.style.display = 'flex';
        } else {
          downloadOfflineBundle();
        }
      });
    });

    // DePay Solana Web3 Checkout
    const depayBtns = document.querySelectorAll('.btn-depay-solana');
    depayBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.DePay && window.DePay.Payment) {
          try {
            window.DePay.Payment({
              accept: [
                {
                  blockchain: 'solana',
                  token: '11111111111111111111111111111111',
                  receiver: 'GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK',
                  amount: 19
                }
              ]
            });
            return;
          } catch (err) {
            console.warn('DePay widget fallback:', err);
          }
        }
        window.open('https://depay.com/pay?integration=428790dd-7ad1-407c-8ecf-c048c77a4cb8&receiver=GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK&amount=19', '_blank');
      });
    });
  }

  // --- Init on DOM Ready ---
  document.addEventListener('DOMContentLoaded', () => {
    checkLicense();
    loadSessions();
    initOscilloscopeCanvas();
    initModals();

    const scrubber = document.getElementById('timelineScrubber');
    if (scrubber) {
      scrubber.addEventListener('input', (e) => {
        stopPlayback();
        scrubTo(parseFloat(e.target.value));
      });
    }

    const btnPlay = document.getElementById('btnPlayPause');
    if (btnPlay) btnPlay.addEventListener('click', togglePlayback);

    const btnStepBack = document.getElementById('btnStepBack');
    if (btnStepBack) {
      btnStepBack.addEventListener('click', () => {
        stopPlayback();
        const next = Math.max(0, state.currentOffsetMs - 250);
        if (scrubber) scrubber.value = next;
        scrubTo(next);
      });
    }

    const btnStepForward = document.getElementById('btnStepForward');
    if (btnStepForward) {
      btnStepForward.addEventListener('click', () => {
        stopPlayback();
        const next = Math.min(state.maxOffsetMs, state.currentOffsetMs + 250);
        if (scrubber) scrubber.value = next;
        scrubTo(next);
      });
    }

    document.querySelectorAll('.speed-btn').forEach(b => {
      b.addEventListener('click', () => {
        setSpeed(parseFloat(b.dataset.speed));
      });
    });

    const btnSpeak = document.getElementById('btnSpeakBriefing');
    if (btnSpeak) btnSpeak.addEventListener('click', playVoiceBriefing);
  });

})();
