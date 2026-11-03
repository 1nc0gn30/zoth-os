/* ============================================================================
   zoth-ascii.js — ZothOS ASCII pipeline (the "ASCII three.js" sampler contract)
   ----------------------------------------------------------------------------
   Constants are the studio's, verbatim from Zoth ASCII Magic Studio
   (public/index.html lines 1060-1120, 1755-1860):
     RAMPS, TUBE_PALETTES, PRESET_COLORS, BAYER_4X4, BAYER_8X8,
     bayer strength 0.32 (4x4) / 0.36 (8x8), sobel edge threshold 0.34,
     highlight rule v > 0.82 -> rgb(255,250,235), else tube * (0.35 + v*0.65),
     rows = max(18, round(cols * (h/w) * 0.55)).

   The sampler is deliberately the same interface an ASCII-Shader/AsciiEffect
   post-process uses: SOMETHING produces a luminance buffer at the target glyph
   grid (here a field, in three.js a rendered framebuffer), then
   lumToGlyph() maps buffer -> characters. Swap the buffer source, keep the
   stage. That is how the three.js AsciiEffect influence is carried.
   ========================================================================== */
(function (root) {
  'use strict';

  var RAMPS = {
    ascii: ' \u00b7,:;+*?%S#@',
    braille: ' \u2801\u2803\u2807\u280f\u281f\u283f\u28ff',
    atkinson: ' \u00b7\u2591\u2592\u2593\u2588',
    floyd: ' \u00b7\u2591\u2592\u2593\u2588',
    bayer4: ' \u00b7\u2591\u2592\u2593\u2588',
    bayer8: '  \u2582\u2583\u2584\u2585\u2586\u2587\u2588',
    blocks: ' \u00b7\u2591\u2592\u2593\u2588',
    katakana: ' \u00b7:+=*\uff71\uff72\uff73\uff74\uff75\uff76\uff77\uff78\uff79\uff7a\uff7b\uff7c\uff7d\uff7e\uff7f',
    newsprint: ' \u00b7\u2022\u25cf\u2b24',
    hex: ' .01379ACEF#'
  };

  var BAYER_4X4 = [
    [0 / 16, 8 / 16, 2 / 16, 10 / 16],
    [12 / 16, 4 / 16, 14 / 16, 6 / 16],
    [3 / 16, 11 / 16, 1 / 16, 9 / 16],
    [15 / 16, 7 / 16, 13 / 16, 5 / 16]
  ];

  var BAYER_8X8 = [
    [0 / 64, 32 / 64, 8 / 64, 40 / 64, 2 / 64, 34 / 64, 10 / 64, 42 / 64],
    [48 / 64, 16 / 64, 56 / 64, 24 / 64, 50 / 64, 18 / 64, 58 / 64, 26 / 64],
    [12 / 64, 44 / 64, 4 / 64, 36 / 64, 14 / 64, 46 / 64, 6 / 64, 38 / 64],
    [60 / 64, 28 / 64, 52 / 64, 20 / 64, 62 / 64, 30 / 64, 54 / 64, 22 / 64],
    [3 / 64, 35 / 64, 11 / 64, 43 / 64, 1 / 64, 33 / 64, 9 / 64, 41 / 64],
    [51 / 64, 19 / 64, 59 / 64, 27 / 64, 49 / 64, 17 / 64, 57 / 64, 25 / 64],
    [15 / 64, 47 / 64, 7 / 64, 39 / 64, 13 / 64, 45 / 64, 5 / 64, 37 / 64],
    [63 / 64, 31 / 64, 55 / 64, 23 / 64, 61 / 64, 29 / 64, 53 / 64, 21 / 64]
  ];

  var TUBE_PALETTES = {
    gold: [212, 175, 55],
    amber: [245, 158, 11],
    emerald: [16, 185, 129],
    cyan: [0, 240, 255],
    crimson: [244, 63, 94],
    neon: [192, 132, 252]
  };

  var PRESET_COLORS = {
    cyberBust: [56, 189, 248],
    liquidChrome: [241, 245, 249],
    torus4d: [212, 175, 55],
    merkaba: [192, 132, 252],
    datamosh: [236, 72, 153],
    radar: [52, 211, 153],
    sigil: [245, 158, 11],
    audioReactive: [192, 132, 252]
  };

  var DITHER_STRENGTH = { bayer4: 0.32, bayer8: 0.36 };
  var SOBEL_THRESHOLD = 0.34;
  var HIGHLIGHT = [255, 250, 235];

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  function rowsFor(cols, aspect, density) {
    var d = density === undefined ? 0.55 : density;
    return Math.max(18, Math.round(cols * (1 / aspect) * d));
  }

  /* Field -> luminance buffer. Same coordinate mapping as the studio's loop:
     ny = r/(rows-1)*2-1 ; nx = (c/(cols-1)*2-1) * aspect * 0.72
     (the studio multiplies by cw/ch, which IS the aspect; we pass it in). */
  function sampleField(fieldName, cols, rows, opts) {
    var o = opts || {};
    var t = o.t === undefined ? 0 : o.t;
    var aspect = o.aspect === undefined ? 1.6 : o.aspect;
    var P = {
      light: o.light || { x: -0.35, y: -0.35 },
      warp: o.warp === undefined ? 1.15 : o.warp,
      seed: o.seed === undefined ? 0 : o.seed,
      kSeg: o.kSeg === undefined ? 0 : o.kSeg
    };
    var ev = null;
    if (root.ZothFields) ev = root.ZothFields.eval;
    var lum = new Float32Array(rows * cols);
    for (var r = 0; r < rows; r++) {
      var ny = rows === 1 ? 0 : (r / (rows - 1)) * 2 - 1;
      for (var c = 0; c < cols; c++) {
        var nx = cols === 1 ? 0 : ((c / (cols - 1)) * 2 - 1) * aspect * 0.72;
        lum[r * cols + c] = ev ? ev(fieldName, nx, ny, t, P) : 0.5;
      }
    }
    return lum;
  }

  /* Any luminance buffer (field, or readPixels() from a WebGL framebuffer)
     -> characters. This is the single junction where the three.js AsciiEffect
     idea plugs in. */
  function lumToGlyph(v, ramp, mode, row, col, lum, cols, rows, opts) {
    var o = opts || {};
    var K = ramp.length;
    var ch;
    if (mode === 'bayer4') {
      var th4 = BAYER_4X4[row % 4][col % 4];
      ch = ramp[Math.min(K - 1, Math.max(0, Math.floor(clamp01(v + (th4 - 0.5) * DITHER_STRENGTH.bayer4) * K)))];
    } else if (mode === 'bayer8') {
      var th8 = BAYER_8X8[row % 8][col % 8];
      ch = ramp[Math.min(K - 1, Math.max(0, Math.floor(clamp01(v + (th8 - 0.5) * DITHER_STRENGTH.bayer8) * K)))];
    } else {
      ch = ramp[Math.min(K - 1, Math.max(0, Math.floor(v * K)))];
    }
    return ch;
  }

  /* Sobel contour override: the studio replaces the glyph with a direction
     stroke when the gradient magnitude clears threshold. */
  function sobelGlyph(lum, cols, rows, row, col, threshold) {
    var th = threshold === undefined ? SOBEL_THRESHOLD : threshold;
    if (row <= 0 || row >= rows - 1 || col <= 0 || col >= cols - 1) return null;
    var gx =
      -lum[(row - 1) * cols + (col - 1)] + lum[(row - 1) * cols + (col + 1)]
      - 2 * lum[row * cols + (col - 1)] + 2 * lum[row * cols + (col + 1)]
      - lum[(row + 1) * cols + (col - 1)] + lum[(row + 1) * cols + (col + 1)];
    var gy =
      -lum[(row - 1) * cols + (col - 1)] - 2 * lum[(row - 1) * cols + col] - lum[(row - 1) * cols + (col + 1)]
      + lum[(row + 1) * cols + (col - 1)] + 2 * lum[(row + 1) * cols + col] + lum[(row + 1) * cols + (col + 1)];
    if (Math.hypot(gx, gy) > th) {
      var deg = ((Math.atan2(gy, gx) * 180) / Math.PI + 180) % 180;
      if (deg < 22.5 || deg >= 157.5) return '|';
      if (deg < 67.5) return '/';
      if (deg < 112.5) return '-';
      return '\\';
    }
    return null;
  }

  function colorFor(v, tubeRgb) {
    if (v > 0.82) return HIGHLIGHT.slice();
    var k = 0.35 + v * 0.65;
    return [
      Math.round(tubeRgb[0] * k),
      Math.round(tubeRgb[1] * k),
      Math.round(tubeRgb[2] * k)
    ];
  }

  /* Error-diffusion ramps used by the studio (Atkinson / Floyd-Steinberg) */
  function diffusion(lum, w, h, ramp, kind, strength) {
    var K = ramp.length, buf = new Float32Array(lum), out = new Array(w * h);
    var amt = strength === undefined ? 1.0 : strength;
    function spread(x, y, err, weight) {
      if (x < 0 || x >= w || y < 0 || y >= h) return;
      buf[y * w + x] += err * weight;
    }
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var i = y * w + x;
        var v = clamp01(buf[i]);
        var idx = Math.min(K - 1, Math.max(0, Math.floor(v * K)));
        out[i] = ramp[idx];
        var q = (idx + 0.5) / K;
        var err = (v - q) * amt;
        if (kind === 'atkinson') {
          spread(x + 1, y, err, 1 / 8); spread(x + 2, y, err, 1 / 8);
          spread(x - 1, y + 1, err, 1 / 8); spread(x, y + 1, err, 1 / 8); spread(x + 1, y + 1, err, 1 / 8);
          spread(x, y + 2, err, 1 / 8);
        } else {
          spread(x + 1, y, err, 7 / 16); spread(x - 1, y + 1, err, 3 / 16);
          spread(x, y + 1, err, 5 / 16); spread(x + 1, y + 1, err, 1 / 16);
        }
      }
    }
    return out;
  }

  /* Full ASCII render from a luminance buffer.
     opts: {ramp|rampId, sobel, threshold, tube, fieldName, t, aspect, seed,
            light, warp, kSeg, ansi} */
  function renderAscii(cols, rows, opts) {
    var o = opts || {};
    var rampId = o.rampId || o.ramp || 'ascii';
    var ramp = typeof rampId === 'string' && RAMPS[rampId] ? RAMPS[rampId] : (typeof rampId === 'string' ? rampId : RAMPS.ascii);
    var lum = o.lum || sampleField(o.field || 'sigil', cols, rows, o);
    var tubeName = o.tube || 'gold';
    var tubeRgb = TUBE_PALETTES[tubeName] || TUBE_PALETTES.gold;

    var dithered = null;
    if (rampId === 'atkinson' || rampId === 'floyd') {
      dithered = diffusion(lum, cols, rows, ramp, rampId === 'atkinson' ? 'atkinson' : 'floyd', o.diffusionStrength);
    }

    var text = '', ansi = '';
    for (var r = 0; r < rows; r++) {
      var rowTxt = '', rowAnsi = '';
      for (var c = 0; c < cols; c++) {
        var i = r * cols + c;
        var v = lum[i];
        var ch = dithered ? dithered[i] : lumToGlyph(v, ramp, o.sobel === false ? null : rampId, r, c, lum, cols, rows, o);
        if (o.sobel !== false) {
          var edge = sobelGlyph(lum, cols, rows, r, c, o.threshold);
          if (edge) ch = edge;
        }
        rowTxt += ch;
        if (o.ansi) {
          var col = colorFor(v, tubeRgb);
          rowAnsi += '\u001b[38;2;' + col[0] + ';' + col[1] + ';' + col[2] + 'm' + ch;
        }
      }
      text += rowTxt;
      ansi += rowAnsi;
      if (r < rows - 1) { text += '\n'; ansi += '\n'; }
    }
    if (o.ansi) ansi += '\u001b[0m';

    return {
      text: text, ansi: ansi, cols: cols, rows: rows, rampId: rampId,
      ramp: ramp, tube: tubeName, tubeRgb: tubeRgb, lum: lum, dithered: dithered
    };
  }

  /* Draw ASCII to a canvas exactly like the studio's render loop: monospace
     glyph per cell, centre-aligned, alpha 0.2 + v*0.8. */
  function drawAscii(canvas, scene, opts) {
    var o = opts || {};
    var ctx = canvas.getContext('2d');
    var W = o.width || canvas.width, H = o.height || canvas.height;
    canvas.width = W; canvas.height = H;
    var bg = o.bg || '#030407';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    var cellW = W / scene.cols, cellH = H / scene.rows;
    var fontSize = o.fontSize || Math.max(8, Math.min(16, Math.floor(cellH * 0.92)));
    ctx.font = '600 ' + fontSize + 'px "JetBrains Mono", "SFMono-Regular", Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var r = 0; r < scene.rows; r++) {
      for (var c = 0; c < scene.cols; c++) {
        var i = r * scene.cols + c;
        var v = scene.lum[i];
        var ch = scene.dithered ? scene.dithered[i]
          : scene.text.charAt(r * (scene.cols + 1) + c);
        if (ch === ' ' || ch === '') continue;
        var col = colorFor(v, scene.tubeRgb);
        ctx.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + (0.2 + v * 0.8).toFixed(2) + ')';
        ctx.fillText(ch, c * cellW + cellW * 0.5, r * cellH + cellH * 0.5);
      }
    }
    return canvas;
  }

  root.ZothAscii = {
    RAMPS: RAMPS,
    BAYER_4X4: BAYER_4X4,
    BAYER_8X8: BAYER_8X8,
    TUBE_PALETTES: TUBE_PALETTES,
    PRESET_COLORS: PRESET_COLORS,
    DITHER_STRENGTH: DITHER_STRENGTH,
    SOBEL_THRESHOLD: SOBEL_THRESHOLD,
    HIGHLIGHT: HIGHLIGHT,
    rampIds: Object.keys(RAMPS),
    tubeNames: Object.keys(TUBE_PALETTES),
    clamp01: clamp01,
    rowsFor: rowsFor,
    sampleField: sampleField,
    lumToGlyph: lumToGlyph,
    sobelGlyph: sobelGlyph,
    colorFor: colorFor,
    diffusion: diffusion,
    renderAscii: renderAscii,
    drawAscii: drawAscii
  };
})(typeof window !== 'undefined' ? window : globalThis);