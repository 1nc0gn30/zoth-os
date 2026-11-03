/* ============================================================================
   zoth-three-soft.js — CPU software raymarcher (fallback for the 3D ASCII stage)
   ----------------------------------------------------------------------------
   Identical SDFs, camera and shading rules to the GLSL program in
   zoth-three-ascii.js, evaluated in plain JS so a scene index reproduces the
   same luminance grid when WebGL is unavailable.
   ========================================================================== */
(function (root) {
  'use strict';

  function rotXY(x, y, z, a) { var c = Math.cos(a), s = Math.sin(a); return { x: x * c - y * s, y: x * s + y * c, z: z }; }
  function rotXZ(x, y, z, a) { var c = Math.cos(a), s = Math.sin(a); return { x: x * c - z * s, y: y, z: x * s + z * c }; }
  function rotYZ(x, y, z, a) { var c = Math.cos(a), s = Math.sin(a); return { x: x, y: y * c - z * s, z: y * s + z * c }; }

  function fbm3(x, y, z) {
    var s = 0, a = 1, n = 0;
    for (var i = 0; i < 5; i++) {
      s += a * Math.sin(x * 1.7 + i) * Math.sin(y * 1.9 - i * 0.7) * Math.sin(z * 1.3 + i * 1.3);
      n += a; a *= 0.52; x *= 2.03; y *= 2.03; z *= 2.03;
    }
    return s / n;
  }
  function sdTetra(x, y, z, s) {
    return (Math.max(Math.max(-x - y - z, x + y - z), Math.max(-x + y + z, x - y + z)) - s) / 1.7320508;
  }
  function sdOcta(x, y, z, s) { return (Math.abs(x) + Math.abs(y) + Math.abs(z) - s) * 0.57735027; }
  function sdBox(x, y, z, b) {
    var qx = Math.abs(x) - b, qy = Math.abs(y) - b, qz = Math.abs(z) - b;
    var mx = Math.max(qx, 0), my = Math.max(qy, 0), mz = Math.max(qz, 0);
    return Math.hypot(mx, my, mz) + Math.min(Math.max(qx, Math.max(qy, qz)), 0);
  }

  /* global rotation first, exactly as map() does in the shader */
  function mapSoft(px, py, pz, si, t, warp, seed) {
    var g = rotXZ(px, py, pz, t * 0.22);
    g = rotYZ(g.x, g.y, g.z, t * 0.11 + seed);
    var x = g.x, y = g.y, z = g.z;

    if (si === 0) {                                  /* torus knot */
      var q = rotXZ(x, y, z, y * 1.6 + t * 0.7);
      return Math.hypot(Math.hypot(q.x, q.z) - 0.62, y) - (0.16 + 0.05 * Math.sin(t * 1.3));
    }
    if (si === 1) {                                  /* merkaba */
      var a1 = rotXY(x, y, z, t * 0.4);
      var b1 = rotYZ(x, y, z, 1.5707963);
      b1 = rotXY(b1.x, b1.y, b1.z, -t * 0.4);
      return Math.min(
        Math.abs(sdTetra(a1.x, a1.y, a1.z, 0.72)),
        Math.abs(sdTetra(b1.x, b1.y, b1.z, 0.72))
      ) - 0.03;
    }
    if (si === 2) {                                  /* terrain heightfield */
      var h = 0.34 * fbm3(x * 1.5, y * 1.5, z * 1.5) + 0.16 * fbm3(x * 4.2, y * 4.2, z * 4.2);
      return y + 0.55 - h;
    }
    if (si === 3) {                                  /* tunnel wall */
      var w = 0.85 + 0.16 * Math.sin(y * 2.4 + t * 1.5 + seed * 3.0) * warp;
      return Math.hypot(x, z) - w;
    }
    if (si === 4) {                                  /* reactor */
      var core = Math.hypot(x, y, z) - (0.42 + 0.05 * Math.sin(t * 2.6));
      var ring = Math.hypot(Math.abs(Math.hypot(x, z) - 0.95) - 0.30, y * 2.2) - 0.06;
      return Math.min(core, ring);
    }
    var q2 = rotXY(x, y, z, t * 0.3);                /* cube core */
    return Math.max(sdBox(q2.x, q2.y, q2.z, 0.62), -sdOcta(q2.x, q2.y, q2.z, 0.95)) - 0.02;
  }

  function normalSoft(px, py, pz, si, t, warp, seed) {
    var e = 0.0016;
    var nx = mapSoft(px + e, py, pz, si, t, warp, seed) - mapSoft(px - e, py, pz, si, t, warp, seed);
    var ny = mapSoft(px, py + e, pz, si, t, warp, seed) - mapSoft(px, py - e, pz, si, t, warp, seed);
    var nz = mapSoft(px, py, pz + e, si, t, warp, seed) - mapSoft(px, py, pz - e, si, t, warp, seed);
    var nl = Math.hypot(nx, ny, nz) || 1;
    return { x: nx / nl, y: ny / nl, z: nz / nl };
  }

  function marchSoft(ro, rd, si, t, warp, seed) {
    var tt = 0;
    for (var i = 0; i < 58; i++) {
      var px = ro.x + rd.x * tt, py = ro.y + rd.y * tt, pz = ro.z + rd.z * tt;
      var d = mapSoft(px, py, pz, si, t, warp, seed);
      if (d < 0.0022) return { t: tt, n: normalSoft(px, py, pz, si, t, warp, seed), p: { x: px, y: py, z: pz } };
      tt += d * 0.85;
      if (tt > 6.0) break;
    }
    return null;
  }

  function renderSoft(sceneIndex, cols, rows, opts) {
    var o = opts || {};
    var t = o.t === undefined ? 0 : o.t;
    var warp = o.warp === undefined ? 1.0 : o.warp;
    var seed = o.seed === undefined ? 0 : o.seed;
    var ang = 0.55 + t * 0.09;
    var ro = { x: Math.sin(ang) * 2.15, y: 0.55 + 0.28 * Math.sin(t * 0.31), z: Math.cos(ang) * 2.15 };
    var fwl = Math.hypot(ro.x, ro.y, ro.z) || 1;
    var fw = { x: -ro.x / fwl, y: -ro.y / fwl, z: -ro.z / fwl };          /* look at origin */
    var cr = { x: fw.z, y: 0, z: -fw.x };                                  /* cross(up, fw) */
    var crl = Math.hypot(cr.x, cr.y, cr.z) || 1;
    cr.x /= crl; cr.y /= crl; cr.z /= crl;
    var up = {
      x: fw.y * cr.z - fw.z * cr.y,
      y: fw.z * cr.x - fw.x * cr.z,
      z: fw.x * cr.y - fw.y * cr.x
    };
    var L = o.light || { x: -0.35, y: -0.35 };
    var lz = 0.85, ln = Math.hypot(L.x, L.y, lz);
    var lv = { x: L.x / ln, y: L.y / ln, z: lz / ln };
    var aspect = cols / rows;
    var lum = new Float32Array(cols * rows);
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var uvx = (cols === 1 ? 0 : (c / (cols - 1) * 2 - 1)) * aspect;
        var uvy = rows === 1 ? 0 : -(r / (rows - 1) * 2 - 1);
        var rd = {
          x: fw.x * 1.55 + cr.x * uvx + up.x * uvy,
          y: fw.y * 1.55 + cr.y * uvx + up.y * uvy,
          z: fw.z * 1.55 + cr.z * uvx + up.z * uvy
        };
        var rn = Math.hypot(rd.x, rd.y, rd.z) || 1;
        rd.x /= rn; rd.y /= rn; rd.z /= rn;
        var hit = marchSoft(ro, rd, sceneIndex, t, warp, seed);
        var v = 0.06;
        if (hit) {
          var diff = Math.max(0, hit.n.x * lv.x + hit.n.y * lv.y + hit.n.z * lv.z);
          var dotNR = -(hit.n.x * rd.x + hit.n.y * rd.y + hit.n.z * rd.z);
          var rim = Math.pow(1 - Math.max(0, dotNR), 2.2) * 0.35;
          var ao = 1 / (1 + hit.t * 0.35);
          v = Math.min(1, 0.18 + diff * 0.72 * ao + rim);
          if (v > 0.82) v = 1;
        }
        lum[r * cols + c] = v;
      }
    }
    return lum;
  }

  root.ZothThreeSoft = { mapSoft: mapSoft, normalSoft: normalSoft, marchSoft: marchSoft, renderSoft: renderSoft };
})(typeof window !== 'undefined' ? window : globalThis);