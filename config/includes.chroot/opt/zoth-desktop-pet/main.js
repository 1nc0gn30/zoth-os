const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const http = require('http');

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

function startCursorTracking() {
  const pollInterval = () => {
    if (!petWindow || petWindow.isDestroyed()) return;
    try {
      const point = screen.getCursorScreenPoint();
      const cursorX = point.x;
      const cursorY = point.y;

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

      const interval = cursorVelocity > 400 ? 16 : cursorVelocity > 100 ? 33 : 50;
      cursorPoller = setTimeout(pollInterval, interval);
    } catch (e) {
      cursorPoller = setTimeout(pollInterval, 100);
    }
  };
  pollInterval();
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