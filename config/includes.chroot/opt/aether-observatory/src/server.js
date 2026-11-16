// AETHER-OBSERVATORY — HTTP daemon on 127.0.0.1 (default 8160).
// Zero-dependency: node:http + node:sqlite. Serves API + static frontend.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { liveFrame, compactFrame, readListeners, zothRegistry, procUptime, procCmdline, gitPulse } from './telemetry.js';
import { insertSnapshot, rangeSnapshots, listSnapshots, getSnapshot, diffFrames, DB_PATH } from './recorder.js';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dir, '..');
const PUBLIC = path.join(ROOT, 'public');

const argPort = (() => {
  const i = process.argv.indexOf('--port');
  if (i > -1 && process.argv[i + 1]) return parseInt(process.argv[i + 1], 10);
  return parseInt(process.env.AETHER_PORT || '8160', 10);
})();
const PORT = argPort, HOST = '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.ico': 'image/x-icon'
};

// Loopback-only CORS: this surface exposes process/socket telemetry, so a
// blanket "*" would let ANY website the user visits read their machine's
// internals. Only same-machine origins (and the public studio host) are echoed.
const ORIGIN_OK = /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/;
const STATIC_ORIGINS = new Set(['https://zoth.nullai.tech', 'https://www.zoth.nullai.tech']);

function corsHeaders(origin) {
  if (!origin) return {};
  if (!(ORIGIN_OK.test(origin) || STATIC_ORIGINS.has(origin))) return {};
  return { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' };
}

const json = (res, code, obj) => {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...corsHeaders(res.zothOrigin),
  });
  res.end(body);
};

// Latency probe for a local port
function probePort(port, timeoutMs = 400) {
  return new Promise(resolve => {
    const t0 = process.hrtime.bigint();
    const req = http.request({ host: '127.0.0.1', port, path: '/', timeout: timeoutMs }, res => {
      res.resume();
      resolve(+(Number(process.hrtime.bigint() - t0) / 1e6).toFixed(1));
    });
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.on('error', () => resolve(null));
    req.end();
  });
}

async function constellationNodes() {
  const listeners = readListeners();
  const registry = zothRegistry();
  const byPort = new Map(registry.map(t => [t.localPort, t]));
  const nodes = await Promise.all(listeners.slice(0, 64).map(async l => {
    const reg = byPort.get(l.port);
    const latencyMs = await probePort(l.port);
    return {
      port: l.port, proto: l.proto, addr: l.localAddr,
      pid: l.pid, processName: l.processName,
      name: reg ? reg.name : (l.processName ? `${l.processName} (system)` : `daemon :${l.port}`),
      category: reg ? reg.category : 'System',
      zothTool: !!reg, published: reg?.published || false,
      uptimeSec: procUptime(l.pid), cmdline: procCmdline(l.pid),
      latencyMs
    };
  }));
  nodes.sort((a, b) => (b.zothTool - a.zothTool) || a.port - b.port);
  return nodes;
}

// SSE client registry for live telemetry push
const sseClients = new Set();
function broadcast(frame) {
  const payload = `data: ${JSON.stringify(frame)}\n\n`;
  for (const res of sseClients) { try { res.write(payload); } catch { sseClients.delete(res); } }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const p = url.pathname;
  res.zothOrigin = req.headers.origin; // consumed by corsHeaders() in json()

  try {
    // ---------- API ----------
    if (p === '/health') {
      const cfPath = DB_PATH;
      let dbOk = false; try { fs.accessSync(cfPath); dbOk = true; } catch { dbOk = false; }
      return json(res, 200, {
        status: 'ok', service: 'aether-observatory', version: '1.0.0',
        port: PORT, bind: HOST, db: dbOk ? cfPath : null,
        ts: new Date().toISOString(), uptimeSec: Math.floor(process.uptime())
      });
    }
    if (p === '/api/telemetry' || p === '/api/telemetry/live') return json(res, 200, await liveFrame());
    if (p === '/api/constellation/nodes') return json(res, 200, { ts: new Date().toISOString(), nodes: await constellationNodes() });
    if (p === '/api/git/pulse') return json(res, 200, { ts: new Date().toISOString(), repos: gitPulse(14) });
    if (p === '/api/timeline/snapshots') {
      const limit = parseInt(url.searchParams.get('limit') || '500', 10);
      return json(res, 200, { frames: listSnapshots(limit) });
    }
    if (p === '/api/timeline/diff') {
      const t1 = parseInt(url.searchParams.get('t1') || '', 10);
      const t2 = parseInt(url.searchParams.get('t2') || '', 10);
      if (!t1 || !t2) return json(res, 400, { error: 't1 and t2 epoch-ms params required' });
      const a = getSnapshot(t1), b = getSnapshot(t2);
      if (!a && !b) return json(res, 404, { error: 'no snapshots recorded near requested times' });
      return json(res, 200, diffFrames(a, b));
    }
    if (p === '/api/snapshot/now') {
      const t = await liveFrame();
      insertSnapshot(compactFrame(t));
      return json(res, 200, { recorded: true, ts: t.ts });
    }
    if (p === '/api/stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache',
        'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*'
      });
      res.write(': aether-stream\n\n');
      sseClients.add(res);
      req.on('close', () => sseClients.delete(res));
      return;
    }

    // ---------- Static ----------
    let fp = p === '/' ? '/index.html' : p;
    // prevent traversal
    const abs = path.normalize(path.join(PUBLIC, fp));
    if (!abs.startsWith(PUBLIC)) { res.writeHead(403); return res.end('forbidden'); }
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
      const ext = path.extname(abs);
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
      });
      return fs.createReadStream(abs).pipe(res);
    }
    res.writeHead(404); res.end('not found');
  } catch (err) {
    json(res, 500, { error: String(err?.message || err) });
  }
});

// ---------- Flight recorder loop: real snapshot every 10s ----------
let recorderTimer = null;
async function startRecorder() {
  const tick = async () => {
    try {
      const t = await liveFrame();
      insertSnapshot(compactFrame(t));
      broadcast(compactFrame(t));
    } catch { /* keep daemon alive */ }
  };
  await tick();
  recorderTimer = setInterval(tick, 10000);
  recorderTimer.unref();
}

export async function startServer() {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, HOST, () => resolve());
  });
  await startRecorder();
  console.log(`[aether] listening on http://${HOST}:${PORT} — recorder live (10s cadence), db=${DB_PATH}`);
  return { port: PORT, host: HOST };
}

// Run when invoked directly OR via `serve` flag from the CLI
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer().catch(err => {
    console.error(`[aether] failed to start: ${err.message}`);
    process.exit(1);
  });
}

// graceful shutdown
process.on('SIGINT', () => { clearInterval(recorderTimer); server.close(() => process.exit(0)); });
process.on('SIGTERM', () => { clearInterval(recorderTimer); server.close(() => process.exit(0)); });
