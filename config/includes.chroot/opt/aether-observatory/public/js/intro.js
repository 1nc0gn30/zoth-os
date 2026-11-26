// AETHER intro — crisp 700ms Braille aperture handoff.
// Auto-skips on prefers-reduced-motion, iframe embed (?embed=1), ?nointro=1, or repeat session visit.

const GLYPHS = '▚▞▛▟▙◐◑◒◓◔◕╬╩╦╠╣═│┤├┬┴≡≈≋∿∴∵⊹⊛✦✧';
const TITLE = 'AETHER OBSERVATORY';
const SUB = 'CYBER-PHYSICAL TELEMETRY · CONSTELLATION · SONIFIER';

const gate = document.getElementById('intro-gate');
const params = new URLSearchParams(location.search);
const isEmbedded = params.get('embed') === '1' || window.self !== window.top;
const skipRequested = params.get('nointro') === '1';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let alreadySeen = false;
try { alreadySeen = sessionStorage.getItem('aether-intro-seen') === '1'; } catch {}

if (!gate || reducedMotion || isEmbedded || skipRequested || alreadySeen) {
  gate?.remove();
  window.dispatchEvent(new Event('aether:ready'));
} else {
  const canvas = document.getElementById('intro-canvas');
  const skipBtn = document.getElementById('intro-skip');
  const ctx = canvas.getContext('2d');

  let seed = 1337;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stars = Array.from({ length: 180 }, () => ({ x: rnd(), y: rnd(), r: 0.5 + rnd() * 1.2, tw: rnd() * Math.PI * 2 }));

  const CW = 660, CH = 220;
  const CELL_W = 8, CELL_H = 8;
  const COLS = Math.floor(CW / CELL_W), ROWS = Math.floor(CH / CELL_H);
  const CX = COLS / 2, CY = ROWS / 2;

  const start = performance.now();
  const DURATION = 700;
  let done = false;
  let timer = null;

  const finish = () => {
    if (done) return;
    done = true;
    clearInterval(timer);
    try { sessionStorage.setItem('aether-intro-seen', '1'); } catch {}
    gate.classList.add('done');
    setTimeout(() => gate.remove(), 240);
    window.dispatchEvent(new Event('aether:ready'));
  };

  skipBtn?.addEventListener('click', finish);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') finish();
  }, { once: true });

  function drawAperture(t) {
    if (done) return;
    const p = Math.min(1, t / DURATION);
    const eased = 1 - Math.pow(1 - p, 3);
    ctx.clearRect(0, 0, CW, CH);

    for (const s of stars) {
      const a = 0.2 + 0.5 * Math.abs(Math.sin(t / 400 + s.tw));
      ctx.fillStyle = `rgba(231,226,212,${a * 0.5})`;
      ctx.beginPath();
      ctx.arc(s.x * CW, s.y * CH, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const radius = eased * Math.max(CX, CY) * 1.25;
    ctx.font = `${CELL_H}px monospace`;
    for (let cy = 0; cy < ROWS; cy++) {
      for (let cx = 0; cx < COLS; cx++) {
        const dx = cx - CX, dy = cy - CY;
        const dist = Math.hypot(dx, dy);
        if (dist >= radius || ((cx * 7 + cy * 13 + Math.floor(t / 70)) % 5 >= 2)) continue;
        const dense = Math.min(7, Math.max(0, Math.floor((1 - dist / (radius + 1)) * 6)));
        const bits = [1, 3, 7, 15, 31, 63, 127, 255][dense] || 1;
        ctx.fillStyle = dist > radius - 4 ? 'rgba(212,175,55,0.95)' : 'rgba(56,189,248,0.68)';
        ctx.fillText(String.fromCharCode(0x2800 + bits), cx * CELL_W, (cy + 1) * CELL_H);
      }
    }

    if (p > 0.3) {
      const o = Math.min(1, (p - 0.3) / 0.55);
      ctx.textAlign = 'center';
      ctx.font = '800 30px sans-serif';
      ctx.fillStyle = `rgba(212,175,55,${o})`;
      ctx.fillText(TITLE, CW / 2, CH / 2 - 6);
      ctx.font = '500 10px monospace';
      ctx.fillStyle = `rgba(166,174,191,${o})`;
      ctx.fillText(SUB.split('').map(c =>
        Math.random() > o * 1.15 && c !== ' ' ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : c
      ).join(''), CW / 2, CH / 2 + 18);
    }

    if (p >= 1) finish();
    else requestAnimationFrame((now) => drawAperture(now - start));
  }

  requestAnimationFrame(() => drawAperture(0));
  timer = setInterval(() => {
    if (performance.now() - start >= DURATION) finish();
  }, 50);
}
