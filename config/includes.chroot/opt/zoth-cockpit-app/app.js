const { ipcRenderer } = require('electron');

// ── State variables ──
let currentState = null;
let currentAgentFilter = 'All';
let selectedAgent = null;

// ── Window Controls ──
document.getElementById('btn-win-min').addEventListener('click', () => {
  ipcRenderer.send('window-minimize');
});

document.getElementById('btn-win-max').addEventListener('click', () => {
  ipcRenderer.send('window-maximize');
});

document.getElementById('btn-win-close').addEventListener('click', () => {
  ipcRenderer.send('window-close');
});

document.getElementById('btn-launch-tui').addEventListener('click', () => {
  ipcRenderer.invoke('launch-tool', { toolId: 'zoth-cockpit-tui' });
  showToast('Launching ZOTHOS Cockpit Terminal Curses TUI...');
});

document.getElementById('btn-netkill-header').addEventListener('click', () => {
  if (confirm('ENGAGE EMERGENCY NETKILL?\nThis will immediately air-gap all networking interfaces!')) {
    ipcRenderer.invoke('launch-tool', { toolId: 'zoth-netkill' });
    showToast('Emergency Netkill quarantine engaged!', 'crimson');
  }
});

// ── Navigation Tabs ──
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabButtons.forEach((b) => b.classList.remove('active'));
    tabPanes.forEach((p) => p.classList.remove('active'));

    btn.classList.add('active');
    const targetId = btn.getAttribute('data-tab');
    const targetPane = document.getElementById(targetId);
    if (targetPane) targetPane.classList.add('active');
  });
});

// ── Filter Pills for Agents ──
const filterPills = document.querySelectorAll('.filter-pill');
filterPills.forEach((pill) => {
  pill.addEventListener('click', () => {
    filterPills.forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    currentAgentFilter = pill.getAttribute('data-filter');
    if (currentState && currentState.agents) {
      renderAgents(currentState.agents);
    }
  });
});

// ── Telemetry Update Handler ──
ipcRenderer.on('telemetry-update', (event, data) => {
  currentState = data;
  updateTelemetryUI(data.telemetry);
  updateDaemonsUI(data.daemons);
  updateAgentsUI(data.agents);
  updateRealityUI(data.telemetry.activeMode);
});

// Initial boot snapshot request
ipcRenderer.invoke('get-full-state').then((data) => {
  if (data) {
    currentState = data;
    updateTelemetryUI(data.telemetry);
    updateDaemonsUI(data.daemons);
    updateAgentsUI(data.agents);
    updateRealityUI(data.telemetry.activeMode);
  }
});

// ── UI Updaters ──
function updateTelemetryUI(t) {
  if (!t) return;

  // Titlebar Pills
  const txtProfile = document.getElementById('txt-profile');
  const pillProfile = document.getElementById('pill-profile');
  const modeUpper = (t.activeMode || 'GOLD').toUpperCase();
  txtProfile.textContent = `PROFILE: ${modeUpper}`;
  pillProfile.className = 'head-pill ' + (modeUpper === 'GHOST' ? 'crimson' : modeUpper === 'MATRIX' ? 'emerald' : modeUpper === 'CYAN' ? 'cyan' : 'gold');

  const txtTor = document.getElementById('txt-tor');
  const pillTor = document.getElementById('pill-tor');
  txtTor.textContent = t.tor.isCloaked ? 'TOR: CLOAKED' : 'TOR: CLEARENET';
  pillTor.className = 'head-pill ' + (t.tor.isCloaked ? 'emerald' : 'crimson');

  document.getElementById('txt-ip').textContent = t.net.ip || '127.0.0.1';

  // Global Cursor Tracker
  const cur = t.cursor || { x: 0, y: 0, daemonAlive: false, moving: false };
  const txtCursor = document.getElementById('txt-cursor');
  const pillCursor = document.getElementById('pill-cursor');
  if (cur.daemonAlive) {
    txtCursor.textContent = `CURSOR: ${cur.x}, ${cur.y}`;
    pillCursor.style.borderColor = 'rgba(0, 229, 255, 0.35)';
    pillCursor.style.color = 'var(--cyan)';
    document.getElementById('val-cursor-coords').textContent = `X: ${cur.x}  Y: ${cur.y}`;
    document.getElementById('val-cursor-status').textContent = cur.moving ? '● Tracker Active (Moving)' : '● Tracker Active (Stationary)';
    document.getElementById('val-cursor-status').style.color = 'var(--cyan)';
  } else {
    txtCursor.textContent = 'CURSOR: OFF';
    pillCursor.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    pillCursor.style.color = 'var(--text-muted)';
    document.getElementById('val-cursor-coords').textContent = 'X: --  Y: --';
    document.getElementById('val-cursor-status').textContent = '○ Daemon Inactive';
    document.getElementById('val-cursor-status').style.color = 'var(--text-muted)';
  }

  // Map pointer onto radar canvas
  const screenW = window.screen.width || 1920;
  const screenH = window.screen.height || 1080;
  const radarDot = document.getElementById('radar-pointer');
  if (radarDot) {
    const rx = Math.max(8, Math.min(92, (cur.x / screenW) * 100));
    const ry = Math.max(8, Math.min(92, (cur.y / screenH) * 100));
    radarDot.style.left = `${rx}%`;
    radarDot.style.top = `${ry}%`;
    radarDot.style.opacity = cur.daemonAlive ? '1' : '0.2';
  }

  // CPU Dial
  const cpuPct = t.cpu.pct || 0;
  document.getElementById('val-cpu-pct').textContent = `${cpuPct.toFixed(1)}%`;
  const cpuOffset = 314 * (1 - cpuPct / 100);
  const circleCpu = document.getElementById('circle-cpu');
  circleCpu.style.strokeDashoffset = cpuOffset;
  circleCpu.style.stroke = cpuPct > 80 ? 'var(--crimson)' : cpuPct > 50 ? 'var(--gold)' : 'var(--emerald)';
  document.getElementById('val-cpu-sub').textContent = `${t.cpu.cores} Cores · Load: ${(t.cpu.loads || [0, 0, 0]).join(', ')}`;
  document.getElementById('val-cpu-model').textContent = t.cpu.model || '';

  // RAM Dial
  const ramPct = t.ram.pct || 0;
  document.getElementById('val-ram-pct').textContent = `${ramPct.toFixed(1)}%`;
  const ramOffset = 314 * (1 - ramPct / 100);
  const circleRam = document.getElementById('circle-ram');
  circleRam.style.strokeDashoffset = ramOffset;
  document.getElementById('val-ram-sub').textContent = `${t.ram.used_gb.toFixed(1)} GB / ${t.ram.total_gb.toFixed(1)} GB`;
  document.getElementById('val-swap-sub').textContent = `Swap: ${t.ram.swap_used_gb.toFixed(1)} GB / ${t.ram.swap_total_gb.toFixed(1)} GB (${t.ram.swap_pct.toFixed(1)}%)`;

  // Disk Dial
  const diskPct = t.disk.pct || 0;
  document.getElementById('val-disk-pct').textContent = `${diskPct.toFixed(1)}%`;
  const diskOffset = 314 * (1 - diskPct / 100);
  const circleDisk = document.getElementById('circle-disk');
  circleDisk.style.strokeDashoffset = diskOffset;
  document.getElementById('val-disk-sub').textContent = `${t.disk.used_gb.toFixed(1)} GB / ${t.disk.total_gb.toFixed(1)} GB`;
  document.getElementById('val-disk-free').textContent = `${t.disk.free_gb.toFixed(1)} GB Free Space`;

  // Network & Cloaking Matrix
  document.getElementById('txt-info-ip').textContent = `${t.net.ip} (${t.net.iface})`;
  document.getElementById('txt-info-gw').textContent = t.net.gw || 'None';
  document.getElementById('txt-info-tor').textContent = t.tor.status;
  document.getElementById('txt-info-tor').style.color = t.tor.isCloaked ? 'var(--emerald)' : 'var(--crimson)';
  document.getElementById('txt-info-ghost').textContent = t.activeMode === 'ghost' ? 'Active (Amnesic RAM)' : 'Disabled (Persistent Enclave)';
  document.getElementById('txt-info-ghost').style.color = t.activeMode === 'ghost' ? 'var(--crimson)' : 'var(--text-dim)';

  // Host Specs
  document.getElementById('txt-info-kernel').textContent = t.system.kernel || '--';
  document.getElementById('txt-info-arch').textContent = `${t.system.arch} (${t.system.host})`;
  document.getElementById('txt-info-session').textContent = `${t.system.desktop} / ${t.system.session} (User: ${t.system.user})`;
  document.getElementById('txt-info-uptime').textContent = t.uptime;
}

// ── Daemons UI ──
function updateDaemonsUI(daemons) {
  if (!daemons) return;
  const container = document.getElementById('daemon-cards-container');
  if (!container) return;

  if (container.children.length !== daemons.length) {
    container.innerHTML = '';
    daemons.forEach((d) => {
      const card = document.createElement('div');
      card.className = 'daemon-card';
      card.id = `dcard-${d.id}`;
      card.innerHTML = `
        <div class="daemon-top">
          <div>
            <div class="daemon-title">${d.name}</div>
            <div class="daemon-desc">${d.desc}</div>
          </div>
          ${d.port > 0 ? `<div class="daemon-port">:${d.port}</div>` : ''}
        </div>
        <div class="daemon-actions">
          <div class="daemon-status-chip ${d.isUp ? 'status-online' : 'status-offline'}" id="dchip-${d.id}" style="color: ${d.isUp ? 'var(--emerald)' : 'var(--text-muted)'};">
            <span class="pulse-dot" style="display:${d.isUp ? 'inline-block' : 'none'};"></span>
            <span id="dtxt-${d.id}">${d.isUp ? '● ONLINE' : '○ OFFLINE'}</span>
          </div>
          <div class="daemon-btns">
            <button class="btn-daemon start" onclick="controlDaemon('${d.id}', 'start')">START</button>
            <button class="btn-daemon restart" onclick="controlDaemon('${d.id}', 'restart')">RESTART</button>
            <button class="btn-daemon stop" onclick="controlDaemon('${d.id}', 'stop')">STOP</button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  } else {
    daemons.forEach((d) => {
      const chip = document.getElementById(`dchip-${d.id}`);
      const txt = document.getElementById(`dtxt-${d.id}`);
      if (chip && txt) {
        chip.style.color = d.isUp ? 'var(--emerald)' : 'var(--text-muted)';
        txt.textContent = d.isUp ? '● ONLINE' : '○ OFFLINE';
        const dot = chip.querySelector('.pulse-dot');
        if (dot) dot.style.display = d.isUp ? 'inline-block' : 'none';
      }
    });
  }
}

// ── Agents UI ──
function updateAgentsUI(agents) {
  if (!agents) return;
  renderAgents(agents);
}

function renderAgents(agents) {
  const container = document.getElementById('agent-cards-container');
  if (!container) return;

  const filtered = currentAgentFilter === 'All'
    ? agents
    : agents.filter((a) => a.cadre.toLowerCase() === currentAgentFilter.toLowerCase());

  container.innerHTML = '';
  filtered.forEach((a) => {
    const card = document.createElement('div');
    card.className = 'agent-card';
    card.onclick = () => openAgentModal(a);

    const cadreClass = `cadre-${a.cadre.toLowerCase()}`;
    const avatarSrc = `assets/agents/${a.img}`;

    card.innerHTML = `
      <div class="agent-card-top">
        <img class="agent-avatar" src="${avatarSrc}" onerror="this.src='assets/icon.png';" alt="${a.name}" />
        <div class="agent-meta">
          <div class="agent-name">
            ${a.name}
            <span class="agent-cadre-tag ${cadreClass}">${a.cadre}</span>
          </div>
          <div class="agent-role" title="${a.role}">${a.role}</div>
        </div>
      </div>
      <div class="agent-card-bottom">
        <span class="agent-ring">${a.ring}</span>
        <span class="agent-status-badge ${a.isOnline ? 'online' : 'offline'}">
          <span class="pulse-dot" style="display:${a.isOnline ? 'inline-block' : 'none'};"></span>
          ${a.isOnline ? 'READY' : 'BUS IDLE'}
        </span>
      </div>
    `;
    container.appendChild(card);
  });
}

// ── Reality Profiles UI ──
function updateRealityUI(activeMode) {
  const modes = ['gold', 'ghost', 'matrix', 'cyan', 'incognito'];
  modes.forEach((m) => {
    const card = document.getElementById(`rcard-${m}`);
    if (card) {
      if (m === activeMode || (m === 'incognito' && activeMode === 'win11')) {
        card.classList.add('active-profile');
        card.style.borderColor = 'var(--gold)';
      } else {
        card.classList.remove('active-profile');
        card.style.borderColor = '';
      }
    }
  });
}

// ── Global Actions ──
window.controlDaemon = async function (daemonId, action) {
  showToast(`[${action.toUpperCase()}] Triggering ${daemonId}...`);
  const res = await ipcRenderer.invoke('daemon-action', { daemonId, action });
  if (res.success) {
    showToast(`✓ ${res.message}`, 'emerald');
  } else {
    showToast(`✕ Error: ${res.message}`, 'crimson');
  }
};

window.switchMode = async function (mode) {
  showToast(`Engaging Reality Mode [${mode.toUpperCase()}]...`);
  const res = await ipcRenderer.invoke('switch-reality-mode', { mode });
  if (res.success) {
    showToast(`✓ Reality Mode [${mode.toUpperCase()}] engaged!`, 'gold');
    updateRealityUI(mode);
  } else {
    showToast(`✕ Mode switch error: ${res.error || 'Failed'}`, 'crimson');
  }
};

window.launchTool = async function (toolId) {
  showToast(`Launching ${toolId}...`);
  const res = await ipcRenderer.invoke('launch-tool', { toolId });
  if (res.success) {
    showToast(`✓ ${toolId} launched.`, 'emerald');
  } else {
    showToast(`✕ Failed to launch ${toolId}`, 'crimson');
  }
};

// ── Modal Handling ──
const agentModal = document.getElementById('agent-modal');
const modalName = document.getElementById('modal-agent-name');
const modalImg = document.getElementById('modal-agent-img');
const modalRole = document.getElementById('modal-agent-role');
const modalBus = document.getElementById('modal-agent-bus');
const modalPrompt = document.getElementById('modal-prompt-input');
const modalResponse = document.getElementById('modal-response-box');

function openAgentModal(agent) {
  selectedAgent = agent;
  modalName.textContent = `SOVEREIGN AGENT // ${agent.name.toUpperCase()} (${agent.cadre.toUpperCase()})`;
  modalImg.src = `assets/agents/${agent.img}`;
  modalRole.textContent = agent.role;
  modalBus.textContent = `Execution Ring: ${agent.ring} · Socket: ipc:///run/zoth/${agent.id.toLowerCase()}.sock`;
  modalPrompt.value = '';
  modalResponse.style.display = 'none';
  modalResponse.textContent = '';
  agentModal.classList.add('active');
}

document.getElementById('btn-close-modal').addEventListener('click', () => {
  agentModal.classList.remove('active');
});

agentModal.addEventListener('click', (e) => {
  if (e.target === agentModal) agentModal.classList.remove('active');
});

document.getElementById('btn-submit-prompt').addEventListener('click', async () => {
  if (!selectedAgent) return;
  const prompt = modalPrompt.value.trim();
  if (!prompt) return;

  modalResponse.style.display = 'block';
  modalResponse.textContent = `Dispatching task to ${selectedAgent.name}...`;

  const res = await ipcRenderer.invoke('dispatch-agent-prompt', {
    agentId: selectedAgent.id,
    prompt,
  });

  if (res.success) {
    modalResponse.textContent = `[${selectedAgent.name.toUpperCase()} OUTPUT]:\n\n${res.text}`;
  } else {
    modalResponse.textContent = `[BUS ERROR]:\n${res.text}`;
  }
});

// ── Toast Notification Engine ──
function showToast(message, type = 'gold') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.borderColor = type === 'crimson' ? 'var(--crimson)' : type === 'emerald' ? 'var(--emerald)' : 'var(--gold)';
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}
