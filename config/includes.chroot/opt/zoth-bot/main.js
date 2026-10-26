'use strict';

const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, globalShortcut, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const store = require('./lib/store');
const tools = require('./lib/tools');
const jobs = require('./lib/jobs');
const agent = require('./lib/agent');
const hermes = require('./lib/hermes');
const computer = require('./lib/computer');
const skills = require('./lib/skills');
const catalog = require('./lib/catalog');
const portal = require('./lib/portal');
const http = require('http');
const providers = require('./lib/providers');
const secrets = require('./lib/secrets');
const dbmod = require('./lib/db');

// Separate profile for test instances (also gives them their own single-instance lock).
if (process.env.ZOTH_BOT_USERDATA) app.setPath('userData', process.env.ZOTH_BOT_USERDATA);

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  console.log('zoth-bot already running; focusing existing window');
  app.quit();
  process.exit(0);
}
app.on('second-instance', () => {
  try {
    compact = false;
    showWindow();
    applyMode();
  } catch {
    /* window not ready yet */
  }
});

let db = null;
function getDb() {
  if (!db) {
    try {
      db = dbmod.get(store.ROOT);
    } catch (err) {
      console.error('sqlite unavailable', err.message);
      db = null;
    }
  }
  return db;
}
function audit(actor, action, detail) {
  const d = getDb();
  if (d) d.audit(actor, action, detail);
}
function keyLookup(id, envNames) {
  return secrets.getKey(store.ROOT, envNames, id).value;
}

// Chromium sandbox: on by default when chrome-sandbox is SUID (tested OK on zoth-pill).
// ZOTH_BOT_NO_SANDBOX=1 restores the old behaviour.
if (process.env.ZOTH_BOT_NO_SANDBOX === '1') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu-sandbox');
}
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('enable-transparent-visuals');

const ICON = path.join(__dirname, 'assets', 'icon-256.png');

let win = null;
let tray = null;
let compact = true;

const COMPACT = { w: 220, h: 220 };
const EXPANDED = { w: 488, h: 800 };

const approvals = new Map();
let approvalSeq = 0;

function iconImage() {
  try {
    return nativeImage.createFromPath(ICON);
  } catch {
    return nativeImage.createEmpty();
  }
}

function loadCfg() {
  const st = store.loadState();
  compact = st.compact !== false;
  return st;
}

function savePos() {
  if (!win || win.isDestroyed()) return;
  const st = store.loadState();
  const b = win.getBounds();
  st.x = b.x;
  st.y = b.y;
  st.compact = compact;
  store.saveState(st);
}

function place(st) {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const size = compact ? COMPACT : EXPANDED;
  let x = typeof st.x === 'number' ? st.x : width - size.w - 24;
  let y = typeof st.y === 'number' ? st.y : height - size.h - 48;
  x = Math.max(0, Math.min(width - size.w, x));
  y = Math.max(0, Math.min(height - size.h, y));
  return { x, y, ...size };
}

function applyMode() {
  if (!win || win.isDestroyed()) return;
  const st = store.loadState();
  const p = place(st);
  win.setBounds({ x: p.x, y: p.y, width: p.w, height: p.h });
  win.setAlwaysOnTop(st.alwaysOnTop !== false, 'screen-saver', 1);
  win.setSkipTaskbar(compact);
  win.webContents.send('ui:mode', { compact });
}

function createWindow() {
  const st = loadCfg();
  if (process.env.ZOTH_BOT_SHOT) compact = true;
  const p = place(st);
  win = new BrowserWindow({
    width: p.w,
    height: p.h,
    x: p.x,
    y: p.y,
    transparent: true,
    frame: false,
    alwaysOnTop: st.alwaysOnTop !== false,
    skipTaskbar: compact,
    resizable: false,
    hasShadow: false,
    thickFrame: false,
    backgroundColor: '#00000000',
    icon: iconImage(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: process.env.ZOTH_BOT_NO_SANDBOX !== '1',
    },
  });
  win.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    if (level >= 2 || process.env.ZOTH_BOT_SHOT) {
      console.error('renderer', level, message, String(sourceId) + ':' + line);
    }
  });
  win.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error('fail-load', code, desc, url);
  });
  const shotDir = process.env.ZOTH_BOT_SHOT;
  if (shotDir) {
    console.log('shot dir', shotDir);
    try {
      win.webContents.session.clearCache();
    } catch {
      /* ignore */
    }
    win.webContents.on('did-finish-load', () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      (async () => {
        try {
          fs.mkdirSync(shotDir, { recursive: true });
          await sleep(2800);
          try {
            const probe = await win.webContents.executeJavaScript(
              `({ stage: !!window.ZothStage, fallback: !!(document.getElementById('stageFallback') && !document.getElementById('stageFallback').hidden), host: document.getElementById('stageHost') && document.getElementById('stageHost').className })`
            );
            console.log('probe', JSON.stringify(probe));
          } catch (err) {
            console.error('probe fail', err);
          }
          fs.writeFileSync(path.join(shotDir, 'compact.png'), (await win.webContents.capturePage()).toPNG());
          compact = false;
          applyMode();
          await sleep(1600);
          fs.writeFileSync(path.join(shotDir, 'expanded.png'), (await win.webContents.capturePage()).toPNG());
          console.log('shots written');
        } catch (err) {
          console.error('shot', err);
        }
      })();
    });
  }
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  if (st.alwaysOnTop !== false) win.setAlwaysOnTop(true, 'screen-saver', 1);
  win.on('moved', savePos);
  win.on('closed', () => {
    savePos();
    win = null;
  });
  startDebugServer();
}

let debugServer = null;
function startDebugServer() {
  // Off by default. ZOTH_BOT_DEBUG=1 (or a port number) enables /shot and /click;
  // /eval additionally needs ZOTH_BOT_DEBUG_EVAL=1.
  const flag = process.env.ZOTH_BOT_DEBUG;
  if (debugServer || !flag || flag === '0') return;
  const port = Number(flag) > 1 ? Number(flag) : 9334;
  const allowEval = process.env.ZOTH_BOT_DEBUG_EVAL === '1';
  debugServer = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (!win || win.isDestroyed()) {
        res.statusCode = 503;
        res.end('no window');
        return;
      }
      if (url.pathname === '/eval') {
        if (!allowEval) {
          res.statusCode = 403;
          res.end('eval disabled');
          return;
        }
        const js = url.searchParams.get('js') || 'null';
        const result = await win.webContents.executeJavaScript(js, true);
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(result === undefined ? null : result));
        return;
      }
      if (url.pathname === '/shot') {
        const name = url.searchParams.get('name') || 'live.png';
        const dir = '/tmp/zoth-bot-shots';
        fs.mkdirSync(dir, { recursive: true });
        const buf = await win.webContents.capturePage();
        const dest = path.join(dir, path.basename(name));
        fs.writeFileSync(dest, buf.toPNG());
        res.end(dest);
        return;
      }
      if (url.pathname === '/click') {
        const sel = url.searchParams.get('sel');
        await win.webContents.executeJavaScript(
          `document.querySelector(${JSON.stringify(sel)})?.click()`,
          true
        );
        res.end('ok');
        return;
      }
      res.end('ok');
    } catch (err) {
      res.statusCode = 500;
      res.end(String(err.message || err));
    }
  });
  debugServer.listen(port, '127.0.0.1', () => {
    console.log('debug http 127.0.0.1:' + port);
  });
}

function showWindow() {
  if (!win || win.isDestroyed()) createWindow();
  else {
    win.show();
    win.focus();
  }
}

function createTray() {
  tray = new Tray(iconImage().resize({ width: 32, height: 32 }));
  tray.setToolTip('Zoth Bot');
  const menu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        compact = false;
        showWindow();
        applyMode();
      },
    },
    {
      label: 'Compact orb',
      click: () => {
        compact = true;
        showWindow();
        applyMode();
      },
    },
    { type: 'separator' },
    {
      label: 'Power: Nous',
      click: () => setPower({ provider: 'nous', engine: 'hermes' }),
    },
    {
      label: 'Power: Copilot',
      click: () => setPower({ provider: 'copilot', engine: 'hermes' }),
    },
    {
      label: 'Power: Ollama',
      click: () => setPower({ provider: 'ollama', engine: 'hermes' }),
    },
    {
      label: 'Power: Native Ollama',
      click: () => setPower({ provider: 'native', engine: 'ollama' }),
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        savePos();
        jobs.stop();
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(menu);
  tray.on('click', () => {
    compact = !compact;
    showWindow();
    applyMode();
  });
}

function snapshot() {
  const st = store.loadState();
  const bot = st.bots.find((b) => b.id === st.activeBotId) || st.bots[0];
  store.ensureBotFiles(bot);
  const ring = tools.getRingState();
  const vitals = tools.getSystemVitals();
  const mcp = tools.getMcpSummary();
  return {
    compact,
    alwaysOnTop: st.alwaysOnTop !== false,
    bot,
    bots: st.bots,
    jobs: st.jobs || [],
    goals: (st.goals || []).filter((g) => g.status === 'active').slice(-8),
    memory: store.readMemory(bot.id),
    chat: store.recentChat(bot.id, 24),
    model: st.model || bot.model,
    engine: st.engine || 'hermes',
    provider: st.provider || (st.engine === 'ollama' ? 'native' : 'nous'),
    maskOn: st.maskOn !== false,
    voiceOn: Boolean(st.voiceOn),
    hermes: hermes.available(),
    workspace: computer.WORKSPACE,
    ring,
    vitals,
    mcp,
    portal: portal.getPortalSummary(),
    providers: providers.list().map((p) => ({ id: p.id, kind: p.kind, label: p.label, ready: providers.select({ provider: p.id }, keyLookup).ready })),
    selection: providers.select(st, keyLookup),
  };
}

function setPower({ provider, engine, model } = {}) {
  const st = store.loadState();
  if (provider) st.provider = String(provider);
  const pinfo = providers.get(st.provider);
  if (pinfo && pinfo.kind === 'sdk') st.engine = 'sdk';
  else if (st.provider === 'native') st.engine = 'ollama';
  else if (st.provider === 'grok') st.engine = 'grok';
  else if (st.provider === 'nous' || st.provider === 'copilot' || st.provider === 'ollama') st.engine = 'hermes';
  else if (engine) st.engine = String(engine);
  if (model) {
    st.model = String(model);
    const bot = st.bots.find((b) => b.id === st.activeBotId);
    if (bot) bot.model = st.model;
  }
  store.saveState(st);
  const snap = snapshot();
  if (win && !win.isDestroyed()) win.webContents.send('ui:engine', snap);
  portal.notifyStateSync();
  return snap;
}

function hermesProviderName(provider) {
  if (provider === 'ollama') return 'custom';
  if (provider === 'grok') return 'grok';
  if (provider === 'nous' || provider === 'copilot') return provider;
  return null;
}

function modelFits(provider, model) {
  const m = String(model || '');
  if (!m) return false;
  if (provider === 'grok') return m.startsWith('grok-');
  if (provider === 'nous') return m.includes('/');
  if (provider === 'copilot') return !m.includes('/');
  return !m.includes('/');
}

let dragOffset = null;
let lastEdgePenetration = 0;
let lastEdgeYPct = 0.5;

ipcMain.handle('win:drag-begin', () => {
  if (!win || win.isDestroyed()) return { ok: false };
  const cursor = screen.getCursorScreenPoint();
  const b = win.getBounds();
  dragOffset = { dx: cursor.x - b.x, dy: cursor.y - b.y };
  lastEdgePenetration = 0;
  return { ok: true };
});

ipcMain.on('win:drag-to', () => {
  if (!dragOffset || !win || win.isDestroyed()) return;
  const cursor = screen.getCursorScreenPoint();
  const size = compact ? COMPACT : EXPANDED;
  const x = cursor.x - dragOffset.dx;
  const y = cursor.y - dragOffset.dy;
  const d = screen.getDisplayNearestPoint(cursor);
  const a = d.workArea;
  const normalRightMax = a.x + a.width - size.w;
  const portalRightMax = a.x + a.width - 38; // Allow sliding 82% off the right screen bezel!

  const nearRightEdge = cursor.x >= a.x + a.width - 78 || x > normalRightMax + 8;
  const clampedX = Math.max(a.x, Math.min(nearRightEdge ? portalRightMax : normalRightMax, x));
  const clampedY = Math.max(a.y, Math.min(a.y + a.height - size.h, y));
  win.setPosition(clampedX, clampedY);

  const yPct = Math.max(0.08, Math.min(0.92, (cursor.y - a.y) / Math.max(1, a.height)));
  lastEdgeYPct = yPct;

  if (nearRightEdge) {
    const overPx = Math.max(0, cursor.x - (a.x + a.width - 84));
    const pen = Math.max(0.08, Math.min(1, overPx / 76));
    lastEdgePenetration = pen;
    portal.updateLaptopEdgeDrag({ active: true, penetration: pen, yPct });
    win.webContents.send('portal:edge', { active: true, direction: 'to-phone', penetration: pen, yPct });
  } else if (lastEdgePenetration > 0) {
    lastEdgePenetration = 0;
    portal.updateLaptopEdgeDrag({ active: false, penetration: 0, yPct });
    win.webContents.send('portal:edge', { active: false, direction: 'to-phone', penetration: 0, yPct });
  }
});

ipcMain.handle('win:drag-end', () => {
  const pen = lastEdgePenetration;
  const yPct = lastEdgeYPct;
  dragOffset = null;
  lastEdgePenetration = 0;

  if (pen >= 0.38) {
    portal.triggerHandoffToPhone(yPct);
    return { ok: true, handedOff: true };
  }

  portal.updateLaptopEdgeDrag({ active: false, penetration: 0, yPct });
  if (win && !win.isDestroyed()) {
    win.webContents.send('portal:edge', { active: false, direction: 'to-phone', penetration: 0, yPct });
    const b = win.getBounds();
    const d = screen.getDisplayNearestPoint({ x: b.x, y: b.y });
    const a = d.workArea;
    const size = compact ? COMPACT : EXPANDED;
    if (b.x > a.x + a.width - size.w) {
      win.setPosition(a.x + a.width - size.w - 8, b.y);
    }
  }
  savePos();
  return { ok: true, handedOff: false };
});

ipcMain.handle('bot:snapshot', async () => snapshot());

ipcMain.handle('bot:set-mode', async (_e, { compact: next }) => {
  compact = Boolean(next);
  const st = store.loadState();
  st.compact = compact;
  store.saveState(st);
  applyMode();
  return snapshot();
});

ipcMain.handle('bot:select', async (_e, { id }) => {
  const st = store.loadState();
  if (!st.bots.some((b) => b.id === id)) return snapshot();
  st.activeBotId = id;
  store.saveState(st);
  portal.notifyStateSync();
  return snapshot();
});

ipcMain.handle('bot:create', async (_e, payload) => {
  store.createBot(payload || {});
  portal.notifyStateSync();
  return snapshot();
});

ipcMain.handle('bot:update', async (_e, payload) => {
  store.updateBot(payload && payload.id, payload || {});
  portal.notifyStateSync();
  return snapshot();
});

ipcMain.handle('bot:remember', async (_e, { text }) => {
  const st = store.loadState();
  store.appendMemory(st.activeBotId, String(text || '').slice(0, 400));
  return snapshot();
});

ipcMain.handle('bot:add-goal', async (_e, { text }) => {
  const st = store.loadState();
  store.addGoal(st.activeBotId, String(text || '').slice(0, 240));
  return snapshot();
});

ipcMain.handle('bot:done-goal', async (_e, { id }) => {
  store.completeGoal(id);
  return snapshot();
});

ipcMain.handle('bot:clear-chat', async () => {
  const st = store.loadState();
  store.clearChat(st.activeBotId);
  return snapshot();
});

ipcMain.handle('bot:set-voice', async (_e, { on }) => {
  const st = store.loadState();
  st.voiceOn = Boolean(on);
  if (!st.voiceOn) tools.stopSpeech();
  store.saveState(st);
  return snapshot();
});

ipcMain.handle('bot:speak', async (_e, { text }) => {
  return tools.speakText(text, true);
});

ipcMain.handle('host:status', async () => {
  const statusObj = await tools.hostStatus();
  return {
    rows: statusObj.rows,
    ring: statusObj.ring,
    vitals: statusObj.vitals,
    mcp: statusObj.mcp,
    text: tools.formatStatus(statusObj),
  };
});

ipcMain.handle('host:set-ring', async (_e, { ring }) => {
  tools.setRingState(ring);
  return snapshot();
});

ipcMain.handle('host:screenshot', async () => {
  return tools.captureDesktopScreenshot();
});

ipcMain.handle('host:clipboard', async (_e, payload) => {
  const { clipboard } = require('electron');
  if (payload && typeof payload.write === 'string') {
    clipboard.writeText(payload.write);
    return { ok: true, text: payload.write };
  }
  return { ok: true, text: (clipboard.readText() || '').slice(0, 2000) };
});

ipcMain.handle('host:agent-os', async (_e, { cmd }) => {
  const out = await tools.runAgentOs(['run', String(cmd || 'status')]);
  return { ok: true, text: out };
});

ipcMain.handle('host:mcp-toggle', async (_e, { name, enabled }) => {
  const res = await tools.setMcpServerEnabled(name, enabled);
  return { ...res, snap: snapshot() };
});

ipcMain.handle('host:mcp-sync', async () => {
  const res = await tools.syncMcpRegistry();
  return { ...res, snap: snapshot() };
});

ipcMain.handle('host:workspace-list', async (_e, payload) => {
  const rel = (payload && payload.rel) || '.';
  try {
    const abs = computer.resolveInWorkspace(rel);
    const names = fs.readdirSync(abs);
    const entries = names.map((n) => {
      const p = path.join(abs, n);
      let isDir = false;
      let size = 0;
      let mtime = 0;
      try {
        const st = fs.statSync(p);
        isDir = st.isDirectory();
        size = st.size;
        mtime = st.mtimeMs;
      } catch {
        /* ignore */
      }
      return { name: n, isDir, size, mtime };
    });
    entries.sort((a, b) => (a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1));
    return { ok: true, path: abs, entries };
  } catch (err) {
    return { ok: false, error: String(err.message || err), entries: [] };
  }
});

ipcMain.handle('host:workspace-read', async (_e, { rel }) => {
  try {
    const content = computer.readFile(rel);
    return { ok: true, rel, content };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
});

ipcMain.handle('host:workspace-write', async (_e, { rel, content }) => {
  try {
    const msg = computer.writeFile(rel, content);
    return { ok: true, msg };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
});

ipcMain.handle('host:lock-status', async () => {
  try {
    const text = await tools.lockStatus();
    return { text };
  } catch (err) {
    return { text: String(err.message || err), error: true };
  }
});

ipcMain.handle('host:models', async () => {
  const names = await tools.listModels();
  return { names, text: tools.formatModels(names) };
});

ipcMain.handle('host:catalog', async (_e, payload) => {
  const force = Boolean(payload && payload.force);
  const cat = await catalog.build(force);
  return cat;
});

ipcMain.handle('bot:set-power', async (_e, payload) => setPower(payload || {}));

ipcMain.handle('bot:set-mask', async (_e, { on }) => {
  const st = store.loadState();
  st.maskOn = Boolean(on);
  store.saveState(st);
  return snapshot();
});

ipcMain.handle('host:open', async (_e, { url }) => {
  await tools.openLocalUrl(url);
  return { ok: true };
});

ipcMain.handle('host:workspace', async () => {
  computer.ensureWorkspace();
  const { shell } = require('electron');
  await shell.openPath(computer.WORKSPACE);
  return { ok: true, path: computer.WORKSPACE };
});

ipcMain.handle('host:run', async (_e, { command, approved }) => {
  if (!approved) return { needsApproval: true, command };
  const out = await tools.runCommand(command);
  return { ok: true, out };
});

ipcMain.handle('job:add-pulse', async () => {
  const st = store.loadState();
  const bot = st.bots.find((b) => b.id === st.activeBotId) || st.bots[0];
  jobs.addJob({
    botId: bot.id,
    botName: bot.name,
    kind: 'host_status',
    everySec: 300,
    label: 'host pulse',
  });
  return snapshot();
});

ipcMain.handle('host:approve', async (_e, { id, ok }) => {
  const pending = approvals.get(id);
  if (!pending) return { ok: false };
  approvals.delete(id);
  pending.resolve(Boolean(ok));
  return { ok: true };
});

ipcMain.handle('chat:send', async (event, { text }) => {
  const st = store.loadState();
  const bot = st.bots.find((b) => b.id === st.activeBotId) || st.bots[0];
  const user = String(text || '').trim();
  if (!user) return { error: 'empty' };
  store.appendChat(bot.id, 'user', user);
  const sel = providers.select(st, keyLookup);
  const d = getDb();
  const convId = d ? d.currentConversation(bot.id) : null;
  const history = d && convId ? d.listMessages(convId, 20).filter((m) => m.role === 'user' || m.role === 'assistant').map((m) => ({ role: m.role, content: m.content })) : [];
  if (d) d.addMessage(convId, 'user', user, { provider: sel.id });
  audit('operator', 'chat:send', { provider: sel.id, model: sel.model, chars: user.length });

  const rows = await tools.hostStatus();
  const hostBrief = tools.formatStatus(rows);
  const mem = store.readMemory(bot.id);
  const wc = event.sender;

  const requestApproval = (command) =>
    new Promise((resolve) => {
      const id = 'ap-' + ++approvalSeq;
      approvals.set(id, { resolve });
      wc.send('chat:approval', { id, command: String(command || '') });
      setTimeout(() => {
        if (approvals.has(id)) {
          approvals.delete(id);
          resolve(false);
        }
      }, 120000);
    });

  let result;
  try {
    if (sel.kind === 'sdk' && !sel.ready) throw new Error(sel.reason);
    result = await agent.run({
      sdkProvider: sel.kind === 'sdk' ? sel.id : null,
      apiKey: sel.kind === 'sdk' ? keyLookup(sel.id, providers.get(sel.id).env) : null,
      history,
      audit,
      bot,
      user,
      mem,
      hostBrief,
      engine: st.engine || 'hermes',
      provider: hermesProviderName(st.provider),
      model: sel.kind === 'sdk' ? sel.model : modelFits(st.provider, st.model || bot.model) ? st.model || bot.model : null,
      onToken: (piece) => wc.send('chat:token', piece),
      onTool: (info) => wc.send('chat:tool', info),
      onInit: (info) => wc.send('chat:init', info),
      requestApproval,
    });
  } catch (err) {
    const msg = 'Pocket engine quiet. (' + (err.message || err) + ')';
    wc.send('chat:token', msg);
    store.appendChat(bot.id, 'assistant', msg);
    audit('agent:' + bot.id, 'chat:error', String(err.message || err));
    wc.send('chat:done', { text: msg, engine: st.engine, tools: [] });
    return { text: msg };
  }

  const full = result.text || '';
  store.appendChat(bot.id, 'assistant', full);
  if (d) d.addMessage(convId, 'assistant', full, { provider: result.provider || sel.id, model: result.model });
  if (st.voiceOn && full) {
    tools.speakText(full, true);
  }
  if (compact) {
    try {
      new Notification({ title: bot.name, body: full.slice(0, 180) || 'done' }).show();
    } catch {
      /* ignore */
    }
  }
  wc.send('chat:done', { text: full, model: result.model, engine: result.engine });
  portal.notifyStateSync();
  return { text: full, model: result.model, engine: result.engine };
});

ipcMain.handle('provider:list', async () => {
  const st = store.loadState();
  return { selection: providers.select(st, keyLookup), providers: snapshot().providers, keyring: secrets.keyringAvailable() };
});

ipcMain.handle('provider:set', async (_e, { provider, model }) => {
  const p = providers.get(provider);
  if (!p) return { error: 'unknown provider: ' + provider + ' (try: ' + providers.list().map((x) => x.id).join(', ') + ')' };
  audit('operator', 'provider:set', { provider: p.id, model: model || null });
  return setPower({ provider: p.id, model: model || undefined });
});

ipcMain.handle('provider:set-key', async (_e, { provider, key }) => {
  const p = providers.get(provider);
  if (!p || p.kind !== 'sdk') return { error: 'not an API provider: ' + provider };
  try {
    secrets.setKey(store.ROOT, p.id, key);
    audit('operator', 'provider:set-key', { provider: p.id, cleared: !key });
    return { ok: true, provider: p.id };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('portal:summary', async () => portal.getPortalSummary());

ipcMain.handle('portal:beam', async (_e, payload) => {
  portal.triggerHandoffToPhone(payload && payload.yPct);
  return snapshot();
});

ipcMain.handle('portal:handoff', async (_e, payload) => {
  portal.triggerHandoffToPhone(payload && payload.yPct);
  return snapshot();
});

ipcMain.handle('portal:recall', async (_e, payload) => {
  portal.triggerRecallToLaptop(payload && payload.yPct);
  return snapshot();
});

ipcMain.handle('portal:stage-clipboard', async () => {
  portal.stageClipboardCargo();
  const snap = snapshot();
  return { ...snap, ok: true, snap };
});

ipcMain.handle('portal:stage-file', async (_e, { filePath }) => {
  if (filePath && fs.existsSync(filePath)) {
    portal.stageFileCargo(filePath, 'laptop');
  }
  const snap = snapshot();
  return { ...snap, ok: true, snap };
});

ipcMain.handle('portal:stage-text', async (_e, { title, text }) => {
  if (text) {
    portal.addCargoItem({ kind: 'text', title: title || 'Desk Note', text, origin: 'laptop' });
  }
  const snap = snapshot();
  return { ...snap, ok: true, snap };
});

ipcMain.handle('portal:clear-cargo', async () => {
  portal.clearCargo();
  return snapshot();
});

function summon() {
  portal.triggerRecallToLaptop();
  compact = false;
  showWindow();
  applyMode();
}

app.whenReady().then(() => {
  computer.ensureWorkspace();
  getDb();
  skills.seed();
  if (process.argv.includes('--selftest')) {
    const st = store.loadState();
    tools
      .ollamaAlive()
      .then((up) => {
        console.log('selftest ok');
        console.log('  bots:', st.bots.map((b) => b.name).join(', '));
        console.log('  ollama:', up ? 'up' : 'down');
        console.log('  hermes:', hermes.available() ? hermes.hermesBin() : 'missing');
        console.log('  workspace:', computer.WORKSPACE);
        console.log('  root:', store.ROOT);
        app.quit();
      })
      .catch((err) => {
        console.error(err);
        app.quit();
      });
    return;
  }
  createWindow();
  createTray();
  portal.start({
    getSnapshot: () => snapshot(),
    onBeamToPhone: (summary) => {
      if (!win || win.isDestroyed()) return;
      compact = true;
      const st = store.loadState();
      st.compact = true;
      store.saveState(st);
      win.setBounds({ width: COMPACT.w, height: COMPACT.h });
      win.webContents.send('ui:mode', { compact: true });
      const b = win.getBounds();
      const d = screen.getDisplayNearestPoint({ x: b.x, y: b.y });
      const a = d.workArea;
      const targetY = Math.max(
        a.y,
        Math.min(a.y + a.height - COMPACT.h, Math.round(a.y + (summary.yPct || 0.5) * (a.height - COMPACT.h)))
      );
      // Animate leaping completely off the right edge of the laptop monitor, then hide!
      let step = 0;
      const startX = b.x;
      const endX = a.x + a.width + 24;
      const timer = setInterval(() => {
        step++;
        if (!win || win.isDestroyed()) {
          clearInterval(timer);
          return;
        }
        const t = Math.min(1, step / 6);
        const curX = Math.round(startX + (endX - startX) * t);
        win.setPosition(curX, targetY);
        if (t >= 1) {
          clearInterval(timer);
          win.hide();
        }
      }, 18);
      win.webContents.send('portal:status', snapshot());
    },
    onRecallToLaptop: (yPct) => {
      if (!win || win.isDestroyed()) return;
      const d = screen.getPrimaryDisplay();
      const a = d.workArea;
      const size = compact ? COMPACT : EXPANDED;
      const targetY =
        typeof yPct === 'number'
          ? Math.max(a.y, Math.min(a.y + a.height - size.h, Math.round(a.y + yPct * (a.height - size.h))))
          : Math.round(a.y + 0.45 * (a.height - size.h));
      const startX = a.x + a.width - 24;
      const finalX = a.x + a.width - size.w - 24;
      win.setBounds({ x: startX, y: targetY, width: size.w, height: size.h });
      win.show();
      win.focus();
      let step = 0;
      const timer = setInterval(() => {
        step++;
        if (!win || win.isDestroyed()) {
          clearInterval(timer);
          return;
        }
        const t = 1 - Math.pow(1 - Math.min(1, step / 8), 3);
        const curX = Math.round(startX + (finalX - startX) * t);
        win.setPosition(curX, targetY);
        if (step >= 8) clearInterval(timer);
      }, 16);
      win.webContents.send('portal:status', snapshot());
    },
    onPhoneEdgeDrag: (edge) => {
      if (!win || win.isDestroyed()) return;
      const d = screen.getPrimaryDisplay();
      const a = d.workArea;
      if (edge && edge.active && edge.penetration > 0.05) {
        const y = Math.max(
          a.y,
          Math.min(a.y + a.height - COMPACT.h, Math.round(a.y + (edge.yPct || 0.5) * (a.height - COMPACT.h)))
        );
        const peekX = a.x + a.width - Math.round(edge.penetration * COMPACT.w * 0.85);
        win.setBounds({ x: peekX, y, width: COMPACT.w, height: COMPACT.h });
        if (!win.isVisible()) win.showInactive();
      } else if (portal.getPortalSummary().onPhone) {
        win.hide();
      }
      win.webContents.send('portal:edge', { ...edge, direction: 'to-laptop' });
    },
    onPhoneCargoReceived: (item) => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('portal:cargo-in', { item, snap: snapshot() });
      }
    },
    onPhoneChat: async (text) => {
      const st = store.loadState();
      const bot = st.bots.find((b) => b.id === st.activeBotId) || st.bots[0];
      store.appendChat(bot.id, 'user', text);
      const rows = await tools.hostStatus();
      const hostBrief = tools.formatStatus(rows);
      const mem = store.readMemory(bot.id);
      const res = await agent.run({
        bot,
        user: text,
        mem,
        hostBrief,
        engine: st.engine || 'grok',
        provider: hermesProviderName(st.provider),
        model: modelFits(st.provider, st.model || bot.model) ? st.model || bot.model : null,
      });
      const reply = (res && res.text) || '';
      store.appendChat(bot.id, 'assistant', reply);
      if (win && !win.isDestroyed()) {
        win.webContents.send('portal:status', snapshot());
      }
      return reply;
    },
    onStatusChange: () => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('portal:status', snapshot());
      }
    },
    onPhoneAvatarUpdate: (payload) => {
      const st = store.loadState();
      const botId = (payload && payload.id) || st.activeBotId;
      store.updateBot(botId, payload);
      if (win && !win.isDestroyed()) {
        win.webContents.send('portal:status', snapshot());
      }
    },
  });
  jobs.start();
  jobs.setPulseHandler((evt) => {
    if (win && !win.isDestroyed()) win.webContents.send('job:pulse', evt);
  });
  for (const accel of ['CommandOrControl+Shift+Space', 'Super+Shift+Z']) {
    try {
      globalShortcut.register(accel, summon);
    } catch {
      /* compositor may own Super */
    }
  }
});

app.on('will-quit', () => {
  try {
    globalShortcut.unregisterAll();
  } catch {
    /* ignore */
  }
});

app.on('window-all-closed', () => {
  /* tray keeps the process alive */
});

app.on('before-quit', () => {
  savePos();
  jobs.stop();
});
