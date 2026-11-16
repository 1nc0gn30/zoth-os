// AETHER-OBSERVATORY — Core OS Telemetry Sampler
// Reads REAL data from /proc, /sys, and system binaries. No mocks, ever.

import fs from 'node:fs';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const NULLAI_ROOT = '/home/zoth/NullAITech';
const TOOLS_DATA = path.join(NULLAI_ROOT, 'zoth-studio-v2/src/data/toolsData.js');

// ---------- helpers ----------
const readSafe = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const execSafe = (bin, args = [], timeout = 2500) => {
  try { return execFileSync(bin, args, { encoding: 'utf8', timeout, stdio: ['ignore', 'pipe', 'ignore'] }); }
  catch { return null; }
};

// ---------- CPU load (real sampled jiffies over 400ms) ----------
let lastCpu = null;
function cpuSampleSync() {
  const first = os.cpus().map(c => c.times);
  const before = Date.now();
  while (Date.now() - before < 110) { /* short busy-free yield via sync spin (~110ms max, only on demand) */ }
  const second = os.cpus().map(c => c.times);
  return second.map((s, i) => {
    const f = first[i];
    const total = (s.user - f.user) + (s.nice - f.nice) + (s.sys - f.sys) + (s.idle - f.idle) + (s.irq - f.irq);
    const busy = (s.user - f.user) + (s.nice - f.nice) + (s.sys - f.sys) + (s.irq - f.irq);
    return total > 0 ? Math.min(100, Math.max(0, (busy / total) * 100)) : 0;
  });
}

// async version — non-blocking 250ms sampling window
export function sampleCpu() {
  return new Promise((resolve) => {
    const first = os.cpus().map(c => c.times);
    setTimeout(() => {
      const second = os.cpus().map(c => c.times);
      const cores = second.map((s, i) => {
        const f = first[i];
        const dt = {};
        for (const k of ['user', 'nice', 'sys', 'idle', 'irq']) dt[k] = s[k] - f[k];
        const total = dt.user + dt.nice + dt.sys + dt.idle + dt.irq;
        const busy = dt.user + dt.nice + dt.sys + dt.irq;
        return total > 0 ? +(Math.min(100, Math.max(0, (busy / total) * 100))).toFixed(1) : 0;
      });
      resolve(cores);
    }, 250);
  });
}

// ---------- Thermal zones ----------
export function readThermals() {
  const zones = [];
  const base = '/sys/class/thermal';
  try {
    for (const z of fs.readdirSync(base).filter(d => d.startsWith('thermal_zone'))) {
      const type = readSafe(path.join(base, z, 'type'))?.trim() || z;
      const raw = parseInt(readSafe(path.join(base, z, 'temp')) || '', 10);
      if (Number.isFinite(raw)) zones.push({ zone: z, label: type, celsius: +(raw / 1000).toFixed(1) });
    }
  } catch { /* no thermal sysfs */ }
  // Also parse `sensors` for coretemp / package readings when present
  const s = execSafe('sensors', [], 2000);
  let packageC = null, fanRpm = null;
  if (s) {
    const pkg = s.match(/(?:Package id 0|CPU|Composite):\s*\+([\d.]+)°C/);
    if (pkg) packageC = parseFloat(pkg[1]);
    const fan = s.match(/fan\d+:\s*(\d+)\s*RPM/);
    if (fan) fanRpm = parseInt(fan[1], 10);
    // coretemp per-core lines
    const cores = [...s.matchAll(/Core (\d+):\s*\+([\d.]+)°C/g)].map(m => ({ core: `core-${m[1]}`, celsius: parseFloat(m[2]) }));
    if (cores.length) return { zones, packageC, fanRpm, coreTemps: cores };
  }
  // Fallback: derive package as max zone
  if (packageC === null && zones.length) packageC = Math.max(...zones.map(z => z.celsius));
  return { zones, packageC, fanRpm, coreTemps: [] };
}

// ---------- Memory ----------
export function readMemory() {
  const raw = readSafe('/proc/meminfo');
  const m = {};
  if (raw) for (const line of raw.split('\n')) {
    const mm = line.match(/^(\w+):\s+(\d+)\s+kB/);
    if (mm) m[mm[1]] = parseInt(mm[2], 10);
  }
  const total = m.MemTotal || 0, free = m.MemFree || 0, avail = m.MemAvailable || 0;
  const buffers = m.Buffers || 0, cached = (m.Cached || 0) + (m.SReclaimable || 0);
  const used = total - free - buffers - cached;
  return {
    totalKb: total, usedKb: used, freeKb: free, availableKb: avail,
    buffersKb: buffers, cachedKb: cached,
    swapTotalKb: m.SwapTotal || 0, swapUsedKb: (m.SwapTotal || 0) - (m.SwapFree || 0),
    usedPct: total ? +(100 * used / total).toFixed(1) : 0,
    swapPct: (m.SwapTotal || 0) ? +(100 * ((m.SwapTotal - m.SwapFree) / m.SwapTotal)).toFixed(1) : 0
  };
}

// ---------- Disk I/O ----------
export function readDiskIO() {
  const raw = readSafe('/proc/diskstats');
  const devs = [];
  if (raw) for (const line of raw.split('\n')) {
    const p = line.trim().split(/\s+/);
    if (p.length < 14) continue;
    const name = p[2];
    if (/^(nvme\d+n\d+|\bsd[a-z]+\b|\bvd[a-z]+\b|mmcblk\d+)$/.test(name)) {
      devs.push({
        device: name,
        readsCompleted: parseInt(p[3], 10), sectorsRead: parseInt(p[5], 10),
        writesCompleted: parseInt(p[7], 10), sectorsWritten: parseInt(p[9], 10),
        ioInFlight: parseInt(p[11], 10)
      });
    }
  }
  return devs;
}

// ---------- Network ----------
export function readNet() {
  const raw = readSafe('/proc/net/dev');
  const devs = [];
  if (raw) for (const line of raw.split('\n').slice(2)) {
    const p = line.split(':');
    if (p.length < 2) continue;
    const f = p[1].trim().split(/\s+/);
    devs.push({ iface: p[0].trim(), rxBytes: parseInt(f[0], 10), txBytes: parseInt(f[8], 10), rxPackets: parseInt(f[1], 10), txPackets: parseInt(f[9], 10) });
  }
  return devs;
}

// ---------- Listening sockets (real `ss -tlnp`) ----------
export function readListeners() {
  const out = execSafe('ss', ['-tlnp'], 2500);
  const listeners = [];
  if (!out) return listeners;
  for (const line of out.split('\n').slice(1)) {
    const p = line.trim().split(/\s+/);
    if (p.length < 6) continue;
    const la = p[3];
    const portMatch = la.match(/:(\d+)$/);
    if (!portMatch) continue;
    const proc = line.match(/users:\(\("([^"]+)",pid=(\d+)/);
    listeners.push({
      proto: p[0], localAddr: la.split(':').slice(0, -1).join(':') || la,
      port: parseInt(portMatch[1], 10),
      processName: proc ? proc[1] : null, pid: proc ? parseInt(proc[2], 10) : null
    });
  }
  return listeners;
}

// proc uptime for a pid
export function procUptime(pid) {
  if (!pid) return null;
  const uptime = parseFloat(readSafe('/proc/uptime')?.split(' ')[0] || 'NaN');
  const stat = readSafe(`/proc/${pid}/stat`);
  if (!stat || !Number.isFinite(uptime)) return null;
  const startTicks = parseInt(stat.split(' ')[21], 10);
  const hertz = 100; // standard CONFIG_HZ on this kernel
  const secs = uptime - (startTicks / hertz);
  return secs > 0 ? Math.floor(secs) : 0;
}

export function procCmdline(pid) {
  if (!pid) return '';
  try { return fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').replace(/\0/g, ' ').trim().slice(0, 200); } catch { return ''; }
}

// ---------- Zoth registry (toolsData.js) ----------
let registryCache = { at: 0, tools: [] };
export function zothRegistry() {
  if (Date.now() - registryCache.at < 30000 && registryCache.tools.length) return registryCache.tools;
  const tools = [];
  const raw = readSafe(TOOLS_DATA);
  if (raw) {
    // Extract tool objects with id/name/localPort/category via regex on the data file
    const blocks = raw.split(/},\s*\{/);
    for (const b of blocks) {
      const id = (b.match(/id:\s*'([^']+)'/) || [])[1];
      const name = (b.match(/name:\s*'((?:[^'\\]|\\.)*)'/) || [])[1];
      const port = (b.match(/localPort:\s*(\d+)/) || [])[1];
      const cat = (b.match(/category:\s*'([^']+)'/) || [])[1];
      const pub = /published:\s*true/.test(b);
      if (id && name && port) tools.push({ id, name: name.replace(/\\'/g, "'"), localPort: parseInt(port, 10), category: cat || 'Uncategorized', published: pub });
    }
  }
  registryCache = { at: Date.now(), tools };
  return tools;
}

// ---------- Git pulse across NullAITech ----------
export function gitPulse(limitRepos = 14) {
  const repos = [];
  try {
    const entries = fs.readdirSync(NULLAI_ROOT, { withFileTypes: true })
      .filter(e => e.isDirectory() && !e.name.startsWith('.'))
      .map(e => path.join(NULLAI_ROOT, e.name));
    let scanned = 0;
    for (const dir of entries) {
      if (scanned >= limitRepos) break;
      if (!fs.existsSync(path.join(dir, '.git'))) continue;
      scanned++;
      const log = execSafe('git', ['-C', dir, 'log', '--since=14 days ago', '--pretty=%H|%aI|%an|%s', '-n', '40'], 2500);
      if (!log || !log.trim()) continue;
      const commits = log.trim().split('\n').map(l => {
        const [hash, date, author, subject] = l.split('|');
        return { hash: hash?.slice(0, 10), date, author, subject: subject?.slice(0, 140) };
      });
      const lastCommit = commits[0]?.date || null;
      const statusOut = execSafe('git', ['-C', dir, 'status', '--porcelain'], 2000);
      const dirty = statusOut ? statusOut.split('\n').filter(Boolean).length : 0;
      const branch = (execSafe('git', ['-C', dir, 'rev-parse', '--abbrev-ref', 'HEAD'], 1500) || '').trim();
      repos.push({ repo: path.basename(dir), branch, commits14d: commits.length, dirtyFiles: dirty, lastCommit, recent: commits.slice(0, 5) });
    }
  } catch { /* root unreadable */ }
  repos.sort((a, b) => (b.lastCommit || '').localeCompare(a.lastCommit || ''));
  return repos;
}

// ---------- Full live frame ----------
export async function liveFrame() {
  const [cores, thermals] = await Promise.all([sampleCpu(), Promise.resolve(readThermals())]);
  const mem = readMemory();
  const disks = readDiskIO();
  const net = readNet();
  const listeners = readListeners();
  const loads = os.loadavg();
  return {
    ts: new Date().toISOString(),
    epoch: Date.now(),
    hostname: os.hostname(),
    platform: `${os.type()} ${os.release()} ${os.arch()}`,
    uptimeSec: Math.floor(os.uptime()),
    bootTime: new Date(Date.now() - os.uptime() * 1000).toISOString(),
    cpu: {
      model: os.cpus()[0]?.model || 'unknown',
      coreCount: os.cpus().length,
      load1: +loads[0].toFixed(2), load5: +loads[1].toFixed(2), load15: +loads[2].toFixed(2),
      loadPerCore: +(loads[0] / os.cpus().length).toFixed(3),
      coresPct: cores,
      busyPct: +((cores.reduce((a, b) => a + b, 0) / (cores.length || 1))).toFixed(1)
    },
    thermals,
    memory: mem,
    disks,
    net: net.filter(d => d.rxBytes > 0 || d.txBytes > 0),
    listening: { count: listeners.length, ports: listeners.map(l => l.port).sort((a, b) => a - b) },
    processCount: (() => { try { return fs.readdirSync('/proc').filter(d => /^\d+$/.test(d)).length; } catch { return 0; } })()
  };
}

// ---------- Compact frame for SQLite ring buffer ----------
export function compactFrame(t) {
  return {
    ts: t.ts, epoch: t.epoch,
    load1: t.cpu.load1, load5: t.cpu.load5, load15: t.cpu.load15,
    busyPct: t.cpu.busyPct, loadPerCore: t.cpu.loadPerCore,
    packageC: t.thermals.packageC, maxZoneC: t.thermals.zones.length ? Math.max(...t.thermals.zones.map(z => z.celsius)) : null,
    memUsedPct: t.memory.usedPct, swapUsedPct: t.memory.swapPct,
    memUsedKb: t.memory.usedKb, memTotalKb: t.memory.totalKb,
    listeners: t.listening.count, ports: t.listening.ports,
    processes: t.processCount, uptimeSec: t.uptimeSec,
    rxBytes: t.net.reduce((a, d) => a + d.rxBytes, 0), txBytes: t.net.reduce((a, d) => a + d.txBytes, 0)
  };
}
