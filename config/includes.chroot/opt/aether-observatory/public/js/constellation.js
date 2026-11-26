// AETHER 3D constellation — real daemon/port orbital graph, three render pipelines.
// Full 360-degree golden-angle concentric orbits, live dual-theme sync, interactive Braille mode.

const GOLDEN_ANGLE = 2.399963229728653;

export class Constellation {
  constructor(canvas, brailleEl, cssColors, onSelect) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.brailleEl = brailleEl;
    this.colors = cssColors;
    this.onSelect = onSelect;

    // camera
    this.yaw = 0.45; this.pitch = 0.48; this.dist = 8.4;
    this.tgtYaw = this.yaw; this.tgtPitch = this.pitch; this.tgtDist = this.dist;

    // scene
    this.mode = 'vector';
    this.nodes = [];
    this.stars = [];
    this.selected = null;
    this.hover = null;
    this.spinning = true;

    this.mouse = { x: -1, y: -1, down: false, lastX: 0, lastY: 0, dragged: false };

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement);
    this.resize();
    this.seedStars();
    this.bind();
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  setColors(colors) {
    this.colors = colors;
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener('pointerdown', this._pd);
    window.removeEventListener('pointermove', this._pm);
    window.removeEventListener('pointerup', this._pu);
    this.canvas.removeEventListener('wheel', this._wh);
  }

  seedStars() {
    let s = 4242;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    this.stars = Array.from({ length: 240 }, () => {
      const a = rnd() * Math.PI * 2;
      const e = rnd() * 0.9 - 0.45;
      const r = 9.5 + rnd() * 14;
      return {
        x: r * Math.cos(a) * Math.cos(e),
        y: r * Math.sin(e) * 0.65,
        z: r * Math.sin(a) * Math.cos(e),
        w: 0.7 + rnd() * 1.4,
        tw: rnd() * Math.PI * 2,
      };
    });
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.w = Math.max(2, Math.floor(rect.width));
    this.h = Math.max(2, Math.floor(rect.height));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.dpr = dpr;
    this.brailleEl.style.setProperty('font-size', `${Math.max(7, Math.floor(this.h / 58))}px`);
  }

  bind() {
    this._pd = (e) => {
      this.mouse.down = true;
      this.mouse.lastX = e.clientX; this.mouse.lastY = e.clientY;
      this.mouse.dragged = false;
      this.canvas.setPointerCapture(e.pointerId);
      this.canvas.classList.add('dragging');
    };
    this._pm = (e) => {
      const r = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - r.left; this.mouse.y = e.clientY - r.top;
      if (!this.mouse.down) return;
      const dx = e.clientX - this.mouse.lastX, dy = e.clientY - this.mouse.lastY;
      this.mouse.lastX = e.clientX; this.mouse.lastY = e.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 2) this.mouse.dragged = true;
      this.tgtYaw += dx * 0.0062;
      this.tgtPitch = Math.max(-1.05, Math.min(1.2, this.tgtPitch - dy * 0.0052));
      this.spinning = false;
    };
    this._pu = () => {
      if (!this.mouse.down) return;
      this.mouse.down = false;
      this.canvas.classList.remove('dragging');
      if (!this.mouse.dragged) this.handleClick();
    };
    this._wh = (e) => {
      e.preventDefault();
      this.tgtDist = Math.max(3.2, Math.min(16, this.tgtDist + e.deltaY * 0.008));
      this.spinning = false;
    };
    this.canvas.addEventListener('pointerdown', this._pd);
    window.addEventListener('pointermove', this._pm);
    window.addEventListener('pointerup', this._pu);
    this.canvas.addEventListener('wheel', this._wh, { passive: false });
  }

  // ---------- data (true 360° golden-angle concentric orbits) ----------
  setNodes(nodes) {
    const prev = new Map(this.nodes.map(n => [n.key, n]));
    const total = Math.max(1, nodes.length);
    this.nodes = nodes.map((n, i) => {
      const key = `${n.port}:${n.pid ?? '?'}:${n.proto ?? 'tcp'}`;
      const old = prev.get(key);
      // Spread uniformly around full 2π using golden angle + tiered orbital shells
      const phase = old?.phase ?? ((i * GOLDEN_ANGLE) % (Math.PI * 2));
      const shell = n.zothTool
        ? 2.1 + (i % 4) * 0.55
        : 3.6 + ((i / total) * 2.1);
      const radius = old?.radius ?? shell;
      const incline = old?.incline ?? (((i % 7) - 3) * 0.28);
      const speed = old?.speed ?? (n.zothTool ? 0.085 : 0.055) * (i % 2 === 0 ? 1 : 0.82);
      const pulse = old?.pulse ?? ((i * 1.13) % (Math.PI * 2));
      return { ...n, key, phase, radius, incline, speed, pulse, screenX: 0, screenY: 0, depth: 0 };
    });
    if (this.selected) {
      const still = this.nodes.find(n => n.key === this.selected.key);
      this.selected = still || null;
    }
  }

  resetCamera() {
    this.tgtYaw = 0.45;
    this.tgtPitch = 0.48;
    this.tgtDist = 8.4;
    this.selected = null;
    this.spinning = true;
    this.onSelect?.(null);
  }

  setMode(mode) {
    this.mode = mode;
    const showBraille = mode === 'braille';
    this.brailleEl.style.display = showBraille ? 'block' : 'none';
    // Keep canvas interactive via opacity:0 instead of visibility:hidden
    this.canvas.style.opacity = showBraille ? '0' : '1';
    if (!showBraille) this.brailleEl.textContent = '';
  }

  project(vx, vy, vz) {
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    const cx = Math.cos(this.pitch), sx = Math.sin(this.pitch);
    const x = vx * cy - vz * sy;
    const z = vx * sy + vz * cy;
    const y = vy;
    const y2 = y * cx - z * sx;
    const z2 = y * sx + z * cx;
    const denom = Math.max(0.8, this.dist + z2);
    const scale = (Math.min(this.w, this.h) * 0.68) / denom;
    return {
      x: this.w / 2 + x * scale,
      y: this.h / 2 + y2 * scale,
      depth: z2,
      scale,
    };
  }

  handleClick() {
    let best = null, bestD = 28;
    for (const n of this.nodes) {
      const d = Math.hypot(n.screenX - this.mouse.x, n.screenY - this.mouse.y);
      if (d < bestD) { bestD = d; best = n; }
    }
    if (best) {
      this.selected = best;
      this.tgtDist = Math.max(4.4, best.radius + 2.4);
      this.onSelect?.(best);
    } else if (this.selected) {
      this.selected = null;
      this.spinning = true;
      this.onSelect?.(null);
    }
  }

  frame(t) {
    const dt = Math.min(0.05, (t - (this._lt || t)) / 1000);
    this._lt = t;

    const lerp = (a, b, k) => a + (b - a) * Math.min(1, k * (dt * 60));
    this.yaw = lerp(this.yaw, this.tgtYaw, 0.12);
    this.pitch = lerp(this.pitch, this.tgtPitch, 0.12);
    this.dist = lerp(this.dist, this.tgtDist, 0.1);
    if (this.spinning) this.tgtYaw += dt * 0.045;

    for (const n of this.nodes) {
      n.phase += n.speed * dt;
      n.x = n.radius * Math.cos(n.phase);
      n.z = n.radius * Math.sin(n.phase);
      n.y = Math.sin(n.phase + n.pulse) * (0.65 + Math.abs(n.incline) * 1.4) + n.incline;
      const p = this.project(n.x, n.y, n.z);
      n.screenX = p.x; n.screenY = p.y; n.depth = p.depth; n.proj = p;
    }

    this.starProj = this.stars.map(s => {
      const p = this.project(s.x, s.y, s.z);
      return { ...s, px: p.x, py: p.y, depth: p.depth };
    });

    this.ctx.save();
    this.ctx.scale(this.dpr, this.dpr);
    const isLight = document.documentElement.dataset.theme === 'light';
    this.ctx.fillStyle = this.mode === 'dither' ? (isLight ? '#F2EEE1' : '#05070B') : this.colors.bg0;
    this.ctx.fillRect(0, 0, this.w, this.h);

    const sorted = [...this.nodes].sort((a, b) => a.depth - b.depth);
    if (this.mode === 'vector') this.renderVector(t, sorted);
    else if (this.mode === 'braille') this.renderBraille(t, sorted);
    else this.renderDither(t, sorted, isLight);

    this.ctx.restore();
    this.raf = requestAnimationFrame((tt) => this.frame(tt));
  }

  renderVector(t, sorted) {
    const { ctx, w, h } = this;

    // Subtle concentric orbital reference rings
    const core = this.project(0, 0, 0);
    ctx.strokeStyle = this.colorWithAlpha(this.colors.inkDim, 0.12);
    ctx.lineWidth = 0.8;
    for (const r of [2.4, 3.8, 5.2]) {
      ctx.beginPath();
      for (let k = 0; k <= 48; k++) {
        const ang = (k / 48) * Math.PI * 2;
        const p = this.project(r * Math.cos(ang), 0, r * Math.sin(ang));
        if (k === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    // Starfield dust (fixed hex alpha conversion)
    for (const s of this.starProj) {
      if (s.px < 0 || s.px > w || s.py < 0 || s.py > h) continue;
      const a = 0.08 + 0.14 * Math.abs(Math.sin(t / 900 + s.tw));
      ctx.fillStyle = this.colorWithAlpha(this.colors.ink, a);
      ctx.fillRect(Math.floor(s.px), Math.floor(s.py), s.w, s.w);
    }

    // Depth-sorted edges and orbital nodes
    for (const n of sorted) {
      const depthFade = Math.max(0.42, Math.min(1, 1 - (n.depth + 4) / 18));
      const col = this.nodeColor(n);
      ctx.strokeStyle = this.colorWithAlpha(col, 0.34 * depthFade);
      ctx.lineWidth = n.zothTool ? 1.15 : 0.75;
      ctx.beginPath();
      ctx.moveTo(core.x, core.y);
      ctx.lineTo(n.screenX, n.screenY);
      ctx.stroke();

      const haloR = (n.zothTool ? 7.5 : 5.2) + 1.6 * Math.sin(t / 340 + n.pulse);
      ctx.strokeStyle = this.colorWithAlpha(col, 0.5 * depthFade);
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(n.screenX, n.screenY, haloR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(n.screenX, n.screenY, n.zothTool ? 4.8 : 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = this.colors.bg0 === '#07090E' ? '#FFFFFF' : '#FCFAF4';
      ctx.beginPath();
      ctx.arc(n.screenX, n.screenY, n.zothTool ? 1.7 : 1.1, 0, Math.PI * 2);
      ctx.fill();

      if (this.selected?.key === n.key) {
        ctx.strokeStyle = this.colors.gold;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(n.screenX, n.screenY, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = this.colorWithAlpha(this.colors.gold, 0.75);
        ctx.beginPath();
        ctx.moveTo(core.x, core.y);
        ctx.lineTo(n.screenX, n.screenY);
        ctx.stroke();
      }
    }

    // Singularity host core
    ctx.fillStyle = this.colors.gold;
    ctx.shadowColor = this.colors.gold;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(core.x, core.y, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = this.colors.cyan;
    ctx.beginPath();
    ctx.arc(core.x, core.y, 2, 0, Math.PI * 2);
    ctx.fill();

    // Decluttered labels (selected first, then well-separated Zoth/front nodes)
    ctx.font = '600 10px monospace';
    ctx.textAlign = 'center';
    const drawn = [];
    const minGap = 72;
    const labelNode = (n, strong = false) => {
      if (n.screenX < 44 || n.screenX > w - 44 || n.screenY < 26 || n.screenY > h - 30) return;
      if (!strong && drawn.some(d => Math.hypot(d.x - n.screenX, d.y - n.screenY) < minGap)) return;
      const dx = n.screenX - core.x, dy = n.screenY - core.y;
      const len = Math.max(1, Math.hypot(dx, dy));
      const lx = Math.max(48, Math.min(w - 48, n.screenX + (dx / len) * 22));
      const ly = Math.max(20, Math.min(h - 24, n.screenY + (dy / len) * 22));
      const txt = n.name.length > 15 ? n.name.slice(0, 14) + '…' : n.name;
      const portTxt = ':' + n.port;
      const boxW = Math.max(ctx.measureText(txt).width, ctx.measureText(portTxt).width) + 10;

      ctx.fillStyle = this.colorWithAlpha(this.colors.bg0, 0.78);
      ctx.fillRect(lx - boxW / 2, ly - 10, boxW, 25);
      ctx.fillStyle = this.colorWithAlpha(this.colors.ink, strong ? 1 : 0.9);
      ctx.fillText(txt, lx, ly);
      ctx.fillStyle = this.colorWithAlpha(this.colors.cyan, strong ? 1 : 0.92);
      ctx.fillText(portTxt, lx, ly + 11);
      drawn.push({ x: n.screenX, y: n.screenY });
    };

    if (this.selected) labelNode(this.selected, true);
    const labelOrder = [...sorted].sort((a, b) => (Number(b.zothTool) - Number(a.zothTool)) || (b.depth - a.depth));
    for (const n of labelOrder) {
      if (drawn.length >= 8) break;
      if (this.selected?.key === n.key) continue;
      labelNode(n, false);
    }
  }

  renderBraille(t, sorted) {
    const CELL_W = 6, CELL_H = 8;
    const cols = Math.max(10, Math.floor(this.w / CELL_W));
    const rows = Math.max(10, Math.floor(this.h / CELL_H));
    const grid = Array.from({ length: rows }, () => new Uint8Array(cols * 8));

    const paint = (x, y, bit) => {
      const cx = (x / CELL_W) | 0;
      if (cx < 0 || cx >= cols) return;
      const subY = (y / (CELL_H / 4)) | 0;
      if (subY < 0) return;
      const row = subY >> 2;
      const dotRow = subY & 3;
      const dotCol = (x / (CELL_W / 2)) | 0;
      const dc = dotCol & 1;
      if (row < 0 || row >= rows) return;
      const dot = dc === 0
        ? (dotRow === 0 ? 0 : dotRow === 1 ? 1 : dotRow === 2 ? 2 : 6)
        : (dotRow === 0 ? 3 : dotRow === 1 ? 4 : dotRow === 2 ? 5 : 7);
      grid[row][cx * 8 + dot] |= bit;
    };

    for (const s of this.starProj) {
      if (s.px >= 0 && s.px < this.w && s.py >= 0 && s.py < this.h) paint(s.px, s.py, 1);
    }
    const core = this.project(0, 0, 0);
    for (const n of sorted) {
      const steps = Math.max(1, Math.ceil(Math.hypot(n.screenX - core.x, n.screenY - core.y) / 4));
      for (let i = 0; i <= steps; i++) {
        const f = i / steps;
        paint(core.x + (n.screenX - core.x) * f, core.y + (n.screenY - core.y) * f, 1);
      }
      for (let ox = -2; ox <= 2; ox++) {
        for (let oy = -2; oy <= 2; oy++) {
          if (ox * ox + oy * oy <= 4) paint(n.screenX + ox, n.screenY + oy, 1);
        }
      }
      if (this.selected?.key === n.key) {
        for (let a = 0; a < Math.PI * 2; a += 0.25) paint(n.screenX + 12 * Math.cos(a), n.screenY + 12 * Math.sin(a), 1);
      }
    }
    for (let a = 0; a < Math.PI * 2; a += 0.35) paint(core.x + 7 * Math.cos(a), core.y + 7 * Math.sin(a), 1);

    let out = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let bits = 0;
        for (let d = 0; d < 8; d++) bits |= grid[r][c * 8 + d] ? (1 << d) : 0;
        out += String.fromCharCode(0x2800 + bits);
      }
      out += '\n';
    }
    this.brailleEl.textContent = out;
    this.brailleEl.style.color = this.colors.cyan;
  }

  renderDither(t, sorted, isLight) {
    const { ctx, w, h } = this;
    const BAYER = [
      0, 32, 8, 40, 2, 34, 10, 42,
      48, 16, 56, 24, 50, 18, 58, 26,
      12, 44, 4, 36, 14, 46, 6, 38,
      60, 28, 52, 20, 62, 30, 54, 22,
      3, 35, 11, 43, 1, 33, 9, 41,
      51, 19, 59, 27, 49, 17, 57, 25,
      15, 47, 7, 39, 13, 45, 5, 37,
      63, 31, 55, 23, 61, 29, 53, 21,
    ];

    const off = this._off || (this._off = document.createElement('canvas'));
    if (off.width !== w || off.height !== h) { off.width = w; off.height = h; }
    const octx = off.getContext('2d');
    octx.fillStyle = '#000'; octx.fillRect(0, 0, w, h);
    octx.fillStyle = '#fff';
    for (const s of this.starProj) {
      if (s.px < 0 || s.px > w || s.py < 0 || s.py > h) continue;
      octx.globalAlpha = 0.4 + 0.35 * Math.abs(Math.sin(t / 900 + s.tw));
      octx.fillRect(s.px, s.py, 2, 2);
    }
    octx.globalAlpha = 1;
    octx.strokeStyle = 'rgba(255,255,255,0.6)';
    octx.lineWidth = 1.2;
    const core = this.project(0, 0, 0);
    for (const n of sorted) {
      octx.beginPath(); octx.moveTo(core.x, core.y); octx.lineTo(n.screenX, n.screenY); octx.stroke();
      octx.beginPath(); octx.arc(n.screenX, n.screenY, 6 + 2 * Math.sin(t / 300 + n.pulse), 0, Math.PI * 2); octx.fill();
    }

    const V = 3;
    const vw = Math.ceil(w / V), vh = Math.ceil(h / V);
    const img = octx.getImageData(0, 0, w, h).data;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = isLight ? '#F2EEE1' : '#05070B';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = isLight ? '#0B7498' : this.colors.cyan;
    for (let yy = 0; yy < vh; yy++) {
      for (let xx = 0; xx < vw; xx++) {
        const px = Math.min(w - 1, xx * V), py = Math.min(h - 1, yy * V);
        const idx = (py * w + px) * 4;
        const luma = (img[idx] * 0.299 + img[idx + 1] * 0.587 + img[idx + 2] * 0.114) / 255;
        const threshold = (BAYER[(yy % 8) * 8 + (xx % 8)] + 0.5) / 64;
        if (luma > threshold) ctx.fillRect(xx * V, yy * V, V, V);
      }
    }
    ctx.globalAlpha = isLight ? 0.06 : 0.14;
    ctx.fillStyle = '#000';
    for (let y = 0; y < h; y += 2) ctx.fillRect(0, y, w, 1);
    ctx.globalAlpha = 1;
  }

  nodeColor(n) {
    const c = this.colors.cat;
    if (n.zothTool) {
      const cat = (n.category || '').toLowerCase();
      if (cat.includes('network')) return c.noc;
      if (cat.includes('data')) return c.data;
      if (cat.includes('generat') || cat.includes('media')) return c.gen;
      if (cat.includes('security')) return c.sec;
      return c.dev;
    }
    const isLight = document.documentElement.dataset.theme === 'light';
    const hue = (n.port * 137.508) % 360;
    return `hsl(${hue.toFixed(0)}, ${isLight ? '65%' : '72%'}, ${isLight ? '38%' : '62%'})`;
  }

  colorWithAlpha(col, a) {
    if (!col) return `rgba(128,128,128,${a})`;
    if (col.startsWith('#')) {
      const r = parseInt(col.slice(1, 3), 16);
      const g = parseInt(col.slice(3, 5), 16);
      const b = parseInt(col.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${a})`;
    }
    if (col.startsWith('hsl(')) return col.replace('hsl(', 'hsla(').replace(')', `,${a})`);
    if (col.startsWith('rgb(')) return col.replace('rgb(', 'rgba(').replace(')', `,${a})`);
    return col;
  }
}
