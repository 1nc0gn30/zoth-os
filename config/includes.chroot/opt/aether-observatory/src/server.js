// AETHER-OBSERVATORY — HTTP daemon on 127.0.0.1 (default 8160).
// Zero-dependency: node:http + node:sqlite. Serves API + SSE + static frontend.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  liveFrame,
  compactFrame,
  readListenersAsync,
  zothRegistry,
  procUptime,
  procCmdline,
  gitPulseAsync,
} from './telemetry.js';
import {
  insertSnapshot,
  listSnapshots,
  countSnapshots,
  getSnapshot,
  diffFrames,
  formatDiffMarkdown,
  DB_PATH,
} from './recorder.js';
import { detectProviders, analyzeTelemetry } from './ai_triage.js';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dir, '..');
const PUBLIC = path.resolve(ROOT, 'public');
export const VERSION = '2.0.0';

const argPort = (() => {
  const i = process.argv.indexOf('--port');
  if (i > -1 && process.argv[i + 1]) return parseInt(process.argv[i + 1], 10);
  return parseInt(process.env.AETHER_PORT || '8160', 10);
})();
const PORT = argPort;
const HOST = '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.ico': 'image/x-icon',
};

// Strict loopback-only CORS (+ canonical Studio host) — zero wildcards anywhere.
const ORIGIN_OK = /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/;
const STATIC_ORIGINS = new Set(['https://zoth.nullai.tech', 'https://www.zoth.nullai.tech']);

export function isOriginAllowed(origin) {
  if (!origin) return true; // same-origin / non-browser curl/CLI requests
  if (STATIC_ORIGINS.has(origin)) return true;
  if (!ORIGIN_OK.test(origin)) return false;
  try {
    const u = new URL(origin);
    return u.hostname === '127.0.0.1' || u.hostname === 'localhost' || u.hostname === '[::1]';
  } catch {
    return false;
  }
}

function corsHeaders(origin) {
  if (!origin || !isOriginAllowed(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Vary': 'Origin',
  };
}

function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': `frame-ancestors 'self' http://127.0.0.1:3000 http://localhost:3000 http://127.0.0.1:${PORT} http://localhost:${PORT}`,
  };
}

const json = (res, code, obj, extraHeaders = {}) => {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...securityHeaders(),
    ...corsHeaders(res.zothOrigin),
    ...extraHeaders,
  });
  res.end(body);
};

function readJsonBody(req, maxBytes = 65536) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];
    req.on('data', chunk => {
      total += chunk.length;
      if (total > maxBytes) {
        req.destroy();
        reject(new Error('request body too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

// Fast local port probe (bounded timeout, skip self-port to avoid loopback recursion)
function probePort(port, timeoutMs = 140) {
  if (port === PORT) return Promise.resolve(0.2);
  return new Promise(resolve => {
    const t0 = process.hrtime.bigint();
    const req = http.request({ host: '127.0.0.1', port, path: '/health', timeout: timeoutMs }, res => {
      res.resume();
      resolve(+(Number(process.hrtime.bigint() - t0) / 1e6).toFixed(1));
    });
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.on('error', () => resolve(null));
    req.end();
  });
}

// Stale-while-revalidate constellation cache (returns immediately if warm; bounded concurrency probes)
let nodesCache = { expiresAt: 0, value: null, inflight: null };
async function refreshConstellationNodes(force = false) {
  if (nodesCache.inflight) return nodesCache.inflight;
  nodesCache.inflight = (async () => {
    try {
      const listeners = await readListenersAsync(force);
      const registry = zothRegistry();
      const byPort = new Map(registry.map(t => [t.localPort, t]));
      const slice = listeners.slice(0, 64);
      const nodes = new Array(slice.length);
      let idx = 0;
      const workers = Array.from({ length: Math.min(8, slice.length) }, async () => {
        while (idx < slice.length) {
          const i = idx++;
          const l = slice[i];
          const reg = byPort.get(l.port);
          // Probe Zoth tool HTTP daemons + well-known local ports (<10000); skip ephemeral non-HTTP ports
          const latencyMs = (reg || l.port < 10000) ? await probePort(l.port) : null;
          nodes[i] = {
            port: l.port,
            proto: l.proto,
            addr: l.localAddr,
            pid: l.pid,
            processName: l.processName,
            name: reg ? reg.name : (l.processName ? `${l.processName} (system)` : `daemon :${l.port}`),
            category: reg ? reg.category : 'System',
            zothTool: !!reg,
            zothToolId: reg?.id || null,
            published: reg?.published || false,
            uptimeSec: procUptime(l.pid),
            cmdline: procCmdline(l.pid),
            latencyMs,
          };
        }
      });
      await Promise.all(workers);
      nodes.sort((a, b) => (Number(b.zothTool) - Number(a.zothTool)) || a.port - b.port);
      if (nodes.length > 0 || !nodesCache.value) nodesCache.value = nodes;
      nodesCache.expiresAt = Date.now() + 5000;
      return nodesCache.value || [];
    } finally {
      nodesCache.inflight = null;
    }
  })();
  return nodesCache.inflight;
}

export async function constellationNodes(force = false) {
  const now = Date.now();
  if (!force && nodesCache.value) {
    if (now >= nodesCache.expiresAt) refreshConstellationNodes(false).catch(() => {});
    return nodesCache.value;
  }
  return refreshConstellationNodes(force);
}

// Stale-while-revalidate live frame cache for instant (<5ms) HTTP responses
let lastLiveFrame = null;
let liveFrameExpiresAt = 0;
let liveFrameInflight = null;
async function getFastLiveFrame(force = false) {
  const now = Date.now();
  if (!force && lastLiveFrame) {
    if (now >= liveFrameExpiresAt && !liveFrameInflight) {
      liveFrameInflight = liveFrame(true).then(f => {
        lastLiveFrame = f;
        liveFrameExpiresAt = Date.now() + 2000;
        return f;
      }).finally(() => { liveFrameInflight = null; });
    }
    return lastLiveFrame;
  }
  if (!force && liveFrameInflight) return liveFrameInflight;
  liveFrameInflight = liveFrame(force).then(f => {
    lastLiveFrame = f;
    liveFrameExpiresAt = Date.now() + 2000;
    return f;
  }).finally(() => { liveFrameInflight = null; });
  return liveFrameInflight;
}

// SSE client registry for live telemetry push
const sseClients = new Set();
let lastCompactFrame = null;
function broadcast(frame) {
  lastCompactFrame = frame;
  const payload = `data: ${JSON.stringify(frame)}\n\n`;
  for (const res of sseClients) {
    try { res.write(payload); } catch { sseClients.delete(res); }
  }
}

function parseDiffRange(url) {
  const t1Raw = url.searchParams.get('t1');
  const t2Raw = url.searchParams.get('t2');
  if (t1Raw != null || t2Raw != null) {
    const t1 = Number(t1Raw);
    const t2 = Number(t2Raw);
    if (!Number.isFinite(t1) || !Number.isFinite(t2) || t1 <= 0 || t2 <= 0) {
      return { errorCode: 400, error: 't1 and t2 positive epoch-ms params required' };
    }
    const a = getSnapshot(Math.trunc(t1));
    const b = getSnapshot(Math.trunc(t2));
    if (!a || !b) {
      return { errorCode: 404, error: 'no snapshots recorded near one or both requested times' };
    }
    return { diff: diffFrames(a, b) };
  }
  // Default range for export endpoints when t1/t2 omitted: oldest of recent 60 → newest
  const recent = listSnapshots(60);
  if (recent.length < 2) {
    return { errorCode: 404, error: 'at least two snapshots required for diff export' };
  }
  const oldest = getSnapshot(recent[recent.length - 1].epoch);
  const newest = getSnapshot(recent[0].epoch);
  if (!oldest || !newest) return { errorCode: 404, error: 'snapshots unavailable' };
  return { diff: diffFrames(oldest, newest) };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const p = url.pathname;
  const method = (req.method || 'GET').toUpperCase();
  const origin = req.headers.origin;
  res.zothOrigin = origin;

  // Reject disallowed cross-origin requests across ALL API/SSE/OPTIONS endpoints
  const isApiPath = p === '/health' || p.startsWith('/api/');
  if (origin && !isOriginAllowed(origin) && (isApiPath || method === 'OPTIONS')) {
    return json(res, 403, { error: 'origin not allowed' });
  }

  // Explicit CORS preflight (never executes route logic or mutates state)
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      ...securityHeaders(),
      ...corsHeaders(origin),
    });
    return res.end();
  }

  try {
    // ---------- API ----------
    if (p === '/health' || p === '/api/health') {
      if (method !== 'GET' && method !== 'HEAD') return json(res, 405, { error: 'method not allowed' }, { Allow: 'GET, HEAD, OPTIONS' });
      let dbOk = false;
      try { fs.accessSync(DB_PATH); dbOk = true; } catch { dbOk = false; }
      return json(res, 200, {
        status: 'ok',
        service: 'aether-observatory',
        version: VERSION,
        port: PORT,
        bind: HOST,
        db: dbOk ? DB_PATH : null,
        totalSnapshots: dbOk ? countSnapshots() : 0,
        ts: new Date().toISOString(),
        uptimeSec: Math.floor(process.uptime()),
      });
    }

    if (p === '/api/telemetry' || p === '/api/telemetry/live') {
      if (method !== 'GET') return json(res, 405, { error: 'method not allowed' }, { Allow: 'GET, OPTIONS' });
      return json(res, 200, await getFastLiveFrame());
    }

    if (p === '/api/constellation/nodes') {
      if (method !== 'GET') return json(res, 405, { error: 'method not allowed' }, { Allow: 'GET, OPTIONS' });
      return json(res, 200, { ts: new Date().toISOString(), nodes: await constellationNodes() });
    }

    if (p === '/api/git/pulse') {
      if (method !== 'GET') return json(res, 405, { error: 'method not allowed' }, { Allow: 'GET, OPTIONS' });
      return json(res, 200, { ts: new Date().toISOString(), repos: await gitPulseAsync(14) });
    }

    if (p === '/api/timeline/snapshots') {
      if (method !== 'GET') return json(res, 405, { error: 'method not allowed' }, { Allow: 'GET, OPTIONS' });
      const rawLimit = url.searchParams.get('limit');
      let limit = 500;
      if (rawLimit !== null) {
        if (!/^\d+$/.test(rawLimit.trim())) {
          return json(res, 400, { error: 'limit must be a positive integer (1..2000)' });
        }
        limit = parseInt(rawLimit, 10);
        if (!Number.isSafeInteger(limit) || limit < 1) {
          return json(res, 400, { error: 'limit must be a positive integer (1..2000)' });
        }
        limit = Math.min(limit, 2000);
      }
      const frames = listSnapshots(limit);
      const totalCount = countSnapshots();
      return json(res, 200, { totalCount, count: frames.length, frames });
    }

    if (p === '/api/timeline/diff') {
      if (method !== 'GET') return json(res, 405, { error: 'method not allowed' }, { Allow: 'GET, OPTIONS' });
      const t1Raw = url.searchParams.get('t1');
      const t2Raw = url.searchParams.get('t2');
      if (!t1Raw || !t2Raw) {
        return json(res, 400, { error: 't1 and t2 epoch-ms params required' });
      }
      const resDiff = parseDiffRange(url);
      if (resDiff.errorCode) return json(res, resDiff.errorCode, { error: resDiff.error });
      return json(res, 200, resDiff.diff);
    }

    if (p === '/api/timeline/export.json') {
      if (method !== 'GET') return json(res, 405, { error: 'method not allowed' }, { Allow: 'GET, OPTIONS' });
      const resDiff = parseDiffRange(url);
      if (resDiff.errorCode) return json(res, resDiff.errorCode, { error: resDiff.error });
      const payload = {
        exportedAt: new Date().toISOString(),
        service: 'aether-observatory',
        version: VERSION,
        totalCount: countSnapshots(),
        diff: resDiff.diff,
      };
      return json(res, 200, payload, {
        'Content-Disposition': `attachment; filename="aether-diff-${Date.now()}.json"`,
      });
    }

    if (p === '/api/timeline/export.md') {
      if (method !== 'GET') return json(res, 405, { error: 'method not allowed' }, { Allow: 'GET, OPTIONS' });
      const resDiff = parseDiffRange(url);
      if (resDiff.errorCode) return json(res, resDiff.errorCode, { error: resDiff.error });
      const md = formatDiffMarkdown(resDiff.diff, { version: VERSION, totalCount: countSnapshots() });
      res.writeHead(200, {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="aether-diff-${Date.now()}.md"`,
        ...securityHeaders(),
        ...corsHeaders(origin),
      });
      return res.end(md);
    }

    if (p === '/api/snapshot/now') {
      if (method !== 'POST') {
        return json(res, 405, { error: 'POST required for /api/snapshot/now' }, { Allow: 'POST, OPTIONS' });
      }
      const t = await liveFrame(true);
      const compact = compactFrame(t);
      insertSnapshot(compact);
      broadcast(compact);
      return json(res, 200, { recorded: true, ts: t.ts, epoch: t.epoch, totalCount: countSnapshots() });
    }

    if (p === '/api/providers') {
      if (method !== 'GET') return json(res, 405, { error: 'method not allowed' }, { Allow: 'GET, OPTIONS' });
      const providers = await detectProviders();
      return json(res, 200, { ts: new Date().toISOString(), providers });
    }

    if (p === '/api/ai/analyze') {
      if (method !== 'POST') return json(res, 405, { error: 'POST required for /api/ai/analyze' }, { Allow: 'POST, OPTIONS' });
      let body = {};
      try {
        body = await readJsonBody(req);
      } catch (e) {
        return json(res, 400, { error: e.message });
      }
      const [live, nodes] = await Promise.all([getFastLiveFrame(), constellationNodes()]);
      let diff = null;
      if (body.t1 && body.t2) {
        const a = getSnapshot(Number(body.t1));
        const b = getSnapshot(Number(body.t2));
        if (a && b) diff = diffFrames(a, b);
      }
      const result = await analyzeTelemetry({
        provider: typeof body.provider === 'string' ? body.provider : 'auto',
        model: typeof body.model === 'string' ? body.model : '',
        live,
        nodes,
        diff,
      });
      return json(res, 200, { ts: new Date().toISOString(), ...result });
    }

    if (p === '/api/stream') {
      if (method !== 'GET') return json(res, 405, { error: 'method not allowed' }, { Allow: 'GET, OPTIONS' });
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...securityHeaders(),
        ...corsHeaders(origin),
      });
      res.write(': aether-stream\n\n');
      if (lastCompactFrame) {
        res.write(`data: ${JSON.stringify(lastCompactFrame)}\n\n`);
      }
      sseClients.add(res);
      req.on('close', () => sseClients.delete(res));
      return;
    }

    // ---------- Static ----------
    if (method !== 'GET' && method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD, OPTIONS', ...securityHeaders() });
      return res.end('method not allowed');
    }
    const fp = p === '/' ? '/index.html' : p;
    let decoded;
    try { decoded = decodeURIComponent(fp); } catch { res.writeHead(404); return res.end('not found'); }
    const abs = path.resolve(PUBLIC, '.' + decoded);
    if (abs !== PUBLIC && !abs.startsWith(PUBLIC + path.sep)) {
      res.writeHead(404, securityHeaders());
      return res.end('not found');
    }
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
      const ext = path.extname(abs).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
        ...securityHeaders(),
      });
      if (method === 'HEAD') return res.end();
      return fs.createReadStream(abs).pipe(res);
    }
    res.writeHead(404, securityHeaders());
    res.end('not found');
  } catch (err) {
    json(res, 500, { error: String(err?.message || err) });
  }
});

// ---------- Flight recorder loop: real snapshot every 10s + warm caches ----------
let recorderTimer = null;
async function startRecorder() {
  const tick = async () => {
    try {
      const t = await getFastLiveFrame(true);
      const compact = compactFrame(t);
      insertSnapshot(compact);
      broadcast(compact);
    } catch { /* keep daemon alive */ }
  };
  await tick();
  // Warm constellation + git pulse caches in background (non-blocking)
  constellationNodes(true).catch(() => {});
  gitPulseAsync(14).catch(() => {});
  recorderTimer = setInterval(tick, 10000);
  recorderTimer.unref();
}

export async function startServer() {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, HOST, () => resolve());
  });
  await startRecorder();
  console.log(`[aether] listening on http://${HOST}:${PORT} — v${VERSION} recorder live (10s cadence), db=${DB_PATH}`);
  return { port: PORT, host: HOST };
}

if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer().catch(err => {
    console.error(`[aether] failed to start: ${err.message}`);
    process.exit(1);
  });
}

process.on('SIGINT', () => { clearInterval(recorderTimer); server.close(() => process.exit(0)); });
process.on('SIGTERM', () => { clearInterval(recorderTimer); server.close(() => process.exit(0)); });
