/* ============================================================================
   zoth-fields.js — ZothOS procedural field library
   ----------------------------------------------------------------------------
   Every field is a pure function  f(nx, ny, t, P) -> [0,1]  where nx/ny are
   normalized-to-aspect coordinates (x in [-aspect*0.72, +aspect*0.72]) and t is
   a phase in "seconds". A field produces ONLY luminance; colour assignment
   happens later in the ASCII / pixel stages, exactly like Zoth ASCII Magic
   Studio does.

   FAMILY "core" (ported verbatim in behaviour from Zoth ASCII Magic Studio,
   public/index.html, evalProcedural(), lines 1635-1700):
     audioReactive  liquidChrome  cyberBust  torus4d  merkaba  datamosh
     radar          sigil

   FAMILY "ext" (added for the 1000-scene foundry; same contract):
     mandelbrot plasma tunnel terrain cityGrid circuit matrixRain kaleido
     spiral voronoi interference orbital hexSwarm glyphMesh reactor nebula
     runeSeal biomech oscilloscope aurora

   Determinism: a field must return the same value for the same (nx, ny, t, P).
   Where the original read live state (audio RMS, mouse light, wall clock) the
   port takes those from P instead, so a scene index alone reproduces a scene.
   ========================================================================== */
(function (root) {
  'use strict';

  var TAU = Math.PI * 2;

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function frac(v) { return v - Math.floor(v); }

  /* --- deterministic pseudo-audio, stands in for the live WebAudio analyser --- */
  function pseudoAudio(t, seed) {
    var s = seed || 0;
    var bass = 0.5 + 0.5 * Math.sin(t * 1.31 + s * 0.7);
    var mid = 0.5 + 0.5 * Math.sin(t * 2.17 + s * 1.9 + 1.1);
    var treble = 0.5 + 0.5 * Math.sin(t * 3.71 + s * 2.3 + 2.4);
    var rms = clamp01(0.30 + 0.42 * bass * mid + 0.12 * treble);
    return { bass: bass, mid: mid, treble: treble, rms: rms };
  }

  /* value noise + fbm, for the terrain / nebula / biomech fields */
  function vnoise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y);
    var xf = x - xi, yf = y - yi;
    function h(a, b) {
      var n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453123;
      return n - Math.floor(n);
    }
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a1 = h(xi, yi), b1 = h(xi + 1, yi), c1 = h(xi, yi + 1), d1 = h(xi + 1, yi + 1);
    return (a1 * (1 - u) + b1 * u) * (1 - v) + (c1 * (1 - u) + d1 * u) * v;
  }
  function fbm(x, y, oct, gain, lac) {
    var o = oct || 5, g = gain || 0.5, l = lac || 2.0;
    var s = 0, amp = 1, norm = 0, fx = x, fy = y;
    for (var i = 0; i < o; i++) { s += amp * vnoise(fx, fy); norm += amp; amp *= g; fx *= l; fy *= l; }
    return s / (norm || 1);
  }

  /* ==========================================================================
     CORE FAMILY — Zoth ASCII Magic Studio ports
     ========================================================================== */

  function fAudioReactive(nx, ny, t, P) {
    var m = pseudoAudio(t, P.seed);
    var x = nx * 1.25, y = ny * 1.25;
    var r = Math.hypot(x, y), a = Math.atan2(y, x);
    var bassRings = Math.sin(r * 18 - t * 6 * (1 + m.bass * 2.0)) * (0.4 + m.bass * 0.6);
    var midStar = Math.cos(5 * a + t * 3) * Math.exp(-Math.abs(r - 0.55) * 5.0) * (0.5 + m.mid * 0.8);
    var trebleSpark = Math.sin(nx * 24 + t * 8) * Math.cos(ny * 24) * m.treble * 0.45;
    var centerPulse = Math.exp(-r * 3.5) * (0.3 + m.rms * 1.2);
    return clamp01(0.2 + bassRings * 0.35 + midStar * 0.4 + centerPulse * 0.5 + trebleSpark);
  }

  function fLiquidChrome(nx, ny, t, P) {
    var w = P.warp;
    var dx = nx - P.light.x, dy = ny - P.light.y;
    var dLight = Math.hypot(dx, dy);
    var ripple = Math.sin(dLight * 14.0 * w - t * 3.5) * Math.exp(-dLight * 1.8);
    var sigilR = Math.hypot(nx, ny), sigilA = Math.atan2(ny, nx);
    var crest = Math.exp(-Math.abs(sigilR - 0.62) * 8.0) * (0.8 + 0.3 * Math.cos(sigilA * 6));
    var normX = nx + ripple * (dx / Math.max(0.1, dLight)) + Math.cos(sigilA * 3) * 0.15;
    var normY = ny + ripple * (dy / Math.max(0.1, dLight)) + Math.sin(sigilA * 3) * 0.15;
    var spec = Math.pow(Math.max(0, normX * Math.cos(t * 0.8) + normY * Math.sin(t * 0.8)), 5.0);
    var rim = Math.pow(1.0 - Math.min(1.0, Math.hypot(normX, normY)), 2.2);
    return clamp01(crest * 0.45 + spec * 0.65 + rim * 0.35 + 0.08);
  }

  function fCyberBust(nx, ny, t, P) {
    var headR = 0.68;
    var r = Math.hypot(nx * 1.25, ny * 1.25), a = Math.atan2(ny * 1.25, nx * 1.25);
    var dHead = Math.hypot(nx, ny * 0.92 + 0.05);
    var halo = Math.exp(-Math.abs(r - 0.88) * 14) * (0.65 + 0.35 * Math.sin(a * 8 - t * 3));
    if (dHead < headR) {
      var nz = Math.sqrt(Math.max(0.001, headR * headR - dHead * dHead)) / headR;
      var lx = P.light.x - nx, ly = P.light.y - ny, lz = 0.85;
      var lLen = Math.hypot(lx, ly, lz);
      var ndotl = Math.max(0.08, (nx * (lx / lLen) + ny * (ly / lLen) + nz * (lz / lLen)));
      var visor = Math.abs(ny + 0.08 - 0.04 * Math.cos(nx * 3)) < 0.11 && Math.abs(nx) < 0.48
        ? 0.35 + 0.55 * Math.sin(nx * 14 + t * 5) : 0;
      return Math.min(1, ndotl * 0.85 + visor * 0.45);
    }
    var gridBg = Math.max(0, Math.sin(nx * 18) * Math.cos((ny + t * 0.25) * 18)) * 0.15;
    return Math.min(1, halo + gridBg);
  }

  function fTorus4d(nx, ny, t, P) {
    var x = nx * 1.25, y = ny * 1.25;
    var r = Math.hypot(x, y), a = Math.atan2(y, x);
    var ring1 = Math.cos((r - 0.52 - 0.14 * Math.sin(3 * a + t * 2.1)) * 13);
    var twist = Math.sin(4 * a - t * 2.6 + r * 6 * P.warp);
    var core = Math.exp(-r * 2.2) * Math.cos(r * 16 - t * 4);
    return clamp01(ring1 * 0.5 + twist * 0.35 + core * 0.45 + 0.55);
  }

  function fMerkaba(nx, ny, t, P) {
    var x = nx * 1.25, y = ny * 1.25;
    var r = Math.hypot(x, y), a = Math.atan2(y, x);
    var tri1 = Math.cos(3 * (a + t * 0.9)) * Math.exp(-Math.abs(r - 0.55) * 4.5);
    var tri2 = Math.cos(3 * (a - t * 0.9 + Math.PI / 3)) * Math.exp(-Math.abs(r - 0.55) * 4.5);
    var center = Math.exp(-r * 3.8);
    return clamp01(0.48 + tri1 * 0.45 + tri2 * 0.45 + center * 0.4);
  }

  function fDatamosh(nx, ny, t, P) {
    var x = nx * 1.25, y = ny * 1.25;
    var shift = Math.sin(Math.floor((ny + 1) * 12) * 3.7 + Math.floor(t * 6)) * 0.35 * P.warp;
    var band = Math.sin((x + shift) * 8 - t * 5) * Math.cos(y * 14 + Math.sin(t * 3) * 2);
    return clamp01(0.5 + band * 0.48);
  }

  function fRadar(nx, ny, t, P) {
    var x = nx * 1.25, y = ny * 1.25;
    var r = Math.hypot(x, y), a = Math.atan2(y, x);
    var sweep = (t * 2.2) % TAU;
    var diff = (((a - sweep) % TAU) + TAU) % TAU;
    var beam = Math.exp(-diff * 3.2) * Math.exp(-r * 0.9);
    var rings = Math.pow(Math.max(0, Math.cos(r * 16)), 6) * 0.55;
    return clamp01(beam * 0.85 + rings);
  }

  /* "sigil" is the studio's fallback branch: seal rings + hex wave, then the
     shared light falloff that every core field passes through. */
  function sigilBase(nx, ny, t, P) {
    var x = nx * 1.25, y = ny * 1.25;
    var r = Math.hypot(x, y), a = Math.atan2(y, x);
    var hexWave = Math.cos(6 * a + Math.sin(r * 10 - t * 3) * P.warp * 2);
    var seal = Math.exp(-Math.abs(r - 0.62) * 6.5) + Math.exp(-Math.abs(r - 0.32) * 7.5);
    return clamp01(0.25 + seal * 0.55 + hexWave * 0.28);
  }
  function fSigil(nx, ny, t, P) {
    var base = sigilBase(nx, ny, t, P);
    var dLight = Math.hypot(nx - P.light.x, ny - P.light.y);
    return clamp01(base * 0.82 + Math.exp(-dLight * 1.45) * 0.38);
  }

  /* ==========================================================================
     EXT FAMILY — added for the foundry
     ========================================================================== */

  function fMandelbrot(nx, ny, t, P) {
    var s = 1.05 + 0.28 * Math.sin(t * 0.21 + P.seed);
    var ox = -0.62 + 0.06 * Math.cos(t * 0.13), oy = 0.0;
    var cr = nx * s * 0.75 + ox, ci = ny * s * 0.75 + oy;
    var zr = 0, zi = 0, i = 0, max = 42;
    while (i < max && zr * zr + zi * zi < 4) {
      var nr = zr * zr - zi * zi + cr;
      zi = 2 * zr * zi + ci; zr = nr; i++;
    }
    var esc = i >= max ? 1 : i / max;
    return clamp01(0.12 + 0.88 * Math.pow(esc, 0.55));
  }

  function fPlasma(nx, ny, t, P) {
    var w = P.warp;
    var v = Math.sin(nx * 5.0 + t * 1.1) + Math.sin(ny * 4.2 - t * 0.9)
      + Math.sin((nx + ny) * 3.1 + t * 1.7 * w) + Math.sin(Math.hypot(nx, ny) * 7.0 - t * 2.2);
    return clamp01(0.5 + v * 0.17);
  }

  function fTunnel(nx, ny, t, P) {
    var r = Math.hypot(nx, ny) + 1e-4;
    var a = Math.atan2(ny, nx);
    var depth = 1 / r;
    var u = a * 3.2 + Math.sin(depth * 1.7 + t * 2.0) * 1.4 * P.warp;
    var v = depth * 1.15 - t * 1.6;
    var check = Math.sin(u * 3) * Math.cos(v * 3);
    var wall = Math.pow(clamp(1 - r * 1.15, 0, 1), 1.6);
    return clamp01(0.5 + check * 0.42 * (0.35 + wall));
  }

  function fTerrain(nx, ny, t, P) {
    var horizon = 0.02 + 0.06 * Math.sin(t * 0.17 + P.seed);
    var h = fbm(nx * 2.2 + P.seed, ny * 3.1 - t * 0.11, 5, 0.52, 2.05);
    var ridge = 1 - Math.abs(h * 2 - 1);
    var upper = ny > horizon;
    var sky = 0.06 + 0.60 * Math.pow(clamp(1 - (ny - horizon) / 0.9, 0, 1), 1.5);
    var map = clamp01(0.08 + ridge * 0.92 - Math.abs(ny - horizon) * 0.15);
    if (upper) return clamp01(map * 0.95 + 0.05);
    return sky;
  }

  function fCityGrid(nx, ny, t, P) {
    var px = frac((nx + 2) * 6.5), py = frac((ny + 1.2) * 9.0);
    var cellX = Math.floor((nx + 2) * 6.5), cellY = Math.floor((ny + 1.2) * 9.0);
    var seedv = frac(Math.sin(cellX * 12.9898 + cellY * 78.233 + P.seed) * 43758.5453);
    var height = 0.18 + seedv * 0.72;
    var lit = frac(seedv * 97.13) > 0.42 ? 1 : 0;
    var inB = px > 0.14 && px < 0.86 && py > 0.14 && py < 0.86;
    var litWin = frac(py * 7 + t * 0.35 + seedv * 3) > 0.45 ? 1 : 0;
    var base = 0.05 + 0.10 * Math.sin(nx * 30) * Math.cos(ny * 30);
    if (inB && ny > -1 + height * 1.15) return clamp01(0.28 + 0.55 * lit * litWin);
    return clamp01(base);
  }

  function fCircuit(nx, ny, t, P) {
    var gx = nx * 5.5, gy = ny * 4.0;
    var lx = Math.abs(frac(gx) - 0.5), ly = Math.abs(frac(gy) - 0.5);
    var axisH = Math.abs(frac(gy + 0.5 * Math.round(gx)) - 0.5);
    var trace = Math.min(lx, ly) < 0.045 ? 1 : 0;
    var bus = axisH < 0.05 ? 1 : 0;
    var node = (lx < 0.14 && ly < 0.14) ? 1 : 0;
    var pulse = 0.5 + 0.5 * Math.sin(t * 2.4 - (gx + gy) * 1.6);
    var v = trace * (0.30 + pulse * 0.55) + bus * 0.45 + node * 0.85;
    return clamp01(0.04 + v);
  }

  function fMatrixRain(nx, ny, t, P) {
    var col = Math.floor((nx + 2) * 14);
    var lane = frac(Math.sin(col * 91.7 + P.seed) * 43758.5453);
    var speed = 1.1 + lane * 2.4;
    var head = frac(t * speed * 0.28 + lane);
    var dist = head - (ny + 1) * 0.5;
    if (dist < 0) dist += 1;
    var trail = Math.exp(-dist * 7.5);
    var headGlow = Math.exp(-Math.abs(dist) * 40) * 1.2;
    return clamp01(0.03 + trail * 0.72 + headGlow);
  }

  function fKaleido(nx, ny, t, P) {
    var x = nx * 1.25, y = ny * 1.25;
    var r = Math.hypot(x, y), a = Math.atan2(y, x);
    var sectors = 6 + Math.round(P.kSeg || 0);
    var k = a % (TAU / sectors);
    k = Math.abs(k - TAU / (sectors * 2));
    var fold = Math.sin(k * sectors * 3.0 + r * 12 - t * 1.8);
    var petals = Math.pow(Math.max(0, Math.cos(r * 9 - t * 1.2)), 3);
    return clamp01(0.12 + 0.62 * Math.abs(fold) * (0.4 + petals));
  }

  function fSpiral(nx, ny, t, P) {
    var x = nx * 1.25, y = ny * 1.25;
    var r = Math.hypot(x, y), a = Math.atan2(y, x);
    var arms = 3 + Math.round(P.kSeg || 0);
    var s = Math.sin(arms * a + r * 16 * P.warp - t * 2.6);
    var env = Math.exp(-Math.abs(r - 0.55) * 3.2) + Math.exp(-r * 5.0) * 0.7;
    return clamp01(0.10 + Math.pow(Math.abs(s), 1.35) * 0.75 * (0.35 + env));
  }

  function fVoronoi(nx, ny, t, P) {
    var gx = (nx + 2) * 7, gy = (ny + 1.2) * 7;
    var ix = Math.floor(gx), iy = Math.floor(gy);
    var best = 1e9, second = 1e9;
    for (var oy = -1; oy <= 1; oy++) {
      for (var ox = -1; ox <= 1; ox++) {
        var cx = ix + ox, cy = iy + oy;
        var hs = frac(Math.sin(cx * 43.17 + cy * 91.33 + P.seed) * 43758.5453);
        var ht = frac(Math.sin(cx * 12.71 + cy * 71.91 + P.seed * 3) * 24634.6345);
        var px = cx + hs + 0.25 * Math.sin(t * 0.7 + hs * 6.28);
        var py = cy + ht + 0.25 * Math.cos(t * 0.6 + ht * 6.28);
        var d = Math.hypot(gx - px, gy - py);
        if (d < best) { second = best; best = d; } else if (d < second) { second = d; }
      }
    }
    var edge = Math.abs(second - best);
    return clamp01(0.92 - edge * 0.62);
  }

  function fInterference(nx, ny, t, P) {
    var v = 0;
    var n = 3 + Math.round(P.kSeg || 0);
    for (var i = 0; i < n; i++) {
      var ax = Math.cos(i * 2.399 + P.seed), ay = Math.sin(i * 2.399 + P.seed);
      var d = Math.hypot(nx - ax * 0.6, ny - ay * 0.6);
      v += Math.sin(d * 22 - t * 2.4 + i);
    }
    return clamp01(0.5 + (v / n) * 0.42);
  }

  function fOrbital(nx, ny, t, P) {
    var x = nx * 1.25, y = ny * 1.25;
    var r = Math.hypot(x, y), a = Math.atan2(y, x);
    var v = Math.exp(-r * 7.0) * 0.9;
    var n = 4 + Math.round(P.kSeg || 0);
    for (var i = 0; i < n; i++) {
      var s = i / n * TAU + P.seed;
      var ex = Math.cos(t * (0.6 + i * 0.17) + s);
      var ey = Math.sin(t * (0.6 + i * 0.17) + s);
      var oy = 0.42 + i * 0.06;
      var d = Math.hypot(x - ex * oy * 1.9, y - ey * oy * 0.72);
      v += Math.exp(-d * 16) * 0.75;
    }
    return clamp01(v);
  }

  function fHexSwarm(nx, ny, t, P) {
    var hx = (nx + 2) * 5.2, hy = (ny + 1.2) * 6.0;
    var row = Math.floor(hy), colf = hx + (row % 2 ? 0.5 : 0);
    var col = Math.floor(colf);
    var lx = Math.abs(frac(colf) - 0.5), ly = Math.abs(frac(hy) - 0.5);
    var hs = frac(Math.sin(col * 31.7 + row * 57.3 + P.seed) * 43758.5453);
    var on = hs > 0.28 + 0.18 * Math.sin(t * 1.2 + hs * 6.28) ? 1 : 0;
    var hex = (lx * 1.3 + ly) < 0.52 ? 1 : 0;
    return clamp01(0.05 + hex * on * 0.78 + (hex ? 0.12 : 0));
  }

  function fGlyphMesh(nx, ny, t, P) {
    var gx = (nx + 2) * 9, gy = (ny + 1.2) * 6;
    var ix = Math.floor(gx), iy = Math.floor(gy);
    var lx = frac(gx) - 0.5, ly = frac(gy) - 0.5;
    var hs = frac(Math.sin(ix * 17.71 + iy * 63.13 + P.seed) * 31571.4235);
    var thick = 0.12 + hs * 0.3;
    var diag = Math.abs(Math.abs(lx) - Math.abs(ly)) < thick * 0.5 ? 1 : 0;
    var cross = (Math.abs(lx) < thick * 0.42 || Math.abs(ly) < thick * 0.42) ? 1 : 0;
    var glyph = (hs > 0.5 ? diag : cross);
    var breathe = 0.72 + 0.28 * Math.sin(t * 1.5 + hs * 6.28);
    return clamp01(0.04 + glyph * 0.80 * breathe);
  }

  function fReactor(nx, ny, t, P) {
    var x = nx * 1.25, y = ny * 1.25;
    var r = Math.hypot(x, y), a = Math.atan2(y, x);
    var core = Math.exp(-r * 5.5) * (0.85 + 0.35 * Math.sin(t * 3.1));
    var cage = Math.pow(Math.max(0, Math.cos(a * 12 + t * 0.8)), 8) * clamp(1 - r * 0.9, 0, 1) * 0.5;
    var ring = Math.exp(-Math.abs(r - 0.66) * 9.0) * 0.8;
    var ring2 = Math.exp(-Math.abs(r - 0.40) * 11.0) * 0.55;
    return clamp01(core + cage + ring + ring2);
  }

  function fNebula(nx, ny, t, P) {
    var n1 = fbm(nx * 2.6 + P.seed, ny * 2.6 - t * 0.05, 6, 0.55, 2.1);
    var n2 = fbm(nx * 6.5 - P.seed * 2, ny * 6.5 + t * 0.07, 3, 0.5, 2.0);
    var cloud = Math.pow(clamp01(n1 * 1.25 - 0.12), 1.7);
    var stars = n2 > 0.78 ? (n2 - 0.78) * 3.4 : 0;
    return clamp01(cloud * 0.78 + stars * 0.9);
  }

  function fRuneSeal(nx, ny, t, P) {
    var x = nx * 1.25, y = ny * 1.25;
    var r = Math.hypot(x, y), a = Math.atan2(y, x);
    var rings = 0;
    var R = [0.30, 0.44, 0.58, 0.74];
    for (var i = 0; i < R.length; i++) {
      var wob = 0.012 * Math.sin(a * 24 + P.seed + i);
      rings += Math.exp(-Math.abs(r - (R[i] + wob)) * 220) * (0.55 + 0.45 * Math.sin(t * 1.1 + i));
    }
    var spokes = Math.pow(Math.max(0, Math.cos(a * 8 + t * 0.35 + P.seed)), 26) * clamp(1 - r, 0, 1) * 0.85;
    var runes = Math.pow(Math.max(0, Math.cos(a * 32 + P.seed * 3)), 40) * clamp01(r > 0.30 && r < 0.46 ? 1 : 1 - Math.abs(r - 0.38) * 4) * 0.9;
    return clamp01(rings * 0.9 + spokes + runes);
  }

  function fBiomech(nx, ny, t, P) {
    var n = fbm(nx * 3.4 + P.seed, ny * 3.4, 5, 0.5, 2.2);
    var veins = Math.pow(Math.abs(Math.sin(n * 12 + t * 0.4)), 0.55);
    var rim = 1 - Math.abs(n * 2 - 1);
    var pulse = 0.6 + 0.4 * Math.sin(t * 1.3 + n * 5);
    return clamp01(0.06 + Math.pow(rim, 2.4) * 0.9 * pulse + veins * 0.22);
  }

  function fOscilloscope(nx, ny, t, P) {
    var trace = 0;
    var n = 2 + Math.round(P.kSeg || 0);
    for (var i = 0; i < n; i++) {
      var f = 1.6 + i * 1.35;
      var amp = 0.42 / (1 + i * 0.55);
      var y = amp * Math.sin(nx * f * Math.PI + t * (1.4 + i * 0.4) + P.seed)
        + 0.12 * Math.sin(nx * f * 3.7 * Math.PI - t * 0.9);
      var d = Math.abs(ny - y);
      trace = Math.max(trace, Math.exp(-d * 42) * (0.7 + 0.3 * Math.sin(t * 6)));
    }
    var grid = (Math.abs(frac((nx + 2) * 8) - 0.5) < 0.02 || Math.abs(frac(ny * 6 + 0.5) - 0.5) < 0.02) ? 0.12 : 0;
    return clamp01(0.03 + trace + grid);
  }

  function fAurora(nx, ny, t, P) {
    var n = fbm(nx * 1.8 + P.seed, t * 0.09, 4, 0.55, 2.0);
    var band1 = Math.exp(-Math.pow((ny - (0.15 + n * 0.85)) * 3.4, 2));
    var band2 = Math.exp(-Math.pow((ny - (0.55 + n * 0.5)) * 5.0, 2)) * 0.7;
    var ripple = 0.65 + 0.35 * Math.sin(nx * 9 + t * 1.6 + P.seed);
    var stars = fbm(nx * 12, ny * 12, 2, 0.5, 2.0) > 0.82 ? 0.35 : 0;
    return clamp01((band1 + band2) * ripple * 0.8 + stars);
  }

  /* ==========================================================================
     Registry
     ========================================================================== */
  var FIELDS = {
    audioReactive: fAudioReactive,
    liquidChrome: fLiquidChrome,
    cyberBust: fCyberBust,
    torus4d: fTorus4d,
    merkaba: fMerkaba,
    datamosh: fDatamosh,
    radar: fRadar,
    sigil: fSigil,
    mandelbrot: fMandelbrot,
    plasma: fPlasma,
    tunnel: fTunnel,
    terrain: fTerrain,
    cityGrid: fCityGrid,
    circuit: fCircuit,
    matrixRain: fMatrixRain,
    kaleido: fKaleido,
    spiral: fSpiral,
    voronoi: fVoronoi,
    interference: fInterference,
    orbital: fOrbital,
    hexSwarm: fHexSwarm,
    glyphMesh: fGlyphMesh,
    reactor: fReactor,
    nebula: fNebula,
    runeSeal: fRuneSeal,
    biomech: fBiomech,
    oscilloscope: fOscilloscope,
    aurora: fAurora
  };

  var CORE_FIELDS = ['audioReactive', 'liquidChrome', 'cyberBust', 'torus4d', 'merkaba',
    'datamosh', 'radar', 'sigil'];
  var EXT_FIELDS = ['mandelbrot', 'plasma', 'tunnel', 'terrain', 'cityGrid', 'circuit',
    'matrixRain', 'kaleido', 'spiral', 'voronoi', 'interference', 'orbital', 'hexSwarm',
    'glyphMesh', 'reactor', 'nebula', 'runeSeal', 'biomech', 'oscilloscope', 'aurora'];
  var FIELD_NAMES = CORE_FIELDS.concat(EXT_FIELDS);

  root.ZothFields = {
    TAU: TAU,
    fields: FIELDS,
    names: FIELD_NAMES,
    core: CORE_FIELDS,
    ext: EXT_FIELDS,
    clamp01: clamp01,
    clamp: clamp,
    frac: frac,
    fbm: fbm,
    vnoise: vnoise,
    pseudoAudio: pseudoAudio,
    eval: function (name, nx, ny, t, P) {
      var f = FIELDS[name] || FIELDS.sigil;
      return f(nx, ny, t, P || { light: { x: -0.35, y: -0.35 }, warp: 1.15, seed: 0 });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);