import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dir, '..');

// Isolate SQLite flight-recorder DB to a temp directory before importing recorder.js
const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'aether-obs-test-'));
const UNIT_DB = path.join(TMP_DIR, 'nested', 'unit-flight.db');
const SERVER_DB = path.join(TMP_DIR, 'server-flight.db');
process.env.AETHER_DB = UNIT_DB;

const telemetry = await import('../src/telemetry.js');
const recorder = await import('../src/recorder.js');
const mcp = await import('../src/mcp_server.js');
const triage = await import('../src/ai_triage.js');

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function waitForHealth(baseUrl, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  let lastErr = null;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(1000) });
      if (res.ok) return res.json();
    } catch (err) {
      lastErr = err;
    }
    await new Promise(r => setTimeout(r, 75));
  }
  throw new Error(`Server did not become healthy at ${baseUrl}: ${lastErr?.message || 'timeout'}`);
}

after(() => {
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
});

describe('aether-observatory — telemetry, sensor parsing & redaction checks', () => {
  it('parseSensorsOutput() prioritizes CPU Package id 0 over NVMe Composite', () => {
    const sample = `
nvme-pci-3d00
Adapter: PCI adapter
Composite:    +32.9°C  (low  =  -5.2°C, high = +79.8°C)

dell_smm-isa-00de
fan1:        3176 RPM

coretemp-isa-0000
Adapter: ISA adapter
Package id 0:  +71.5°C  (high = +100.0°C, crit = +100.0°C)
Core 0:        +65.0°C
Core 1:        +68.0°C
`;
    const parsed = telemetry.parseSensorsOutput(sample, []);
    assert.equal(parsed.packageC, 71.5);
    assert.equal(parsed.fanRpm, 3176);
    assert.equal(parsed.coreTemps.length, 2);
  });

  it('parseListenersOutput() detects tcp vs tcp6 instead of LISTEN state', () => {
    const ssSample = `State  Recv-Q Send-Q Local Address:Port Peer Address:Port Process
LISTEN 0      511    127.0.0.1:8160     0.0.0.0:*         users:(("node",pid=1234,fd=20))
LISTEN 0      128    [::1]:3000         [::]:*            users:(("node",pid=5678,fd=21))`;
    const listeners = telemetry.parseListenersOutput(ssSample);
    assert.equal(listeners.length, 2);
    assert.equal(listeners[0].proto, 'tcp');
    assert.equal(listeners[0].port, 8160);
    assert.equal(listeners[1].proto, 'tcp6');
    assert.equal(listeners[1].port, 3000);
  });

  it('redactCmdline() strips tokens, passwords, and API keys', () => {
    const raw = 'node app.js --token supersecret123 --api-key sk-1234567890abcdef password=hunter2 Bearer eyJhbGciOi.test';
    const safe = telemetry.redactCmdline(raw);
    assert.ok(!safe.includes('supersecret123'));
    assert.ok(!safe.includes('sk-1234567890abcdef'));
    assert.ok(!safe.includes('hunter2'));
    assert.ok(!safe.includes('eyJhbGciOi.test'));
    assert.match(safe, /\[REDACTED\]/);
  });

  it('readMemory(), readThermalsAsync(), readListenersAsync(), liveFrame(), and compactFrame() work cleanly', async () => {
    const mem = telemetry.readMemory();
    assert.ok(mem.totalKb > 0);
    assert.ok(mem.usedPct >= 0 && mem.usedPct <= 100);

    const frame = await telemetry.liveFrame(true);
    assert.equal(typeof frame.ts, 'string');
    assert.ok(frame.cpu.coreCount >= 1);
    assert.equal(frame.cpu.coresPct.length, frame.cpu.coreCount);
    assert.ok(Array.isArray(frame.listening.ports));

    const compact = telemetry.compactFrame(frame);
    assert.equal(compact.epoch, frame.epoch);
    assert.equal(compact.busyPct, frame.cpu.busyPct);
    assert.equal(compact.packageC, frame.thermals.packageC);
    assert.equal(compact.memUsedPct, frame.memory.usedPct);
  });
});

describe('aether-observatory — flight recorder unit checks', () => {
  it('auto-creates parent directory, inserts, counts, lists, and diffs snapshots', () => {
    assert.equal(recorder.DB_PATH, UNIT_DB);
    const t1 = Date.now() - 10_000;
    const t2 = Date.now();
    const f1 = {
      ts: new Date(t1).toISOString(), epoch: t1,
      load1: 0.5, busyPct: 12.0, packageC: 45.0, memUsedPct: 40.0,
      listeners: 2, ports: [3000, 8160], processes: 120,
    };
    const f2 = {
      ts: new Date(t2).toISOString(), epoch: t2,
      load1: 1.75, busyPct: 42.5, packageC: 55.0, memUsedPct: 48.2,
      listeners: 3, ports: [3000, 8160, 9000], processes: 125,
    };

    assert.equal(recorder.insertSnapshot(f1), true);
    assert.equal(recorder.insertSnapshot(f2), true);
    assert.equal(recorder.countSnapshots(), 2);

    const list = recorder.listSnapshots(10);
    assert.equal(list.length, 2);
    assert.equal(list[0].epoch, t2);
    assert.equal(list[1].epoch, t1);

    const d = recorder.diffFrames(f1, f2);
    assert.deepEqual(d.spawnedPorts, [9000]);
    assert.deepEqual(d.terminatedPorts, []);
    assert.equal(d.thermalDeltaC, 10.0);
    assert.equal(d.thermalSpike, true);
    assert.equal(d.listenersDelta, 1);
    assert.equal(d.windowSec, 10);

    const md = recorder.formatDiffMarkdown(d, { version: '2.0.0', totalCount: 2 });
    assert.match(md, /Flight Recorder Incident Diff/);
    assert.match(md, /:9000/);
  });
});

describe('aether-observatory — MCP server & deterministic triage checks', () => {
  it('handles initialize, tools/list, and tools/call for aether_observatory_telemetry', async () => {
    const init = await mcp.handleJsonRpc({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
    assert.equal(init.result.serverInfo.name, 'aether-observatory');
    assert.equal(init.result.serverInfo.version, '2.0.0');

    const list = await mcp.handleJsonRpc({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
    const names = list.result.tools.map(t => t.name);
    assert.ok(names.includes('aether_observatory_telemetry'));
    assert.ok(names.includes('aether_constellation_nodes'));
    assert.ok(names.includes('aether_timeline_diff'));
    assert.ok(names.includes('aether_snapshot_now'));

    const call = await mcp.handleJsonRpc({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: { name: 'aether_observatory_telemetry', arguments: { action: 'status' } },
    });
    assert.equal(call.result.isError, false);
    const parsed = JSON.parse(call.result.content[0].text);
    assert.equal(parsed.action, 'status');
    assert.ok(parsed.cpu.coreCount >= 1);
  });

  it('deterministicTriage() flags high temperature and port diffs honestly', () => {
    const out = triage.deterministicTriage({
      live: { hostname: 'test', cpu: { busyPct: 91, load1: 12, coreCount: 8 }, thermals: { packageC: 84 }, memory: { usedPct: 88, swapPct: 25 } },
      nodes: [{ port: 8160, name: 'Aether', zothTool: true, latencyMs: 250 }],
      diff: { windowSec: 30, thermalSpike: true, thermalDeltaC: 11, spawnedPorts: [9999], terminatedPorts: [8080] },
    });
    assert.ok(out.anomalies.length >= 4);
    assert.match(out.summary, /84°C/);
  });
});

describe('aether-observatory — CLI checks', () => {
  it('bin/aether-observatory --help and --version exit 0 with accurate v2.0.0 output', () => {
    const help = execFileSync(path.join(ROOT, 'bin/aether-observatory'), ['--help'], { encoding: 'utf8', timeout: 5000 });
    assert.match(help, /AETHER-OBSERVATORY v2\.0\.0/);
    assert.match(help, /mcp/);
    const ver = execFileSync(path.join(ROOT, 'bin/aether-observatory'), ['--version'], { encoding: 'utf8', timeout: 5000 });
    assert.equal(ver.trim(), 'aether-observatory v2.0.0');
  });
});

describe('aether-observatory — ephemeral HTTP server security & API contract', () => {
  let child = null;
  let port = 0;
  let baseUrl = '';

  before(async () => {
    port = await getFreePort();
    baseUrl = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, [path.join(ROOT, 'src/server.js'), '--port', String(port)], {
      env: { ...process.env, AETHER_DB: SERVER_DB },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    await waitForHealth(baseUrl);
  });

  after(async () => {
    if (!child || child.exitCode !== null) return;
    await new Promise((resolve) => {
      const killTimer = setTimeout(() => { try { child.kill('SIGKILL'); } catch {} }, 2500);
      killTimer.unref();
      child.once('exit', () => { clearTimeout(killTimer); resolve(); });
      child.kill('SIGTERM');
    });
  });

  it('GET /health and /api/health both return 200 with v2.0.0 metadata', async () => {
    for (const ep of ['/health', '/api/health']) {
      const res = await fetch(`${baseUrl}${ep}`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.status, 'ok');
      assert.equal(body.version, '2.0.0');
      assert.equal(typeof body.totalSnapshots, 'number');
    }
  });

  it('enforces strict loopback CORS across /health, /api/*, /api/stream, and OPTIONS', async () => {
    const allowedOpt = await fetch(`${baseUrl}/api/snapshot/now`, {
      method: 'OPTIONS',
      headers: { Origin: 'http://127.0.0.1:3000' },
    });
    assert.equal(allowedOpt.status, 204);
    assert.equal(allowedOpt.headers.get('access-control-allow-origin'), 'http://127.0.0.1:3000');

    const evilOpt = await fetch(`${baseUrl}/api/snapshot/now`, {
      method: 'OPTIONS',
      headers: { Origin: 'https://evil.example.com' },
    });
    assert.equal(evilOpt.status, 403);

    const evilStream = await fetch(`${baseUrl}/api/stream`, {
      headers: { Origin: 'https://evil.example.com' },
    });
    assert.equal(evilStream.status, 403);
    assert.equal(evilStream.headers.get('access-control-allow-origin'), null);

    const spoofOrigin = await fetch(`${baseUrl}/api/telemetry`, {
      headers: { Origin: 'http://127.0.0.1:8160.evil.com' },
    });
    assert.equal(spoofOrigin.status, 403);
  });

  it('enforces POST-only on /api/snapshot/now and validates /api/timeline/snapshots limit', async () => {
    const getSnap = await fetch(`${baseUrl}/api/snapshot/now`);
    assert.equal(getSnap.status, 405);

    const postSnap = await fetch(`${baseUrl}/api/snapshot/now`, { method: 'POST' });
    assert.equal(postSnap.status, 200);
    const snapBody = await postSnap.json();
    assert.equal(snapBody.recorded, true);
    assert.ok(snapBody.totalCount >= 1);

    const badAbc = await fetch(`${baseUrl}/api/timeline/snapshots?limit=abc`);
    assert.equal(badAbc.status, 400);

    const badNeg = await fetch(`${baseUrl}/api/timeline/snapshots?limit=-1`);
    assert.equal(badNeg.status, 400);

    const capped = await fetch(`${baseUrl}/api/timeline/snapshots?limit=999999`);
    assert.equal(capped.status, 200);
    const capBody = await capped.json();
    assert.ok(Array.isArray(capBody.frames));
    assert.ok(capBody.totalCount >= 1);
  });

  it('handles /api/timeline/diff half-missing 404 and /api/timeline/export.{json,md} 200', async () => {
    const list = await (await fetch(`${baseUrl}/api/timeline/snapshots?limit=5`)).json();
    const ep = list.frames[0].epoch;

    const halfMiss = await fetch(`${baseUrl}/api/timeline/diff?t1=${ep}&t2=1`);
    assert.equal(halfMiss.status, 404);

    const validDiff = await fetch(`${baseUrl}/api/timeline/diff?t1=${ep}&t2=${ep}`);
    assert.equal(validDiff.status, 200);
    const diffBody = await validDiff.json();
    assert.deepEqual(diffBody.spawnedPorts, []);

    const expJson = await fetch(`${baseUrl}/api/timeline/export.json?t1=${ep}&t2=${ep}`);
    assert.equal(expJson.status, 200);
    const ej = await expJson.json();
    assert.equal(ej.service, 'aether-observatory');

    const expMd = await fetch(`${baseUrl}/api/timeline/export.md?t1=${ep}&t2=${ep}`);
    assert.equal(expMd.status, 200);
    assert.match(await expMd.text(), /Flight Recorder Incident Diff/);
  });

  it('serves /api/providers and deterministic POST /api/ai/analyze', async () => {
    const provRes = await fetch(`${baseUrl}/api/providers`);
    assert.equal(provRes.status, 200);
    const provBody = await provRes.json();
    assert.ok(Array.isArray(provBody.providers));

    const triageRes = await fetch(`${baseUrl}/api/ai/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'deterministic' }),
    });
    assert.equal(triageRes.status, 200);
    const triageBody = await triageRes.json();
    assert.equal(triageBody.mode, 'deterministic_rules');
    assert.equal(typeof triageBody.summary, 'string');
  });
});

describe('aether-observatory — zero-egress, contract & guardrail invariants', () => {
  it('public/index.html has zero CDN egress, raster og-banner.png, valid JSON-LD, and support links', () => {
    const html = fs.readFileSync(path.join(ROOT, 'public/index.html'), 'utf8');
    assert.ok(!html.includes('fonts.googleapis.com'), 'Must not load external Google Fonts CDN');
    assert.ok(!html.includes('RAILWAY-ATTRIBUTION'), 'Must not contain dead license link');
    assert.ok(html.includes('og-banner.png'), 'Must reference raster og-banner.png');
    assert.ok(fs.existsSync(path.join(ROOT, 'public/og-banner.png')), 'public/og-banner.png must exist');

    const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    const ld = JSON.parse(ldMatch[1]);
    assert.equal(ld['@context'], 'https://schema.org');
    assert.ok(Array.isArray(ld['@graph']));
    assert.ok(html.includes('https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X'));
    assert.ok(html.includes('GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK'));
  });

  it('frontend JS uses aligned API fields and zero innerHTML sinks in app.js', () => {
    const appJs = fs.readFileSync(path.join(ROOT, 'public/js/app.js'), 'utf8');
    const tmJs = fs.readFileSync(path.join(ROOT, 'public/js/timemachine.js'), 'utf8');
    const sonoJs = fs.readFileSync(path.join(ROOT, 'public/js/sonifier.js'), 'utf8');
    assert.ok(!appJs.includes('.innerHTML'), 'app.js must not use innerHTML');
    assert.ok(appJs.includes('f.busyPct') && appJs.includes('f.packageC') && appJs.includes('f.memUsedPct'));
    assert.ok(tmJs.includes('/api/timeline/diff?t1=') && tmJs.includes('f.load1') && tmJs.includes('f.packageC'));
    assert.ok(sonoJs.includes('this.filterTarget.connect(this.filter)') && sonoJs.includes('createDynamicsCompressor'));
  });
});
