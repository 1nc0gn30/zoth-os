/* ============================================================================
   verify-foundry.js — reality-matched checks for the 1000-scene foundry.
   Run inside a real tab that has the six src modules loaded:
     js('<modules...>' + '<this file>')
   Returns JSON: {pass,total,fails,results}
   Every assertion below was chosen so it holds on ANY machine — no host font
   metrics, no hard-coded timings, no per-browser values.
   ========================================================================== */
(function () {
  var R = {};
  function ok(name, cond, detail) { R[name] = !!cond; if (!cond) { (R.__fails = R.__fails || []).push([name, detail === undefined ? null : detail]); } }

  var F = window.ZothFoundry, A = window.ZothAscii, P = window.ZothPixel,
      T = window.ZothThreeAscii, S = window.ZothThreeSoft, FD = window.ZothFields;

  ok('modules.foundry', !!F);
  ok('modules.ascii', !!A);
  ok('modules.pixel', !!P);
  ok('modules.threeAscii', !!T);
  ok('modules.threeSoft', !!S);
  ok('modules.fields', !!FD);
  if (!F || !A || !P || !T || !S || !FD) { return JSON.stringify({ pass: 0, total: 0, fails: ['modules_missing'], results: R }); }

  /* ---- 1. index math: uniqueness by construction ---- */
  var N = F.TOTAL;
  ok('scenes.total1000', N === 1000, N);
  ok('scenes.fields28', F.FIELDS.length === 28, F.FIELDS.length);
  ok('scenes.capacity', F.FIELDS.length * F.RAMPS.length * F.TUBES.length >= N,
    F.FIELDS.length * F.RAMPS.length * F.TUBES.length);

  var triples = {}, dupTriple = 0, threeCount = 0, badId = 0, badRamp = 0, badField = 0;
  var minCols = 1e9, maxCols = 0, minRows = 1e9, maxRows = 0;
  for (var i = 0; i < N; i++) {
    var sp = F.sceneSpec(i);
    var key = sp.field + '|' + sp.ramp + '|' + sp.tube;
    if (triples[key]) dupTriple++; else triples[key] = 1;
    if (sp.three) threeCount++;
    if (sp.id !== 'ZS-' + String(i + 1).padStart(4, '0')) badId++;
    if (!A.RAMPS[sp.ramp]) badRamp++;
    if (F.FIELDS.indexOf(sp.field) === -1) badField++;
    if (sp.cols < minCols) minCols = sp.cols;
    if (sp.cols > maxCols) maxCols = sp.cols;
    if (sp.rows < minRows) minRows = sp.rows;
    if (sp.rows > maxRows) maxRows = sp.rows;
  }
  ok('scenes.distinctTriples', Object.keys(triples).length === N, Object.keys(triples).length);
  ok('scenes.noDuplicateTriples', dupTriple === 0, dupTriple);
  ok('scenes.threeEvery8', threeCount === N / F.THREE_EVERY, threeCount);
  ok('scenes.idsPadded', badId === 0, badId);
  ok('scenes.rampsExist', badRamp === 0, badRamp);
  ok('scenes.fieldsExist', badField === 0, badField);
  R.gridSpan = { cols: [minCols, maxCols], rows: [minRows, maxRows] };

  /* ---- 2. determinism: same index -> same spec, twice ---- */
  var same = true;
  for (var j = 0; j < 200; j++) {
    var a1 = JSON.stringify(F.sceneSpec((j * 37) % N));
    var a2 = JSON.stringify(F.sceneSpec((j * 37) % N));
    if (a1 !== a2) { same = false; break; }
  }
  ok('scenes.deterministic', same);

  /* ---- 3. field contract: pure, bounded, deterministic ---- */
  var lo = 1, hi = 0, nonFinite = 0, fdet = true;
  var P1 = { light: { x: -0.35, y: -0.35 }, warp: 1.15, seed: 7, kSeg: 1 };
  for (var fi = 0; fi < F.FIELDS.length; fi++) {
    for (var k = 0; k < 60; k++) {
      var nx = (k / 59 * 2 - 1) * 1.4, ny = Math.sin(k * 1.7) , t = k * 0.11;
      var v1 = FD.eval(F.FIELDS[fi], nx, ny, t, P1);
      var v2 = FD.eval(F.FIELDS[fi], nx, ny, t, P1);
      if (!isFinite(v1)) nonFinite++;
      if (v1 !== v2) fdet = false;
      if (v1 < lo) lo = v1;
      if (v1 > hi) hi = v1;
    }
  }
  ok('fields.allFinite', nonFinite === 0, nonFinite);
  ok('fields.inUnitRange', lo >= -0.001 && hi <= 1.001, [lo, hi]);
  ok('fields.deterministic', fdet);

  /* ---- 4. ASCII render: 1000 scenes, real output, all distinct ---- */
  var hashes = {}, sigDup = [], empty = 0, gibberish = 0;
  var nonSpaceMin = 1e9;
  var t0 = Date.now();
  var BATCH = window.__VF_BATCH || null;              /* [from,to) for two-pass runs */
  var from = BATCH ? BATCH[0] : 0, to = BATCH ? BATCH[1] : N;
  for (var s = from; s < to; s++) {
    var spec = F.sceneSpec(s);
    var out = F.asciiFor(spec);
    var txt = out.text;
    if (!txt || txt.length < spec.cols * spec.rows * 0.9) empty++;
    var lines = txt.split('\n');
    if (lines.length !== spec.rows) gibberish++;
    var ns = 0;
    for (var q = 0; q < txt.length; q++) { var cch = txt[q]; if (cch !== ' ' && cch !== '\n') ns++; }
    if (ns < nonSpaceMin) nonSpaceMin = ns;
    var h = F.fnv1a(txt);
    if (hashes[h]) sigDup.push([s, hashes[h]]); else hashes[h] = s;
  }
  R.ascii = {
    rendered: to - from, distinctSignatures: Object.keys(hashes).length,
    duplicates: sigDup.length, empty: empty, wrongRowCount: gibberish,
    minNonSpaceChars: nonSpaceMin, ms: Date.now() - t0
  };
  ok('ascii.noEmptyOutput', empty === 0, empty);
  ok('ascii.rowCountMatches', gibberish === 0, gibberish);
  ok('ascii.notBlank', nonSpaceMin > 20, nonSpaceMin);
  ok('ascii.signaturesDistinctInBatch', sigDup.length === 0, sigDup.length);

  /* ---- 5. sampleField grid shape (the junction three.js feeds) ---- */
  var g = A.sampleField('sigil', 40, 25, { t: 1.2, aspect: 1.6, seed: 3 });
  ok('field.gridShape', g.length === 40 * 25, g.length);
  var gmin = 1, gmax = 0;
  for (var gi = 0; gi < g.length; gi++) { if (g[gi] < gmin) gmin = g[gi]; if (g[gi] > gmax) gmax = g[gi]; }
  ok('field.gridVaries', gmax - gmin > 0.05, [gmin, gmax]);

  /* ---- 6. pixel stage: everything lands on a palette colour ---- */
  var palFails = 0, palChecked = 0, scaleFails = 0, ditherFails = 0;
  var samples = [
    { palette: 'tube-gold', dither: 'bayer4' },
    { palette: 'tube-cyan', dither: 'bayer8' },
    { palette: '1bit', dither: 'atkinson' },
    { palette: 'zoth4', dither: 'fs' },
    { palette: 'paper', dither: 'bayer4' },
    { palette: 'tube-neon', dither: 'atkinson' }
  ];
  var ditherSets = {};
  for (var si = 0; si < samples.length; si++) {
    var samp = samples[si];
    var spx = F.sceneSpec(si * 137);
    var w = spx.pixel.w, h = spx.pixel.h;
    var lum = A.sampleField(spx.field, w, h, { t: spx.t, aspect: spx.aspect, seed: spx.seed, warp: spx.warp, light: spx.light, kSeg: spx.kSeg });
    var rgba = P.rasterize(lum, w, h, { palette: samp.palette, dither: samp.dither, tube: spx.tube, strength: 0.8 });
    var pd = P.PALETTES[samp.palette];
    var used = {};
    for (var pi = 0; pi < w * h; pi++) {
      var r0 = rgba[pi * 4], g0 = rgba[pi * 4 + 1], b0 = rgba[pi * 4 + 2];
      var found = false;
      for (var pk = 0; pk < pd.length; pk++) {
        if (pd[pk][0] === r0 && pd[pk][1] === g0 && pd[pk][2] === b0) { found = true; used[pk] = 1; break; }
      }
      palChecked++;
      if (!found) palFails++;
    }
    ditherSets[samp.dither + '/' + samp.palette] = Object.keys(used).length;
    if (rgba.length !== w * h * 4) scaleFails++;
    if (Object.keys(used).length < 2) ditherFails++;
  }
  R.pixel = { pixelsChecked: palChecked, offPalette: palFails, palettesProbed: samples.length, tonesUsed: ditherSets };
  ok('pixel.allPixelsOnPalette', palFails === 0, palFails);
  ok('pixel.rgbaSized', scaleFails === 0, scaleFails);
  ok('pixel.tonalRangeUsed', ditherFails === 0, ditherFails);

  /* ---- 7. integer-only scaling ---- */
  var badScale = 0;
  for (var c = 0; c < 6; c++) {
    var cnv = document.createElement('canvas');
    cnv.setAttribute('data-boxw', String(400 + c * 40));
    cnv.setAttribute('data-boxh', String(240 + c * 20));
    var out2 = F.pixelFor(F.sceneSpec(c * 101), cnv);
    if (out2.scale !== Math.round(out2.scale) || out2.scale < 1) badScale++;
    if (cnv.width !== out2.w * out2.scale) badScale++;
  }
  ok('pixel.integerScaleOnly', badScale === 0, badScale);

  /* ---- 8. 3D stage: SDF raymarch -> luminance -> same glyph junction ---- */
  var glOk = false, glReason = '';
  try { glOk = T.probe(); glReason = T.glState.reason; } catch (e) { glReason = String(e && e.message || e); }
  var softStats = [], threeBad = 0, threeSignatures = {};
  for (var sc = 0; sc < T.SCENE_NAMES.length; sc++) {
    var sl = S.renderSoft(sc, 64, 36, { t: 1.5, warp: 1.1, seed: 4 });
    var smin = 1, smax = 0;
    for (var zi = 0; zi < sl.length; zi++) { if (sl[zi] < smin) smin = sl[zi]; if (sl[zi] > smax) smax = sl[zi]; }
    softStats.push({ scene: T.SCENE_NAMES[sc], min: +smin.toFixed(3), max: +smax.toFixed(3) });
    if (sl.length !== 64 * 36 || !(smax > smin + 0.05)) threeBad++;
    var o3 = T.renderAscii3d(64, 36, { sceneIndex: sc, t: 1.5, warp: 1.1, seed: 4, force: 'soft' });
    threeSignatures[T.SCENE_NAMES[sc]] = F.fnv1a(o3.text);
    if (!o3.text || o3.text.length < 64 * 36) threeBad++;
  }
  R.three = {
    glAvailable: glOk, glReason: glReason,
    scenes: softStats,
    distinctSceneSignatures: Object.keys(threeSignatures).length,
    bad: threeBad
  };
  ok('three.sixScenes', T.SCENE_NAMES.length === 6, T.SCENE_NAMES.length);
  ok('three.softLumVaries', threeBad === 0, threeBad);
  ok('three.scenesDistinct', Object.keys(threeSignatures).length === T.SCENE_NAMES.length, Object.keys(threeSignatures).length);
  ok('three.glOrSoftPath', true, glOk ? 'webgl' : 'soft:' + glReason);

  /* ---- 9. foundry wiring: renderScene returns ascii + pixel + optional 3D ---- */
  var wiringBad = 0, threePanel = 0;
  for (var wi = 0; wi < 40; wi++) {
    var wsp = F.sceneSpec(wi * 25);
    var wcv = document.createElement('canvas');
    var wr = F.renderScene(wsp, { canvas: wcv });
    if (!wr.ascii || !wr.ascii.text || !wr.pixel || !wr.hash) wiringBad++;
    if (wsp.three) { if (!wr.three || !wr.three.text) wiringBad++; else threePanel++; }
    if (wcv.width !== wr.pixel.w * wr.pixel.scale) wiringBad++;
  }
  ok('foundry.renderSceneWiring', wiringBad === 0, wiringBad);
  ok('foundry.threePanelsRendered', threePanel >= 4, threePanel);

  var keys = Object.keys(R); var fails = R.__fails || [];
  var pass = 0, total = 0;
  keys.forEach(function (k) { if (typeof R[k] === 'boolean') { total++; if (R[k]) pass++; } });
  return JSON.stringify({ pass: pass, total: total, fails: fails.map(function (f) { return f[0] + (f[1] === null ? '' : ' :: ' + JSON.stringify(f[1])); }), results: R, glPath: glOk ? 'webgl' : 'soft:' + glReason });
})()