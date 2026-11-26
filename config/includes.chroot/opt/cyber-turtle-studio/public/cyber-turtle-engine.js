/**
 * Cyber Turtle Studio v2.6.0 — Deterministic Algorithmic Geometry Engine
 * Shared zero-dependency browser/Node engine implementing:
 *  - 28 built-in L-System presets (including Pythagoras Tree 0/1 drawing)
 *  - Bounded L-System expansion (MAX_ITERATIONS=14, MAX_SYMBOLS=250000)
 *  - Full bounded Logo DSL interpreter (fd/bk/lt/rt/pu/pd/color/width/circle/dot/
 *    push/pop/begin_fill/end_fill/repeat/make/:var/to..end/if/ifelse/stop/home)
 *  - Procedural Truchet Tiling (arcs, diagonal, concentric_arcs, cross_line)
 *  - Algorithmic Maze Generator + BFS Path Solver (backtracker, braided)
 *  - Spirograph parametric hypotrochoid generator
 *  - Nearest-Neighbor + 2-Opt TSP Air-Travel Optimizer (with before/after metrics)
 *  - Pen-Up Gated Auto-Fit CNC G-Code Exporter (G0 pen-up rapid vs G1 pen-down draw)
 *  - Sanitized Theme-Aware Static & Animated SVG Exporter (zero XSS)
 *  - Real 2x4 Sub-Pixel Unicode U+2800 Braille Rasterizer (Bresenham)
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.CyberTurtleEngine = api;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const VERSION = '2.6.0';
  const MAX_REPEAT = 10000;
  const MAX_STEPS = 100000;
  const MAX_RECURSION_DEPTH = 64;
  const MAX_CIRCLE_STEPS = 720;
  const MAX_ITERATIONS = 14;
  const MAX_SYMBOLS = 250000;
  const MAX_GRID_DIM = 120;

  const SAFE_COLOR_RE = /^(?:#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|rgba?\(\s*(?:\d{1,3}%?\s*,\s*){2}\d{1,3}%?(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)|hsla?\(\s*\d{1,3}(?:\.\d+)?\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)|none|transparent|currentColor|[a-zA-Z]{3,24})$/i;

  function sanitizeSvgColor(val, fallback = '#10B981') {
    if (typeof val !== 'string') return fallback;
    const cleaned = val.trim();
    return SAFE_COLOR_RE.test(cleaned) ? cleaned : fallback;
  }

  function escapeXml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const PRESETS = [
    { id: 'koch_snowflake', name: 'Koch Snowflake', category: 'Fractals', axiom: 'F--F--F', rules: { F: 'F+F--F+F' }, angle: 60, iterations: 4, step: 10, heading: 0, description: 'Tri-symmetric Helge von Koch snowflake curve.' },
    { id: 'koch_anti_snowflake', name: 'Koch Anti-Snowflake', category: 'Fractals', axiom: 'F--F--F', rules: { F: 'F-F++F-F' }, angle: 60, iterations: 4, step: 10, heading: 0, description: 'Inverted Koch snowflake with inward indentations.' },
    { id: 'dragon_curve', name: 'Heighway Dragon Curve', category: 'Space-Filling Curves', axiom: 'FX', rules: { X: 'X+YF+', Y: '-FX-Y' }, angle: 90, iterations: 10, step: 8, heading: 0, description: 'Self-similar 90-degree folded paper dragon fractal.' },
    { id: 'terdragon', name: 'Terdragon Curve', category: 'Space-Filling Curves', axiom: 'F', rules: { F: 'F-F+F' }, angle: 120, iterations: 6, step: 10, heading: 0, description: '3-fold dragon curve with 120-degree angular turns.' },
    { id: 'levy_c_curve', name: 'Levy C Curve', category: 'Fractals', axiom: 'F', rules: { F: '+F--F+' }, angle: 45, iterations: 10, step: 8, heading: 0, description: 'Isosceles right-triangle perimeter lace fractal.' },
    { id: 'hilbert_curve', name: 'Hilbert Space-Filling Curve', category: 'Space-Filling Curves', axiom: 'X', rules: { X: '-YF+XFX+FY-', Y: '+XF-YFY-FX+' }, angle: 90, iterations: 5, step: 10, heading: 0, description: 'Locality-preserving 1D-to-2D space-filling curve.' },
    { id: 'moore_curve', name: 'Moore Space-Filling Curve', category: 'Space-Filling Curves', axiom: 'LFL+F+LFL', rules: { L: '-RF+LFL+FR-', R: '+LF-RFR-FL+' }, angle: 90, iterations: 4, step: 10, heading: 0, description: 'Closed-loop variant of the Hilbert space-filling curve.' },
    { id: 'gosper_curve', name: 'Gosper Flowsnake Curve', category: 'Space-Filling Curves', axiom: 'X', rules: { X: 'X+YF++YF-FX--FXFX-YF+', Y: '-FX+YFYF++YF+FX--FX-Y' }, angle: 60, iterations: 4, step: 8, heading: 0, description: 'Hexagonal interlocking space-filling flowsnake.' },
    { id: 'sierpinski_triangle', name: 'Sierpinski Triangle', category: 'Fractals', axiom: 'F-G-G', rules: { F: 'F-G+F+G-F', G: 'GG' }, angle: 120, iterations: 5, step: 10, heading: 0, description: 'Recursive equilateral triangle gasket fractal.' },
    { id: 'sierpinski_carpet', name: 'Sierpinski Carpet', category: 'Fractals', axiom: 'F', rules: { F: 'F+F-F-F-G+F+F+F-F', G: 'GGG' }, angle: 90, iterations: 3, step: 8, heading: 0, description: 'Recursive subdivided square carpet fractal.' },
    { id: 'sierpinski_arrowhead', name: 'Sierpinski Arrowhead Curve', category: 'Fractals', axiom: 'XF', rules: { X: 'YF+XF+Y', Y: 'XF-YF-X' }, angle: 60, iterations: 6, step: 8, heading: 0, description: 'Single continuous curve tracing the Sierpinski triangle.' },
    { id: 'peano_curve', name: 'Peano Space-Filling Curve', category: 'Space-Filling Curves', axiom: 'X', rules: { X: 'XFYFX+F+YFXFY-F-XFYFX', Y: 'YFXFY-F-XFYFX+F+YFXFY' }, angle: 90, iterations: 3, step: 8, heading: 0, description: 'Giuseppe Peano 3x3 recursive space-filling curve.' },
    { id: 'pythagoras_tree', name: 'Pythagoras Tree', category: 'Plants & Trees', axiom: '0', rules: { '1': '11', '0': '1[+0]-0' }, angle: 45, iterations: 6, step: 6, heading: 90, description: 'Binary branching Pythagoras tree (0/1 draw grammar).' },
    { id: 'barnsley_fern', name: 'Barnsley Fern', category: 'Plants & Trees', axiom: 'X', rules: { X: 'F[+X]F[-X]+X', F: 'FF' }, angle: 25, iterations: 6, step: 5, heading: 90, description: 'Biological fern frond branching L-System.' },
    { id: 'fractal_plant_a', name: 'Prusinkiewicz Classic Plant', category: 'Plants & Trees', axiom: 'X', rules: { X: 'F+[[X]-X]-F[-FX]+X', F: 'FF' }, angle: 25, iterations: 5, step: 6, heading: 65, description: 'Multi-tier botanical stem and leaf clusters.' },
    { id: 'fractal_plant_b', name: 'Fractal Bush', category: 'Plants & Trees', axiom: 'F', rules: { F: 'FF+[+F-F-F]-[-F+F+F]' }, angle: 22.5, iterations: 4, step: 8, heading: 90, description: 'Dense symmetric branching shrub.' },
    { id: 'fractal_plant_c', name: 'Wild Wheat Frond', category: 'Plants & Trees', axiom: 'F', rules: { F: 'F[+F]F[-F][F]' }, angle: 20, iterations: 5, step: 8, heading: 90, description: 'Slender grass blades with lateral grain offshoots.' },
    { id: 'fractal_plant_d', name: 'Canopy Branching Tree', category: 'Plants & Trees', axiom: 'X', rules: { X: 'F[+X][-X]FX', F: 'FF' }, angle: 22.5, iterations: 5, step: 6, heading: 90, description: 'Naturalistic canopy tree with multi-axis forks.' },
    { id: 'fractal_plant_e', name: 'Cyber Vines & Tendrils', category: 'Plants & Trees', axiom: 'X', rules: { X: 'F-[[X]+X]+F[+FX]-X', F: 'FF' }, angle: 22.5, iterations: 4, step: 8, heading: 90, description: 'Curving botanical tendrils and crawling vines.' },
    { id: 'kolam_tile', name: 'Kolam Sacred Tile', category: 'Tiles & Kolam', axiom: '-X--X', rules: { X: 'XFX--XFX' }, angle: 45, iterations: 4, step: 10, heading: 0, description: 'Traditional South Indian geometric floor-art loop.' },
    { id: 'quadratic_koch_island', name: 'Quadratic Koch Island', category: 'Fractals', axiom: 'F-F-F-F', rules: { F: 'F+FF-FF-F-F+F+FF-F' }, angle: 90, iterations: 3, step: 8, heading: 0, description: 'Minkowski square perimeter recursive bay fractal.' },
    { id: 'crystal_lattice', name: 'Hexagonal Crystal Lattice', category: 'Sacred Geometry', axiom: 'F+F+F+F+F+F', rules: { F: 'F-F++F-F' }, angle: 60, iterations: 4, step: 8, heading: 0, description: 'Six-fold hexagonal crystalline motif.' },
    { id: 'cross_curve', name: 'Fractal Greek Cross', category: 'Sacred Geometry', axiom: 'F+F+F+F', rules: { F: 'F+F-F-FF+F+F-F' }, angle: 90, iterations: 3, step: 10, heading: 0, description: 'Four-fold symmetric cross expanding quadratically.' },
    { id: 'quadratic_gosper', name: 'Quadratic Gosper (E-Curve)', category: 'Space-Filling Curves', axiom: '-YF', rules: { X: 'XFX-YF-YF+FX+FX-YF-YFFX+YF+FXFXYF-FX+YF+FXFX+YF-FXYF-YF-FX+FX+YFYF-', Y: '+FXFX-YF-YF+FX+FXYF+FX-YFYF-FX-YF+FXYFYF-FX-YFFX+FX+YF-YF-FX+FX+YFY' }, angle: 90, iterations: 2, step: 8, heading: 0, description: 'Grid-aligned square labyrinth space-filling curve.' },
    { id: 'pentaplexity', name: 'Pentaplexity (Penrose 5-Fold)', category: 'Sacred Geometry', axiom: 'F++F++F++F++F', rules: { F: 'F++F++F|F-F++F' }, angle: 36, iterations: 4, step: 10, heading: 0, description: '5-fold rotational symmetry Penrose tile motif.' },
    { id: 'anklets_of_krishna', name: 'Anklets of Krishna', category: 'Tiles & Kolam', axiom: '-X--X', rules: { X: 'XFX--XFX' }, angle: 45, iterations: 5, step: 8, heading: 0, description: 'Higher-order interlocking Kolam lattice.' },
    { id: 'hexagonal_gosper_star', name: 'Hexagonal Snowflake Star', category: 'Sacred Geometry', axiom: 'F+F+F+F+F+F', rules: { F: 'F+F--F+F' }, angle: 60, iterations: 3, step: 10, heading: 0, description: 'Six-pointed Koch star perimeter.' },
    { id: 'quadratic_snowflake', name: 'Quadratic Snowflake', category: 'Fractals', axiom: 'F-F-F-F', rules: { F: 'F-F+F+FF-F-F+F' }, angle: 90, iterations: 3, step: 8, heading: 0, description: 'Orthogonal 90-degree fractal snowflake.' },
  ];

  const LOGO_SAMPLES = {
    flower: {
      name: 'Flower of Life',
      code: '; Sacred 12-petal circular lattice\ncolor #10B981\nwidth 1.6\nrepeat 12 [\n  circle 55\n  rt 30\n]',
    },
    spiral: {
      name: 'Spiral Vortex',
      code: '; Parametric variable spiral\nmake "len 6\ncolor #D4AF37\nwidth 1.5\nrepeat 72 [\n  fd :len\n  rt 89\n  make "len :len + 2.4\n]',
    },
    koch: {
      name: 'Koch Logo (Recursive)',
      code: '; Recursive Koch Snowflake with if/stop\nto koch :len :depth\n  if :depth == 0 [ fd :len stop ]\n  koch :len / 3 :depth - 1\n  lt 60\n  koch :len / 3 :depth - 1\n  rt 120\n  koch :len / 3 :depth - 1\n  lt 60\n  koch :len / 3 :depth - 1\nend\ncolor #10B981\nrepeat 3 [ koch 180 3 rt 120 ]',
    },
    mandala: {
      name: 'Hex Mandala',
      code: '; Rotated geometric polygons\ncolor #38BDF8\nrepeat 18 [\n  repeat 6 [ fd 48 rt 60 ]\n  rt 20\n]',
    },
    pen_test: {
      name: 'Pen-Up Grid (TSP Test)',
      code: '; Disconnected segments for 2-Opt TSP + G0 pen-up test\nrepeat 6 [\n  repeat 4 [ fd 30 rt 90 ]\n  pu fd 55 rt 60 pd\n]',
    },
  };

  function expandLSystem(axiom, rulesObj, iterations) {
    const iters = Math.floor(Number(iterations));
    if (!Number.isFinite(iters) || iters < 0 || iters > MAX_ITERATIONS) {
      throw new Error(`L-System iterations ${iterations} out of bounds (0..${MAX_ITERATIONS})`);
    }
    let current = String(axiom || '');
    if (current.length > MAX_SYMBOLS) {
      throw new Error(`Axiom exceeds max symbol limit (${MAX_SYMBOLS})`);
    }
    const rules = rulesObj && typeof rulesObj === 'object' ? rulesObj : {};
    for (let i = 0; i < iters; i++) {
      let next = '';
      for (let j = 0; j < current.length; j++) {
        const ch = current[j];
        const rep = Object.prototype.hasOwnProperty.call(rules, ch) ? String(rules[ch]) : ch;
        next += rep;
        if (next.length > MAX_SYMBOLS) {
          throw new Error(`L-System expansion exceeded max symbol limit (${MAX_SYMBOLS})`);
        }
      }
      current = next;
    }
    return current;
  }

  function interpretLSystem(lstring, opts = {}) {
    const turnAngle = Number.isFinite(Number(opts.angle)) ? Number(opts.angle) : 60;
    let step = Number.isFinite(Number(opts.step)) ? Number(opts.step) : 10;
    const stepScale = Number.isFinite(Number(opts.stepScale)) && Number(opts.stepScale) > 0 ? Number(opts.stepScale) : 0.8;
    let heading = Number.isFinite(Number(opts.heading)) ? Number(opts.heading) : 0;
    let x = 0;
    let y = 0;
    let color = sanitizeSvgColor(opts.color || '#10B981');
    let width = Number(opts.width) || 1.5;
    const palette = ['#10B981', '#D4AF37', '#38BDF8', '#A78BFA', '#F59E0B', '#34D399'];
    let palIdx = 0;
    const stack = [];
    const segments = [];
    const rad = (deg) => (deg * Math.PI) / 180;

    for (let i = 0; i < lstring.length; i++) {
      if (segments.length >= MAX_STEPS) {
        throw new Error(`L-System exceeded maximum segment budget (${MAX_STEPS})`);
      }
      const ch = lstring[i];
      if (ch === 'F' || ch === 'G' || ch === 'A' || ch === 'B' || ch === '0' || ch === '1') {
        const nx = x + Math.cos(rad(heading)) * step;
        const ny = y + Math.sin(rad(heading)) * step;
        segments.push({ x1: x, y1: y, x2: nx, y2: ny, is_draw: true, color, width });
        x = nx;
        y = ny;
      } else if (ch === 'f') {
        const nx = x + Math.cos(rad(heading)) * step;
        const ny = y + Math.sin(rad(heading)) * step;
        segments.push({ x1: x, y1: y, x2: nx, y2: ny, is_draw: false, color, width });
        x = nx;
        y = ny;
      } else if (ch === '+') {
        heading -= turnAngle;
      } else if (ch === '-') {
        heading += turnAngle;
      } else if (ch === '|') {
        heading += 180;
      } else if (ch === '[') {
        stack.push({ x, y, heading, step, color, width });
      } else if (ch === ']') {
        if (stack.length > 0) {
          const prev = stack.pop();
          if (Math.hypot(x - prev.x, y - prev.y) > 1e-6) {
            segments.push({ x1: x, y1: y, x2: prev.x, y2: prev.y, is_draw: false, color, width });
          }
          x = prev.x;
          y = prev.y;
          heading = prev.heading;
          step = prev.step;
          color = prev.color;
          width = prev.width;
        }
      } else if (ch === '<') {
        step *= stepScale;
      } else if (ch === '>') {
        step /= stepScale;
      } else if (ch === 'C') {
        palIdx = (palIdx + 1) % palette.length;
        color = palette[palIdx];
      }
    }
    return computeMetrics(segments);
  }

  // Deterministic safe arithmetic expression evaluator (no eval/Function)
  function evalSafeArith(exprStr, vars) {
    const s = String(exprStr || '').trim();
    if (!s) return 0;
    if (/^:[a-zA-Z_][a-zA-Z0-9_-]*$/.test(s)) {
      return Number(vars[s.slice(1)] ?? 0);
    }
    const substituted = s.replace(/:([a-zA-Z_][a-zA-Z0-9_-]*)/g, (_, name) => String(Number(vars[name] ?? 0)));
    const tokens = substituted.match(/\d*\.?\d+(?:[eE][+-]?\d+)?|[+\-*/%()]|[a-zA-Z_][a-zA-Z0-9_]*/g);
    if (!tokens || tokens.length === 0) return 0;

    let pos = 0;
    function peek() { return tokens[pos]; }
    function next() { return tokens[pos++]; }

    function parseExpr() {
      let left = parseTerm();
      while (peek() === '+' || peek() === '-') {
        const op = next();
        const right = parseTerm();
        left = op === '+' ? left + right : left - right;
      }
      return left;
    }

    function parseTerm() {
      let left = parseFactor();
      while (peek() === '*' || peek() === '/' || peek() === '%') {
        const op = next();
        const right = parseFactor();
        if (op === '*') left *= right;
        else if (op === '/') left = right === 0 ? 0 : left / right;
        else left = right === 0 ? 0 : left % right;
      }
      return left;
    }

    function parseFactor() {
      const t = peek();
      if (t === '+') { next(); return parseFactor(); }
      if (t === '-') { next(); return -parseFactor(); }
      if (t === '(') {
        next();
        const v = parseExpr();
        if (peek() === ')') next();
        return v;
      }
      if (t !== undefined && /^[a-zA-Z_]/.test(t)) {
        next();
        const lower = t.toLowerCase();
        if (lower === 'pi') return Math.PI;
        if (lower === 'e') return Math.E;
        if (Object.prototype.hasOwnProperty.call(vars, t)) return Number(vars[t]);
        if (Object.prototype.hasOwnProperty.call(vars, lower)) return Number(vars[lower]);
        if (peek() === '(') {
          next();
          const arg = parseExpr();
          if (peek() === ')') next();
          if (lower === 'sin') return Math.sin(arg);
          if (lower === 'cos') return Math.cos(arg);
          if (lower === 'tan') return Math.tan(arg);
          if (lower === 'sqrt') return Math.sqrt(Math.max(0, arg));
          if (lower === 'abs') return Math.abs(arg);
        }
        return 0;
      }
      next();
      const num = parseFloat(t);
      return Number.isFinite(num) ? num : 0;
    }

    const res = parseExpr();
    return Number.isFinite(res) ? res : 0;
  }

  function tokenizeLogo(script) {
    const cleanedLines = String(script || '').split(/\r?\n/).map((line) =>
      line.replace(/(;|\/\/|(?<![a-zA-Z0-9_])#(?!([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b)).*$/, '')
    );
    const cleaned = cleanedLines.join(' ');
    const re = /\[|\]|<=|>=|==|!=|[<>]|"[a-zA-Z0-9_#-]+|:[a-zA-Z0-9_-]+|#[0-9a-fA-F]{3,8}|[a-zA-Z_][a-zA-Z0-9_]*|[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?|[+\-*/%()]|[^\s\[\]]+/g;
    return cleaned.match(re) || [];
  }

  function parseLogoBlocks(tokens) {
    const stack = [[]];
    for (const tok of tokens) {
      if (tok === '[') {
        const blk = [];
        stack[stack.length - 1].push(blk);
        stack.push(blk);
      } else if (tok === ']') {
        if (stack.length > 1) stack.pop();
      } else {
        stack[stack.length - 1].push(tok);
      }
    }
    return stack[0];
  }

  function executeLogo(script, opts = {}) {
    const tokens = parseLogoBlocks(tokenizeLogo(script));
    let x = 0;
    let y = 0;
    let heading = 0;
    let penDown = true;
    let color = sanitizeSvgColor(opts.color || '#10B981');
    let width = Number(opts.width) || 1.5;
    let isFilling = false;
    let fillColor = color;
    let fillPts = [];
    const stateStack = [];
    const segments = [];
    const dots = [];
    const polygons = [];
    let vars = {};
    const procs = {};
    let stepCount = 0;
    let recDepth = 0;
    const STOP_SIG = { __logoStop: true };
    const rad = (deg) => (deg * Math.PI) / 180;

    function tick(cost = 1) {
      stepCount += cost;
      if (stepCount > MAX_STEPS) {
        throw new Error(`Logo execution exceeded maximum step budget (${MAX_STEPS})`);
      }
    }

    function moveTo(nx, ny) {
      if (isFilling) fillPts.push({ x: nx, y: ny });
      if (Math.hypot(nx - x, ny - y) > 1e-9) {
        segments.push({ x1: x, y1: y, x2: nx, y2: ny, is_draw: penDown, color, width });
      }
      x = nx;
      y = ny;
    }

    function forward(dist) {
      const nx = x + Math.cos(rad(heading)) * dist;
      const ny = y + Math.sin(rad(heading)) * dist;
      moveTo(nx, ny);
    }

    function drawCircle(r, extent = 360, steps = null) {
      if (!r || !extent) return;
      let count;
      if (steps !== null) {
        const sInt = Math.floor(steps);
        if (sInt < 1 || sInt > MAX_CIRCLE_STEPS) {
          throw new Error(`circle steps ${sInt} out of bounds (1..${MAX_CIRCLE_STEPS})`);
        }
        count = Math.max(3, sInt);
      } else {
        const arcLen = Math.abs(r * rad(extent));
        count = Math.max(12, Math.min(180, Math.floor(arcLen / 3) + Math.floor(Math.abs(extent) / 8)));
      }
      const stepAngle = extent / count;
      const chord = 2 * Math.abs(r) * Math.sin(rad(Math.abs(stepAngle) / 2));
      const halfTurn = (stepAngle / 2) * (r >= 0 ? 1 : -1);
      for (let k = 0; k < count; k++) {
        tick(1);
        heading = (heading + halfTurn) % 360;
        forward(chord);
        heading = (heading + halfTurn) % 360;
      }
    }

    function readExpr(arr, start) {
      if (start >= arr.length || Array.isArray(arr[start])) return [0, start];
      if (arr[start] === '(') {
        let depth = 0;
        const parts = [];
        let j = start;
        while (j < arr.length && !Array.isArray(arr[j])) {
          const t = String(arr[j]);
          parts.push(t);
          if (t === '(') depth++;
          else if (t === ')') {
            depth--;
            if (depth === 0) { j++; break; }
          }
          j++;
        }
        return [evalSafeArith(parts.join(' '), vars), j];
      }
      const parts = [String(arr[start])];
      let j = start + 1;
      while (j + 1 < arr.length && !Array.isArray(arr[j]) && ['+', '-', '*', '/', '%'].includes(String(arr[j]))) {
        if (Array.isArray(arr[j + 1])) break;
        parts.push(String(arr[j]), String(arr[j + 1]));
        j += 2;
      }
      return [evalSafeArith(parts.join(' '), vars), j];
    }

    function evalCondition(arr, start) {
      const [lhs, idx] = readExpr(arr, start);
      if (idx < arr.length && !Array.isArray(arr[idx]) && ['=', '==', '!=', '<', '<=', '>', '>='].includes(String(arr[idx]))) {
        const op = String(arr[idx]);
        const [rhs, nextIdx] = readExpr(arr, idx + 1);
        if (op === '=' || op === '==') return [Math.abs(lhs - rhs) < 1e-9, nextIdx];
        if (op === '!=') return [Math.abs(lhs - rhs) >= 1e-9, nextIdx];
        if (op === '<') return [lhs < rhs, nextIdx];
        if (op === '<=') return [lhs <= rhs, nextIdx];
        if (op === '>') return [lhs > rhs, nextIdx];
        if (op === '>=') return [lhs >= rhs, nextIdx];
      }
      return [Boolean(lhs), idx];
    }

    const STOP_WORDS = new Set([
      'fd', 'forward', 'bk', 'backward', 'back', 'lt', 'left', 'rt', 'right',
      'pu', 'penup', 'pd', 'pendown', 'repeat', 'circle', 'dot', 'color', 'pencolor',
      'setcolor', 'width', 'pensize', 'push', 'pop', 'if', 'ifelse', 'make', 'set',
      'let', 'to', 'end', 'home', 'stop', 'begin_fill', 'end_fill', 'goto', 'setpos', 'seth',
    ]);

    function execList(arr) {
      let i = 0;
      while (i < arr.length) {
        tick(1);
        const tok = arr[i];
        if (Array.isArray(tok)) {
          execList(tok);
          i++;
          continue;
        }
        const cmd = String(tok).toLowerCase();

        if (cmd === 'stop') throw STOP_SIG;
        else if (cmd === 'home') { moveTo(0, 0); heading = 0; i++; }
        else if (cmd === 'fd' || cmd === 'forward') {
          if (i + 1 < arr.length && !Array.isArray(arr[i + 1])) {
            const [d, ni] = readExpr(arr, i + 1);
            forward(d);
            i = ni;
          } else { forward(10); i++; }
        } else if (cmd === 'bk' || cmd === 'backward' || cmd === 'back') {
          if (i + 1 < arr.length && !Array.isArray(arr[i + 1])) {
            const [d, ni] = readExpr(arr, i + 1);
            forward(-d);
            i = ni;
          } else { forward(-10); i++; }
        } else if (cmd === 'lt' || cmd === 'left') {
          if (i + 1 < arr.length && !Array.isArray(arr[i + 1])) {
            const [a, ni] = readExpr(arr, i + 1);
            heading = (heading + a) % 360;
            i = ni;
          } else { heading = (heading + 90) % 360; i++; }
        } else if (cmd === 'rt' || cmd === 'right') {
          if (i + 1 < arr.length && !Array.isArray(arr[i + 1])) {
            const [a, ni] = readExpr(arr, i + 1);
            heading = (heading - a) % 360;
            i = ni;
          } else { heading = (heading - 90) % 360; i++; }
        } else if (cmd === 'pu' || cmd === 'penup') { penDown = false; i++; }
        else if (cmd === 'pd' || cmd === 'pendown') { penDown = true; i++; }
        else if (cmd === 'seth' || cmd === 'setheading' || cmd === 'heading') {
          if (i + 1 < arr.length && !Array.isArray(arr[i + 1])) {
            const [a, ni] = readExpr(arr, i + 1);
            heading = a % 360;
            i = ni;
          } else i++;
        } else if (cmd === 'goto' || cmd === 'setpos' || cmd === 'setposition') {
          if (i + 2 < arr.length && !Array.isArray(arr[i + 1])) {
            const [gx, mi] = readExpr(arr, i + 1);
            const [gy, ni] = readExpr(arr, mi);
            moveTo(gx, gy);
            i = ni;
          } else i++;
        } else if (cmd === 'color' || cmd === 'pencolor' || cmd === 'setcolor') {
          if (i + 1 < arr.length && !Array.isArray(arr[i + 1])) {
            color = sanitizeSvgColor(String(arr[i + 1]).replace(/^"|"$/g, ''), color);
            i += 2;
          } else i++;
        } else if (cmd === 'width' || cmd === 'pensize' || cmd === 'setwidth') {
          if (i + 1 < arr.length && !Array.isArray(arr[i + 1])) {
            const [w, ni] = readExpr(arr, i + 1);
            width = Math.max(0.2, Math.min(20, w));
            i = ni;
          } else i++;
        } else if (cmd === 'circle') {
          if (i + 1 < arr.length && !Array.isArray(arr[i + 1])) {
            const [r, ni1] = readExpr(arr, i + 1);
            let ext = 360;
            let steps = null;
            let ni = ni1;
            if (ni < arr.length && !Array.isArray(arr[ni]) && !STOP_WORDS.has(String(arr[ni]).toLowerCase()) && !procs[String(arr[ni]).toLowerCase()]) {
              [ext, ni] = readExpr(arr, ni);
              if (ni < arr.length && !Array.isArray(arr[ni]) && !STOP_WORDS.has(String(arr[ni]).toLowerCase()) && !procs[String(arr[ni]).toLowerCase()]) {
                [steps, ni] = readExpr(arr, ni);
              }
            }
            drawCircle(r, ext, steps);
            i = ni;
          } else i++;
        } else if (cmd === 'dot') {
          let sz = 5;
          let dotCol = color;
          let ni = i + 1;
          if (ni < arr.length && !Array.isArray(arr[ni])) {
            [sz, ni] = readExpr(arr, ni);
            if (ni < arr.length && !Array.isArray(arr[ni]) && String(arr[ni]).startsWith('#')) {
              dotCol = sanitizeSvgColor(String(arr[ni]), color);
              ni++;
            }
          }
          dots.push({ x, y, r: Math.max(0.5, sz / 2), color: dotCol });
          i = ni;
        } else if (cmd === 'push' || cmd === 'push_state') {
          stateStack.push({ x, y, heading, penDown, color, width });
          i++;
        } else if (cmd === 'pop' || cmd === 'pop_state') {
          if (stateStack.length > 0) {
            const prev = stateStack.pop();
            if (Math.hypot(x - prev.x, y - prev.y) > 1e-9) {
              segments.push({ x1: x, y1: y, x2: prev.x, y2: prev.y, is_draw: false, color, width });
            }
            ({ x, y, heading, penDown, color, width } = prev);
          }
          i++;
        } else if (cmd === 'begin_fill' || cmd === 'fill_start') {
          isFilling = true;
          fillColor = color;
          if (i + 1 < arr.length && !Array.isArray(arr[i + 1]) && String(arr[i + 1]).startsWith('#')) {
            fillColor = sanitizeSvgColor(String(arr[i + 1]), color);
            i++;
          }
          fillPts = [{ x, y }];
          i++;
        } else if (cmd === 'end_fill' || cmd === 'fill_end') {
          if (isFilling && fillPts.length >= 3) {
            polygons.push({ points: fillPts.slice(), fillColor, strokeColor: color, width });
          }
          isFilling = false;
          fillPts = [];
          i++;
        } else if (cmd === 'if') {
          const [cond, ni] = evalCondition(arr, i + 1);
          if (ni < arr.length && Array.isArray(arr[ni])) {
            if (cond) execList(arr[ni]);
            i = ni + 1;
          } else i = ni;
        } else if (cmd === 'ifelse') {
          const [cond, ni] = evalCondition(arr, i + 1);
          if (ni + 1 < arr.length && Array.isArray(arr[ni]) && Array.isArray(arr[ni + 1])) {
            execList(cond ? arr[ni] : arr[ni + 1]);
            i = ni + 2;
          } else i = ni;
        } else if (cmd === 'repeat') {
          const [countF, ni] = readExpr(arr, i + 1);
          const count = Math.floor(countF);
          if (!Number.isFinite(count) || count < 0 || count > MAX_REPEAT) {
            throw new Error(`repeat count ${count} out of bounds (0..${MAX_REPEAT})`);
          }
          if (ni < arr.length && Array.isArray(arr[ni])) {
            const prevRep = vars.repcount;
            for (let k = 1; k <= count; k++) {
              vars.repcount = k;
              vars.REPCOUNT = k;
              execList(arr[ni]);
            }
            if (prevRep === undefined) { delete vars.repcount; delete vars.REPCOUNT; }
            else { vars.repcount = prevRep; vars.REPCOUNT = prevRep; }
            i = ni + 1;
          } else i = ni;
        } else if (cmd === 'make' || cmd === 'set' || cmd === 'let') {
          if (i + 2 < arr.length) {
            const vName = String(arr[i + 1]).replace(/^["':]+/, '');
            const [val, ni] = readExpr(arr, i + 2);
            vars[vName] = val;
            i = ni;
          } else i++;
        } else if (cmd === 'to') {
          if (i + 1 >= arr.length) break;
          const pName = String(arr[i + 1]).toLowerCase();
          const params = [];
          let idx = i + 2;
          while (idx < arr.length && !Array.isArray(arr[idx]) && String(arr[idx]).startsWith(':')) {
            params.push(String(arr[idx]).slice(1));
            idx++;
          }
          const body = [];
          while (idx < arr.length && (Array.isArray(arr[idx]) || String(arr[idx]).toLowerCase() !== 'end')) {
            body.push(arr[idx]);
            idx++;
          }
          procs[pName] = { params, body };
          i = idx < arr.length ? idx + 1 : arr.length;
        } else if (procs[cmd]) {
          if (recDepth >= MAX_RECURSION_DEPTH) {
            throw new Error(`Logo recursion depth limit exceeded (${MAX_RECURSION_DEPTH}) calling '${cmd}'`);
          }
          const { params, body } = procs[cmd];
          const saved = { ...vars };
          let ni = i + 1;
          const vals = [];
          for (let p = 0; p < params.length; p++) {
            if (ni < arr.length && !Array.isArray(arr[ni])) {
              const [v, nextI] = readExpr(arr, ni);
              vals.push(v);
              ni = nextI;
            } else vals.push(0);
          }
          params.forEach((p, idxP) => { vars[p] = vals[idxP]; });
          recDepth++;
          try {
            execList(body);
          } catch (sig) {
            if (sig !== STOP_SIG) throw sig;
          } finally {
            recDepth--;
            vars = saved;
          }
          i = ni;
        } else {
          i++;
        }
      }
    }

    try {
      execList(tokens);
    } catch (sig) {
      if (sig !== STOP_SIG) throw sig;
    }

    const res = computeMetrics(segments);
    res.dots = dots;
    res.polygons = polygons;
    return res;
  }

  function seededRng(seed) {
    let s = (Number(seed) || 42) >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function generateTruchet(opts = {}) {
    const rows = Math.floor(Number(opts.rows ?? 8));
    const cols = Math.floor(Number(opts.cols ?? 8));
    const tileSize = Number(opts.tileSize ?? 40);
    const style = String(opts.style || 'arcs');
    const color = sanitizeSvgColor(opts.color || '#10B981');
    if (rows < 1 || rows > MAX_GRID_DIM || cols < 1 || cols > MAX_GRID_DIM) {
      throw new Error(`Truchet grid (${rows}x${cols}) out of bounds (1..${MAX_GRID_DIM})`);
    }
    const rng = seededRng(opts.seed ?? 42);
    const segments = [];
    const half = tileSize / 2;
    const arcSegs = 10;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tx = c * tileSize;
        const ty = r * tileSize;
        const state = rng() < 0.5 ? 0 : 1;
        if (style === 'diagonal') {
          if (state === 0) segments.push({ x1: tx, y1: ty, x2: tx + tileSize, y2: ty + tileSize, is_draw: true, color, width: 1.8 });
          else segments.push({ x1: tx + tileSize, y1: ty, x2: tx, y2: ty + tileSize, is_draw: true, color, width: 1.8 });
        } else if (style === 'cross_line') {
          segments.push({ x1: tx, y1: ty + half, x2: tx + tileSize, y2: ty + half, is_draw: true, color, width: 1.6 });
          segments.push({ x1: tx + half, y1: ty, x2: tx + half, y2: ty + tileSize, is_draw: true, color, width: 1.6 });
        } else {
          const radii = style === 'concentric_arcs' ? [tileSize * 0.3, tileSize * 0.7] : [half];
          const centers = state === 0
            ? [[tx, ty, 0, Math.PI / 2], [tx + tileSize, ty + tileSize, Math.PI, 1.5 * Math.PI]]
            : [[tx + tileSize, ty, Math.PI / 2, Math.PI], [tx, ty + tileSize, 1.5 * Math.PI, 2 * Math.PI]];
          for (const [cx, cy, a0, a1] of centers) {
            for (const radVal of radii) {
              let px = cx + radVal * Math.cos(a0);
              let py = cy + radVal * Math.sin(a0);
              for (let k = 1; k <= arcSegs; k++) {
                const a = a0 + (k / arcSegs) * (a1 - a0);
                const nx = cx + radVal * Math.cos(a);
                const ny = cy + radVal * Math.sin(a);
                segments.push({ x1: px, y1: py, x2: nx, y2: ny, is_draw: true, color, width: 1.8 });
                px = nx; py = ny;
              }
            }
          }
        }
      }
    }
    return computeMetrics(segments);
  }

  function generateMaze(opts = {}) {
    const rows = Math.floor(Number(opts.rows ?? 12));
    const cols = Math.floor(Number(opts.cols ?? 12));
    const cellSize = Number(opts.cellSize ?? 28);
    const solve = opts.solve !== false;
    const wallColor = sanitizeSvgColor(opts.wallColor || '#38BDF8');
    const pathColor = sanitizeSvgColor(opts.pathColor || '#10B981');
    if (rows < 1 || rows > MAX_GRID_DIM || cols < 1 || cols > MAX_GRID_DIM) {
      throw new Error(`Maze grid (${rows}x${cols}) out of bounds (1..${MAX_GRID_DIM})`);
    }
    const rng = seededRng(opts.seed ?? 42);
    const edgeKey = (a, b) => (a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]))
      ? `${a[0]},${a[1]}-${b[0]},${b[1]}` : `${b[0]},${b[1]}-${a[0]},${a[1]}`;
    const passages = new Set();
    const visited = new Set(['0,0']);
    const stack = [[0, 0]];
    const nbrs = (r, c) => {
      const out = [];
      if (r > 0) out.push([r - 1, c]);
      if (r < rows - 1) out.push([r + 1, c]);
      if (c > 0) out.push([r, c - 1]);
      if (c < cols - 1) out.push([r, c + 1]);
      return out;
    };
    while (stack.length > 0) {
      const curr = stack[stack.length - 1];
      const unv = nbrs(curr[0], curr[1]).filter(([nr, nc]) => !visited.has(`${nr},${nc}`));
      if (unv.length > 0) {
        const nxt = unv[Math.floor(rng() * unv.length)];
        passages.add(edgeKey(curr, nxt));
        visited.add(`${nxt[0]},${nxt[1]}`);
        stack.push(nxt);
      } else {
        stack.pop();
      }
    }
    const segments = [];
    const W = cols * cellSize;
    const H = rows * cellSize;
    segments.push({ x1: 0, y1: 0, x2: W, y2: 0, is_draw: true, color: wallColor, width: 1.8 });
    segments.push({ x1: 0, y1: H, x2: W, y2: H, is_draw: true, color: wallColor, width: 1.8 });
    segments.push({ x1: 0, y1: 0, x2: 0, y2: H, is_draw: true, color: wallColor, width: 1.8 });
    segments.push({ x1: W, y1: 0, x2: W, y2: H, is_draw: true, color: wallColor, width: 1.8 });
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols; c++) {
        if (!passages.has(edgeKey([r, c], [r + 1, c]))) {
          segments.push({ x1: c * cellSize, y1: (r + 1) * cellSize, x2: (c + 1) * cellSize, y2: (r + 1) * cellSize, is_draw: true, color: wallColor, width: 1.6 });
        }
      }
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols - 1; c++) {
        if (!passages.has(edgeKey([r, c], [r, c + 1]))) {
          segments.push({ x1: (c + 1) * cellSize, y1: r * cellSize, x2: (c + 1) * cellSize, y2: (r + 1) * cellSize, is_draw: true, color: wallColor, width: 1.6 });
        }
      }
    }
    let solutionLength = 0;
    if (solve) {
      const queue = [[[0, 0], [[0, 0]]]];
      const seen = new Set(['0,0']);
      let sol = null;
      while (queue.length > 0) {
        const [cur, path] = queue.shift();
        if (cur[0] === rows - 1 && cur[1] === cols - 1) { sol = path; break; }
        for (const nb of nbrs(cur[0], cur[1])) {
          const k = `${nb[0]},${nb[1]}`;
          if (!seen.has(k) && passages.has(edgeKey(cur, nb))) {
            seen.add(k);
            queue.push([nb, path.concat([nb])]);
          }
        }
      }
      if (sol && sol.length > 1) {
        solutionLength = sol.length;
        for (let i = 0; i < sol.length - 1; i++) {
          const [r0, c0] = sol[i];
          const [r1, c1] = sol[i + 1];
          segments.push({
            x1: c0 * cellSize + cellSize / 2,
            y1: r0 * cellSize + cellSize / 2,
            x2: c1 * cellSize + cellSize / 2,
            y2: r1 * cellSize + cellSize / 2,
            is_draw: true,
            color: pathColor,
            width: 2.6,
          });
        }
      }
    }
    const res = computeMetrics(segments);
    res.solutionLength = solutionLength;
    return res;
  }

  function generateSpirograph(opts = {}) {
    const R = Number(opts.outerR ?? 120);
    const r = Number(opts.innerR ?? 45);
    const d = Number(opts.penD ?? 65);
    const steps = Math.max(20, Math.min(8000, Math.floor(Number(opts.steps ?? 1200))));
    const color = sanitizeSvgColor(opts.color || '#D4AF37');
    if (r === 0) throw new Error('innerR cannot be 0');
    const gcd = (a, b) => (b < 1e-6 ? a : gcd(b, a % b));
    const revs = Math.min(40, Math.round(Math.abs(r) / gcd(Math.abs(R), Math.abs(r))));
    const maxT = Math.PI * 2 * Math.max(1, revs);
    const segments = [];
    let px = (R - r) + d;
    let py = 0;
    for (let i = 1; i <= steps; i++) {
      const t = (i / steps) * maxT;
      const nx = (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
      const ny = (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t);
      segments.push({ x1: px, y1: py, x2: nx, y2: ny, is_draw: true, color, width: 1.5 });
      px = nx; py = ny;
    }
    return computeMetrics(segments);
  }

  function computeMetrics(segments) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let drawDist = 0;
    let rapidDist = 0;
    let drawCount = 0;
    let lastX = null;
    let lastY = null;
    for (const s of segments) {
      const d = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
      if (s.is_draw !== false) {
        drawCount++;
        drawDist += d;
        if (lastX !== null) {
          const jump = Math.hypot(s.x1 - lastX, s.y1 - lastY);
          if (jump > 0.05) rapidDist += jump;
        }
        lastX = s.x2;
        lastY = s.y2;
        minX = Math.min(minX, s.x1, s.x2);
        maxX = Math.max(maxX, s.x1, s.x2);
        minY = Math.min(minY, s.y1, s.y2);
        maxY = Math.max(maxY, s.y1, s.y2);
      }
    }
    if (!Number.isFinite(minX)) {
      minX = -100; maxX = 100; minY = -100; maxY = 100;
    }
    const width = Math.max(10, maxX - minX);
    const height = Math.max(10, maxY - minY);
    return {
      segments,
      dots: [],
      polygons: [],
      bounds: { minX, maxX, minY, maxY, width, height },
      stats: {
        totalSegments: segments.length,
        drawSegments: drawCount,
        drawDistance: Number(drawDist.toFixed(2)),
        rapidTravel: Number(rapidDist.toFixed(2)),
        width: Number(width.toFixed(1)),
        height: Number(height.toFixed(1)),
      },
    };
  }

  // Genuine Nearest-Neighbor + 2-Opt TSP Air-Travel Optimizer
  function optimizeToolpath2Opt(segments, maxPasses = 40) {
    const drawSegs = segments.filter((s) => s.is_draw !== false);
    if (drawSegs.length === 0) {
      return {
        segments: [],
        airMovesBefore: [],
        airMovesAfter: [],
        report: {
          polylines: 0,
          drawDistance: 0,
          initialAirTravel: 0,
          optimizedAirTravel: 0,
          savedMm: 0,
          reductionPercent: 0,
        },
      };
    }

    // 1. Chain contiguous draw segments into polylines
    const polylines = [];
    let current = [drawSegs[0]];
    for (let i = 1; i < drawSegs.length; i++) {
      const prev = current[current.length - 1];
      const cur = drawSegs[i];
      if (Math.hypot(cur.x1 - prev.x2, cur.y1 - prev.y2) < 0.05) {
        current.push(cur);
      } else {
        polylines.push(current);
        current = [cur];
      }
    }
    polylines.push(current);

    const startOf = (pl) => ({ x: pl[0].x1, y: pl[0].y1 });
    const endOf = (pl) => ({ x: pl[pl.length - 1].x2, y: pl[pl.length - 1].y2 });
    const reversePl = (pl) => pl.slice().reverse().map((s) => ({ ...s, x1: s.x2, y1: s.y2, x2: s.x1, y2: s.y1 }));
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

    function measureOrder(order) {
      let air = 0;
      const moves = [];
      let pos = { x: 0, y: 0 };
      for (const pl of order) {
        const s = startOf(pl);
        const d = dist(pos, s);
        if (d > 0.05) {
          air += d;
          moves.push({ x1: pos.x, y1: pos.y, x2: s.x, y2: s.y });
        }
        pos = endOf(pl);
      }
      return { air, moves };
    }

    const before = measureOrder(polylines);
    const drawDist = drawSegs.reduce((acc, s) => acc + Math.hypot(s.x2 - s.x1, s.y2 - s.y1), 0);

    if (polylines.length <= 1) {
      return {
        segments: drawSegs,
        airMovesBefore: before.moves,
        airMovesAfter: before.moves,
        report: {
          polylines: polylines.length,
          drawDistance: Number(drawDist.toFixed(2)),
          initialAirTravel: Number(before.air.toFixed(2)),
          optimizedAirTravel: Number(before.air.toFixed(2)),
          savedMm: 0,
          reductionPercent: 0,
        },
      };
    }

    // 2. Greedy Nearest-Neighbor with bidirectional polyline orientation
    const remaining = polylines.map((pl, idx) => ({ pl, idx }));
    const ordered = [];
    let curPos = { x: 0, y: 0 };
    while (remaining.length > 0) {
      let bestI = 0;
      let bestRev = false;
      let bestD = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const dF = dist(curPos, startOf(remaining[i].pl));
        const dR = dist(curPos, endOf(remaining[i].pl));
        if (dF < bestD) { bestD = dF; bestI = i; bestRev = false; }
        if (dR < bestD) { bestD = dR; bestI = i; bestRev = true; }
      }
      const chosen = remaining.splice(bestI, 1)[0].pl;
      const oriented = bestRev ? reversePl(chosen) : chosen;
      ordered.push(oriented);
      curPos = endOf(oriented);
    }

    // 3. 2-Opt local search refinement (cap O(n^2) cleanly for large drawings)
    const n = ordered.length;
    if (n >= 3 && n <= 450) {
      let improved = true;
      let pass = 0;
      while (improved && pass < maxPasses) {
        improved = false;
        pass++;
        for (let i = 0; i < n - 1; i++) {
          for (let j = i + 1; j < n; j++) {
            const prevPt = i === 0 ? { x: 0, y: 0 } : endOf(ordered[i - 1]);
            const nextPt = j + 1 < n ? startOf(ordered[j + 1]) : null;
            const curCost = dist(prevPt, startOf(ordered[i])) + (nextPt ? dist(endOf(ordered[j]), nextPt) : 0);
            const newCost = dist(prevPt, endOf(ordered[j])) + (nextPt ? dist(startOf(ordered[i]), nextPt) : 0);
            if (newCost + 1e-4 < curCost) {
              const slice = ordered.slice(i, j + 1).reverse().map(reversePl);
              ordered.splice(i, j - i + 1, ...slice);
              improved = true;
            }
          }
        }
      }
    }

    const after = measureOrder(ordered);
    const optSegs = [];
    for (let i = 0; i < ordered.length; i++) {
      if (i > 0) {
        const pEnd = endOf(ordered[i - 1]);
        const nStart = startOf(ordered[i]);
        if (dist(pEnd, nStart) > 0.05) {
          optSegs.push({ x1: pEnd.x, y1: pEnd.y, x2: nStart.x, y2: nStart.y, is_draw: false, color: '#F59E0B', width: 1 });
        }
      }
      for (const s of ordered[i]) optSegs.push(s);
    }

    const saved = Math.max(0, before.air - after.air);
    const reduction = before.air > 0.01 ? (saved / before.air) * 100 : 0;

    return {
      segments: optSegs,
      airMovesBefore: before.moves,
      airMovesAfter: after.moves,
      report: {
        polylines: polylines.length,
        drawDistance: Number(drawDist.toFixed(2)),
        initialAirTravel: Number(before.air.toFixed(2)),
        optimizedAirTravel: Number(after.air.toFixed(2)),
        savedMm: Number(saved.toFixed(2)),
        reductionPercent: Number(reduction.toFixed(1)),
      },
    };
  }

  // Auto-Fit 200mm Bed G-Code Exporter with STRICT pen-up (G0) gating
  function exportGCode(segments, opts = {}) {
    const bedW = Math.max(20, Number(opts.bedWidth ?? 200));
    const bedH = Math.max(20, Number(opts.bedHeight ?? 200));
    const margin = Number(opts.margin ?? 10);
    const feedDraw = Number(opts.feedDraw ?? 1200);
    const feedTravel = Number(opts.feedTravel ?? 3000);
    const zUp = Number(opts.zUp ?? 5.0);
    const zDown = Number(opts.zDown ?? 0.0);
    const laserMode = Boolean(opts.laserMode);
    const title = String(opts.title || 'Cyber Turtle Vector Plot');

    const drawSegs = segments.filter((s) => s.is_draw !== false);
    const lines = [
      `; Cyber Turtle Studio v${VERSION} — Auto-Fit CNC G-Code`,
      `; Title: ${title} | Draw Segments: ${drawSegs.length}`,
      'G21 ; Metric millimeters',
      'G90 ; Absolute positioning',
      'G17 ; XY plane',
      laserMode ? 'M5 ; Laser off' : `G0 Z${zUp.toFixed(3)} F${feedTravel} ; Pen up`,
    ];

    if (drawSegs.length === 0) {
      lines.push('G0 X0.000 Y0.000 ; Origin', 'M2 ; Program end');
      return lines.join('\n');
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const s of drawSegs) {
      minX = Math.min(minX, s.x1, s.x2);
      maxX = Math.max(maxX, s.x1, s.x2);
      minY = Math.min(minY, s.y1, s.y2);
      maxY = Math.max(maxY, s.y1, s.y2);
    }
    const spanX = Math.max(1e-3, maxX - minX);
    const spanY = Math.max(1e-3, maxY - minY);
    const usableW = Math.max(10, bedW - margin * 2);
    const usableH = Math.max(10, bedH - margin * 2);
    const scale = Math.min(usableW / spanX, usableH / spanY);
    const offsetX = (bedW - spanX * scale) / 2 - minX * scale;
    const offsetY = (bedH - spanY * scale) / 2 - minY * scale;

    const mapPt = (px, py) => ({
      x: Math.max(0, Math.min(bedW, px * scale + offsetX)),
      y: Math.max(0, Math.min(bedH, py * scale + offsetY)),
    });

    let penDown = false;
    let lastX = null;
    let lastY = null;

    for (const s of segments) {
      const p1 = mapPt(s.x1, s.y1);
      const p2 = mapPt(s.x2, s.y2);

      // Strict pen-up gating: travel segments NEVER emit G1 cuts
      if (s.is_draw === false) {
        if (penDown) {
          lines.push(laserMode ? 'M5 ; Laser off' : `G0 Z${zUp.toFixed(3)} ; Pen up`);
          penDown = false;
        }
        lines.push(`G0 X${p2.x.toFixed(3)} Y${p2.y.toFixed(3)} F${feedTravel} ; Rapid travel`);
        lastX = p2.x;
        lastY = p2.y;
        continue;
      }

      if (lastX === null || Math.hypot(p1.x - lastX, p1.y - lastY) > 0.05) {
        if (penDown) {
          lines.push(laserMode ? 'M5 ; Laser off' : `G0 Z${zUp.toFixed(3)} ; Pen up`);
          penDown = false;
        }
        lines.push(`G0 X${p1.x.toFixed(3)} Y${p1.y.toFixed(3)} F${feedTravel} ; Rapid to start`);
      }

      if (!penDown) {
        lines.push(laserMode ? 'M3 S255 ; Laser on' : `G1 Z${zDown.toFixed(3)} F600 ; Pen down`);
        penDown = true;
      }
      lines.push(`G1 X${p2.x.toFixed(3)} Y${p2.y.toFixed(3)} F${feedDraw}`);
      lastX = p2.x;
      lastY = p2.y;
    }

    if (penDown) {
      lines.push(laserMode ? 'M5 ; Laser off' : `G0 Z${zUp.toFixed(3)} ; Pen up`);
    }
    lines.push('G0 X0.000 Y0.000 ; Return home', 'M2 ; Program end');
    return lines.join('\n');
  }

  // Real 2x4 Sub-Pixel Unicode U+2800 Braille Rasterizer (Bresenham)
  function rasterizeBraille(segments, charW = 56, charH = 22) {
    const drawSegs = segments.filter((s) => s.is_draw !== false);
    if (drawSegs.length === 0) return '[Empty Vector Canvas]';
    const W = Math.max(12, Math.min(120, Math.floor(charW)));
    const H = Math.max(6, Math.min(60, Math.floor(charH)));
    const pixW = W * 2;
    const pixH = H * 4;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const s of drawSegs) {
      minX = Math.min(minX, s.x1, s.x2);
      maxX = Math.max(maxX, s.x1, s.x2);
      minY = Math.min(minY, s.y1, s.y2);
      maxY = Math.max(maxY, s.y1, s.y2);
    }
    const spanX = Math.max(1e-3, maxX - minX);
    const spanY = Math.max(1e-3, maxY - minY);
    const scale = Math.min((pixW - 4) / spanX, (pixH - 4) / spanY);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const ox = pixW / 2 - cx * scale;
    const oy = pixH / 2 - cy * scale;

    const bits = Array.from({ length: H }, () => new Uint8Array(W));
    const DOT_MASK = [
      [0x01, 0x08],
      [0x02, 0x10],
      [0x04, 0x20],
      [0x40, 0x80],
    ];

    function plot(px, py) {
      if (px < 0 || px >= pixW || py < 0 || py >= pixH) return;
      const cxIdx = px >> 1;
      const cyIdx = py >> 2;
      bits[cyIdx][cxIdx] |= DOT_MASK[py & 3][px & 1];
    }

    function line(x0, y0, x1, y1) {
      let dx = Math.abs(x1 - x0);
      let dy = Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let err = dx - dy;
      while (true) {
        plot(x0, y0);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
      }
    }

    for (const s of drawSegs) {
      const gx0 = Math.round(s.x1 * scale + ox);
      const gy0 = Math.round(pixH - 1 - (s.y1 * scale + oy));
      const gx1 = Math.round(s.x2 * scale + ox);
      const gy1 = Math.round(pixH - 1 - (s.y2 * scale + oy));
      line(gx0, gy0, gx1, gy1);
    }

    const rows = [];
    for (let r = 0; r < H; r++) {
      let rowStr = '';
      for (let c = 0; c < W; c++) {
        rowStr += bits[r][c] ? String.fromCharCode(0x2800 | bits[r][c]) : ' ';
      }
      rows.push(rowStr);
    }
    return rows.join('\n');
  }

  function exportSvgString(result, opts = {}) {
    const isLight = Boolean(opts.lightMode);
    const bg = sanitizeSvgColor(opts.background || (isLight ? '#FAF8F3' : '#08080B'), '#08080B');
    const defaultStroke = sanitizeSvgColor(opts.stroke || (isLight ? '#0F172A' : '#10B981'), '#10B981');
    const pad = Number(opts.padding ?? 24);
    const b = result.bounds || { minX: -100, maxX: 100, minY: -100, maxY: 100, width: 200, height: 200 };
    const vx = b.minX - pad;
    const vy = -(b.maxY + pad);
    const vw = Math.max(20, b.width + pad * 2);
    const vh = Math.max(20, b.height + pad * 2);
    const animated = Boolean(opts.animated);
    const title = escapeXml(opts.title || 'Cyber Turtle Vector Synthesis');

    const paths = [];
    const drawSegs = (result.segments || []).filter((s) => s.is_draw !== false);
    if (drawSegs.length > 0) {
      let d = '';
      let curCol = sanitizeSvgColor(opts.overrideColor || drawSegs[0].color, defaultStroke);
      let curW = Number(drawSegs[0].width) || 1.5;
      const flush = () => {
        if (!d) return;
        const cls = animated ? ' class="ct-anim"' : '';
        paths.push(`  <path d="${d.trim()}" fill="none" stroke="${curCol}" stroke-width="${curW.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"${cls} />`);
        d = '';
      };
      for (const s of drawSegs) {
        const sc = sanitizeSvgColor(opts.overrideColor || s.color, defaultStroke);
        const sw = Number(s.width) || 1.5;
        if (sc !== curCol || Math.abs(sw - curW) > 0.05) {
          flush();
          curCol = sc;
          curW = sw;
        }
        d += `M ${s.x1.toFixed(2)} ${(-s.y1).toFixed(2)} L ${s.x2.toFixed(2)} ${(-s.y2).toFixed(2)} `;
      }
      flush();
    }

    if (opts.airMoves && Array.isArray(opts.airMoves) && opts.airMoves.length > 0) {
      const airD = opts.airMoves
        .map((m) => `M ${m.x1.toFixed(2)} ${(-m.y1).toFixed(2)} L ${m.x2.toFixed(2)} ${(-m.y2).toFixed(2)}`)
        .join(' ');
      const airCol = sanitizeSvgColor(opts.airColor || '#F59E0B', '#F59E0B');
      paths.push(`  <path d="${airD}" fill="none" stroke="${airCol}" stroke-width="1.1" stroke-dasharray="4 4" stroke-opacity="0.72" />`);
    }

    const animStyle = animated
      ? '<style>.ct-anim{stroke-dasharray:1;stroke-dashoffset:1;pathLength:1;animation:ctDraw 4s ease-in-out infinite}@keyframes ctDraw{0%{stroke-dashoffset:1}75%{stroke-dashoffset:0}100%{stroke-dashoffset:0}}</style>'
      : '';

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx.toFixed(2)} ${vy.toFixed(2)} ${vw.toFixed(2)} ${vh.toFixed(2)}" width="900" height="900">`,
      `  <title>${title}</title>`,
      animStyle ? `  ${animStyle}` : '',
      `  <rect x="${vx.toFixed(2)}" y="${vy.toFixed(2)}" width="${vw.toFixed(2)}" height="${vh.toFixed(2)}" fill="${bg}" />`,
      ...paths,
      '</svg>',
    ].filter(Boolean).join('\n');
  }

  return {
    VERSION,
    MAX_REPEAT,
    MAX_STEPS,
    MAX_RECURSION_DEPTH,
    MAX_CIRCLE_STEPS,
    MAX_ITERATIONS,
    MAX_SYMBOLS,
    MAX_GRID_DIM,
    PRESETS,
    LOGO_SAMPLES,
    sanitizeSvgColor,
    escapeXml,
    expandLSystem,
    interpretLSystem,
    executeLogo,
    generateTruchet,
    generateMaze,
    generateSpirograph,
    computeMetrics,
    optimizeToolpath2Opt,
    exportGCode,
    rasterizeBraille,
    exportSvgString,
  };
});
