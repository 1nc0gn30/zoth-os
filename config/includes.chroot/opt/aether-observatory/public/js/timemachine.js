// AETHER Time Machine — chronological scrubber over SQLite snapshots + real T1/T2 diff + Markdown/JSON export.

export class TimeMachine {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;
    this.frames = [];
    this.totalCount = 0;
    this.mode = 'scrub';
    this.t1 = null;
    this.t2 = null;
    this.pinned = null;
    this.hover = null;
    this.dragging = false;
    this.lastDiff = null;

    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(canvas);
    this.resize();
    this.bind();
    this.refresh();
    this.timer = setInterval(() => this.refresh(), 10_000);
    this.raf = requestAnimationFrame((t) => this.draw(t));
  }

  destroy() {
    clearInterval(this.timer);
    cancelAnimationFrame(this.raf);
    this.resizeObs.disconnect();
  }

  getSelectedEpochs() {
    if (this.t1 == null || this.t2 == null) return null;
    const a = this.frames[Math.min(this.t1, this.t2)];
    const b = this.frames[Math.max(this.t1, this.t2)];
    if (!a || !b) return null;
    return { t1: a.epoch, t2: b.epoch };
  }

  resize() {
    this.w = Math.max(2, this.canvas.clientWidth || 400);
    this.h = Math.max(2, 160);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.dpr = dpr;
  }

  bind() {
    const pos = (e) => {
      const r = this.canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    this.canvas.addEventListener('pointerdown', (e) => {
      this.dragging = true;
      try { this.canvas.setPointerCapture(e.pointerId); } catch {}
      this.selectAt(pos(e));
    });
    this.canvas.addEventListener('pointermove', (e) => {
      const p = pos(e);
      this.hover = this.nearest(p.x);
      if (this.mode === 'scrub') {
        if (this.dragging) this.pinned = this.hover;
        this.updateReadout();
      } else if (this.dragging) {
        this.selectAt(p);
      }
    });
    window.addEventListener('pointerup', () => { this.dragging = false; });

    this.ui.scrubBtn.addEventListener('click', () => this.setMode('scrub'));
    this.ui.diffBtn.addEventListener('click', () => this.setMode('diff'));
    this.ui.exportMd.addEventListener('click', () => this.export('md'));
    this.ui.exportJson.addEventListener('click', () => this.export('json'));
  }

  async refresh() {
    let data;
    try {
      data = await fetch('/api/timeline/snapshots?limit=240').then(r => (r.ok ? r.json() : { frames: [] }));
    } catch {
      return;
    }
    // Reverse DESC rows into chronological ASC order (oldest -> newest)
    const raw = Array.isArray(data.frames) ? data.frames : [];
    this.frames = [...raw].reverse();
    this.totalCount = data.totalCount ?? this.frames.length;
    this.ui.count.textContent = `${this.frames.length} shown · ${this.totalCount.toLocaleString()} stored`;

    const canExport = this.frames.length >= 2;
    this.ui.exportMd.disabled = !canExport;
    this.ui.exportJson.disabled = !canExport;

    if (this.mode === 'scrub' && this.pinned == null && this.frames.length) {
      this.pinned = this.frames.length - 1;
      this.updateReadout();
    }
  }

  setMode(m) {
    this.mode = m;
    this.ui.scrubBtn.setAttribute('aria-pressed', String(m === 'scrub'));
    this.ui.diffBtn.setAttribute('aria-pressed', String(m === 'diff'));
    if (m === 'scrub') {
      this.t1 = null;
      this.t2 = null;
      this.lastDiff = null;
      this.ui.diffOut.classList.remove('show');
    } else {
      this.ui.readout.textContent = 'click T1 (gold) then T2 (cyan) to compute flight-recorder diff';
    }
    this.updateReadout();
  }

  xFor(i) {
    if (this.frames.length < 2) return this.w / 2;
    return 14 + (i / (this.frames.length - 1)) * (this.w - 28);
  }

  nearest(x) {
    if (!this.frames.length) return null;
    let best = 0, bestD = Infinity;
    for (let i = 0; i < this.frames.length; i++) {
      const d = Math.abs(this.xFor(i) - x);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  selectAt(p) {
    const i = this.nearest(p.x);
    if (i == null) return;
    if (this.mode === 'scrub') {
      this.pinned = i;
      this.updateReadout();
      return;
    }
    if (this.t1 == null || (this.t1 != null && this.t2 != null)) {
      this.t1 = i;
      this.t2 = null;
    } else {
      this.t2 = i;
      this.runDiff();
    }
    this.updateReadout();
  }

  updateReadout() {
    const fmtTime = (i) => {
      const ts = i != null ? this.frames[i]?.ts : null;
      if (!ts) return '—';
      const d = new Date(ts);
      return Number.isNaN(d.getTime()) ? ts.slice(11, 19) : d.toTimeString().slice(0, 8);
    };

    if (this.mode === 'scrub') {
      const idx = this.hover ?? this.pinned ?? (this.frames.length ? this.frames.length - 1 : null);
      const f = idx != null ? this.frames[idx] : null;
      if (!f) {
        this.ui.readout.textContent = 'waiting for SQLite snapshots…';
        return;
      }
      const load = f.load1 != null ? f.load1.toFixed(2) : '—';
      const busy = f.busyPct != null ? `${f.busyPct.toFixed(0)}%` : '—';
      const temp = f.packageC != null ? `${f.packageC.toFixed(1)}°C` : '—';
      const mem = f.memUsedPct != null ? `${f.memUsedPct.toFixed(0)}%` : '—';
      this.ui.readout.textContent = `${fmtTime(idx)} · load ${load} · busy ${busy} · pkg ${temp} · ram ${mem} · ports ${f.listeners ?? '—'}`;
    } else {
      this.ui.readout.textContent = `T1 ${fmtTime(this.t1)} → T2 ${fmtTime(this.t2)} · ${this.frames.length} frames`;
    }
  }

  async runDiff() {
    if (this.t1 == null || this.t2 == null) return;
    const a = this.frames[Math.min(this.t1, this.t2)];
    const b = this.frames[Math.max(this.t1, this.t2)];
    if (!a || !b) return;
    let diff;
    try {
      const res = await fetch(`/api/timeline/diff?t1=${a.epoch}&t2=${b.epoch}`);
      if (!res.ok) return;
      diff = await res.json();
    } catch {
      return;
    }
    if (!diff || diff.error) return;
    this.lastDiff = diff;

    const chips = [];
    const add = (txt, cls) => chips.push({ txt, cls });
    if (diff.spawnedPorts?.length) {
      diff.spawnedPorts.slice(0, 8).forEach(port => add(`SPAWNED :${port}`, 'spawn'));
      if (diff.spawnedPorts.length > 8) add(`+${diff.spawnedPorts.length - 8} more spawned`, 'spawn');
    }
    if (diff.terminatedPorts?.length) {
      diff.terminatedPorts.slice(0, 8).forEach(port => add(`TERMINATED :${port}`, 'gone'));
      if (diff.terminatedPorts.length > 8) add(`+${diff.terminatedPorts.length - 8} more terminated`, 'gone');
    }

    const dTemp = diff.thermalDeltaC ?? 0;
    const dLoad = diff.loadDelta ?? 0;
    const dBusy = diff.busyDeltaPct ?? 0;
    const dMem = diff.memDeltaPct ?? 0;
    const dSock = diff.listenersDelta ?? 0;
    const dProc = diff.processDelta ?? 0;

    add(`Δ thermal ${dTemp >= 0 ? '+' : ''}${dTemp}°C${diff.thermalSpike ? ' SPIKE' : ''}`, Math.abs(dTemp) >= 5 ? 'gone' : 'neutral');
    add(`Δ load1 ${dLoad >= 0 ? '+' : ''}${dLoad}`, Math.abs(dLoad) >= 1 ? 'warn' : 'neutral');
    add(`Δ busy ${dBusy >= 0 ? '+' : ''}${dBusy}%`, 'neutral');
    add(`Δ mem ${dMem >= 0 ? '+' : ''}${dMem}%`, 'neutral');
    add(`Δ sockets ${dSock >= 0 ? '+' : ''}${dSock}`, dSock !== 0 ? 'spawn' : 'neutral');
    add(`Δ procs ${dProc >= 0 ? '+' : ''}${dProc}`, 'neutral');
    add(`window ${diff.windowSec ?? 0}s`, 'neutral');

    this.ui.diffChips.replaceChildren();
    for (const c of chips) {
      const el = document.createElement('span');
      el.className = `chip ${c.cls}`;
      el.textContent = c.txt;
      this.ui.diffChips.appendChild(el);
    }

    const fmtFull = (ts) => new Date(ts).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.ui.diffRange.textContent = `${fmtFull(a.ts)} → ${fmtFull(b.ts)}`;
    this.ui.diffOut.classList.add('show');
    this.ui.exportMd.disabled = false;
    this.ui.exportJson.disabled = false;
    this.updateReadout();
  }

  export(kind) {
    if (this.frames.length < 2) return;
    let a, b;
    if (this.t1 != null && this.t2 != null) {
      a = this.frames[Math.min(this.t1, this.t2)];
      b = this.frames[Math.max(this.t1, this.t2)];
    } else {
      a = this.frames[0];
      b = this.frames[this.frames.length - 1];
    }
    const endpoint = kind === 'md' ? 'export.md' : 'export.json';
    const url = `/api/timeline/${endpoint}?t1=${a.epoch}&t2=${b.epoch}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `aether-diff-${a.epoch}-${b.epoch}.${kind}`;
    link.click();
  }

  draw() {
    const { ctx, w, h } = this;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);
    const colors = window.__AETHER_COLORS;
    ctx.fillStyle = colors?.bg0 || '#07090E';
    ctx.fillRect(0, 0, w, h);

    if (!this.frames.length) {
      ctx.fillStyle = colors?.inkFaint || '#7A8396';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ring warming — first frames arrive within 10s', w / 2, h / 2);
      ctx.restore();
      this.raf = requestAnimationFrame((tt) => this.draw(tt));
      return;
    }

    const first = new Date(this.frames[0].ts);
    const last = new Date(this.frames[this.frames.length - 1].ts);
    const spanMs = Math.max(1000, last.getTime() - first.getTime());

    // Time grid + distinct chronological labels
    ctx.strokeStyle = colors?.line || 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.font = '9px monospace';
    ctx.fillStyle = colors?.inkFaint || '#7A8396';
    const showSeconds = spanMs < 6 * 60 * 1000;
    for (let i = 0; i <= 6; i++) {
      const ts = new Date(first.getTime() + spanMs * (i / 6));
      const x = this.xFor((i / 6) * (this.frames.length - 1));
      ctx.beginPath(); ctx.moveTo(x, 14); ctx.lineTo(x, h - 22); ctx.stroke();
      ctx.textAlign = i === 0 ? 'left' : i === 6 ? 'right' : 'center';
      ctx.fillText(ts.toTimeString().slice(0, showSeconds ? 8 : 5), x, h - 6);
    }

    // Dynamic scaling for real load1 + packageC curves
    const maxLoad = Math.max(2, ...this.frames.map(f => f.load1 ?? 0)) * 1.15;
    const yLoad = (v) => h - 26 - Math.min(h - 44, ((v ?? 0) / maxLoad) * (h - 46));
    const yTemp = (v) => h - 26 - Math.min(h - 44, (Math.max(0, (v ?? 20) - 15) / 85) * (h - 46));

    // Load1 polyline (cyan)
    ctx.beginPath();
    this.frames.forEach((f, i) => {
      const x = this.xFor(i);
      const y = yLoad(f.load1);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = colors?.cyan || '#38BDF8';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Package thermal polyline (gold)
    ctx.beginPath();
    this.frames.forEach((f, i) => {
      const x = this.xFor(i);
      const y = yTemp(f.packageC);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = colors?.gold || '#D4AF37';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Legend
    ctx.textAlign = 'left';
    ctx.fillStyle = colors?.cyan || '#38BDF8';
    ctx.fillText('● LOAD1', 14, 11);
    ctx.fillStyle = colors?.gold || '#D4AF37';
    ctx.fillText('● PKG °C', 74, 11);

    // Snapshot markers (stride when > 80 frames for visual clarity)
    const stride = this.frames.length > 90 ? Math.ceil(this.frames.length / 75) : 1;
    for (let i = 0; i < this.frames.length; i++) {
      const isSpecial = i === this.t1 || i === this.t2 || (this.mode === 'scrub' && i === this.pinned);
      if (!isSpecial && i % stride !== 0) continue;
      const x = this.xFor(i);
      const y = yLoad(this.frames[i].load1);
      let c = colors?.cyan || '#38BDF8';
      if (i === this.t1) c = colors?.gold || '#D4AF37';
      if (i === this.t2) c = colors?.cyan || '#38BDF8';
      if (this.mode === 'scrub' && i === this.pinned) c = colors?.gold || '#D4AF37';
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x, y, isSpecial ? 4.8 : 2.2, 0, Math.PI * 2);
      ctx.fill();
      if (isSpecial) {
        ctx.strokeStyle = c;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Hover crosshair
    if (this.hover != null && this.hover < this.frames.length) {
      const x = this.xFor(this.hover);
      ctx.strokeStyle = colors?.inkDim || '#9BA3B4';
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(x, 14); ctx.lineTo(x, h - 22); ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
    this.raf = requestAnimationFrame((tt) => this.draw(tt));
  }
}
