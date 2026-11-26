/**
 * flight_deck.js - Interactive Time-Scrubbing Telemetry Forensics Hub (v2.6.0)
 * Live SSE + SHA-256 Hash-Chain Verification + Raw Event Inspector + Multi-Format Export.
 * Zero external npm dependencies.
 * Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform
 */

(function () {
  'use strict';

  const state = {
    daemonOnline: false,
    daemonVersion: '2.6.0',
    currentSessionId: null,
    sessions: [],
    timelineEvents: [],
    chainStatus: null,
    maxOffsetMs: 1000,
    currentOffsetMs: 0,
    isPlaying: false,
    playbackSpeed: 1.0,
    timer: null,
    sse: null,
    eventTypeFilter: 'all',
    searchQuery: '',
  };

  // Offline Preview Sample (used ONLY when /api/health is unreachable, e.g., static Netlify)
  const OFFLINE_DEMO_SESSION = {
    session_id: 'flt-offline-preview',
    title: 'Offline Preview • Agent Execution Sample (Start :8104 for Live Data)',
    command: 'agent-flight-recorder record -- python3 -m agent_core',
    duration_seconds: 4.85,
    exit_code: 0,
    status: 'completed',
    event_count: 10,
  };

  const OFFLINE_DEMO_EVENTS = [
    { id: 1, seq: 1, offset_ms: 0, event_type: 'marker', payload: { message: 'Offline preview session loaded (local daemon unreachable)' }, severity: 'INFO', event_hash: 'preview00000001' },
    { id: 2, seq: 2, offset_ms: 300, event_type: 'terminal_stdout', payload: { text: '[*] Agent runtime initialized in local loopback sandbox' }, severity: 'INFO', event_hash: 'preview00000002' },
    { id: 3, seq: 3, offset_ms: 650, event_type: 'prompt_scan', payload: { threat_type: 'CRITICAL', score: 0.94, blocked: true, details: ['Blocked instruction override'] }, severity: 'WARN', event_hash: 'preview00000003' },
    { id: 4, seq: 4, offset_ms: 820, event_type: 'terminal_stderr', payload: { text: '[!] Prompt firewall blocked hostile payload (score 0.94)' }, severity: 'WARN', event_hash: 'preview00000004' },
    { id: 5, seq: 5, offset_ms: 1400, event_type: 'network_egress', payload: { destination: 'api.openai.com', host: 'api.openai.com', method: 'POST', bytes: 1420 }, severity: 'INFO', event_hash: 'preview00000005' },
    { id: 6, seq: 6, offset_ms: 1850, event_type: 'mock_replay', payload: { model: 'gpt-4o', tokens_saved: 45 }, severity: 'INFO', event_hash: 'preview00000006' },
    { id: 7, seq: 7, offset_ms: 2300, event_type: 'capsule_execution', payload: { capsule_id: 'cap-demo-01', command: 'python3 verify.py', exit_code: 0, status: 'success' }, severity: 'INFO', event_hash: 'preview00000007' },
    { id: 8, seq: 8, offset_ms: 2950, event_type: 'synaptic_engram', payload: { id: 'engram-891', text: 'Verified tool receipt persisted to local memory.', importance: 0.88 }, severity: 'INFO', event_hash: 'preview00000008' },
    { id: 9, seq: 9, offset_ms: 3800, event_type: 'file_mutation', payload: { path: 'data/audit_log.json', action: 'append', bytes: 512 }, severity: 'INFO', event_hash: 'preview00000009' },
    { id: 10, seq: 10, offset_ms: 4850, event_type: 'terminal_stdout', payload: { text: '[✓] Execution completed with exit code 0.' }, severity: 'INFO', event_hash: 'preview00000010' },
  ];

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function safeJsonForScript(obj) {
    return JSON.stringify(obj, null, 2)
      .replace(/&/g, '\\u0026')
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');
  }

  function neutralizeCsvCell(val) {
    const s = val === null || val === undefined ? '' : String(val);
    const safe = /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
    return '"' + safe.replace(/"/g, '""') + '"';
  }

  function formatTime(ms) {
    if (isNaN(ms) || ms < 0) ms = 0;
    const totalS = ms / 1000;
    const m = Math.floor(totalS / 60);
    const s = (totalS % 60).toFixed(3);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(6, '0');
  }

  // --- Theme Toggle ---
  function updateThemeButton() {
    const btn = document.getElementById('btnThemeToggle');
    if (!btn) return;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    btn.textContent = isLight ? '☾ Dark' : '☀ Light';
    btn.setAttribute('aria-label', isLight ? 'Switch to Obsidian Dark Theme' : 'Switch to Editorial Ivory Light Theme');
  }

  function initThemeToggle() {
    updateThemeButton();
    const btn = document.getElementById('btnThemeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      const next = cur === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('afr_theme', next); } catch (e) {}
      updateThemeButton();
    });
  }

  function setDaemonStatus(online, port, version) {
    state.daemonOnline = online;
    const pill = document.getElementById('daemonStatusPill');
    const txt = document.getElementById('daemonStatusText');
    if (!pill || !txt) return;
    pill.classList.remove('live', 'offline');
    if (online) {
      pill.classList.add('live');
      txt.textContent = `LIVE :${port} (v${version || '2.6.0'})`;
    } else {
      pill.classList.add('offline');
      txt.textContent = 'Offline Preview';
    }
  }

  async function probeDaemonHealth() {
    try {
      const resp = await fetch('/api/health', { cache: 'no-store' });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.service === 'agent-flight-recorder') {
          state.daemonVersion = data.version || '2.6.0';
          setDaemonStatus(true, data.port || window.location.port || 8104, state.daemonVersion);
          return true;
        }
      }
    } catch (e) {}
    setDaemonStatus(false);
    return false;
  }

  // --- Live SSE Telemetry Subscription ---
  function connectSSE() {
    if (!state.daemonOnline || typeof EventSource === 'undefined') return;
    if (state.sse) {
      try { state.sse.close(); } catch (e) {}
    }
    try {
      const es = new EventSource('/api/stream');
      state.sse = es;
      es.addEventListener('timeline_event', (ev) => {
        try {
          const item = JSON.parse(ev.data);
          handleLiveEvent(item);
        } catch (e) {}
      });
      es.addEventListener('session_ended', () => {
        refreshSessionsList(false);
      });
    } catch (e) {}
  }

  function handleLiveEvent(ev) {
    if (!ev || !ev.session_id) return;
    const known = state.sessions.find((s) => s.session_id === ev.session_id);
    if (!known) {
      refreshSessionsList(false);
    } else {
      known.event_count = (known.event_count || 0) + 1;
    }

    if (ev.session_id === state.currentSessionId) {
      const exists = state.timelineEvents.some((x) => x.id && x.id === ev.id);
      if (!exists) {
        state.timelineEvents.push(ev);
        const evOffset = Number(ev.offset_ms) || 0;
        const wasAtEnd = state.currentOffsetMs >= state.maxOffsetMs - 50;
        if (evOffset > state.maxOffsetMs) {
          state.maxOffsetMs = Math.max(evOffset, 1000);
          const scrubber = document.getElementById('timelineScrubber');
          if (scrubber) scrubber.max = state.maxOffsetMs;
        }
        const evCountEl = document.getElementById('activeSessionEvents');
        if (evCountEl) evCountEl.textContent = String(state.timelineEvents.length);
        if (wasAtEnd) {
          state.currentOffsetMs = state.maxOffsetMs;
          const scrubber = document.getElementById('timelineScrubber');
          if (scrubber) scrubber.value = state.currentOffsetMs;
        }
        scrubTo(state.currentOffsetMs);
        verifyCurrentSessionChain();
      }
    }
  }

  // --- Sessions & Timeline Loading ---
  async function refreshSessionsList(autoSelectFirst) {
    if (state.daemonOnline) {
      try {
        const resp = await fetch('/api/sessions?limit=100', { cache: 'no-store' });
        if (resp.ok) {
          const data = await resp.json();
          state.sessions = Array.isArray(data.sessions) ? data.sessions : [];
        }
      } catch (e) {}
    } else {
      state.sessions = [OFFLINE_DEMO_SESSION];
    }

    populateSessionSelect();
    if (autoSelectFirst) {
      if (state.sessions.length > 0) {
        await selectSession(state.sessions[0].session_id);
      } else {
        state.currentSessionId = null;
        state.timelineEvents = [];
        state.maxOffsetMs = 1000;
        updateSessionHeader(null);
        scrubTo(0);
        updateChainBadge(null);
      }
    }
  }

  function populateSessionSelect() {
    const select = document.getElementById('sessionSelect');
    if (!select) return;
    const prev = state.currentSessionId;
    select.textContent = '';

    if (!state.sessions || state.sessions.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'No sessions recorded yet — ingest or record to begin';
      select.appendChild(opt);
      return;
    }

    state.sessions.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s.session_id;
      const titleShort = String(s.title || 'Session').slice(0, 42);
      const dur = Number(s.duration_seconds || 0).toFixed(2);
      opt.textContent = `${s.session_id} • ${titleShort} (${dur}s, ${s.event_count || 0} ev)`;
      select.appendChild(opt);
    });

    if (prev && state.sessions.some((s) => s.session_id === prev)) {
      select.value = prev;
    }
  }

  async function selectSession(sid) {
    if (!sid) return;
    state.currentSessionId = sid;
    stopPlayback();

    const session = state.sessions.find((s) => s.session_id === sid) || null;
    let events = [];

    if (state.daemonOnline) {
      try {
        const resp = await fetch(`/api/timeline/${encodeURIComponent(sid)}`, { cache: 'no-store' });
        if (resp.ok) {
          const data = await resp.json();
          events = Array.isArray(data.events) ? data.events : [];
        }
      } catch (e) {}
    } else if (sid === OFFLINE_DEMO_SESSION.session_id) {
      events = OFFLINE_DEMO_EVENTS.slice();
    }

    state.timelineEvents = events;
    const durMs = session && session.duration_seconds ? Number(session.duration_seconds) * 1000 : 0;
    const maxEvOffset = events.length > 0 ? Math.max(...events.map((e) => Number(e.offset_ms) || 0)) : 0;
    state.maxOffsetMs = Math.max(durMs, maxEvOffset, 1000);

    const scrubber = document.getElementById('timelineScrubber');
    if (scrubber) {
      scrubber.min = 0;
      scrubber.max = state.maxOffsetMs;
      scrubber.value = state.maxOffsetMs;
    }

    updateSessionHeader(session);
    // Land at latest offset so recorded telemetry is immediately visible on load
    scrubTo(state.maxOffsetMs);
    await verifyCurrentSessionChain();
    await loadVoiceBriefing(sid);
  }

  function updateSessionHeader(session) {
    const elCmd = document.getElementById('activeSessionCmd');
    const elDur = document.getElementById('activeSessionDur');
    const elEvents = document.getElementById('activeSessionEvents');

    if (elCmd) elCmd.textContent = (session && session.command) ? session.command : (session ? session.title : 'No active session');
    if (elDur) elDur.textContent = ((session && Number(session.duration_seconds)) || 0).toFixed(2) + 's';
    if (elEvents) elEvents.textContent = String(state.timelineEvents.length);
  }

  // --- Real SHA-256 Hash Chain Verification ---
  function updateChainBadge(info) {
    const badge = document.getElementById('chainStatusBadge');
    if (!badge) return;
    badge.classList.remove('valid', 'invalid');
    if (!state.daemonOnline) {
      badge.textContent = 'SHA-256: Offline Preview';
      return;
    }
    if (!info) {
      badge.textContent = 'SHA-256: No Session';
      return;
    }
    const shortHash = String(info.head_hash || '').slice(0, 12);
    if (info.valid) {
      badge.classList.add('valid');
      badge.textContent = `SHA-256 VALID • ${shortHash}`;
      badge.title = `Verified ${info.event_count} events • Head: ${info.head_hash}`;
    } else {
      badge.classList.add('invalid');
      badge.textContent = `CHAIN BROKEN @ #${info.broken_at_event_id || '?'}`;
      badge.title = `Tamper detected: ${info.reason || 'hash mismatch'}`;
    }
  }

  async function verifyCurrentSessionChain() {
    if (!state.daemonOnline || !state.currentSessionId) {
      state.chainStatus = null;
      updateChainBadge(null);
      return;
    }
    try {
      const resp = await fetch(`/api/verify/${encodeURIComponent(state.currentSessionId)}`, { cache: 'no-store' });
      if (resp.ok) {
        state.chainStatus = await resp.json();
        updateChainBadge(state.chainStatus);
        return;
      }
    } catch (e) {}
    state.chainStatus = null;
    updateChainBadge(null);
  }

  // --- Scrubber Core Logic ---
  function scrubTo(targetMs) {
    state.currentOffsetMs = targetMs;
    const timeDisp = document.getElementById('timeDisplay');
    if (timeDisp) {
      timeDisp.textContent = `${formatTime(targetMs)} / ${formatTime(state.maxOffsetMs)}`;
    }

    const filtered = state.timelineEvents.filter((e) => (Number(e.offset_ms) || 0) <= targetMs);

    // 1. Synchronized Terminal Output
    const terminalOut = document.getElementById('terminalOutput');
    if (terminalOut) {
      const termLines = filtered
        .filter((e) => ['terminal_stdout', 'terminal_stderr', 'terminal'].includes(e.event_type))
        .map((e) => {
          const text = (e.payload && e.payload.text) || '';
          if (e.event_type === 'terminal_stderr' || e.severity === 'WARN' || e.severity === 'ERROR' || e.severity === 'CRITICAL') {
            return `<span style="color: var(--ruby);">${escapeHtml(text)}</span>`;
          }
          return `<span style="color: var(--emerald);">${escapeHtml(text)}</span>`;
        });
      terminalOut.innerHTML = termLines.length
        ? termLines.join('\n')
        : '<span style="color: var(--text-muted);">[No terminal output up to this offset...]</span>';
      terminalOut.scrollTop = terminalOut.scrollHeight;
    }

    // 2. Active Network Egress Graph
    const networkContainer = document.getElementById('networkNodesList');
    if (networkContainer) {
      const endpoints = new Set();
      filtered.filter((e) => e.event_type === 'network_egress').forEach((e) => {
        const dest = (e.payload && (e.payload.destination || e.payload.host || e.payload.url)) || 'endpoint';
        endpoints.add(dest);
      });
      networkContainer.textContent = '';
      if (endpoints.size === 0) {
        const hint = document.createElement('span');
        hint.className = 'empty-hint';
        hint.textContent = 'No outbound egress at this timestamp.';
        networkContainer.appendChild(hint);
      } else {
        endpoints.forEach((ep) => {
          const pill = document.createElement('div');
          pill.className = 'network-pill';
          const dot = document.createElement('span');
          dot.className = 'pill-dot';
          const strong = document.createElement('strong');
          strong.textContent = ep;
          pill.appendChild(dot);
          pill.appendChild(strong);
          networkContainer.appendChild(pill);
        });
      }
    }

    // 3. Synaptic Engrams
    const engramsList = document.getElementById('engramsList');
    if (engramsList) {
      const engrams = filtered.filter((e) => e.event_type === 'synaptic_engram');
      engramsList.textContent = '';
      if (engrams.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty-hint';
        li.textContent = 'No synaptic engrams triggered.';
        engramsList.appendChild(li);
      } else {
        engrams.slice(-5).forEach((en) => {
          const li = document.createElement('li');
          li.className = 'engram-item';
          const strong = document.createElement('strong');
          strong.textContent = `${(en.payload && en.payload.id) || 'engram'}: `;
          li.appendChild(strong);
          li.appendChild(document.createTextNode((en.payload && en.payload.text) || ''));
          engramsList.appendChild(li);
        });
      }
    }

    // 4. Threat Score & Token Savings
    let maxThreat = 0.0;
    filtered.filter((e) => e.event_type === 'prompt_scan').forEach((e) => {
      maxThreat = Math.max(maxThreat, parseFloat((e.payload && e.payload.score) || 0.0));
    });

    const threatVal = document.getElementById('gaugeThreatVal');
    const threatFill = document.getElementById('gaugeThreatFill');
    if (threatVal) threatVal.textContent = maxThreat.toFixed(2);
    if (threatFill) {
      threatFill.style.width = Math.min(100, Math.max(4, maxThreat * 100)) + '%';
      threatFill.style.background = maxThreat >= 0.7 ? 'var(--ruby)' : (maxThreat >= 0.45 ? 'var(--amber)' : 'var(--emerald)');
    }

    let tokens = 0;
    filtered.filter((e) => e.event_type === 'mock_replay').forEach((e) => {
      tokens += parseInt((e.payload && e.payload.tokens_saved) || 35, 10);
    });
    const tokensEl = document.getElementById('statTokensSaved');
    if (tokensEl) tokensEl.textContent = String(tokens);

    // 5. Raw Event Inspector
    renderRawInspector(filtered);
  }

  function renderRawInspector(eventsInWindow) {
    const listEl = document.getElementById('rawEventsList');
    const countEl = document.getElementById('inspectorCount');
    if (!listEl) return;

    const filterType = state.eventTypeFilter;
    const q = state.searchQuery.trim().toLowerCase();

    const matched = eventsInWindow.filter((ev) => {
      if (filterType !== 'all') {
        if (filterType === 'terminal') {
          if (!['terminal_stdout', 'terminal_stderr', 'terminal'].includes(ev.event_type)) return false;
        } else if (filterType === 'marker') {
          if (!['marker', 'custom_event'].includes(ev.event_type)) return false;
        } else if (ev.event_type !== filterType) {
          return false;
        }
      }
      if (q) {
        const hay = `${ev.event_type} ${ev.severity} ${ev.event_hash || ''} ${JSON.stringify(ev.payload || {})}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (countEl) {
      countEl.textContent = `${matched.length} of ${eventsInWindow.length} events shown`;
    }

    listEl.textContent = '';
    if (matched.length === 0) {
      const hint = document.createElement('div');
      hint.className = 'empty-hint';
      hint.textContent = state.timelineEvents.length === 0
        ? '0 events recorded in this session yet.'
        : 'No events match the current scrubber position and filter.';
      listEl.appendChild(hint);
      return;
    }

    matched.slice().reverse().slice(0, 120).forEach((ev) => {
      const row = document.createElement('div');
      row.className = 'raw-event-row';

      const head = document.createElement('div');
      head.className = 'raw-event-head';

      const left = document.createElement('span');
      const typeSpan = document.createElement('span');
      typeSpan.className = 'ev-type-tag';
      typeSpan.textContent = `#${ev.seq || ev.id || 0} ${ev.event_type}`;
      left.appendChild(typeSpan);
      left.appendChild(document.createTextNode(` · T+${((Number(ev.offset_ms) || 0) / 1000).toFixed(3)}s `));

      const sev = document.createElement('span');
      sev.className = `ev-sev ${ev.severity || 'INFO'}`;
      sev.textContent = ev.severity || 'INFO';
      left.appendChild(sev);

      const right = document.createElement('span');
      right.className = 'ev-hash-tag';
      right.textContent = ev.event_hash ? `sha256:${String(ev.event_hash).slice(0, 12)}` : 'unhashed';

      head.appendChild(left);
      head.appendChild(right);

      const body = document.createElement('div');
      body.className = 'raw-event-payload';
      body.textContent = JSON.stringify(ev.payload || {});

      row.appendChild(head);
      row.appendChild(body);
      listEl.appendChild(row);
    });
  }

  // --- Playback Controls (with auto-rewind at end-of-tape) ---
  function togglePlayback() {
    if (state.isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }

  function startPlayback() {
    const scrubber = document.getElementById('timelineScrubber');
    if (state.currentOffsetMs >= state.maxOffsetMs) {
      state.currentOffsetMs = 0;
      if (scrubber) scrubber.value = 0;
      scrubTo(0);
    }

    state.isPlaying = true;
    const btn = document.getElementById('btnPlayPause');
    if (btn) btn.textContent = '⏸ Pause';

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
    if (btn) btn.textContent = '▶ Play';
  }

  function setSpeed(speed) {
    state.playbackSpeed = speed;
    document.querySelectorAll('.speed-btn').forEach((b) => {
      b.classList.toggle('active', parseFloat(b.dataset.speed) === speed);
    });
    if (state.isPlaying) {
      stopPlayback();
      startPlayback();
    }
  }

  // --- Incident Briefing ---
  async function loadVoiceBriefing(sid) {
    const el = document.getElementById('briefingText');
    if (!el) return;

    if (state.daemonOnline && sid) {
      try {
        const resp = await fetch(`/api/briefing/${encodeURIComponent(sid)}`, { cache: 'no-store' });
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.briefing_text) {
            el.textContent = data.briefing_text;
            return;
          }
        }
      } catch (e) {}
    }

    const filtered = state.timelineEvents;
    const threatCount = filtered.filter((e) => e.event_type === 'prompt_scan' && e.payload && (e.payload.blocked || e.payload.score >= 0.7)).length;
    const mockCount = filtered.filter((e) => e.event_type === 'mock_replay').length;
    const engramCount = filtered.filter((e) => e.event_type === 'synaptic_engram').length;

    el.textContent =
      `Flight Incident Briefing for Session ${sid || 'None'}. ` +
      `Recorded ${(state.maxOffsetMs / 1000).toFixed(2)} seconds (${filtered.length} events). ` +
      `${threatCount} prompt threats flagged, ${mockCount} mock replays recorded, and ${engramCount} synaptic engrams logged.`;
  }

  function playVoiceBriefing() {
    const el = document.getElementById('briefingText');
    if (!el) return;
    const text = el.textContent;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1.0;
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
      const btn = document.getElementById('btnSpeakBriefing');
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = 'Speaking... 🔊';
        utterance.onend = () => { btn.textContent = orig; };
      }
    }
  }

  // --- Theme-Aware Kinetic Oscilloscope Waveform Canvas ---
  function initOscilloscopeCanvas() {
    const canvas = document.getElementById('flightWaveformCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = canvas.offsetWidth || 420;
    let height = canvas.height = canvas.offsetHeight || 190;

    window.addEventListener('resize', () => {
      if (canvas.offsetWidth && canvas.offsetHeight) {
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
      }
    });

    let phase = 0;
    function draw() {
      const styles = getComputedStyle(document.documentElement);
      const gridColor = styles.getPropertyValue('--grid-line').trim() || 'rgba(56, 189, 248, 0.1)';
      const waveColor = styles.getPropertyValue('--telemetry-blue').trim() || '#38BDF8';
      const needleColor = styles.getPropertyValue('--gold').trim() || '#D4AF37';

      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 28) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += 24) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      phase += 0.035;
      const cy = height / 2;

      ctx.beginPath();
      ctx.strokeStyle = waveColor;
      ctx.lineWidth = 2.2;
      for (let x = 0; x < width; x++) {
        const nx = x / width;
        const w1 = Math.sin(nx * 12 + phase) * 22;
        const w2 = Math.sin(nx * 24 - phase * 1.4) * 10;
        const pulse = state.isPlaying ? Math.sin(nx * 4 + phase * 3) * 14 : 0;
        const y = cy + w1 + w2 + pulse;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const needleX = Math.max(1, Math.min(width - 1, (state.currentOffsetMs / (state.maxOffsetMs || 1)) * width));
      ctx.strokeStyle = needleColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(needleX, 0);
      ctx.lineTo(needleX, height);
      ctx.stroke();

      requestAnimationFrame(draw);
    }
    draw();
  }

  // --- Multi-Format Exporters (Server-backed when online; safe client fallback offline) ---
  function triggerBlobDownload(content, mime, filename) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportFormat(fmt) {
    const sid = state.currentSessionId;
    if (state.daemonOnline && sid) {
      const endpoint = fmt === 'html' ? '/api/export/bundle' : `/api/export/${fmt}`;
      window.location.href = `${endpoint}?session_id=${encodeURIComponent(sid)}`;
      return;
    }

    const activeSession = state.sessions.find((s) => s.session_id === sid) || OFFLINE_DEMO_SESSION;
    const safeFile = String(activeSession.session_id || 'incident').replace(/[^A-Za-z0-9._-]/g, '_');

    if (fmt === 'json') {
      const payload = {
        schema: 'agent-flight-recorder/v2.6.0',
        exported_at_utc: new Date().toISOString(),
        session: activeSession,
        hash_chain: state.chainStatus || { valid: false, head_hash: 'offline-preview' },
        events: state.timelineEvents,
      };
      triggerBlobDownload(JSON.stringify(payload, null, 2), 'application/json;charset=utf-8', `flight-incident-${safeFile}.json`);
      return;
    }

    if (fmt === 'csv') {
      const header = ['session_id', 'event_id', 'seq', 'offset_ms', 'event_type', 'severity', 'event_hash', 'payload_json'];
      const rows = [header.join(',')];
      state.timelineEvents.forEach((ev) => {
        rows.push([
          neutralizeCsvCell(activeSession.session_id),
          neutralizeCsvCell(ev.id || ''),
          neutralizeCsvCell(ev.seq || ''),
          neutralizeCsvCell(ev.offset_ms || 0),
          neutralizeCsvCell(ev.event_type || ''),
          neutralizeCsvCell(ev.severity || 'INFO'),
          neutralizeCsvCell(ev.event_hash || ''),
          neutralizeCsvCell(JSON.stringify(ev.payload || {})),
        ].join(','));
      });
      triggerBlobDownload(rows.join('\n') + '\n', 'text/csv;charset=utf-8', `flight-incident-${safeFile}.csv`);
      return;
    }

    if (fmt === 'markdown') {
      const lines = [
        `# Agent Flight Recorder Report — \`${activeSession.session_id}\``,
        '',
        `- **Title:** ${activeSession.title || 'Session'}`,
        `- **Events:** ${state.timelineEvents.length}`,
        `- **Generator:** agent-flight-recorder v2.6.0 (Engineered by Neal Frazier Tech @1nc0gn30 • NullAI Platform)`,
        '',
        '| Seq | Offset (ms) | Type | Severity | Payload |',
        '| :-: | --: | :--- | :---: | :--- |',
      ];
      state.timelineEvents.forEach((ev, i) => {
        const p = JSON.stringify(ev.payload || {}).replace(/\|/g, '\\|');
        lines.push(`| ${ev.seq || i + 1} | ${ev.offset_ms || 0} | \`${ev.event_type}\` | \`${ev.severity || 'INFO'}\` | \`${p}\` |`);
      });
      triggerBlobDownload(lines.join('\n') + '\n', 'text/markdown;charset=utf-8', `flight-incident-${safeFile}.md`);
      return;
    }

    // XSS-safe offline HTML fallback
    const safeSid = escapeHtml(activeSession.session_id);
    const safeCmd = escapeHtml(activeSession.command || 'N/A');
    const bundleJson = safeJsonForScript({
      session: activeSession,
      events: state.timelineEvents,
      hash_chain: state.chainStatus || { valid: false, head_hash: 'offline-preview' },
      exported_at: new Date().toISOString(),
      generator: 'Agent Flight Recorder v2.6.0',
    });
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Agent Flight Recording • ${safeSid}</title>
<style>
body { background: #08080B; color: #F3F4F6; font-family: ui-monospace, monospace; padding: 1.5rem; margin: 0; }
h1 { color: #D4AF37; font-family: sans-serif; font-size: 1.3rem; }
.meta-box { background: #121217; border: 1px solid #272733; padding: 1rem; border-radius: 8px; margin-bottom: 1.25rem; }
pre { background: #05060A; border: 1px solid #272733; padding: 1rem; border-radius: 8px; overflow-x: auto; color: #38BDF8; font-size: 0.82rem; }
</style>
</head>
<body>
<h1>AGENT FLIGHT RECORDER v2.6.0 • OFFLINE INCIDENT BUNDLE</h1>
<div class="meta-box">
  <div><strong>Session ID:</strong> ${safeSid}</div>
  <div><strong>Command:</strong> ${safeCmd}</div>
  <div><strong>Events:</strong> ${state.timelineEvents.length} • <strong>Chain:</strong> Offline Preview (unverified)</div>
</div>
<pre id="bundleOut"></pre>
<script>
const BUNDLE = ${bundleJson};
document.getElementById('bundleOut').textContent = JSON.stringify(BUNDLE, null, 2);
</script>
</body>
</html>`;
    triggerBlobDownload(htmlContent, 'text/html;charset=utf-8', `flight-incident-${safeFile}.html`);
  }

  // --- Init on DOM Ready ---
  document.addEventListener('DOMContentLoaded', async () => {
    initThemeToggle();
    initOscilloscopeCanvas();

    const select = document.getElementById('sessionSelect');
    if (select) {
      select.addEventListener('change', () => {
        if (select.value) selectSession(select.value);
      });
    }

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

    document.querySelectorAll('.speed-btn').forEach((b) => {
      b.addEventListener('click', () => setSpeed(parseFloat(b.dataset.speed)));
    });

    const typeFilter = document.getElementById('eventTypeFilter');
    if (typeFilter) {
      typeFilter.addEventListener('change', () => {
        state.eventTypeFilter = typeFilter.value;
        scrubTo(state.currentOffsetMs);
      });
    }

    const searchInput = document.getElementById('eventSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        state.searchQuery = searchInput.value;
        scrubTo(state.currentOffsetMs);
      });
    }

    const btnVerify = document.getElementById('btnVerifyChain');
    if (btnVerify) btnVerify.addEventListener('click', verifyCurrentSessionChain);

    const bindExport = (id, fmt) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', (e) => { e.preventDefault(); exportFormat(fmt); });
    };
    bindExport('btnHeroExport', 'html');
    bindExport('btnExportBundle', 'html');
    bindExport('btnExportStandalone', 'html');
    bindExport('btnExportJson', 'json');
    bindExport('btnExportCsv', 'csv');
    bindExport('btnExportMd', 'markdown');

    const btnSpeak = document.getElementById('btnSpeakBriefing');
    if (btnSpeak) btnSpeak.addEventListener('click', playVoiceBriefing);

    const solLink = document.getElementById('footerSolanaTip');
    if (solLink) {
      solLink.addEventListener('click', () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK').catch(() => {});
        }
      });
    }

    await probeDaemonHealth();
    await refreshSessionsList(true);
    connectSSE();
  });
})();
