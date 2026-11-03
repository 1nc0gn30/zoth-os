/* ============================================================================
   zoth-three-ascii.js — the "ASCII three.js" stage (WebGL side)
   ----------------------------------------------------------------------------
   three.js AsciiEffect works like this: it renders the WebGL scene into a
   framebuffer, reads the pixels back, maps each pixel's luminance onto a
   character ramp, and lays the characters out as text over a blank canvas.
   The 3D renderer is untouched; only the stage *after* the framebuffer changes.

   This module is that stage, with no CDN and no three.js dependency:
     SDF scene -> GLSL raymarch -> FBO -> readPixels -> luminance grid
              -> ZothAscii.renderAscii()   (the same glyph junction the 2D
                                            field pipeline uses)

   Row order is flipped after readPixels: GL's framebuffer origin is
   bottom-left, a text grid starts top-left. three.js AsciiEffect flips too.

   Shading constants ported from Zoth ASCII Magic Studio: highlight 0.82,
   ambient 0.18, rim weight 0.35, key light (-0.35,-0.35,0.85) normalized.
   CPU twin: src/zoth-three-soft.js (window.ZothThreeSoft).
   ========================================================================== */
(function (root) {
  'use strict';

  var VERT = [
    'attribute vec2 aPos;',
    'varying vec2 vUv;',
    'void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.0,1.0); }'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform vec2  uRes;',
    'uniform float uTime;',
    'uniform int   uScene;',
    'uniform vec3  uLight;',
    'uniform float uWarp;',
    'uniform float uSeed;',
    'mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }',
    'float fbm(vec3 p){',
    '  float s=0.0, a=1.0, n=0.0;',
    '  for(int i=0;i<5;i++){ s += a*sin(p.x*1.7+float(i))*sin(p.y*1.9-float(i)*0.7)*sin(p.z*1.3+float(i)*1.3); n+=a; a*=0.52; p*=2.03; }',
    '  return s/n;',
    '}',
    'float sdTetra(vec3 p, float s){',
    '  return (max(max(-p.x-p.y-p.z, p.x+p.y-p.z), max(-p.x+p.y+p.z, p.x-p.y+p.z)) - s)/1.7320508;',
    '}',
    'float sdOcta(vec3 p, float s){ vec3 q=abs(p); return (q.x+q.y+q.z-s)*0.57735027; }',
    'float sdBox(vec3 p, vec3 b){ vec3 q=abs(p)-b; return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0); }',
    'float map(vec3 p, out int mat){',
    '  p.xz = rot(uTime*0.22)*p.xz;',
    '  p.yz = rot(uTime*0.11 + uSeed)*p.yz;',
    '  mat = 0;',
    '  if(uScene==0){',
    '    vec3 q = p; q.xz = rot(q.y*1.6 + uTime*0.7)*q.xz;',
    '    return length(vec2(length(q.xz)-0.62, q.y)) - (0.16 + 0.05*sin(uTime*1.3));',
    '  } else if(uScene==1){',
    '    vec3 a = p; vec3 b = p;',
    '    b.yz = rot(1.5707963)*b.yz;',
    '    a.xy = rot(uTime*0.4)*a.xy; b.xy = rot(-uTime*0.4)*b.xy;',
    '    return min(abs(sdTetra(a,0.72)), abs(sdTetra(b,0.72))) - 0.03;',
    '  } else if(uScene==2){',
    '    float h = 0.34*fbm(p*1.5) + 0.16*fbm(p*4.2);',
    '    return p.y + 0.55 - h;',
    '  } else if(uScene==3){',
    '    float w = 0.85 + 0.16*sin(p.y*2.4 + uTime*1.5 + uSeed*3.0)*uWarp;',
    '    return length(p.xz) - w;',
    '  } else if(uScene==4){',
    '    float core = length(p) - (0.42 + 0.05*sin(uTime*2.6));',
    '    float ring = length(vec2(abs(length(p.xz)-0.95)-0.30, p.y*2.2)) - 0.06;',
    '    return min(core, ring);',
    '  } else {',
    '    vec3 q = p; q.xy = rot(uTime*0.3)*q.xy;',
    '    return max(sdBox(q, vec3(0.62)), -sdOcta(q, 0.95)) - 0.02;',
    '  }',
    '}',
    'vec3 normalAt(vec3 p){',
    '  int m; float e = 0.0016;',
    '  vec3 n = vec3(',
    '    map(p+vec3(e,0,0),m)-map(p-vec3(e,0,0),m),',
    '    map(p+vec3(0,e,0),m)-map(p-vec3(0,e,0),m),',
    '    map(p+vec3(0,0,e),m)-map(p-vec3(0,0,e),m));',
    '  return normalize(n + 1e-5);',
    '}',
    'float march(vec3 ro, vec3 rd, out vec3 nor){',
    '  float tt = 0.0; int m;',
    '  for(int i=0;i<58;i++){',
    '    vec3 p = ro + rd*tt;',
    '    float d = map(p, m);',
    '    if(d < 0.0022){ nor = normalAt(p); return tt; }',
    '    tt += d*0.85;',
    '    if(tt > 6.0) break;',
    '  }',
    '  nor = vec3(0.0,1.0,0.0);',
    '  return -1.0;',
    '}',
    'void main(){',
    '  vec2 uv = (gl_FragCoord.xy/uRes)*2.0-1.0;',
    '  uv.x *= uRes.x/uRes.y;',
    '  float ang = 0.55 + uTime*0.09;',
    '  vec3 ro = vec3(sin(ang)*2.15, 0.55 + 0.28*sin(uTime*0.31), cos(ang)*2.15);',
    '  vec3 fw = normalize(-ro), rt = normalize(cross(vec3(0.0,1.0,0.0), fw)), up = cross(fw, rt);',
    '  vec3 rd = normalize(fw*1.55 + rt*uv.x + up*uv.y);',
    '  vec3 nor;',
    '  float tt = march(ro, rd, nor);',
    '  float lum = 0.06;',
    '  if(tt > 0.0){',
    '    vec3 L = normalize(uLight);',
    '    float diff = max(0.0, dot(nor, L));',
    '    float rim = pow(1.0 - max(0.0, dot(nor, -rd)), 2.2)*0.35;',
    '    float ao = 1.0/(1.0+tt*0.35);',
    '    lum = clamp(0.18 + diff*0.72*ao + rim, 0.0, 1.0);',
    '    if(lum > 0.82) lum = 1.0;',
    '  }',
    '  gl_FragColor = vec4(vec3(lum), 1.0);',
    '}'
  ].join('\n');

  var GL = { ok: false, probed: false, reason: '', canvas: null, gl: null, prog: null, loc: null, fbo: null, tex: null, buf: null, w: 0, h: 0 };

  function probe() {
    if (GL.probed) return GL.ok;
    GL.probed = true;
    try {
      var c = document.createElement('canvas');
      c.width = 8; c.height = 8;
      var gl = c.getContext('webgl', { antialias: false, preserveDrawingBuffer: true })
        || c.getContext('experimental-webgl');
      if (!gl) { GL.reason = 'no_webgl_context'; return false; }
      GL.canvas = c; GL.gl = gl;
      function sh(type, src) {
        var s = gl.createShader(type);
        gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { throw new Error('shader: ' + gl.getShaderInfoLog(s)); }
        return s;
      }
      var p = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { throw new Error('link: ' + gl.getProgramInfoLog(p)); }
      gl.useProgram(p);
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var locA = gl.getAttribLocation(p, 'aPos');
      gl.enableVertexAttribArray(locA);
      gl.vertexAttribPointer(locA, 2, gl.FLOAT, false, 0, 0);
      GL.tex = gl.createTexture();
      GL.buf = buf; GL.prog = p;
      GL.loc = {
        res: gl.getUniformLocation(p, 'uRes'), time: gl.getUniformLocation(p, 'uTime'),
        scene: gl.getUniformLocation(p, 'uScene'), light: gl.getUniformLocation(p, 'uLight'),
        warp: gl.getUniformLocation(p, 'uWarp'), seed: gl.getUniformLocation(p, 'uSeed')
      };
      GL.fbo = gl.createFramebuffer();
      GL.ok = true;
      return true;
    } catch (e) {
      GL.reason = String((e && e.message) || e);
      GL.ok = false;
      return false;
    }
  }

  function ensureTarget(w, h) {
    var gl = GL.gl;
    if (GL.w === w && GL.h === h) return;
    gl.bindTexture(gl.TEXTURE_2D, GL.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, GL.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, GL.tex, 0);
    GL.w = w; GL.h = h;
  }

  function renderGL(sceneIndex, cols, rows, opts) {
    var o = opts || {};
    if (!probe()) return null;
    var gl = GL.gl;
    ensureTarget(cols, rows);
    gl.bindFramebuffer(gl.FRAMEBUFFER, GL.fbo);
    gl.viewport(0, 0, cols, rows);
    gl.useProgram(GL.prog);
    gl.uniform2f(GL.loc.res, cols, rows);
    gl.uniform1f(GL.loc.time, o.t === undefined ? 0 : o.t);
    gl.uniform1i(GL.loc.scene, sceneIndex);
    var L = o.light || { x: -0.35, y: -0.35 };
    var lz = 0.85, ln = Math.hypot(L.x, L.y, lz);
    gl.uniform3f(GL.loc.light, L.x / ln, L.y / ln, lz / ln);
    gl.uniform1f(GL.loc.warp, o.warp === undefined ? 1.0 : o.warp);
    gl.uniform1f(GL.loc.seed, o.seed === undefined ? 0 : o.seed);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    var px = new Uint8Array(cols * rows * 4);
    gl.readPixels(0, 0, cols, rows, gl.RGBA, gl.UNSIGNED_BYTE, px);
    if (gl.getError() !== gl.NO_ERROR) return null;
    var lum = new Float32Array(cols * rows);
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        lum[r * cols + c] = px[((rows - 1 - r) * cols + c) * 4] / 255;   /* vertical flip */
      }
    }
    return lum;
  }

  function renderLum(sceneIndex, cols, rows, opts) {
    var o = opts || {};
    var lum = null, path = 'soft';
    if (o.force !== 'soft' && probe()) {
      lum = renderGL(sceneIndex, cols, rows, o);
      if (lum) path = 'webgl';
    }
    if (!lum) {
      if (!root.ZothThreeSoft) return { lum: null, path: 'unavailable' };
      lum = root.ZothThreeSoft.renderSoft(sceneIndex, cols, rows, o);
      path = 'soft';
    }
    return { lum: lum, path: path };
  }

  /* The ASCII three.js call: 3D luminance buffer -> the same glyph stage. */
  function renderAscii3d(cols, rows, opts) {
    var o = opts || {};
    var si = o.sceneIndex === undefined ? 0 : o.sceneIndex;
    var r = renderLum(si, cols, rows, o);
    if (!r.lum) return { text: '', ansi: '', cols: cols, rows: rows, path: r.path, lum: null };
    var out = root.ZothAscii.renderAscii(cols, rows, {
      lum: r.lum,
      rampId: o.rampId || 'braille',
      tube: o.tube || 'cyan',
      sobel: o.sobel === undefined ? false : o.sobel,
      threshold: o.threshold,
      ansi: o.ansi
    });
    out.path = r.path;
    out.sceneIndex = si;
    return out;
  }

  root.ZothThreeAscii = {
    SCENE_NAMES: ['torusKnot', 'merkaba', 'terrain', 'tunnel', 'reactor', 'cubeCore'],
    VERT: VERT, FRAG: FRAG,
    probe: probe,
    glState: GL,
    renderGL: renderGL,
    renderLum: renderLum,
    renderAscii3d: renderAscii3d
  };
})(typeof window !== 'undefined' ? window : globalThis);