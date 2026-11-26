// AETHER Sonorium — WebAudio drone + DynamicsCompressorNode master limiter + FFT waterfall.
// Lazy AudioContext creation strictly on user gesture; real telemetry modulation; zero node leaks.

export class RotaryKnob {
  constructor(el, { initial = 50, onChange }) {
    this.el = el;
    this.onChange = onChange;
    this.value = initial;
    this.dragging = false;
    this.lastManualAt = 0;

    this.svg = el.querySelector('svg');
    this.renderKnob();

    el.addEventListener('pointerdown', (e) => {
      this.dragging = true;
      this.startY = e.clientY;
      this.startValue = this.value;
      el.setPointerCapture(e.pointerId);
      el.classList.add('active');
      e.preventDefault();
    });
    el.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      const dy = this.startY - e.clientY;
      this.set(this.startValue + dy * 0.55, true);
    });
    el.addEventListener('pointerup', () => { this.dragging = false; el.classList.remove('active'); });
    el.addEventListener('pointercancel', () => { this.dragging = false; el.classList.remove('active'); });

    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.set(this.value + (e.deltaY < 0 ? 1.5 : -1.5), true);
    }, { passive: false });

    el.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); this.set(this.value + 2, true); }
      if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); this.set(this.value - 2, true); }
    });
  }

  set(v, manual = false) {
    if (manual) this.lastManualAt = Date.now();
    this.value = Math.max(0, Math.min(100, v));
    this.el.setAttribute('aria-valuenow', String(Math.round(this.value)));
    this.renderKnob();
    this.onChange?.(this.value, manual);
  }

  setFromTelemetry(v) {
    // Yield to operator manual adjustments for 15 seconds
    if (Date.now() - this.lastManualAt < 15000) return;
    this.value = Math.max(0, Math.min(100, v));
    this.el.setAttribute('aria-valuenow', String(Math.round(this.value)));
    this.renderKnob();
    this.onChange?.(this.value, false);
  }

  renderKnob() {
    if (!this.svg) return;
    const cx = 42, cy = 42, R = 32, r = 13;
    const tickR0 = R - 4, tickR1 = R + 2;
    const angle = (v) => -135 + v * 2.7;
    const a = angle(this.value);
    const ns = 'http://www.w3.org/2000/svg';
    const el = (tag, attrs) => {
      const node = document.createElementNS(ns, tag);
      for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
      return node;
    };

    this.svg.replaceChildren();
    const gTicks = el('g', { class: 'knob-ticks' });
    for (const d of [-135, -90, -45, 0, 45, 90, 135]) {
      const rad = (d - 90) * Math.PI / 180;
      gTicks.appendChild(el('line', {
        x1: (cx + tickR0 * Math.cos(rad)).toFixed(1),
        y1: (cy + tickR0 * Math.sin(rad)).toFixed(1),
        x2: (cx + tickR1 * Math.cos(rad)).toFixed(1),
        y2: (cy + tickR1 * Math.sin(rad)).toFixed(1),
        stroke: 'currentColor',
        class: 'tick',
      }));
    }

    const gBody = el('g', { class: 'knob-body' });
    gBody.appendChild(el('circle', { cx, cy, r: R, fill: 'none', stroke: 'currentColor', 'stroke-width': '1.1', opacity: '.55' }));
    for (let i = 0; i < 16; i++) {
      const d = -135 + i * 18;
      const vr = (d - 90) * Math.PI / 180;
      gBody.appendChild(el('circle', {
        cx: (cx + (R - 1.6) * Math.cos(vr)).toFixed(1),
        cy: (cy + (R - 1.6) * Math.sin(vr)).toFixed(1),
        r: '1.15',
        fill: 'currentColor',
        opacity: d <= a ? '1' : '0.2',
      }));
    }
    gBody.appendChild(el('circle', { cx, cy, r, fill: 'none', stroke: 'currentColor', 'stroke-width': '1.4' }));
    const radA = (a - 90) * Math.PI / 180;
    gBody.appendChild(el('line', {
      x1: (cx + 3 * Math.cos(radA)).toFixed(1),
      y1: (cy + 3 * Math.sin(radA)).toFixed(1),
      x2: (cx + (r - 1) * Math.cos(radA)).toFixed(1),
      y2: (cy + (r - 1) * Math.sin(radA)).toFixed(1),
      stroke: 'currentColor',
      'stroke-width': '1.8',
      'stroke-linecap': 'round',
    }));
    this.svg.append(gTicks, gBody);
  }
}

export class Sonifier {
  constructor(toggleBtn, waterfallCanvas, onTelemetryKnobs) {
    this.toggle = toggleBtn;
    this.canvas = waterfallCanvas;
    this.ctx2d = waterfallCanvas.getContext('2d');
    this.onTelemetryKnobs = onTelemetryKnobs;
    this.ctx = null;
    this.playing = false;
    this.params = { pitch: 38, harm: 26, bright: 50, drift: 30 };
    this._telemetry = null;
    this.osc = [];
    this.oscGains = [];
    this.install();
  }

  install() {
    this.toggle.addEventListener('click', () => (this.playing ? this.stop() : this.start()));
  }

  async ensureCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  teardownNodes() {
    for (const o of this.osc) {
      try { o.stop(); } catch {}
      try { o.disconnect(); } catch {}
    }
    for (const g of this.oscGains) {
      try { g.disconnect(); } catch {}
    }
    try { this.lfo?.stop(); } catch {}
    try { this.lfo?.disconnect(); } catch {}
    try { this.lfoGain?.disconnect(); } catch {}
    try { this.filterTarget?.disconnect(); } catch {}
    try { this.filter?.disconnect(); } catch {}
    try { this.limiter?.disconnect(); } catch {}
    try { this.master?.disconnect(); } catch {}
    try { this.analyser?.disconnect(); } catch {}
    this.osc = [];
    this.oscGains = [];
    this.harmGain = null;
  }

  async start() {
    if (this.playing) return;
    await this.ensureCtx();
    this.teardownNodes();

    const now = this.ctx.currentTime;
    this.filterTarget = this.ctx.createGain();
    this.filterTarget.gain.value = 0.85;

    // Filter bank + DynamicsCompressorNode master limiter + master gain + analyser
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';

    this.limiter = this.ctx.createDynamicsCompressor();
    this.limiter.threshold.setValueAtTime(-14, now);
    this.limiter.knee.setValueAtTime(12, now);
    this.limiter.ratio.setValueAtTime(8, now);
    this.limiter.attack.setValueAtTime(0.005, now);
    this.limiter.release.setValueAtTime(0.12, now);

    this.master = this.ctx.createGain();
    this.master.gain.setValueAtTime(0.0001, now);

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.72;
    this.fft = new Uint8Array(this.analyser.frequencyBinCount);

    // Wire complete audio signal chain: filterTarget -> filter -> limiter -> master -> analyser -> destination
    this.filterTarget.connect(this.filter);
    this.filter.connect(this.limiter);
    this.limiter.connect(this.master);
    this.master.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Oscillators: primary saw, fifth saw, harmonic upper square, sub-octave sine
    this.osc = [
      this.mkOsc('sawtooth', 0.36),
      this.mkOsc('sawtooth', 0.24),
      this.mkOsc('square', 0.16, true),
      this.mkOsc('sine', 0.52),
    ];
    for (const o of this.osc) o.start(now);

    // LFO modulating lowpass cutoff
    this.lfo = this.ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfoGain = this.ctx.createGain();
    this.lfo.connect(this.lfoGain).connect(this.filter.frequency);
    this.lfo.start(now);

    // Waterfall buffer
    this.wfalls = document.createElement('canvas');
    this.wfalls.width = this.canvas.width = Math.max(320, this.canvas.clientWidth || 600);
    this.wfalls.height = this.canvas.height = Math.max(100, this.canvas.clientHeight || 120);
    this.wctx = this.wfalls.getContext('2d');
    const isLight = document.documentElement.dataset.theme === 'light';
    this.wctx.fillStyle = isLight ? '#F7F4EB' : '#05070B';
    this.wctx.fillRect(0, 0, this.wfalls.width, this.wfalls.height);

    this.playing = true;
    this.apply();
    this.master.gain.setTargetAtTime(0.28, now, 0.18);

    this.toggle.setAttribute('aria-pressed', 'true');
    this.toggle.textContent = '■ STOP DRONE';
    this._raf = requestAnimationFrame(() => this.draw());
  }

  mkOsc(type, scale, isHarmonic = false) {
    const o = this.ctx.createOscillator();
    o.type = type;
    const g = this.ctx.createGain();
    g.gain.value = scale;
    o.connect(g).connect(this.filterTarget);
    this.oscGains.push(g);
    if (isHarmonic) this.harmGain = g;
    return o;
  }

  stop() {
    if (!this.playing) return;
    this.playing = false;
    cancelAnimationFrame(this._raf);
    if (this.ctx && this.master) {
      const t = this.ctx.currentTime;
      this.master.gain.setTargetAtTime(0.0001, t, 0.08);
      setTimeout(() => {
        if (!this.playing) {
          this.teardownNodes();
          this.ctx?.suspend().catch(() => {});
        }
      }, 220);
    } else {
      this.teardownNodes();
    }
    this.toggle.setAttribute('aria-pressed', 'false');
    this.toggle.textContent = '▶ PLAY DRONE (optional)';
  }

  apply() {
    if (!this.playing || !this.ctx || !this.osc.length) return;
    const t = this.ctx.currentTime;
    const p = this.params;
    const base = 55 * Math.pow(5.5, p.pitch / 100);
    this.osc[0].frequency.setTargetAtTime(base, t, 0.08);
    this.osc[1].frequency.setTargetAtTime(base * 1.498, t, 0.08);
    this.osc[2].frequency.setTargetAtTime(base * 2.007, t, 0.08);
    this.osc[3].frequency.setTargetAtTime(base / 2, t, 0.08);

    if (this.harmGain) {
      this.harmGain.gain.setTargetAtTime(0.04 + (p.harm / 100) * 0.34, t, 0.1);
    }

    const bright = 220 * Math.exp((p.bright / 100) * Math.log(3400 / 220));
    this.filter.frequency.setTargetAtTime(bright, t, 0.12);
    this.lfo.frequency.setTargetAtTime(0.08 + (p.drift / 100) * 1.1, t, 0.15);
    this.lfoGain.gain.setTargetAtTime(bright * 0.18, t, 0.15);
    this.filter.Q.setTargetAtTime(0.8 + (p.drift / 100) * 2.6, t, 0.15);
  }

  // Maps real live telemetry into synth targets (CPU->pitch, RAM->harms, Pkg°C->bright, sockets->drift)
  telemetry(frame) {
    this._telemetry = frame;
    if (!frame) return;
    const mapped = {
      pitch: Math.max(5, Math.min(95, Math.round(frame.cpu?.busyPct ?? 35))),
      harm: Math.max(5, Math.min(95, Math.round(frame.memory?.usedPct ?? 30))),
      bright: Math.max(10, Math.min(95, Math.round(((frame.thermals?.packageC ?? 45) - 25) * 1.35))),
      drift: Math.max(8, Math.min(95, Math.round(((frame.listening?.count ?? 15) / 64) * 100))),
    };
    this.onTelemetryKnobs?.(mapped);
    this.apply();
  }

  getSpectrumPeak() {
    if (!this.analyser || !this.fft) return 0;
    this.analyser.getByteFrequencyData(this.fft);
    let max = 0;
    for (let i = 0; i < this.fft.length; i++) if (this.fft[i] > max) max = this.fft[i];
    return max;
  }

  draw() {
    if (!this.playing) return;
    const { wctx, wfalls, ctx2d, canvas } = this;
    this.analyser.getByteFrequencyData(this.fft);
    const w = wfalls.width, h = wfalls.height;
    const isLight = document.documentElement.dataset.theme === 'light';

    // Scroll waterfall down 2px
    wctx.drawImage(wfalls, 0, 2);
    wctx.fillStyle = isLight ? '#F7F4EB' : '#05070B';
    wctx.fillRect(0, 0, w, 2);

    const bands = 64;
    const bandW = w / bands;
    for (let i = 0; i < bands; i++) {
      const bin = Math.min(this.fft.length - 1, Math.floor((i * this.fft.length) / (bands * 1.6)));
      const v = this.fft[bin] / 255;
      if (v < 0.02) continue;
      if (isLight) {
        const r = Math.round(140 - v * 90);
        const g = Math.round(105 + v * 30);
        const b = Math.round(55 + v * 120);
        wctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, 0.35 + v * 0.65)})`;
      } else {
        const r = Math.round(56 + v * 175);
        const g = Math.round(145 + v * 55);
        const b = Math.round(240 - v * 165);
        wctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, 0.3 + v * 0.7)})`;
      }
      wctx.fillRect(i * bandW, 0, Math.max(1, bandW - 1), 2);
    }

    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    ctx2d.drawImage(wfalls, 0, 0, canvas.width, canvas.height);
    this._raf = requestAnimationFrame(() => this.draw());
  }
}
