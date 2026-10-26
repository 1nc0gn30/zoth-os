'use strict';

const fs = require('fs');
const http = require('http');
const net = require('net');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { shell, clipboard } = require('electron');
const store = require('./store');
const computer = require('./computer');

const WATCH = [
  { name: 'WebGen', host: '127.0.0.1', port: 5173 },
  { name: 'Studio', host: '127.0.0.1', port: 3000 },
  { name: 'Civilization', host: '127.0.0.1', port: 9393 },
  { name: 'Ollama', host: '127.0.0.1', port: 11434 },
  { name: 'Relay', host: '127.0.0.1', port: 8765 },
  { name: 'Vault', host: '127.0.0.1', port: 8787 },
];

const OLLAMA_HOST = '127.0.0.1';
const OLLAMA_PORT = 11434;

const RING_META = {
  0: { name: 'SOVEREIGN', title: 'Ring 0: Root, Kernel & Amnesic Authority' },
  1: { name: 'SYSADMIN', title: 'Ring 1: System Admin & Privileged Ops' },
  2: { name: 'TOOLMASTER', title: 'Ring 2: Agent Tools & MCP Runtime' },
  3: { name: 'SPECTRE', title: 'Ring 3: Sandboxed LLM & Read-Only' },
};

const RING_TO_LAYER = { 0: 4, 1: 3, 2: 2, 3: 0 };

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

function zothLockBin() {
  const local = path.join(os.homedir(), '.local', 'bin', 'zoth-lock');
  if (fs.existsSync(local)) return local;
  return 'zoth-lock';
}

function lockStatus() {
  return new Promise((resolve, reject) => {
    execFile(
      zothLockBin(),
      ['--status'],
      { timeout: 5000, maxBuffer: 16 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error((stderr || err.message || 'zoth-lock failed').slice(0, 800)));
          return;
        }
        resolve(String(stdout || '').trim().slice(0, 2000));
      }
    );
  });
}

function getRingState() {
  const ringFile = path.join(os.homedir(), '.config', 'zothos', 'agent-ring.state');
  const layerFile = path.join(os.homedir(), '.config', 'zothos', 'agent-layer.state');
  let ring = 2;
  try {
    if (fs.existsSync(ringFile)) {
      const v = parseInt(fs.readFileSync(ringFile, 'utf8').trim(), 10);
      if (v >= 0 && v <= 3) ring = v;
    } else if (fs.existsSync(layerFile)) {
      const l = parseInt(fs.readFileSync(layerFile, 'utf8').trim(), 10);
      const map = { 4: 0, 3: 1, 2: 2, 1: 2, 0: 3 };
      if (l in map) ring = map[l];
    }
  } catch {
    /* default ring 2 */
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

function getMcpSummary() {
  const userCfg = path.join(os.homedir(), '.config', 'zothos', 'mcp-servers.json');
  const sysCfg = '/etc/zothos/mcp-servers.json';
  const target = fs.existsSync(userCfg) ? userCfg : sysCfg;
  try {
    const raw = JSON.parse(fs.readFileSync(target, 'utf8'));
    const servers = raw.mcpServers || {};
    const names = Object.keys(servers);
    const enabled = names.filter((k) => servers[k] && servers[k].enabled);
    const ringCounts = { 0: 0, 1: 0, 2: 0, 3: 0 };
    const items = names.map((k) => {
      const s = servers[k] || {};
      const lvl = s.ring_level ?? 2;
      if (lvl in ringCounts) ringCounts[lvl]++;
      return {
        name: k,
        enabled: Boolean(s.enabled),
        ring: lvl,
        securityRing: s.securityRing || `RING_${lvl}`,
        offline: Boolean(s.offline),
        description: String(s.description || '').slice(0, 180),
      };
    });
    return {
      total: names.length,
      enabledCount: enabled.length,
      enabled: enabled.slice(0, 40),
      sample: names.slice(0, 24),
      ringCounts,
      items,
    };
  } catch {
    return { total: 0, enabledCount: 0, enabled: [], sample: [], ringCounts: {}, items: [] };
  }
}

function setMcpServerEnabled(name, enabled) {
  return new Promise((resolve) => {
    const bin = '/usr/local/bin/zoth-mcp';
    const cleanName = String(name || '').trim();
    if (!cleanName || !/^[a-z0-9_.-]+$/i.test(cleanName)) {
      resolve({ ok: false, error: 'invalid server name' });
      return;
    }
    const sub = enabled ? 'enable' : 'disable';
    execFile(bin, [sub, cleanName], { timeout: 15000, maxBuffer: 64 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        resolve({ ok: false, error: String(stderr || err.message || 'zoth-mcp failed').slice(0, 400) });
        return;
      }
      resolve({ ok: true, name: cleanName, enabled: Boolean(enabled), out: String(stdout || '').slice(0, 600) });
    });
  });
}

function syncMcpRegistry() {
  return new Promise((resolve) => {
    const bin = '/usr/local/bin/zoth-mcp';
    execFile(bin, ['sync'], { timeout: 15000, maxBuffer: 64 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        resolve({ ok: false, error: String(stderr || err.message || 'sync failed').slice(0, 400) });
        return;
      }
      resolve({ ok: true, out: String(stdout || '').slice(0, 600) });
    });
  });
}

function getSystemVitals() {
  const load = os.loadavg();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPct = Math.round((usedMem / Math.max(1, totalMem)) * 100);
  const usedGiB = (usedMem / 1073741824).toFixed(1);
  const totalGiB = (totalMem / 1073741824).toFixed(0);
  const uptimeHrs = (os.uptime() / 3600).toFixed(1);
  const ghostMode = fs.existsSync('/run/zoth_ghostmode.state');
  return {
    cpuLoad1m: load[0].toFixed(2),
    memPct,
    usedGiB,
    totalGiB,
    uptimeHrs,
    ghostMode,
  };
}

function runAgentOs(args = ['status'], timeout = 15000) {
  return new Promise((resolve) => {
    const bin = '/usr/local/bin/zoth-agent-os';
    if (!fs.existsSync(bin)) {
      resolve(JSON.stringify({ error: 'zoth-agent-os not found' }));
      return;
    }
    execFile(bin, args, { timeout, maxBuffer: 64 * 1024 }, (err, stdout, stderr) => {
      if (err && !stdout) {
        resolve(String(stderr || err.message || 'zoth-agent-os failed').slice(0, 2000));
        return;
      }
      resolve(String(stdout || stderr || '').trim().slice(0, 4000));
    });
  });
}

function captureDesktopScreenshot() {
  return new Promise((resolve) => {
    computer.ensureWorkspace();
    const file = `screen-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    const dest = path.join(computer.WORKSPACE, file);
    const bin = '/usr/local/bin/zoth-agent-os';
    if (fs.existsSync(bin)) {
      execFile(bin, ['run', 'screenshot'], { timeout: 10000 }, (_err, stdout) => {
        try {
          const parsed = JSON.parse(String(stdout || '').split('\n').slice(1).join('\n') || stdout);
          if (parsed && parsed.path && fs.existsSync(parsed.path)) {
            fs.copyFileSync(parsed.path, dest);
            resolve({ ok: true, path: dest, file });
            return;
          }
        } catch {
          /* fallback to import */
        }
        execFile(
          'import',
          ['-window', 'root', dest],
          { env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0' }, timeout: 8000 },
          (e2) => {
            if (!e2 && fs.existsSync(dest)) resolve({ ok: true, path: dest, file });
            else resolve({ ok: false, error: 'screenshot capture unavailable' });
          }
        );
      });
      return;
    }
    resolve({ ok: false, error: 'screenshot tool unavailable' });
  });
}

let activeSpeechProc = null;
function speakText(text, enabled = true) {
  if (!enabled) return { ok: false, reason: 'muted' };
  const clean = String(text || '')
    .replace(/```[\s\S]*?```/g, ' code block ')
    .replace(/[`*_#>~]/g, '')
    .trim()
    .slice(0, 500);
  if (!clean) return { ok: false };
  try {
    if (activeSpeechProc) {
      activeSpeechProc.kill('SIGTERM');
      activeSpeechProc = null;
    }
    const bin = fs.existsSync('/usr/bin/spd-say')
      ? '/usr/bin/spd-say'
      : fs.existsSync('/usr/bin/espeak-ng')
      ? '/usr/bin/espeak-ng'
      : null;
    if (!bin) return { ok: false, reason: 'no-tts-binary' };
    const args = bin.endsWith('spd-say') ? ['-r', '5', clean] : ['-s', '175', clean];
    activeSpeechProc = execFile(bin, args, { timeout: 30000 }, () => {
      activeSpeechProc = null;
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

function stopSpeech() {
  if (activeSpeechProc) {
    try {
      activeSpeechProc.kill('SIGTERM');
    } catch {
      /* ignore */
    }
    activeSpeechProc = null;
  }
  return { ok: true };
}

function listModels() {
  return new Promise((resolve) => {
    const req = http.request(
      { host: OLLAMA_HOST, port: OLLAMA_PORT, path: '/api/tags', method: 'GET', timeout: 3000 },
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

function formatModels(names) {
  if (!names || !names.length) return 'no local models (Ollama quiet)';
  return names.join('\n');
}

async function hostStatus() {
  const rows = [];
  for (const w of WATCH) {
    const up = await probe(w.host, w.port);
    rows.push({ ...w, up });
  }
  try {
    const text = await lockStatus();
    const locked = /locked:\s+yes\b/i.test(text);
    rows.push({ name: 'zoth-lock', kind: 'lock', up: true, locked, text });
  } catch (err) {
    rows.push({
      name: 'zoth-lock',
      kind: 'lock',
      up: false,
      locked: null,
      text: String(err.message || err),
    });
  }
  const ring = getRingState();
  const vitals = getSystemVitals();
  const mcp = getMcpSummary();
  return { rows, ring, vitals, mcp };
}

function formatStatus(statusObj) {
  const rows = Array.isArray(statusObj) ? statusObj : (statusObj && statusObj.rows) || [];
  const ring = statusObj && statusObj.ring ? statusObj.ring : getRingState();
  const vitals = statusObj && statusObj.vitals ? statusObj.vitals : getSystemVitals();
  const mcp = statusObj && statusObj.mcp ? statusObj.mcp : getMcpSummary();

  const portLines = rows
    .map((r) => {
      if (r.kind === 'lock' || r.name === 'zoth-lock') {
        if (!r.up) return `zoth-lock: down (${r.text || 'error'})`;
        return `zoth-lock: ${r.locked ? 'LOCKED' : 'UNLOCKED'}`;
      }
      return `${r.name} :${r.port} ${r.up ? 'UP' : 'DOWN'}`;
    })
    .join(' · ');

  return [
    `Authority: Ring ${ring.ring} (${ring.name}) · Layer ${ring.layer}`,
    `Vitals: Load ${vitals.cpuLoad1m} · RAM ${vitals.usedGiB}/${vitals.totalGiB} GiB (${vitals.memPct}%) · Up ${vitals.uptimeHrs}h`,
    `MCP Hub: ${mcp.total} servers cataloged (${mcp.enabledCount} hot)`,
    `Daemons: ${portLines}`,
  ].join('\n');
}

function openLocalUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('bad url');
  }
  const host = parsed.hostname;
  if (host !== '127.0.0.1' && host !== 'localhost') {
    throw new Error('only localhost urls');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('only http(s)');
  }
  return shell.openExternal(parsed.toString());
}

function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    const trimmed = String(cmd || '').trim();
    if (!trimmed || trimmed.length > 240) {
      reject(new Error('command empty or too long'));
      return;
    }
    if (/[;&|`$<>]/.test(trimmed) || trimmed.includes('\n')) {
      reject(new Error('refusing a shell metacharacter'));
      return;
    }
    const parts = trimmed.split(/\s+/);
    const bin = parts[0];
    const args = parts.slice(1);
    execFile(bin, args, { timeout: 15000, maxBuffer: 64 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error((stderr || err.message || 'failed').slice(0, 800)));
        return;
      }
      resolve((stdout || '').slice(0, 4000));
    });
  });
}

async function dispatch(botId, tool) {
  const name = tool.name;
  const arg = tool.arg || '';
  if (name === 'host_status' || name === 'os_status') {
    const st = await hostStatus();
    return formatStatus(st);
  }
  if (name === 'lock_status') {
    return lockStatus();
  }
  if (name === 'models') {
    const names = await listModels();
    return formatModels(names);
  }
  if (name === 'mcp_list') {
    const mcp = getMcpSummary();
    return `MCP Registry: ${mcp.total} servers (${mcp.enabledCount} enabled)\nSample: ${mcp.sample.join(', ')}`;
  }
  if (name === 'ring_status') {
    const r = getRingState();
    return `Ring ${r.ring} (${r.name}) — ${r.title}`;
  }
  if (name === 'screenshot') {
    const res = await captureDesktopScreenshot();
    return res.ok ? `Captured screenshot to workspace: ${res.file}` : `Screenshot failed: ${res.error}`;
  }
  if (name === 'clipboard_read') {
    return (clipboard.readText() || '(clipboard empty)').slice(0, 2000);
  }
  if (name === 'clipboard_write') {
    clipboard.writeText(String(arg || ''));
    return 'copied to clipboard';
  }
  if (name === 'agent_os') {
    return runAgentOs(['run', arg || 'status']);
  }
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
  if (name === 'list_dir') {
    return computer.listDir(arg || '.');
  }
  if (name === 'read_file') {
    return computer.readFile(arg);
  }
  if (name === 'write_file') {
    const split = arg.split('|');
    const rel = (split.shift() || '').trim();
    const body = split.join('|').replace(/^\s/, '');
    return computer.writeFile(rel, body);
  }
  if (name === 'fetch') {
    return computer.fetchUrl(arg);
  }
  if (name === 'open_url') {
    await openLocalUrl(arg);
    return `opened ${arg}`;
  }
  if (name === 'run' || name === 'run_command') {
    return { needsApproval: true, command: arg };
  }
  return `unknown tool ${name}`;
}

function ollamaAlive() {
  return probe('127.0.0.1', 11434, 500);
}

module.exports = {
  WATCH,
  RING_META,
  hostStatus,
  formatStatus,
  lockStatus,
  getRingState,
  setRingState,
  getMcpSummary,
  setMcpServerEnabled,
  syncMcpRegistry,
  getSystemVitals,
  runAgentOs,
  captureDesktopScreenshot,
  speakText,
  stopSpeech,
  listModels,
  formatModels,
  openLocalUrl,
  runCommand,
  dispatch,
  ollamaAlive,
};
