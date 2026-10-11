const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const http = require('http');
const dgram = require('dgram');

app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('enable-transparent-visuals');

app.on('child-process-gone', (event, details) => {
  if (details.type === 'GPU') {
    console.log('[Zoth Pet] GPU recovered in software compatibility mode');
  }
});

let petWindow = null;
let cursorPoller = null;
let telemetryPoller = null;
let lastCursorPos = { x: 0, y: 0 };
let lastCursorTime = Date.now();
let cursorVelocity = 0;

const CONFIG_FILE = path.join(os.homedir(), '.config', 'zothos', 'pet_config.json');

function ensureConfigDir() {
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadConfig() {
  try {
    ensureConfigDir();
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (e) {}
  return {
    petId: 'eye',
    alwaysOnTop: true,
    compact: false,
    voice: false,
    sound: true,
    petsData: {}
  };
}

function saveConfig(cfg) {
  try {
    ensureConfigDir();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
  } catch (e) {}
}

let udpSocket = null;
let lastUdpTime = 0;

function ensureCursorDaemon() {
  exec('pgrep -f zoth-cursor-daemon', (err, stdout) => {
    if (err || !stdout.trim()) {
      console.log('[Zoth Pet] Spawning zoth-cursor-daemon...');
      exec('systemctl --user start zoth-cursor-daemon.service || nohup /usr/bin/python3 /usr/local/bin/zoth-cursor-daemon >/dev/null 2>&1 &');
    }
  });
}

function dispatchCursorPos(cursorX, cursorY) {
  if (!petWindow || petWindow.isDestroyed()) return;

  const now = Date.now();
  const dt = now - lastCursorTime;
  const dx = cursorX - lastCursorPos.x;
  const dy = cursorY - lastCursorPos.y;
  const dist = Math.hypot(dx, dy);

  if (dt > 0) {
    cursorVelocity = (dist / dt) * 1000;
  }

  const bounds = petWindow.getBounds();
  petWindow.webContents.send('global-cursor-pos', {
    cursorX,
    cursorY,
    windowX: bounds.x,
    windowY: bounds.y,
    width: bounds.width,
    height: bounds.height,
    velocity: Math.round(cursorVelocity),
    deltaX: dx,
    deltaY: dy
  });

  lastCursorPos = { x: cursorX, y: cursorY };
  lastCursorTime = now;
}

function startCursorTracking() {
  ensureCursorDaemon();

  // Setup UDP real-time broadcast receiver from zoth-cursor-daemon
  try {
    if (udpSocket) {
      try { udpSocket.close(); } catch (e) {}
    }
    udpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    udpSocket.on('message', (msg) => {
      const parts = msg.toString().trim().split(',');
      if (parts.length === 2) {
        const cx = parseFloat(parts[0]);
        const cy = parseFloat(parts[1]);
        if (!isNaN(cx) && !isNaN(cy)) {
          lastUdpTime = Date.now();
          dispatchCursorPos(cx, cy);
        }
      }
    });
    udpSocket.on('error', (err) => {
      console.log('[Zoth Pet] UDP socket notice:', err.message);
    });
    udpSocket.bind(9988, '127.0.0.1');
  } catch (e) {
    console.log('[Zoth Pet] UDP bind exception:', e.message);
  }

  // Fallback Poller for RAM file /dev/shm/zoth_cursor.json or screen.getCursorScreenPoint
  const pollFallback = () => {
    if (!petWindow || petWindow.isDestroyed()) return;
    const now = Date.now();
    // If no UDP update in last 100ms, read shared memory file or screen
    if (now - lastUdpTime > 100) {
      let handled = false;
      for (const p of ['/dev/shm/zoth_cursor.json', '/tmp/zoth_cursor.json']) {
        try {
          if (fs.existsSync(p)) {
            const raw = fs.readFileSync(p, 'utf8');
            const data = JSON.parse(raw);
            if (typeof data.x === 'number' && typeof data.y === 'number') {
              dispatchCursorPos(data.x, data.y);
              handled = true;
              break;
            }
          }
        } catch (e) {}
      }
      if (!handled) {
        try {
          const pt = screen.getCursorScreenPoint();
          dispatchCursorPos(pt.x, pt.y);
        } catch (e) {}
      }
    }
    cursorPoller = setTimeout(pollFallback, 33);
  };
  pollFallback();
}

function getSystemTelemetry(callback) {
  try {
    const meminfo = fs.readFileSync('/proc/meminfo', 'utf8');
    let totalKb = 1024, availKb = 1024;
    for (const line of meminfo.split('\n')) {
      if (line.startsWith('MemTotal:')) totalKb = parseInt(line.split(/\s+/)[1]) || 1024;
      if (line.startsWith('MemAvailable:')) availKb = parseInt(line.split(/\s+/)[1]) || 1024;
    }
    const usedKb = Math.max(0, totalKb - availKb);
    const ramPct = Math.round((usedKb / totalKb) * 100);
    const usedGB = (usedKb / (1024 * 1024)).toFixed(1);
    const totalGB = (totalKb / (1024 * 1024)).toFixed(1);

    // Tor cloaking status
    const torCloaked = fs.existsSync('/run/zoth_ghostmode.state');

    // Active profile
    let activeProfile = 'gold';
    const profFile = path.join(os.homedir(), '.config', 'zothos', 'profile.state');
    if (fs.existsSync(profFile)) {
      try { activeProfile = fs.readFileSync(profFile, 'utf8').trim().toLowerCase(); } catch (e) {}
    }

    callback(null, {
      ramPct,
      usedGB,
      totalGB,
      torCloaked,
      activeProfile
    });
  } catch (err) {
    callback(err);
  }
}

function startTelemetryPolling() {
  telemetryPoller = setInterval(() => {
    if (!petWindow || petWindow.isDestroyed()) return;
    getSystemTelemetry((err, data) => {
      if (!err && data && petWindow && !petWindow.isDestroyed()) {
        petWindow.webContents.send('telemetry-update', data);
      }
    });
  }, 10000);
}

// Dynamically probe available Ollama models
function getOllamaModel(callback) {
  const req = http.request({
    hostname: '127.0.0.1',
    port: 11434,
    path: '/api/tags',
    method: 'GET',
    timeout: 1500
  }, (res) => {
    let raw = '';
    res.on('data', chunk => { raw += chunk; });
    res.on('end', () => {
      try {
        const data = JSON.parse(raw);
        if (data && data.models && data.models.length > 0) {
          const names = data.models.map(m => m.name);
          const priority = ['zoth-model:latest', 'qwen2.5-coder:1.5b', 'qwen2.5:1.5b', 'qwen2.5:0.5b', 'llama3.2:1b'];
          for (const p of priority) {
            if (names.includes(p)) {
              callback(null, p);
              return;
            }
          }
          callback(null, names[0]);
          return;
        }
      } catch (e) {}
      callback(null, 'qwen2.5-coder:1.5b');
    });
  });

  req.on('error', () => { callback(new Error('Ollama offline')); });
  req.on('timeout', () => { req.destroy(); callback(new Error('Ollama timeout')); });
  req.end();
}

function queryPetAI(userPrompt, petInfo, contextText, callback) {
  getOllamaModel((err, modelName) => {
    if (err || !modelName) {
      callback(new Error('Ollama inference service is offline'));
      return;
    }

    const systemPrompt = `You are ${petInfo.name}, the ${petInfo.role} alchemical desktop companion on ZothOS Linux.
Personality: ${petInfo.desc}. Speak concisely in character in 1-2 impactful sentences.
System Context: ${contextText}
User: ${userPrompt}`;

    const postData = JSON.stringify({
      model: modelName,
      prompt: systemPrompt,
      stream: false
    });

    const req = http.request({
      hostname: '127.0.0.1',
      port: 11434,
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 7000
    }, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.response) {
            callback(null, parsed.response.trim());
            return;
          }
        } catch (e) {}
        callback(new Error('Invalid JSON from Ollama'));
      });
    });

    req.on('error', (e) => { callback(e); });
    req.on('timeout', () => { req.destroy(); callback(new Error('Ollama timeout')); });
    req.write(postData);
    req.end();
  });
}

function createPetWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const cfg = loadConfig();

  // Position restoration with boundary clamping
  let posX = typeof cfg.x === 'number' ? cfg.x : Math.max(20, width - 380);
  let posY = typeof cfg.y === 'number' ? cfg.y : Math.max(40, height - 510);
  posX = Math.max(0, Math.min(width - 340, posX));
  posY = Math.max(0, Math.min(height - 480, posY));

  petWindow = new BrowserWindow({
    width: 340,
    height: 480,
    x: posX,
    y: posY,
    transparent: true,
    frame: false,
    alwaysOnTop: cfg.alwaysOnTop !== false,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    thickFrame: false,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  petWindow.loadFile(path.join(__dirname, 'index.html'));
  if (cfg.alwaysOnTop !== false) {
    petWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  }

  startCursorTracking();
  startTelemetryPolling();

  petWindow.on('closed', () => {
    if (cursorPoller) clearTimeout(cursorPoller); cursorPoller = null;
    if (telemetryPoller) clearInterval(telemetryPoller); telemetryPoller = null;
    petWindow = null;
  });
}

app.whenReady().then(() => {
  createPetWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createPetWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── IPC Handlers ─────────────────────────────────────────────────────────────

ipcMain.on('move-pet-window', (event, { deltaX, deltaY }) => {
  if (!petWindow || petWindow.isDestroyed()) return;
  const bounds = petWindow.getBounds();
  const newX = bounds.x + deltaX;
  const newY = bounds.y + deltaY;
  petWindow.setPosition(newX, newY);

  const cfg = loadConfig();
  cfg.x = newX;
  cfg.y = newY;
  saveConfig(cfg);
});

ipcMain.on('set-always-on-top', (event, state) => {
  if (!petWindow || petWindow.isDestroyed()) return;
  petWindow.setAlwaysOnTop(state, 'screen-saver', 1);
  const cfg = loadConfig();
  cfg.alwaysOnTop = state;
  saveConfig(cfg);
  event.reply('always-on-top-changed', state);
});

ipcMain.on('load-pet-config', (event) => {
  event.reply('pet-config-loaded', loadConfig());
});

ipcMain.on('save-pet-config', (event, newCfg) => {
  const cfg = { ...loadConfig(), ...newCfg };
  saveConfig(cfg);
});

ipcMain.on('get-telemetry', (event) => {
  getSystemTelemetry((err, data) => {
    if (!err && data) event.reply('telemetry-update', data);
  });
});

ipcMain.on('launch-app', (event, appName) => {
  const apps = {
    'studio': 'zoth-studio',
    'cockpit': 'konsole --title "ZothOS Cockpit" -e zoth-cockpit',
    'hexstrike': 'hexstrike',
    'nexus': 'zoth-tool-nexus',
    'reality': 'zoth-mode',
    'ghost': 'zoth-ghost-gui',
    'vault': 'zoth-vault',
    'sentinel': 'konsole --title "Zoth Sentinel HUD" -e zoth-sentinel-hud',
    'doctor': 'konsole --title "Zoth System Doctor" -e zoth-doctor',
    'soundtrack': 'zoth-soundtrack',
    'fastfetch': 'konsole --hold -e zoth-fastfetch'
  };
  const cmd = apps[appName] || appName;
  exec(`nohup ${cmd} >/dev/null 2>&1 &`);
});

ipcMain.on('run-spell', (event, spellCommand) => {
  exec(spellCommand, (err, stdout, stderr) => {
    event.reply('spell-result', {
      success: !err,
      output: (stdout || stderr || '').trim().substring(0, 140)
    });
  });
});

ipcMain.on('alchemical-distill', (event) => {
  exec('rm -rf ~/.cache/thumbnails/* 2>/dev/null; sync', (err) => {
    event.reply('distill-complete', { success: !err });
  });
});

ipcMain.on('speak-text', (event, { text, pitch = 50, speed = 155, voice = 'en' }) => {
  const sanitized = text.replace(/["`$\\]/g, ' ').substring(0, 200);
  exec(`espeak-ng -v "${voice}" -p ${pitch} -s ${speed} "${sanitized}" >/dev/null 2>&1 &`);
});

ipcMain.on('query-pet-ai', (event, { prompt, petInfo, context }) => {
  queryPetAI(prompt, petInfo, context, (err, response) => {
    if (!err && response) {
      event.reply('pet-ai-response', { success: true, text: response });
    } else {
      event.reply('pet-ai-response', {
        success: false,
        error: err ? err.message : 'Inference unavailable'
      });
    }
  });
});
// --- ZOTHOS navigation guard -------------------------------------------------
// Windows run with nodeIntegration, so a remote page loaded into one would get
// full Node (RCE). Keep every window on local files; open web links externally.
{
  const { app: __gApp, shell: __gShell } = require('electron');
  const __isLocal = (u) => typeof u === 'string' && (u.startsWith('file://') || u.startsWith('devtools://') || u === 'about:blank');
  __gApp.on('web-contents-created', (_e, contents) => {
    contents.on('will-navigate', (ev, url) => {
      if (__isLocal(url)) return;
      ev.preventDefault();
      if (/^https?:\/\//i.test(url)) __gShell.openExternal(url);
    });
    contents.on('will-redirect', (ev, url) => { if (!__isLocal(url)) ev.preventDefault(); });
    contents.on('will-attach-webview', (ev) => ev.preventDefault());
    contents.setWindowOpenHandler(({ url }) => {
      if (__isLocal(url)) return { action: 'allow' };
      if (/^https?:\/\//i.test(url)) __gShell.openExternal(url);
      return { action: 'deny' };
    });
  });
}
