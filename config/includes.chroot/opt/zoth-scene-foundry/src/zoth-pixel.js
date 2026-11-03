/* ============================================================================
   zoth-pixel.js — ZothOS pixel-art stage
   ----------------------------------------------------------------------------
   Same luminance grid the ASCII stage consumes, but rasterized instead of
   glyph-mapped:
     field -> lum grid at PIXEL resolution -> palette snap (with dithering)
           -> integer nearest-neighbour upscale -> canvas  (crisp pixel art)

   Palette rules (from the ZothOS studio + the pixel-art-web-css skill):
     - every palette is an ordered dark -> accent -> highlight ramp
     - tube accent colours are the studio's TUBE_PALETTES
     - '1bit' is the skill's [#1a1a1a, #f2efe6]
     - always snap to the palette BEFORE scaling, never after
     - integer scale factors only, imageSmoothingEnabled = false
   ========================================================================== */
(function (root) {
  'use strict';

  var TUBE_RGB = {
    gold: [212, 175, 55], amber: [245, 158, 11], emerald: [16, 185, 129],
    cyan: [0, 240, 255], crimson: [244, 63, 94], neon: [192, 132, 252]
  };
  var DEEP = [5, 6, 10];          /* zothos bg #05060A */
  var PAPER = [242, 239, 230];
  var HL = [255, 250, 235];

  function hex(rgb) {
    return '#' + rgb.map(function (v) {
      var s = Math.max(0, Math.min(255, Math.round(v))).toString(16);
      return s.length === 1 ? '0' + s : s;
    }).join('');
  }
  /* integer RGB only — a Uint8ClampedArray rounds on store, so a palette that
     keeps fractional components can never match its own rasterized output */
  function lerp(a, b, k) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * k),
      Math.round(a[1] + (b[1] - a[1]) * k),
      Math.round(a[2] + (b[2] - a[2]) * k)
    ];
  }

  /* dark -> tube -> highlight ramps, 8 steps */
  function tubeRamp(tube, steps) {
    var n = steps || 8, acc = TUBE_RGB[tube] || TUBE_RGB.gold, out = [];
    for (var i = 0; i < n; i++) {
      var k = i / (n - 1);
      out.push(k < 0.75 ? lerp(DEEP, acc, k / 0.75) : lerp(acc, HL, (k - 0.75) / 0.25));
    }
    return out;
  }

  var PALETTES = {
    '1bit': [[0x1a, 0x1a, 0x1a], [0xf2, 0xef, 0xe6]],
    '1bit-dark': [[0x08, 0x09, 0x0d], [0xf2, 0xef, 0xe6]],
    paper: [[0xf2, 0xef, 0xe6], [0x1a, 0x1a, 0x1a]],
    zoth4: [DEEP.slice(), [58, 44, 16], [156, 122, 34], HL.slice()],
    zoth6: [DEEP.slice(), [20, 30, 60], [0, 120, 190], [0, 200, 230], [180, 240, 250], HL.slice()]
  };
  var TUBES = ['gold', 'amber', 'emerald', 'cyan', 'crimson', 'neon'];
  for (var ti = 0; ti < TUBES.length; ti++) PALETTES['tube-' + TUBES[ti]] = tubeRamp(TUBES[ti], 8);
  PALETTES['tube-gold-3'] = tubeRamp('gold', 3);
  PALETTES['tube-cyan-4'] = tubeRamp('cyan', 4);

  var PALETTE_IDS = Object.keys(PALETTES);
  var BAYER4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  var BAYER8 = [
    [0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21]
  ];

  function nearest(pal, r, g, b) {
    var best = 0, bd = Infinity;
    for (var i = 0; i < pal.length; i++) {
      var dr = pal[i][0] - r, dg = pal[i][1] - g, db = pal[i][2] - b;
      /* luminance-weighted distance keeps hue transitions from banding */
      var d = dr * dr * 0.30 + dg * dg * 0.59 + db * db * 0.11;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  function rampRgb(v, tubeRgb) {
    if (v > 0.82) return HL;
    var k = 0.35 + v * 0.65;
    return [tubeRgb[0] * k, tubeRgb[1] * k, tubeRgb[2] * k];
  }

  /* lum grid -> RGBA buffer, palette-snapped with the chosen dither.
     Dithering is applied to the SOURCE value before the palette snap, which is
     what keeps gradients readable at 4-8 colours. */
  function rasterize(lum, w, h, opts) {
    var o = opts || {};
    var pal = PALETTES[o.palette] || PALETTES['tube-gold'];
    var animMode = o.dither || 'bayer4';
    var strength = o.strength === undefined ? 0.85 : o.strength;
    var tubeRgb = TUBE_RGB[o.tube] || TUBE_RGB.gold;
    var out = new Uint8ClampedArray(w * h * 4);
    var buf = Float32Array.from(lum);

    function spread(x, y, err, wt) {
      if (x < 0 || x >= w || y < 0 || y >= h) return;
      buf[y * w + x] += err * wt;
    }

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var i = y * w + x;
        var v = buf[i] < 0 ? 0 : buf[i] > 1 ? 1 : buf[i];
        var apply = v;
        if (animMode === 'bayer4') apply += ((BAYER4[y % 4][x % 4] / 16) - 0.5) * (strength / pal.length);
        else if (animMode === 'bayer8') apply += ((BAYER8[y % 8][x % 8] / 64) - 0.5) * (strength / pal.length);
        apply = apply < 0 ? 0 : apply > 1 ? 1 : apply;
        var src = rampRgb(apply, tubeRgb);
        var pi = nearest(pal, src[0], src[1], src[2]);
        var c = pal[pi];
        out[i * 4] = c[0]; out[i * 4 + 1] = c[1]; out[i * 4 + 2] = c[2]; out[i * 4 + 3] = 255;
        if (animMode === 'fs' || animMode === 'atkinson') {
          var q = rampRgb((pi + 0.5) / pal.length, tubeRgb);
          var er = src[0] - q[0], eg = src[1] - q[1], eb = src[2] - q[2];
          var lerr = (er * 0.30 + eg * 0.59 + eb * 0.11) / 255;
          if (animMode === 'atkinson') {
            spread(x + 1, y, lerr, 1 / 8); spread(x + 2, y, lerr, 1 / 8);
            spread(x - 1, y + 1, lerr, 1 / 8); spread(x, y + 1, lerr, 1 / 8); spread(x + 1, y + 1, lerr, 1 / 8);
            spread(x, y + 2, lerr, 1 / 8);
          } else {
            spread(x + 1, y, lerr, 7 / 16); spread(x - 1, y + 1, lerr, 3 / 16);
            spread(x, y + 1, lerr, 5 / 16); spread(x + 1, y + 1, lerr, 1 / 16);
          }
        }
      }
    }
    return out;
  }

  function lumFromField(field, w, h, opts) {
    if (root.ZothAscii && root.ZothAscii.sampleField) return root.ZothAscii.sampleField(field, w, h, opts);
    return new Float32Array(w * h);
  }

  /* rasterize -> put into canvas -> nearest-neighbour integer upscale.
     Scale is snapped to an integer so nothing blurs; the upscale is done by
     drawing the low-res canvas onto the target with smoothing disabled. */
  function drawPixel(canvas, scene, opts) {
    var o = opts || {};
    var w = o.w || 96, h = o.h || 72;
    var lum = o.lum || lumFromField(o.field || 'sigil', w, h, o);
    var rgba = rasterize(lum, w, h, o);
    var src = document.createElement('canvas');
    src.width = w; src.height = h;
    var sctx = src.getContext('2d');
    var img = sctx.createImageData(w, h);
    img.data.set(rgba);
    sctx.putImageData(img, 0, 0);

    var maxScale = o.boxW ? Math.max(1, Math.floor(Math.min(o.boxW / w, (o.boxH || o.boxW) / h))) : 1;
    var scale = o.scale ? Math.max(1, Math.round(o.scale)) : Math.max(1, Math.min(8, maxScale));
    canvas.width = w * scale; canvas.height = h * scale;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    ctx.drawImage(src, 0, 0, w * scale, h * scale);
    return { canvas: canvas, w: w, h: h, scale: scale, lum: lum, rgba: rgba };
  }

  /* box-shadow sprite: one element, N shadow copies — the CSS pixel-art path
     from the pixel-art-web-css skill, here fed by a rasterized scene. */
  function boxShadowSprite(lum, w, h, opts) {
    var o = opts || {};
    var pal = PALETTES[o.palette] || PALETTES['tube-gold'];
    var tubeRgb = TUBE_RGB[o.tube] || TUBE_RGB.gold;
    var shadows = [], rows = [];
    for (var y = 0; y < h; y++) {
      var row = [];
      for (var x = 0; x < w; x++) {
        var v = lum[y * w + x];
        if (v < 0.12) { row.push('.'); continue; }
        var c = pal[nearest(pal, rampRgb(v, tubeRgb)[0], rampRgb(v, tubeRgb)[1], rampRgb(v, tubeRgb)[2])];
        row.push('.');
        shadows.push(x + 'px ' + y + 'px 0 ' + hex(c));
      }
      rows.push(row.join(''));
    }
    return { shadows: shadows, boxShadow: shadows.join(', '), width: w, height: h };
  }

  root.ZothPixel = {
    TUBE_RGB: TUBE_RGB,
    PALETTES: PALETTES,
    PALETTE_IDS: PALETTE_IDS,
    hex: hex,
    nearest: nearest,
    rasterize: rasterize,
    lumFromField: lumFromField,
    drawPixel: drawPixel,
    boxShadowSprite: boxShadowSprite,
    tubeRamp: tubeRamp
  };
})(typeof window !== 'undefined' ? window : globalThis);