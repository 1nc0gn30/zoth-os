#!/usr/bin/env node
// aether-observatory CLI — Neal Frazier Tech / NullAI Platform
// usage: aether-observatory [--help] [status --json] [constellation] [snapshot] [serve --port 8160]

import process from 'node:process';

function usage() {
  console.log(`
  ╔═══════════════════════════════════════════════════════════════╗
  ║  🛰  AETHER-OBSERVATORY — Sovereign Telemetry Workstation CLI   ║
  ╚═══════════════════════════════════════════════════════════════╝

  Usage:
    aether-observatory --help                  show this help
    aether-observatory status [--json]         machine snapshot + daemon health
    aether-observatory constellation           live port/process star map
    aether-observatory snapshot                record a telemetry frame now
    aether-observatory serve [--port 8160]     run the workstation daemon

  Workstation UI: http://127.0.0.1:8160
`);
}

function fmtUptime(s) {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

async function fetchJson(port, path) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, { signal: AbortSignal.timeout(2500) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function cmdStatus(flags) {
  try {
    const [health, live, snap] = await Promise.all([
      fetchJson(flags.port, '/health'),
      fetchJson(flags.port, '/api/telemetry/live'),
      fetchJson(flags.port, '/api/timeline/snapshots?limit=1')
    ]);
    if (flags.json) return console.log(JSON.stringify({ health, telemetry: live, recorder: { count: snap.count ?? (snap.frames ? snap.frames.length : 0) } }, null, 2));
    const t = live;
    console.log(`
  🛰  AETHER-OBSERVATORY — system status (${new Date(t.ts).toLocaleTimeString()})
  ────────────────────────────────────────────────────────────
  Daemon        : ${health.status} @ http://127.0.0.1:${flags.port} (db: ${health.db || 'n/a'})
  Frames stored : ${snap.count ?? (snap.frames ? snap.frames.length : 0)}
  Host          : ${t.hostname} — ${t.platform}
  Uptime        : ${fmtUptime(t.uptimeSec)}
  CPU           : ${t.cpu.model}
  Cores         : ${t.cpu.coreCount} threads — busy ${t.cpu.busyPct}% — load ${t.cpu.load1}/${t.cpu.load5}/${t.cpu.load15}
  Thermal       : ${t.thermals.packageC != null ? t.thermals.packageC + '°C package' : 'n/a'}${t.thermals.fanRpm ? `, fan ${t.thermals.fanRpm} RPM` : ''}
  Memory        : ${(t.memory.usedKb / 1048576).toFixed(1)} / ${(t.memory.totalKb / 1048576).toFixed(1)} GiB (${t.memory.usedPct}%) — swap ${t.memory.swapUsedKb ? (t.memory.swapUsedKb / 1048576).toFixed(1) + ' GiB' : '0'}
  Listeners     : ${t.listening.count} open TCP ports
  Processes     : ${t.processCount}
`);
  } catch (e) {
    console.error(`  ✗ daemon offline on :${flags.port} (${e.message}) — start with: aether-observatory serve --port ${flags.port}`);
    process.exitCode = 2;
  }
}

async function cmdConstellation(flags) {
  try {
    const data = await fetchJson(flags.port, '/api/constellation/nodes');
    const nodes = data.nodes;
    if (!nodes.length) return console.log('  ✓ no listening TCP sockets detected');
    const rows = nodes.map(n => ({
      port: n.port, name: (n.name || '').slice(0, 38), pid: n.pid ?? '—',
      uptime: n.uptimeSec != null ? fmtUptime(n.uptimeSec) : '—',
      latency: n.latencyMs != null ? n.latencyMs + 'ms' : 'n/a', type: n.zothTool ? 'ZOTH' : 'sys'
    }));
    const w = [5, 38, 6, 10, 9, 4];
    const head = ['PORT', 'NAME', 'PID', 'UPTIME', 'LATENCY', 'TYPE'].map((c, i) => c.padEnd(w[i])).join('  ');
    console.log(`\n  🛰  CONSTELLATION — ${nodes.length} active daemons (${new Date(data.ts).toLocaleTimeString()})\n  ${'─'.repeat(head.length)}\n  ${head}\n  ${'─'.repeat(head.length)}`);
    for (const r of rows) console.log(`  ${String(r.port).padEnd(w[0])}  ${r.name.padEnd(w[1])}  ${String(r.pid).padEnd(w[2])}  ${r.uptime.padEnd(w[3])}  ${r.latency.padEnd(w[4])}  ${r.type}`);
    console.log('');
  } catch (e) {
    console.error(`  ✗ constellation unavailable: ${e.message}`);
    process.exitCode = 2;
  }
}

async function cmdSnapshot(flags) {
  try {
    const r = await fetchJson(flags.port, '/api/snapshot/now');
    console.log(`  ✓ telemetry frame recorded at ${r.ts}`);
  } catch (e) {
    console.error(`  ✗ screenshot failed: ${e.message}`);
    process.exitCode = 2;
  }
}

async function cmdServe(flags) {
  const mod = await import('../src/server.js');
  await mod.startServer();
  process.stdin.resume();
}

export async function main(argv = process.argv.slice(2)) {
  const cmd = argv.find(a => !a.startsWith('-'));
  const flags = {
    json: argv.includes('--json'),
    status: argv.includes('--status'),
    port: (() => { const i = argv.indexOf('--port'); return i > -1 ? parseInt(argv[i + 1], 10) || 8160 : 8160; })()
  };
  if (argv.includes('--help') || cmd === 'help') return usage();
  if (flags.status || (flags.json && !cmd) || (!cmd && argv.length === 0)) return cmdStatus(flags);
  if (!cmd) return usage();
  switch (cmd) {
    case 'status': return cmdStatus(flags);
    case 'constellation': return cmdConstellation(flags);
    case 'snapshot': return cmdSnapshot(flags);
    case 'serve': return cmdServe(flags);
    default:
      console.error(`  ? unknown command '${cmd}'`);
      usage();
      process.exitCode = 64;
  }
}

// run when invoked directly
await main();
