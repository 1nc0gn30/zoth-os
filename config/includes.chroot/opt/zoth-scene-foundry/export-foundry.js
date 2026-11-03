#!/usr/bin/env node
/* ============================================================================
   export-foundry.js — render all 1000 scenes to real files on disk.
   No DOM needed: the field, ASCII, pixel-raster and CPU raymarch modules are
   pure JS, so Node produces byte-identical output to the browser gallery.

     node export-foundry.js [outDir] [--limit N] [--scale N] [--no-png]

   Writes:
     out/scenes.jsonl        one JSON line per scene: params + ASCII + hash
     out/index.json          the scene index: id/name/field/ramp/tube/hash
     out/glyphs/ZS-####.txt  ASCII text per scene
     out/ascii3d/ZS-####.txt the 125 scenes with the SDF-raymarch 3D panel
     out/png/ZS-####.png     pixel-art PNG (integer-upscaled, palette-snapped)
     out/sheet-*.svg         contact sheets of the ASCII output
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = __dirname;
const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf('--' + n); return i === -1 ? d : (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
const has = (n) => argv.indexOf('--' + n) !== -1;
const OUT = (argv.find(a => !a.startsWith('--') && !/^\d+$/.test(a)) || path.join(ROOT, 'out'));
const LIMIT = parseInt(flag('limit', '0'), 10) || 0;
const SCALE = parseInt(flag('scale', '3'), 10) || 3;
const NO_PNG = has('no-png');

/* --- load the browser modules into this process (they attach to globalThis) --- */
const MODULES = ['zoth-fields.js', 'zoth-ascii.js', 'zoth-three-soft.js', 'zoth-three-ascii.js', 'zoth-pixel.js', 'zoth-foundry.js'];
for (const m of MODULES) {
  const code = fs.readFileSync(path.join(ROOT, 'src', m), 'utf8');
  (0, eval)(code);           /* indirect eval => global scope, like a <script> tag */
}
const F = globalThis.ZothFoundry, A = globalThis.ZothAscii, P = globalThis.ZothPixel,
      S = globalThis.ZothThreeSoft, T = globalThis.ZothThreeAscii;
if (!F || !A || !P || !S || !T) { console.error('modules failed to load'); process.exit(1); }

/* ---------------------------- PNG encoder (no deps) ------------------------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function pngFromRGBA(rgba, w, h, scale) {
  const W = w * scale, H = h * scale;
  const raw = Buffer.alloc((W * 3 + 1) * H);
  let p = 0;
  for (let y = 0; y < H; y++) {
    raw[p++] = 0;                                    /* filter: none */
    const sy = (y / scale) | 0;
    for (let x = 0; x < W; x++) {
      const i = (sy * w + ((x / scale) | 0)) * 4;
      raw[p++] = rgba[i]; raw[p++] = rgba[i + 1]; raw[p++] = rgba[i + 2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;   /* 8-bit RGB */
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/* ---------------------------------- run ------------------------------------ */
const N = LIMIT > 0 ? Math.min(LIMIT, F.TOTAL) : F.TOTAL;
for (const d of ['', 'glyphs', 'ascii3d', 'png']) fs.mkdirSync(path.join(OUT, d), { recursive: true });

const t0 = Date.now();
const jsonl = [], index = [], hashesLive = new Map();
const svgSheets = [];
let pngBytes = 0, threeCount = 0, minNonSpace = Infinity;

for (let i = 0; i < N; i++) {
  const spec = F.sceneSpec(i);
  const a = F.asciiFor(spec);
  const hash = F.fnv1a(a.text);
  if (hashesLive.has(hash)) throw new Error('duplicate signature at ' + i + ' vs ' + hashesLive.get(hash));
  hashesLive.set(hash, i);

  let ns = 0;
  for (let q = 0; q < a.text.length; q++) { const c = a.text[q]; if (c !== ' ' && c !== '\n') ns++; }
  if (ns < minNonSpace) minNonSpace = ns;

  fs.writeFileSync(path.join(OUT, 'glyphs', spec.id + '.txt'), a.text + '\n');

  let ascii3d = null;
  if (spec.three) {
    const cols3 = spec.cols;
    const rows3 = Math.max(18, Math.round(spec.rows * 0.75));
    const lum3 = S.renderSoft(spec.threeScene, cols3, rows3, { t: spec.t, warp: spec.warp, seed: spec.seed, light: spec.light });
    const o3 = A.renderAscii(cols3, rows3, { lum: lum3, rampId: spec.ramp, tube: spec.tube, sobel: false });
    ascii3d = o3.text;
    fs.writeFileSync(path.join(OUT, 'ascii3d', spec.id + '-' + T.SCENE_NAMES[spec.threeScene] + '.txt'), ascii3d + '\n');
    threeCount++;
  }

  const lum = A.sampleField(spec.field, spec.pixel.w, spec.pixel.h, spec);
  const rgba = P.rasterize(lum, spec.pixel.w, spec.pixel.h, {
    palette: spec.pixel.palette,
    dither: spec.pixel.dither === 'none' ? 'bayer4' : spec.pixel.dither,
    strength: spec.pixel.strength, tube: spec.tube
  });
  if (!NO_PNG) {
    const png = pngFromRGBA(rgba, spec.pixel.w, spec.pixel.h, spec.pixel.scale);
    fs.writeFileSync(path.join(OUT, 'png', spec.id + '.png'), png);
    pngBytes += png.length;
  }

  jsonl.push(JSON.stringify({
    id: spec.id, name: spec.name, index: i,
    field: spec.field, ramp: spec.ramp, tube: spec.tube,
    cols: spec.cols, rows: spec.rows, aspect: +spec.aspect.toFixed(4),
    sobel: spec.sobel, threshold: +spec.threshold.toFixed(4),
    t: +spec.t.toFixed(4), warp: +spec.warp.toFixed(4), seed: spec.seed,
    light: spec.light, kSeg: spec.kSeg,
    three: spec.three, threeScene: spec.three ? T.SCENE_NAMES[spec.threeScene] : null,
    pixel: spec.pixel, hash: hash, ascii3d: ascii3d, ascii: a.text
  }));
  index.push({
    id: spec.id, name: spec.name, field: spec.field, ramp: spec.ramp, tube: spec.tube,
    cols: spec.cols, rows: spec.rows, three: spec.three, hash: hash,
    pixel: spec.pixel.palette + '/' + spec.pixel.dither
  });

  if (i % 100 === 0) process.stdout.write('  ' + i + '\r');
}

fs.writeFileSync(path.join(OUT, 'scenes.jsonl'), jsonl.join('\n') + '\n');
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({
  total: N, generatedAt: new Date().toISOString(),
  modules: MODULES, gridSpan: { cols: [Math.min(...index.map(s => s.cols)), Math.max(...index.map(s => s.cols))] },
  distinctSignatures: hashesLive.size, duplicates: 0, threePanels: threeCount,
  scenes: index
}, null, 1));

/* contact sheets: ASCII, 4 scenes wide */
const PER_SHEET = 60, COLS = 4, CW = 620, CH = 300;
for (let start = 0; start < index.length; start += PER_SHEET) {
  const slice = index.slice(start, start + PER_SHEET);
  const rows = Math.ceil(slice.length / COLS);
  const parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="' + COLS * CW + '" height="' + rows * CH + '" font-family="monospace">',
    '<rect width="100%" height="100%" fill="#05060a"/>'];
  slice.forEach((s, k) => {
    const x = (k % COLS) * CW, y = ((k / COLS) | 0) * CH;
    const tube = A.TUBE_PALETTES[s.tube] || [212, 175, 55];
    const txt = fs.readFileSync(path.join(OUT, 'glyphs', s.id + '.txt'), 'utf8').split('\n');
    parts.push('<text x="' + (x + 8) + '" y="' + (y + 14) + '" fill="#d4af37" font-size="11">' + s.id + '  ' + s.field + ' · ' + s.ramp + ' · ' + s.tube + '</text>');
    txt.slice(0, 36).forEach((ln, ri) => {
      const esc = ln.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      parts.push('<text x="' + (x + 8) + '" y="' + (y + 28 + ri * 7.2) + '" xml:space="preserve" font-size="6" fill="rgb(' + tube.join(',') + ')">' + esc + '</text>');
    });
  });
  parts.push('</svg>');
  const name = 'sheet-' + String(Math.floor(start / PER_SHEET) + 1).padStart(2, '0') + '.svg';
  fs.writeFileSync(path.join(OUT, name), parts.join('\n'));
  svgSheets.push(name);
}

const ms = Date.now() - t0;
console.log(JSON.stringify({
  out: OUT, scenes: N, distinctSignatures: hashesLive.size, duplicates: 0,
  threePanels: threeCount, svgSheets: svgSheets.length,
  glyphFiles: fs.readdirSync(path.join(OUT, 'glyphs')).length,
  pngFiles: NO_PNG ? 0 : fs.readdirSync(path.join(OUT, 'png')).length,
  pngMB: +(pngBytes / 1048576).toFixed(2),
  jsonlMB: +(fs.statSync(path.join(OUT, 'scenes.jsonl')).size / 1048576).toFixed(2),
  minNonSpaceChars: minNonSpace, ms: ms, msPerScene: +(ms / N).toFixed(1)
}, null, 1));
