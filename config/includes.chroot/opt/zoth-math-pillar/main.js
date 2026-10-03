const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const dgram = require('dgram');
const { exec } = require('child_process');

app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('enable-transparent-visuals');

let mainWindow = null;
const HTTP_PORT = 9995;
const UDP_PORT = 9996;
const CONFIG_FILE = path.join(os.homedir(), '.config', 'zothos', 'math_pillar_config.json');

// Telemetry State
const agentRegistry = {
  'ALL': {
    name: '✦ ALL ACTIVE AGENTS (SWARM)',
    online: true,
    model: 'Multi-Agent Mesh',
    phase: 'SYNTHESIS',
    tokensSec: 42,
    contextUsed: 64200,
    contextMax: 1048576,
    entropy: 0.18,
    confidence: 0.94,
    latencyMs: 95,
    toolCalls: 18,
    toolSuccess: 18,
    toolFail: 0,
    vramMb: 2450,
    step: 12,
    maxSteps: 30,
    lastActive: Date.now(),
    logs: [
      { time: getTimestamp(), phase: 'ORCHESTRATION', note: 'Multi-agent telemetry bus initialized', entropy: 0.12 }
    ]
  },
  'Antigravity': {
    name: 'Antigravity (Gemini 3.8 / AGY)',
    online: true,
    model: 'gemini-3.8-flash',
    phase: 'IDLE',
    tokensSec: 65,
    contextUsed: 48900,
    contextMax: 1048576,
    entropy: 0.14,
    confidence: 0.96,
    latencyMs: 110,
    toolCalls: 12,
    toolSuccess: 12,
    toolFail: 0,
    vramMb: 820,
    step: 8,
    maxSteps: 25,
    lastActive: Date.now(),
    logs: []
  },
  'Ollama': {
    name: 'Ollama (Local Inference)',
    online: false,
    model: 'qwen2.5-coder:1.5b',
    phase: 'STANDBY',
    tokensSec: 0,
    contextUsed: 0,
    contextMax: 32768,
    entropy: 0.20,
    confidence: 0.90,
    latencyMs: 35,
    toolCalls: 0,
    toolSuccess: 0,
    toolFail: 0,
    vramMb: 0,
    step: 0,
    maxSteps: 1,
    lastActive: 0,
    logs: []
  },
  'Aider': {
    name: 'Aider AI Coding Agent',
    online: false,
    model: 'Claude 3.7 / GPT-4o',
    phase: 'STANDBY',
    tokensSec: 0,
    contextUsed: 12400,
    contextMax: 200000,
    entropy: 0.22,
    confidence: 0.92,
    latencyMs: 140,
    toolCalls: 4,
    toolSuccess: 4,
    toolFail: 0,
    vramMb: 350,
    step: 2,
    maxSteps: 10,
    lastActive: 0,
    logs: []
  },
  'Grok': {
    name: 'Grok Bot',
    online: false,
    model: 'grok-2',
    phase: 'STANDBY',
    tokensSec: 0,
    contextUsed: 8400,
    contextMax: 131072,
    entropy: 0.25,
    confidence: 0.88,
    latencyMs: 160,
    toolCalls: 2,
    toolSuccess: 2,
    toolFail: 0,
    vramMb: 420,
    step: 1,
    maxSteps: 5,
    lastActive: 0,
    logs: []
  },
  'Cursor': {
    name: 'Cursor AI / Composer',
    online: false,
    model: 'Claude 3.7 Sonnet',
    phase: 'STANDBY',
    tokensSec: 0,
    contextUsed: 22000,
    contextMax: 200000,
    entropy: 0.17,
    confidence: 0.95,
    latencyMs: 90,
    toolCalls: 6,
    toolSuccess: 6,
    toolFail: 0,
    vramMb: 680,
    step: 4,
    maxSteps: 15,
    lastActive: 0,
    logs: []
  },
  'Hermes': {
    name: 'Hermes Swarm / HexStrike',
    online: false,
    model: 'Hermes-3-Llama-3.1',
    phase: 'STANDBY',
    tokensSec: 0,
    contextUsed: 16000,
    contextMax: 128000,
    entropy: 0.28,
    confidence: 0.86,
    latencyMs: 180,
    toolCalls: 3,
    toolSuccess: 3,
    toolFail: 0,
    vramMb: 510,
    step: 1,
    maxSteps: 10,
    lastActive: 0,
    logs: []
  }
};

function getTimestamp() {
  const d = new Date();
  return d.toTimeString().split(' ')[0];
}

function loadConfig() {
  try {
    const dir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (e) {}
  return {
    x: null,
    y: null,
    compact: false,
    alwaysOnTop: true,
    selectedAgent: 'ALL',
    opacity: 0.95
  };
}

function saveConfig(cfg) {
  try {
    const dir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
  } catch (e) {}
}

// Ingest telemetry packet
function ingestTelemetry(data) {
  if (!data || typeof data !== 'object') return;
  const agentKey = data.agent || 'CustomAgent';

  if (!agentRegistry[agentKey]) {
    agentRegistry[agentKey] = {
      name: agentKey,
      online: true,
      model: data.model || 'Unknown',
      phase: data.phase || 'EXEC',
      tokensSec: 0,
      contextUsed: 0,
      contextMax: data.contextMax || 131072,
      entropy: 0.2,
      confidence: 0.9,
      latencyMs: 100,
      toolCalls: 0,
      toolSuccess: 0,
      toolFail: 0,
      vramMb: 0,
      step: 1,
      maxSteps: 20,
      lastActive: Date.now(),
      logs: []
    };
  }

  const ag = agentRegistry[agentKey];
  ag.online = true;
  ag.lastActive = Date.now();
  if (data.model) ag.model = data.model;
  if (data.phase) ag.phase = data.phase;
  if (typeof data.tokensSec === 'number') ag.tokensSec = data.tokensSec;
  if (typeof data.contextUsed === 'number') ag.contextUsed = data.contextUsed;
  if (typeof data.contextMax === 'number') ag.contextMax = data.contextMax;
  if (typeof data.entropy === 'number') ag.entropy = data.entropy;
  if (typeof data.confidence === 'number') ag.confidence = data.confidence;
  if (typeof data.latencyMs === 'number') ag.latencyMs = data.latencyMs;
  if (typeof data.toolCalls === 'number') ag.toolCalls = data.toolCalls;
  if (typeof data.toolSuccess === 'number') ag.toolSuccess = data.toolSuccess;
  if (typeof data.vramMb === 'number') ag.vramMb = data.vramMb;
  if (typeof data.step === 'number') ag.step = data.step;
  if (typeof data.maxSteps === 'number') ag.maxSteps = data.maxSteps;

  if (data.reasoning || data.tool) {
    const entry = {
      time: getTimestamp(),
      phase: data.phase || 'EVENT',
      note: data.reasoning || `Invoked: ${data.tool} (${ag.latencyMs}ms)`,
      entropy: ag.entropy
    };
    ag.logs.unshift(entry);
    if (ag.logs.length > 40) ag.logs.pop();

    // Also push to swarm aggregate
    agentRegistry['ALL'].logs.unshift({
      time: entry.time,
      phase: `[${agentKey}] ${entry.phase}`,
      note: entry.note,
      entropy: entry.entropy
    });
    if (agentRegistry['ALL'].logs.length > 50) agentRegistry['ALL'].logs.pop();
  }

  // Update ALL aggregate
  recomputeSwarmAggregate();

  // Send update to renderer
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('telemetry-update', agentRegistry);
  }
}

function recomputeSwarmAggregate() {
  const swarm = agentRegistry['ALL'];
  let totalCtx = 0;
  let maxCtx = 0;
  let totalTokSec = 0;
  let weightedEntropy = 0;
  let weightedConfidence = 0;
  let totalLatency = 0;
  let totalCalls = 0;
  let totalVram = 0;
  let activeCount = 0;

  for (const [k, a] of Object.entries(agentRegistry)) {
    if (k === 'ALL') continue;
    if (Date.now() - a.lastActive < 120000 || a.online) {
      activeCount++;
      totalCtx += a.contextUsed;
      maxCtx = Math.max(maxCtx, a.contextMax);
      totalTokSec += a.tokensSec;
      weightedEntropy += a.entropy;
      weightedConfidence += a.confidence;
      totalLatency += a.latencyMs;
      totalCalls += a.toolCalls;
      totalVram += a.vramMb;
    }
  }

  if (activeCount > 0) {
    swarm.tokensSec = totalTokSec;
    swarm.contextUsed = totalCtx;
    swarm.contextMax = Math.max(maxCtx, 1048576);
    swarm.entropy = +(weightedEntropy / activeCount).toFixed(3);
    swarm.confidence = +(weightedConfidence / activeCount).toFixed(3);
    swarm.latencyMs = Math.round(totalLatency / activeCount);
    swarm.toolCalls = totalCalls;
    swarm.vramMb = totalVram;
    swarm.online = true;
  }
}

// ── HTTP Telemetry Ingestion Server ──────────────────────────────────────────
function startHttpServer() {
  const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.url === '/telemetry' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          ingestTelemetry(parsed);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', received: true }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'invalid json' }));
        }
      });
      return;
    }

    if (req.url === '/active' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(agentRegistry));
      return;
    }

    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'healthy', uptime: process.uptime() }));
      return;
    }

    res.writeHead(404);
    res.end();
  });

  server.listen(HTTP_PORT, '127.0.0.1', () => {
    console.log(`[Math Pillar] Telemetry HTTP ingest listening on 127.0.0.1:${HTTP_PORT}`);
  });
}

// ── UDP Telemetry Ingestion Listener ─────────────────────────────────────────
function startUdpServer() {
  const socket = dgram.createSocket('udp4');
  socket.on('message', (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      ingestTelemetry(data);
    } catch (e) {}
  });
  socket.bind(UDP_PORT, '127.0.0.1', () => {
    console.log(`[Math Pillar] UDP streaming listener bound on 127.0.0.1:${UDP_PORT}`);
  });
}

// ── Autonomous Process & System Model Scraper ────────────────────────────────
function probeSystemAgents() {
  // 1. Ollama live probe
  const req = http.request({
    hostname: '127.0.0.1',
    port: 11434,
    path: '/api/ps',
    method: 'GET',
    timeout: 1000
  }, (res) => {
    let body = '';
    res.on('data', c => { body += c; });
    res.on('end', () => {
      try {
        const d = JSON.parse(body);
        if (d && Array.isArray(d.models) && d.models.length > 0) {
          const m = d.models[0];
          ingestTelemetry({
            agent: 'Ollama',
            model: m.name,
            phase: 'INFERENCE',
            tokensSec: 32 + Math.floor(Math.random() * 8),
            vramMb: Math.round((m.size_vram || m.size || 0) / (1024 * 1024)),
            entropy: 0.16 + (Math.random() * 0.05),
            confidence: 0.92,
            reasoning: `Model loaded in VRAM: ${m.name}`
          });
        } else {
          agentRegistry['Ollama'].online = false;
        }
      } catch (e) {}
    });
  });
  req.on('error', () => {
    agentRegistry['Ollama'].online = false;
  });
  req.end();

  // 2. Process inspection for other agents
  exec('ps aux | grep -E "aider|cursor|grok|hermes|antigravity" | grep -v grep', (err, stdout) => {
    if (!err && stdout) {
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.includes('aider')) {
          agentRegistry['Aider'].online = true;
          agentRegistry['Aider'].lastActive = Date.now();
        }
        if (line.includes('cursor')) {
          agentRegistry['Cursor'].online = true;
          agentRegistry['Cursor'].lastActive = Date.now();
        }
        if (line.includes('grok')) {
          agentRegistry['Grok'].online = true;
          agentRegistry['Grok'].lastActive = Date.now();
        }
        if (line.includes('hermes')) {
          agentRegistry['Hermes'].online = true;
          agentRegistry['Hermes'].lastActive = Date.now();
        }
      }
    }
  });

  // 3. Antigravity transcript step inspection
  try {
    const geminiDir = path.join(os.homedir(), '.gemini', 'antigravity-cli', 'brain');
    if (fs.existsSync(geminiDir)) {
      const convs = fs.readdirSync(geminiDir);
      for (const c of convs) {
        const transFile = path.join(geminiDir, c, '.system_generated', 'logs', 'transcript.jsonl');
        if (fs.existsSync(transFile)) {
          const stat = fs.statSync(transFile);
          if (Date.now() - stat.mtimeMs < 15000) {
            // Actively being modified!
            const ag = agentRegistry['Antigravity'];
            ag.online = true;
            ag.lastActive = Date.now();
            ag.phase = 'REASONING';
            ag.tokensSec = 75 + Math.floor(Math.random() * 25);
            ag.entropy = +(0.11 + Math.random() * 0.08).toFixed(3);
            ag.confidence = +(0.93 + Math.random() * 0.05).toFixed(3);
          }
        }
      }
    }
  } catch (e) {}

  recomputeSwarmAggregate();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('telemetry-update', agentRegistry);
  }
}

// ── Window Management ────────────────────────────────────────────────────────
function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const cfg = loadConfig();

  const winW = cfg.compact ? 320 : 420;
  const winH = cfg.compact ? 70 : 680;
  let posX = typeof cfg.x === 'number' ? cfg.x : width - winW - 30;
  let posY = typeof cfg.y === 'number' ? cfg.y : 60;
  posX = Math.max(10, Math.min(width - winW - 10, posX));
  posY = Math.max(10, Math.min(height - winH - 10, posY));

  mainWindow = new BrowserWindow({
    width: winW,
    height: winH,
    x: posX,
    y: posY,
    transparent: true,
    frame: false,
    alwaysOnTop: cfg.alwaysOnTop !== false,
    skipTaskbar: false,
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

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  if (cfg.alwaysOnTop !== false) {
    mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  }

  mainWindow.on('moved', () => {
    if (!mainWindow) return;
    const [x, y] = mainWindow.getPosition();
    const c = loadConfig();
    c.x = x;
    c.y = y;
    saveConfig(c);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── IPC Handlers ─────────────────────────────────────────────────────────────
ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('toggle-pin', (event, isPinned) => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(isPinned, 'screen-saver', 1);
    const c = loadConfig();
    c.alwaysOnTop = isPinned;
    saveConfig(c);
  }
});

ipcMain.on('toggle-compact', (event, compactState) => {
  if (!mainWindow) return;
  const c = loadConfig();
  c.compact = compactState;
  saveConfig(c);

  const [x, y] = mainWindow.getPosition();
  if (compactState) {
    mainWindow.setSize(320, 72, true);
  } else {
    mainWindow.setSize(420, 680, true);
  }
});

ipcMain.on('request-telemetry', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('telemetry-update', agentRegistry);
  }
});

app.whenReady().then(() => {
  startHttpServer();
  startUdpServer();
  createWindow();

  setInterval(probeSystemAgents, 2000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
