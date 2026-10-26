'use strict';

const fs = require('fs');
const http = require('http');
const net = require('net');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const store = require('./store');
const skills = require('./skills');

const WORKSPACE = path.join(store.ROOT, 'workspace');
const MAX_FILE = 200 * 1024;

const WATCH = [
  { name: 'WebGen', host: '127.0.0.1', port: 5173 },
  { name: 'Studio', host: '127.0.0.1', port: 3000 },
  { name: 'Civilization', host: '127.0.0.1', port: 9393 },
  { name: 'Ollama', host: '127.0.0.1', port: 11434 },
  { name: 'Relay', host: '127.0.0.1', port: 8765 },
  { name: 'Vault', host: '127.0.0.1', port: 8787 },
  { name: 'Watch', host: '127.0.0.1', port: 9340 },
  { name: 'Kokoro', host: '127.0.0.1', port: 9394 },
];

const RING_META = {
  0: { name: 'SOVEREIGN', title: 'Ring 0 · Root & kernel' },
  1: { name: 'SYSADMIN', title: 'Ring 1 · Privileged ops' },
  2: { name: 'TOOLMASTER', title: 'Ring 2 · Tools & MCP' },
  3: { name: 'SPECTRE', title: 'Ring 3 · Read only' },
};
const RING_TO_LAYER = { 0: 4, 1: 3, 2: 2, 3: 0 };

const MENU = [
  { id: 'talk', label: 'TALK', hint: 'Live conversation' },
  { id: 'status', label: 'STATUS', hint: 'Ports, ring, vitals' },
  { id: 'ring', label: 'RING', hint: 'Authority now' },
  { id: 'lock', label: 'LOCK', hint: 'zoth-lock' },
  { id: 'models', label: 'MODELS', hint: 'Ollama roster' },
  { id: 'mcp', label: 'MCP', hint: 'Tool servers' },
  { id: 'pocket', label: 'POCKET', hint: 'Workspace files' },
  { id: 'os', label: 'OS', hint: 'zoth-agent-os' },
  { id: 'screen', label: 'SCREEN', hint: 'Capture desktop' },
  { id: 'skills', label: 'SKILLS', hint: 'Pocket skills' },
  { id: 'memory', label: 'MEMORY', hint: 'Teammate memory' },
  { id: 'ring0', label: 'RING 0', hint: 'Sovereign' },
  { id: 'ring2', label: 'RING 2', hint: 'Toolmaster' },
];

function ensureWorkspace() {
  fs.mkdirSync(WORKSPACE, { recursive: true });
  return WORKSPACE;
}

function resolveInWorkspace(rel) {
  ensureWorkspace();
  const raw = String(rel || '.').trim() || '.';
  const abs = path.resolve(WORKSPACE, raw);
  const root = path.resolve(WORKSPACE);
  if (abs !== root && !abs.startsWith(root + path.sep)) {
    throw new Error('path stays inside the pocket workspace');
  }
  return abs;
}

function probe(host, port, ms = 350) {
  return new Promise((resolve) => {
    const sock = net.connect({ host, port });
    const t = setTimeout(() => {
      sock.destroy();
      resolve(false);
    }, ms);
    sock.on('connect', () => {
      clearTimeout(t);
      sock.end();
      resolve(true);
    });
    sock.on('error', () => {
      clearTimeout(t);
      resolve(false);
    });
  });
}

function getRingState() {
  const ringFile = path.join(os.homedir(), '.config', 'zothos', 'agent-ring.state');
  let ring = 2;
  try {
    if (fs.existsSync(ringFile)) {
      const v = parseInt(fs.readFileSync(ringFile, 'utf8').trim(), 10);
      if (v >= 0 && v <= 3) ring = v;
    }
  } catch {
    /* default */
  }
  const meta = RING_META[ring] || RING_META[2];
  return { ring, name: meta.name, title: meta.title, layer: RING_TO_LAYER[ring] ?? 2 };
}

function setRingState(targetRing) {
  const ring = Math.max(0, Math.min(3, parseInt(targetRing, 10) || 2));
  const dir = path.join(os.homedir(), '.config', 'zothos');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'agent-ring.state'), String(ring) + '\n', { mode: 0o600 });
  fs.writeFileSync(path.join(dir, 'agent-layer.state'), String(RING_TO_LAYER[ring] ?? 2) + '\n', {
    mode: 0o600,
  });
  return getRingState();
}

function getSystemVitals() {
  const load = os.loadavg();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  return {
    cpuLoad1m: load[0].toFixed(2),
    memPct: Math.round((usedMem / Math.max(1, totalMem)) * 100),
    usedGiB: (usedMem / 1073741824).toFixed(1),
    totalGiB: (totalMem / 1073741824).toFixed(0),
    uptimeHrs: (os.uptime() / 3600).toFixed(1),
  };
}

function getMcpSummary() {
  const userCfg = path.join(os.homedir(), '.config', 'zothos', 'mcp-servers.json');
  const sysCfg = '/etc/zothos/mcp-servers.json';
  const target = fs.existsSync(userCfg) ? userCfg : sysCfg;
  try {
    const raw = JSON.parse(fs.readFileSync(target, 'utf8'));
    const servers = raw.mcpServers || {};
    const names = Object.keys(servers);
    const enabled = names.filter((k) => servers[k] && servers[k].enabled);
    return {
      total: names.length,
      enabledCount: enabled.length,
      sample: names.slice(0, 18),
      enabled: enabled.slice(0, 24),
    };
  } catch {
    return { total: 0, enabledCount: 0, sample: [], enabled: [] };
  }
}

function lockStatus() {
  return new Promise((resolve) => {
    const bin = fs.existsSync(path.join(os.homedir(), '.local', 'bin', 'zoth-lock'))
      ? path.join(os.homedir(), '.local', 'bin', 'zoth-lock')
      : 'zoth-lock';
    execFile(bin, ['--status'], { timeout: 5000, maxBuffer: 16 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        resolve('zoth-lock: ' + String(stderr || err.message || 'down').slice(0, 400));
        return;
      }
      resolve(String(stdout || '').trim().slice(0, 2000));
    });
  });
}

function listModels() {
  return new Promise((resolve) => {
    const req = http.request(
      { host: '127.0.0.1', port: 11434, path: '/api/tags', method: 'GET', timeout: 3000 },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          try {
            const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            resolve((data.models || []).map((m) => m.name).filter(Boolean));
          } catch {
            resolve([]);
          }
        });
      }
    );
    req.on('error', () => resolve([]));
    req.on('timeout', () => {
      req.destroy();
      resolve([]);
    });
    req.end();
  });
}

function runAgentOs(args = ['status']) {
  return new Promise((resolve) => {
    const bin = '/usr/local/bin/zoth-agent-os';
    if (!fs.existsSync(bin)) {
      resolve('zoth-agent-os not found');
      return;
    }
    execFile(bin, args, { timeout: 15000, maxBuffer: 64 * 1024 }, (err, stdout, stderr) => {
      resolve(String(stdout || stderr || err && err.message || '').trim().slice(0, 4000) || 'quiet');
    });
  });
}

function runInWorkspace(cmd) {
  ensureWorkspace();
  const trimmed = String(cmd || '').trim();
  if (!trimmed || trimmed.length > 240) return Promise.reject(new Error('command empty or too long'));
  return new Promise((resolve, reject) => {
    execFile(
      'bash',
      ['-lc', trimmed],
      { cwd: WORKSPACE, timeout: 20000, maxBuffer: 64 * 1024 },
      (err, stdout, stderr) => {
        if (err && !stdout) {
          reject(new Error(String(stderr || err.message || 'failed').slice(0, 800)));
          return;
        }
        resolve(String(stdout || stderr || '').slice(0, 4000));
      }
    );
  });
}

function listDir(rel) {
  const abs = resolveInWorkspace(rel);
  const names = fs.readdirSync(abs);
  return (
    names
      .map((name) => {
        let kind = 'f';
        try {
          kind = fs.statSync(path.join(abs, name)).isDirectory() ? 'd' : 'f';
        } catch {
          /* skip */
        }
        return kind + ' ' + name;
      })
      .join('\n') || '(empty)'
  );
}

function readFile(rel) {
  const abs = resolveInWorkspace(rel);
  const st = fs.statSync(abs);
  if (st.size > MAX_FILE) throw new Error('file too large');
  return fs.readFileSync(abs, 'utf8').slice(0, MAX_FILE);
}

async function hostStatus() {
  const rows = [];
  for (const w of WATCH) {
    rows.push({ ...w, up: await probe(w.host, w.port) });
  }
  const lock = await lockStatus();
  const ring = getRingState();
  const vitals = getSystemVitals();
  const mcp = getMcpSummary();
  return { rows, ring, vitals, mcp, lock };
}

function formatStatus(st) {
  const portLines = (st.rows || [])
    .map((r) => `${r.name} :${r.port} ${r.up ? 'UP' : 'DOWN'}`)
    .join('\n');
  const ring = st.ring || getRingState();
  const vitals = st.vitals || getSystemVitals();
  const mcp = st.mcp || getMcpSummary();
  return [
    `Ring ${ring.ring} (${ring.name})`,
    `Load ${vitals.cpuLoad1m} · RAM ${vitals.memPct}% · Up ${vitals.uptimeHrs}h`,
    `MCP ${mcp.enabledCount}/${mcp.total} hot`,
    portLines,
    st.lock || '',
  ]
    .filter(Boolean)
    .join('\n');
}

function screenshot() {
  return new Promise((resolve) => {
    ensureWorkspace();
    const file = `screen-${Date.now()}.png`;
    const dest = path.join(WORKSPACE, file);
    const bin = '/usr/local/bin/zoth-agent-os';
    const finishImport = () => {
      execFile(
        'import',
        ['-window', 'root', dest],
        { env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0' }, timeout: 8000 },
        (e2) => {
          if (!e2 && fs.existsSync(dest)) resolve('Captured ' + file);
          else resolve('Screenshot unavailable');
        }
      );
    };
    if (fs.existsSync(bin)) {
      execFile(bin, ['run', 'screenshot'], { timeout: 10000 }, (_err, stdout) => {
        try {
          const parsed = JSON.parse(String(stdout || '').split('\n').slice(1).join('\n') || stdout);
          if (parsed && parsed.path && fs.existsSync(parsed.path)) {
            fs.copyFileSync(parsed.path, dest);
            resolve('Captured ' + file);
            return;
          }
        } catch {
          /* fallback */
        }
        finishImport();
      });
      return;
    }
    finishImport();
  });
}

async function snapshot(bot) {
  const st = await hostStatus();
  return {
    bot: { name: bot.name, job: bot.job, id: bot.id },
    ring: st.ring,
    vitals: st.vitals,
    mcp: { total: st.mcp.total, enabled: st.mcp.enabledCount },
    services: (st.rows || []).map((r) => ({ name: r.name, port: r.port, up: r.up })),
    menu: MENU,
    lock: st.lock,
  };
}

async function dispatch(botId, tool) {
  const name = tool.name;
  const arg = tool.arg || '';
  if (name === 'host_status' || name === 'os_status') return formatStatus(await hostStatus());
  if (name === 'lock_status') return lockStatus();
  if (name === 'models') {
    const names = await listModels();
    return names.length ? names.join('\n') : 'no local models';
  }
  if (name === 'mcp_list') {
    const mcp = getMcpSummary();
    return `MCP ${mcp.enabledCount}/${mcp.total} hot\n${mcp.sample.join(', ')}`;
  }
  if (name === 'ring_status') {
    const r = getRingState();
    return `Ring ${r.ring} (${r.name})\n${r.title}`;
  }
  if (name === 'screenshot') return screenshot();
  if (name === 'agent_os') return runAgentOs(['run', arg || 'status']);
  if (name === 'remember') {
    if (!arg) return 'nothing to remember';
    store.appendMemory(botId, arg);
    return 'remembered';
  }
  if (name === 'goal') {
    if (!arg) return 'nothing to goal';
    store.addGoal(botId, arg);
    return 'goal saved';
  }
  if (name === 'list_dir') return listDir(arg || '.');
  if (name === 'read_file') return readFile(arg);
  if (name === 'write_file') {
    const split = arg.split('|');
    const rel = (split.shift() || '').trim();
    const body = split.join('|').replace(/^\s/, '');
    const abs = resolveInWorkspace(rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, body, { mode: 0o600 });
    return 'wrote ' + rel;
  }
  if (name === 'fetch') {
    throw new Error('fetch from the desk');
  }
  if (name === 'run' || name === 'run_command') {
    return runInWorkspace(arg);
  }
  return 'unknown tool ' + name;
}

async function runMenu(id, bot) {
  const bid = bot && bot.id;
  if (id === 'status') return { title: 'STATUS', text: formatStatus(await hostStatus()) };
  if (id === 'ring') {
    const r = getRingState();
    return { title: 'RING', text: `Ring ${r.ring} (${r.name})\n${r.title}` };
  }
  if (id === 'ring0' || id === 'ring1' || id === 'ring2' || id === 'ring3') {
    const n = Number(id.slice(-1));
    const r = setRingState(n);
    return { title: 'RING', text: `Now Ring ${r.ring} (${r.name})\n${r.title}` };
  }
  if (id === 'lock') return { title: 'LOCK', text: await lockStatus() };
  if (id === 'models') {
    const names = await listModels();
    return { title: 'MODELS', text: names.length ? names.join('\n') : 'no local models' };
  }
  if (id === 'mcp') {
    const mcp = getMcpSummary();
    return {
      title: 'MCP',
      text: `${mcp.enabledCount} hot / ${mcp.total} cataloged\n${(mcp.enabled.length ? mcp.enabled : mcp.sample).join('\n')}`,
    };
  }
  if (id === 'pocket') return { title: 'POCKET', text: listDir('.') };
  if (id === 'os') return { title: 'OS', text: await runAgentOs(['status']) };
  if (id === 'screen') return { title: 'SCREEN', text: await screenshot() };
  if (id === 'skills') return { title: 'SKILLS', text: skills.loadAll().slice(0, 1600) };
  if (id === 'memory') return { title: 'MEMORY', text: store.readMemory(bid) || '(empty)' };
  return { title: 'ZOTH', text: 'unknown command' };
}

module.exports = {
  MENU,
  WORKSPACE,
  snapshot,
  dispatch,
  runMenu,
  hostStatus,
  formatStatus,
  getRingState,
};
