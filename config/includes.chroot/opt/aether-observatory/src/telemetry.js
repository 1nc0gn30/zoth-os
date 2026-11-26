// AETHER-OBSERVATORY — Core OS Telemetry Sampler
// Reads real data from /proc, /sys, and system binaries via execFile (never shell).
// Async TTL-cached subprocesses prevent single-threaded Node event-loop starvation.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export const NULLAI_ROOT = process.env.NULLAI_ROOT || path.join(os.homedir(), 'NullAITech');
const TOOLS_DATA = path.join(NULLAI_ROOT, 'zoth-studio-v2/src/data/toolsData.js');

// ---------- helpers ----------
const readSafe = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

const execSafeSync = (bin, args = [], timeout = 2500) => {
  try {
    return execFileSync(bin, args, { encoding: 'utf8', timeout, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
};

async function execSafeAsync(bin, args = [], timeout = 2500) {
  try {
    const { stdout } = await execFileAsync(bin, args, {
      encoding: 'utf8',
      timeout,
      maxBuffer: 2 * 1024 * 1024,
      windowsHide: true,
    });
    return stdout;
  } catch {
    return null;
  }
}

// TTL cache with in-flight deduplication so concurrent requests share one probe
function makeTtlCache(ttlMs, loader) {
  let cached = null;
  let expiresAt = 0;
  let inflight = null;
  return async (force = false) => {
    const now = Date.now();
    if (!force && cached !== null && now < expiresAt) return cached;
    if (inflight) return inflight;
    inflight = (async () => {
      try {
        const val = await loader();
        cached = val;
        expiresAt = Date.now() + ttlMs;
        return val;
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  };
}

// ---------- CPU load (non-blocking 250ms sample window) ----------
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

// ---------- Thermal zones & sensors parsing ----------
function readSysfsZones() {
  const zones = [];
  const base = '/sys/class/thermal';
  try {
    for (const z of fs.readdirSync(base).filter(d => d.startsWith('thermal_zone'))) {
      const type = readSafe(path.join(base, z, 'type'))?.trim() || z;
      const raw = parseInt(readSafe(path.join(base, z, 'temp')) || '', 10);
      if (Number.isFinite(raw)) zones.push({ zone: z, label: type, celsius: +(raw / 1000).toFixed(1) });
    }
  } catch { /* no thermal sysfs */ }
  return zones;
}

// Prioritize true CPU package temperature over NVMe SSD "Composite:" sensors
export function parseSensorsOutput(s, zones = []) {
  let packageC = null;
  let fanRpm = null;
  let coreTemps = [];

  if (s) {
    // 1. Explicit CPU package labels (Intel coretemp, AMD k10temp, generic CPU)
    const cpuPkg =
      s.match(/Package id \d+:\s*\+([\d.]+)°C/) ||
      s.match(/(?:Tctl|Tdie):\s*\+([\d.]+)°C/) ||
      s.match(/CPU(?:\s+Temp(?:erature)?)?:\s*\+([\d.]+)°C/);
    if (cpuPkg) packageC = parseFloat(cpuPkg[1]);

    const fan = s.match(/fan\d+:\s*(\d+)\s*RPM/i);
    if (fan) fanRpm = parseInt(fan[1], 10);

    coreTemps = [...s.matchAll(/Core (\d+):\s*\+([\d.]+)°C/g)].map(m => ({
      core: `core-${m[1]}`,
      celsius: parseFloat(m[2]),
    }));

    // If CPU package line absent but per-core temps exist, use max core temp
    if (packageC === null && coreTemps.length) {
      packageC = Math.max(...coreTemps.map(c => c.celsius));
    }
  }

  // Fallback to sysfs x86_pkg_temp or highest thermal zone (never NVMe Composite ahead of CPU)
  if (packageC === null && zones.length) {
    const pkgZone = zones.find(z => /x86_pkg_temp|cpu|pkg/i.test(z.label));
    packageC = pkgZone ? pkgZone.celsius : Math.max(...zones.map(z => z.celsius));
  }

  return { zones, packageC, fanRpm, coreTemps };
}

export function readThermals() {
  const zones = readSysfsZones();
  const s = execSafeSync('sensors', [], 2000);
  return parseSensorsOutput(s, zones);
}

export const readThermalsAsync = makeTtlCache(3000, async () => {
  const zones = readSysfsZones();
  const s = await execSafeAsync('sensors', [], 2500);
  return parseSensorsOutput(s, zones);
});

// ---------- Memory ----------
export function readMemory() {
  const raw = readSafe('/proc/meminfo');
  const m = {};
  if (raw) {
    for (const line of raw.split('\n')) {
      const mm = line.match(/^(\w+):\s+(\d+)\s+kB/);
      if (mm) m[mm[1]] = parseInt(mm[2], 10);
    }
  }
  const total = m.MemTotal || 0;
  const free = m.MemFree || 0;
  const avail = m.MemAvailable || 0;
  const buffers = m.Buffers || 0;
  const cached = (m.Cached || 0) + (m.SReclaimable || 0);
  const used = Math.max(0, total - free - buffers - cached);
  const swapTotal = m.SwapTotal || 0;
  const swapFree = m.SwapFree || 0;
  const swapUsed = Math.max(0, swapTotal - swapFree);
  return {
    totalKb: total,
    usedKb: used,
    freeKb: free,
    availableKb: avail,
    buffersKb: buffers,
    cachedKb: cached,
    swapTotalKb: swapTotal,
    swapUsedKb: swapUsed,
    usedPct: total ? +(100 * used / total).toFixed(1) : 0,
    swapPct: swapTotal ? +(100 * swapUsed / swapTotal).toFixed(1) : 0,
  };
}

// ---------- Disk I/O ----------
export function readDiskIO() {
  const raw = readSafe('/proc/diskstats');
  const devs = [];
  if (raw) {
    for (const line of raw.split('\n')) {
      const p = line.trim().split(/\s+/);
      if (p.length < 14) continue;
      const name = p[2];
      if (/^(nvme\d+n\d+|\bsd[a-z]+\b|\bvd[a-z]+\b|mmcblk\d+)$/.test(name)) {
        devs.push({
          device: name,
          readsCompleted: parseInt(p[3], 10),
          sectorsRead: parseInt(p[5], 10),
          writesCompleted: parseInt(p[7], 10),
          sectorsWritten: parseInt(p[9], 10),
          ioInFlight: parseInt(p[11], 10),
        });
      }
    }
  }
  return devs;
}

// ---------- Network ----------
export function readNet() {
  const raw = readSafe('/proc/net/dev');
  const devs = [];
  if (raw) {
    for (const line of raw.split('\n').slice(2)) {
      const p = line.split(':');
      if (p.length < 2) continue;
      const f = p[1].trim().split(/\s+/);
      devs.push({
        iface: p[0].trim(),
        rxBytes: parseInt(f[0], 10),
        txBytes: parseInt(f[8], 10),
        rxPackets: parseInt(f[1], 10),
        txPackets: parseInt(f[9], 10),
      });
    }
  }
  return devs;
}

// ---------- Listening sockets (real `ss -tlnp`) ----------
export function parseListenersOutput(out) {
  const listeners = [];
  if (!out) return listeners;
  for (const line of out.split('\n').slice(1)) {
    const p = line.trim().split(/\s+/);
    if (p.length < 5) continue;
    const la = p[3];
    const portMatch = la.match(/:(\d+)$/);
    if (!portMatch) continue;
    const localAddr = la.split(':').slice(0, -1).join(':') || la;
    const isV6 = localAddr.includes('[') || localAddr.includes('::') || localAddr === '*';
    const proc = line.match(/users:\(\("([^"]+)",pid=(\d+)/);
    listeners.push({
      proto: isV6 ? 'tcp6' : 'tcp',
      state: p[0],
      localAddr,
      port: parseInt(portMatch[1], 10),
      processName: proc ? proc[1] : null,
      pid: proc ? parseInt(proc[2], 10) : null,
    });
  }
  return listeners;
}

export function readListeners() {
  return parseListenersOutput(execSafeSync('ss', ['-tlnp'], 2500));
}

export const readListenersAsync = makeTtlCache(3000, async () => {
  const out = await execSafeAsync('ss', ['-tlnp'], 2500);
  return parseListenersOutput(out);
});

// proc uptime for a pid
export function procUptime(pid) {
  if (!pid) return null;
  const uptime = parseFloat(readSafe('/proc/uptime')?.split(' ')[0] || 'NaN');
  const stat = readSafe(`/proc/${pid}/stat`);
  if (!stat || !Number.isFinite(uptime)) return null;
  // Comm field can contain spaces inside parentheses; parse fields after last ')'
  const closeIdx = stat.lastIndexOf(')');
  const rest = closeIdx > -1 ? stat.slice(closeIdx + 2).split(' ') : stat.split(' ').slice(2);
  const startTicks = parseInt(rest[19], 10);
  if (!Number.isFinite(startTicks)) return null;
  const hertz = 100;
  const secs = uptime - (startTicks / hertz);
  return secs > 0 ? Math.floor(secs) : 0;
}

// Redact secrets/tokens/passwords from process cmdlines before API/UI exposure
export function redactCmdline(raw) {
  if (!raw) return '';
  let out = String(raw);
  // Flag followed by space and secret value: --token abc, --api-key xyz, --password secret
  out = out.replace(
    /(--?(?:token|api[-_]?key|password|passwd|secret|auth[-_]?token|access[-_]?key|private[-_]?key|bearer))\s+([^\s'"]+)/gi,
    '$1 [REDACTED]'
  );
  // Key=value forms: password=foo, API_KEY=bar, token=baz
  out = out.replace(
    /\b([A-Za-z0-9_.-]*(?:token|api[-_]?key|password|passwd|secret|auth|key)[A-Za-z0-9_.-]*)=([^\s'"]+)/gi,
    '$1=[REDACTED]'
  );
  // Authorization Bearer tokens
  out = out.replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]');
  // Common provider token prefixes (sk-*, ghp_*, gho_*, xoxb-*, AIza*)
  out = out.replace(/\b(?:sk-[A-Za-z0-9_-]{12,}|gh[po]_[A-Za-z0-9]{16,}|xox[baprs]-[A-Za-z0-9-]{12,}|AIza[0-9A-Za-z_-]{20,})\b/g, '[REDACTED]');
  return out.trim().slice(0, 200);
}

export function procCmdline(pid) {
  if (!pid) return '';
  try {
    const raw = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').replace(/\0/g, ' ');
    return redactCmdline(raw);
  } catch {
    return '';
  }
}

// ---------- Zoth registry (toolsData.js) ----------
let registryCache = { at: 0, tools: [] };
export function zothRegistry() {
  if (Date.now() - registryCache.at < 30000 && registryCache.tools.length) return registryCache.tools;
  const tools = [];
  const raw = readSafe(TOOLS_DATA);
  if (raw) {
    const blocks = raw.split(/},\s*\{/);
    for (const b of blocks) {
      const id = (b.match(/id:\s*'([^']+)'/) || [])[1];
      const name = (b.match(/name:\s*'((?:[^'\\]|\\.)*)'/) || [])[1];
      const port = (b.match(/localPort:\s*(\d+)/) || [])[1];
      const cat = (b.match(/category:\s*'([^']+)'/) || [])[1];
      const pub = /published:\s*true/.test(b);
      if (id && name && port) {
        tools.push({
          id,
          name: name.replace(/\\'/g, "'"),
          localPort: parseInt(port, 10),
          category: cat || 'Uncategorized',
          published: pub,
        });
      }
    }
  }
  registryCache = { at: Date.now(), tools };
  return tools;
}

// ---------- Git pulse across NullAITech (async, bounded concurrency, sorted by latest commit) ----------
async function scanGitRepo(dir) {
  const log = await execSafeAsync(
    'git',
    ['-C', dir, 'log', '--since=14 days ago', '--pretty=%H|%aI|%an|%s', '-n', '40'],
    2000
  );
  if (!log || !log.trim()) return null;
  const commits = log.trim().split('\n').map(l => {
    const parts = l.split('|');
    const hash = parts[0];
    const date = parts[1];
    const author = parts[2];
    const subject = parts.slice(3).join('|');
    return { hash: hash?.slice(0, 10), date, author, subject: (subject || '').slice(0, 140) };
  });
  const [statusOut, branchOut] = await Promise.all([
    execSafeAsync('git', ['-C', dir, 'status', '--porcelain'], 1800),
    execSafeAsync('git', ['-C', dir, 'rev-parse', '--abbrev-ref', 'HEAD'], 1500),
  ]);
  const dirty = statusOut ? statusOut.split('\n').filter(Boolean).length : 0;
  const branch = (branchOut || '').trim();
  return {
    repo: path.basename(dir),
    branch,
    commits14d: commits.length,
    dirtyFiles: dirty,
    lastCommit: commits[0]?.date || null,
    lastSubject: commits[0]?.subject || '',
    recent: commits.slice(0, 5),
  };
}

const gitPulseCached = makeTtlCache(60000, async () => {
  const repos = [];
  let candidates = [];
  try {
    candidates = fs.readdirSync(NULLAI_ROOT, { withFileTypes: true })
      .filter(e => e.isDirectory() && !e.name.startsWith('.'))
      .map(e => path.join(NULLAI_ROOT, e.name))
      .filter(d => fs.existsSync(path.join(d, '.git')))
      .map(dir => {
        let mtime = 0;
        for (const p of [path.join(dir, '.git', 'logs', 'HEAD'), path.join(dir, '.git', 'HEAD'), path.join(dir, '.git')]) {
          try { mtime = Math.max(mtime, fs.statSync(p).mtimeMs); break; } catch {}
        }
        return { dir, mtime };
      })
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 18)
      .map(x => x.dir);
  } catch {
    return [];
  }

  // Bounded concurrency worker pool (4 concurrent git subprocesses max on top 18 active repos)
  const CONCURRENCY = 4;
  let idx = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, candidates.length) }, async () => {
    while (idx < candidates.length) {
      const dir = candidates[idx++];
      const info = await scanGitRepo(dir);
      if (info) repos.push(info);
    }
  });
  await Promise.all(workers);
  repos.sort((a, b) => (b.lastCommit || '').localeCompare(a.lastCommit || ''));
  return repos;
});

export async function gitPulseAsync(limitRepos = 14) {
  const all = await gitPulseCached();
  return all.slice(0, Math.max(1, limitRepos));
}

// Kept for backwards compatibility if any sync caller invokes gitPulse()
export function gitPulse(limitRepos = 14) {
  const repos = [];
  try {
    const entries = fs.readdirSync(NULLAI_ROOT, { withFileTypes: true })
      .filter(e => e.isDirectory() && !e.name.startsWith('.'))
      .map(e => path.join(NULLAI_ROOT, e.name))
      .filter(d => fs.existsSync(path.join(d, '.git')));
    for (const dir of entries) {
      const log = execSafeSync('git', ['-C', dir, 'log', '--since=14 days ago', '--pretty=%H|%aI|%an|%s', '-n', '10'], 1500);
      if (!log || !log.trim()) continue;
      const commits = log.trim().split('\n').map(l => {
        const parts = l.split('|');
        return { hash: parts[0]?.slice(0, 10), date: parts[1], author: parts[2], subject: parts.slice(3).join('|').slice(0, 140) };
      });
      const statusOut = execSafeSync('git', ['-C', dir, 'status', '--porcelain'], 1200);
      const dirty = statusOut ? statusOut.split('\n').filter(Boolean).length : 0;
      const branch = (execSafeSync('git', ['-C', dir, 'rev-parse', '--abbrev-ref', 'HEAD'], 1000) || '').trim();
      repos.push({
        repo: path.basename(dir),
        branch,
        commits14d: commits.length,
        dirtyFiles: dirty,
        lastCommit: commits[0]?.date || null,
        lastSubject: commits[0]?.subject || '',
        recent: commits.slice(0, 5),
      });
    }
  } catch { /* root unreadable */ }
  repos.sort((a, b) => (b.lastCommit || '').localeCompare(a.lastCommit || ''));
  return repos.slice(0, limitRepos);
}

// ---------- Full live frame (100% async, non-blocking) ----------
const liveFrameCached = makeTtlCache(1200, async () => {
  const [cores, thermals, listeners] = await Promise.all([
    sampleCpu(),
    readThermalsAsync(),
    readListenersAsync(),
  ]);
  const mem = readMemory();
  const disks = readDiskIO();
  const net = readNet();
  const loads = os.loadavg();
  const coreCount = os.cpus().length || 1;
  return {
    ts: new Date().toISOString(),
    epoch: Date.now(),
    hostname: os.hostname(),
    platform: `${os.type()} ${os.release()} ${os.arch()}`,
    uptimeSec: Math.floor(os.uptime()),
    bootTime: new Date(Date.now() - os.uptime() * 1000).toISOString(),
    cpu: {
      model: os.cpus()[0]?.model || 'unknown',
      coreCount,
      load1: +loads[0].toFixed(2),
      load5: +loads[1].toFixed(2),
      load15: +loads[2].toFixed(2),
      loadPerCore: +(loads[0] / coreCount).toFixed(3),
      coresPct: cores,
      busyPct: +((cores.reduce((a, b) => a + b, 0) / (cores.length || 1))).toFixed(1),
    },
    thermals,
    memory: mem,
    disks,
    net: net.filter(d => d.rxBytes > 0 || d.txBytes > 0),
    listening: { count: listeners.length, ports: listeners.map(l => l.port).sort((a, b) => a - b) },
    processCount: (() => { try { return fs.readdirSync('/proc').filter(d => /^\d+$/.test(d)).length; } catch { return 0; } })(),
  };
});

export async function liveFrame(force = false) {
  return liveFrameCached(force);
}

// ---------- Compact frame for SQLite ring buffer ----------
export function compactFrame(t) {
  return {
    ts: t.ts,
    epoch: t.epoch,
    load1: t.cpu.load1,
    load5: t.cpu.load5,
    load15: t.cpu.load15,
    busyPct: t.cpu.busyPct,
    loadPerCore: t.cpu.loadPerCore,
    packageC: t.thermals.packageC,
    maxZoneC: t.thermals.zones.length ? Math.max(...t.thermals.zones.map(z => z.celsius)) : null,
    memUsedPct: t.memory.usedPct,
    swapUsedPct: t.memory.swapPct,
    memUsedKb: t.memory.usedKb,
    memTotalKb: t.memory.totalKb,
    listeners: t.listening.count,
    ports: t.listening.ports,
    processes: t.processCount,
    uptimeSec: t.uptimeSec,
    rxBytes: t.net.reduce((a, d) => a + d.rxBytes, 0),
    txBytes: t.net.reduce((a, d) => a + d.txBytes, 0),
  };
}
