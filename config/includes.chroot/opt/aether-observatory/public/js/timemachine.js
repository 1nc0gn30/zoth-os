// AETHER Time Machine — scrubber over SQLite snapshots + T1/T2 diff + export.

export class TimeMachine {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;   // { count, readout, scrubBtn, diffBtn, exportMd, exportJson, diffOut, diffChips, diffRange }
    this.frames = [];
    this.mode = 'scrub';
    this.t1 = null; this.t2 = null;
    this.cursor = null;
    this.hover = null;
    this.dragging = false;

    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(canvas);
    this.resize();
    this.bind();
    this.refresh();
    this.timer = setInterval(() => this.refresh(), 10_000);
    this.raf = requestAnimationFrame((t) => this.draw(t));
  }

  destroy() { clearInterval(this.timer); cancelAnimationFrame(this.raf); this.resizeObs.disconnect(); }

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
      this.canvas.setPointerCapture(e.pointerId);
      this.selectAt(pos(e));
    });
    this.canvas.addEventListener('pointermove', (e) => {
      const p = pos(e);
      this.hover = this.nearest(p.x);
      if (this.dragging) this.selectAt(p);
    });
    window.addEventListener('pointerup', () => this.dragging = false);

    this.ui.scrubBtn.addEventListener('click', () => this.setMode('scrub'));
    this.ui.diffBtn.addEventListener('click', () => this.setMode('diff'));
    this.ui.exportMd.addEventListener('click', () => this.export('md'));
    this.ui.exportJson.addEventListener('click', () => this.export('json'));
  }

  async refresh() {
    let data;
    try { data = await fetch('/api/timeline/snapshots?limit=240').then(r => r.ok ? r.json() : { frames: [] }); }
    catch { return; }
    this.frames = data.frames || [];
    this.ui.count.textContent = `${this.frames.length} frames`;
  }

  setMode(m) {
    this.mode = m;
    this.ui.scrubBtn.setAttribute('aria-pressed', String(m === 'scrub'));
    this.ui.diffBtn.setAttribute('aria-pressed', String(m === 'diff'));
    this.ui.readout.innerHTML = m === 'diff'
      ? 'pick <b>T1</b> then <b>T2</b> (golden then cyan)'
      : 'drag to scrub through recorded snapshots';
    if (m === 'scrub') { this.t1 = null; this.t2 = null; this.ui.exportMd.disabled = true; this.ui.exportJson.disabled = true; this.ui.diffOut.classList.remove('show'); }
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
    if (this.mode !== 'diff') return;
    const i = this.nearest(p.x);
    if (i == null) return;
    if (this.t1 == null || (this.t1 != null && this.t2 != null)) { this.t1 = i; this.t2 = null; }
    else { this.t2 = i; this.runDiff(); }
    this.updateReadout();
  }

  updateReadout() {
    const fmt = (i) => i == null ? '—' : this.frames[i]?.ts?.slice(11, 19) || '—';
    if (this.mode !== 'diff') { this.ui.readout.innerHTML = 'scrub + tap the dot to pin <b>T1</b>, then <b>T2</b>'; }
    else this.ui.readout.innerHTML = `T1 <b>${fmt(this.t1)}</b> · T2 <b>${fmt(this.t2)}</b> · frames ${this.frames.length}`;
  }

  async runDiff() {
    if (this.t1 == null || this.t2 == null) return;
    const a = this.frames[Math.min(this.t1, this.t2)];
    const b = this.frames[Math.max(this.t1, this.t2)];
    if (!a || !b) return;
    let diff;
    try { diff = await fetch(`/api/timeline/diff?a=${a.id}&b=${b.id}`).then(r => r.ok ? r.json() : null); }
    catch { return; }
    if (!diff) return;

    const chips = [];
    const add = (txt, cls) => chips.push({ txt, cls });
    if (diff.spawned?.length) diff.spawned.forEach(s => add(`SPAWNED :${s.port} · ${s.name}${s.pid ? ' pid ' + s.pid : ''}`, 'spawn'));
    if (diff.terminated?.length) diff.terminated.forEach(s => add(`TERMINATED :${s.port} · ${s.name}`, 'gone'));
    const dTemp = Math.round((diff.delta?.pkgC ?? 0) * 10) / 10;
    const dLoad = Math.round((diff.delta?.load1 ?? 0) * 100) / 100;
    const dSock = diff.delta?.listeners ?? 0;
    add(`Δ thermal ${dTemp > 0 ? '▲' : '▼'}${Math.abs(dTemp)}°C`, Math.abs(dTemp) > 5 ? 'gone' : 'neutral');
    add(`Δ load1 ${dLoad > 0 ? '▲' : '▼'}${Math.abs(dLoad)}`, Math.abs(dLoad) > 1 ? 'gone' : 'neutral');
    add(`Δ sockets ${dSock > 0 ? '+' : ''}${dSock}`, dSock !== 0 ? 'spawn' : 'neutral');
    add(`Δ procs ${diff.delta?.procs > 0 ? '+' : ''}${diff.delta?.procs}`, 'neutral');
    add(`window ${(Math.round(diff.window_secs ?? 0))}s`, 'neutral');

    this.ui.diffChips.innerHTML = '';
    for (const c of chips) {
      const el = document.createElement('span');
      el.className = 'chip ' + c.cls;
      el.textContent = c.txt;
      this.ui.diffChips.appendChild(el);
    }
    this.ui.diffRange.textContent = `${a.ts.slice(5, 16)} → ${b.ts.slice(5, 16)}`;
    this.ui.diffOut.classList.add('show');
    this.ui.exportMd.disabled = false;
    this.ui.exportJson.disabled = false;
    this.updateReadout();
  }

  export(kind) {
    if (this.t1 == null || this.t2 == null) return;
    const a = this.frames[Math.min(this.t1, this.t2)];
    const b = this.frames[Math.max(this.t1, this.t2)];
    const applyPath = kind === 'md' ? 'export.md' : 'export.json';
    location.href = `/api/timeline/${applyPath}?a=${a.id}&b=${b.id}`;
  }

  draw(t) {
    const { ctx, w, h } = this;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);
    const colors = window.__AETHER_COLORS;
    ctx.fillStyle = colors?.bg0 || '#07090E';
    ctx.fillRect(0, 0, w, h);
    if (!this.frames.length) {
      ctx.fillStyle = colors?.inkFaint || '#5C6478';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ring warming — first frames arrive within 10s', w / 2, h / 2);
      ctx.restore(); this.raf = requestAnimationFrame((tt) => this.draw(tt)); return;
    }

    // hour grid + labels
    const first = new Date(this.frames[0].ts), last = new Date(this.frames[this.frames.length - 1].ts);
    const spanMs = Math.max(1, last - first);
    ctx.strokeStyle = colors?.line || 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = colors?.inkFaint || '#5C6478';
    for (let i = 0; i <= 6; i++) {
      const ts = new Date(first.getTime() + spanMs * (i / 6));
      const x = this.xFor((i / 6) * (this.frames.length - 1));
      ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x, h - 22); ctx.stroke();
      ctx.textAlign = i === 0 ? 'left' : i === 6 ? 'right' : 'center';
      ctx.fillText(ts.toTimeString().slice(0, 5), x, h - 6);
    }

    // polyline of load1 + pkgC area fill
    ctx.beginPath();
    this.frames.forEach((f, i) => {
      const x = this.xFor(i);
      const y = h - 26 - Math.min(h - 44, (f.cpu_load1 ?? 0) * 14);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = colors?.cyan || '#38BDF8';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // pkg thermal area
    ctx.beginPath();
    this.frames.forEach((f, i) => {
      const x = this.xFor(i);
      const y = h - 26 - Math.min(h - 44, ((f.pkg_temp_c ?? 0) - 20) * 2.2);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = colors?.gold || '#D4AF37';
    ctx.lineWidth = 1.1;
    ctx.stroke();

    // snapshot dots
    for (let i = 0; i < this.frames.length; i++) {
      const x = this.xFor(i);
      const y = h - 26 - Math.min(h - 44, (this.frames[i].cpu_load1 ?? 0) * 14);
      let c = colors?.cyan || '#38BDF8';
      if (i === this.t1) c = colors?.gold || '#D4AF37';
      if (i === this.t2) c = colors?.cyan || '#38BDF8';
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(x, y, i === this.t1 || i === this.t2 ? 5 : 2.6, 0, Math.PI * 2); ctx.fill();
      if (i === this.t1 || i === this.t2) {
        ctx.strokeStyle = c; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.stroke();
      }
    }

    // hover cursor — nearest snap line
    if (this.hover != null && this.hover < this.frames.length) {
      const x = this.xFor(this.hover);
      ctx.strokeStyle = colors?.inkFaint || '#5C6478';
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x, h - 22); ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
    this.raf = requestAnimationFrame((tt) => this.draw(tt));
  }
}
