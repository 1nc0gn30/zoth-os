'use strict';

const api = window.zothBot;
const root = document.getElementById('root');
const a11yAnnouncer = document.getElementById('a11yAnnouncer');
const orbWrap = document.getElementById('orbWrap');
const orbHit = document.getElementById('orbHit');
const logEl = document.getElementById('log');
const stageHost = document.getElementById('stageHost');
const orbWell = document.getElementById('orbWell');
const expandedWell = document.getElementById('expandedWell');
const memEl = document.getElementById('memory');
const memBody = document.getElementById('memoryBody');
const memInput = document.getElementById('memInput');
const memAddBtn = document.getElementById('memAddBtn');
const goalsList = document.getElementById('goalsList');
const chipsEl = document.getElementById('chips');
const form = document.getElementById('form');
const input = document.getElementById('input');
const btnSend = document.getElementById('btnSend');
const btnSlash = document.getElementById('btnSlash');
const slashPalette = document.getElementById('slashPalette');
const botName = document.getElementById('botName');
const botJob = document.getElementById('botJob');
const maskBadge = document.getElementById('maskBadge');
const vitalsBadge = document.getElementById('vitalsBadge');
const ringBadge = document.getElementById('ringBadge');
const mcpCountBadge = document.getElementById('mcpCountBadge');
const telemetryStrip = document.getElementById('telemetryStrip');
const newBot = document.getElementById('newBot');
const btnMem = document.getElementById('btnMem');
const btnNew = document.getElementById('btnNew');
const btnMask = document.getElementById('btnMask');
const btnPower = document.getElementById('btnPower');
const btnVoice = document.getElementById('btnVoice');
const powerEl = document.getElementById('power');
const ringChips = document.getElementById('ringChips');
const providerChips = document.getElementById('providerChips');
const featuredChips = document.getElementById('featuredChips');
const modelSelect = document.getElementById('modelSelect');
const modelFilter = document.getElementById('modelFilter');
const powerHint = document.getElementById('powerHint');
const modelLabel = document.getElementById('modelLabel');
const mcpDrawer = document.getElementById('mcpDrawer');
const mcpFilter = document.getElementById('mcpFilter');
const mcpList = document.getElementById('mcpList');
const mcpHotBadge = document.getElementById('mcpHotBadge');
const mcpSyncBtn = document.getElementById('mcpSyncBtn');
const pocketDrawer = document.getElementById('pocketDrawer');
const pocketFiles = document.getElementById('pocketFiles');
const pocketPreview = document.getElementById('pocketPreview');
const pocketOpenFolderBtn = document.getElementById('pocketOpenFolderBtn');
const portalDrawer = document.getElementById('portalDrawer');
const portalStatusBadge = document.getElementById('portalStatusBadge');
const portalBeamBtn = document.getElementById('portalBeamBtn');
const portalQrBox = document.getElementById('portalQrBox');
const portalLanBtn = document.getElementById('portalLanBtn');
const portalTsBtn = document.getElementById('portalTsBtn');
const portalClipBtn = document.getElementById('portalClipBtn');
const portalScreenBtn = document.getElementById('portalScreenBtn');
const portalCargoStrip = document.getElementById('portalCargoStrip');
const portalTaildropText = document.getElementById('portalTaildropText');
const edgePortalLabel = document.getElementById('edgePortalLabel');

let qrMode = 'tailscale'; // 'tailscale' | 'lan'

const FEATURED = {
  grok: ['grok-4.7', 'grok-4.7-build-fast', 'grok-4.6', 'grok-4.5'],
  nous: [
    'google/gemini-4-argon',
    'x-ai/grok-4.6',
    'anthropic/claude-sonnet-4.5',
    'openai/gpt-5',
    'moonshotai/kimi-k2.5',
  ],
  copilot: ['gemini-4-argon', 'claude-sonnet-5.5', 'gpt-5.4', 'kimi-k3'],
  ollama: ['qwen2.5:1.5b', 'qwen2.5-coder:1.5b', 'zoth-model:latest', 'llama3.2:1b'],
  native: ['qwen2.5:1.5b', 'qwen2.5-coder:1.5b', 'zoth-model:latest', 'llama3.2:1b'],
};

const SLASH_COMMANDS = [
  { cmd: '/maker', desc: 'Open Zoth Bot Maker — Customize Skin, Face, Body, Gender, Hair, Eyes & Masks' },
  { cmd: '/portal', desc: 'Open Pixel 10 Sovereign Edge Portal & QR Pairing Hub' },
  { cmd: '/beam', desc: 'Beam Zoth Pill & staged Cargo off-screen to Pixel 10' },
  { cmd: '/status', desc: 'Probe live ZothOS ports, Ring authority & system vitals' },
  { cmd: '/grok', desc: 'Switch neural harness to xAI Grok CLI (grok-4.7)' },
  { cmd: '/hermes', desc: 'Switch neural harness to Nous Hermes Agent' },
  { cmd: '/ollama', desc: 'Switch neural harness to local Ollama (zoth-model:latest)' },
  { cmd: '/ring 0', desc: 'Elevate to Ring 0 (SOVEREIGN · Root & Kernel Authority)' },
  { cmd: '/ring 2', desc: 'Switch to Ring 2 (TOOLMASTER · Agent Tools & MCP Runtime)' },
  { cmd: '/mcp', desc: 'Open interactive 152 MCP Server Hub & toggle servers' },
  { cmd: '/pocket', desc: 'Open in-app Pocket Workspace file explorer & preview' },
  { cmd: '/screen', desc: 'Capture desktop screenshot into Pocket Workspace' },
  { cmd: '/os status', desc: 'Execute zoth-agent-os autonomous kernel telemetry' },
  { cmd: '/goal ', desc: 'Add an active sovereign goal for the current teammate' },
  { cmd: '/remember ', desc: 'Commit a persistent fact to teammate memory.md' },
  { cmd: '/voice', desc: 'Toggle local TTS voice readback on/off' },
  { cmd: '/clear', desc: 'Clear conversation transcript for active teammate' },
  { cmd: '/provider', desc: 'List or switch provider: /provider xai|openai|anthropic|google|ollama-sdk|grok|nous|native [model]' },
  { cmd: '/key ', desc: 'Store an API key in the OS keyring: /key <provider> <key> (never saved to chat)' },
  { cmd: '/help', desc: 'Show all tactical slash commands & keyboard shortcuts' },
];

let state = null;
let streaming = null;
let seededBot = null;
let tokenRaf = 0;
let catalog = null;
let maskOn = true;
let voiceOn = false;
let slashIndex = 0;
let bmMode = 'edit'; // 'edit' | 'create'
let draftAvatar = null;

function announce(text) {
  if (!a11yAnnouncer) return;
  a11yAnnouncer.textContent = '';
  setTimeout(() => {
    a11yAnnouncer.textContent = String(text || '');
  }, 20);
}

function panelOpen() {
  return (
    memEl.classList.contains('on') ||
    newBot.classList.contains('on') ||
    powerEl.classList.contains('on') ||
    (mcpDrawer && mcpDrawer.classList.contains('on')) ||
    (pocketDrawer && pocketDrawer.classList.contains('on')) ||
    (portalDrawer && portalDrawer.classList.contains('on'))
  );
}

function focusComposer() {
  if (panelOpen()) return;
  if (document.activeElement === input) return;
  input.focus();
}

function placeStage(compact) {
  const well = compact ? orbWell : expandedWell;
  if (well && stageHost && stageHost.parentElement !== well) well.appendChild(stageHost);
  if (window.ZothStage) window.ZothStage.setMode(compact);
}

function setBusy(on) {
  root.classList.toggle('busy', on);
  btnSend.disabled = Boolean(on);
  document.getElementById('live').hidden = !on;
  if (window.ZothStage) window.ZothStage.setBusy(on);
}

function addMsg(role, text) {
  const el = document.createElement('div');
  el.className = 'msg ' + role;
  el.tabIndex = 0;
  el.setAttribute('role', 'article');
  const body = document.createElement('span');
  body.className = 'body';
  body.textContent = text;
  el.appendChild(body);

  if (role === 'bot' || role === 'sys') {
    const actions = document.createElement('div');
    actions.className = 'msg-actions';

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'msg-act-btn';
    copyBtn.textContent = 'COPY';
    copyBtn.setAttribute('aria-label', 'Copy message to clipboard');
    copyBtn.addEventListener('click', async () => {
      const content = body.textContent || '';
      await api.invoke('host:clipboard', { write: content });
      copyBtn.textContent = 'COPIED ✓';
      announce('Copied message to clipboard');
      setTimeout(() => {
        copyBtn.textContent = 'COPY';
      }, 1400);
    });
    actions.appendChild(copyBtn);

    if (role === 'bot') {
      const speakBtn = document.createElement('button');
      speakBtn.type = 'button';
      speakBtn.className = 'msg-act-btn';
      speakBtn.textContent = 'SPEAK 🔊';
      speakBtn.setAttribute('aria-label', 'Read message aloud with local TTS');
      speakBtn.addEventListener('click', () => {
        api.invoke('bot:speak', { text: body.textContent || '' });
      });
      actions.appendChild(speakBtn);
    }

    const beamBtn = document.createElement('button');
    beamBtn.type = 'button';
    beamBtn.className = 'msg-act-btn';
    beamBtn.textContent = 'BEAM ⟶';
    beamBtn.setAttribute('aria-label', 'Stage message to Pixel 10 Sovereign Edge Portal');
    beamBtn.addEventListener('click', async () => {
      const content = body.textContent || '';
      const res = await api.invoke('portal:stage-text', {
        title: `${(state && state.bot && state.bot.name) || 'Zoth'} Reply`,
        text: content,
      });
      if (res && res.snap) applySnap(res.snap);
      beamBtn.textContent = 'STAGED ✓';
      announce('Staged message to Pixel 10 Portal');
      setTimeout(() => {
        beamBtn.textContent = 'BEAM ⟶';
      }, 1400);
    });
    actions.appendChild(beamBtn);

    el.appendChild(actions);
  }

  logEl.appendChild(el);
  logEl.scrollTop = logEl.scrollHeight;
  return el;
}

function setMode(compact) {
  const expanding = compact === false && root.classList.contains('mode-compact');
  root.classList.toggle('mode-compact', compact);
  root.classList.toggle('mode-expanded', !compact);
  orbWrap.setAttribute('aria-hidden', compact ? 'false' : 'true');
  placeStage(compact);
  if (expanding) {
    refreshTelemetry(false);
    requestAnimationFrame(focusComposer);
  }
}

function updateRingAndVitalsUI(ring, vitals, mcp) {
  if (ring && ringBadge) {
    ringBadge.textContent = `R${ring.ring} · ${ring.name}`;
    ringBadge.setAttribute('aria-label', `Security Ring Authority: Ring ${ring.ring} ${ring.name}`);
  }
  if (vitals && vitalsBadge) {
    const mcpTotal = (mcp && mcp.total) || 152;
    vitalsBadge.textContent = `RAM ${vitals.memPct}% · ${mcpTotal} MCP`;
    vitalsBadge.title = `CPU Load: ${vitals.cpuLoad1m} · RAM: ${vitals.usedGiB}/${vitals.totalGiB} GiB (${vitals.memPct}%) · Uptime: ${vitals.uptimeHrs}h · ${mcpTotal} MCP Servers`;
  }
  if (mcp && mcpCountBadge) {
    mcpCountBadge.textContent = `${mcp.total || 152} MCP READY`;
  }
}

async function refreshTelemetry(logToChat = false) {
  try {
    const s = await api.invoke('host:status');
    const rows = (s && s.rows) || [];
    const setDot = (id, stateClass) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.className = 'tele-dot ' + stateClass;
    };
    for (const r of rows) {
      if (r.name === 'Ollama') setDot('teleOllama', r.up ? 'up' : 'down');
      else if (r.name === 'Studio') setDot('teleStudio', r.up ? 'up' : 'down');
      else if (r.name === 'WebGen') setDot('teleWebGen', r.up ? 'up' : 'down');
      else if (r.name === 'Relay') setDot('teleRelay', r.up ? 'up' : 'down');
      else if (r.name === 'zoth-lock' || r.kind === 'lock') {
        setDot('teleLock', !r.up ? 'down' : r.locked ? 'warn' : 'up');
        const txt = document.getElementById('teleLockText');
        if (txt) txt.textContent = !r.up ? 'LOCK DOWN' : r.locked ? 'LOCKED' : 'UNLOCKED';
      }
    }
    updateRingAndVitalsUI(s.ring, s.vitals, s.mcp);
    if (logToChat && s && s.text) {
      addMsg('sys', s.text);
      announce('Telemetry updated');
    }
  } catch {
    /* ignore */
  }
}

if (telemetryStrip) {
  telemetryStrip.addEventListener('click', () => {
    refreshTelemetry(true);
  });
}

if (ringBadge) {
  ringBadge.addEventListener('click', async () => {
    const current = (state && state.ring && typeof state.ring.ring === 'number') ? state.ring.ring : 2;
    const nextRing = (current + 3) % 4; // cycle 2 -> 1 -> 0 -> 3 -> 2
    const snap = await api.invoke('host:set-ring', { ring: nextRing });
    applySnap(snap);
    if (snap && snap.ring) {
      addMsg('sys', `Authority switched to Ring ${snap.ring.ring} (${snap.ring.name}) — ${snap.ring.title}`);
      announce(`Security Ring ${snap.ring.ring} ${snap.ring.name} active`);
    }
  });
}

chipsEl.addEventListener(
  'wheel',
  (e) => {
    if (chipsEl.scrollWidth <= chipsEl.clientWidth) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    chipsEl.scrollLeft += e.deltaY;
    e.preventDefault();
  },
  { passive: false }
);

// Roving arrow-key navigation across toolbar chips
chipsEl.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  const items = Array.from(chipsEl.querySelectorAll('button.chip'));
  if (!items.length) return;
  const idx = items.indexOf(document.activeElement);
  if (idx === -1) return;
  e.preventDefault();
  const next = e.key === 'ArrowRight' ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
  items[next].focus();
});

function renderChips(snap) {
  chipsEl.innerHTML = '';
  const mk = (label, fn, on, isTool = false, title = '') => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (on ? ' on' : '') + (isTool ? ' chip-tool' : '');
    b.textContent = label;
    if (title) b.title = title;
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', fn);
    chipsEl.appendChild(b);
  };
  const activeId = snap.bot && snap.bot.id;
  (snap.bots || []).forEach((b) => {
    mk(
      b.name,
      () => api.invoke('bot:select', { id: b.id }).then(applySnap),
      b.id === activeId,
      false,
      `${b.name} — ${b.job}`
    );
  });
  const p = snap.portal || {};
  const portalLabel = p.dockedOnPhone
    ? '📱 ON PIXEL 10'
    : p.connectedClients > 0
    ? `Portal (${p.connectedClients})`
    : 'Portal';
  mk(
    portalLabel,
    () => togglePortalDrawer(),
    portalDrawer && portalDrawer.classList.contains('on'),
    true,
    'Open Pixel 10 Sovereign Edge Portal — Drag off right edge of screen to beam to phone (Alt+8)'
  );
  mk('Status', () => refreshTelemetry(true), false, true, 'Probe live host ports & system telemetry');
  mk(
    'Screen',
    async () => {
      const res = await api.invoke('host:screenshot');
      addMsg('sys', res && res.ok ? `Captured desktop screenshot → ${res.file}` : 'Screenshot failed');
    },
    false,
    true,
    'Capture desktop screenshot to Pocket Workspace'
  );
  mk('MCP', () => toggleMcpDrawer(), mcpDrawer && mcpDrawer.classList.contains('on'), true, 'Open 152 ZothOS MCP Server Hub (Alt+6)');
  mk('Pocket', () => togglePocketDrawer(), pocketDrawer && pocketDrawer.classList.contains('on'), true, 'Open in-app Pocket Workspace Explorer (Alt+7)');
  mk('WebGen', () => api.invoke('host:open', { url: 'http://127.0.0.1:5173' }), false, true, 'Open WebGen :5173');
  mk(
    'Pulse',
    () =>
      api
        .invoke('job:add-pulse')
        .then(applySnap)
        .then(() => addMsg('sys', 'Host pulse armed (every 5 minutes).')),
    false,
    true,
    'Enable 5-minute background host pulse'
  );
}

function renderPortal(snap) {
  if (!portalDrawer) return;
  const p = (snap && snap.portal) || (state && state.portal) || {};
  root.classList.toggle('docked-on-phone', Boolean(p.dockedOnPhone));

  const peerName = (p.peerName || 'pixel-10-pro').toUpperCase();
  const peerIp = p.peerIp || '100.106.39.46';

  if (portalStatusBadge) {
    if (p.dockedOnPhone) {
      portalStatusBadge.textContent = `ON ${peerName} 📱`;
      portalStatusBadge.classList.add('connected');
    } else if (p.lastTaildropStatus && p.lastTaildropStatus.includes('DROPPED')) {
      portalStatusBadge.textContent = p.lastTaildropStatus;
      portalStatusBadge.classList.add('connected');
    } else {
      portalStatusBadge.textContent = `🟢 ${peerName}`;
      portalStatusBadge.classList.add('connected');
    }
  }

  if (portalTaildropText && p.token) {
    portalTaildropText.title = `Portal token: ${p.token} · bound to ${p.boundHost || '?'}:${p.port || 9335}`;
  }
  if (portalTaildropText) {
    const statusLine = p.lastTaildropStatus || `READY · ${peerName}`;
    portalTaildropText.innerHTML = `<strong>NATIVE TAILDROP (${peerIp}) · ${statusLine}</strong> — Drag Zoth or drop any file/note off the right screen edge to pop up directly on ${peerName} via Tailscale.`;
  }

  if (portalBeamBtn) {
    portalBeamBtn.textContent = p.dockedOnPhone ? 'RECALL TO LAPTOP ⟵' : 'BEAM TO PIXEL ⟶';
  }

  if (portalLanBtn && p.lanUrl) {
    portalLanBtn.textContent = `LAN · ${p.lanIp || 'Wi-Fi'}:${p.port || 9335}`;
    portalLanBtn.title = `Copy ${p.lanUrl} and show Wi-Fi QR`;
    portalLanBtn.classList.toggle('on', qrMode === 'lan');
  }
  if (portalTsBtn) {
    if (p.tailscaleUrl) {
      portalTsBtn.hidden = false;
      portalTsBtn.textContent = `TAILSCALE · ${p.tailscaleIp}:${p.port || 9335}`;
      portalTsBtn.title = `Copy ${p.tailscaleUrl} (works anywhere on cellular/DoorDash)`;
      portalTsBtn.classList.toggle('on', qrMode === 'tailscale');
    } else {
      portalTsBtn.hidden = true;
    }
  }

  if (portalQrBox) {
    const svg = qrMode === 'tailscale' && p.qrTailscaleSvg ? p.qrTailscaleSvg : p.qrLanSvg;
    if (svg) {
      portalQrBox.innerHTML = svg;
    }
  }

  if (portalCargoStrip) {
    const items = p.cargo || [];
    portalCargoStrip.innerHTML = '';
    if (!items.length) {
      const empty = document.createElement('span');
      empty.className = 'portal-cargo-empty';
      empty.textContent = 'No cargo staged — drop files anywhere or click + DROP CLIPBOARD / + DROP SCREENSHOT';
      portalCargoStrip.appendChild(empty);
    } else {
      items.slice(0, 6).forEach((item) => {
        const pill = document.createElement('span');
        pill.className = 'portal-cargo-pill';
        const icon = item.kind === 'image' ? '🖼' : item.kind === 'file' ? '📦' : '📋';
        pill.textContent = `${icon} ${item.title}`;
        pill.title = item.text || item.fileName || item.title;
        portalCargoStrip.appendChild(pill);
      });
    }
  }
}

function renderMcpHub() {
  if (!mcpList) return;
  const mcp = (state && state.mcp) || { total: 0, enabledCount: 0, items: [] };
  if (mcpHotBadge) {
    mcpHotBadge.textContent = `${mcp.enabledCount || 0} HOT / ${mcp.total || 152}`;
  }
  const q = String((mcpFilter && mcpFilter.value) || '').trim().toLowerCase();
  const items = (mcp.items || []).filter((item) => {
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      `ring ${item.ring}`.includes(q) ||
      item.securityRing.toLowerCase().includes(q)
    );
  });
  mcpList.innerHTML = '';
  items.slice(0, 60).forEach((item) => {
    const row = document.createElement('div');
    row.className = 'mcp-row';
    row.setAttribute('role', 'listitem');

    const info = document.createElement('div');
    info.className = 'mcp-info';

    const titleLine = document.createElement('div');
    titleLine.className = 'mcp-title-line';
    const nameEl = document.createElement('span');
    nameEl.className = 'mcp-name';
    nameEl.textContent = item.name;
    const ringEl = document.createElement('span');
    ringEl.className = 'mcp-ring-tag';
    ringEl.textContent = `R${item.ring}`;
    titleLine.appendChild(nameEl);
    titleLine.appendChild(ringEl);

    const descEl = document.createElement('div');
    descEl.className = 'mcp-desc';
    descEl.textContent = item.description || 'ZothOS MCP Server';
    descEl.title = item.description || '';

    info.appendChild(titleLine);
    info.appendChild(descEl);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mcp-toggle' + (item.enabled ? ' on' : '');
    btn.textContent = item.enabled ? 'HOT' : 'OFF';
    btn.setAttribute('aria-pressed', item.enabled ? 'true' : 'false');
    btn.setAttribute('aria-label', `${item.enabled ? 'Disable' : 'Enable'} ${item.name} MCP server`);
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = '…';
      const res = await api.invoke('host:mcp-toggle', { name: item.name, enabled: !item.enabled });
      if (res && res.snap) applySnap(res.snap);
      renderMcpHub();
      announce(`${item.name} MCP server ${!item.enabled ? 'enabled and synced' : 'disabled'}`);
    });

    row.appendChild(info);
    row.appendChild(btn);
    mcpList.appendChild(row);
  });
}

async function refreshPocketWorkspace() {
  if (!pocketFiles) return;
  const res = await api.invoke('host:workspace-list', { rel: '.' });
  pocketFiles.innerHTML = '';
  const entries = (res && res.entries) || [];
  if (!entries.length) {
    const empty = document.createElement('div');
    empty.className = 'panel-hint';
    empty.textContent = '(Workspace empty)';
    pocketFiles.appendChild(empty);
    return;
  }
  let firstBtn = null;
  entries.forEach((entry) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pocket-row';
    btn.setAttribute('role', 'listitem');
    const left = document.createElement('span');
    left.className = 'pocket-name';
    left.textContent = (entry.isDir ? '📁 ' : '📄 ') + entry.name;
    const right = document.createElement('span');
    right.className = 'pocket-meta';
    right.textContent = entry.isDir ? 'DIR' : `${Math.max(1, Math.round(entry.size / 1024))} KB`;
    btn.appendChild(left);
    btn.appendChild(right);
    btn.addEventListener('click', async () => {
      pocketFiles.querySelectorAll('.pocket-row').forEach((r) => r.classList.remove('on'));
      btn.classList.add('on');
      if (entry.isDir) return;
      if (/\.(png|jpg|jpeg|webp)$/i.test(entry.name)) {
        if (pocketPreview) {
          pocketPreview.hidden = false;
          pocketPreview.textContent = `[Binary Image: ${entry.name} (${Math.round(entry.size / 1024)} KB)] — Click "OPEN FOLDER ↗" to view.`;
        }
        return;
      }
      const r = await api.invoke('host:workspace-read', { rel: entry.name });
      if (pocketPreview) {
        pocketPreview.hidden = false;
        pocketPreview.textContent = r && r.ok ? r.content : (r && r.error) || 'Unable to read file';
      }
    });
    pocketFiles.appendChild(btn);
    if (!firstBtn && !entry.isDir && !/\.(png|jpg|jpeg|webp)$/i.test(entry.name)) {
      firstBtn = btn;
    }
  });
  if (firstBtn) {
    firstBtn.click();
  }
}

function renderRings(snap) {
  if (!ringChips) return;
  ringChips.innerHTML = '';
  const activeRing = (snap.ring && typeof snap.ring.ring === 'number') ? snap.ring.ring : 2;
  const rings = [
    { id: 0, label: 'R0 Sovereign', desc: 'Root, Kernel & Amnesic Authority' },
    { id: 1, label: 'R1 SysAdmin', desc: 'System Admin & Daemons' },
    { id: 2, label: 'R2 Toolmaster', desc: 'Agent Tools, GUI & MCP Runtime' },
    { id: 3, label: 'R3 Spectre', desc: 'Sandboxed Read-Only Telemetry' },
  ];
  rings.forEach((r) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (r.id === activeRing ? ' on' : '');
    b.textContent = r.label;
    b.title = r.desc;
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', r.id === activeRing ? 'true' : 'false');
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', async () => {
      const next = await api.invoke('host:set-ring', { ring: r.id });
      applySnap(next);
      announce(`${r.label} active`);
    });
    ringChips.appendChild(b);
  });
}

function renderGoals(snap) {
  if (!goalsList) return;
  goalsList.innerHTML = '';
  const goals = (snap && snap.goals) || [];
  goals.forEach((g) => {
    const row = document.createElement('div');
    row.className = 'goal-row';
    const span = document.createElement('span');
    span.textContent = '🎯 ' + g.text;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'DONE ✓';
    btn.setAttribute('aria-label', `Mark goal complete: ${g.text}`);
    btn.addEventListener('click', async () => {
      const next = await api.invoke('bot:done-goal', { id: g.id });
      applySnap(next);
      announce('Goal marked complete');
    });
    row.appendChild(span);
    row.appendChild(btn);
    goalsList.appendChild(row);
  });
}

function providerLabel(id) {
  const map = { grok: 'GROK', nous: 'NOUS', copilot: 'COPILOT', ollama: 'OLLAMA', native: 'NATIVE' };
  return map[id] || String(id || '').toUpperCase();
}

function shortModel(id) {
  const s = String(id || '');
  const tail = s.includes('/') ? s.split('/').pop() : s;
  return tail.length > 22 ? tail.slice(0, 20) + '…' : tail;
}

function modelsFor(provider, cat) {
  if (provider === 'grok') return (cat && cat.grok) || FEATURED.grok;
  if (!cat) return [];
  if (provider === 'nous') return cat.nous || [];
  if (provider === 'copilot') return cat.copilot || [];
  return cat.ollama || [];
}

function featuredFor(provider, cat) {
  const all = new Set(modelsFor(provider, cat));
  const fromCat = cat && cat.featured && cat.featured[provider];
  const want = Array.isArray(fromCat) && fromCat.length ? fromCat : FEATURED[provider] || [];
  return want.filter((id) => all.has(id));
}

function pickDefaultModel(provider, cat) {
  const featured = featuredFor(provider, cat);
  if (featured.length) return featured[0];
  const all = modelsFor(provider, cat);
  return all[0] || '';
}

function fillModels() {
  if (!modelSelect || !state) return;
  const provider = state.provider || 'nous';
  const all = modelsFor(provider, catalog);
  const q = String(modelFilter && modelFilter.value ? modelFilter.value : '')
    .trim()
    .toLowerCase();
  const filtered = q ? all.filter((m) => m.toLowerCase().includes(q)) : all;
  const current = state.model || (state.bot && state.bot.model) || '';
  modelSelect.innerHTML = '';
  const seen = new Set();
  const add = (id, selected) => {
    if (!id || seen.has(id)) return;
    seen.add(id);
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = id;
    if (selected) opt.selected = true;
    modelSelect.appendChild(opt);
  };
  const inList = all.includes(current);
  if (inList) add(current, true);
  filtered
    .slice()
    .sort((a, b) => a.localeCompare(b))
    .forEach((id) => add(id, id === current));
  if (powerHint) {
    const n = all.length;
    const via =
      provider === 'grok'
        ? 'xAI Grok CLI agent loop'
        : provider === 'native'
        ? 'native Ollama loop'
        : 'Hermes tool loop';
    powerHint.textContent =
      n + ' model' + (n === 1 ? '' : 's') + ' · ' + via + (catalog && catalog.nousErr ? ' · Nous cache' : '');
  }
}

function renderProviders(snap) {
  if (!providerChips) return;
  providerChips.innerHTML = '';
  const rows = [
    { id: 'grok', label: 'Grok' },
    { id: 'nous', label: 'Nous' },
    { id: 'copilot', label: 'Copilot' },
    { id: 'ollama', label: 'Ollama' },
    { id: 'native', label: 'Native' },
  ];
  const active = snap.provider || 'nous';
  rows.forEach((row) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (row.id === active ? ' on' : '');
    b.textContent = row.label;
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', row.id === active ? 'true' : 'false');
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', async () => {
      let next = await api.invoke('bot:set-power', { provider: row.id });
      applySnap(next);
      const list = modelsFor(row.id, catalog);
      if (list.length && !list.includes(next.model)) {
        const model = pickDefaultModel(row.id, catalog);
        if (model) {
          next = await api.invoke('bot:set-power', { provider: row.id, model });
          applySnap(next);
        }
      }
    });
    providerChips.appendChild(b);
  });
}

function modelFits(provider, model) {
  const m = String(model || '');
  if (!m) return false;
  if (provider === 'grok') return m.startsWith('grok-');
  if (provider === 'nous') return m.includes('/');
  if (provider === 'copilot') return !m.includes('/');
  const list = modelsFor(provider, catalog);
  if (list.length) return list.includes(m);
  return !m.includes('/');
}

function applyPowerLabels(snap) {
  const eng = document.getElementById('engine');
  if (eng) eng.textContent = providerLabel(snap.provider || snap.engine);
  if (modelLabel) {
    const m = snap.model || (snap.bot && snap.bot.model) || '';
    const ok = modelFits(snap.provider, m);
    modelLabel.textContent = ok ? shortModel(m) : 'pick a model';
    modelLabel.classList.toggle('need', !ok);
  }
}

function renderFeatured(snap) {
  if (!featuredChips) return;
  featuredChips.innerHTML = '';
  const provider = snap.provider || 'nous';
  const current = snap.model || '';
  const rows = featuredFor(provider, catalog);
  if (!rows.length) {
    const empty = document.createElement('span');
    empty.className = 'panel-hint';
    empty.textContent = catalog ? 'No featured matches' : 'Loading…';
    featuredChips.appendChild(empty);
    return;
  }
  rows.forEach((id) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (id === current ? ' on' : '');
    b.textContent = shortModel(id);
    b.title = id;
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', async () => {
      const picked = await api.invoke('bot:set-power', { provider, model: id });
      applySnap(picked);
    });
    featuredChips.appendChild(b);
  });
}

function openPower() {
  const open = !powerEl.classList.contains('on');
  closePanels();
  powerEl.classList.toggle('on', open);
  syncPanels();
  if (open) {
    api.invoke('host:catalog', { force: false }).then((cat) => {
      catalog = cat;
      fillModels();
      renderFeatured(state || {});
    });
    if (modelFilter) modelFilter.focus();
  }
}

async function ensureFittingModel() {
  if (!state) return state;
  if (modelFits(state.provider, state.model)) return state;
  const model = pickDefaultModel(state.provider || 'nous', catalog);
  if (!model) return state;
  const snap = await api.invoke('bot:set-power', { provider: state.provider, model });
  applySnap(snap);
  return snap;
}

const MASK_LABELS = {
  azoth: 'AZOTH 24K',
  oni: 'CYBER ONI',
  visor: 'HOLO-VISOR',
  anubis: 'ANUBIS CREST',
  kitsune: 'KITSUNE MASK',
  crown: 'HALO CROWN',
  none: 'UNMASKED',
};

function applyMask(on) {
  maskOn = Boolean(on);
  if (btnMask) {
    btnMask.classList.toggle('on', maskOn);
    btnMask.setAttribute('aria-pressed', maskOn ? 'true' : 'false');
  }
  const av = (state && state.bot && state.bot.avatar) || {};
  const mStyle = av.maskStyle || 'azoth';
  const effectiveOn = maskOn && mStyle !== 'none';
  if (maskBadge) {
    maskBadge.textContent = effectiveOn ? MASK_LABELS[mStyle] || 'AZOTH 24K' : 'UNMASKED';
    maskBadge.classList.toggle('off', !effectiveOn);
  }
  if (window.ZothStage && window.ZothStage.setMask) window.ZothStage.setMask(maskOn);
}

function applyVoice(on) {
  voiceOn = Boolean(on);
  if (btnVoice) {
    btnVoice.classList.toggle('on', voiceOn);
    btnVoice.setAttribute('aria-pressed', voiceOn ? 'true' : 'false');
  }
}

function applySnap(snap) {
  state = snap;
  botName.textContent = snap.bot.name;
  botJob.textContent = snap.bot.job;
  if (snap.bot && snap.bot.avatar && window.ZothStage && window.ZothStage.setAvatar) {
    // Only overwrite stage avatar if not actively previewing a new bot in Bot Maker
    if (!newBot.classList.contains('on') || bmMode === 'edit') {
      window.ZothStage.setAvatar(snap.bot.avatar);
    }
  }
  applyPowerLabels(snap);
  applyMask(snap.maskOn !== false);
  applyVoice(Boolean(snap.voiceOn));
  updateRingAndVitalsUI(snap.ring, snap.vitals, snap.mcp);
  renderRings(snap);
  renderProviders(snap);
  renderFeatured(snap);
  fillModels();
  renderGoals(snap);
  renderMcpHub();
  renderPortal(snap);
  input.placeholder = 'Ask ' + snap.bot.name + ' or type / for commands…';
  memBody.textContent = snap.memory || '(empty)';
  renderChips(snap);
  setMode(snap.compact);
  if (seededBot !== snap.bot.id) {
    logEl.innerHTML = '';
    (snap.chat || []).forEach((m) => addMsg(m.role === 'assistant' ? 'bot' : 'user', m.content));
    if (!(snap.chat || []).length) {
      addMsg(
        'sys',
        `${snap.bot.name} online under Ring ${(snap.ring && snap.ring.ring) ?? 2} (${(snap.ring && snap.ring.name) || 'TOOLMASTER'}).\nType /help for tactical commands or press Alt+1..8 for controls.`
      );
      if (snap.goals && snap.goals.length) {
        addMsg('sys', 'Active Goals:\n' + snap.goals.map((g) => '· ' + g.text).join('\n'));
      }
    }
    seededBot = snap.bot.id;
  }
}

/* ============================================================================
   TACTICAL SLASH COMMAND PALETTE & EXECUTOR
   ============================================================================ */
function renderSlashPalette(filterText = '') {
  if (!slashPalette) return;
  const q = String(filterText || '').trim().toLowerCase();
  const matches = SLASH_COMMANDS.filter(
    (c) => !q || c.cmd.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
  );
  if (!matches.length) {
    slashPalette.hidden = true;
    return;
  }
  slashIndex = Math.max(0, Math.min(slashIndex, matches.length - 1));
  slashPalette.innerHTML = '';
  matches.forEach((item, idx) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'slash-item' + (idx === slashIndex ? ' active' : '');
    b.setAttribute('role', 'option');
    b.setAttribute('aria-selected', idx === slashIndex ? 'true' : 'false');
    const cSpan = document.createElement('span');
    cSpan.className = 'slash-cmd';
    cSpan.textContent = item.cmd;
    const dSpan = document.createElement('span');
    dSpan.className = 'slash-desc';
    dSpan.textContent = item.desc;
    b.appendChild(cSpan);
    b.appendChild(dSpan);
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', () => {
      if (item.cmd.endsWith(' ')) {
        input.value = item.cmd;
        slashPalette.hidden = true;
        input.focus();
      } else {
        input.value = '';
        slashPalette.hidden = true;
        executeSlashCommand(item.cmd);
      }
    });
    slashPalette.appendChild(b);
  });
  slashPalette.hidden = false;
}

async function executeSlashCommand(raw) {
  if (slashPalette) slashPalette.hidden = true;
  const trimmed = String(raw || '').trim();
  const [verb, ...rest] = trimmed.split(/\s+/);
  const arg = rest.join(' ').trim();
  const cmd = verb.toLowerCase();

  if (cmd === '/help') {
    const helpLines = [
      'TACTICAL SLASH COMMANDS:',
      '  /portal          — Open Pixel 10 Sovereign Edge Portal & QR Pairing Hub',
      '  /beam [text]     — Beam Zoth Pill & staged Cargo off-screen to Pixel 10',
      '  /status          — Probe live ZothOS ports, Ring authority & RAM/CPU vitals',
      '  /grok [model]    — Switch neural engine to xAI Grok CLI (default: grok-4.7)',
      '  /hermes [model]  — Switch neural engine to Nous Hermes Agent',
      '  /ollama [model]  — Switch neural engine to local Ollama (zoth-model:latest)',
      '  /ring <0-3>      — Switch ZothOS Security Ring (0=Sovereign, 1=SysAdmin, 2=Toolmaster, 3=Spectre)',
      '  /mcp             — Open 152 pre-registered ZothOS MCP Server Hub',
      '  /pocket          — Open in-app Pocket Workspace file explorer & preview',
      '  /screen          — Capture desktop screenshot to Pocket Workspace',
      '  /os <directive>  — Execute zoth-agent-os autonomous OS action',
      '  /goal <text>     — Add an active sovereign goal for this teammate',
      '  /remember <fact> — Append fact directly to teammate memory.md',
      '  /voice           — Toggle local TTS voice synthesis readback',
      '  /clear           — Clear current teammate chat log',
      '  /provider [id] [model] — List or switch model provider (API or CLI)',
      '  /key <id> <key>  — Save an API key to the OS keyring',
      '',
      'KEYBOARD SHORTCUTS:',
      '  Alt+1 Mask · Alt+2 Power · Alt+3 Memory · Alt+4 Voice · Alt+5 Bot Maker · Alt+6 MCP · Alt+7 Pocket · Alt+8 Portal · Alt+M Orb',
    ].join('\n');
    addMsg('sys', helpLines);
    return true;
  }
  if (cmd === '/maker' || cmd === '/customize' || cmd === '/forge') {
    openBotMaker('edit');
    return true;
  }
  if (cmd === '/portal') {
    togglePortalDrawer(true);
    return true;
  }
  if (cmd === '/beam') {
    if (arg) {
      await api.invoke('portal:stage-text', { title: 'Beamed Note', text: arg });
    }
    const snap = await api.invoke('portal:handoff', { yPct: 0.45 });
    applySnap(snap);
    addMsg('sys', 'Beamed Zoth Pill & staged Cargo to Pixel 10 Sovereign Receiver.');
    announce('Beamed Zoth Pill to Pixel 10');
    return true;
  }
  if (cmd === '/grok') {
    const model = arg || 'grok-4.7';
    const snap = await api.invoke('bot:set-power', { provider: 'grok', engine: 'grok', model });
    applySnap(snap);
    addMsg('sys', `Switched neural harness to GROK CLI · ${model}`);
    announce(`Switched to Grok ${model}`);
    return true;
  }
  if (cmd === '/hermes') {
    const model = arg || (catalog && catalog.hermesDefault) || 'stepfun/step-3.7-flash:free';
    const snap = await api.invoke('bot:set-power', { provider: 'nous', engine: 'hermes', model });
    applySnap(snap);
    addMsg('sys', `Switched neural harness to HERMES (Nous) · ${model}`);
    announce(`Switched to Hermes ${model}`);
    return true;
  }
  if (cmd === '/ollama' || cmd === '/native') {
    const model = arg || 'zoth-model:latest';
    const snap = await api.invoke('bot:set-power', { provider: 'native', engine: 'ollama', model });
    applySnap(snap);
    addMsg('sys', `Switched neural harness to NATIVE OLLAMA · ${model}`);
    announce(`Switched to Native Ollama ${model}`);
    return true;
  }
  if (cmd === '/provider' || cmd === '/providers') {
    const parts = (arg || '').split(/\s+/).filter(Boolean);
    if (!parts.length) {
      const info = await api.invoke('provider:list');
      const lines = info.providers.map((p) => `${p.id === info.selection.id ? '▶' : ' '} ${p.id.padEnd(11)} ${p.kind}  ${p.ready ? 'ready' : 'needs key'}  · ${p.label}`);
      addMsg('sys', `Provider: ${info.selection.id} · ${info.selection.model || 'default'}${info.selection.ready ? '' : ' (' + info.selection.reason + ')'}\nKeyring: ${info.keyring ? 'available' : 'unavailable (use env vars)'}\n` + lines.join('\n'));
      return true;
    }
    const res = await api.invoke('provider:set', { provider: parts[0], model: parts[1] });
    if (res && res.error) {
      addMsg('sys', res.error);
      return true;
    }
    applySnap(res);
    const s = res.selection || {};
    addMsg('sys', `Switched provider to ${s.label || s.id} · ${s.model || 'default'}${s.ready ? '' : ' — ' + s.reason}`);
    return true;
  }
  if (cmd === '/key') {
    const parts = (arg || '').split(/\s+/).filter(Boolean);
    if (parts.length < 1) {
      addMsg('sys', 'Usage: /key <provider> <api-key>   (or /key <provider> to clear)');
      return true;
    }
    const res = await api.invoke('provider:set-key', { provider: parts[0], key: parts[1] || '' });
    addMsg('sys', res && res.ok ? `Key for ${res.provider} ${parts[1] ? 'saved to OS keyring' : 'cleared'}.` : `Key not saved: ${res && res.error}`);
    return true;
  }
  if (cmd === '/status') {
    await refreshTelemetry(true);
    return true;
  }
  if (cmd === '/ring') {
    const r = parseInt(arg || '2', 10);
    const snap = await api.invoke('host:set-ring', { ring: Number.isFinite(r) ? r : 2 });
    applySnap(snap);
    addMsg('sys', `Switched to Ring ${snap.ring.ring} (${snap.ring.name}) — ${snap.ring.title}`);
    return true;
  }
  if (cmd === '/mcp') {
    toggleMcpDrawer(true);
    return true;
  }
  if (cmd === '/pocket') {
    togglePocketDrawer(true);
    return true;
  }
  if (cmd === '/screen' || cmd === '/screenshot') {
    const res = await api.invoke('host:screenshot');
    addMsg('sys', res && res.ok ? `Captured desktop screenshot → ${res.file}` : `Screenshot failed: ${res && res.error}`);
    return true;
  }
  if (cmd === '/os') {
    addMsg('user', trimmed);
    setBusy(true);
    const res = await api.invoke('host:agent-os', { cmd: arg || 'status' });
    setBusy(false);
    addMsg('sys', (res && res.text) || '(no output)');
    return true;
  }
  if (cmd === '/goal') {
    if (!arg) {
      addMsg('sys', 'Usage: /goal <objective text>');
      return true;
    }
    const snap = await api.invoke('bot:add-goal', { text: arg });
    applySnap(snap);
    addMsg('sys', `Goal added: 🎯 ${arg}`);
    return true;
  }
  if (cmd === '/remember') {
    if (!arg) {
      addMsg('sys', 'Usage: /remember <fact to persist>');
      return true;
    }
    const snap = await api.invoke('bot:remember', { text: arg });
    applySnap(snap);
    addMsg('sys', `Committed to memory.md: "${arg}"`);
    return true;
  }
  if (cmd === '/voice') {
    const next = !voiceOn;
    const snap = await api.invoke('bot:set-voice', { on: next });
    applySnap(snap);
    addMsg('sys', `Local TTS Voice Synthesis: ${next ? 'ENABLED 🔊' : 'MUTED'}`);
    return true;
  }
  if (cmd === '/clear') {
    const snap = await api.invoke('bot:clear-chat');
    seededBot = null;
    applySnap(snap);
    announce('Conversation cleared');
    return true;
  }
  return false;
}

async function send(text) {
  const t = String(text || '').trim();
  if (!t || streaming) return;
  if (t.startsWith('/')) {
    const handled = await executeSlashCommand(t);
    if (handled) return;
  }
  if (state && state.engine !== 'sdk' && !modelFits(state.provider, state.model)) {
    await ensureFittingModel();
    if (state && !modelFits(state.provider, state.model)) {
      addMsg('sys', 'Pick a model in Power (Alt+2) for ' + providerLabel(state.provider) + '.');
      if (!powerEl.classList.contains('on')) openPower();
      return;
    }
  }
  addMsg('user', t);
  const botEl = addMsg('bot', '');
  botEl.classList.add('stream');
  const body = botEl.querySelector('.body');
  streaming = botEl;
  setBusy(true);
  let acc = '';
  const flush = () => {
    tokenRaf = 0;
    body.textContent = acc;
    logEl.scrollTop = logEl.scrollHeight;
  };
  const off = api.on('chat:token', (piece) => {
    acc += piece;
    if (!tokenRaf) tokenRaf = requestAnimationFrame(flush);
  });
  try {
    const res = await api.invoke('chat:send', { text: t });
    if (tokenRaf) {
      cancelAnimationFrame(tokenRaf);
      flush();
    }
    if (res && res.engine) {
      const eng = document.getElementById('engine');
      if (eng) eng.textContent = String(res.engine).toUpperCase();
    }
  } catch (err) {
    body.textContent = acc || String(err.message || err);
  } finally {
    off();
    botEl.classList.remove('stream');
    streaming = null;
    setBusy(false);
    focusComposer();
  }
}

function expand() {
  api.invoke('bot:set-mode', { compact: false }).then(applySnap);
}

let compactPress = null;

orbWrap.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  compactPress = { x: e.clientX, y: e.clientY, dragging: false };
  orbWrap.setPointerCapture(e.pointerId);
});

orbWrap.addEventListener('pointermove', (e) => {
  if (!compactPress) return;
  const dx = e.clientX - compactPress.x;
  const dy = e.clientY - compactPress.y;
  if (!compactPress.dragging && dx * dx + dy * dy >= 25) {
    compactPress.dragging = true;
    root.classList.add('dragging');
    api.invoke('win:drag-begin');
  }
  if (compactPress.dragging) api.send('win:drag-to');
});

function endCompactPress(e) {
  if (!compactPress) return;
  const dragged = compactPress.dragging;
  compactPress = null;
  root.classList.remove('dragging');
  try {
    orbWrap.releasePointerCapture(e.pointerId);
  } catch {
    /* already released */
  }
  api.invoke('win:drag-end');
  if (!dragged) expand();
}

orbWrap.addEventListener('pointerup', endCompactPress);
orbWrap.addEventListener('pointercancel', endCompactPress);

orbHit.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    expand();
  }
});

document.getElementById('btnMin').addEventListener('click', () => {
  api.invoke('bot:set-mode', { compact: true }).then(applySnap);
});

function syncPanels() {
  const memOpen = memEl.classList.contains('on');
  const newOpen = newBot.classList.contains('on');
  const powOpen = powerEl.classList.contains('on');
  btnMem.classList.toggle('on', memOpen);
  btnMem.setAttribute('aria-expanded', memOpen ? 'true' : 'false');
  btnNew.classList.toggle('on', newOpen);
  btnNew.setAttribute('aria-expanded', newOpen ? 'true' : 'false');
  if (btnPower) {
    btnPower.classList.toggle('on', powOpen);
    btnPower.setAttribute('aria-expanded', powOpen ? 'true' : 'false');
  }
  root.classList.toggle('drawer-open', panelOpen());
  root.classList.toggle('bot-maker-open', newOpen);
  if (window.ZothStage && window.ZothStage.resize) {
    setTimeout(() => window.ZothStage.resize(), 40);
    setTimeout(() => window.ZothStage.resize(), 240);
  }
  if (state) renderChips(state);
}

function closePanels() {
  memEl.classList.remove('on');
  newBot.classList.remove('on');
  powerEl.classList.remove('on');
  if (mcpDrawer) mcpDrawer.classList.remove('on');
  if (pocketDrawer) pocketDrawer.classList.remove('on');
  if (portalDrawer) portalDrawer.classList.remove('on');
  if (slashPalette) slashPalette.hidden = true;
  root.classList.remove('drawer-open');
  root.classList.remove('bot-maker-open');
  if (state && state.bot && state.bot.avatar && window.ZothStage && window.ZothStage.setAvatar) {
    window.ZothStage.setAvatar(state.bot.avatar);
  }
}

async function toggleMcpDrawer(forceOpen) {
  if (!mcpDrawer) return;
  const open = typeof forceOpen === 'boolean' ? forceOpen : !mcpDrawer.classList.contains('on');
  closePanels();
  mcpDrawer.classList.toggle('on', open);
  syncPanels();
  if (open) {
    if (!state || !state.mcp) {
      await refreshTelemetry(false);
    } else {
      renderMcpHub();
    }
    if (mcpFilter) mcpFilter.focus();
  }
}

async function togglePocketDrawer(forceOpen) {
  if (!pocketDrawer) return;
  const open = typeof forceOpen === 'boolean' ? forceOpen : !pocketDrawer.classList.contains('on');
  closePanels();
  pocketDrawer.classList.toggle('on', open);
  syncPanels();
  if (open) {
    await refreshPocketWorkspace();
  }
}

async function togglePortalDrawer(forceOpen) {
  if (!portalDrawer) return;
  const open = typeof forceOpen === 'boolean' ? forceOpen : !portalDrawer.classList.contains('on');
  closePanels();
  portalDrawer.classList.toggle('on', open);
  syncPanels();
  if (open) {
    const snap = await api.invoke('bot:snapshot');
    if (snap) applySnap(snap);
  }
}

if (portalBeamBtn) {
  portalBeamBtn.addEventListener('click', async () => {
    const docked = state && state.portal && state.portal.dockedOnPhone;
    const snap = await api.invoke(docked ? 'portal:recall' : 'portal:handoff', { yPct: 0.45 });
    applySnap(snap);
    announce(docked ? 'Recalled Zoth Pill to laptop' : 'Beamed Zoth Pill to Pixel 10');
  });
}

if (portalLanBtn) {
  portalLanBtn.addEventListener('click', async () => {
    qrMode = 'lan';
    renderPortal(state);
    const url = state && state.portal && state.portal.lanUrl;
    if (url) {
      await api.invoke('host:clipboard', { write: url });
      announce(`Copied LAN URL ${url}`);
    }
  });
}

if (portalTsBtn) {
  portalTsBtn.addEventListener('click', async () => {
    qrMode = 'tailscale';
    renderPortal(state);
    const url = state && state.portal && state.portal.tailscaleUrl;
    if (url) {
      await api.invoke('host:clipboard', { write: url });
      announce(`Copied Tailscale URL ${url}`);
    }
  });
}

if (portalClipBtn) {
  portalClipBtn.addEventListener('click', async () => {
    const res = await api.invoke('portal:stage-clipboard');
    if (res && res.snap) applySnap(res.snap);
    if (res && res.ok) {
      portalClipBtn.textContent = 'STAGED ✓';
      announce('Staged clipboard to Pixel 10 Portal');
      setTimeout(() => {
        portalClipBtn.textContent = '+ CLIPBOARD';
      }, 1300);
    }
  });
}

if (portalScreenBtn) {
  portalScreenBtn.addEventListener('click', async () => {
    portalScreenBtn.textContent = 'CAPTURING...';
    const shot = await api.invoke('host:screenshot');
    if (shot && shot.ok && shot.path) {
      const res = await api.invoke('portal:stage-file', { filePath: shot.path, title: `Desktop Shot (${shot.file})` });
      if (res && res.snap) applySnap(res.snap);
      portalScreenBtn.textContent = 'STAGED ✓';
      announce('Staged desktop screenshot to Pixel 10 Portal');
    } else {
      portalScreenBtn.textContent = 'FAILED';
    }
    setTimeout(() => {
      portalScreenBtn.textContent = '+ SCREENSHOT';
    }, 1400);
  });
}

// Drag-and-Drop Cargo Staging anywhere onto Zoth Bot
window.addEventListener('dragover', (e) => {
  e.preventDefault();
  root.classList.add('portal-active');
  if (edgePortalLabel) edgePortalLabel.textContent = 'DROP TO STAGE CARGO FOR PIXEL 10 ⟶';
});

window.addEventListener('dragleave', (e) => {
  if (!e.relatedTarget) {
    root.classList.remove('portal-active');
    if (edgePortalLabel) edgePortalLabel.textContent = 'PIXEL 10 EDGE PORTAL ⟶';
  }
});

window.addEventListener('drop', async (e) => {
  e.preventDefault();
  root.classList.remove('portal-active');
  if (edgePortalLabel) edgePortalLabel.textContent = 'PIXEL 10 EDGE PORTAL ⟶';
  const dt = e.dataTransfer;
  if (!dt) return;

  if (dt.files && dt.files.length > 0) {
    for (const f of Array.from(dt.files)) {
      if (f.path) {
        const res = await api.invoke('portal:stage-file', { filePath: f.path, title: f.name });
        if (res && res.snap) applySnap(res.snap);
      }
    }
    addMsg('sys', `Staged ${dt.files.length} file(s) to Pixel 10 Portal Cargo. Drag Zoth off the right screen edge to beam!`);
    announce('Files staged to Pixel 10 Portal');
    return;
  }

  const text = dt.getData('text/plain');
  if (text && text.trim()) {
    const res = await api.invoke('portal:stage-text', { title: 'Dropped Snippet', text: text.trim() });
    if (res && res.snap) applySnap(res.snap);
    addMsg('sys', 'Staged dropped text snippet to Pixel 10 Portal Cargo. Drag Zoth off the right screen edge to beam!');
    announce('Snippet staged to Pixel 10 Portal');
  }
});

btnMem.addEventListener('click', () => {
  const open = !memEl.classList.contains('on');
  closePanels();
  memEl.classList.toggle('on', open);
  syncPanels();
  if (open && memInput) memInput.focus();
});

async function commitMemory() {
  if (!memInput) return;
  const text = memInput.value.trim();
  if (!text) return;
  memInput.value = '';
  if (/^goal:\s*/i.test(text)) {
    const goalText = text.replace(/^goal:\s*/i, '').trim();
    if (goalText) {
      const snap = await api.invoke('bot:add-goal', { text: goalText });
      applySnap(snap);
      announce('Goal added');
    }
    return;
  }
  const snap = await api.invoke('bot:remember', { text });
  applySnap(snap);
  announce('Memory committed');
}

if (memAddBtn) {
  memAddBtn.addEventListener('click', commitMemory);
}
if (memInput) {
  memInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitMemory();
    }
  });
}

/* ============================================================================
   SOVEREIGN BOT MAKER & AVATAR FORGE CONTROLLER
   ============================================================================ */
const BM_MASKS = [
  { id: 'azoth', label: 'Azoth 24K' },
  { id: 'oni', label: 'Cyber Oni' },
  { id: 'visor', label: 'Holo-Visor' },
  { id: 'anubis', label: 'Anubis' },
  { id: 'kitsune', label: 'Kitsune' },
  { id: 'crown', label: 'Halo Crown' },
  { id: 'none', label: 'No Mask' },
];

const BM_GENDERS = [
  { id: 'masculine', label: 'Masculine' },
  { id: 'feminine', label: 'Feminine' },
  { id: 'androgynous', label: 'Androgynous' },
  { id: 'construct', label: 'Construct' },
];

const BM_BODIES = [
  { id: 'balanced', label: 'Balanced' },
  { id: 'athletic', label: 'Athletic' },
  { id: 'slender', label: 'Slender' },
  { id: 'titan', label: 'Titan' },
  { id: 'compact', label: 'Compact' },
];

const BM_FACES = [
  { id: 'stoic', label: 'Stoic' },
  { id: 'sharp', label: 'Sharp Hunter' },
  { id: 'serene', label: 'Serene' },
  { id: 'cyber', label: 'Cyber Visage' },
  { id: 'oracle', label: 'Mystic Oracle' },
];

const BM_HAIRSTYLES = [
  { id: 'locs', label: 'Crowned Locs' },
  { id: 'fade', label: 'Taper Crop' },
  { id: 'slick', label: 'Slicked Back' },
  { id: 'long', label: 'Long Waves' },
  { id: 'buns', label: 'Space Buns' },
  { id: 'mohawk', label: 'Cyber Mohawk' },
  { id: 'afro', label: 'Crown Afro' },
  { id: 'bald', label: 'Smooth / Bald' },
];

const BM_FACIAL_HAIR = [
  { id: 'none', label: 'Clean Shaven' },
  { id: 'goatee', label: 'Goatee' },
  { id: 'beard', label: 'Full Beard' },
  { id: 'stache', label: 'Mustache' },
  { id: 'stubble', label: 'Shadow Stubble' },
];

const BM_ACCESSORIES = [
  { id: 'cuffs', label: 'Gold Ear Cuffs' },
  { id: 'scouter', label: 'Holo-Scouter' },
  { id: 'wings', label: 'Cyber Wings' },
  { id: 'horns', label: 'Oni Horns' },
  { id: 'none', label: 'None' },
];

const BM_ARCHETYPE_PRESETS = [
  {
    id: 'zoth-prime',
    label: '👑 Zoth Prime',
    avatar: {
      chassis: 'custom',
      gender: 'masculine',
      bodyType: 'athletic',
      skinColor: '#7c4b31',
      faceType: 'stoic',
      eyeColor: '#d4af37',
      hairStyle: 'locs',
      hairColor: '#141419',
      facialHair: 'goatee',
      maskStyle: 'azoth',
      accessory: 'cuffs',
      accentColor: '#d4af37',
    },
  },
  {
    id: 'valkyrie',
    label: '⚡ Valkyrie',
    avatar: {
      chassis: 'custom',
      gender: 'feminine',
      bodyType: 'athletic',
      skinColor: '#9e6643',
      faceType: 'sharp',
      eyeColor: '#38bdf8',
      hairStyle: 'long',
      hairColor: '#e2e8f0',
      facialHair: 'none',
      maskStyle: 'crown',
      accessory: 'wings',
      accentColor: '#38bdf8',
    },
  },
  {
    id: 'oracle',
    label: '🔮 Oracle',
    avatar: {
      chassis: 'custom',
      gender: 'androgynous',
      bodyType: 'slender',
      skinColor: '#4a2919',
      faceType: 'oracle',
      eyeColor: '#a855f7',
      hairStyle: 'afro',
      hairColor: '#d4af37',
      facialHair: 'none',
      maskStyle: 'anubis',
      accessory: 'cuffs',
      accentColor: '#a855f7',
    },
  },
  {
    id: 'ronin',
    label: '👹 Cyber Oni',
    avatar: {
      chassis: 'custom',
      gender: 'masculine',
      bodyType: 'titan',
      skinColor: '#2b1810',
      faceType: 'cyber',
      eyeColor: '#ef4444',
      hairStyle: 'locs',
      hairColor: '#dc2626',
      facialHair: 'beard',
      maskStyle: 'oni',
      accessory: 'horns',
      accentColor: '#ef4444',
    },
  },
  {
    id: 'kitsune',
    label: '🦊 Kitsune',
    avatar: {
      chassis: 'custom',
      gender: 'feminine',
      bodyType: 'slender',
      skinColor: '#f2cfb6',
      faceType: 'serene',
      eyeColor: '#f43f5e',
      hairStyle: 'buns',
      hairColor: '#141419',
      facialHair: 'none',
      maskStyle: 'kitsune',
      accessory: 'cuffs',
      accentColor: '#f43f5e',
    },
  },
  {
    id: 'netrunner',
    label: '🕶️ Netrunner',
    avatar: {
      chassis: 'custom',
      gender: 'construct',
      bodyType: 'balanced',
      skinColor: '#222733',
      faceType: 'cyber',
      eyeColor: '#22c55e',
      hairStyle: 'mohawk',
      hairColor: '#0ea5e9',
      facialHair: 'none',
      maskStyle: 'visor',
      accessory: 'scouter',
      accentColor: '#10b981',
    },
  },
];

const BM_CHASSIS = [
  { id: 'custom', label: 'Modular 3D Avatar' },
  { id: 'zoth-prime', label: 'Classic Zoth Scan' },
];

const BM_SKIN_SWATCHES = [
  { hex: '#2b1810', label: 'Deep Ebony' },
  { hex: '#4a2919', label: 'Rich Mahogany' },
  { hex: '#7c4b31', label: 'Warm Bronze' },
  { hex: '#9e6643', label: 'Golden Amber' },
  { hex: '#c48a62', label: 'Honey Caramel' },
  { hex: '#b88b68', label: 'Olive Terra' },
  { hex: '#e0b18e', label: 'Warm Peach' },
  { hex: '#f2cfb6', label: 'Porcelain Ivory' },
  { hex: '#222733', label: 'Obsidian Synth' },
  { hex: '#2c4c70', label: 'Astral Cobalt' },
];

const BM_HAIR_SWATCHES = [
  { hex: '#141419', label: 'Jet Black' },
  { hex: '#382215', label: 'Espresso' },
  { hex: '#d4af37', label: 'Sovereign Gold' },
  { hex: '#e2e8f0', label: 'Silver Frost' },
  { hex: '#dc2626', label: 'Crimson' },
  { hex: '#0ea5e9', label: 'Cyber Cyan' },
  { hex: '#9333ea', label: 'Void Violet' },
  { hex: '#9a3412', label: 'Copper Auburn' },
];

const BM_EYE_SWATCHES = [
  { hex: '#d4af37', label: '24K Gold' },
  { hex: '#38bdf8', label: 'Cyber Cyan' },
  { hex: '#22c55e', label: 'Emerald Matrix' },
  { hex: '#ef4444', label: 'Crimson Ember' },
  { hex: '#a855f7', label: 'Amethyst' },
  { hex: '#fff7d6', label: 'Solar White' },
  { hex: '#f97316', label: 'Amber Flame' },
  { hex: '#3b82f6', label: 'Cobalt' },
];

const BM_ACCENT_SWATCHES = [
  { hex: '#d4af37', label: 'Sovereign Gold' },
  { hex: '#38bdf8', label: 'Cyber Cyan' },
  { hex: '#ef4444', label: 'Crimson' },
  { hex: '#10b981', label: 'Emerald' },
  { hex: '#a855f7', label: 'Amethyst' },
  { hex: '#f43f5e', label: 'Rose Neon' },
];

function populateBotMakerFromMode(mode) {
  bmMode = mode === 'create' ? 'create' : 'edit';
  const curBot = (state && state.bot) || {
    id: 'zoth',
    name: 'Zoth',
    job: 'Sovereign desk companion',
    description: '',
    avatar: {},
  };
  const nameInput = document.getElementById('newName');
  const jobInput = document.getElementById('newJob');
  const descInput = document.getElementById('newDesc');
  const saveBtn = document.getElementById('newSave');
  const tabEdit = document.getElementById('bmModeEdit');
  const tabCreate = document.getElementById('bmModeCreate');

  if (tabEdit) {
    tabEdit.classList.toggle('on', bmMode === 'edit');
    tabEdit.setAttribute('aria-selected', bmMode === 'edit' ? 'true' : 'false');
  }
  if (tabCreate) {
    tabCreate.classList.toggle('on', bmMode === 'create');
    tabCreate.setAttribute('aria-selected', bmMode === 'create' ? 'true' : 'false');
  }

  if (bmMode === 'edit') {
    if (nameInput) nameInput.value = curBot.name || '';
    if (jobInput) jobInput.value = curBot.job || '';
    if (descInput) descInput.value = curBot.description || '';
    if (saveBtn) saveBtn.textContent = `SAVE ${String(curBot.name || 'BOT').toUpperCase()} AVATAR`;
    draftAvatar = {
      chassis: 'custom',
      gender: 'masculine',
      bodyType: 'balanced',
      skinColor: '#7c4b31',
      faceType: 'stoic',
      eyeColor: '#d4af37',
      hairStyle: 'locs',
      hairColor: '#141419',
      facialHair: 'none',
      maskStyle: 'azoth',
      accessory: 'cuffs',
      accentColor: '#d4af37',
      ...(curBot.avatar || {}),
    };
  } else {
    if (nameInput) nameInput.value = '';
    if (jobInput) jobInput.value = '';
    if (descInput) descInput.value = '';
    if (saveBtn) saveBtn.textContent = 'SPAWN CUSTOM TEAMMATE';
    draftAvatar = {
      chassis: 'custom',
      gender: 'feminine',
      bodyType: 'athletic',
      skinColor: '#9e6643',
      faceType: 'sharp',
      eyeColor: '#38bdf8',
      hairStyle: 'long',
      hairColor: '#e2e8f0',
      facialHair: 'none',
      maskStyle: 'crown',
      accessory: 'wings',
      accentColor: '#38bdf8',
    };
  }
  renderBotMakerControls();
  previewDraftAvatar(false);
}

let bmInspectUnmasked = false;

async function previewDraftAvatar(autoPersist = true) {
  if (!draftAvatar) return;
  if (window.ZothStage && window.ZothStage.setAvatar) {
    window.ZothStage.setAvatar(draftAvatar);
  }
  const wantMask =
    draftAvatar.maskStyle !== 'none' &&
    (!bmInspectUnmasked || draftAvatar.maskStyle === 'crown');
  applyMask(wantMask);
  const maskValEl = document.getElementById('bmMaskVal');
  if (maskValEl) {
    maskValEl.textContent = MASK_LABELS[draftAvatar.maskStyle] || 'AZOTH 24K';
  }
  if (autoPersist && bmMode === 'edit' && state && state.bot) {
    const snap = await api.invoke('bot:update', {
      id: state.bot.id,
      avatar: draftAvatar,
    });
    if (snap) {
      state = snap;
      applyMask(wantMask);
    }
  }
}

function renderPillGroup(containerId, options, currentVal, onSelect) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  options.forEach((opt) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'bm-pill' + (currentVal === opt.id ? ' on' : '');
    b.textContent = opt.label;
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', currentVal === opt.id ? 'true' : 'false');
    b.addEventListener('click', () => onSelect(opt.id));
    el.appendChild(b);
  });
}

function renderSwatchGroup(containerId, inputId, swatches, currentVal, onSelect) {
  const el = document.getElementById(containerId);
  const colorInput = document.getElementById(inputId);
  if (colorInput && currentVal) {
    colorInput.value = currentVal;
  }
  if (!el) return;
  el.innerHTML = '';
  swatches.forEach((sw) => {
    const b = document.createElement('button');
    b.type = 'button';
    const active = String(currentVal || '').toLowerCase() === sw.hex.toLowerCase();
    b.className = 'bm-swatch' + (active ? ' on' : '');
    b.style.background = sw.hex;
    b.title = `${sw.label} (${sw.hex})`;
    b.setAttribute('aria-label', sw.label);
    b.setAttribute('aria-checked', active ? 'true' : 'false');
    b.addEventListener('click', () => onSelect(sw.hex));
    el.appendChild(b);
  });
}

function renderBotMakerControls() {
  if (!draftAvatar) return;

  const presetEl = document.getElementById('bmPresetGrid');
  if (presetEl) {
    presetEl.innerHTML = '';
    BM_ARCHETYPE_PRESETS.forEach((p) => {
      const b = document.createElement('button');
      b.type = 'button';
      const isMatch =
        draftAvatar.maskStyle === p.avatar.maskStyle &&
        draftAvatar.hairStyle === p.avatar.hairStyle &&
        draftAvatar.gender === p.avatar.gender;
      b.className = 'bm-pill' + (isMatch ? ' on' : '');
      b.textContent = p.label;
      b.addEventListener('click', () => {
        draftAvatar = { ...draftAvatar, ...p.avatar };
        renderBotMakerControls();
        previewDraftAvatar(true);
        announce(`Applied ${p.label} preset`);
      });
      presetEl.appendChild(b);
    });
  }

  renderPillGroup('bmMaskGrid', BM_MASKS, draftAvatar.maskStyle, (val) => {
    draftAvatar.maskStyle = val;
    bmInspectUnmasked = val === 'none';
    const on = val !== 'none';
    applyMask(on);
    api.invoke('bot:set-mask', { on }).catch(() => {});
    const previewBtn = document.getElementById('bmMaskPreviewBtn');
    if (previewBtn) previewBtn.textContent = on ? '🎭 UNMASK' : '🎭 MASK ON';
    renderBotMakerControls();
    previewDraftAvatar(true);
  });

  renderPillGroup('bmGenderGrid', BM_GENDERS, draftAvatar.gender, (val) => {
    draftAvatar.gender = val;
    draftAvatar.chassis = 'custom';
    renderBotMakerControls();
    previewDraftAvatar(true);
  });

  renderPillGroup('bmBodyGrid', BM_BODIES, draftAvatar.bodyType, (val) => {
    draftAvatar.bodyType = val;
    renderBotMakerControls();
    previewDraftAvatar(true);
  });

  renderSwatchGroup('bmSkinSwatches', 'bmSkinCustom', BM_SKIN_SWATCHES, draftAvatar.skinColor, (hex) => {
    draftAvatar.skinColor = hex;
    draftAvatar.chassis = 'custom';
    renderBotMakerControls();
    previewDraftAvatar(true);
  });

  renderPillGroup('bmFaceGrid', BM_FACES, draftAvatar.faceType, (val) => {
    draftAvatar.faceType = val;
    draftAvatar.chassis = 'custom';
    renderBotMakerControls();
    previewDraftAvatar(true);
  });

  renderPillGroup('bmFacialHairGrid', BM_FACIAL_HAIR, draftAvatar.facialHair || 'none', (val) => {
    draftAvatar.facialHair = val;
    draftAvatar.chassis = 'custom';
    renderBotMakerControls();
    previewDraftAvatar(true);
  });

  renderPillGroup('bmHairStyleGrid', BM_HAIRSTYLES, draftAvatar.hairStyle, (val) => {
    draftAvatar.hairStyle = val;
    draftAvatar.chassis = 'custom';
    renderBotMakerControls();
    previewDraftAvatar(true);
  });

  renderPillGroup('bmAccessoryGrid', BM_ACCESSORIES, draftAvatar.accessory || 'cuffs', (val) => {
    draftAvatar.accessory = val;
    draftAvatar.chassis = 'custom';
    renderBotMakerControls();
    previewDraftAvatar(true);
  });

  renderSwatchGroup('bmHairSwatches', 'bmHairCustom', BM_HAIR_SWATCHES, draftAvatar.hairColor, (hex) => {
    draftAvatar.hairColor = hex;
    draftAvatar.chassis = 'custom';
    renderBotMakerControls();
    previewDraftAvatar(true);
  });

  renderSwatchGroup('bmEyeSwatches', 'bmEyeCustom', BM_EYE_SWATCHES, draftAvatar.eyeColor, (hex) => {
    draftAvatar.eyeColor = hex;
    draftAvatar.chassis = 'custom';
    renderBotMakerControls();
    previewDraftAvatar(true);
  });

  renderSwatchGroup('bmAccentSwatches', 'bmAccentCustom', BM_ACCENT_SWATCHES, draftAvatar.accentColor, (hex) => {
    draftAvatar.accentColor = hex;
    renderBotMakerControls();
    previewDraftAvatar(true);
  });

  renderPillGroup('bmChassisGrid', BM_CHASSIS, draftAvatar.chassis, (val) => {
    draftAvatar.chassis = val;
    renderBotMakerControls();
    previewDraftAvatar(true);
  });
}

async function openBotMaker(mode = 'edit') {
  if (root && root.classList.contains('mode-compact')) {
    setMode(false);
    await api.invoke('bot:set-mode', { compact: false }).then((s) => s && (state = s)).catch(() => {});
  }
  const alreadyOpen = newBot.classList.contains('on');
  if (alreadyOpen && bmMode === mode) {
    closePanels();
    syncPanels();
    focusComposer();
    return;
  }
  closePanels();
  newBot.classList.add('on');
  populateBotMakerFromMode(mode);
  syncPanels();
}

const botMakerBtn = document.getElementById('botMakerBtn');
if (botMakerBtn) {
  botMakerBtn.addEventListener('click', () => openBotMaker('edit'));
}
if (maskBadge) {
  maskBadge.addEventListener('click', () => openBotMaker('edit'));
}
btnNew.addEventListener('click', () => {
  if (newBot.classList.contains('on')) {
    closePanels();
    syncPanels();
  } else {
    openBotMaker('edit');
  }
});

const bmModeEdit = document.getElementById('bmModeEdit');
const bmModeCreate = document.getElementById('bmModeCreate');
if (bmModeEdit) {
  bmModeEdit.addEventListener('click', () => populateBotMakerFromMode('edit'));
}
if (bmModeCreate) {
  bmModeCreate.addEventListener('click', () => populateBotMakerFromMode('create'));
}

const bmMaskPreviewBtn = document.getElementById('bmMaskPreviewBtn');
if (bmMaskPreviewBtn) {
  bmMaskPreviewBtn.addEventListener('click', async () => {
    const next = !maskOn;
    bmInspectUnmasked = !next;
    applyMask(next);
    bmMaskPreviewBtn.textContent = next ? '🎭 UNMASK' : '🎭 MASK ON';
    await api.invoke('bot:set-mask', { on: next });
  });
}

const bmZoomBtn = document.getElementById('bmZoomBtn');
if (bmZoomBtn) {
  bmZoomBtn.addEventListener('click', () => {
    if (!window.ZothStage || !window.ZothStage.setZoom) return;
    const cur = window.ZothStage.getZoom ? window.ZothStage.getZoom() : 'bust';
    const next = cur === 'face' ? 'bust' : 'face';
    window.ZothStage.setZoom(next);
    bmZoomBtn.textContent = next === 'face' ? '🔍 BUST' : '🔍 FACE';
    announce(next === 'face' ? 'Zoomed in on face' : 'Zoomed out to bust');
  });
}

const bmCatTabs = document.getElementById('bmCatTabs');
if (bmCatTabs) {
  bmCatTabs.querySelectorAll('.bm-cat-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-cat') || 'all';
      bmCatTabs.querySelectorAll('.bm-cat-btn').forEach((b) => {
        const active = b === btn;
        b.classList.toggle('on', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      document.querySelectorAll('#newBot .bm-sec').forEach((sec) => {
        if (cat === 'all') {
          sec.hidden = false;
        } else {
          const cats = (sec.getAttribute('data-bm-cat') || '').split(/\s+/);
          sec.hidden = !cats.includes(cat);
        }
      });
      if (window.ZothStage && window.ZothStage.setZoom) {
        const wantFace = cat === 'face' || cat === 'hair';
        window.ZothStage.setZoom(wantFace ? 'face' : 'bust');
        if (bmZoomBtn) bmZoomBtn.textContent = wantFace ? '🔍 BUST' : '🔍 FACE';
      }
      // If user clicks FACE & SKIN tab, temporarily unmask so they can see the face sculpt clearly!
      if (cat === 'face') {
        bmInspectUnmasked = true;
        const keepCrown = draftAvatar && draftAvatar.maskStyle === 'crown';
        applyMask(Boolean(keepCrown));
        if (bmMaskPreviewBtn) bmMaskPreviewBtn.textContent = keepCrown ? '🎭 UNMASK' : '🎭 MASK ON';
      } else if (cat === 'mask' || cat === 'all') {
        bmInspectUnmasked = false;
        const on = Boolean(draftAvatar && draftAvatar.maskStyle !== 'none');
        applyMask(on);
        api.invoke('bot:set-mask', { on }).catch(() => {});
        if (bmMaskPreviewBtn) bmMaskPreviewBtn.textContent = on ? '🎭 UNMASK' : '🎭 MASK ON';
      }
    });
  });
}

const bmRandomBtn = document.getElementById('bmRandomBtn');
if (bmRandomBtn) {
  bmRandomBtn.addEventListener('click', () => {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    draftAvatar = {
      chassis: 'custom',
      gender: pick(BM_GENDERS).id,
      bodyType: pick(BM_BODIES).id,
      skinColor: pick(BM_SKIN_SWATCHES).hex,
      faceType: pick(BM_FACES).id,
      facialHair: pick(BM_FACIAL_HAIR).id,
      hairStyle: pick(BM_HAIRSTYLES).id,
      hairColor: pick(BM_HAIR_SWATCHES).hex,
      eyeColor: pick(BM_EYE_SWATCHES).hex,
      maskStyle: pick(BM_MASKS).id,
      accessory: pick(BM_ACCESSORIES).id,
      accentColor: pick(BM_ACCENT_SWATCHES).hex,
    };
    renderBotMakerControls();
    previewDraftAvatar(true);
    announce('Randomized 3D bot avatar');
  });
}

['bmSkinCustom', 'bmHairCustom', 'bmEyeCustom', 'bmAccentCustom'].forEach((id) => {
  const inp = document.getElementById(id);
  if (!inp) return;
  inp.addEventListener('input', () => {
    if (!draftAvatar) return;
    if (id === 'bmSkinCustom') {
      draftAvatar.skinColor = inp.value;
      draftAvatar.chassis = 'custom';
    } else if (id === 'bmHairCustom') {
      draftAvatar.hairColor = inp.value;
      draftAvatar.chassis = 'custom';
    } else if (id === 'bmEyeCustom') {
      draftAvatar.eyeColor = inp.value;
      draftAvatar.chassis = 'custom';
    } else if (id === 'bmAccentCustom') {
      draftAvatar.accentColor = inp.value;
    }
    renderBotMakerControls();
    previewDraftAvatar(true);
  });
});

btnPower.addEventListener('click', openPower);
if (modelLabel) {
  modelLabel.addEventListener('click', () => {
    if (!powerEl.classList.contains('on')) openPower();
    else {
      closePanels();
      syncPanels();
    }
  });
}

if (vitalsBadge) {
  vitalsBadge.addEventListener('click', () => {
    toggleMcpDrawer();
  });
}

if (mcpFilter) {
  mcpFilter.addEventListener('input', renderMcpHub);
}

if (mcpSyncBtn) {
  mcpSyncBtn.addEventListener('click', async () => {
    mcpSyncBtn.disabled = true;
    mcpSyncBtn.textContent = 'SYNCING...';
    const res = await api.invoke('host:mcp-sync');
    if (res && res.mcp && state) {
      state.mcp = res.mcp;
    }
    await refreshTelemetry(false);
    renderMcpHub();
    mcpSyncBtn.disabled = false;
    mcpSyncBtn.textContent = 'SYNC ALL';
    addMsg('sys', 'MCP Registry synced across Grok, AGY, Claude Code, Hermes, Codex, OpenCode & Aider.');
    announce('MCP registry synced across all harnesses');
  });
}

if (pocketOpenFolderBtn) {
  pocketOpenFolderBtn.addEventListener('click', () => {
    api.invoke('host:workspace');
  });
}

btnMask.addEventListener('click', async () => {
  const next = !maskOn;
  applyMask(next);
  const snap = await api.invoke('bot:set-mask', { on: next });
  applySnap(snap);
  announce(next ? '3D Mask equipped' : 'Unmasked');
});

if (btnVoice) {
  btnVoice.addEventListener('click', async () => {
    const next = !voiceOn;
    applyVoice(next);
    const snap = await api.invoke('bot:set-voice', { on: next });
    applySnap(snap);
    addMsg('sys', `Local TTS Voice Synthesis: ${next ? 'ENABLED 🔊' : 'MUTED'}`);
    announce(next ? 'Voice synthesis enabled' : 'Voice synthesis muted');
  });
}

if (btnSlash) {
  btnSlash.addEventListener('click', () => {
    if (!slashPalette.hidden) {
      slashPalette.hidden = true;
      input.focus();
    } else {
      slashIndex = 0;
      renderSlashPalette('');
      input.focus();
    }
  });
}

input.addEventListener('input', () => {
  const v = input.value;
  if (v.startsWith('/')) {
    slashIndex = 0;
    renderSlashPalette(v);
  } else if (slashPalette) {
    slashPalette.hidden = true;
  }
});

input.addEventListener('keydown', (e) => {
  if (slashPalette && !slashPalette.hidden) {
    const items = slashPalette.querySelectorAll('.slash-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      slashIndex = (slashIndex + 1) % Math.max(1, items.length);
      renderSlashPalette(input.value);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      slashIndex = (slashIndex - 1 + Math.max(1, items.length)) % Math.max(1, items.length);
      renderSlashPalette(input.value);
      return;
    }
    if (e.key === 'Tab' && items[slashIndex]) {
      e.preventDefault();
      items[slashIndex].click();
      return;
    }
  }
});

if (modelFilter) {
  modelFilter.addEventListener('input', fillModels);
}
if (modelSelect) {
  modelSelect.addEventListener('change', async () => {
    const model = modelSelect.value;
    if (!model) return;
    const snap = await api.invoke('bot:set-power', { model });
    applySnap(snap);
  });
}

document.getElementById('newCancel').addEventListener('click', () => {
  closePanels();
  syncPanels();
  focusComposer();
});

document.getElementById('newSave').addEventListener('click', async () => {
  const name = document.getElementById('newName').value.trim() || (state && state.bot && state.bot.name) || 'Valkyrie';
  const job = document.getElementById('newJob').value.trim() || (state && state.bot && state.bot.job) || 'Sovereign Specialist';
  const description = document.getElementById('newDesc').value.trim();

  if (bmMode === 'edit' && state && state.bot) {
    const snap = await api.invoke('bot:update', {
      id: state.bot.id,
      name,
      job,
      description,
      avatar: draftAvatar,
    });
    closePanels();
    syncPanels();
    applySnap(snap);
    addMsg('sys', `✦ Updated ${name}'s 3D Avatar & Profile (${draftAvatar.gender}, ${draftAvatar.bodyType}, ${draftAvatar.hairStyle} hair, ${MASK_LABELS[draftAvatar.maskStyle] || 'Mask'}).`);
    announce(`Saved ${name} avatar`);
    focusComposer();
    return;
  }

  seededBot = null;
  const snap = await api.invoke('bot:create', {
    name,
    job,
    description,
    avatar: draftAvatar,
  });
  closePanels();
  syncPanels();
  applySnap(snap);
  addMsg('sys', `✦ Forged new teammate ${name} (${job}) with custom 3D avatar.`);
  announce(`${name} spawned on the desk`);
  focusComposer();
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const t = input.value;
  if (!t.trim() || streaming) return;
  input.value = '';
  if (slashPalette) slashPalette.hidden = true;
  send(t);
});

btnSend.addEventListener('mousedown', (e) => e.preventDefault());

// Global keyboard shortcuts inside Zoth Bot (Alt+1..8, Alt+M, Escape)
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (slashPalette && !slashPalette.hidden) {
      slashPalette.hidden = true;
      return;
    }
    if (panelOpen()) {
      closePanels();
      syncPanels();
      focusComposer();
    }
    return;
  }
  if (e.altKey && !e.ctrlKey && !e.metaKey) {
    if (e.key === '1') {
      e.preventDefault();
      btnMask.click();
    } else if (e.key === '2') {
      e.preventDefault();
      btnPower.click();
    } else if (e.key === '3') {
      e.preventDefault();
      btnMem.click();
    } else if (e.key === '4' && btnVoice) {
      e.preventDefault();
      btnVoice.click();
    } else if (e.key === '5') {
      e.preventDefault();
      btnNew.click();
    } else if (e.key === '6') {
      e.preventDefault();
      toggleMcpDrawer();
    } else if (e.key === '7') {
      e.preventDefault();
      togglePocketDrawer();
    } else if (e.key === '8') {
      e.preventDefault();
      togglePortalDrawer();
    } else if (e.key.toLowerCase() === 'm') {
      e.preventDefault();
      document.getElementById('btnMin').click();
    }
  }
});

api.on('ui:mode', (m) => setMode(Boolean(m && m.compact)));
api.on('ui:engine', (m) => {
  if (m && m.bot) applySnap(m);
  else applyPowerLabels(m || {});
});
api.on('portal:edge', (edge) => {
  const active = Boolean(edge && edge.active);
  root.classList.toggle('portal-active', active);
  if (edgePortalLabel && active) {
    const pct = Math.round(((edge && edge.penetration) || 0) * 100);
    edgePortalLabel.textContent =
      pct >= 38 ? `RELEASE TO BEAM TO PIXEL 10 (${pct}%) ⟶` : `PIXEL 10 EDGE PORTAL (${pct}%) ⟶`;
  }
});
api.on('portal:status', (payload) => {
  if (payload && payload.bot) {
    applySnap(payload);
  } else if (state && payload) {
    state.portal = payload;
    renderPortal(state);
    renderChips(state);
  }
});
api.on('portal:cargo-in', (payload) => {
  if (!payload) return;
  const item = payload.item || payload;
  addMsg('sys', `📲 Received from Pixel 10: ${item.title || 'Cargo'}${item.text ? '\n' + item.text : ''}`);
  announce(`Received ${item.title || 'Cargo'} from Pixel 10`);
  if (payload.snap) applySnap(payload.snap);
  else api.invoke('bot:snapshot').then(applySnap);
});
api.on('chat:tool', (info) => {
  if (!info) return;
  if (info.phase === 'use') addMsg('tool', '▸ ' + (info.name || 'tool'));
  else if (info.phase === 'result') {
    const bit = String(info.output || '').trim().split('\n')[0].slice(0, 120);
    addMsg('tool', '◂ ' + (info.name || 'tool') + (bit ? ' · ' + bit : ''));
  }
});
api.on('chat:approval', (info) => {
  const el = addMsg('sys', 'Run in the pocket workspace?\n' + (info && info.command));
  const row = document.createElement('div');
  row.className = 'approve';
  const yes = document.createElement('button');
  yes.type = 'button';
  yes.textContent = 'ALLOW';
  const no = document.createElement('button');
  no.type = 'button';
  no.className = 'ghost';
  no.textContent = 'DENY';
  const done = (ok) => {
    yes.disabled = true;
    no.disabled = true;
    api.invoke('host:approve', { id: info.id, ok });
  };
  yes.addEventListener('click', () => done(true));
  no.addEventListener('click', () => done(false));
  row.appendChild(yes);
  row.appendChild(no);
  el.appendChild(row);
});
api.on('job:pulse', (evt) => {
  if (evt && evt.body) addMsg('sys', evt.body);
  refreshTelemetry(false);
});

window.addEventListener('zoth-stage-ready', () => {
  placeStage(root.classList.contains('mode-compact'));
  if (state && state.bot && state.bot.avatar && window.ZothStage && window.ZothStage.setAvatar) {
    window.ZothStage.setAvatar(state.bot.avatar);
  }
  if (window.ZothStage && window.ZothStage.setMask) window.ZothStage.setMask(maskOn);
});

api.invoke('bot:snapshot').then((snap) => {
  applySnap(snap);
  refreshTelemetry(false);
  return api.invoke('host:catalog', { force: false });
}).then((cat) => {
  catalog = cat;
  fillModels();
  renderFeatured(state || {});
  return ensureFittingModel();
});
setInterval(() => refreshTelemetry(false), 30000);
