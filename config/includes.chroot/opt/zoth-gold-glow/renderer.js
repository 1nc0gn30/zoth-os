// ── Zoth Gold Aura — canvas renderer (v2.5 Wayland + X11 Cursor Daemon Edition) ──
// Pure rAF particle & sacred geometry reticle engine. Draws a magical gold
// aura around the global cursor: a soft glowing core, counter-rotating sacred
// alchemical rings, a velocity comet ribbon, shockwave pulse rings, and a
// trailing particle stream that intensifies with velocity.
// Fully click-through (the window ignores mouse input) — pure OS layer.

const ipcRenderer = window.zothIpc; // preload bridge (contextIsolation)

const canvas = document.getElementById('aura');
const ctx = canvas.getContext('2d');
let W = 0, H = 0, DPR = Math.min(2, window.devicePixelRatio || 1);

function resize() {
  W = canvas.clientWidth = window.innerWidth;
  H = canvas.clientHeight = window.innerHeight;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resize);
resize();

// ── State ────────────────────────────────────────────────────────────────────
let cursor = { x: W / 2, y: H / 2, tx: W / 2, ty: H / 2, vx: 0, vy: 0, speed: 0 };
let trail = [];
const MAX_TRAIL = 18;
let intensity = 75;          // base aura strength (0-100)
let colorHex = '#ffd700';    // gold
let enabled = true;

// Particle buffer (trail sparkles + shockwaves)
const MAX = 460;
let particles = [];
let sparks = [];
let ripples = [];
let lastWhipRipple = 0;

function makeParticle(x, y, speed) {
  const boost = Math.min(1.5, speed / 1200);
  return {
    x: x + (Math.random() - 0.5) * 8,
    y: y + (Math.random() - 0.5) * 8,
    vx: (Math.random() - 0.5) * (0.7 + boost * 1.8),
    vy: (Math.random() - 0.5) * (0.7 + boost * 1.8) - 0.25,
    life: 1.0,
    decay: 0.018 + Math.random() * 0.028,
    size: 2.2 + Math.random() * 3.2 + boost * 3.8,
    gold: Math.random() > 0.28,
    cyan: Math.random() > 0.88
  };
}

function makeSparks(x, y, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 1.6 + Math.random() * 5.4;
    sparks.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 1.0,
      decay: 0.02 + Math.random() * 0.038,
      size: 1.2 + Math.random() * 2.6
    });
  }
  if (sparks.length > MAX) sparks = sparks.slice(-MAX);
}

function makeRipple(x, y, maxR) {
  ripples.push({ x, y, life: 1.0, maxR: maxR || 140 });
  if (ripples.length > 6) ripples.shift();
}

// ── Cursor polling (Wayland zoth-cursor-daemon HTTP 9989 + X11 fallback) ───
let lastX = cursor.x, lastY = cursor.y, lastT = performance.now();
let pollBusy = false;

function updateCursorTarget(nx, ny) {
  if (nx == null || ny == null || isNaN(nx) || isNaN(ny)) return;
  const now = performance.now();
  const dt = Math.max(1, now - lastT);
  const d = Math.hypot(nx - lastX, ny - lastY);
  cursor.tx = nx;
  cursor.ty = ny;
  cursor.vx = nx - lastX;
  cursor.vy = ny - lastY;
  cursor.speed = (d / dt) * 1000;
  if (d > 2) {
    const count = Math.min(5, Math.ceil(d / 7));
    for (let i = 0; i < count; i++) {
      if (particles.length < MAX) particles.push(makeParticle(nx, ny, cursor.speed));
    }
  }
  if (d > 48 && now - lastWhipRipple > 380) {
    lastWhipRipple = now;
    makeRipple(nx, ny, 130 + Math.min(90, d));
    makeSparks(nx, ny, 12);
  }
  lastX = nx; lastY = ny; lastT = now;
}

function pollCursor() {
  if (pollBusy) return;
  pollBusy = true;
  fetch('http://127.0.0.1:9989/', { cache: 'no-store' })
    .then(r => r.json())
    .then(data => {
      pollBusy = false;
      if (data && typeof data.x === 'number' && typeof data.y === 'number') {
        updateCursorTarget(data.x, data.y);
      }
    })
    .catch(() => {
      pollBusy = false;
      if (ipcRenderer && ipcRenderer.invoke) {
        ipcRenderer.invoke('glow-mouse-location').then((stdout) => {
          if (stdout) {
            const r = {};
            String(stdout).trim().split('\n').forEach((l) => {
              const [k, val] = l.split('=');
              if (k && val) r[k.toLowerCase()] = parseInt(val);
            });
            if (r.x != null && r.y != null) updateCursorTarget(r.x, r.y);
          }
        }).catch(() => {});
      }
    });
}
setInterval(pollCursor, 20);   // 50 Hz non-blocking poll

// ── IPC from main process (toggles / recolor) ─────────────────────────────
if (ipcRenderer && ipcRenderer.on) {
  ipcRenderer.on('aura-state', (_e, s) => { enabled = !!s.enabled; });
  ipcRenderer.on('aura-color', (_e, s) => { colorHex = s.color || '#ffd700'; });
}

// ── Color helpers ────────────────────────────────────────────────────────────
function hexToRgb(h) {
  let s = (h || '#ffd700').replace('#', '');
  if (s.length === 3) s = s.split('').map(c => c + c).join('');
  const n = parseInt(s, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
const smooth = (a, b, k) => a + (b - a) * k;

// ── Render loop ──────────────────────────────────────────────────────────────
let smoothSpeed = 0;
function tick() {
  requestAnimationFrame(tick);
  if (W === 0) return;
  ctx.clearRect(0, 0, W, H);
  if (!enabled) return;

  cursor.x = smooth(cursor.x, cursor.tx, 0.28);
  cursor.y = smooth(cursor.y, cursor.ty, 0.28);
  trail.push({ x: cursor.x, y: cursor.y });
  if (trail.length > MAX_TRAIL) trail.shift();

  smoothSpeed = smooth(smoothSpeed, cursor.speed, 0.22);
  const boost = Math.min(1.4, smoothSpeed / 1200);
  const { r, g, b } = hexToRgb(colorHex);
  const rgb = `${r},${g},${b}`;
  const now = performance.now();

  // 0) Smooth golden comet ribbon along cursor trajectory
  if (trail.length > 2) {
    ctx.save();
    for (let i = 1; i < trail.length; i++) {
      const t = i / trail.length;
      ctx.strokeStyle = `rgba(${rgb},${t * (0.16 + boost * 0.24)})`;
      ctx.lineWidth = t * (3.5 + boost * 4.0);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
      ctx.lineTo(trail[i].x, trail[i].y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 1) Primary aura core (radial gold glow following cursor)
  const coreR = 22 + boost * 42;
  const haloR = 76 + boost * 96;
  const core = ctx.createRadialGradient(cursor.x, cursor.y, 0, cursor.x, cursor.y, haloR);
  core.addColorStop(0, `rgba(${rgb},${(0.55 + intensity / 250)})`);
  core.addColorStop(0.24, `rgba(${rgb},${0.28 + intensity / 400})`);
  core.addColorStop(1, 'rgba(255,215,0,0)');
  ctx.fillStyle = core;
  ctx.beginPath(); ctx.arc(cursor.x, cursor.y, haloR, 0, Math.PI * 2); ctx.fill();

  // 2) Counter-rotating sacred geometry alchemical rings
  const ringPulse = 0.6 + 0.4 * Math.sin(now / 480);
  const rot = now / 900;
  ctx.save();
  ctx.translate(cursor.x, cursor.y);
  ctx.rotate(rot);
  ctx.strokeStyle = `rgba(${rgb},${0.22 + ringPulse * 0.22})`;
  ctx.lineWidth = 1.4;
  ctx.setLineDash([8, 6]);
  ctx.beginPath(); ctx.arc(0, 0, coreR * 1.45, 0, Math.PI * 2); ctx.stroke();
  ctx.rotate(-rot * 1.8);
  ctx.setLineDash([4, 8]);
  ctx.strokeStyle = `rgba(255,250,220,${0.14 + boost * 0.2})`;
  ctx.beginPath(); ctx.arc(0, 0, coreR * 2.05, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // 2b) Expanding shockwave ripples
  for (let i = 0; i < ripples.length; i++) {
    const rp = ripples[i];
    rp.life *= 0.92;
    if (rp.life < 0.02) { ripples.splice(i, 1); i--; continue; }
    const rad = (1 - rp.life) * rp.maxR;
    ctx.strokeStyle = `rgba(${rgb},${rp.life * 0.55})`;
    ctx.lineWidth = Math.max(1, rp.life * 2.8);
    ctx.beginPath(); ctx.arc(rp.x, rp.y, rad, 0, Math.PI * 2); ctx.stroke();
  }

  // 3) Particle trail
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.982; p.vy *= 0.982;
    p.life -= p.decay;
    if (p.life <= 0) { particles.splice(i, 1); i--; continue; }
    const al = p.life * 0.75;
    ctx.fillStyle = p.cyan ? `rgba(0,240,255,${al * 0.85})` : (p.gold ? `rgba(${rgb},${al})` : `rgba(255,255,255,${al * 0.85})`);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4) Fast-motion sparks
  for (let i = 0; i < sparks.length; i++) {
    const s = sparks[i];
    s.x += s.vx; s.y += s.vy; s.life -= s.decay;
    s.vx *= 0.96; s.vy *= 0.96;
    if (s.life <= 0) { sparks.splice(i, 1); i--; continue; }
    ctx.fillStyle = `rgba(${rgb},${s.life * 0.9})`;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}

tick();