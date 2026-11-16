// AETHER intro — 1.6s Braille aperture + glyph scramble handoff. ESC always skips.
// Reached-states are CLASS-toggled, never inline-styled.

const GLYPHS = '▚▞▛▟▙▟◐◑◒◓◔◕╬╩╦╠╣═│┤├┬┴≡≈≋∿∴∵⊹⊛✦✧✦∗∴';
const TITLE = 'AETHER OBSERVATORY';
const SUB = 'ACOUSTIC TELEMETRY · CYBER-PHYSICAL SONIFIER · SOVEREIGN OBSERVATORY';

if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.getElementById('intro-gate')?.classList.add('done');
} else {
  const gate = document.getElementById('intro-gate');
  const canvas = document.getElementById('intro-canvas');
  const skipBtn = document.getElementById('intro-skip');
  const ctx = canvas.getContext('2d');

  const DOTS = [ // braille dot positions in 2x4 cell
    [0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [0, 3], [1, 3]
  ];
  // deterministic-ish starfield seed
  let seed = 1337;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stars = Array.from({ length: 220 }, () => ({ x: rnd(), y: rnd(), r: 0.4 + rnd() * 1.3, tw: rnd() * Math.PI * 2 }));

  const CW = 660, CH = 220;
  const CELL_W = 8, CELL_H = 8; // 2x4 braille cell sizing on canvas
  const COLS = Math.floor(CW / CELL_W), ROWS = Math.floor(CH / CELL_H);
  const CX = COLS / 2, CY = ROWS / 2;   // aperture center in cells

  const start = performance.now();
  const DURATION = 1600;
  let done = false;
  let scrambleTimer = null;

  const finish = () => {
    if (done) return;
    done = true;
    clearInterval(scrambleTimer);
    gate.classList.add('done');
    setTimeout(() => gate.remove(), 500);
    window.dispatchEvent(new Event('aether:ready'));
  };

  skipBtn.addEventListener('click', finish);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') finish();
  }, { once: true });

  function drawAperture(t) {
    const p = Math.min(1, t / DURATION);
    const eased = 1 - Math.pow(1 - p, 3); // cubic-out
    ctx.clearRect(0, 0, CW, CH);

    // star backdrop
    for (const s of stars) {
      const a = 0.25 + 0.55 * Math.abs(Math.sin(t / 700 + s.tw));
      ctx.fillStyle = `rgba(231,226,212,${a * 0.55})`;
      ctx.beginPath();
      ctx.arc(s.x * CW, s.y * CH, s.r * (1 + p), 0, Math.PI * 2);
      ctx.fill();
    }

    // braille aperture — circle of dot-columns expanding then closing
    for (let cy = 0; cy < ROWS; cy++) {
      for (let cx = 0; cx < COLS; cx++) {
        const dx = cx - CX, dy = cy - CY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radius = eased * Math.max(CX, CY) * 1.25;
        const on = dist < radius && ((cx * 7 + cy * 13 + Math.floor(t / 90)) % 5 < 2);
        if (!on) continue;
        // pick a braille char from density
        const dense = Math.floor((1 - dist / (radius + 1)) * 5);
        const bits = [1, 3, 7, 15, 31, 63, 127, 255][dense] || 1;
        const ch = String.fromCharCode(0x2800 + bits);
        ctx.fillStyle = dist > radius - 4 ? 'rgba(212,175,55,0.95)' : 'rgba(56,189,248,0.7)';
        ctx.font = `${CELL_H}px "JetBrains Mono", monospace`;
        ctx.fillText(ch, cx * CELL_W, (cy + 1) * CELL_H);
      }
    }

    // title overlay fades in during the second half
    if (p > 0.45) {
      const o = (p - 0.45) / 0.55;
      ctx.textAlign = 'center';
      ctx.font = `800 30px "Syne", sans-serif`;
      ctx.fillStyle = `rgba(212,175,55,${o})`;
      ctx.fillText(TITLE, CW / 2, CH / 2 - 6);
      ctx.font = `500 9px "JetBrains Mono", monospace`;
      ctx.fillStyle = `rgba(155,163,180,${o})`;
      ctx.fillText(SUB.split('').map((c, i) =>
        Math.random() > o * 1.15 && c !== ' ' ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : c
      ).join(''), CW / 2, CH / 2 + 18);
    }

    if (!done) requestAnimationFrame((now) => drawAperture(now - start));
  }
  requestAnimationFrame((now) => drawAperture(0));

  // hard auto-finish at duration + glyph scramble finalization
  scrambleTimer = setInterval(() => {
    if (performance.now() - start >= DURATION) finish();
  }, 60);
}
