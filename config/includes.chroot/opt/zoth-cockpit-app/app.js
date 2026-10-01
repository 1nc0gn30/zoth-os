const { ipcRenderer } = require('electron');

// ── State variables ──
let currentState = null;
let currentAgentFilter = 'All';
let selectedAgent = null;

// Circular history buffers for rolling sparklines (60s)
const MAX_SPARK_POINTS = 40;
const cpuHistory = [];
const ramHistory = [];
const netHistory = [];

// Audio Synthesizer State
let audioCtx = null;
let audioEnabled = localStorage.getItem('zoth_cockpit_audio') !== 'false';

// ── Web Audio Synthesizer (Alchemical Soundscapes) ──
function initAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playTone(freq, type = 'sine', duration = 0.08, gainVal = 0.04) {
  if (!audioEnabled) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Audio context may require interaction
  }
}

function soundChirp() {
  playTone(880, 'sine', 0.04, 0.03);
}

function soundTabSwitch() {
  playTone(520, 'sine', 0.05, 0.025);
  setTimeout(() => playTone(680, 'sine', 0.06, 0.025), 45);
}

function soundRealityShift() {
  if (!audioEnabled) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, audioCtx.currentTime + 0.22);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {}
}

function soundWarning() {
  playTone(240, 'sawtooth', 0.12, 0.05);
}

function soundSuccess() {
  playTone(660, 'sine', 0.06, 0.03);
  setTimeout(() => playTone(990, 'sine', 0.09, 0.03), 60);
}

// ── Audio Toggle Header Control ──
const btnAudioToggle = document.getElementById('btn-audio-toggle');
if (btnAudioToggle) {
  const updateAudioBtnUI = () => {
    btnAudioToggle.textContent = audioEnabled ? '🔊 Audio: ON' : '🔈 Audio: OFF';
    btnAudioToggle.style.color = audioEnabled ? 'var(--gold)' : 'var(--text-dim)';
  };
  updateAudioBtnUI();

  btnAudioToggle.addEventListener('click', () => {
    audioEnabled = !audioEnabled;
    localStorage.setItem('zoth_cockpit_audio', audioEnabled ? 'true' : 'false');
    updateAudioBtnUI();
    if (audioEnabled) {
      soundChirp();
      showToast('Alchemical Soundscapes Enabled', 'gold');
    } else {
      showToast('Soundscapes Muted', 'crimson');
    }
  });
}

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
  soundChirp();
  ipcRenderer.invoke('launch-tool', { toolId: 'zoth-cockpit-tui' });
  showToast('Launching ZOTHOS Cockpit Terminal Curses TUI...');
});

document.getElementById('btn-netkill-header').addEventListener('click', () => {
  soundWarning();
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
    soundTabSwitch();
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
    soundChirp();
    filterPills.forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    currentAgentFilter = pill.getAttribute('data-filter');
    if (currentState && currentState.agents) {
      renderAgents(currentState.agents);
    }
  });
});

// ── Sparkline Drawing Function ──
function drawSparkline(canvasId, data, rgb = [255, 215, 0], maxScale = 100) {
  try {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    if (data.length < 2) return;

    const step = w / (MAX_SPARK_POINTS - 1);
    const clampedMax = Math.max(maxScale, 1);
    const strokeColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 1)`;
    const fillColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.32)`;
    const transColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`;

    // Gradient fill under line
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, fillColor);
    grad.addColorStop(1, transColor);

    ctx.beginPath();
    data.forEach((val, i) => {
      const x = i * step;
      const y = Math.max(2, Math.min(h - 2, h - (val / clampedMax) * (h - 4) - 2));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.lineTo((data.length - 1) * step, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Stroke line
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = i * step;
      const y = Math.max(2, Math.min(h - 2, h - (val / clampedMax) * (h - 4) - 2));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pulse dot at tip
    const lastIdx = data.length - 1;
    const lastX = lastIdx * step;
    const lastY = Math.max(2, Math.min(h - 2, h - (data[lastIdx] / clampedMax) * (h - 4) - 2));
    ctx.beginPath();
    ctx.arc(lastX, lastY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.fill();
  } catch (e) {
    console.error('drawSparkline error:', e);
  }
}

// ── HTML Escape Helper ──
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Telemetry Update Handler ──
ipcRenderer.on('telemetry-update', (event, data) => {
  currentState = data;
  updateTelemetryUI(data.telemetry);
  updateDaemonsUI(data.daemons);
  updateAgentsUI(data.agents);
  updateMeshKPIsUI(data.meshKPIs);
  updateRealityUI(data.telemetry.activeMode);
});

// Initial boot snapshot request
ipcRenderer.invoke('get-full-state').then((data) => {
  if (data) {
    currentState = data;
    updateTelemetryUI(data.telemetry);
    updateDaemonsUI(data.daemons);
    updateAgentsUI(data.agents);
    updateMeshKPIsUI(data.meshKPIs);
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
  pillProfile.className =
    'head-pill ' +
    (modeUpper === 'GHOST'
      ? 'crimson'
      : modeUpper === 'MATRIX'
      ? 'emerald'
      : modeUpper === 'CYAN'
      ? 'cyan'
      : 'gold');

  const txtTor = document.getElementById('txt-tor');
  const pillTor = document.getElementById('pill-tor');
  if (txtTor) txtTor.textContent = t.tor.isCloaked ? 'TOR: CLOAKED' : 'TOR: CLEARENET';
  if (pillTor) pillTor.className = 'head-pill ' + (t.tor.isCloaked ? 'emerald' : 'crimson');

  // Network Throughput UI
  const netRxSpeed = t.net.rxSpeedStr || '0.0 KB/s';
  const netTxSpeed = t.net.txSpeedStr || '0.0 KB/s';
  const txtNetSpeed = document.getElementById('txt-net-speed');
  if (txtNetSpeed) txtNetSpeed.textContent = `↓ ${netRxSpeed}  ↑ ${netTxSpeed}`;

  const valRxSpeed = document.getElementById('val-rx-speed');
  if (valRxSpeed) valRxSpeed.textContent = netRxSpeed;
  const valTxSpeed = document.getElementById('val-tx-speed');
  if (valTxSpeed) valTxSpeed.textContent = netTxSpeed;

  // Global Cursor Tracker
  const cur = t.cursor || { x: 0, y: 0, daemonAlive: false, moving: false };
  const txtCursor = document.getElementById('txt-cursor');
  const pillCursor = document.getElementById('pill-cursor');
  if (cur.daemonAlive) {
    txtCursor.textContent = `CURSOR: ${cur.x}, ${cur.y}`;
    pillCursor.style.borderColor = 'rgba(0, 229, 255, 0.35)';
    pillCursor.style.color = 'var(--cyan)';
    document.getElementById('val-cursor-coords').textContent = `X: ${cur.x}  Y: ${cur.y}`;
    document.getElementById('val-cursor-status').textContent = cur.moving
      ? '● Tracker Active (Moving)'
      : '● Tracker Active (Stationary)';
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

  // CPU Dial & Sparkline
  const cpuPct = t.cpu.pct || 0;
  document.getElementById('val-cpu-pct').textContent = `${cpuPct.toFixed(1)}%`;
  const cpuOffset = 314 * (1 - cpuPct / 100);
  const circleCpu = document.getElementById('circle-cpu');
  circleCpu.style.strokeDashoffset = cpuOffset;
  const cpuRgb = cpuPct > 80 ? [244, 63, 94] : cpuPct > 50 ? [255, 215, 0] : [0, 255, 157];
  circleCpu.style.stroke = `rgb(${cpuRgb.join(',')})`;
  document.getElementById('val-cpu-sub').textContent = `${t.cpu.cores} Cores · Load: ${(t.cpu.loads || [0, 0, 0]).join(', ')}`;
  document.getElementById('val-cpu-model').textContent = t.cpu.model || '';

  cpuHistory.push(cpuPct);
  if (cpuHistory.length > MAX_SPARK_POINTS) cpuHistory.shift();
  drawSparkline('spark-cpu', cpuHistory, cpuRgb, 100);

  // RAM Dial & Sparkline
  const ramPct = t.ram.pct || 0;
  document.getElementById('val-ram-pct').textContent = `${ramPct.toFixed(1)}%`;
  const ramOffset = 314 * (1 - ramPct / 100);
  const circleRam = document.getElementById('circle-ram');
  circleRam.style.strokeDashoffset = ramOffset;
  document.getElementById('val-ram-sub').textContent = `${t.ram.used_gb.toFixed(1)} GB / ${t.ram.total_gb.toFixed(1)} GB`;
  document.getElementById('val-swap-sub').textContent = `Swap: ${t.ram.swap_used_gb.toFixed(1)} GB / ${t.ram.swap_total_gb.toFixed(1)} GB (${t.ram.swap_pct.toFixed(1)}%)`;

  ramHistory.push(ramPct);
  if (ramHistory.length > MAX_SPARK_POINTS) ramHistory.shift();
  drawSparkline('spark-ram', ramHistory, [0, 229, 255], 100);

  // Disk Dial
  const diskPct = t.disk.pct || 0;
  document.getElementById('val-disk-pct').textContent = `${diskPct.toFixed(1)}%`;
  const diskOffset = 314 * (1 - diskPct / 100);
  const circleDisk = document.getElementById('circle-disk');
  circleDisk.style.strokeDashoffset = diskOffset;
  document.getElementById('val-disk-sub').textContent = `${t.disk.used_gb.toFixed(1)} GB / ${t.disk.total_gb.toFixed(1)} GB`;
  document.getElementById('val-disk-free').textContent = `${t.disk.free_gb.toFixed(1)} GB Free Space`;

  // Net Sparkline
  const netRx = t.net.rx_kb_s !== undefined ? t.net.rx_kb_s : ((t.net.rxSec || 0) / 1024);
  const netTx = t.net.tx_kb_s !== undefined ? t.net.tx_kb_s : ((t.net.txSec || 0) / 1024);
  const totalNetKb = netRx + netTx;
  netHistory.push(totalNetKb);
  if (netHistory.length > MAX_SPARK_POINTS) netHistory.shift();
  const maxNetScale = Math.max(...netHistory, 20);
  drawSparkline('spark-net', netHistory, [0, 255, 157], maxNetScale);

  // Network & Cloaking Matrix
  document.getElementById('txt-info-ip').textContent = `${t.net.ip} (${t.net.iface})`;
  document.getElementById('txt-info-gw').textContent = t.net.gw || 'None';
  document.getElementById('txt-info-tor').textContent = t.tor.status;
  document.getElementById('txt-info-tor').style.color = t.tor.isCloaked ? 'var(--emerald)' : 'var(--crimson)';
  document.getElementById('txt-info-ghost').textContent = t.activeMode === 'ghost' ? 'Active (Amnesic RAM)' : 'Disabled (Persistent Enclave)';
  document.getElementById('txt-info-ghost').style.color = t.activeMode === 'ghost' ? 'var(--crimson)' : 'var(--text-dim)';

  // Top Active Processes
  updateTopProcessesUI(t.topProcesses);

  // Host Specs
  document.getElementById('txt-info-kernel').textContent = t.system.kernel || '--';
  document.getElementById('txt-info-arch').textContent = `${t.system.arch} (${t.system.host})`;
  document.getElementById('txt-info-session').textContent = `${t.system.desktop} / ${t.system.session} (User: ${t.system.user})`;
  document.getElementById('txt-info-uptime').textContent = t.uptime;
}

// ── Top Active Processes UI ──
function updateTopProcessesUI(procs) {
  const container = document.getElementById('proc-list-body');
  if (!container) return;

  if (!procs || procs.length === 0) {
    container.innerHTML = '<div style="padding: 10px; color: var(--text-dim); text-align: center; font-size: 11px;">Scanning active processes...</div>';
    return;
  }

  let html = '';
  procs.slice(0, 6).forEach((p) => {
    const rawCmd = p.comm || p.cmd || 'unknown';
    const isProtected = p.pid <= 1 || rawCmd.includes('zoth-cockpit') || rawCmd.includes('systemd');
    const safeCmd = escapeHtml(rawCmd);
    const escapedCmdParam = safeCmd.replace(/'/g, "\\'");

    html += `
      <div class="proc-row">
        <span style="color:var(--text-dim);">${p.pid}</span>
        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${safeCmd}">${safeCmd}</span>
        <span style="color:var(--gold); font-weight:700;">${p.cpu}%</span>
        <span style="color:var(--cyan);">${p.mem}%</span>
        <span>
          <button class="btn-kill-proc" onclick="killProcess(${p.pid}, '${escapedCmdParam}')" ${isProtected ? 'disabled style="opacity:0.25; cursor:not-allowed;"' : ''} title="${isProtected ? 'Protected process' : 'Terminate process'}">✕</button>
        </span>
      </div>
    `;
  });
  container.innerHTML = html;
}

// ── Process Terminate Action ──
window.killProcess = async function (pid, cmd) {
  soundWarning();
  if (!confirm(`TERMINATE PROCESS?\nPID: ${pid}\nCMD: ${cmd}\n\nSend SIGTERM/SIGKILL signal?`)) {
    return;
  }
  showToast(`Terminating PID ${pid}...`, 'crimson');
  const res = await ipcRenderer.invoke('kill-process', { pid });
  if (res && res.success) {
    soundSuccess();
    showToast(`✓ Process ${pid} terminated`, 'emerald');
  } else {
    soundWarning();
    showToast(`✕ Failed to terminate process ${pid}`, 'crimson');
  }
};

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
      const escapedName = escapeHtml(d.name).replace(/'/g, "\\'");
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
            <button class="btn-daemon logs" onclick="viewDaemonLogs('${d.id}', '${escapedName}')">LOGS</button>
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

// ── Daemon Logs Modal Logic ──
let currentLogDaemonId = null;
let currentLogDaemonName = '';
let logRefreshTimer = null;

const daemonLogsModal = document.getElementById('daemon-logs-modal');
const logsModalTitle = document.getElementById('logs-modal-title');
const logsModalDesc = document.getElementById('logs-modal-desc');
const logViewerContent = document.getElementById('log-viewer-content');
const btnCloseLogsModal = document.getElementById('btn-close-logs-modal');
const btnRefreshLogs = document.getElementById('btn-refresh-logs');
const btnCopyLogs = document.getElementById('btn-copy-logs');

window.viewDaemonLogs = async function (daemonId, daemonName) {
  soundChirp();
  currentLogDaemonId = daemonId;
  currentLogDaemonName = daemonName || daemonId;

  if (logsModalTitle) logsModalTitle.textContent = `DAEMON LOG // ${currentLogDaemonName.toUpperCase()} (${daemonId})`;
  if (logsModalDesc) logsModalDesc.textContent = 'Streaming loopback output from /proc, journalctl, and /tmp';
  if (logViewerContent) logViewerContent.textContent = 'Fetching daemon log stream...';
  if (daemonLogsModal) daemonLogsModal.classList.add('active');

  await fetchDaemonLogs(daemonId, true);

  if (logRefreshTimer) clearInterval(logRefreshTimer);
  logRefreshTimer = setInterval(() => {
    if (daemonLogsModal && daemonLogsModal.classList.contains('active') && currentLogDaemonId) {
      fetchDaemonLogs(currentLogDaemonId, false);
    } else {
      clearInterval(logRefreshTimer);
      logRefreshTimer = null;
    }
  }, 2500);
};

async function fetchDaemonLogs(daemonId, showLoading = true) {
  if (showLoading && logViewerContent) {
    logViewerContent.textContent = 'Reading log buffer...';
  }
  const res = await ipcRenderer.invoke('get-daemon-logs', { daemonId });
  if (res && res.success) {
    if (logViewerContent) {
      logViewerContent.textContent = res.logs || 'No log lines recorded for this service.';
      logViewerContent.scrollTop = logViewerContent.scrollHeight;
    }
  } else {
    if (logViewerContent) {
      logViewerContent.textContent = `Failed to read logs: ${res ? res.logs : 'Unknown error'}`;
    }
  }
}

if (btnCloseLogsModal) {
  btnCloseLogsModal.addEventListener('click', () => {
    if (daemonLogsModal) daemonLogsModal.classList.remove('active');
    if (logRefreshTimer) {
      clearInterval(logRefreshTimer);
      logRefreshTimer = null;
    }
  });
}

if (daemonLogsModal) {
  daemonLogsModal.addEventListener('click', (e) => {
    if (e.target === daemonLogsModal) {
      daemonLogsModal.classList.remove('active');
      if (logRefreshTimer) {
        clearInterval(logRefreshTimer);
        logRefreshTimer = null;
      }
    }
  });
}

if (btnRefreshLogs) {
  btnRefreshLogs.addEventListener('click', async () => {
    if (currentLogDaemonId) {
      soundChirp();
      await fetchDaemonLogs(currentLogDaemonId, true);
      showToast(`Logs refreshed for ${currentLogDaemonName}`, 'cyan');
    }
  });
}

if (btnCopyLogs) {
  btnCopyLogs.addEventListener('click', () => {
    if (logViewerContent && logViewerContent.textContent) {
      navigator.clipboard.writeText(logViewerContent.textContent);
      soundSuccess();
      showToast('Log contents copied to clipboard', 'emerald');
    }
  });
}

// ── Agents UI ──
function updateAgentsUI(agents) {
  if (!agents) return;
  renderAgents(agents);
}

function renderAgents(agents) {
  const container = document.getElementById('agent-cards-container');
  if (!container) return;

  const filtered =
    currentAgentFilter === 'All'
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
          <div class="agent-tags-row" style="margin-top: 4px;">
            <span class="agent-model-pill">${a.model || 'hermes-3'}</span>
            <span class="agent-harness-pill">${a.harness || 'ollama'}</span>
            ${a.memoriesCount ? `<span class="synapse-chip" style="font-size:8px;">${a.memoriesCount} STDP</span>` : ''}
          </div>
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

// ── Sovereign Mesh KPI Updater ──
function updateMeshKPIsUI(kpis) {
  if (!kpis) return;

  const kpiSwarm = document.getElementById('kpi-swarm-status');
  if (kpiSwarm) {
    if (kpis.swarmActive) {
      kpiSwarm.textContent = 'ONLINE (Port 8790)';
      kpiSwarm.className = 'chip-badge emerald';
    } else {
      kpiSwarm.textContent = 'STANDBY';
      kpiSwarm.className = 'chip-badge gold';
    }
  }

  const kpiBridge = document.getElementById('kpi-bridge-msgs');
  if (kpiBridge) {
    if (kpis.bridgeStats) {
      const msgs = kpis.bridgeStats.total_messages || kpis.bridgeStats.total_envelopes || 'E2EE';
      kpiBridge.textContent = `${msgs} ENVELOPES`;
      kpiBridge.className = 'chip-badge cyan';
    } else {
      kpiBridge.textContent = 'PORT 8102 BUS';
      kpiBridge.className = 'chip-badge cyan';
    }
  }

  const kpiMem = document.getElementById('kpi-memory-status');
  if (kpiMem) {
    if (kpis.memoryStats) {
      const mems = kpis.memoryStats.total_memories || kpis.memoryStats.memories_count || 'STDP';
      kpiMem.textContent = `${mems} STDP SYNAPSES`;
      kpiMem.className = 'chip-badge purple';
    } else {
      kpiMem.textContent = 'STDP PLASTICITY';
      kpiMem.className = 'chip-badge purple';
    }
  }
}

// ── Reality Profiles UI & Theme Morphing ──
function applyRealityTheme(activeMode) {
  const mode = (activeMode || 'gold').toLowerCase();
  document.body.classList.remove('theme-matrix', 'theme-ghost', 'theme-cyan', 'theme-incognito');
  if (mode === 'matrix') {
    document.body.classList.add('theme-matrix');
  } else if (mode === 'ghost') {
    document.body.classList.add('theme-ghost');
  } else if (mode === 'cyan') {
    document.body.classList.add('theme-cyan');
  } else if (mode === 'incognito' || mode === 'win11') {
    document.body.classList.add('theme-incognito');
  }
}

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
  applyRealityTheme(activeMode);
}

// ── Global Actions ──
window.controlDaemon = async function (daemonId, action) {
  if (action === 'stop') soundWarning();
  else soundChirp();

  showToast(`[${action.toUpperCase()}] Triggering ${daemonId}...`);
  const res = await ipcRenderer.invoke('daemon-action', { daemonId, action });
  if (res.success) {
    soundSuccess();
    showToast(`✓ ${res.message}`, 'emerald');
  } else {
    soundWarning();
    showToast(`✕ Error: ${res.message}`, 'crimson');
  }
};

window.switchMode = async function (mode) {
  soundRealityShift();
  showToast(`Engaging Reality Mode [${mode.toUpperCase()}]...`);
  const res = await ipcRenderer.invoke('switch-reality-mode', { mode });
  if (res.success) {
    soundSuccess();
    showToast(`✓ Reality Mode [${mode.toUpperCase()}] engaged!`, 'gold');
    updateRealityUI(mode);
    applyRealityTheme(mode);
  } else {
    soundWarning();
    showToast(`✕ Mode switch error: ${res.error || 'Failed'}`, 'crimson');
  }
};

window.launchTool = async function (toolId) {
  soundChirp();
  showToast(`Launching ${toolId}...`);
  const res = await ipcRenderer.invoke('launch-tool', { toolId });
  if (res.success) {
    showToast(`✓ ${toolId} launched.`, 'emerald');
  } else {
    soundWarning();
    showToast(`✕ Failed to launch ${toolId}`, 'crimson');
  }
};

// ── Modal Handling ──
const agentModal = document.getElementById('agent-modal');
const modalName = document.getElementById('modal-agent-name');
const modalImg = document.getElementById('modal-agent-img');
const modalRole = document.getElementById('modal-agent-role');
const modalBus = document.getElementById('modal-agent-bus');
const modalModel = document.getElementById('modal-agent-model');
const modalHarness = document.getElementById('modal-agent-harness');
const modalSynapsesBox = document.getElementById('modal-synapses-box');
const modalPrompt = document.getElementById('modal-prompt-input');
const modalResponse = document.getElementById('modal-response-box');

function openAgentModal(agent) {
  soundChirp();
  selectedAgent = agent;
  modalName.textContent = `SOVEREIGN AGENT // ${agent.name.toUpperCase()} (${agent.cadre.toUpperCase()})`;
  modalImg.src = `assets/agents/${agent.img}`;
  modalRole.textContent = agent.role;
  modalBus.textContent = `Execution Ring: ${agent.ring} · Socket: ipc:///run/zoth/${agent.id.toLowerCase()}.sock`;

  if (modalModel) modalModel.textContent = `Model: ${agent.model || 'hermes-3:70b'}`;
  if (modalHarness) modalHarness.textContent = `Harness: ${agent.harness || 'ollama'}`;

  if (modalSynapsesBox) {
    modalSynapsesBox.innerHTML = '';
    const synapses =
      Array.isArray(agent.memories) && agent.memories.length > 0
        ? agent.memories
        : [
            `Cadre: ${agent.cadre} Master`,
            `Ring: ${agent.ring}`,
            `Local Port: :${agent.port}`,
            'STDP Plasticity: 1.0',
            'Zero-Egress Quarantine: Active',
          ];

    synapses.forEach((s) => {
      const chip = document.createElement('span');
      chip.className = 'synapse-chip';
      const label = typeof s === 'string' ? s : (s.text || s.title || s.summary || s.tag || (s.category ? `${s.category}: ${s.id}` : JSON.stringify(s)));
      chip.textContent = label;
      modalSynapsesBox.appendChild(chip);
    });
  }

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

  soundChirp();
  modalResponse.style.display = 'block';
  modalResponse.textContent = `Dispatching task to ${selectedAgent.name}...`;

  const res = await ipcRenderer.invoke('dispatch-agent-prompt', {
    agentId: selectedAgent.id,
    prompt,
  });

  if (res.success) {
    soundSuccess();
    modalResponse.textContent = `[${selectedAgent.name.toUpperCase()} OUTPUT]:\n\n${res.text}`;
  } else {
    soundWarning();
    modalResponse.textContent = `[BUS ERROR]:\n${res.text}`;
  }
});

// ── Toast Notification Engine ──
function showToast(message, type = 'gold') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.borderColor =
    type === 'crimson'
      ? 'var(--crimson)'
      : type === 'emerald'
      ? 'var(--emerald)'
      : type === 'cyan'
      ? 'var(--cyan)'
      : 'var(--gold)';
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}
