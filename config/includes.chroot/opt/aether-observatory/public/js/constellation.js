// AETHER 3D constellation — real daemon/port orbital graph, three render pipelines.
// Physics-driven orbit/velocity (no fixed-position mockups). Renderers: VEC / BRAILLE / DITHER.

export class Constellation {
  constructor(canvas, brailleEl, cssColors, onSelect) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.brailleEl = brailleEl;
    this.colors = cssColors;           // resolved theme palette {gold, cyan, ink, heat:{...}, cat:{...}}
    this.onSelect = onSelect;

    // camera
    this.yaw = 0.45; this.pitch = 0.55; this.dist = 7.6;
    this.tgtYaw = this.yaw; this.tgtPitch = this.pitch; this.tgtDist = this.dist;

    // scene
    this.mode = 'vector';           // 'vector' | 'braille' | 'dither'
    this.nodes = [];                // live daemons
    this.stars = [];                // static starfield backdrop
    this.selected = null;           // focused node id
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

  destroy() {
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener('pointerdown', this._pd);
    window.removeEventListener('pointermove', this._pm);
    window.removeEventListener('pointerup', this._pu);
    this.canvas.removeEventListener('wheel', this._wh);
  }

  seedStars() {
    this.stars = Array.from({ length: 260 }, (_, i) => {
      const a = Math.random() * Math.PI * 2, e = Math.random() * 0.9 - 0.45;
      const r = 9 + Math.random() * 14;
      return {
        x: r * Math.cos(a) * Math.cos(e), y: r * Math.sin(e) * 0.6, z: r * Math.sin(a) * Math.cos(e),
        w: 0.4 + Math.random() * 1.6, tw: Math.random() * Math.PI * 2
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
    this.brailleEl.style.setProperty('font-size', `${Math.max(6, Math.floor(this.h / 62))}px`);
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
    this._pu = (e) => {
      if (!this.mouse.down) return;
      this.mouse.down = false;
      this.canvas.classList.remove('dragging');
      if (!this.mouse.dragged) this.handleClick();
    };
    this._wh = (e) => {
      e.preventDefault();
      this.tgtDist = Math.max(2.9, Math.min(16, this.tgtDist + e.deltaY * 0.008));
      this.spinning = false;
    };
    this.canvas.addEventListener('pointerdown', this._pd);
    window.addEventListener('pointermove', this._pm);
    window.addEventListener('pointerup', this._pu);
    this.canvas.addEventListener('wheel', this._wh, { passive: false });
  }

  // ---------- data ----------
  setNodes(nodes) {
    // upsert by port+pid; preserve orbital phase if the node already exists
    const prev = new Map(this.nodes.map(n => [n.port + ':' + n.pid, n]));
    let i = 0;
    this.nodes = nodes.map(n => {
      const key = n.port + ':' + (n.pid ?? '?');
      const old = prev.get(key);
      const phase = old?.phase ?? (i * 2 * Math.PI / nodes.length) + Math.random() * 0.3;
      const radius = old?.radius ?? (2.8 + 3.8 * ((i % 7) / 7) + Math.random() * 1.2);
      const speed = old?.speed ?? (0.10 + 0.05 * ((i % 3) / 3));
      return { ...n, key, phase, radius, speed, pulse: Math.random() * Math.PI * 2, screenX: 0, screenY: 0, depth: 0 };
    });
    if (this.selected && !this.nodes.find(n => n.key === this.selected.key)) this.selected = null;
  }

  resetCamera() {
    this.tgtYaw = Math.random() * Math.PI * 2;
    this.tgtPitch = 0.55; this.tgtDist = 7.6;
    this.selected = null; this.spinning = true;
    this.onSelect?.(null);
  }

  setMode(mode) {
    this.mode = mode;
    const showBraille = mode === 'braille';
    this.brailleEl.style.display = showBraille ? 'block' : 'none';
    this.canvas.style.visibility = showBraille ? 'hidden' : 'visible';
    if (!showBraille) this.brailleEl.textContent = '';
  }

  // ---------- projection ----------
  project(vx, vy, vz) {
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    const cx = Math.cos(this.pitch), sx = Math.sin(this.pitch);
    // yaw about Y
    let x = vx * cy - vz * sy, z = vx * sy + vz * cy, y = vy;
    // pitch about X
    const y2 = y * cx - z * sx, z2 = y * sx + z * cx;
    const dist = this.dist;
    const scale = (this.h * 0.62) / (dist + z2);
    return {
      x: this.w / 2 + x * scale,
      y: this.h / 2 + y2 * scale,
      depth: z2,
      scale
    };
  }

  // ---------- interaction ----------
  handleClick() {
    // pick nearest projected node within 26px
    let best = null, bestD = 26;
    for (const n of this.nodes) {
      const d = Math.hypot(n.screenX - this.mouse.x, n.screenY - this.mouse.y);
      if (d < bestD) { bestD = d; best = n; }
    }
    if (best) {
      this.selected = best;
      this.tgtDist = Math.max(3.4, best.radius + 1.6);
      this.onSelect?.(best);
    } else if (this.selected) {
      this.selected = null; this.spinning = true;
      this.onSelect?.(null);
    }
  }

  // ---------- pipeline renderers ----------
  frame(t) {
    const dt = Math.min(0.05, (t - (this._lt || t)) / 1000);
    this._lt = t;

    // ease camera
    const lerp = (a, b, k) => a + (b - a) * Math.min(1, k * (dt * 60));
    this.yaw = lerp(this.yaw, this.tgtYaw, 0.12);
    this.pitch = lerp(this.pitch, this.tgtPitch, 0.12);
    this.dist = lerp(this.dist, this.tgtDist, 0.1);
    if (this.spinning) this.tgtYaw += dt * 0.04; // gentle rotation

    // update orbital physics — always moving
    if (!this._dbg) this._dbg = 0;
    for (const n of this.nodes) {
      n.phase += n.speed * dt;
      n.x = n.radius * Math.cos(n.phase);
      n.y = Math.sin(n.phase * 0.7 + n.pulse) * (1.2 + n.radius * 0.3); // more y spread
      n.z = n.radius * Math.sin(n.phase);
      const p = this.project(n.x, n.y, n.z);
      n.screenX = p.x; n.screenY = p.y; n.depth = p.depth; n.proj = p;
    }
    // backdrop stars — static world coords, projection handles motion
    this.starProj = this.stars.map(s => {
      const p = this.project(s.x, s.y, s.z);
      return { ...s, px: p.x, py: p.y, depth: p.depth };
    });

    this.ctx.save();
    this.ctx.scale(this.dpr, this.dpr);
    // theme-appropriate clear
    this.ctx.fillStyle = this.mode === 'dither' ? '#000000' : this.colors.bg0;
    this.ctx.fillRect(0, 0, this.w, this.h);

    const sorted = [...this.nodes].sort((a, b) => a.depth - b.depth); // far first (depth-sorted edges)

    if (this.mode === 'vector') this.renderVector(t, sorted);
    else if (this.mode === 'braille') this.renderBraille(t, sorted);
    else this.renderDither(t, sorted);

    this.ctx.restore();
    this.raf = requestAnimationFrame((tt) => this.frame(tt));
  }

  renderVector(t, sorted) {
    const { ctx, w, h } = this;
    // starfield dust
    for (const s of this.starProj) {
      if (s.px < 0 || s.px > w || s.py < 0 || s.py > h) continue;
      const a = 0.05 + 0.08 * Math.abs(Math.sin(t / 900 + s.tw));
      ctx.fillStyle = this.colors.ink.replace(')', `,${a * 0.4})`).replace('rgb', 'rgba');
      ctx.fillRect(Math.floor(s.px), Math.floor(s.py), s.w, s.w);
    }
    // edges: core to each node, depth-sorted
    const core = this.project(0, 0, 0);
    for (const n of sorted) {
      const depthFade = Math.max(0.6, 1 - (n.depth + 3) / 18);
      ctx.strokeStyle = this.colorWithAlpha(this.nodeColor(n), 0.7 * depthFade);
      ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(core.x, core.y); ctx.lineTo(n.screenX, n.screenY); ctx.stroke();

      // halo ring
      ctx.strokeStyle = this.colorWithAlpha(this.nodeColor(n), 0.55 * depthFade);
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(n.screenX, n.screenY, 6 + 2 * Math.sin(t / 300 + n.pulse), 0, Math.PI * 2); ctx.stroke();

      // solid node body with hot core
      ctx.fillStyle = this.nodeColor(n);
      ctx.beginPath(); ctx.arc(n.screenX, n.screenY, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(n.screenX, n.screenY, 1.6, 0, Math.PI * 2); ctx.fill();

      // selected — beam ring
      if (this.selected?.key === n.key) {
        ctx.strokeStyle = this.colors.gold;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.arc(n.screenX, n.screenY, 15, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        // radial beam
        const p = this.project(0, 0, 0);
        ctx.strokeStyle = this.colorWithAlpha(this.colors.gold, 0.55);
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(n.screenX, n.screenY); ctx.stroke();
      }
    }
    // singularity core
    ctx.fillStyle = this.colors.gold;
    ctx.shadowColor = this.colors.gold; ctx.shadowBlur = 22;
    ctx.beginPath(); ctx.arc(core.x, core.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = this.colors.cyan;
    ctx.beginPath(); ctx.arc(core.x, core.y, 1.6, 0, Math.PI * 2); ctx.fill();
    // labels — only for selected, plus nodes with clear separation from each other
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    const drawn = [];
    const minGap = 48;
    const labelNode = (n, strong = false) => {
      // declutter: skip if any prior label within minGap
      if (!strong && drawn.some(d => Math.hypot(d.x - n.screenX, d.y - n.screenY) < minGap)) return;
      const dx = n.screenX - core.x, dy = n.screenY - core.y;
      const len = Math.max(1, Math.hypot(dx, dy));
      const ox = (dx / len) * 26;
      const oy = (dy / len) * 26;
      const fontPx = 10;
      const alpha = strong ? 1 : 0.85;
      ctx.fillStyle = this.colorWithAlpha(this.colors.ink, alpha);
      ctx.fillText(n.name.length > 14 ? n.name.slice(0, 13) + '…' : n.name, n.screenX + ox, n.screenY + oy);
      ctx.fillStyle = this.colorWithAlpha(this.colors.cyan, alpha);
      ctx.fillText(':' + n.port, n.screenX + ox, n.screenY + oy + fontPx + 2);
      drawn.push({ x: n.screenX, y: n.screenY });
    };
    if (this.selected) {
      const sn = { ...this.selected };
      const proj = this.project(sn.x, sn.y, sn.z);
      sn.screenX = proj.x; sn.screenY = proj.y;
      labelNode(sn, true);
    }
    sorted.slice(0, 6).forEach(n => {
      if (this.selected?.key === n.key) return;
      labelNode(n, false);
    });
  }

  renderBraille(t, sorted) {
    // rasterize to a coarse pixel grid, map each 2x4 cell to a braille glyph
    const CELL_W = 6, CELL_H = 8;
    const cols = Math.floor(this.w / CELL_W), rows = Math.floor(this.h / CELL_H);
    const grid = [];
    for (let r = 0; r < rows; r++) grid.push(new Uint8Array(cols * 8));

    const paint = (x, y, bit) => {
      const cx = (x / CELL_W) | 0;
      if (cx < 0 || cx >= cols) return;
      const subY = (y / (CELL_H / 4)) | 0;
      if (subY < 0) return;
      const row = subY >> 2; const dotRow = subY & 3;
      const dotCol = (x / (CELL_W / 2)) | 0;
      const dc = dotCol & 1;
      if (row < 0 || row >= rows) return;
      // braille dot index: [0,0]=1 [0,1]=2 [0,2]=3 [1,0]=4 [1,1]=5 [1,2]=6 [0,3]=7 [1,3]=8
      const dot = dc === 0 ? (dotRow === 0 ? 0 : dotRow === 1 ? 1 : dotRow === 2 ? 2 : 6)
                           : (dotRow === 0 ? 3 : dotRow === 1 ? 4 : dotRow === 2 ? 5 : 7);
      grid[row][cx * 8 + dot] |= bit;
    };

    // stars into grid
    for (const s of this.starProj) {
      if (s.px < 0 || s.px >= this.w || s.py < 0 || s.py >= this.h) continue;
      paint(s.px, s.py, 1);
    }
    // edges & nodes & core
    const core = this.project(0, 0, 0);
    for (const n of sorted) {
      const steps = Math.ceil(Math.hypot(n.screenX - core.x, n.screenY - core.y) / 3);
      for (let i = 0; i <= steps; i++) {
        const f = i / steps;
        paint(core.x + (n.screenX - core.x) * f, core.y + (n.screenY - core.y) * f, 1);
      }
      // star dot
      paint(n.screenX, n.screenY, 1);
      paint(n.screenX + 1, n.screenY, 1);
      paint(n.screenX, n.screenY + 1, 1);
      if (this.selected?.key === n.key) {
        const R = 12;
        for (let a = 0; a < Math.PI * 2; a += 0.3) paint(n.screenX + R * Math.cos(a), n.screenY + R * Math.sin(a), 1);
      }
    }
    for (let a = 0; a < Math.PI * 2; a += 0.45) paint(core.x + 6 * Math.cos(a), core.y + 6 * Math.sin(a), 1);

    // emit braille text
    let out = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let bits = 0;
        for (let d = 0; d < 8; d++) bits |= grid[r][c * 8 + d] ? (1 << d) : 0;
        out += String.fromCharCode(0x2800 + bits) || ' ';
      }
      out += '\n';
    }
    this.brailleEl.textContent = out;
    this.brailleEl.style.color = this.mode === 'braille' ? this.colors.cyan : 'transparent';
  }

  renderDither(t, sorted) {
    const { ctx, w, h } = this;
    // Bayer 8x8 threshold matrix (value = threshold position in [0,1))
    const BAYER = [
      0, 32, 8, 40, 2, 34, 10, 42,
      48, 16, 56, 24, 50, 18, 58, 26,
      12, 44, 4, 36, 14, 46, 6, 38,
      60, 28, 52, 20, 62, 30, 54, 22,
      3, 35, 11, 43, 1, 33, 9, 41,
      51, 19, 59, 27, 49, 17, 57, 25,
      15, 47, 7, 39, 13, 45, 5, 37,
      63, 31, 55, 23, 61, 29, 53, 21
    ];

    // draw scene normally into an offscreen luma canvas first
    const off = this._off || (this._off = document.createElement('canvas'));
    if (off.width !== w || off.height !== h) { off.width = w; off.height = h; }
    const octx = off.getContext('2d');
    octx.fillStyle = '#000'; octx.fillRect(0, 0, w, h);
    octx.fillStyle = '#fff';
    for (const s of this.starProj) {
      if (s.px < 0 || s.px > w || s.py < 0 || s.py > h) continue;
      octx.globalAlpha = 0.45 + 0.4 * Math.abs(Math.sin(t / 900 + s.tw));
      octx.fillRect(s.px, s.py, 2, 2);
    }
    octx.globalAlpha = 1;
    octx.strokeStyle = 'rgba(255,255,255,0.5)';
    octx.lineWidth = 1;
    const core = this.project(0, 0, 0);
    for (const n of sorted) {
      octx.beginPath(); octx.moveTo(core.x, core.y); octx.lineTo(n.screenX, n.screenY); octx.stroke();
      octx.beginPath(); octx.arc(n.screenX, n.screenY, 5 + 2 * Math.sin(t / 300 + n.pulse), 0, Math.PI * 2); octx.stroke();
    }

    // 1-bit Bayer dither at 3px virtual resolution for performance
    const V = 3;
    const vw = Math.ceil(w / V), vh = Math.ceil(h / V);
    const img = octx.getImageData(0, 0, w, h).data;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = this.colors.cyan;
    for (let yy = 0; yy < vh; yy++) {
      for (let xx = 0; xx < vw; xx++) {
        const px = Math.min(w - 1, xx * V), py = Math.min(h - 1, yy * V);
        const idx = (py * w + px) * 4;
        const luma = (img[idx] * 0.299 + img[idx + 1] * 0.587 + img[idx + 2] * 0.114) / 255;
        const threshold = (BAYER[(yy % 8) * 8 + (xx % 8)] + 0.5) / 64;
        if (luma > threshold) ctx.fillRect(xx * V, yy * V, V, V);
      }
    }
    // phosphor scanlines
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = '#000';
    for (let y = 0; y < h; y += 2) ctx.fillRect(0, y, w, 1);
    ctx.globalAlpha = 1;
  }

  // ---------- helpers ----------
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
    // system / unknown → hue-shift by port for visual variety
    const hue = (n.port * 137.508) % 360;
    return `hsl(${hue.toFixed(0)}, 72%, 62%)`;
  }
  colorWithAlpha(col, a) {
    // accepts hex #rrggbb or rgb()/rgba()
    if (col.startsWith('#')) {
      const r = parseInt(col.slice(1, 3), 16), g = parseInt(col.slice(3, 5), 16), b = parseInt(col.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${a})`;
    }
    if (col.startsWith('rgb(')) return col.replace('rgb(', 'rgba(').replace(')', `,${a})`);
    return col;
  }
}
