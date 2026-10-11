/**
 * ZOTHOS COCKPIT PRO - Sovereign Interactive Operations Deck v2.5.0
 * =====================================================================
 * Flagship Electron operations center for ZOTHOS Linux.
 * Integrates live hardware & network metrics, 21-Agent Swarm Deck,
 * Daemon Supervisor, Instant Reality Mode switching, and Sovereign Arsenal.
 *
 * Author: Neal Frazier / ZOTHOS Linux Core Systems Engineering
 * Entity: Neal Frazier Tech (https://nealfrazier.tech | https://github.com/1nc0gn30)
 * License: MIT / Sovereign Open Source
 */

const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const net = require('net');
const http = require('http');
const { exec, execSync } = require('child_process');

app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('enable-transparent-visuals');

let mainWindow = null;
let prevCpuIdle = 0;
let prevCpuTotal = 0;
let prevNetBytes = { rx: 0, tx: 0, time: Date.now() };

// Initialize CPU tracking
try {
  const statLine = fs.readFileSync('/proc/stat', 'utf8').split('\n')[0];
  const parts = statLine.trim().split(/\s+/).slice(1).map(Number);
  prevCpuIdle = parts[3] + parts[4];
  prevCpuTotal = parts.reduce((a, b) => a + b, 0);
} catch (e) {
  prevCpuIdle = 0;
  prevCpuTotal = 1;
}

function checkPort(port, host = '127.0.0.1', timeout = 120) {
  return new Promise((resolve) => {
    if (!port || port <= 0) return resolve(false);
    const sock = net.createConnection({ port, host, timeout });
    sock.on('connect', () => {
      sock.destroy();
      resolve(true);
    });
    sock.on('timeout', () => {
      sock.destroy();
      resolve(false);
    });
    sock.on('error', () => {
      resolve(false);
    });
  });
}

function fetchJson(url, timeout = 300) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout }, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

function getRunningProcesses() {
  try {
    const pids = fs.readdirSync('/proc').filter((p) => /^\d+$/.test(p));
    const comms = new Set();
    for (const pid of pids) {
      try {
        const comm = fs.readFileSync(`/proc/${pid}/comm`, 'utf8').trim();
        comms.add(comm);
        if (comm.startsWith('python') || comm === 'node' || comm === 'electron' || comm.startsWith('sh')) {
          const cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8');
          if (cmdline.includes('zoth-cursor-daemon')) comms.add('zoth-cursor-daemon');
          if (cmdline.includes('sovereign_agent_bridge')) comms.add('sovereign_agent_bridge');
          if (cmdline.includes('neuro_memory_daemon')) comms.add('neuro_memory_daemon');
          if (cmdline.includes('swarm_daemon.py')) comms.add('swarm_daemon.py');
          if (cmdline.includes('zoth-vault-daemon')) comms.add('zoth-vault-daemon');
          if (cmdline.includes('simplex-chat')) comms.add('simplex-chat');
        }
      } catch (e) {}
    }
    return comms;
  } catch (e) {
    return new Set();
  }
}

function getCpuMetrics() {
  let cpuPct = 0;
  try {
    const statLine = fs.readFileSync('/proc/stat', 'utf8').split('\n')[0];
    const parts = statLine.trim().split(/\s+/).slice(1).map(Number);
    const idle = parts[3] + parts[4];
    const total = parts.reduce((a, b) => a + b, 0);
    const idleDelta = idle - prevCpuIdle;
    const totalDelta = total - prevCpuTotal;
    prevCpuIdle = idle;
    prevCpuTotal = total;
    if (totalDelta > 0) {
      cpuPct = Math.max(0, Math.min(100, 100 * (1 - idleDelta / totalDelta)));
    }
  } catch (e) {
    cpuPct = 0;
  }

  const loads = os.loadavg();
  const cores = os.cpus().length || 1;
  const model = (os.cpus()[0] && os.cpus()[0].model) || 'Unknown CPU';

  return {
    pct: parseFloat(cpuPct.toFixed(1)),
    loads: loads.map((l) => parseFloat(l.toFixed(2))),
    cores,
    model,
  };
}

function getRamMetrics() {
  let usedGb = 0, totalGb = 1, pct = 0, swapUsedGb = 0, swapTotalGb = 0, swapPct = 0;
  try {
    const memData = fs.readFileSync('/proc/meminfo', 'utf8');
    const mem = {};
    memData.split('\n').forEach((line) => {
      const idx = line.indexOf(':');
      if (idx !== -1) {
        const k = line.substring(0, idx).trim();
        const v = parseInt(line.substring(idx + 1).trim(), 10);
        mem[k] = v;
      }
    });

    const totalKb = mem['MemTotal'] || 1024;
    const availKb = mem['MemAvailable'] !== undefined ? mem['MemAvailable'] : (mem['MemFree'] || 0);
    const usedKb = Math.max(0, totalKb - availKb);
    pct = (usedKb / totalKb) * 100;
    usedGb = usedKb / (1024 * 1024);
    totalGb = totalKb / (1024 * 1024);

    const swapTotalKb = mem['SwapTotal'] || 0;
    const swapFreeKb = mem['SwapFree'] || 0;
    const swapUsedKb = Math.max(0, swapTotalKb - swapFreeKb);
    swapTotalGb = swapTotalKb / (1024 * 1024);
    swapUsedGb = swapUsedKb / (1024 * 1024);
    swapPct = swapTotalKb > 0 ? (swapUsedKb / swapTotalKb) * 100 : 0;
  } catch (e) {}

  return {
    used_gb: parseFloat(usedGb.toFixed(1)),
    total_gb: parseFloat(totalGb.toFixed(1)),
    pct: parseFloat(pct.toFixed(1)),
    swap_used_gb: parseFloat(swapUsedGb.toFixed(1)),
    swap_total_gb: parseFloat(swapTotalGb.toFixed(1)),
    swap_pct: parseFloat(swapPct.toFixed(1)),
  };
}

function getDiskMetrics() {
  let usedGb = 0, totalGb = 1, freeGb = 0, pct = 0;
  try {
    const stat = fs.statfsSync('/');
    const bsize = stat.bsize;
    const totalBytes = stat.blocks * bsize;
    const freeBytes = stat.bavail * bsize;
    const usedBytes = Math.max(0, totalBytes - freeBytes);

    totalGb = totalBytes / (1024 * 1024 * 1024);
    usedGb = usedBytes / (1024 * 1024 * 1024);
    freeGb = freeBytes / (1024 * 1024 * 1024);
    pct = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;
  } catch (e) {}

  return {
    used_gb: parseFloat(usedGb.toFixed(1)),
    total_gb: parseFloat(totalGb.toFixed(1)),
    free_gb: parseFloat(freeGb.toFixed(1)),
    pct: parseFloat(pct.toFixed(1)),
  };
}

function getUptimeStr() {
  try {
    const upSec = parseFloat(fs.readFileSync('/proc/uptime', 'utf8').split(' ')[0]);
    const d = Math.floor(upSec / 86400);
    const h = Math.floor((upSec % 86400) / 3600);
    const m = Math.floor((upSec % 3600) / 60);
    if (d > 0) return `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
  } catch (e) {
    return '00h 00m';
  }
}

function getNetInfo() {
  const info = { ip: '127.0.0.1', iface: 'lo', gw: 'None', rx_kb_s: 0, tx_kb_s: 0 };
  try {
    const routeLines = fs.readFileSync('/proc/net/route', 'utf8').split('\n');
    for (let i = 1; i < routeLines.length; i++) {
      const parts = routeLines[i].trim().split(/\s+/);
      if (parts.length >= 3 && parts[1] === '00000000') {
        info.iface = parts[0];
        const hex = parts[2];
        const b = [
          parseInt(hex.substr(6, 2), 16),
          parseInt(hex.substr(4, 2), 16),
          parseInt(hex.substr(2, 2), 16),
          parseInt(hex.substr(0, 2), 16),
        ];
        info.gw = b.join('.');
        break;
      }
    }
  } catch (e) {}

  try {
    const ifaces = os.networkInterfaces();
    for (const name of Object.keys(ifaces)) {
      if (name === info.iface || info.iface === 'lo') {
        for (const netObj of ifaces[name]) {
          if (netObj.family === 'IPv4' && !netObj.internal) {
            info.ip = netObj.address;
            info.iface = name;
            break;
          }
        }
      }
    }
  } catch (e) {}

  // Calculate live RX and TX throughput
  try {
    const devLines = fs.readFileSync('/proc/net/dev', 'utf8').split('\n');
    let currentRx = 0, currentTx = 0;
    for (const line of devLines) {
      if (line.includes(info.iface + ':')) {
        const parts = line.split(':')[1].trim().split(/\s+/).map(Number);
        currentRx = parts[0];
        currentTx = parts[8];
        break;
      }
    }

    const now = Date.now();
    const timeDelta = Math.max(0.2, (now - prevNetBytes.time) / 1000);
    if (prevNetBytes.rx > 0 && currentRx >= prevNetBytes.rx) {
      info.rx_kb_s = parseFloat(((currentRx - prevNetBytes.rx) / (1024 * timeDelta)).toFixed(1));
      info.tx_kb_s = parseFloat(((currentTx - prevNetBytes.tx) / (1024 * timeDelta)).toFixed(1));
    }
    prevNetBytes = { rx: currentRx, tx: currentTx, time: now };
  } catch (e) {}

  info.rxSpeedStr = `${(info.rx_kb_s || 0).toFixed(1)} KB/s`;
  info.txSpeedStr = `${(info.tx_kb_s || 0).toFixed(1)} KB/s`;

  return info;
}

function getTopProcesses() {
  try {
    const out = execSync('ps -eo pid,user,%cpu,%mem,comm --sort=-%cpu | head -n 7', { encoding: 'utf8', timeout: 300 });
    const lines = out.trim().split('\n').slice(1);
    return lines.map((l) => {
      const parts = l.trim().split(/\s+/);
      const cmdName = parts.slice(4).join(' ');
      return {
        pid: parts[0],
        user: parts[1],
        cpu: parseFloat(parts[2]) || 0,
        mem: parseFloat(parts[3]) || 0,
        cmd: cmdName,
        comm: cmdName,
      };
    });
  } catch (e) {
    return [];
  }
}

function getActiveMode() {
  if (fs.existsSync('/run/zoth_ghostmode.state')) return 'ghost';
  const stateFiles = [
    path.join(os.homedir(), '.config/zothos/profile.state'),
    path.join(os.homedir(), '.config/zothos/reality.state'),
    path.join(os.homedir(), '.config/zothos/current_mode'),
  ];
  for (const f of stateFiles) {
    if (fs.existsSync(f)) {
      try {
        const mode = fs.readFileSync(f, 'utf8').trim().toLowerCase();
        if (['gold', 'ghost', 'matrix', 'incognito', 'win11', 'cyan'].includes(mode)) {
          return mode === 'win11' ? 'incognito' : mode;
        }
      } catch (e) {}
    }
  }
  return 'gold';
}

function getCursorState(runningProcesses) {
  const daemonAlive = runningProcesses.has('zoth-cursor-daemon');
  const shmPath = '/dev/shm/zoth_cursor.json';
  if (fs.existsSync(shmPath)) {
    try {
      const raw = fs.readFileSync(shmPath, 'utf8');
      const data = JSON.parse(raw);
      const now = Date.now() / 1000;
      const age = now - (data.timestamp || 0);
      return {
        x: data.x || 0,
        y: data.y || 0,
        daemonAlive,
        moving: age < 3.0,
        age: parseFloat(age.toFixed(2)),
      };
    } catch (e) {}
  }
  return { x: 0, y: 0, daemonAlive, moving: false, age: 999 };
}

// 10 Core Daemons
const DAEMONS = [
  {
    id: 'zoth-cursor-daemon',
    name: 'Cursor Tracker Daemon',
    desc: 'High-frequency global cursor tracking (/dev/shm/zoth_cursor.json)',
    port: 0,
    type: 'process',
    processName: 'zoth-cursor-daemon',
    startCmd: 'nohup /usr/bin/python3 /usr/local/bin/zoth-cursor-daemon >/dev/null 2>&1 &',
    stopCmd: 'pkill -f zoth-cursor-daemon || true',
  },
  {
    id: 'ollama',
    name: 'Ollama Neural Engine',
    desc: 'Local neural inference server (DeepSeek, Llama, Qwen)',
    port: 11434,
    type: 'port',
    serviceName: 'ollama',
    startCmd: 'sudo systemctl start ollama',
    stopCmd: 'sudo systemctl stop ollama',
    restartCmd: 'sudo systemctl restart ollama',
  },
  {
    id: 'sovereign_agent_bridge',
    name: 'Sovereign Agent Bridge',
    desc: 'E2EE Inter-agent cryptographic message broker bus',
    port: 8102,
    type: 'port',
    processName: 'sovereign_agent_bridge',
    startCmd: 'nohup python3 -m sovereign_agent_bridge serve --host 127.0.0.1 --port 8102 >/tmp/bridge.log 2>&1 &',
    stopCmd: 'pkill -f sovereign_agent_bridge || true',
  },
  {
    id: 'neuro_memory',
    name: 'Neuro Memory Daemon',
    desc: 'Vector memory & cognitive graph knowledge storage',
    port: 8094,
    type: 'port',
    processName: 'neuro_memory_daemon',
    startCmd: 'nohup python3 -m neuro_memory_daemon serve -H 127.0.0.1 -p 8094 >/tmp/neuro_mem.log 2>&1 &',
    stopCmd: 'pkill -f neuro_memory_daemon || true',
  },
  {
    id: 'swarm_mux',
    name: 'Swarm Multiplexer',
    desc: '21-Agent Autonomous Swarm Execution Bus',
    port: 8790,
    type: 'port',
    processName: 'swarm_daemon.py',
    startCmd: 'nohup python3 /opt/zoth-studio/bin/swarm_daemon.py >/tmp/swarm.log 2>&1 || nohup python3 "$HOME/NullAITech/zoth-studio-v2/bin/swarm_daemon.py" >/tmp/swarm.log 2>&1 &',
    stopCmd: 'pkill -f swarm_daemon.py || true',
  },
  {
    id: 'zoth_vault',
    name: 'Sovereign Vault Daemon',
    desc: 'Argon2id & XChaCha20 Zero-Knowledge Secret Enclave',
    port: 8787,
    type: 'port',
    processName: 'zoth-vault-daemon',
    startCmd: 'nohup /usr/local/bin/zoth-vault-daemon --port 8787 >/tmp/vault.log 2>&1 &',
    stopCmd: 'pkill -f zoth-vault-daemon || true',
  },
  {
    id: 'tor',
    name: 'Tor SOCKS5 Stealth Proxy',
    desc: 'Darknet packet anonymizer & amnesic routing',
    port: 9050,
    type: 'port',
    serviceName: 'tor',
    startCmd: 'sudo systemctl start tor',
    stopCmd: 'sudo systemctl stop tor',
    restartCmd: 'sudo systemctl restart tor',
  },
  {
    id: 'tailscale',
    name: 'Tailscale Mesh Node',
    desc: 'Zero-config encrypted peer-to-peer overlay network',
    port: 0,
    type: 'service',
    serviceName: 'tailscaled',
    startCmd: 'sudo systemctl start tailscaled',
    stopCmd: 'sudo systemctl stop tailscaled',
    restartCmd: 'sudo systemctl restart tailscaled',
  },
  {
    id: 'ipfs',
    name: 'IPFS Storage Node',
    desc: 'Decentralized interplanetary file system repository',
    port: 5001,
    type: 'port',
    serviceName: 'ipfs',
    startCmd: 'sudo systemctl start ipfs || nohup ipfs daemon >/tmp/ipfs.log 2>&1 &',
    stopCmd: 'sudo systemctl stop ipfs || pkill -f "ipfs daemon" || true',
  },
  {
    id: 'simplex',
    name: 'SimpleX Quantum Bridge',
    desc: 'Decentralized metadata-free E2E messaging bridge',
    port: 5225,
    type: 'port',
    processName: 'simplex-chat',
    startCmd: 'nohup /usr/local/bin/simplex-chat -d "$HOME/.simplex/zoth_agent" -p 5225 --user-display-name "Zoth Studio AI" >/tmp/simplex.log 2>&1 &',
    stopCmd: 'pkill -f simplex-chat || true',
  },
];

// 21 Pantheon Agents Master Specs
const AGENTS = [
  // Cadre: Architects (6)
  { id: 'AZOTH', name: 'Azoth Prime', role: 'Sovereign Alchemist & Prime Architect', cadre: 'Architects', img: 'azoth-neon.jpg', port: 8790, ring: 'Ring 0 (Root)', harness: 'agy', model: 'claude-3-7-sonnet', memoriesCount: 3 },
  { id: 'NEXUS', name: 'Nexus Quantum', role: 'Lead Architect & Quantum Synthesis', cadre: 'Architects', img: 'nexus.jpg', port: 8790, ring: 'Ring 1 (Admin)', harness: 'agy', model: 'gemini-2.5-pro', memoriesCount: 3 },
  { id: 'VIGIL', name: 'Vigil Arbiter', role: 'Cosmic Reasoner & AST Arbiter', cadre: 'Architects', img: 'vigil.jpg', port: 8790, ring: 'Ring 1 (Admin)', harness: 'hermes-agent', model: 'deepseek-r1:70b', memoriesCount: 3 },
  { id: 'MERCURY', name: 'Mercury Messenger', role: 'Tool-Calling Executor & Release Hardener', cadre: 'Architects', img: 'mercury.jpg', port: 8102, ring: 'Ring 2 (MCP)', harness: 'hermes-agent', model: 'hermes-3:70b', memoriesCount: 2 },
  { id: 'GHOSTBYTE', name: 'Ghostbyte', role: 'Zero-Knowledge Vault Sentinel', cadre: 'Architects', img: 'ghostbyte-neon.jpg', port: 8787, ring: 'Ring 0 (Vault)', harness: 'codex', model: 'gpt-4.5', memoriesCount: 2 },
  { id: 'ATHENA', name: 'Athena Scholar', role: 'AEO Knowledge Architect', cadre: 'Architects', img: 'athena-neon.jpg', port: 8790, ring: 'Ring 2 (MCP)', harness: 'claude-code', model: 'claude-3-5-sonnet', memoriesCount: 2 },

  // Cadre: Code (4)
  { id: 'CHRONOS', name: 'Chronos Temporal', role: 'Temporal DAG Sequencer & Git Navigator', cadre: 'Code', img: 'chronos-neon.jpg', port: 8790, ring: 'Ring 2 (Git)', harness: 'opencode', model: 'qwen2.5-coder:32b', memoriesCount: 2 },
  { id: 'DRACO', name: 'Draco Consensus', role: 'Multi-Model Consensus & Fusion Arbiter', cadre: 'Code', img: 'draco-neon.jpg', port: 8790, ring: 'Ring 2 (Consensus)', harness: 'hermes-agent', model: 'deepseek-r1:70b', memoriesCount: 2 },
  { id: 'IGNIS', name: 'Ignis Refactor', role: 'Refactor Engine & Pipeline Finisher', cadre: 'Code', img: 'ignis-neon.jpg', port: 8790, ring: 'Ring 2 (Build)', harness: 'claude-code', model: 'claude-3-7-sonnet', memoriesCount: 2 },
  { id: 'KAI', name: 'Kai Inspector', role: 'Workspace Inspector & Static Analysis', cadre: 'Code', img: 'kai-neon.jpg', port: 8790, ring: 'Ring 2 (Linter)', harness: 'agy', model: 'claude-3-5-sonnet', memoriesCount: 2 },

  // Cadre: Security (4)
  { id: 'LYCAN', name: 'Lycan Sentinel', role: 'OWASP Sentinel & Security Hardening', cadre: 'Security', img: 'lycan-neon.jpg', port: 8787, ring: 'Ring 1 (Sec)', harness: 'agy', model: 'claude-3-7-sonnet', memoriesCount: 2 },
  { id: 'ONYX', name: 'Onyx Auditor', role: 'Red-Team Threat Auditor', cadre: 'Security', img: 'onyx-neon.jpg', port: 8787, ring: 'Ring 1 (PenTest)', harness: 'codex', model: 'gpt-4.5', memoriesCount: 2 },
  { id: 'SCORPIUS', name: 'Scorpius Gate', role: 'Zero-Day Gatekeeper', cadre: 'Security', img: 'scorpius-neon.jpg', port: 8787, ring: 'Ring 1 (Exploit)', harness: 'opencode', model: 'deepseek-r1:70b', memoriesCount: 2 },
  { id: 'PIXEL-SHIBA', name: 'Pixel Shiba', role: 'Argon2id Hardware Key Guardian', cadre: 'Security', img: 'pixel-shiba-neon.jpg', port: 8787, ring: 'Ring 0 (Key)', harness: 'ollama', model: 'llama3.3:70b', memoriesCount: 2 },

  // Cadre: Creative (3)
  { id: 'KITSUNE', name: 'Kitsune Motion', role: 'Taste, Motion & Accessibility', cadre: 'Creative', img: 'kitsune-neon.jpg', port: 8790, ring: 'Ring 3 (UI/UX)', harness: 'claude-code', model: 'claude-3-7-sonnet', memoriesCount: 2 },
  { id: 'LEVIATHAN', name: 'Leviathan Memory', role: 'Deep Tensor & Vector Memory Recall', cadre: 'Creative', img: 'leviathan-neon.jpg', port: 8094, ring: 'Ring 2 (Memory)', harness: 'hermes-agent', model: 'deepseek-r1:70b', memoriesCount: 2 },
  { id: 'AQUILA', name: 'Aquila Mesh', role: 'Edge Dispatcher & Low-Latency Mesh', cadre: 'Creative', img: 'aquila-neon.jpg', port: 8102, ring: 'Ring 2 (Mesh)', harness: 'agy', model: 'gemini-2.5-pro', memoriesCount: 2 },

  // Cadre: Swarm (4)
  { id: 'KRAKEN', name: 'Kraken Sniffer', role: 'ESP32 Serial Bridge & Packet Sniffer', cadre: 'Swarm', img: 'kraken-neon.jpg', port: 8102, ring: 'Ring 2 (Serial)', harness: 'opencode', model: 'qwen2.5-coder:32b', memoriesCount: 2 },
  { id: 'AETHER', name: 'Aether Overlord', role: 'Swarm Overlord & Peer Bus Synchronizer', cadre: 'Swarm', img: 'aether-neon.jpg', port: 8790, ring: 'Ring 1 (Sync)', harness: 'hermes-agent', model: 'hermes-3:70b', memoriesCount: 2 },
  { id: 'PIXEL-NEKO', name: 'Pixel Neko', role: 'Tool Bench Librarian & Connector Bridge', cadre: 'Swarm', img: 'pixel-neko-neon.jpg', port: 8790, ring: 'Ring 2 (Tools)', harness: 'ollama', model: 'llama3.3:70b', memoriesCount: 2 },
  { id: 'RADICAL-MINION', name: 'Radical Minion', role: 'Fast-Loop Subagent Runner', cadre: 'Swarm', img: 'radical-minion-neon.jpg', port: 8790, ring: 'Ring 3 (Fast)', harness: 'agy', model: 'claude-3-5-sonnet', memoriesCount: 2 },
];

async function sampleFullState() {
  const cpu = getCpuMetrics();
  const ram = getRamMetrics();
  const disk = getDiskMetrics();
  const uptime = getUptimeStr();
  const netInfo = getNetInfo();
  const activeMode = getActiveMode();
  const runningProcesses = getRunningProcesses();
  const cursor = getCursorState(runningProcesses);
  const topProcesses = getTopProcesses();

  // Tor check
  const torPortUp = await checkPort(9050);
  const isGhostCloaked = fs.existsSync('/run/zoth_ghostmode.state');
  const torStatus = isGhostCloaked
    ? 'CLOAKED (Ghostmode Active)'
    : torPortUp
    ? 'ONLINE (Tor SOCKS5 :9050)'
    : 'CLEAN (Direct Clearnet Route)';
  const isCloaked = isGhostCloaked || torPortUp;

  // Check daemons
  const daemonStatuses = await Promise.all(
    DAEMONS.map(async (d) => {
      let isUp = false;
      if (d.port > 0) {
        isUp = await checkPort(d.port);
      } else if (d.id === 'zoth-cursor-daemon') {
        isUp = cursor.daemonAlive;
      } else if (d.id === 'tailscale') {
        isUp = Object.keys(os.networkInterfaces()).includes('tailscale0') || runningProcesses.has('tailscaled');
      } else if (d.processName) {
        isUp = runningProcesses.has(d.processName);
      }
      return {
        id: d.id,
        name: d.name,
        desc: d.desc,
        port: d.port,
        isUp,
      };
    })
  );

  // Check Swarm / Agents health
  const swarmPortUp = await checkPort(8790);
  const bridgePortUp = await checkPort(8102);
  const memoryPortUp = await checkPort(8094);
  const vaultPortUp = await checkPort(8787);

  // Fetch live swarm agent runtime data if available
  let liveAgentsData = null;
  if (swarmPortUp) {
    liveAgentsData = await fetchJson('http://127.0.0.1:8790/api/swarm/agents', 250);
  }

  // Fetch live bridge & memory stats
  let bridgeStats = null;
  if (bridgePortUp) {
    bridgeStats = await fetchJson('http://127.0.0.1:8102/api/stats', 250);
  }

  let memoryStats = null;
  if (memoryPortUp) {
    memoryStats = await fetchJson('http://127.0.0.1:8094/api/stats', 250);
  }

  const agentsWithStatus = AGENTS.map((a) => {
    let online = false;
    if (a.port === 8790) online = swarmPortUp;
    else if (a.port === 8102) online = bridgePortUp;
    else if (a.port === 8094) online = memoryPortUp;
    else if (a.port === 8787) online = vaultPortUp;
    else online = true;

    // Merge live data if available
    let agentDetails = { ...a, isOnline: online };
    if (Array.isArray(liveAgentsData)) {
      const match = liveAgentsData.find((la) => la.id === a.id);
      if (match) {
        agentDetails.model = match.model || a.model;
        agentDetails.harness = match.harness || a.harness;
        agentDetails.status = match.status || (online ? 'IDLE' : 'OFFLINE');
        agentDetails.pid = match.pid || 0;
        agentDetails.memories = match.memories || [];
        agentDetails.memoriesCount = (match.memories || []).length;
      }
    }

    return agentDetails;
  });

  return {
    version: '2.5.0-Azoth',
    timestamp: Date.now(),
    telemetry: {
      cpu,
      ram,
      disk,
      uptime,
      net: netInfo,
      tor: { status: torStatus, isCloaked },
      cursor,
      activeMode,
      topProcesses,
      system: {
        kernel: os.release(),
        arch: os.arch(),
        host: os.hostname(),
        user: os.userInfo().username,
        desktop: process.env.XDG_CURRENT_DESKTOP || 'KDE/XFCE',
        session: process.env.XDG_SESSION_TYPE || 'x11',
      },
    },
    daemons: daemonStatuses,
    agents: agentsWithStatus,
    meshKPIs: {
      swarmActive: swarmPortUp,
      bridgeStats: (bridgeStats && bridgeStats.telemetry) || null,
      memoryStats: memoryStats || null,
    },
  };
}

function createWindow() {
  const iconPath = path.join(__dirname, 'assets/icon.png');
  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workAreaSize || primaryDisplay.bounds;
  const targetWidth = Math.min(1380, Math.floor(workArea.width * 0.94));
  const targetHeight = Math.min(880, Math.floor(workArea.height * 0.92));

  mainWindow = new BrowserWindow({
    width: targetWidth,
    height: targetHeight,
    minWidth: 960,
    minHeight: 640,
    center: true,
    backgroundColor: '#04070c',
    frame: false,
    resizable: true,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer] ${message} (${sourceId}:${line})`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Background Telemetry Loop (1000ms)
  let loopRunning = true;
  async function runTelemetryLoop() {
    while (loopRunning && mainWindow && !mainWindow.isDestroyed()) {
      try {
        const state = await sampleFullState();
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('telemetry-update', state);
        }
      } catch (e) {
        console.error('Telemetry sampling error:', e);
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  mainWindow.webContents.once('did-finish-load', async () => {
    try {
      const initial = await sampleFullState();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('telemetry-update', initial);
      }
    } catch (e) {
      console.error('Initial telemetry push error:', e);
    }
    runTelemetryLoop();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── Window Controls IPC ───────────────────────────────────────────────
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

// ── Snapshot on demand IPC ────────────────────────────────────────────
ipcMain.handle('get-full-state', async () => {
  return await sampleFullState();
});

// ── Daemon Supervisor IPC ─────────────────────────────────────────────
ipcMain.handle('daemon-action', async (event, { daemonId, action }) => {
  const daemon = DAEMONS.find((d) => d.id === daemonId);
  if (!daemon) return { success: false, message: `Daemon ${daemonId} not found` };

  let cmd = '';
  if (action === 'start') {
    cmd = daemon.startCmd || (daemon.serviceName ? `sudo systemctl start ${daemon.serviceName}` : '');
  } else if (action === 'stop') {
    cmd = daemon.stopCmd || (daemon.serviceName ? `sudo systemctl stop ${daemon.serviceName}` : '');
  } else if (action === 'restart') {
    cmd =
      daemon.restartCmd ||
      (daemon.serviceName
        ? `sudo systemctl restart ${daemon.serviceName}`
        : `${daemon.stopCmd || ''} ; sleep 0.4 ; ${daemon.startCmd || ''}`);
  }

  if (!cmd) return { success: false, message: `No command for action ${action}` };

  return new Promise((resolve) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        resolve({ success: false, message: stderr || err.message });
      } else {
        resolve({ success: true, message: `Daemon ${daemon.name} ${action} triggered successfully` });
      }
    });
  });
});

// ── Daemon Logs IPC ───────────────────────────────────────────────────
ipcMain.handle('get-daemon-logs', async (event, { daemonId }) => {
  const daemon = DAEMONS.find((d) => d.id === daemonId);
  if (!daemon) return { success: false, logs: 'Daemon not found.' };

  let logCmd = '';
  if (daemon.serviceName) {
    logCmd = `journalctl -u ${daemon.serviceName} -n 60 --no-pager 2>&1`;
  } else if (daemon.id === 'sovereign_agent_bridge') {
    logCmd = `cat /tmp/bridge.log 2>/dev/null | tail -n 60 || ps -fp $(pgrep -f sovereign_agent_bridge)`;
  } else if (daemon.id === 'neuro_memory') {
    logCmd = `cat /tmp/neuro_mem.log 2>/dev/null | tail -n 60 || ps -fp $(pgrep -f neuro_memory_daemon)`;
  } else if (daemon.id === 'swarm_mux') {
    logCmd = `cat /tmp/swarm.log 2>/dev/null | tail -n 60 || ps -fp $(pgrep -f swarm_daemon.py)`;
  } else if (daemon.id === 'zoth_vault') {
    logCmd = `cat /tmp/vault.log 2>/dev/null | tail -n 60 || ps -fp $(pgrep -f zoth-vault-daemon)`;
  } else if (daemon.id === 'zoth-cursor-daemon') {
    logCmd = `cat /dev/shm/zoth_cursor.json 2>/dev/null ; echo ""; ps -fp $(pgrep -f zoth-cursor-daemon)`;
  } else {
    logCmd = `ps -fp $(pgrep -f "${daemon.processName || daemon.id}") 2>/dev/null || echo "No active log stream."`;
  }

  return new Promise((resolve) => {
    exec(logCmd, { timeout: 2000 }, (err, stdout, stderr) => {
      resolve({
        success: true,
        daemonId,
        daemonName: daemon.name,
        logs: stdout || stderr || 'No log output recorded yet.',
      });
    });
  });
});

// ── Reality Mode Switcher IPC ─────────────────────────────────────────
ipcMain.handle('switch-reality-mode', async (event, { mode }) => {
  return new Promise((resolve) => {
    const cmd = `/usr/local/bin/zoth-mode ${mode}`;
    exec(cmd, (err, stdout, stderr) => {
      resolve({
        success: !err,
        mode,
        output: stdout,
        error: stderr,
      });
    });
  });
});

// ── Tool Launcher IPC ─────────────────────────────────────────────────
ipcMain.handle('launch-tool', async (event, { toolId }) => {
  const toolMap = {
    'zoth-studio': 'nohup /usr/local/bin/zoth-studio >/dev/null 2>&1 &',
    'zoth-tool-nexus': 'nohup /usr/local/bin/zoth-tool-nexus >/dev/null 2>&1 &',
    'zoth-doctor': 'konsole --title "Zoth System Doctor Auditor" --hold -e /usr/local/bin/zoth-doctor &',
    'zoth-heal': 'konsole --title "Zoth System Self-Heal" --hold -e /usr/local/bin/zoth-heal &',
    'zoth-pet-hud': 'nohup /opt/pethud/pethud >/dev/null 2>&1 &',
    'zoth-fastfetch': 'konsole --title "Zoth FastFetch Hardware Specs" --hold -e /usr/local/bin/zoth-fastfetch &',
    'zoth-cockpit-tui': 'konsole --title "ZothOS Cockpit TUI" -e /usr/local/bin/zoth-cockpit --tui &',
    'zoth-agent-hud': 'nohup /usr/local/bin/zoth-agent-hud >/dev/null 2>&1 &',
    'zoth-live-wallpaper': 'nohup /usr/local/bin/zoth-live-wallpaper >/dev/null 2>&1 &',
    'zoth-mcp': 'konsole --title "Zoth MCP Registry" --hold -e /usr/local/bin/zoth-mcp list &',
    'zoth-netkill': 'nohup /usr/local/bin/zoth-netkill >/dev/null 2>&1 &',
    'btop': 'konsole --title "Btop Resource Monitor" -e btop &',
  };

  const cmd = toolMap[toolId] || `nohup ${toolId} >/dev/null 2>&1 &`;
  return new Promise((resolve) => {
    exec(cmd, (err) => {
      resolve({ success: !err, toolId });
    });
  });
});

// ── Agent Quick Dispatch IPC ──────────────────────────────────────────
ipcMain.handle('dispatch-agent-prompt', async (event, { agentId, prompt }) => {
  // First try Swarm Daemon at :8790
  const swarmPayload = JSON.stringify({
    agent_id: agentId,
    command: prompt,
  });

  return new Promise((resolve) => {
    const sReq = http.request(
      {
        hostname: '127.0.0.1',
        port: 8790,
        path: '/api/swarm/command',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(swarmPayload),
        },
        timeout: 4000,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.success && Array.isArray(parsed.results) && parsed.results.length > 0) {
              return resolve({ success: true, text: parsed.results[0].output });
            }
          } catch (e) {}
          fallbackToOllama(agentId, prompt, resolve);
        });
      }
    );

    sReq.on('error', () => {
      fallbackToOllama(agentId, prompt, resolve);
    });

    sReq.write(swarmPayload);
    sReq.end();
  });
});

function fallbackToOllama(agentId, prompt, resolve) {
  const reqBody = JSON.stringify({
    model: 'llama3.2:latest',
    prompt: `[SOVEREIGN PANTHEON DISPATCH // AGENT ${agentId}]\nTask Directives: ${prompt}\n\nExecute sovereign response:`,
    stream: false,
  });

  const req = http.request(
    {
      hostname: '127.0.0.1',
      port: 11434,
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(reqBody),
      },
      timeout: 8000,
    },
    (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          resolve({ success: true, text: parsed.response || 'Task acknowledged.' });
        } catch (e) {
          resolve({ success: true, text: `Dispatched to ${agentId} bus.` });
        }
      });
    }
  );

  req.on('error', () => {
    resolve({ success: false, text: 'Local neural inference engine (:11434) currently offline.' });
  });

  req.write(reqBody);
  req.end();
}

// ── Process Terminate IPC ─────────────────────────────────────────────
ipcMain.handle('kill-process', async (event, { pid }) => {
  return new Promise((resolve) => {
    if (!pid || pid <= 1) return resolve({ success: false, message: 'Invalid PID' });
    exec(`kill -15 ${pid} 2>/dev/null || kill -9 ${pid} 2>/dev/null`, (err) => {
      resolve({ success: !err });
    });
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
