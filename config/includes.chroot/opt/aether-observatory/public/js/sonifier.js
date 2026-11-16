// AETHER Sonorium — WebAudio drone + FFT waterfall.
// Audio starts ONLY from a user gesture. Knobs are real drag-physics controllers.

export class RotaryKnob {
  constructor(el, { initial = 50, onChange }) {
    this.el = el;
    this.onChange = onChange;
    this.value = initial; // 0..100
    this.dragging = false;

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
      this.set(this.startValue + dy * 0.55);
    });
    el.addEventListener('pointerup', () => { this.dragging = false; el.classList.remove('active'); });
    el.addEventListener('pointercancel', () => { this.dragging = false; el.classList.remove('active'); });

    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.set(this.value + (e.deltaY < 0 ? 1.2 : -1.2), true);
    }, { passive: false });

    el.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') this.set(this.value + 1.5, true);
      if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') this.set(this.value - 1.5, true);
    });
  }

  set(v, manual = false) {
    this.value = Math.max(0, Math.min(100, v));
    this.el.setAttribute('aria-valuenow', Math.round(this.value));
    this.renderKnob();
    this.onChange?.(this.value, manual);
  }

  renderKnob() {
    if (!this.svg) return;
    const cx = 42, cy = 42, R = 32, r = 13;
    const tickR0 = R - 4, tickR1 = R + 2;
    // range: -135° to +135°
    const angle = (v) => -135 + v * 2.7;
    const a = angle(this.value);

    let ticks = '';
    for (const d of [-135, -90, -45, 0, 45, 90, 135]) {
      const rad = (d - 90) * Math.PI / 180;
      ticks += `<line x1="${(cx + tickR0 * Math.cos(rad)).toFixed(1)}" y1="${(cy + tickR0 * Math.sin(rad)).toFixed(1)}" x2="${(cx + tickR1 * Math.cos(rad)).toFixed(1)}" y2="${(cy + tickR1 * Math.sin(rad)).toFixed(1)}" stroke="currentColor" class="tick"/>`;
    }
    const radA = (a - 90) * Math.PI / 180;

    const slots = [];
    for (let i = 0; i < 16; i++) {
      const d = -135 + i * 18;
      slots.push({ d, lit: d <= a });
    }
    let arcEls = '';
    // outer ring
    arcEls += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".55"/>`;
    // lit slots
    for (const s of slots) {
      const vr = (s.d - 90) * Math.PI / 180;
      const c0 = cx + (R - 1.6) * Math.cos(vr), c1 = cy + (R - 1.6) * Math.sin(vr);
      arcEls += `<circle cx="${c0.toFixed(1)}" cy="${c1.toFixed(1)}" r="1.05" fill="currentColor" class="${s.lit ? 'lit' : 'unlit'}"/>`;
    }
    // inner dial
    arcEls += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="currentColor" stroke-width="1.4"/>`;
    // finger grip — double line
    arcEls += `<line x1="${(cx + 3 * Math.cos(radA)).toFixed(1)}" y1="${(cy + 3 * Math.sin(radA)).toFixed(1)}" x2="${(cx + (r - 1) * Math.cos(radA)).toFixed(1)}" y2="${(cy + (r - 1) * Math.sin(radA)).toFixed(1)}" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`;
    arcEls += `<line x1="${(cx + (r * 0.5 - 2) * Math.cos(radA + 0.14)).toFixed(1)}" y1="${(cy + (r * 0.5 - 2) * Math.sin(radA + 0.14)).toFixed(1)}" x2="${(cx + (r - 1) * Math.cos(radA + 0.14)).toFixed(1)}" y2="${(cy + (r - 1) * Math.sin(radA + 0.14)).toFixed(1)}" stroke="currentColor" stroke-width="1" opacity=".7" stroke-linecap="round"/>`;

    this.svg.innerHTML = `<g class="knob-ticks">${ticks}</g><g class="knob-body">${arcEls}</g>`;
  }
}

// ============================================================
export class Sonifier {
  constructor(toggleBtn, waterfallCanvas) {
    this.toggle = toggleBtn;
    this.canvas = waterfallCanvas;
    this.ctx2d = waterfallCanvas.getContext('2d');
    this.buildCtx();
    this.playing = false;
    this.params = { pitch: 38, harm: 26, bright: 50, drift: 30 };
    this._telemetry = null;
    this.install();
  }

  install() {
    this.toggle.addEventListener('click', () => this.playing ? this.stop() : this.start());
  }

  start() {
    if (this.playing) return;
    this.buildCtx();
    this.now = this.ctx.currentTime;

    // oscillators — pitched saw + offsets + sub-sine
    this.osc = [
      this.mkOsc('sawtooth', 0.35),
      this.mkOsc('sawtooth', 0.22),
      this.mkOsc('square', 0.16),
      this.mkOsc('sine', 0.5)
    ];
    for (const o of this.osc) o.start();

    // filter bank
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';

    // LFO → filter freq (real lfo — drift knob multiplies rate)
    this.lfo = this.ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfoGain = this.ctx.createGain();
    this.lfo.connect(this.lfoGain).connect(this.filter.frequency);
    this.lfo.start();

    // master
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.filter.connect(this.master);

    // analyser
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.fft = new Uint8Array(this.analyser.frequencyBinCount);
    this.master.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // waterfall image buffer (scroll-down surface)
    this.wfalls = document.createElement('canvas');
    this.wfalls.width = this.canvas.width = this.canvas.clientWidth || 600;
    this.wfalls.height = this.canvas.height = this.canvas.clientHeight || 120;
    this.wctx = this.wfalls.getContext('2d');

    // apply current params
    this.apply();

    // fade in — real envelope
    this.master.gain.setTargetAtTime(0.24, this.now, 0.5);

    this.playing = true;
    this.toggle.setAttribute('aria-pressed', 'true');
    this.toggle.textContent = '■ STOP DRONE';
    this._raf = requestAnimationFrame(() => this.draw());
  }

  mkOsc(type, scale) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o._scale = scale;
    const g = this.ctx.createGain();
    g.gain.value = scale;
    o.connect(g).connect(this.filterTarget || (this.filterTarget = this.ctx.createGain()));
    // chain target → filter later at construction
    return o;
  }

  buildCtx() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.filterTarget = this.ctx.createGain();
  }

  stop() {
    if (!this.playing) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(0, t, 0.25);
    setTimeout(() => { this.ctx.suspend(); }, 400);
    this.playing = false;
    cancelAnimationFrame(this._raf);
    this.toggle.setAttribute('aria-pressed', 'false');
    this.toggle.textContent = '▶ PLAY DRONE (optional)';
  }

  apply() {
    if (!this.playing || !this.ctx) return;
    const t = this.ctx.currentTime;
    const p = this.params;
    // Pitch ↥ CPU → base freq 55-330 Hz
    const base = 55 * Math.pow(6, p.pitch / 100);
    for (const o of this.osc) o.frequency.setTargetAtTime(base, t, 0.1);
    this.osc[1].frequency.setTargetAtTime(base * 1.5, t, 0.1);
    this.osc[2].frequency.setTargetAtTime(base * 2.007, t, 0.1);
    this.osc[3].frequency.setTargetAtTime(base / 2, t, 0.1);
    // Harms ↥ MEM → amplitude of upper partials
    this.osc[2].disconnect();
    this.osc[2].connect(this.harmGain || (this.harmGain = this.ctx.createGain()));
    this.harmGain.gain.setTargetAtTime(0.02 + p.harm / 100 * 0.3, t, 0.15);
    if (!this._harmLinked) { this.harmGain.connect(this.filterTarget); this._harmLinked = true; }
    // Bright ↥ TEMP → filter cutoff 180–3200 Hz
    const bright = 180 * Math.exp((p.bright / 100) * Math.log(3200 / 180));
    this.filter.freq_base = bright;
    this.filter.frequency.setTargetAtTime(bright, t, 0.2);
    // LFO → subtle sweep scaled by Drift
    this.lfo.frequency.setTargetAtTime(0.05 + (p.drift / 100) * 0.75, t, 0.2);
    this.lfoGain.gain.setTargetAtTime(bright * 0.16, t, 0.2);
    this.filter.q ??= 0;
    this.filter.Q.setTargetAtTime(0.6 + p.drift / 100 * 2.4, t, 0.2);
  }

  // telemetry → knobs (non-destructive: only moves targets, user knob always wins if recently touched)
  telemetry(frame) {
    this._telemetry = frame;
    this.apply();
  }

  draw() {
    if (!this.playing) return;
    const { wctx, wfalls, ctx2d, canvas } = this;
    this.analyser.getByteFrequencyData(this.fft);
    const w = wfalls.width, h = wfalls.height;

    // scroll down 1px
    wctx.drawImage(wfalls, 0, 1);
    // draw new row at top
    const bands = 48; const bandW = w / bands;
    for (let i = 0; i < bands; i++) {
      const v = this.fft[Math.floor(i * this.fft.length / (bands * 2))] / 255;
      const g = Math.floor(v * 255);
      const hue = 43 - v * 19; // gold -> cyan
      wctx.fillStyle = `rgba(${g},${Math.floor(g * 0.82)},${Math.floor(g * 0.25)},1)`;
      if (document.documentElement.dataset.theme === 'light') {
        wctx.fillStyle = `rgb(${Math.floor(g * Math.cos(v * 1.3))},${Math.floor(g * 0.7)},${Math.floor(g * 0.3)})`;
      }
      wctx.fillRect(i * bandW, 0, Math.max(1, bandW - 1), 1.2);
    }
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    ctx2d.drawImage(wfalls, 0, 0);
    this._raf = requestAnimationFrame(() => this.draw());
  }
}
