/* ============================================================================
   zoth-foundry.js — the 1000-scene generator
   ----------------------------------------------------------------------------
   A scene is fully described by its index. sceneSpec(i) is pure: same i, same
   spec, forever. renderScene(spec) needs a DOM (canvas) and produces
     { ascii: {text, ansi, cols, rows}, pixel: {canvas, w, h, scale}, three? }
   so every scene yields BOTH an ASCII panel and a pixel-art canvas, and the
   scenes whose index is divisible by 8 also yield the 3D ASCII panel
   (the three.js AsciiEffect-influenced stage).

   UNIQUENESS BY CONSTRUCTION (this is the point of the index math):
     i in [0,1680)  ->  (field, ramp, tube) = (i%28, floor(i/28)%10, floor(i/280)%6)
     is a bijection, so 28x10x6 = 1680 distinct triples. The 1000 scenes
     therefore never share a (field, ramp, tube) triple, and on top of that each
     scene gets its own phase, warp, light, seed and grid density from a hash.
   ========================================================================== */
(function (root) {
  'use strict';

  var TOTAL = 1000;
  var THREE_EVERY = 8;                       /* 125 scenes get the 3D stage */

  var FIELDS = (root.ZothFields && root.ZothFields.names) || ['sigil'];
  var RAMPS = ['ascii', 'braille', 'atkinson', 'floyd', 'bayer4', 'bayer8',
    'blocks', 'katakana', 'newsprint', 'hex'];
  var TUBES = ['gold', 'amber', 'emerald', 'cyan', 'crimson', 'neon'];
  var PIX_PALETTES = ['tube-gold', 'tube-amber', 'tube-emerald', 'tube-cyan', 'tube-crimson',
    'tube-neon', '1bit', '1bit-dark', 'zoth4', 'zoth6', 'paper', 'tube-gold-3', 'tube-cyan-4'];
  var DITHERS = ['bayer4', 'bayer8', 'fs', 'atkinson'];

  var ADJ = ['ANCIENT', 'HOLLOW', 'BLAZING', 'FROZEN', 'BROKEN', 'SILENT', 'INFINITE',
    'SHATTERED', 'PREHISTORIC', 'ORBITAL', 'BURIED', 'ELECTRIC', 'GLASS', 'IRON',
    'SUNKEN', 'TIDAL', 'NEON', 'ASHEN', 'CRYSTAL', 'WOUND', 'LATENT', 'TALL'];
  var NOUN = ['CATHEDRAL', 'ENGINE', 'REACTOR', 'SEAL', 'GATE', 'MACHINE', 'CHOIR',
    'CITADEL', 'ORACLE', 'VAULT', 'SIGIL', 'TERMINAL', 'SPIRE', 'FURNACE',
    'RELAY', 'ARCHIVE', 'BEACON', 'FORGE', 'HELIX', 'TOTEM', 'LENS', 'CIRCUIT'];

  function hash32(n) {
    var h = (n ^ 0x9e3779b9) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
    return (h ^ (h >>> 16)) >>> 0;
  }
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1) >>> 0;
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61) >>> 0;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pick(arr, r) { return arr[Math.floor(r() * arr.length) % arr.length]; }

  function sceneSpec(i) {
    var field = FIELDS[i % FIELDS.length];
    var ramp = RAMPS[Math.floor(i / FIELDS.length) % RAMPS.length];
    var tube = TUBES[Math.floor(i / (FIELDS.length * RAMPS.length)) % TUBES.length];
    var r = rng(hash32(i * 2654435761));
    var is3d = (i % THREE_EVERY === 0);
    var cols = 56 + 2 * Math.floor(r() * 40);              /* 56..134 */
    var aspect = 1.45 + r() * 0.5;
    var rows = root.ZothAscii ? root.ZothAscii.rowsFor(cols, aspect, 0.55) : Math.max(18, Math.round(cols * 0.55 / aspect));
    var pw = 48 + 2 * Math.floor(r() * 5) * 8;             /* 48..112 */
    var ph = Math.max(24, Math.round(pw / aspect));
    var adj = ADJ[hash32(i * 7 + 11) % ADJ.length];
    var noun = NOUN[hash32(i * 13 + 5) % NOUN.length];
    return {
      index: i,
      id: 'ZS-' + String(i + 1).padStart(4, '0'),
      name: adj + ' ' + noun + ' // ' + field.toUpperCase() + ' · ' + tube.toUpperCase(),
      field: field,
      ramp: ramp,
      tube: tube,
      cols: cols,
      rows: rows,
      aspect: aspect,
      sobel: (i % 3 !== 2),
      threshold: 0.28 + 0.12 * r(),
      dither: pick(DITHERS, r),
      t: r() * 12,
      warp: 0.7 + r() * 1.4,
      seed: Math.floor(r() * 1000),
      light: { x: -0.9 + 1.8 * r(), y: -0.7 + 1.4 * r() },
      kSeg: Math.floor(r() * 4),
      three: is3d,
      threeScene: (i / THREE_EVERY | 0) % (root.ZothThreeAscii ? root.ZothThreeAscii.SCENE_NAMES.length : 6),
      pixel: {
        palette: PIX_PALETTES[hash32(i * 31 + 3) % PIX_PALETTES.length],
        dither: pick(DITHERS.concat(['none']), r),
        strength: 0.6 + r() * 0.6,
        w: pw, h: ph,
        scale: 2 + Math.floor(r() * 3)
      }
    };
  }

  function fnv1a(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return ('00000000' + h.toString(16)).slice(-8);
  }

  /* ASCII panel for a spec. Uses the studio ramp + sobel + optional diffusion. */
  function asciiFor(spec, opts) {
    var o = opts || {};
    return root.ZothAscii.renderAscii(spec.cols, spec.rows, {
      field: spec.field, rampId: spec.ramp, tube: spec.tube,
      t: o.t === undefined ? spec.t : o.t,
      aspect: spec.aspect, seed: spec.seed, warp: spec.warp,
      light: spec.light, kSeg: spec.kSeg,
      sobel: spec.sobel, threshold: spec.threshold,
      ansi: !!o.ansi
    });
  }

  /* Pixel-art canvas for a spec (needs a canvas element). */
  function pixelFor(spec, canvas, opts) {
    var o = opts || {};
    return root.ZothPixel.drawPixel(canvas, null, {
      field: spec.field,
      w: spec.pixel.w, h: spec.pixel.h, scale: spec.pixel.scale,
      palette: spec.pixel.palette,
      dither: spec.pixel.dither === 'none' ? (o.dither || 'bayer4') : spec.pixel.dither,
      strength: spec.pixel.strength,
      tube: spec.tube,
      boxW: (canvas && canvas.getAttribute('data-boxw')) || undefined,
      boxH: (canvas && canvas.getAttribute('data-boxh')) || undefined,
      t: o.t === undefined ? spec.t : o.t,
      aspect: spec.aspect, seed: spec.seed, warp: spec.warp,
      light: spec.light, kSeg: spec.kSeg
    });
  }

  /* 3D ASCII panel: SDF raymarch -> luminance -> same glyph stage. */
  function threeFor(spec, opts) {
    var o = opts || {};
    return root.ZothThreeAscii.renderAscii3d(spec.cols, Math.max(18, Math.round(spec.rows * 0.75)), {
      sceneIndex: spec.threeScene,
      rampId: spec.ramp === 'ascii' ? 'braille' : spec.ramp,
      tube: spec.tube,
      t: o.t === undefined ? spec.t : o.t,
      warp: spec.warp, seed: spec.seed, light: spec.light,
      force: o.force, ansi: false
    });
  }

  function renderScene(spec, opts) {
    var o = opts || {};
    var a = asciiFor(spec, o);
    var out = { spec: spec, ascii: a, hash: fnv1a(a.text + '|' + spec.ramp + '|' + spec.pixel.palette) };
    if (o.canvas) out.pixel = pixelFor(spec, o.canvas, o);
    if (spec.three && root.ZothThreeAscii) out.three = threeFor(spec, o);
    return out;
  }

  /* index list helper (filters) */
  function range(n, from) {
    var out = [], s = from || 0;
    for (var i = s; i < s + n; i++) out.push(i);
    return out;
  }
  function allSpecs() { var out = []; for (var i = 0; i < TOTAL; i++) out.push(sceneSpec(i)); return out; }

  root.ZothFoundry = {
    TOTAL: TOTAL,
    THREE_EVERY: THREE_EVERY,
    FIELDS: FIELDS,
    RAMPS: RAMPS,
    TUBES: TUBES,
    PIX_PALETTES: PIX_PALETTES,
    DITHERS: DITHERS,
    hash32: hash32,
    rng: rng,
    fnv1a: fnv1a,
    sceneSpec: sceneSpec,
    allSpecs: allSpecs,
    asciiFor: asciiFor,
    pixelFor: pixelFor,
    threeFor: threeFor,
    renderScene: renderScene,
    range: range
  };
})(typeof window !== 'undefined' ? window : globalThis);