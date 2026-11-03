#!/usr/bin/env node
/**
 * ZothOS-Lite v1.1 — automated end-to-end verification harness.
 *
 *   node bin/verify-zothos-lite.mjs          (or: npm test)
 *
 * Proves, against the LIVE stack, that:
 *   1. GET /api/status, /api/thermals, /api/system-status, /api/vaelor/dashboard
 *      all answer 200 OK / ok:true and carry the mission invariant
 *      absoluteGuard { throttleC: 80, pauseC: 85, enforced: 'server-side' }.
 *   2. The 80C throttle and 85C pause guardrails are enforced server-side and
 *      cannot be bypassed by `force: true`. An isolated server.js instance is
 *      spawned on an ephemeral port with ZOTHOS_HWMON_ROOT pointed at a mock
 *      hwmon tree (82000 / 86000 millidegrees) and POSTed to
 *      /api/vaelor/mine with force:true; it must answer
 *      THROTTLED_ABSOLUTE_THERMAL_GUARD / PAUSED_ABSOLUTE_THERMAL_GUARD and
 *      mint nothing. The real Vaelor node (:8140) is never contacted: a mock
 *      sensor pre-flight gates the POST so a broken mock can never fall
 *      through to a real mint.
 *   3. The Live Desktop UI renders real host telemetry from /api/system-status
 *      (top bar RAM/temp/peer chips, Daemons/Sentinel live strip, dock badge)
 *      and keeps zero horizontal overflow at 375x812, 768x1024, 1440x900 —
 *      with imgsMissingAlt === 0 and zero console errors.
 *   4. The shared viewport capture tool reports overflowPx === 0,
 *      imgsMissingAlt === 0, errors.length === 0 for mobile/tablet/desktop.
 *
 * Env overrides: ZOTHOS_BASE_URL, ZOTHOS_VERIFY_OUT, ZOTHOS_CAPTURE_SCRIPT,
 * CHROME_BIN. Exit code 0 = all checks passed, 1 = at least one failed.
 */

import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

const BASE = (process.env.ZOTHOS_BASE_URL || 'http://127.0.0.1:8145').replace(/\/+$/, '');
const OUT_DIR = process.env.ZOTHOS_VERIFY_OUT || '/tmp/zothos-lite-verify';
const CAPTURE_SCRIPT = process.env.ZOTHOS_CAPTURE_SCRIPT
  || '/home/zoth/.gemini/config/skills/ui-verification-loop/scripts/capture.mjs';
const CHROME_BIN = process.env.CHROME_BIN || 'google-chrome';

const EXPECTED_GUARD = { throttleC: 80, pauseC: 85, enforced: 'server-side' };
const GUARDED_ENDPOINTS = ['/api/status', '/api/thermals', '/api/system-status', '/api/vaelor/dashboard'];

// Exact acceptance viewports (hard criterion: overflowPx === 0 on each).
const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812, mobile: true, deviceScaleFactor: 2 },
  { name: 'tablet', width: 768, height: 1024, mobile: true, deviceScaleFactor: 1 },
  { name: 'desktop', width: 1440, height: 900, mobile: false, deviceScaleFactor: 1 },
];

const REAL_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

const results = [];
let failed = 0;

function record(name, pass, detail = '') {
  results.push({ name, pass: !!pass, detail });
  if (!pass) failed++;
  const tag = pass ? 'PASS' : 'FAIL';
  console.log(`${tag}  ${name}${detail ? `\n        ${detail}` : ''}`);
}

function section(title) {
  console.log(`\n─── ${title} ───`);
}

function guardMatches(g) {
  return !!g
    && g.throttleC === EXPECTED_GUARD.throttleC
    && g.pauseC === EXPECTED_GUARD.pauseC
    && g.enforced === EXPECTED_GUARD.enforced;
}

async function getJson(url, timeoutMs = 8000) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    const text = await res.text();
    let body = null;
    try { body = JSON.parse(text); } catch { /* non-JSON */ }
    return { status: res.status, body, text };
  } catch (err) {
    return { status: 0, body: null, text: '', error: err.message };
  }
}

async function postJson(url, payload, timeoutMs = 15000) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    let body = null;
    try { body = JSON.parse(text); } catch { /* non-JSON */ }
    return { status: res.status, body, text };
  } catch (err) {
    return { status: 0, body: null, text: '', error: err.message };
  }
}

async function freePort() {
  return await new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function writeMockHwmon(root, milliC, label = 'Package id 0') {
  const dir = path.join(root, 'hwmon0');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'name'), 'coretemp\n');
  fs.writeFileSync(path.join(dir, 'temp1_label'), `${label}\n`);
  fs.writeFileSync(path.join(dir, 'temp1_input'), `${milliC}\n`);
}

// ── Chrome / CDP plumbing (raw CDP over WS: no third-party deps) ────────────
async function cdpSession(fn) {
  const port = 9400 + Math.floor(Math.random() * 400);
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zothos-verify-chrome-'));
  const chrome = spawn(CHROME_BIN, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--autoplay-policy=no-user-gesture-required',
    '--mute-audio',
    '--disable-background-timer-throttling',
    '--renderer-process-limit=2',
    `--user-data-dir=${profileDir}`,
    'about:blank',
  ], { stdio: 'ignore' });

  let ws = null;
  try {
    for (let i = 0; i < 100 && !ws; i++) {
      try {
        const list = await (await fetch(`http://127.0.0.1:${port}/json`, { signal: AbortSignal.timeout(1500) })).json();
        const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
        if (page) ws = new WebSocket(page.webSocketDebuggerUrl);
      } catch { /* chrome still booting */ }
      if (!ws) await sleep(200);
    }
    if (!ws) throw new Error(`Chrome (${CHROME_BIN}) did not expose a page target on :${port}`);

    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', () => reject(new Error('CDP websocket error')), { once: true });
    });

    let seq = 0;
    const pending = new Map();
    let pageErrors = [];

    ws.addEventListener('message', (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
        return;
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params?.exceptionDetails || {};
        pageErrors.push(String(d.exception?.description || d.text || 'exception'));
      } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params?.type === 'error') {
        pageErrors.push((msg.params.args || []).map((a) => a.value ?? a.description ?? '').join(' '));
      }
    });

    const send = (method, params = {}) => new Promise((resolve) => {
      const id = ++seq;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });

    const evaluate = async (expression) => {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.text || 'evaluate threw');
      return r.result?.result?.value;
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Network.enable');
    await send('Network.setUserAgentOverride', { userAgent: REAL_UA });

    return await fn({
      send,
      evaluate,
      resetErrors: () => { pageErrors = []; },
      errors: () => [...pageErrors],
    });
  } finally {
    try { ws?.close(); } catch { /* ignore */ }
    try { chrome.kill('SIGKILL'); } catch { /* ignore */ }
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

const MEASURE_UI = `(() => {
  const txt = (id) => { const el = document.getElementById(id); return el ? (el.textContent || '').trim() : null; };
  const att = (id, a) => { const el = document.getElementById(id); return el ? el.getAttribute(a) : null; };
  const de = document.documentElement;
  return {
    overflowPx: de.scrollWidth - de.clientWidth,
    bodyOverflowPx: document.body.scrollWidth - document.body.clientWidth,
    imgsMissingAlt: [...document.images].filter((i) => !i.hasAttribute('alt') || !String(i.alt).trim()).length,
    dockMem: txt('dockLiveMem'), dockTemp: txt('dockLiveTemp'), dockPeers: txt('dockLivePeers'),
    dockGovernor: att('dockLiveTelemetry', 'data-governor'),
    topRam: txt('topRamFootprint'), topTemp: txt('topPackageTemp'),
    topVaelor: txt('topPeerVaelor'), topVaelorOnline: att('topPeerVaelor', 'data-online'),
    topNeuro: txt('topPeerNeuro'), topNeuroOnline: att('topPeerNeuro', 'data-online'),
    dlMem: txt('dlMemValue'), dlLoad: txt('dlLoadValue'), dlTemp: txt('dlTempValue'),
    dlIso: txt('dlIsoValue'), dlVaelor: txt('dlPeerVaelor'), dlNeuro: txt('dlPeerNeuro'),
    dlFresh: att('daemonLiveTelemetry', 'data-fresh'),
    title: document.title
  };
})()`;

const isPlaceholder = (v) => v === null || v === undefined || v === '' || v.includes('--');

// ── 1. Live telemetry contract ─────────────────────────────────────────────
async function checkContracts() {
  section(`1/4  Live API contracts on ${BASE}`);

  for (const endpoint of GUARDED_ENDPOINTS) {
    const { status, body, error } = await getJson(`${BASE}${endpoint}`);
    if (error || !body) {
      record(`GET ${endpoint} → 200 + ok:true`, false, error || 'empty/non-JSON body');
      continue;
    }
    record(
      `GET ${endpoint} → 200 + ok:true`,
      status === 200 && body.ok === true,
      `http=${status} ok=${body.ok}`,
    );
    record(
      `GET ${endpoint} → absoluteGuard {80,85,server-side}`,
      guardMatches(body.absoluteGuard),
      `absoluteGuard=${JSON.stringify(body.absoluteGuard ?? null)}`,
    );
  }

  const { body: s } = await getJson(`${BASE}/api/system-status`);
  if (!s) return;
  record('system-status: live host memory (totalMb > 0, 0 <= usedMb <= totalMb)',
    Number(s.memory?.totalMb) > 0 && Number(s.memory?.usedMb) >= 0 && Number(s.memory?.usedMb) <= Number(s.memory?.totalMb),
    `memory=${JSON.stringify(s.memory ?? null)}`);
  record('system-status: loadAvg carries load1/load5/load15',
    ['load1', 'load5', 'load15'].every((k) => typeof s.loadAvg?.[k] === 'number'),
    `loadAvg=${JSON.stringify(s.loadAvg ?? null)}`);
  record('system-status: thermals.packageTempC is a number + governorState present',
    typeof s.thermals?.packageTempC === 'number' && typeof s.thermals?.governorState === 'string',
    `packageTempC=${s.thermals?.packageTempC} governorState=${s.thermals?.governorState} source=${s.thermals?.sensorSource}`);
  record('system-status: daemons[] non-empty with running flags',
    Array.isArray(s.daemons) && s.daemons.length > 0 && s.daemons.every((d) => typeof d.running === 'boolean'),
    `${Array.isArray(s.daemons) ? s.daemons.length : 'n/a'} daemons`);

  const peers = Array.isArray(s.peers) ? s.peers : [];
  record('system-status: peers expose vaelor-zoth-node :8140 and neuro-memory :8094 with port+url',
    peers.some((p) => p.name === 'vaelor-zoth-node' && p.port === 8140 && typeof p.url === 'string')
    && peers.some((p) => p.name === 'neuro-memory' && p.port === 8094 && typeof p.url === 'string'),
    JSON.stringify(peers));
  record('system-status: iso.present is a boolean',
    typeof s.iso?.present === 'boolean',
    `iso=${JSON.stringify(s.iso ?? null)}`);
}

// ── 2. Guardrail cannot be bypassed by force:true ──────────────────────────
async function checkGuardrailBypass() {
  section('2/4  Absolute thermal guardrail — force:true bypass attempt (isolated instance)');

  const mockRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zothos-hwmon-mock-'));
  const port = await freePort();
  const testBase = `http://127.0.0.1:${port}`;
  let logs = '';
  let child = null;

  try {
    child = spawn(process.execPath, ['server.js'], {
      cwd: ROOT,
      env: {
        ...process.env,
        PORT: String(port),
        ZOTHOS_HWMON_ROOT: mockRoot,
        ZOTHOS_VERIFY_HARNESS: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.on('data', (d) => { logs += d; });
    child.stderr.on('data', (d) => { logs += d; });

    let ready = false;
    for (let i = 0; i < 60 && !ready; i++) {
      const { status, body } = await getJson(`${testBase}/api/status`, 1500);
      if (status === 200 && body?.ok === true) ready = true;
      else await sleep(400);
    }
    record(`isolated test instance booted on ephemeral :${port} with mock ZOTHOS_HWMON_ROOT`,
      ready,
      ready ? `mockRoot=${mockRoot}` : `no 200 from ${testBase}/api/status; child logs: ${logs.slice(-400) || '(none)'}`);
    if (!ready) return;

    // Sensorless-host honesty: with an empty mock hwmon root there is no package sensor.
    // /api/system-status must say so (null, never a fabricated 0) — this is exactly the
    // case that made the QEMU guest render "0°C".
    {
      const ss = await getJson(`${testBase}/api/system-status`);
      const th = (ss.body && ss.body.thermals) || {};
      const tempNullish = th.packageTempC === null || th.packageTempC === undefined;
      record('sensorless host: /api/system-status reports packageTempC null (never 0) and sensorsAvailable false',
        tempNullish && th.sensorsAvailable === false,
        `packageTempC=${JSON.stringify(th.packageTempC)} sensorsAvailable=${JSON.stringify(th.sensorsAvailable)} sensorSource=${JSON.stringify(th.sensorSource)} governorState=${JSON.stringify(th.governorState)}`);
    }

    const cases = [
      { label: '82C (mock 82000 m°C)', milliC: 82000, expectC: 82, expectAction: 'THROTTLED_ABSOLUTE_THERMAL_GUARD' },
      { label: '86C (mock 86000 m°C)', milliC: 86000, expectC: 86, expectAction: 'PAUSED_ABSOLUTE_THERMAL_GUARD' },
    ];

    for (const c of cases) {
      writeMockHwmon(mockRoot, c.milliC);

      // Pre-flight gate: prove the mock sensor is actually read BEFORE posting to
      // /api/vaelor/mine. A server that is not really reading the mock would fall
      // through to the real miner and mint on the live Vaelor ledger (:8140) — so
      // when the mock is not read we refuse to POST at all.
      const t = await getJson(`${testBase}/api/thermals`);
      const mockRead = t.body?.packageTempC === c.expectC && String(t.body?.sensorSource || '').includes('hwmon');
      record(`${c.label}: mock hwmon drives the sensor path`, mockRead,
        `packageTempC=${t.body?.packageTempC} sensorSource=${t.body?.sensorSource}`);
      if (!mockRead) {
        record(`${c.label}: force:true cannot bypass ${c.expectAction}`, false,
          'ABORTED — mock sensor not read; refused to POST /api/vaelor/mine so the live Vaelor ledger was never touched');
        continue;
      }

      const r = await postJson(`${testBase}/api/vaelor/mine`, {
        worker: '@verify-zothos-lite',
        workType: 'SECURITY_ENTROPY_SCAN',
        maxTempC: 95,
        force: true,
      });
      const b = r.body || {};
      const minted = ['block', 'mintBlock', 'blockHash', 'minedBlock'].some((k) => b[k] !== undefined);
      record(`${c.label}: force:true cannot bypass ${c.expectAction}`,
        r.status === 200 && b.ok === true && b.governorAction === c.expectAction && b.throttled === true && !minted,
        `http=${r.status} ok=${b.ok} governorAction=${b.governorAction} throttled=${b.throttled} minted=${minted} reason="${String(b.reason || '').slice(0, 110)}"`);
      record(`${c.label}: guard metadata survives the bypass attempt (measuredC=${c.expectC})`,
        b.absoluteGuard?.throttleC === EXPECTED_GUARD.throttleC
        && b.absoluteGuard?.pauseC === EXPECTED_GUARD.pauseC
        && b.absoluteGuard?.measuredC === c.expectC,
        `absoluteGuard=${JSON.stringify(b.absoluteGuard ?? null)}`);

      // A second identical attempt must behave identically — the guard is not a
      // one-shot or a client-toggled switch.
      const r2 = await postJson(`${testBase}/api/vaelor/mine`, { worker: '@verify-zothos-lite', force: true, maxTempC: 95 });
      record(`${c.label}: repeat attempt is refused identically (non-bypassable)`,
        r2.body?.governorAction === c.expectAction && r2.body?.throttled === true,
        `attempt2 governorAction=${r2.body?.governorAction} throttled=${r2.body?.throttled}`);
    }
  } finally {
    try { child?.kill('SIGKILL'); } catch { /* ignore */ }
    await sleep(300);
    try { fs.rmSync(mockRoot, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

// ── 3. Live Desktop UI rendering + exact-viewport overflow ─────────────────
async function checkLiveUi() {
  section('3/4  Live Desktop UI telemetry + exact viewport overflow');

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const camera = {};

  // Ground truth for the temperature assertions. On a box with hwmon (this machine) that is
  // a real °C reading; inside QEMU there is no sensor and the API says null/sensorsAvailable
  // false — the UI must then show "--°C", never a fabricated "0°C" (Number(null) === 0 used
  // to slip through). The host temperature legitimately DRIFTS while the capture browser
  // hammers the CPU, so each viewport is bracketed by fresh samples instead of being
  // compared against one boot-time snapshot.
  const snapTemp = (snap) => {
    const th = (snap && snap.body && snap.body.thermals) || {};
    const v = th.packageTempC;
    const present = v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));
    const dead = th.sensorsAvailable === false || th.sensorSource === 'unavailable';
    const has = present && !(Number(v) === 0 && dead);
    return { has, c: has ? Math.round(Number(v)) : null, sensorsAvailable: th.sensorsAvailable };
  };
  const boot = snapTemp(await getJson(`${BASE}/api/system-status`));
  console.log(`  host sensor ground truth: expected UI temp "${boot.has ? `${boot.c}°C` : '--°C'}" (sensorsAvailable=${JSON.stringify(boot.sensorsAvailable)})`);
  console.log('  host temp is re-sampled per viewport: it drifts while the capture browser loads the CPU');

  await cdpSession(async ({ send, evaluate, resetErrors, errors }) => {
    for (const vp of VIEWPORTS) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width, height: vp.height, mobile: vp.mobile, deviceScaleFactor: vp.deviceScaleFactor,
      });
      resetErrors();
      const apiBefore = snapTemp(await getJson(`${BASE}/api/system-status`));
      await send('Page.navigate', { url: `${BASE}/` });
      await sleep(4200); // immediate fetch + settle past the 5s telemetry poll

      const m = await evaluate(MEASURE_UI);
      const apiAfter = snapTemp(await getJson(`${BASE}/api/system-status`));
      camera[vp.name] = m;
      const where = `${vp.name} ${vp.width}x${vp.height}`;
      const samples = [apiBefore, apiAfter].filter((s) => s.has).map((s) => s.c);
      const sensorless = samples.length === 0;
      const domTemp = String(m.topTemp || '');
      const domC = /^(-?\d+)°C$/.exec(domTemp);

      record(`${where}: overflowPx === 0`, m.overflowPx === 0, `documentElement overflow=${m.overflowPx}px body overflow=${m.bodyOverflowPx}px`);
      record(`${where}: imgsMissingAlt === 0`, m.imgsMissingAlt === 0, `missing alt=${m.imgsMissingAlt}`);
      record(`${where}: consoleErrors.length === 0`, errors().length === 0, errors().join(' | ').slice(0, 300) || 'none');

      // Wiring evidence: real host telemetry, not the old static 958MB.
      record(`${where}: top bar shows live host memory (usedMb/totalMb)`,
        /^\d+\/\d+M$/.test(String(m.topRam || '')), `topRamFootprint="${m.topRam}"`);
      // The DOM reading must lie inside the interval the host itself reported while this
      // viewport was captured (±1°C rounding slack). This still catches a fabricated or
      // static temperature (0°C, a hard-coded 42°C) while tolerating the genuine load
      // spike the capture browser causes — mobile boots at ~66°C and is at ~76°C by the
      // time the page is measured.
      const loTemp = sensorless ? null : Math.min(...samples) - 1;
      const hiTemp = sensorless ? null : Math.max(...samples) + 1;
      record(`${where}: top bar package temp is a live reading inside the host's own sampled range`,
        sensorless ? domTemp === '--°C'
          : Boolean(domC) && Number(domC[1]) >= loTemp && Number(domC[1]) <= hiTemp,
        `topPackageTemp="${domTemp}" host samples=[${samples.join(', ')}]°C accepted=[${loTemp}, ${hiTemp}]°C (sensorsAvailable=${JSON.stringify(apiAfter.sensorsAvailable)})`);
      record(`${where}: no fabricated 0°C reading when the host has no sensor`,
        !sensorless || domTemp !== '0°C',
        `topPackageTemp="${domTemp}" sensorlessHost=${sensorless}`);
      record(`${where}: top bar peer chips carry :8140 and :8094 with live online flags`,
        String(m.topVaelor || '').includes(':8140') && String(m.topNeuro || '').includes(':8094')
        && ['true', 'false'].includes(String(m.topVaelorOnline)) && ['true', 'false'].includes(String(m.topNeuroOnline)),
        `vaelor="${m.topVaelor}" (online=${m.topVaelorOnline}) neuro="${m.topNeuro}" (online=${m.topNeuroOnline})`);
      record(`${where}: dock badge renders live mem/temp/peers`,
        /\d+\/\d+M/.test(String(m.dockMem || '')) && !isPlaceholder(String(m.dockMem))
        && ((!sensorless && /\d+°C/.test(String(m.dockTemp || ''))) || (sensorless && String(m.dockTemp || '').includes('--°C')))
        && /◉\s*\d+\/\d+/.test(String(m.dockPeers || '')),
        `mem="${m.dockMem}" temp="${m.dockTemp}" peers="${m.dockPeers}" governor=${m.dockGovernor}`);
      record(`${where}: Daemons/Sentinel live strip renders host telemetry`,
        /^\d+\/\d+M( • \d+%)?$/.test(String(m.dlMem || ''))
        && /^\d/.test(String(m.dlLoad || '')) && !isPlaceholder(String(m.dlLoad))
        && ((!sensorless && /\d+°C/.test(String(m.dlTemp || ''))) || (sensorless && String(m.dlTemp || '').includes('--°C')))
        && ['PRESENT', 'ABSENT'].includes(String(m.dlIso || '')),
        `mem="${m.dlMem}" load="${m.dlLoad}" temp="${m.dlTemp}" iso="${m.dlIso}" vaelor="${m.dlVaelor}" neuro="${m.dlNeuro}" fresh=${m.dlFresh}`);
    }
  });

  fs.writeFileSync(path.join(OUT_DIR, 'ui-telemetry.json'), `${JSON.stringify(camera, null, 2)}\n`);
  console.log(`\n  (UI telemetry snapshot written to ${path.join(OUT_DIR, 'ui-telemetry.json')})`);
}

// ── 4. Shared capture tool: 3-viewport screenshot + assertion pass ─────────
function checkCaptureTool() {
  section('4/4  capture.mjs triple-viewport verification');

  if (!fs.existsSync(CAPTURE_SCRIPT)) {
    record('capture.mjs present', false, `not found at ${CAPTURE_SCRIPT}`);
    return;
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const res = spawnSync(process.execPath, [
    CAPTURE_SCRIPT,
    '--base', BASE,
    '--out', OUT_DIR,
    '--viewports', 'mobile,tablet,desktop',
    '--wait', '4000', // let the /api/system-status telemetry land before the still
  ], { encoding: 'utf8', timeout: 180000, env: { ...process.env, CHROME_BIN } });

  const stdout = res.stdout || '';
  const stderr = res.stderr || '';

  // capture.mjs prints its report as `node` output; depending on progress lines it may
  // be a bare array, a bare object, or embedded in surrounding text. Try candidates in
  // order and keep the first that parses AND looks like the per-viewport report.
  const trimmed = stdout.trim();
  const candidates = [];
  const push = (s) => { if (s && !candidates.includes(s)) candidates.push(s); };
  push(trimmed);
  for (const [open, close] of [['[', ']'], ['{', '}']]) {
    const a = stdout.indexOf(open);
    const b = stdout.lastIndexOf(close);
    if (a >= 0 && b > a) push(stdout.slice(a, b + 1));
  }
  for (const line of stdout.split('\n')) {
    const t = line.trim();
    if ((t.startsWith('{') || t.startsWith('[')) && t.length > 2) push(t);
  }

  let report = null;
  const looksRight = (v) => {
    const list = Array.isArray(v) ? v : (v?.viewports || v?.results || []);
    return Array.isArray(list) && list.some((x) => x && (x.viewport || x.name) && 'overflowPx' in x);
  };
  for (const c of candidates) {
    try {
      const parsed = JSON.parse(c);
      if (looksRight(parsed)) { report = parsed; break; }
      if (!report) report = parsed; // keep a fallback so the failure detail is meaningful
    } catch { /* try the next candidate */ }
  }
  if (!report) {
    record('capture.mjs produced a parseable JSON report', false,
      `exit=${res.status} stdout=${stdout.slice(-300)} stderr=${stderr.slice(-300)}`);
    return;
  }

  const list = Array.isArray(report) ? report : (report.viewports || report.results || []);
  record('capture.mjs reported all 3 viewports', list.length >= 3 && ['mobile', 'tablet', 'desktop'].every((n) => list.some((v) => (v.viewport || v.name) === n)),
    `got: ${list.map((v) => v.viewport || v.name).join(', ') || '(none)'}`);

  for (const name of ['mobile', 'tablet', 'desktop']) {
    const v = list.find((x) => (x.viewport || x.name) === name);
    if (!v) { record(`capture.mjs ${name}: present`, false, 'viewport missing from report'); continue; }
    record(`capture.mjs ${name}: overflowPx === 0`, v.overflowPx === 0, `overflowPx=${v.overflowPx} (buttons=${v.buttons} textLength=${v.textLength})`);
    record(`capture.mjs ${name}: imgsMissingAlt === 0`, v.imgsMissingAlt === 0, `imgsMissingAlt=${v.imgsMissingAlt}`);
    record(`capture.mjs ${name}: errors.length === 0`, Array.isArray(v.errors) && v.errors.length === 0,
      (v.errors || []).join(' | ').slice(0, 300) || 'none');
  }
  const shots = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.jpg')).sort();
  record('capture.mjs wrote a screenshot for each viewport', shots.length >= 3, shots.join(', ') || '(none)');
  for (const s of shots) console.log(`        screenshot: ${path.join(OUT_DIR, s)}`);
}

// ── main ───────────────────────────────────────────────────────────────────
(async () => {
  const started = Date.now();
  console.log(`ZothOS-Lite v1.1 verification harness`);
  console.log(`base=${BASE}  out=${OUT_DIR}  capture=${CAPTURE_SCRIPT}`);

  await checkContracts();
  await checkGuardrailBypass();
  await checkLiveUi();
  checkCaptureTool();

  const secs = ((Date.now() - started) / 1000).toFixed(1);
  section('Summary');
  console.log(`  ${results.length - failed}/${results.length} checks passed in ${secs}s`);
  if (failed) {
    console.log('  failures:');
    for (const r of results.filter((x) => !x.pass)) console.log(`   ✗ ${r.name}`);
  } else {
    console.log('  result: ALL CHECKS PASSED — live telemetry contracts, non-bypassable 80°C/85°C guardrail, and zero-overflow responsive UI verified.');
  }

  try {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, 'verify-report.json'), `${JSON.stringify({
      base: BASE, at: new Date().toISOString(), passed: results.length - failed, total: results.length, seconds: Number(secs), results,
    }, null, 2)}\n`);
    console.log(`  report: ${path.join(OUT_DIR, 'verify-report.json')}`);
  } catch (err) {
    console.log(`  (could not write report: ${err.message})`);
  }

  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error(`HARNESS ERROR: ${err.stack || err.message}`);
  process.exit(1);
});
