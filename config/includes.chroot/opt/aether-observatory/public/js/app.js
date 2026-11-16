// AETHER — main application. Wires telemetry API → constellation, odometers, sonifier, time machine.

import './intro.js';
import { Constellation } from './constellation.js';
import { RotaryKnob, Sonifier } from './sonifier.js';
import { TimeMachine } from './timemachine.js';

// ---------- theme ----------
const root = document.documentElement;
const THEMES = {
  dark: {
    bg0: '#07090E', panel: 'rgba(255,255,255,0.035)', line: 'rgba(255,255,255,0.12)',
    ink: '#E7E2D4', inkDim: '#9BA3B4', inkFaint: '#5C6478',
    gold: '#D4AF37', cyan: '#38BDF8', violet: '#8B5CF6',
    heatWarn: '#F59E0B', heatHot: '#EF4444',
    cat: { noc: '#38BDF8', data: '#34D399', gen: '#F472B6', sec: '#F59E0B', dev: '#A78BFA', unknown: '#94A3B8' }
  },
  light: {
    bg0: '#F7F4EB', panel: 'rgba(17,19,24,0.035)', line: 'rgba(17,19,24,0.12)',
    ink: '#111318', inkDim: '#4A4F5C', inkFaint: '#A0A4B0',
    gold: '#8C6239', cyan: '#0E7FB4', violet: '#6D28D9',
    heatWarn: '#B45309', heatHot: '#B91C1C',
    cat: { noc: '#0E7FB4', data: '#059669', gen: '#BE185D', sec: '#B45309', dev: '#6D28D9', unknown: '#64748B' }
  }
};
function applyPalette() {
  const t = root.dataset.theme === 'light' ? THEMES.light : THEMES.dark;
  window.__AETHER_COLORS = t;
  return t;
}
applyPalette();

const themeBtns = { dark: document.getElementById('theme-dark'), light: document.getElementById('theme-light') };
function setTheme(t) {
  root.dataset.theme = t;
  themeBtns.dark.setAttribute('aria-pressed', String(t === 'dark'));
  themeBtns.light.setAttribute('aria-pressed', String(t === 'light'));
  applyPalette();
  try { localStorage.setItem('aether-theme', t); } catch {}
}
try {
  const urlTheme = new URLSearchParams(location.search).get('theme');
  const saved = (urlTheme === 'light' || urlTheme === 'dark') ? urlTheme : localStorage.getItem('aether-theme');
  if (saved === 'light' || saved === 'dark') setTheme(saved);
} catch {}
themeBtns.dark.addEventListener('click', () => setTheme('dark'));
themeBtns.light.addEventListener('click', () => setTheme('light'));
matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', (e) => setTheme(e.matches ? 'light' : 'dark'));

// viewport hint — touch-aware text (PR 2)
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
  cmd: document.getElementById('d-node-cmd')
};
function showInspector(node) {
  if (!node) { closeDrawer(nodeDrawer); nodeDrawer.setAttribute('aria-hidden', 'true'); return; }
  inspector.name.textContent = node.name;
  const facts = [
    ['PORT', ':' + node.port],
    ['PID', node.pid ?? '—'],
    ['ZOTH TOOL', node.zothTool ? node.zothTool : 'not a Zoth daemon'],
    ['UPTIME', fmtUptime(node.uptimeSec)],
    ['LATENCY', node.latencyMs == null ? '—' : node.latencyMs + ' ms'],
    ['CATEGORY', node.category || '—']
  ];
  inspector.facts.innerHTML = '';
  for (const [k, v] of facts) {
    const dt = document.createElement('dt'); dt.textContent = k;
    const dd = document.createElement('dd'); dd.textContent = v ?? '—';
    inspector.facts.append(dt, dd);
  }
  inspector.cmd.textContent = node.cmdline || '(cmdline unreadable for this process)';
  openDrawer(nodeDrawer);
}
function fmtUptime(s) {
  if (s == null) return '—';
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return (d ? d + 'd ' : '') + (h ? h + 'h ' : '') + m + 'm';
}
const constellation = new Constellation(canvas, brailleEl, applyPalette(), showInspector);
document.getElementById('reset-camera').addEventListener('click', () => constellation.resetCamera());
const modeBtns = [...document.querySelectorAll('.mode-rack button')];
modeBtns.forEach(b => b.addEventListener('click', () => {
  modeBtns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  constellation.setMode(b.dataset.mode);
}));

// ---------- odometers ----------
function renderOdometer(el, value, unitLabel) {
  const units = String(value).padStart(Math.max(2, el.dataset.len || 3), '0').split('');
  const inUnit = el.querySelectorAll('.flap:not(.unit)');
  let changed = false;
  for (let i = 0; i < units.length; i++) {
    let flap = inUnit[i];
    if (!flap) {
      flap = document.createElement('div');
      flap.className = 'flap';
      el.appendChild(flap);
    }
    if (flap.textContent !== units[i]) {
      flap.textContent = units[i];
      flap.classList.remove('flip');
      void flap.offsetWidth; // restart animation
      flap.classList.add('flip');
      changed = true;
    }
  }
  // trim extra flaps
  const all = el.querySelectorAll('.flap:not(.unit)');
  for (let i = units.length; i < all.length; i++) all[i].remove();
  let unit = el.querySelector('.flap.unit');
  if (unitLabel && !unit?.textContent.includes(unitLabel)) {
    if (unit) unit.remove();
    unit = document.createElement('div');
    unit.className = 'flap unit';
    unit.textContent = ' ' + unitLabel;
    el.appendChild(unit);
  }
}
const odoUptime = document.getElementById('odo-uptime');
const odoSockets = document.getElementById('odo-sockets');
const odoThermal = document.getElementById('odo-thermal');
odoUptime.dataset.len = 2; odoSockets.dataset.len = 3; odoThermal.dataset.len = 3;

// ---------- charts ----------
class Ring {
  constructor(n) { this.a = new Array(n).fill(0); this.i = 0; this.n = n; }
  push(v) { this.a[this.i] = v; this.i = (this.i + 1) % this.n; }
  get ordered() { return [...this.a.slice(this.i), ...this.a.slice(0, this.i)]; }
}
const HIST = 90;
const cpuHist = new Ring(HIST), thermHist = new Ring(HIST), memHist = new Ring(HIST);

function drawChart(el, values, { max, stroke, fill }) {
  const ctx = el.getContext('2d');
  const w = el.width = el.clientWidth * (window.devicePixelRatio || 1);
  const h = el.height = 120 * (window.devicePixelRatio || 1);
  ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  const W = el.clientWidth, H = 120;
  ctx.clearRect(0, 0, W, H);
  const vals = values.ordered;
  const n = vals.length;
  const xFor = i => (i / (n - 1)) * W;
  const yFor = v => H - 4 - (Math.min(max, v) / max) * (H - 8);
  if (fill) {
    ctx.beginPath();
    vals.forEach((v, i) => i ? ctx.lineTo(xFor(i), yFor(v)) : ctx.moveTo(xFor(i), yFor(v)));
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
  }
  ctx.beginPath();
  vals.forEach((v, i) => i ? ctx.lineTo(xFor(i), yFor(v)) : ctx.moveTo(xFor(i), yFor(v)));
  ctx.strokeStyle = stroke; ctx.lineWidth = 1.6; ctx.stroke();
}
const chartCpu = document.getElementById('chart-cpu');
const chartThermal = document.getElementById('chart-thermal');
const chartMem = document.getElementById('chart-mem');

// ---------- readings ----------
const R = (id) => document.getElementById(id);
const heatClass = (c) => {
  const p = applyPalette();
  if (c == null) return '#5C6478';
  if (c >= 80) return p.heatHot;
  if (c >= 65) return p.heatWarn;
  return p.cyan;
};

// ---------- sonifier + knobs ----------
const sonifier = new Sonifier(document.getElementById('sono-toggle'), document.getElementById('fft-waterfall'));
const knobEls = document.querySelectorAll('[data-knob]');
const knobs = {};
['pitch', 'harm', 'bright', 'drift'].forEach(k => {
  const el = document.querySelector(`[data-knob="${k}"]`);
  const out = document.getElementById(`kv-${k}`);
  knobs[k] = new RotaryKnob(el, {
    initial: sonifier.params[k],
    onChange: (v) => {
      sonifier.params[k] = Math.round(v);
      out.textContent = Math.round(v);
      sonifier.apply();
    }
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
  diffRange: document.getElementById('tm-diff-range')
});

// ---------- telemetry loop ----------
const livePill = document.getElementById('live-pill-text');
const liveClock = document.getElementById('live-clock');
const sseFallback = { busy: 0 };

function fmtKB(kb) {
  if (kb == null) return '—';
  if (kb > 1024 * 1024) return (kb / 1024 / 1024).toFixed(1) + ' GiB';
  if (kb > 1024) return (kb / 1024).toFixed(0) + ' MiB';
  return kb + ' KiB';
}

async function pollTelemetry() {
  let frame;
  try { frame = await fetch('/api/telemetry/live').then(r => r.json()); }
  catch { return; }
  const f = frame;
  sseFallback.busy = f.cpu?.busyPct ?? 0;

  // pill — interpolated swing between frames
  const busy = f.cpu?.busyPct ?? 0;
  livePill.textContent = (busy >= 0 ? '+' : '') + Math.round(busy) + '%';
  R('r-load1').textContent = f.cpu?.load1?.toFixed(2) ?? '—';
  R('r-load5').textContent = f.cpu?.load5?.toFixed(2) ?? '—';
  R('r-load15').textContent = f.cpu?.load15?.toFixed(2) ?? '—';
  R('r-busy').textContent = busy.toFixed(1) + '%';
  R('r-procs').textContent = f.processCount ?? '—';

  const pkg = f.thermals?.packageC;
  const heat = applyPalette();
  R('r-pkg').textContent = pkg != null ? pkg.toFixed(1) + '°C' : '—';
  R('r-pkg').style.background = pkg != null ? heatClass(pkg) + '22' : 'transparent';
  R('r-pkg').style.color = pkg != null ? heatClass(pkg) : '';
  const hottest = (f.thermals?.zones ?? []).reduce((a, z) => z.tempC > (a?.tempC ?? -Infinity) ? z : a, null);
  R('r-zone').textContent = hottest ? `${hottest.tempC.toFixed(1)}°C` : '—';
  R('r-fan').textContent = f.fanRpm != null ? f.fanRpm + ' rpm' : '—';
  R('r-ram').textContent = f.memory ? fmtKB(f.memory.usedKb) + ' / ' + fmtKB(f.memory.totalKb) : '—';
  R('r-swap').textContent = f.memory?.swapTotalKb ? fmtKB(f.memory.swapUsedKb) + ' / ' + fmtKB(f.memory.swapTotalKb) : '—';

  cpuHist.push(busy);
  thermHist.push(pkg ?? 0);
  memHist.push(f.memory?.usedPct ?? 0);

  renderOdometer(odoUptime, Math.floor((f.uptimeSec ?? 0) / 3600) % 100, 'HR');
  renderOdometer(odoSockets, f.listening?.count ?? 0, null);
  renderOdometer(odoThermal, Math.round(pkg ?? 0), '°C');

  sonifier.telemetry(f);

  const colors = applyPalette();
  drawChart(chartCpu, cpuHist, { max: 100, stroke: colors.gold, fill: colors.gold + '18' });
  drawChart(chartThermal, thermHist, { max: 100, stroke: colors.cyan, fill: colors.cyan + '14' });
  drawChart(chartMem, memHist, { max: 100, stroke: colors.violet, fill: colors.violet + '12' });
}
setInterval(pollTelemetry, 2000);
pollTelemetry();

// clock — cadenced, not fake
function tickClock() {
  liveClock.textContent = new Date().toTimeString().slice(0, 8);
}
tickClock();
setInterval(tickClock, 1000);

// ---------- constellation nodes ----------
async function pollNodes() {
  let nodes;
  try { nodes = await fetch('/api/constellation/nodes').then(r => r.json()); }
  catch { return; }
  constellation.setNodes((nodes.nodes || []).map(n => ({ ...n, category: n.category || '' })));
  window.__constellation = window.__constellation || constellation;
  window.__nodeCount = constellation.nodes.length;
  window.__nodeSample = constellation.nodes.slice(0, 4).map(n => ({ k: n.key, r: n.radius?.toFixed(2), s: n.speed?.toFixed(3) }));
  // ▶ PROBE HOOK: persist latest constellation state to localStorage (for CDP probing)
  window.__lastProjection = () => constellation.nodes.slice(0, 8).map(n => ({ k: n.key, sx: n.screenX, sy: n.screenY, depth: n.depth?.toFixed(2), color: constellation.nodeColor(n), mode: constellation.mode }));
}
setInterval(pollNodes, 8000);
pollNodes();

// ---------- git pulse ----------
async function pollGit() {
  let data;
  try { data = await fetch('/api/git/pulse').then(r => r.json()); }
  catch { return; }
  const list = document.getElementById('git-list');
  list.innerHTML = '';
  const note = document.getElementById('git-dirty-note');
  const repos = (data.repos || []).slice(0, 7);
  let dirtyCount = 0;
  for (const repo of repos) {
    dirtyCount += repo.dirtyFiles ?? 0;
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:baseline;gap:var(--sp-3);padding:var(--sp-2) 0;border-bottom:1px solid var(--line)';
    row.innerHTML = `
      <span style="font-family:var(--font-mono);font-size:11px;color:var(--ink-dim);min-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${repo.repo}</span>
      <span style="font-family:var(--font-mono);font-size:10px;color:var(--gold);min-width:36px">${repo.branch || ''}</span>
      <span style="flex:1;font-size:12px;color:var(--ink-dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${repo.lastCommit ?? ''}">${repo.lastCommit?.message?.slice(0, 40) ?? ''}</span>
      <span style="font-family:var(--font-mono);font-size:11px;color:var(--cyan)" title="commits in 14d">${repo.commits14d ?? 0}ᶜ</span>
      <span style="font-family:var(--font-mono);font-size:11px;color:${repo.dirtyFiles ? 'var(--heat-warn)' : 'var(--ink-faint)'}" title="dirty files">${repo.dirtyFiles ? repo.dirtyFiles + '±' : '·'}</span>`;
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

// ---------- SSE stream over polling ---
async function stream() {
  try {
    const res = await fetch('/api/stream');
    if (!res.body) return;
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
          cpuHist.push(f.cpuBusy);
          thermHist.push(f.pkgC);
          memHist.push(f.memPct);
          sseFallback.busy = f.cpuBusy;
        } catch {}
      }
    }
  } catch {}
  setTimeout(stream, 4000); // reconnect
}
stream();
