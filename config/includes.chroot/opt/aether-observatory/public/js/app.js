// AETHER — main application. Wires telemetry API & SSE → constellation, odometers, sonifier, time machine, AI triage.
// Zero unescaped innerHTML sinks; live dual-theme synchronization across all canvases.

import './intro.js';
import { Constellation } from './constellation.js';
import { RotaryKnob, Sonifier } from './sonifier.js';
import { TimeMachine } from './timemachine.js';

// ---------- embed mode ----------
const urlParams = new URLSearchParams(location.search);
if (urlParams.get('embed') === '1' || window.self !== window.top) {
  document.documentElement.classList.add('embedded');
}

// ---------- theme ----------
const root = document.documentElement;
const THEMES = {
  dark: {
    bg0: '#07090E', panel: 'rgba(255,255,255,0.035)', line: 'rgba(255,255,255,0.12)',
    ink: '#E7E2D4', inkDim: '#A6AEBF', inkFaint: '#7A8396',
    gold: '#D4AF37', cyan: '#38BDF8', violet: '#8B5CF6',
    heatWarn: '#F59E0B', heatHot: '#EF4444',
    cat: { noc: '#38BDF8', data: '#34D399', gen: '#F472B6', sec: '#F59E0B', dev: '#A78BFA', unknown: '#94A3B8' },
  },
  light: {
    bg0: '#F7F4EB', panel: 'rgba(17,19,24,0.035)', line: 'rgba(17,19,24,0.14)',
    ink: '#111318', inkDim: '#46423D', inkFaint: '#676158',
    gold: '#8C6239', cyan: '#0B7498', violet: '#6D28D9',
    heatWarn: '#B45309', heatHot: '#B91C1C',
    cat: { noc: '#0B7498', data: '#156A43', gen: '#BE185D', sec: '#B45309', dev: '#6D28D9', unknown: '#64748B' },
  },
};

function applyPalette() {
  const t = root.dataset.theme === 'light' ? THEMES.light : THEMES.dark;
  window.__AETHER_COLORS = t;
  return t;
}
applyPalette();

let constellation = null;
let redrawAllCharts = null;

const themeBtns = { dark: document.getElementById('theme-dark'), light: document.getElementById('theme-light') };
function setTheme(t) {
  root.dataset.theme = t;
  themeBtns.dark.setAttribute('aria-pressed', String(t === 'dark'));
  themeBtns.light.setAttribute('aria-pressed', String(t === 'light'));
  const palette = applyPalette();
  constellation?.setColors(palette);
  redrawAllCharts?.();
  try { localStorage.setItem('aether-theme', t); } catch {}
}

try {
  const urlTheme = urlParams.get('theme');
  const saved = (urlTheme === 'light' || urlTheme === 'dark') ? urlTheme : localStorage.getItem('aether-theme');
  if (saved === 'light' || saved === 'dark') setTheme(saved);
} catch {}

themeBtns.dark.addEventListener('click', () => setTheme('dark'));
themeBtns.light.addEventListener('click', () => setTheme('light'));
matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', (e) => setTheme(e.matches ? 'light' : 'dark'));

// Viewport hint — touch-aware text
{
  const vh = document.getElementById('viewport-hint');
  if (vh) {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    vh.textContent = isTouch ? 'drag — orbit · pinch — zoom · tap node — inspect' : 'drag — orbit · wheel — zoom · click node — inspect';
  }
}

// ---------- drawers ----------
const nodeDrawer = document.getElementById('node-drawer');
const docsDrawer = document.getElementById('docs-drawer');
const nodeDrawerClose = document.getElementById('drawer-close');
const docsOpen = document.getElementById('docs-open');
const docsClose = document.getElementById('docs-close');
function openDrawer(el) { el.classList.add('open'); el.setAttribute('aria-hidden', 'false'); }
function closeDrawer(el) { el.classList.remove('open'); el.setAttribute('aria-hidden', 'true'); }
nodeDrawerClose.addEventListener('click', () => closeDrawer(nodeDrawer));
docsOpen.addEventListener('click', () => openDrawer(docsDrawer));
docsClose.addEventListener('click', () => closeDrawer(docsDrawer));
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeDrawer(nodeDrawer); closeDrawer(docsDrawer); } });

// ---------- constellation ----------
const canvas = document.getElementById('constellation-canvas');
const brailleEl = document.getElementById('constellation-braille');
const inspector = {
  name: document.getElementById('d-node-name'),
  facts: document.getElementById('d-node-facts'),
  cmd: document.getElementById('d-node-cmd'),
};

function fmtUptime(s) {
  if (s == null) return '—';
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return (d ? `${d}d ` : '') + (h ? `${h}h ` : '') + `${m}m`;
}

function showInspector(node) {
  if (!node) { closeDrawer(nodeDrawer); return; }
  inspector.name.textContent = node.name;
  const zothLabel = node.zothTool ? `Yes · ${node.category || 'Zoth Tool'}` : 'System daemon';
  const facts = [
    ['PORT', `:${node.port} (${node.proto || 'tcp'})`],
    ['BIND', node.addr || '—'],
    ['PID', node.pid ?? '—'],
    ['ZOTH TOOL', zothLabel],
    ['UPTIME', fmtUptime(node.uptimeSec)],
    ['LATENCY', node.latencyMs == null ? '—' : `${node.latencyMs} ms`],
    ['CATEGORY', node.category || 'System'],
  ];
  inspector.facts.replaceChildren();
  for (const [k, v] of facts) {
    const dt = document.createElement('dt'); dt.textContent = k;
    const dd = document.createElement('dd'); dd.textContent = String(v ?? '—');
    inspector.facts.append(dt, dd);
  }
  inspector.cmd.textContent = node.cmdline || '(cmdline unreadable for this process)';
  openDrawer(nodeDrawer);
}

constellation = new Constellation(canvas, brailleEl, applyPalette(), showInspector);
window.__constellation = constellation;

document.getElementById('reset-camera').addEventListener('click', () => constellation.resetCamera());
const modeBtns = [...document.querySelectorAll('.mode-rack button')];
modeBtns.forEach(b => b.addEventListener('click', () => {
  modeBtns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  constellation.setMode(b.dataset.mode);
}));

// ---------- odometers ----------
function renderOdometer(el, value, unitLabel) {
  const digits = String(Math.max(0, Math.round(Number(value) || 0))).padStart(Math.max(2, Number(el.dataset.len) || 3), '0').split('');
  const inUnit = el.querySelectorAll('.flap:not(.unit)');
  for (let i = 0; i < digits.length; i++) {
    let flap = inUnit[i];
    if (!flap) {
      flap = document.createElement('div');
      flap.className = 'flap';
      const unitEl = el.querySelector('.flap.unit');
      if (unitEl) el.insertBefore(flap, unitEl);
      else el.appendChild(flap);
    }
    if (flap.textContent !== digits[i]) {
      flap.textContent = digits[i];
      flap.classList.remove('flip');
      void flap.offsetWidth;
      flap.classList.add('flip');
    }
  }
  const all = el.querySelectorAll('.flap:not(.unit)');
  for (let i = digits.length; i < all.length; i++) all[i].remove();
  let unit = el.querySelector('.flap.unit');
  if (unitLabel && !unit?.textContent.includes(unitLabel)) {
    if (unit) unit.remove();
    unit = document.createElement('div');
    unit.className = 'flap unit';
    unit.textContent = unitLabel;
    el.appendChild(unit);
  }
}

const odoUptime = document.getElementById('odo-uptime');
const odoSockets = document.getElementById('odo-sockets');
const odoThermal = document.getElementById('odo-thermal');
odoUptime.dataset.len = '2';
odoSockets.dataset.len = '3';
odoThermal.dataset.len = '3';

// ---------- charts ----------
class Ring {
  constructor(n) { this.a = new Array(n).fill(0); this.i = 0; this.n = n; }
  push(v) {
    if (typeof v !== 'number' || !Number.isFinite(v)) return;
    this.a[this.i] = v;
    this.i = (this.i + 1) % this.n;
  }
  get ordered() { return [...this.a.slice(this.i), ...this.a.slice(0, this.i)]; }
}

const HIST = 90;
const cpuHist = new Ring(HIST), thermHist = new Ring(HIST), memHist = new Ring(HIST);

function drawChart(el, values, { max, stroke, fill }) {
  const ctx = el.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = Math.max(10, el.clientWidth || 300);
  const H = 120;
  el.width = Math.round(W * dpr);
  el.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const vals = values.ordered;
  const n = vals.length;
  const xFor = i => (i / (n - 1)) * W;
  const yFor = v => H - 4 - (Math.min(max, Math.max(0, v)) / max) * (H - 8);
  if (fill) {
    ctx.beginPath();
    vals.forEach((v, i) => (i ? ctx.lineTo(xFor(i), yFor(v)) : ctx.moveTo(xFor(i), yFor(v))));
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
  }
  ctx.beginPath();
  vals.forEach((v, i) => (i ? ctx.lineTo(xFor(i), yFor(v)) : ctx.moveTo(xFor(i), yFor(v))));
  ctx.strokeStyle = stroke; ctx.lineWidth = 1.7; ctx.stroke();
}

const chartCpu = document.getElementById('chart-cpu');
const chartThermal = document.getElementById('chart-thermal');
const chartMem = document.getElementById('chart-mem');

redrawAllCharts = () => {
  const colors = applyPalette();
  drawChart(chartCpu, cpuHist, { max: 100, stroke: colors.gold, fill: colors.gold + '18' });
  drawChart(chartThermal, thermHist, { max: 100, stroke: colors.cyan, fill: colors.cyan + '14' });
  drawChart(chartMem, memHist, { max: 100, stroke: colors.violet, fill: colors.violet + '14' });
};

const R = (id) => document.getElementById(id);
const heatColor = (c) => {
  const p = applyPalette();
  if (c == null) return p.inkFaint;
  if (c >= 80) return p.heatHot;
  if (c >= 65) return p.heatWarn;
  return p.cyan;
};

// ---------- sonifier + knobs ----------
const knobs = {};
const sonifier = new Sonifier(
  document.getElementById('sono-toggle'),
  document.getElementById('fft-waterfall'),
  (mapped) => {
    for (const [k, val] of Object.entries(mapped)) {
      knobs[k]?.setFromTelemetry(val);
    }
  }
);
window.__sonifier = sonifier;

['pitch', 'harm', 'bright', 'drift'].forEach(k => {
  const el = document.querySelector(`[data-knob="${k}"]`);
  const out = document.getElementById(`kv-${k}`);
  knobs[k] = new RotaryKnob(el, {
    initial: sonifier.params[k],
    onChange: (v) => {
      sonifier.params[k] = Math.round(v);
      out.textContent = String(Math.round(v));
      sonifier.apply();
    },
  });
});

// ---------- timeline ----------
const timeMachine = new TimeMachine(document.getElementById('timeline-canvas'), {
  count: document.getElementById('tm-count'),
  readout: document.getElementById('tm-readout'),
  scrubBtn: document.getElementById('tm-scrub'),
  diffBtn: document.getElementById('tm-diff'),
  exportMd: document.getElementById('tm-export-md'),
  exportJson: document.getElementById('tm-export-json'),
  diffOut: document.getElementById('tm-diff-out'),
  diffChips: document.getElementById('tm-diff-chips'),
  diffRange: document.getElementById('tm-diff-range'),
});
window.__timeMachine = timeMachine;

// ---------- telemetry loop ----------
const livePill = document.getElementById('live-pill-text');
const liveClock = document.getElementById('live-clock');

function fmtKB(kb) {
  if (kb == null) return '—';
  if (kb > 1024 * 1024) return `${(kb / 1024 / 1024).toFixed(1)} GiB`;
  if (kb > 1024) return `${(kb / 1024).toFixed(0)} MiB`;
  return `${kb} KiB`;
}

async function pollTelemetry() {
  let f;
  try { f = await fetch('/api/telemetry/live').then(r => (r.ok ? r.json() : null)); }
  catch { return; }
  if (!f) return;

  const busy = f.cpu?.busyPct ?? 0;
  livePill.textContent = `${Math.round(busy)}% CPU`;
  R('r-load1').textContent = f.cpu?.load1?.toFixed(2) ?? '—';
  R('r-load5').textContent = f.cpu?.load5?.toFixed(2) ?? '—';
  R('r-load15').textContent = f.cpu?.load15?.toFixed(2) ?? '—';
  R('r-busy').textContent = `${busy.toFixed(1)}%`;
  R('r-procs').textContent = String(f.processCount ?? '—');

  const pkg = f.thermals?.packageC;
  R('r-pkg').textContent = pkg != null ? `${pkg.toFixed(1)}°C` : '—';
  R('r-pkg').style.background = pkg != null ? `${heatColor(pkg)}22` : 'transparent';
  R('r-pkg').style.color = pkg != null ? heatColor(pkg) : '';

  // Fix: read real z.celsius and f.thermals.fanRpm
  const hottest = (f.thermals?.zones ?? []).reduce((a, z) => (z.celsius > (a?.celsius ?? -Infinity) ? z : a), null);
  R('r-zone').textContent = hottest ? `${hottest.celsius.toFixed(1)}°C (${hottest.label})` : '—';
  R('r-zone').style.color = hottest ? heatColor(hottest.celsius) : '';
  const fanRpm = f.thermals?.fanRpm;
  R('r-fan').textContent = fanRpm != null ? `${fanRpm} rpm` : '—';
  R('r-ram').textContent = f.memory ? `${fmtKB(f.memory.usedKb)} / ${fmtKB(f.memory.totalKb)}` : '—';
  R('r-swap').textContent = f.memory?.swapTotalKb ? `${fmtKB(f.memory.swapUsedKb)} / ${fmtKB(f.memory.swapTotalKb)}` : '0';

  cpuHist.push(busy);
  if (pkg != null) thermHist.push(pkg);
  if (f.memory?.usedPct != null) memHist.push(f.memory.usedPct);

  // Real total uptime hours (no % 100 truncation)
  const totalHours = Math.floor((f.uptimeSec ?? 0) / 3600);
  renderOdometer(odoUptime, totalHours, 'HR');
  renderOdometer(odoSockets, f.listening?.count ?? 0, null);
  renderOdometer(odoThermal, Math.round(pkg ?? 0), '°C');

  sonifier.telemetry(f);
  redrawAllCharts();
}

setInterval(pollTelemetry, 2500);
pollTelemetry();

function tickClock() {
  liveClock.textContent = new Date().toTimeString().slice(0, 8);
}
tickClock();
setInterval(tickClock, 1000);

// ---------- constellation nodes ----------
async function pollNodes() {
  let data;
  try { data = await fetch('/api/constellation/nodes').then(r => (r.ok ? r.json() : null)); }
  catch { return; }
  if (!data) return;
  constellation.setNodes((data.nodes || []).map(n => ({ ...n, category: n.category || 'System' })));
  window.__nodeCount = constellation.nodes.length;
}
setInterval(pollNodes, 8000);
pollNodes();

// ---------- git pulse (XSS-safe DOM construction, real commit subjects) ----------
async function pollGit() {
  let data;
  try { data = await fetch('/api/git/pulse').then(r => (r.ok ? r.json() : null)); }
  catch { return; }
  if (!data) return;
  const list = document.getElementById('git-list');
  list.replaceChildren();
  const note = document.getElementById('git-dirty-note');
  const repos = (data.repos || []).slice(0, 7);
  let dirtyCount = 0;

  for (const repo of repos) {
    dirtyCount += repo.dirtyFiles ?? 0;
    const row = document.createElement('div');
    row.className = 'git-row';

    const sRepo = document.createElement('span');
    sRepo.className = 'git-repo';
    sRepo.textContent = repo.repo || 'unknown';
    sRepo.title = repo.repo || '';

    const sBranch = document.createElement('span');
    sBranch.className = 'git-branch';
    sBranch.textContent = repo.branch || '';

    const subject = repo.lastSubject || repo.recent?.[0]?.subject || '';
    const sSubj = document.createElement('span');
    sSubj.className = 'git-subj';
    sSubj.textContent = subject.slice(0, 56);
    sSubj.title = `${subject}${repo.lastCommit ? ` (${repo.lastCommit})` : ''}`;

    const sCommits = document.createElement('span');
    sCommits.className = 'git-commits';
    sCommits.title = 'commits in 14d';
    sCommits.textContent = `${repo.commits14d ?? 0}c`;

    const sDirty = document.createElement('span');
    sDirty.className = 'git-dirty';
    sDirty.style.color = repo.dirtyFiles ? 'var(--ember)' : 'var(--ink-faint)';
    sDirty.title = 'dirty files';
    sDirty.textContent = repo.dirtyFiles ? `${repo.dirtyFiles}±` : '·';

    row.append(sRepo, sBranch, sSubj, sCommits, sDirty);
    list.appendChild(row);
  }

  if (dirtyCount > 0) {
    note.style.display = 'inline-block';
    note.textContent = `▲ ${dirtyCount} dirty files across ${repos.filter(r => r.dirtyFiles).length} repos`;
  } else {
    note.style.display = 'none';
  }
}
setInterval(pollGit, 60000);
pollGit();

// ---------- SSE live stream (fixed compactFrame keys) ----------
async function stream() {
  try {
    const res = await fetch('/api/stream');
    if (!res.ok || !res.body) return;
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const frames = buf.split('\n\n');
      buf = frames.pop();
      for (const chunk of frames) {
        const line = chunk.split('\n').find(l => l.startsWith('data:'));
        if (!line) continue;
        try {
          const f = JSON.parse(line.slice(5));
          if (typeof f.busyPct === 'number') cpuHist.push(f.busyPct);
          if (typeof f.packageC === 'number') thermHist.push(f.packageC);
          if (typeof f.memUsedPct === 'number') memHist.push(f.memUsedPct);
          redrawAllCharts();
        } catch {}
      }
    }
  } catch {}
  setTimeout(stream, 4000);
}
stream();

// ---------- Sovereign AI Anomaly Triage ----------
const aiSelect = document.getElementById('ai-provider');
const aiBtn = document.getElementById('ai-analyze-btn');
const aiMeta = document.getElementById('ai-meta');
const aiSummary = document.getElementById('ai-summary');
const aiChips = document.getElementById('ai-chips');
const aiCount = document.getElementById('ai-provider-count');

async function loadProviders() {
  try {
    const data = await fetch('/api/providers').then(r => (r.ok ? r.json() : null));
    if (!data?.providers) return;
    const ready = data.providers.filter(p => p.available && !p.guarded).length;
    aiCount.textContent = `${ready} local provider(s) ready`;
    aiSelect.replaceChildren();
    const autoOpt = document.createElement('option');
    autoOpt.value = 'auto';
    autoOpt.textContent = 'Auto (Best Local Provider)';
    aiSelect.appendChild(autoOpt);
    for (const p of data.providers) {
      const opt = document.createElement('option');
      opt.value = p.id;
      const suffix = !p.available ? ' (offline)' : p.guarded ? ' (guarded)' : '';
      opt.textContent = `${p.label}${suffix}`;
      aiSelect.appendChild(opt);
    }
  } catch {
    aiCount.textContent = 'deterministic rules ready';
  }
}

async function runTriage() {
  aiBtn.disabled = true;
  aiBtn.textContent = 'ANALYZING…';
  try {
    const range = timeMachine.getSelectedEpochs();
    const res = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: aiSelect.value,
        ...(range || {}),
      }),
    });
    const data = await res.json();
    aiMeta.textContent = `Mode: ${data.mode} · Provider: ${data.provider} (${data.model || 'n/a'}) · ${data.latencyMs ?? 0}ms${data.notice ? ` · ${data.notice}` : ''}`;
    aiSummary.textContent = data.summary || 'No summary returned.';
    aiChips.replaceChildren();
    for (const a of (data.anomalies || [])) {
      const chip = document.createElement('span');
      chip.className = `chip ${a.severity === 'high' ? 'gone' : a.severity === 'medium' ? 'warn' : 'neutral'}`;
      chip.textContent = `[${String(a.severity || 'info').toUpperCase()}] ${a.detail}`;
      aiChips.appendChild(chip);
    }
    if (!(data.anomalies || []).length) {
      const ok = document.createElement('span');
      ok.className = 'chip spawn';
      ok.textContent = 'NOMINAL · Zero threshold anomalies detected';
      aiChips.appendChild(ok);
    }
  } catch (err) {
    aiMeta.textContent = `Error: ${err.message}`;
  } finally {
    aiBtn.disabled = false;
    aiBtn.textContent = 'RUN TRIAGE';
  }
}

aiBtn?.addEventListener('click', runTriage);
loadProviders();
