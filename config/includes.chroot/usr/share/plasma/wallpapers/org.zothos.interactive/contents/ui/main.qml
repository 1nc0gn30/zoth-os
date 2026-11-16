import QtQuick
import org.kde.plasma.plasmoid
import "Character3DData.js" as Character3DData

WallpaperItem {
    id: root

    // ── 1. Active Reality Mode & Smooth Reality-Shift State ─────────────────
    property string currentMode: "gold"
    property string prevMode: "gold"
    property real modeMorph: 1.0          // 0..1 transition progress (1.0 = settled)
    property double modeSwitchMs: 0
    property double lastModePollTime: 0
    property bool backdropDirty: true
    property var cachedPalettes: ({})

    // ── 2. Cursor & Physics State ───────────────────────────────────────────
    property real rawMouseX: 960
    property real rawMouseY: 540
    property real smoothMouseX: 960
    property real smoothMouseY: 540
    property real trailMouseX: 960
    property real trailMouseY: 540
    property real prevSmoothX: 960
    property real prevSmoothY: 540
    property real cursorVx: 0.0
    property real cursorVy: 0.0
    property real cursorSpeed: 0.0
    property real cursorActivity: 0.25
    property double lastLocalMouseTime: 0
    property double lastFrameTime: 0
    property bool xhrInFlight: false

    // ── 3. Master Clocks & Choreography Phases ──────────────────────────────
    property real worldTime: 0.0
    property real sheenWave: -0.35
    property real veinPulse: 0.0

    // ── 4. 1nc0gn30 3D Volumetric Pose State ────────────────────────────────
    readonly property var poseCycleOrder: ["hero", "type", "threeQuarter", "front", "hero", "side"]
    property int poseCycleIdx: 0
    property string activePose: "hero"
    property string prevPose: "hero"
    property real poseMorph: 1.0
    property double lastPoseSwitchMs: 0
    property double lastSprintMs: 0
    property int walkDir: -1
    property int displayYawDeg: 348
    property int frameTickCount: 0

    // ── 5. Pre-Allocated Geometry & Particle Pools (Zero GC Churn) ──────────
    property var zRelicGeo: null
    property var latticeGeo: null
    property var wordmarkCells: []
    property var wordmarkEmbers: []
    property var shockwaves: []
    property var cometTrail: []
    property var ambientSparks: []
    property var matrixColumns: []
    property var geodesicMesh: null
    property var charProjPool: []
    property var depthBuckets: []
    property var depthCounts: []
    property var wmSubBatches: [[], [], []]
    property var wmFrameBatch: []
    property var wmTextBatches: [[], [], []]
    property var charRectBatches: [[], [], [], [], [], []]
    property var charGlyphBatches: [[], [], [], [], [], []]
    property var charBrailleBatches: [[], [], [], [], [], []]

    readonly property var bayer8: [
         0/64, 32/64,  8/64, 40/64,  2/64, 34/64, 10/64, 42/64,
        48/64, 16/64, 56/64, 24/64, 50/64, 18/64, 58/64, 26/64,
        12/64, 44/64,  4/64, 36/64, 14/64, 46/64,  6/64, 38/64,
        60/64, 28/64, 52/64, 20/64, 62/64, 30/64, 54/64, 22/64,
         3/64, 35/64, 11/64, 43/64,  1/64, 33/64,  9/64, 41/64,
        51/64, 19/64, 59/64, 27/64, 49/64, 17/64, 57/64, 25/64,
        15/64, 47/64,  7/64, 39/64, 13/64, 45/64,  5/64, 37/64,
        63/64, 31/64, 55/64, 23/64, 61/64, 29/64, 53/64, 21/64
    ]

    readonly property var hermeticSigils: ["☿", "☉", "☽", "◈", "✦", "❖", "⊕", "⊗"]
    readonly property var matrixGlyphs: ["⣿", "⠿", "⠇", "⠋", "0", "1", "λ", "Ψ", "Ξ", "#", "*", "∴", "◈", "◎", "7", "9"]
    readonly property var brailleShimmer: ["⣿", "⣾", "⣽", "⣻", "⢿", "⠿", "⠇", "⠋", "∴"]

    // ── 6. 4 Radically Distinct Mode Palettes & Metadata ────────────────────
    readonly property var modeProfiles: ({
        "gold": {
            id: "gold",
            label: "SOVEREIGN 24K SANCTUM  ·  AZOTH PRIME [☿]  ·  U+2800 HERMETIC LATTICE",
            charTag: "1NC0GN30 // 24K SENTINEL RIG",
            bgTop: [4, 3, 2],
            bgMid: [17, 11, 3],
            bgBot: [5, 3, 1],
            nebulaA: [212, 165, 36],
            nebulaB: [44, 182, 125],
            primary: [245, 197, 66],
            secondary: [212, 148, 26],
            specular: [255, 240, 178],
            shadow: [38, 24, 5],
            accent: [44, 182, 125],
            charHigh: [255, 224, 112],
            charMid: [218, 164, 38],
            charLow: [92, 64, 14],
            charRim: [64, 224, 152],
            facetLUT: ["#1a1103", "#362306", "#61400b", "#966510", "#c9901c", "#ebb42e", "#f7ce46", "#ffea99"]
        },
        "ghost": {
            id: "ghost",
            label: "NULLAI GHOSTMODE STEALTH  ·  GHOSTBYTE [◈]  ·  TOR GEODESIC ENCLAVE",
            charTag: "1NC0GN30 // PHANTOM PHASE RIG",
            bgTop: [3, 4, 9],
            bgMid: [18, 4, 11],
            bgBot: [4, 5, 10],
            nebulaA: [255, 38, 82],
            nebulaB: [124, 92, 255],
            primary: [255, 48, 88],
            secondary: [168, 18, 52],
            specular: [255, 224, 235],
            shadow: [24, 6, 14],
            accent: [138, 104, 255],
            charHigh: [255, 190, 208],
            charMid: [235, 42, 82],
            charLow: [64, 12, 28],
            charRim: [152, 118, 255],
            facetLUT: ["#11040a", "#240713", "#470c22", "#7a1236", "#b51b4b", "#eb2a62", "#ff789e", "#fff0f5"]
        },
        "matrix": {
            id: "matrix",
            label: "HERMETIC MATRIX P39  ·  LUCY NETRUNNER [λ]  ·  STDP AXON LATTICE",
            charTag: "1NC0GN30 // DEEP-NET ORACLE RIG",
            bgTop: [1, 6, 3],
            bgMid: [4, 20, 11],
            bgBot: [1, 5, 2],
            nebulaA: [0, 255, 148],
            nebulaB: [0, 196, 255],
            primary: [0, 255, 157],
            secondary: [0, 168, 96],
            specular: [224, 255, 242],
            shadow: [3, 28, 15],
            accent: [56, 232, 255],
            charHigh: [212, 255, 236],
            charMid: [0, 238, 142],
            charLow: [6, 62, 34],
            charRim: [92, 242, 255],
            facetLUT: ["#021209", "#052614", "#094725", "#0e753d", "#12ab59", "#18de76", "#7dffb8", "#ecfff5"]
        },
        "incognito": {
            id: "incognito",
            label: "FLUENT EXECUTIVE ARCHITECTURE  ·  CHAMELEON 11  ·  CRYSTALLINE BLOOM",
            charTag: "1NC0GN30 // FLUENT POINT-CLOUD",
            bgTop: [5, 11, 24],
            bgMid: [12, 30, 62],
            bgBot: [6, 13, 28],
            nebulaA: [43, 136, 255],
            nebulaB: [92, 225, 255],
            primary: [72, 168, 255],
            secondary: [30, 104, 212],
            specular: [240, 248, 255],
            shadow: [8, 22, 48],
            accent: [108, 232, 255],
            charHigh: [238, 247, 255],
            charMid: [88, 182, 255],
            charLow: [18, 52, 98],
            charRim: [132, 238, 255],
            facetLUT: ["#07142b", "#0d254d", "#163f7d", "#2160b5", "#3285eb", "#5ca8ff", "#a6d4ff", "#f5faff"]
        }
    })

    function normalizeMode(raw) {
        if (!raw) return "gold";
        var s = String(raw).trim().toLowerCase();
        if (s === "ghost" || s === "ghostmode" || s === "stealth" || s === "amnesic") return "ghost";
        if (s === "matrix" || s === "hacker" || s === "green") return "matrix";
        if (s === "incognito" || s === "win11" || s === "windows" || s === "fluent" || s === "undercover") return "incognito";
        return "gold";
    }

    function applyModeSwitch(nextRaw) {
        var next = normalizeMode(nextRaw);
        if (next !== root.currentMode) {
            root.prevMode = root.currentMode;
            root.currentMode = next;
            root.modeMorph = 0.0;
            root.modeSwitchMs = Date.now();
            root.backdropDirty = true;
            root.cursorActivity = 0.35;
            var cx = root.width > 0 ? root.width * 0.475 : 912;
            var cy = root.height > 0 ? root.height * 0.452 : 488;
            root.spawnShockwave(cx, cy, 1.15);
            backdropCanvas.requestPaint();
        }
    }

    onWidthChanged: {
        root.backdropDirty = true;
    }

    onHeightChanged: {
        root.backdropDirty = true;
    }

    Connections {
        target: root.configuration
        ignoreUnknownSignals: true
        function onRealityModeChanged() {
            if (root.configuration && root.configuration.realityMode) {
                root.applyModeSwitch(root.configuration.realityMode);
            }
        }
    }

    function switchCharPose(nextPose) {
        if (nextPose === root.activePose) return;
        root.prevPose = root.activePose;
        root.activePose = nextPose;
        root.poseMorph = 0.0;
        root.lastPoseSwitchMs = Date.now();
    }

    function spawnShockwave(wx, wy, strength) {
        var pool = root.shockwaves;
        if (!pool || pool.length === 0) return;
        var best = pool[0];
        for (var i = 0; i < pool.length; i++) {
            if (pool[i].life <= 0.01) {
                best = pool[i];
                break;
            }
            if (pool[i].life < best.life) best = pool[i];
        }
        best.x = wx;
        best.y = wy;
        best.life = 1.0;
        best.strength = strength || 1.0;
    }

    function rgbaArr(rgb, a) {
        var alpha = a < 0 ? 0 : (a > 1 ? 1 : a);
        return "rgba(" + (rgb[0] | 0) + "," + (rgb[1] | 0) + "," + (rgb[2] | 0) + "," + alpha.toFixed(3) + ")";
    }

    function mixRgb(a, b, t) {
        var u = 1.0 - t;
        return [
            (a[0] * u + b[0] * t) | 0,
            (a[1] * u + b[1] * t) | 0,
            (a[2] * u + b[2] * t) | 0
        ];
    }

    function buildPaletteStrings(p) {
        return {
            id: p.id,
            label: p.label,
            charTag: p.charTag,
            bgTop: p.bgTop,
            bgMid: p.bgMid,
            bgBot: p.bgBot,
            nebulaA: p.nebulaA,
            nebulaB: p.nebulaB,
            primary: p.primary,
            secondary: p.secondary,
            specular: p.specular,
            shadow: p.shadow,
            accent: p.accent,
            charHigh: p.charHigh,
            charMid: p.charMid,
            charLow: p.charLow,
            charRim: p.charRim,
            facetLUT: p.facetLUT,
            cssPrimary: root.rgbaArr(p.primary, 1.0),
            cssSecondary: root.rgbaArr(p.secondary, 1.0),
            cssSpecular: root.rgbaArr(p.specular, 1.0),
            cssAccent: root.rgbaArr(p.accent, 1.0),
            cssShadow90: root.rgbaArr(p.shadow, 0.90),
            pri08: root.rgbaArr(p.primary, 0.08),
            pri14: root.rgbaArr(p.primary, 0.14),
            pri20: root.rgbaArr(p.primary, 0.20),
            pri28: root.rgbaArr(p.primary, 0.28),
            pri36: root.rgbaArr(p.primary, 0.36),
            pri44: root.rgbaArr(p.primary, 0.44),
            pri55: root.rgbaArr(p.primary, 0.55),
            pri72: root.rgbaArr(p.primary, 0.72),
            pri86: root.rgbaArr(p.primary, 0.86),
            sec76: root.rgbaArr(p.secondary, 0.76),
            acc14: root.rgbaArr(p.accent, 0.14),
            acc22: root.rgbaArr(p.accent, 0.22),
            acc28: root.rgbaArr(p.accent, 0.28),
            acc36: root.rgbaArr(p.accent, 0.36),
            acc56: root.rgbaArr(p.accent, 0.56),
            acc74: root.rgbaArr(p.accent, 0.74),
            acc86: root.rgbaArr(p.accent, 0.86),
            spec55: root.rgbaArr(p.specular, 0.55),
            spec75: root.rgbaArr(p.specular, 0.75),
            spec88: root.rgbaArr(p.specular, 0.88),
            spec95: root.rgbaArr(p.specular, 0.95),
            rim22: root.rgbaArr(p.charRim, 0.22),
            rim70: root.rgbaArr(p.charRim, 0.70),
            bgVoid38: root.rgbaArr(p.bgTop, 0.38),
            charSubLUT: [
                root.rgbaArr(p.charLow, 0.34),
                root.rgbaArr(p.charMid, 0.44),
                root.rgbaArr(p.charHigh, 0.54),
                root.rgbaArr(p.primary, 0.58)
            ],
            charGlyphLUT: [
                root.rgbaArr(p.charLow, 0.68),
                root.rgbaArr(p.charMid, 0.80),
                root.rgbaArr(p.charHigh, 0.90),
                root.rgbaArr(p.primary, 0.92),
                root.rgbaArr(p.specular, 0.96)
            ]
        };
    }

    function buildActivePalette() {
        var cached = root.cachedPalettes[root.currentMode];
        if (root.modeMorph >= 0.999 && cached) return cached;
        var cur = cached || root.buildPaletteStrings(root.modeProfiles[root.currentMode] || root.modeProfiles["gold"]);
        if (root.modeMorph >= 0.999) {
            root.cachedPalettes[root.currentMode] = cur;
            return cur;
        }
        var prv = root.cachedPalettes[root.prevMode] || root.modeProfiles[root.prevMode] || cur;
        var e = root.modeMorph * root.modeMorph * (3.0 - 2.0 * root.modeMorph);
        return root.buildPaletteStrings({
            id: cur.id,
            label: cur.label,
            charTag: cur.charTag,
            bgTop: mixRgb(prv.bgTop, cur.bgTop, e),
            bgMid: mixRgb(prv.bgMid, cur.bgMid, e),
            bgBot: mixRgb(prv.bgBot, cur.bgBot, e),
            nebulaA: mixRgb(prv.nebulaA, cur.nebulaA, e),
            nebulaB: mixRgb(prv.nebulaB, cur.nebulaB, e),
            primary: mixRgb(prv.primary, cur.primary, e),
            secondary: mixRgb(prv.secondary, cur.secondary, e),
            specular: mixRgb(prv.specular, cur.specular, e),
            shadow: mixRgb(prv.shadow, cur.shadow, e),
            accent: mixRgb(prv.accent, cur.accent, e),
            charHigh: mixRgb(prv.charHigh, cur.charHigh, e),
            charMid: mixRgb(prv.charMid, cur.charMid, e),
            charLow: mixRgb(prv.charLow, cur.charLow, e),
            charRim: mixRgb(prv.charRim, cur.charRim, e),
            facetLUT: e > 0.18 ? cur.facetLUT : prv.facetLUT
        });
    }

    // Helper for perspective-scaled ellipses without distorting stroke width
    function strokeEllipse(ctx, cx, cy, rx, ry, rot, a0, a1) {
        if (rx <= 0.5 || ry <= 0.5) return;
        ctx.save();
        ctx.translate(cx, cy);
        if (rot) ctx.rotate(rot);
        ctx.scale(rx, ry);
        ctx.beginPath();
        ctx.arc(0, 0, 1.0, a0, a1, false);
        ctx.restore();
        ctx.stroke();
    }

    function fillEllipse(ctx, cx, cy, rx, ry) {
        if (rx <= 0.5 || ry <= 0.5) return;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(rx, ry);
        ctx.beginPath();
        ctx.arc(0, 0, 1.0, 0, Math.PI * 2.0, false);
        ctx.restore();
        ctx.fill();
    }

    // Zero-FreeType procedural U+2800 2x4 Braille sub-pixel dot cluster batcher
    function pushBraille(arr, cnt, cx, cy, dotSz, dx, dy, mask) {
        var x0 = cx - dx - dotSz * 0.5, x1 = cx + dx - dotSz * 0.5;
        var y0 = cy - dy * 1.5 - dotSz * 0.5, y1 = cy - dy * 0.5 - dotSz * 0.5;
        var y2 = cy + dy * 0.5 - dotSz * 0.5, y3 = cy + dy * 1.5 - dotSz * 0.5;
        if (mask & 1)   { arr[cnt++] = x0; arr[cnt++] = y0; arr[cnt++] = dotSz; arr[cnt++] = dotSz; }
        if (mask & 2)   { arr[cnt++] = x0; arr[cnt++] = y1; arr[cnt++] = dotSz; arr[cnt++] = dotSz; }
        if (mask & 4)   { arr[cnt++] = x0; arr[cnt++] = y2; arr[cnt++] = dotSz; arr[cnt++] = dotSz; }
        if (mask & 8)   { arr[cnt++] = x1; arr[cnt++] = y0; arr[cnt++] = dotSz; arr[cnt++] = dotSz; }
        if (mask & 16)  { arr[cnt++] = x1; arr[cnt++] = y1; arr[cnt++] = dotSz; arr[cnt++] = dotSz; }
        if (mask & 32)  { arr[cnt++] = x1; arr[cnt++] = y2; arr[cnt++] = dotSz; arr[cnt++] = dotSz; }
        if (mask & 64)  { arr[cnt++] = x0; arr[cnt++] = y3; arr[cnt++] = dotSz; arr[cnt++] = dotSz; }
        if (mask & 128) { arr[cnt++] = x1; arr[cnt++] = y3; arr[cnt++] = dotSz; arr[cnt++] = dotSz; }
        return cnt;
    }

    // Batched procedural 4-point Hermetic diamond + crosshair inside an active path
    function strokeSigilDiamond(ctx, cx, cy, r) {
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r, cy);
        ctx.lineTo(cx, cy + r);
        ctx.lineTo(cx - r, cy);
        ctx.lineTo(cx, cy - r);
        ctx.moveTo(cx - r * 0.55, cy);
        ctx.lineTo(cx + r * 0.55, cy);
        ctx.moveTo(cx, cy - r * 0.55);
        ctx.lineTo(cx, cy + r * 0.55);
    }

    // Zero-FreeType directional ASCII contour vector micro-stroke batcher
    function pushStroke(arr, cnt, cx, cy, hr, ac) {
        if (ac === 1) {
            arr[cnt++] = cx - hr; arr[cnt++] = cy + hr; arr[cnt++] = cx + hr; arr[cnt++] = cy - hr;
        } else if (ac === 2) {
            arr[cnt++] = cx - hr; arr[cnt++] = cy - hr; arr[cnt++] = cx + hr; arr[cnt++] = cy + hr;
        } else if (ac === 3) {
            arr[cnt++] = cx; arr[cnt++] = cy - hr; arr[cnt++] = cx; arr[cnt++] = cy + hr;
        } else if (ac === 4) {
            arr[cnt++] = cx - hr; arr[cnt++] = cy; arr[cnt++] = cx + hr; arr[cnt++] = cy;
        } else if (ac === 5) {
            arr[cnt++] = cx - hr; arr[cnt++] = cy; arr[cnt++] = cx + hr; arr[cnt++] = cy;
            arr[cnt++] = cx; arr[cnt++] = cy - hr; arr[cnt++] = cx; arr[cnt++] = cy + hr;
        }
        return cnt;
    }

    // ── 7A. Static / Mode-Transition Backdrop Canvas (0 FPS Steady-State) ──
    Canvas {
        id: backdropCanvas
        anchors.fill: parent
        renderTarget: Canvas.Image
        renderStrategy: Canvas.Immediate

        onWidthChanged: root.backdropDirty = true
        onHeightChanged: root.backdropDirty = true

        onPaint: {
            var ctx = getContext("2d");
            if (!ctx) return;
            var W = width;
            var H = height;
            if (W < 64 || H < 64) return;

            var sc = Math.min(W / 1920.0, H / 1080.0);
            var pal = root.buildActivePalette();
            var mode = root.currentMode;

            var centerX = W * 0.475;
            var centerY = H * 0.448;
            var sanctumPedY = H * 0.625;
            var wordmarkY = H * 0.740;
            var charX = W * 0.808;
            var charY = H * 0.555;
            var floorHorizonY = H * 0.585;

            // Full-screen atmospheric void gradient
            var bgGrad = ctx.createLinearGradient(0, 0, 0, H);
            bgGrad.addColorStop(0.0, root.rgbaArr(pal.bgTop, 1.0));
            bgGrad.addColorStop(0.52, root.rgbaArr(pal.bgMid, 1.0));
            bgGrad.addColorStop(1.0, root.rgbaArr(pal.bgBot, 1.0));
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, W, H);

            // Primary Sanctuary Volumetric Glow behind 3D Z
            var sanctumR = 460 * sc;
            var neb1 = ctx.createRadialGradient(centerX, centerY, 12 * sc, centerX, centerY, sanctumR);
            neb1.addColorStop(0.0, root.rgbaArr(pal.nebulaA, 0.22));
            neb1.addColorStop(0.42, root.rgbaArr(pal.secondary, 0.09));
            neb1.addColorStop(1.0, "rgba(0,0,0,0)");
            ctx.fillStyle = neb1;
            ctx.fillRect(centerX - sanctumR, centerY - sanctumR, sanctumR * 2, sanctumR * 2);

            // Secondary Volumetric Aura around 1nc0gn30 Sculpture
            var charAuraR = 340 * sc;
            var neb2 = ctx.createRadialGradient(charX, charY, 10 * sc, charX, charY + 30 * sc, charAuraR);
            neb2.addColorStop(0.0, root.rgbaArr(pal.nebulaB, 0.14));
            neb2.addColorStop(0.55, root.rgbaArr(pal.nebulaA, 0.055));
            neb2.addColorStop(1.0, "rgba(0,0,0,0)");
            ctx.fillStyle = neb2;
            ctx.fillRect(charX - charAuraR, charY - charAuraR, charAuraR * 2, charAuraR * 2);

            // Mode static horizon/floor backdrop
            if (mode === "gold") {
                ctx.lineWidth = 1.0;
                ctx.strokeStyle = root.rgbaArr(pal.primary, 0.09);
                ctx.beginPath();
                for (var ray = -9; ray <= 9; ray++) {
                    var ang = ray * 0.135;
                    var botX = centerX + Math.tan(ang) * (H - floorHorizonY) * 1.55;
                    ctx.moveTo(centerX + Math.sin(ang) * 70 * sc, floorHorizonY + 24 * sc);
                    ctx.lineTo(botX, H);
                }
                ctx.stroke();

                for (var fr = 1; fr <= 4; fr++) {
                    var ringRx = (110 + fr * 88) * sc;
                    var ringRy = ringRx * 0.23;
                    var ringY = H * 0.62 + fr * 34 * sc;
                    ctx.strokeStyle = root.rgbaArr(pal.primary, 0.16 - fr * 0.028);
                    ctx.lineWidth = fr === 2 ? 1.4 : 0.9;
                    root.strokeEllipse(ctx, centerX, ringY, ringRx, ringRy, 0, 0, Math.PI * 2);
                }
            } else if (mode === "matrix") {
                ctx.lineWidth = 0.9;
                ctx.strokeStyle = root.rgbaArr(pal.primary, 0.10);
                ctx.beginPath();
                for (var ax = 0; ax < 7; ax++) {
                    var ay = H * 0.66 + ax * 46 * sc;
                    ctx.moveTo(W * 0.18, ay);
                    ctx.lineTo(W * 0.96, ay);
                }
                ctx.stroke();
            } else if (mode === "incognito") {
                for (var ir = 1; ir <= 3; ir++) {
                    ctx.strokeStyle = root.rgbaArr(pal.accent, 0.14 - ir * 0.03);
                    ctx.lineWidth = 1.0;
                    root.strokeEllipse(ctx, centerX, H * 0.72, (160 + ir * 95) * sc, (34 + ir * 20) * sc, 0, 0, Math.PI * 2);
                }
            }

            // Upward volumetric holo-cone & static outer ellipse of Sanctum pedestal
            var sCone = ctx.createRadialGradient(centerX, sanctumPedY, 8 * sc, centerX, sanctumPedY, 175 * sc);
            sCone.addColorStop(0.0, root.rgbaArr(pal.accent, 0.18));
            sCone.addColorStop(0.5, root.rgbaArr(pal.primary, 0.07));
            sCone.addColorStop(1.0, "rgba(0,0,0,0)");
            ctx.fillStyle = sCone;
            root.fillEllipse(ctx, centerX, sanctumPedY, 175 * sc, 36 * sc);

            ctx.lineWidth = 1.2 * sc;
            ctx.strokeStyle = pal.pri36;
            root.strokeEllipse(ctx, centerX, sanctumPedY, 148 * sc, 28 * sc, 0, 0, Math.PI * 2.0);

            // Baked stationary 3D orbital rings around Center Z (live sigil motes orbit in sceneCanvas)
            if (mode === "gold") {
                ctx.lineWidth = 1.35 * sc;
                ctx.strokeStyle = pal.pri36;
                root.strokeEllipse(ctx, centerX, centerY, 176 * sc, 176 * 0.47 * sc, 0.36, 0, Math.PI * 2.0);
                ctx.strokeStyle = pal.pri28;
                root.strokeEllipse(ctx, centerX, centerY, 154 * sc, 154 * 0.68 * sc, -0.48, 0, Math.PI * 2.0);
            } else if (mode === "ghost") {
                ctx.lineWidth = 1.5 * sc;
                ctx.strokeStyle = pal.pri44;
                root.strokeEllipse(ctx, centerX, centerY, 182 * sc, 182 * 0.42 * sc, -0.28, 0.2, Math.PI - 0.2);
                root.strokeEllipse(ctx, centerX, centerY, 182 * sc, 182 * 0.42 * sc, -0.28, Math.PI + 0.2, Math.PI * 2.0 - 0.2);
                ctx.lineWidth = 1.1 * sc;
                ctx.strokeStyle = pal.acc36;
                root.strokeEllipse(ctx, centerX, centerY, 210 * sc, 210 * 0.68 * sc, 0.34, 0.3, Math.PI - 0.3);
                root.strokeEllipse(ctx, centerX, centerY, 210 * sc, 210 * 0.68 * sc, 0.34, Math.PI + 0.3, Math.PI * 2.0 - 0.3);
            } else if (mode === "incognito") {
                ctx.lineWidth = 1.45 * sc;
                ctx.strokeStyle = pal.acc36;
                root.strokeEllipse(ctx, centerX, centerY, 188 * sc, 188 * 0.36 * sc, 0.24, 0, Math.PI * 2.0);
                ctx.lineWidth = 1.0 * sc;
                ctx.strokeStyle = pal.pri36;
                root.strokeEllipse(ctx, centerX, centerY, 214 * sc, 214 * 0.36 * sc, -0.22, 0, Math.PI * 2.0);
            }

            // Baked 36 Sanctum degree-ring ticks + 4 sigil diamonds + 3 Bezier Ley-Line Bridge rails
            ctx.lineWidth = 1.6 * sc;
            ctx.strokeStyle = pal.pri72;
            ctx.beginPath();
            for (var dkM = 0; dkM < 36; dkM += 3) {
                var dAngM = (dkM / 36.0) * Math.PI * 2.0;
                ctx.moveTo(centerX + Math.cos(dAngM) * 148 * sc * 0.88, sanctumPedY + Math.sin(dAngM) * 28 * sc * 0.88);
                ctx.lineTo(centerX + Math.cos(dAngM) * 148 * sc * 1.06, sanctumPedY + Math.sin(dAngM) * 28 * sc * 1.06);
            }
            ctx.stroke();

            ctx.lineWidth = 0.9 * sc;
            ctx.strokeStyle = pal.pri36;
            ctx.beginPath();
            for (var dkN = 0; dkN < 36; dkN++) {
                if (dkN % 3 === 0) continue;
                var dAngN = (dkN / 36.0) * Math.PI * 2.0;
                ctx.moveTo(centerX + Math.cos(dAngN) * 148 * sc * 0.94, sanctumPedY + Math.sin(dAngN) * 28 * sc * 0.94);
                ctx.lineTo(centerX + Math.cos(dAngN) * 148 * sc * 1.00, sanctumPedY + Math.sin(dAngN) * 28 * sc * 1.00);
            }
            ctx.stroke();

            ctx.lineWidth = 1.1 * sc;
            ctx.strokeStyle = pal.spec75;
            ctx.beginPath();
            for (var dkD = 0; dkD < 36; dkD += 9) {
                var dAngD = (dkD / 36.0) * Math.PI * 2.0;
                root.strokeSigilDiamond(ctx, centerX + Math.cos(dAngD) * 148 * sc * 1.12, sanctumPedY + Math.sin(dAngD) * 28 * sc * 1.12, 3.2 * sc);
            }
            ctx.stroke();

            var pedCharY = H * 0.828;
            for (var br = -1; br <= 1; br++) {
                var yOff = br * 12 * sc;
                ctx.strokeStyle = br === 0 ? pal.pri28 : pal.acc14;
                ctx.lineWidth = br === 0 ? 1.3 * sc : 0.85 * sc;
                ctx.beginPath();
                ctx.moveTo(centerX + 148 * sc, sanctumPedY + yOff);
                ctx.bezierCurveTo(centerX + 275 * sc, sanctumPedY + (36 + br * 12) * sc, charX - 220 * sc, pedCharY - (24 - br * 12) * sc, charX - 118 * sc, pedCharY + yOff * 0.65);
                ctx.stroke();
            }

            // Static cardinal degree labels baked once per mode/resize (0 FPS CPU cost)
            ctx.font = "bold " + Math.max(8, Math.round(9.5 * sc)) + "px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = pal.spec75;
            for (var dkL = 0; dkL < 36; dkL += 9) {
                var dAngL = (dkL / 36.0) * Math.PI * 2.0;
                ctx.fillText(((dkL * 10) % 360) + "°", centerX + Math.cos(dAngL) * 168 * sc, sanctumPedY + Math.sin(dAngL) * 33 * sc);
            }

            // 1nc0gn30 pedestal glow, vertical containment column, and baked pedestal ellipses + 24 compass ticks
            var pedX = charX;
            var pedY = H * 0.828;
            var charScale = 238.0 * sc;
            var figCenterY = pedY - charScale * 0.96;

            var pedGlow = ctx.createRadialGradient(pedX, pedY, 6 * sc, pedX, pedY, 146 * sc);
            pedGlow.addColorStop(0.0, root.rgbaArr(pal.accent, 0.26));
            pedGlow.addColorStop(0.55, root.rgbaArr(pal.primary, 0.10));
            pedGlow.addColorStop(1.0, "rgba(0,0,0,0)");
            ctx.fillStyle = pedGlow;
            root.fillEllipse(ctx, pedX, pedY, 146 * sc, 34 * sc);

            ctx.lineWidth = 1.5 * sc;
            ctx.strokeStyle = pal.pri55;
            root.strokeEllipse(ctx, pedX, pedY, 118 * sc, 26 * sc, 0, 0, Math.PI * 2.0);
            ctx.lineWidth = 1.05 * sc;
            ctx.strokeStyle = pal.acc36;
            root.strokeEllipse(ctx, pedX, pedY, 86 * sc, 19 * sc, 0, 0, Math.PI * 2.0);

            ctx.lineWidth = 1.3 * sc;
            ctx.strokeStyle = pal.spec75;
            ctx.beginPath();
            for (var ptM = 0; ptM < 24; ptM += 3) {
                var taM = (ptM / 24.0) * Math.PI * 2.0;
                if (Math.sin(taM) < 0) continue;
                ctx.moveTo(pedX + Math.cos(taM) * 118 * sc * 0.86, pedY + Math.sin(taM) * 26 * sc * 0.86);
                ctx.lineTo(pedX + Math.cos(taM) * 118 * sc * 1.07, pedY + Math.sin(taM) * 26 * sc * 1.07);
            }
            ctx.stroke();

            ctx.lineWidth = 0.85 * sc;
            ctx.strokeStyle = pal.pri55;
            ctx.beginPath();
            for (var ptN = 0; ptN < 24; ptN++) {
                if (ptN % 3 === 0) continue;
                var taN = (ptN / 24.0) * Math.PI * 2.0;
                if (Math.sin(taN) < 0) continue;
                ctx.moveTo(pedX + Math.cos(taN) * 118 * sc * 0.93, pedY + Math.sin(taN) * 26 * sc * 0.93);
                ctx.lineTo(pedX + Math.cos(taN) * 118 * sc * 1.01, pedY + Math.sin(taN) * 26 * sc * 1.01);
            }
            ctx.stroke();

            var colGrad = ctx.createLinearGradient(pedX, pedY, pedX, figCenterY - charScale * 0.95);
            colGrad.addColorStop(0.0, root.rgbaArr(pal.accent, 0.11));
            colGrad.addColorStop(0.55, root.rgbaArr(pal.primary, 0.03));
            colGrad.addColorStop(1.0, "rgba(0,0,0,0)");
            ctx.fillStyle = colGrad;
            ctx.fillRect(pedX - 78 * sc, figCenterY - charScale * 0.95, 156 * sc, charScale * 1.92);
            ctx.lineWidth = (mode === "ghost" ? 1.55 : 1.25) * sc;
            ctx.strokeStyle = mode === "ghost" ? pal.pri55 : pal.acc56;
            root.strokeEllipse(ctx, pedX, figCenterY + 14 * sc, 128 * sc, 28 * sc, -0.18, 0, Math.PI * 2.0);

            // Static 3D extruded drop-shadow + baked native-resolution base ZOTHOS wordmark (0 FPS steady-state)
            var wmCells = root.wordmarkCells;
            if (wmCells && wmCells.length > 0) {
                var cellSz = 5.1 * sc;
                var totalCols = 69;
                var wmW = totalCols * cellSz;
                var wmH = 11 * cellSz;
                var wmStartX = centerX - wmW * 0.5;
                var wmStartY = wordmarkY - wmH * 0.5;
                var extDx = 2.8 * sc;
                var extDy = 3.4 * sc;

                ctx.fillStyle = pal.cssShadow90;
                for (var wc0 = 0; wc0 < wmCells.length; wc0++) {
                    var c0 = wmCells[wc0];
                    ctx.fillRect(wmStartX + c0.gx * cellSz + extDx, wmStartY + c0.gy * cellSz + extDy, cellSz + 0.6, cellSz + 0.6);
                }

                var bayerB = root.bayer8;
                var subWB = (cellSz - 1.1) * 0.5;
                var rimThkB = Math.max(1.1, 1.35 * sc);
                var asciiRampB = ".:-=+*#%@";
                var sb0 = root.wmSubBatches[0], sc0 = 0;
                var sb1 = root.wmSubBatches[1], sc1 = 0;
                var sb2 = root.wmSubBatches[2], sc2 = 0;
                var fb = root.wmFrameBatch, fbc = 0;
                var tb0 = root.wmTextBatches[0], tc0 = 0;
                var tb1 = root.wmTextBatches[1], tc1 = 0;

                for (var wc1 = 0; wc1 < wmCells.length; wc1++) {
                    var cell = wmCells[wc1];
                    var uNorm = cell.gx / totalCols;
                    var bVal = bayerB[((cell.gy & 7) << 3) | (cell.gx & 7)];
                    if (uNorm >= 0.72 && bVal > 0.48) continue;

                    var dxW = wmStartX + cell.gx * cellSz;
                    var dyW = wmStartY + cell.gy * cellSz;
                    var energy = 0.52 + 0.14 * Math.sin(cell.gx * 0.35);

                    if (energy > bVal * 0.56) {
                        if (energy > bVal) { sb0[sc0++] = dxW + 0.4; sb0[sc0++] = dyW + 0.4; sb0[sc0++] = subWB; sb0[sc0++] = subWB; }
                        if (energy > ((bVal + 0.50) % 1.0) * 0.72) { sb0[sc0++] = dxW + 0.6 + subWB; sb0[sc0++] = dyW + 0.4; sb0[sc0++] = subWB; sb0[sc0++] = subWB; }
                        if (energy > ((bVal + 0.75) % 1.0) * 0.72) { sb1[sc1++] = dxW + 0.4; sb1[sc1++] = dyW + 0.6 + subWB; sb1[sc1++] = subWB; sb1[sc1++] = subWB; }
                        if (energy > ((bVal + 0.25) % 1.0) * 0.72) { sb1[sc1++] = dxW + 0.6 + subWB; sb1[sc1++] = dyW + 0.6 + subWB; sb1[sc1++] = subWB; sb1[sc1++] = subWB; }
                        if (((cell.gx + cell.gy) & 1) === 0) {
                            fb[fbc++] = dxW + 0.35; fb[fbc++] = dyW + 0.35; fb[fbc++] = cellSz - 0.7; fb[fbc++] = cellSz - 0.7;
                        }
                        if (((cell.gx + cell.gy) & 7) === 0) {
                            tb1[tc1++] = dxW + cellSz * 0.5;
                            tb1[tc1++] = dyW + cellSz * 0.54;
                            tb1[tc1++] = asciiRampB[(cell.gx + cell.gy) % 9];
                        }
                    } else {
                        tb0[tc0++] = dxW + cellSz * 0.5;
                        tb0[tc0++] = dyW + cellSz * 0.54;
                        tb0[tc0++] = ((cell.gx + cell.gy) % 3 === 0) ? "⠿" : "⣿";
                    }

                    if (cell.topEdge) { sb2[sc2++] = dxW; sb2[sc2++] = dyW; sb2[sc2++] = cellSz; sb2[sc2++] = rimThkB; }
                    if (cell.leftEdge) { sb2[sc2++] = dxW; sb2[sc2++] = dyW; sb2[sc2++] = rimThkB; sb2[sc2++] = cellSz; }
                }

                if (sc0 > 0) {
                    ctx.fillStyle = pal.pri86;
                    for (var i0 = 0; i0 < sc0; i0 += 4) ctx.fillRect(sb0[i0], sb0[i0 + 1], sb0[i0 + 2], sb0[i0 + 3]);
                }
                if (sc1 > 0) {
                    ctx.fillStyle = pal.sec76;
                    for (var i1 = 0; i1 < sc1; i1 += 4) ctx.fillRect(sb1[i1], sb1[i1 + 1], sb1[i1 + 2], sb1[i1 + 3]);
                }
                if (sc2 > 0) {
                    ctx.fillStyle = pal.spec95;
                    for (var i2 = 0; i2 < sc2; i2 += 4) ctx.fillRect(sb2[i2], sb2[i2 + 1], sb2[i2 + 2], sb2[i2 + 3]);
                }
                if (fbc > 0) {
                    ctx.strokeStyle = pal.pri44;
                    ctx.lineWidth = 0.55;
                    ctx.beginPath();
                    for (var ifr = 0; ifr < fbc; ifr += 4) ctx.rect(fb[ifr], fb[ifr + 1], fb[ifr + 2], fb[ifr + 3]);
                    ctx.stroke();
                }
                if (tc0 > 0 || tc1 > 0) {
                    ctx.font = Math.max(7, Math.round(cellSz * 1.08)) + "px monospace";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    if (tc0 > 0) {
                        ctx.fillStyle = pal.pri86;
                        for (var it0 = 0; it0 < tc0; it0 += 3) ctx.fillText(tb0[it0 + 2], tb0[it0], tb0[it0 + 1]);
                    }
                    if (tc1 > 0) {
                        ctx.fillStyle = pal.acc86;
                        for (var it1 = 0; it1 < tc1; it1 += 3) ctx.fillText(tb1[it1 + 2], tb1[it1], tb1[it1 + 1]);
                    }
                }
            }

            // Full-screen peripheral cinema vignette (keeps desktop icons & panels crisp)
            var vig = ctx.createRadialGradient(W * 0.52, H * 0.48, W * 0.28, W * 0.5, H * 0.5, W * 0.78);
            vig.addColorStop(0.0, "rgba(0,0,0,0)");
            vig.addColorStop(1.0, "rgba(0,0,0,0.46)");
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, W, H);

            root.backdropDirty = false;
        }
    }

    // ── 7B. Dynamic 3D Interactive Scene Canvas (0.42x GPU-Scaled Transparent Overlay) ──
    Canvas {
        id: sceneCanvas
        readonly property real resScale: 0.42
        width: Math.max(64, Math.round(parent.width * resScale))
        height: Math.max(64, Math.round(parent.height * resScale))
        scale: 1.0 / resScale
        transformOrigin: Item.TopLeft
        smooth: true
        renderTarget: Canvas.Image
        renderStrategy: Canvas.Immediate

        onPaint: {
            var ctx = getContext("2d");
            if (!ctx) return;
            var W = width;
            var H = height;
            if (W < 64 || H < 64) return;

            var sc = Math.min(W / 1920.0, H / 1080.0);
            var pal = root.buildActivePalette();
            var mode = root.currentMode;
            var t = root.worldTime;
            var morph = root.modeMorph;
            var vortexBurst = morph < 1.0 ? Math.sin(morph * Math.PI) : 0.0;

            var mx = root.smoothMouseX * sceneCanvas.resScale;
            var my = root.smoothMouseY * sceneCanvas.resScale;
            var normMx = (mx / W - 0.5) * 2.0;
            var normMy = (my / H - 0.5) * 2.0;

            // Key Scene Anchors (Left 22% & top icon lane kept spacious & readable)
            var centerX = W * 0.475;
            var centerY = H * 0.448;
            var sanctumPedY = H * 0.625;
            var wordmarkY = H * 0.740;
            var charX = W * 0.808;
            var charY = H * 0.555;

            // ════════════════════════════════════════════════════════════════
            // PASS 1: FAST TRANSPARENT CLEAR (0 gradients, butt caps)
            // ════════════════════════════════════════════════════════════════
            ctx.clearRect(0, 0, W, H);
            ctx.lineCap = "butt";
            ctx.lineJoin = "miter";

            // ════════════════════════════════════════════════════════════════
            // PASS 2: MODE-EXCLUSIVE DYNAMIC 3D WORLD ARCHITECTURE
            // ════════════════════════════════════════════════════════════════
            if (mode === "gold") {
                // 2A. SOVEREIGN 24K SANCTUM: Celestial Constellations & Batched Ley-Lines
                var sparks = root.ambientSparks;
                ctx.fillStyle = pal.spec55;
                for (var s1 = 0; s1 < sparks.length; s1++) {
                    if (s1 % 5 === 0) continue;
                    var p1 = sparks[s1];
                    var sx1 = p1.x * W - normMx * p1.depth * 18;
                    var sy1 = p1.y * H - normMy * p1.depth * 14;
                    var twk = 0.45 + 0.55 * Math.sin(t * 1.8 + p1.phase);
                    if (twk > 0.35 || sx1 >= W * 0.20) {
                        ctx.fillRect(sx1 - 1, sy1 - 1, p1.sz, p1.sz);
                    }
                }

                ctx.fillStyle = pal.acc56;
                for (var sAcc = 0; sAcc < sparks.length; sAcc += 5) {
                    var pAcc = sparks[sAcc];
                    var sxA = pAcc.x * W - normMx * pAcc.depth * 18;
                    var syA = pAcc.y * H - normMy * pAcc.depth * 14;
                    ctx.fillRect(sxA - 1, syA - 1, pAcc.sz + 0.5, pAcc.sz + 0.5);
                }
            } else if (mode === "ghost") {
                // 2B. NULLAI GHOSTMODE: Batched 3D Geodesic Tor Onion Relay Dome + Tactical Dark-Sonar Floor
                var geo = root.geodesicMesh;
                if (geo) {
                    var gYaw = t * 0.14 + normMx * 0.25;
                    var gPitch = 0.22 + normMy * 0.16;
                    var cgY = Math.cos(gYaw), sgY = Math.sin(gYaw);
                    var cgP = Math.cos(gPitch), sgP = Math.sin(gPitch);
                    var domeR = 470 * sc;
                    var projG = geo.proj;

                    for (var gv = 0; gv < geo.verts.length; gv++) {
                        var v3 = geo.verts[gv];
                        var rx = v3[0] * cgY + v3[2] * sgY;
                        var rz0 = -v3[0] * sgY + v3[2] * cgY;
                        var ry = v3[1] * cgP - rz0 * sgP;
                        var rz = v3[1] * sgP + rz0 * cgP;
                        var persp = 3.2 / (3.2 - rz * 0.85);
                        projG[gv][0] = centerX + rx * domeR * persp * 1.32;
                        projG[gv][1] = centerY + ry * domeR * persp * 0.88;
                        projG[gv][2] = rz;
                    }

                    ctx.lineWidth = 0.9;
                    ctx.strokeStyle = pal.pri14;
                    ctx.beginPath();
                    for (var ge0 = 0; ge0 < geo.edges.length; ge0 += 2) {
                        var eP0 = geo.edges[ge0];
                        ctx.moveTo(projG[eP0[0]][0], projG[eP0[0]][1]);
                        ctx.lineTo(projG[eP0[1]][0], projG[eP0[1]][1]);
                    }
                    ctx.stroke();

                    // Encrypted Tor relay packets via direct fillRect
                    ctx.fillStyle = pal.spec75;
                    for (var geHop = 0; geHop < geo.edges.length; geHop += 5) {
                        var eHop = geo.edges[geHop];
                        var ha = projG[eHop[0]];
                        var hb = projG[eHop[1]];
                        var hop = (t * 0.65 + geHop * 0.17) % 1.0;
                        ctx.fillRect(ha[0] + (hb[0] - ha[0]) * hop - 1.5, ha[1] + (hb[1] - ha[1]) * hop - 1.5, 3, 3);
                    }

                    // Front nodes via direct fillRect
                    ctx.fillStyle = pal.pri44;
                    for (var gn = 0; gn < projG.length; gn++) {
                        var nd = projG[gn];
                        if (nd[2] > -0.3) {
                            ctx.fillRect(nd[0] - 2, nd[1] - 2, 4, 4);
                        }
                    }
                }

                // Expanding Dark-Sonar Radar Sweeps & Rotating Sweep Beam on Perspective Floor
                ctx.lineWidth = 1.4;
                for (var sn = 0; sn < 2; sn++) {
                    var sProg = ((t * 0.28 + sn * 0.5) % 1.0);
                    var sRx = (80 + sProg * 540) * sc;
                    var sRy = sRx * 0.22;
                    ctx.strokeStyle = root.rgbaArr(pal.primary, (1.0 - sProg) * 0.28);
                    root.strokeEllipse(ctx, centerX, H * 0.72, sRx, sRy, 0, 0, Math.PI * 2);
                }
                var rBeamAng = t * 1.15;
                var rBeamX = centerX + Math.cos(rBeamAng) * 460 * sc;
                var rBeamY = H * 0.72 + Math.sin(rBeamAng) * (460 * 0.22) * sc;
                ctx.lineWidth = 1.6 * sc;
                ctx.strokeStyle = pal.acc36;
                ctx.beginPath();
                ctx.moveTo(centerX, H * 0.72);
                ctx.lineTo(rBeamX, rBeamY);
                ctx.stroke();
            } else if (mode === "matrix") {
                // 2C. HERMETIC MATRIX P39: 32 Columns, Fast 2-Rect Procedural Braille Rain + Cursor Repulsion Wake
                var cols = root.matrixColumns;
                var tGlyphStep = (t * 9.0) | 0;
                var repR = 155 * sc;
                var repR2 = repR * repR;
                var bMasks = [0xFF, 0xFE, 0xF7, 0xBF, 0x7F, 0x3F, 0x07, 0x0B, 0xE4, 0x9B];
                var mb0 = root.wmSubBatches[0], mc0 = 0; // Heads (pal.spec95)
                var mb1 = root.wmSubBatches[1], mc1 = 0; // Near-heads (pal.pri86)
                var mb2 = root.wmSubBatches[2], mc2 = 0; // Trails + left lane (pal.sec76)

                for (var fontBucket = 0; fontBucket < 2; fontBucket++) {
                    var stepY = (fontBucket === 0 ? 12.5 : 16.5) * sc;
                    var mDot = (fontBucket === 0 ? 1.65 : 2.05) * sc;
                    var mDx = (fontBucket === 0 ? 1.60 : 2.00) * sc;
                    var mDy = (fontBucket === 0 ? 1.75 : 2.15) * sc;
                    var barW = mDot * 1.6;
                    var barH = mDot * 1.5;

                    for (var mc = 0; mc < cols.length; mc++) {
                        if ((mc % 3 === 0 ? 0 : 1) !== fontBucket) continue;
                        var col = cols[mc];
                        var baseX = col.x * W;
                        var isLeftLane = baseX < W * 0.21;
                        var headY = ((col.y + t * col.speed) % 1.32 - 0.16) * H;

                        for (var k = 0; k < col.len; k++) {
                            var gy = headY - k * stepY;
                            if (gy < -20 || gy > H + 20) continue;
                            var gx = baseX;
                            var cdx = gx - mx;
                            var cdy = gy - my;
                            var cd2 = cdx * cdx + cdy * cdy;
                            if (cd2 < repR2 && cd2 > 1.0) {
                                var cd = Math.sqrt(cd2);
                                gx += (cdx / cd) * (1.0 - cd / repR) * 42 * sc * (0.5 + col.depth * 0.6);
                            }

                            var mIdx = ((mc * 7 + k * 3 + tGlyphStep) % 10 + 10) % 10;
                            var bMask = bMasks[mIdx];
                            if (isLeftLane) {
                                if ((k & 1) === 0 && (bMask & 0x0F)) {
                                    mb2[mc2++] = gx - mDx; mb2[mc2++] = gy - mDy; mb2[mc2++] = mDot * 1.3; mb2[mc2++] = mDot * 1.3;
                                }
                            } else {
                                var dstArr = k === 0 ? mb0 : (k < 3 ? mb1 : mb2);
                                var dstCnt = k === 0 ? mc0 : (k < 3 ? mc1 : mc2);
                                if (bMask & 0x0F) {
                                    dstArr[dstCnt++] = gx - mDx; dstArr[dstCnt++] = gy - mDy; dstArr[dstCnt++] = barW; dstArr[dstCnt++] = barH;
                                }
                                if (bMask & 0xF0) {
                                    dstArr[dstCnt++] = gx - mDx; dstArr[dstCnt++] = gy + 0.3 * sc; dstArr[dstCnt++] = barW; dstArr[dstCnt++] = barH;
                                }
                                if (k === 0) mc0 = dstCnt;
                                else if (k < 3) mc1 = dstCnt;
                                else mc2 = dstCnt;
                            }
                        }
                    }
                }

                if (mc2 > 0) {
                    ctx.fillStyle = pal.sec76;
                    for (var mi2 = 0; mi2 < mc2; mi2 += 4) ctx.fillRect(mb2[mi2], mb2[mi2 + 1], mb2[mi2 + 2], mb2[mi2 + 3]);
                }
                if (mc1 > 0) {
                    ctx.fillStyle = pal.pri86;
                    for (var mi1 = 0; mi1 < mc1; mi1 += 4) ctx.fillRect(mb1[mi1], mb1[mi1 + 1], mb1[mi1 + 2], mb1[mi1 + 3]);
                }
                if (mc0 > 0) {
                    ctx.fillStyle = pal.spec95;
                    for (var mi0 = 0; mi0 < mc0; mi0 += 4) ctx.fillRect(mb0[mi0], mb0[mi0 + 1], mb0[mi0 + 2], mb0[mi0 + 3]);
                }

                // Racing STDP Synaptic Pulses onto Static Floor Lines (direct fillRect)
                ctx.fillStyle = pal.spec88;
                for (var ax = 0; ax < 7; ax++) {
                    var ay = H * 0.66 + ax * 46 * sc;
                    var spkU = ((t * (0.22 + ax * 0.04) + ax * 0.37) % 1.0);
                    var spkX = W * 0.18 + spkU * (W * 0.78);
                    ctx.fillRect(spkX - 4 * sc, ay - 1.2 * sc, 8 * sc, 2.4 * sc);
                }
            } else {
                // 2D. FLUENT SILK BLOOM (INCOGNITO / WINDOWS): Batched 16-Segment Liquid-Glass Ribbons (2 strokes total)
                for (var rPass = 0; rPass < 2; rPass++) {
                    ctx.strokeStyle = rPass === 0 ? pal.pri28 : pal.acc28;
                    ctx.lineWidth = (rPass === 0 ? 1.7 : 2.1) * sc;
                    ctx.beginPath();
                    for (var rib = rPass; rib < 6; rib += 2) {
                        var ribBaseY = H * (0.30 + rib * 0.095);
                        var ribAmp = (46 + rib * 12) * sc;
                        var ribPhase = t * (0.42 + rib * 0.07) + rib * 0.95;
                        for (var rxStep = 0; rxStep <= 16; rxStep++) {
                            var u = rxStep / 16.0;
                            var pxW = u * W;
                            var wave = Math.sin(u * 4.8 + ribPhase) * ribAmp
                                     + Math.cos(u * 8.2 - ribPhase * 0.7) * (ribAmp * 0.38);
                            var distCur = Math.abs(pxW - mx) / (260 * sc);
                            if (distCur < 1.5) {
                                var bell = Math.cos(distCur * 1.047);
                                wave += bell * bell * (my - ribBaseY) * 0.22;
                            }
                            var pyW = ribBaseY + wave;
                            if (rxStep === 0) ctx.moveTo(pxW, pyW);
                            else ctx.lineTo(pxW, pyW);
                        }
                    }
                    ctx.stroke();
                }
            }

            // ════════════════════════════════════════════════════════════════
            // PASS 3: TRAVELING LEY-LINE BRIDGE PACKETS (Static ticks & rails baked in backdropCanvas)
            // ════════════════════════════════════════════════════════════════
            var pedCenterY = sanctumPedY;
            var pedCharY = H * 0.828;
            ctx.fillStyle = pal.spec88;
            for (var brP = -1; brP <= 1; brP++) {
                var yOffP = brP * 12 * sc;
                var px0 = centerX + 148 * sc, py0 = pedCenterY + yOffP;
                var px1 = centerX + 275 * sc, py1 = pedCenterY + (36 + brP * 12) * sc;
                var px2 = charX - 220 * sc, py2 = pedCharY - (24 - brP * 12) * sc;
                var px3 = charX - 118 * sc, py3 = pedCharY + yOffP * 0.65;
                var pktT = (t * (0.38 + (brP + 1) * 0.09) + (brP + 1) * 0.31) % 1.0;
                var invT = 1.0 - pktT;
                var bx = invT*invT*invT*px0 + 3*invT*invT*pktT*px1 + 3*invT*pktT*pktT*px2 + pktT*pktT*pktT*px3;
                var by = invT*invT*invT*py0 + 3*invT*invT*pktT*py1 + 3*invT*pktT*pktT*py2 + pktT*pktT*pktT*py3;
                ctx.fillRect(bx - 2.2 * sc, by - 1.8 * sc, 4.4 * sc, 3.6 * sc);
            }

            // ════════════════════════════════════════════════════════════════
            // PASS 4: CENTERPIECE — SCULPTED 3D HERMETIC "Z" RELIC & ORBITAL APPARATUS
            // ════════════════════════════════════════════════════════════════
            var morphFlourish = morph < 1.0 ? Math.sin(morph * Math.PI) : 0.0;
            var zScale = 126.0 * sc * (1.0 + morphFlourish * 0.10);
            // Bounded yaw guarantees Z ALWAYS faces forward and NEVER flips into an S!
            var zYaw = Math.sin(t * 0.52) * 0.30 + normMx * 0.38 + morphFlourish * 0.38;
            var zPitch = Math.cos(t * 0.41) * 0.14 - normMy * 0.28;
            var zRoll = Math.sin(t * 0.33) * 0.045 + normMx * 0.04;
            var zBobY = centerY + Math.sin(t * 1.15) * 7.5 * sc;

            // Helper: 2x2x2 Outer Lattice Cube Vertices & Orbiting Sigil Motes (static rings baked in backdropCanvas)
            function drawOrbitalApparatus(isFront) {
                var lat = root.latticeGeo;
                if (!isFront && lat) {
                    var lp = lat.proj;
                    var lYaw = t * 0.35 + normMx * 0.35;
                    var lPitch = 0.36 + Math.sin(t * 0.42) * 0.14 - normMy * 0.24;
                    var clY = Math.cos(lYaw), slY = Math.sin(lYaw);
                    var clP = Math.cos(lPitch), slP = Math.sin(lPitch);
                    var latR = 138 * sc;
                    ctx.fillStyle = pal.pri28;
                    for (var lv = 0; lv < lat.verts.length; lv++) {
                        var v3L = lat.verts[lv];
                        var lx3 = v3L[0] * clY + v3L[2] * slY;
                        var lz0 = -v3L[0] * slY + v3L[2] * clY;
                        var ly3 = v3L[1] * clP - lz0 * slP;
                        var fz3L = v3L[1] * slP + lz0 * clP;
                        var pfL = 3.2 / (3.8 + fz3L);
                        var pxL = centerX + lx3 * latR * pfL;
                        var pyL = zBobY + ly3 * latR * pfL;
                        lp[lv][0] = pxL;
                        lp[lv][1] = pyL;
                        lp[lv][2] = fz3L;
                        ctx.fillRect(pxL - 1.4 * sc, pyL - 1.4 * sc, 2.8 * sc, 2.8 * sc);
                    }
                    return;
                }
                if (!isFront) return;

                if (mode === "matrix") {
                    // Spinning 4D Tesseract Hypercube Projection around Z (1 batched stroke + vertex rects)
                    var wAngle = t * 0.62;
                    var cw = Math.cos(wAngle), sw = Math.sin(wAngle);
                    var cyM = Math.cos(t * 0.38 + normMx * 0.3), syM = Math.sin(t * 0.38 + normMx * 0.3);
                    var cpM = Math.cos(0.32 - normMy * 0.2), spM = Math.sin(0.32 - normMy * 0.2);
                    var tVerts = [];
                    for (var tv = 0; tv < 16; tv++) {
                        var x4 = (tv & 1) ? 1 : -1;
                        var y4 = (tv & 2) ? 1 : -1;
                        var z4 = (tv & 4) ? 1 : -1;
                        var w4 = (tv & 8) ? 1 : -1;
                        var xw = x4 * cw - w4 * sw;
                        var ww = x4 * sw + w4 * cw;
                        var wScale = 1.45 / (2.5 - ww * 0.55);
                        var x3 = xw * wScale;
                        var y3 = y4 * wScale;
                        var z3 = z4 * wScale;
                        var rx3 = x3 * cyM + z3 * syM;
                        var rz3 = -x3 * syM + z3 * cyM;
                        var ry3 = y3 * cpM - rz3 * spM;
                        var fz3 = y3 * spM + rz3 * cpM;
                        var p3 = 4.2 / (4.2 - fz3 * 0.6);
                        tVerts.push([centerX + rx3 * 125 * sc * p3, zBobY + ry3 * 125 * sc * p3, fz3]);
                    }
                    ctx.lineWidth = 1.05 * sc;
                    ctx.strokeStyle = pal.pri36;
                    ctx.beginPath();
                    for (var i4 = 0; i4 < 16; i4++) {
                        for (var bit = 0; bit < 2; bit++) {
                            var j4 = i4 ^ (1 << bit);
                            if (i4 < j4) {
                                var va = tVerts[i4], vb = tVerts[j4];
                                ctx.moveTo(va[0], va[1]);
                                ctx.lineTo(vb[0], vb[1]);
                            }
                        }
                    }
                    ctx.stroke();

                    ctx.fillStyle = pal.spec88;
                    for (var tn = 0; tn < 16; tn++) {
                        var tvp = tVerts[tn];
                        if (tvp[2] >= -0.15) {
                            ctx.fillRect(tvp[0] - 1.6 * sc, tvp[1] - 1.6 * sc, 3.2 * sc, 3.2 * sc);
                        }
                    }
                } else {
                    // Orbiting Sigil Motes along the Baked Elliptical Rings (0 strokes!)
                    var r0x = (mode === "gold" ? 176 : (mode === "ghost" ? 182 : 188)) * sc;
                    var r0y = r0x * (mode === "gold" ? 0.47 : (mode === "ghost" ? 0.42 : 0.36));
                    var r0t = mode === "gold" ? 0.36 : (mode === "ghost" ? -0.28 : 0.24);
                    var r1x = (mode === "gold" ? 154 : (mode === "ghost" ? 210 : 214)) * sc;
                    var r1y = r1x * (mode === "gold" ? 0.68 : (mode === "ghost" ? 0.68 : 0.36));
                    var r1t = mode === "gold" ? -0.48 : (mode === "ghost" ? 0.34 : -0.22);

                    var cT0 = Math.cos(r0t), sT0 = Math.sin(r0t);
                    var cT1 = Math.cos(r1t), sT1 = Math.sin(r1t);
                    ctx.fillStyle = pal.spec88;
                    for (var ms = 0; ms < 3; ms++) {
                        var ang0 = t * 0.36 + ms * (Math.PI * 2.0 / 3.0);
                        var ex0 = Math.cos(ang0) * r0x, ey0 = Math.sin(ang0) * r0y;
                        var sx0 = centerX + ex0 * cT0 - ey0 * sT0;
                        var sy0 = centerY + ex0 * sT0 + ey0 * cT0;
                        ctx.fillRect(sx0 - 2.2 * sc, sy0 - 2.2 * sc, 4.4 * sc, 4.4 * sc);

                        var ang1 = -t * 0.44 + ms * (Math.PI * 2.0 / 3.0) + 0.5;
                        var ex1 = Math.cos(ang1) * r1x, ey1 = Math.sin(ang1) * r1y;
                        var sx1 = centerX + ex1 * cT1 - ey1 * sT1;
                        var sy1 = centerY + ex1 * sT1 + ey1 * cT1;
                        ctx.fillRect(sx1 - 2.0 * sc, sy1 - 2.0 * sc, 4.0 * sc, 4.0 * sc);
                    }
                }
            }

            // 4A. Draw Rear Half of Orbital Apparatus (z < 0)
            drawOrbitalApparatus(false);

            // 4B. Render Sculpted Multi-Faceted 3D Hermetic "Z" Relic
            var relic = root.zRelicGeo;
            if (relic) {
                var cY = Math.cos(zYaw), sY = Math.sin(zYaw);
                var cP = Math.cos(zPitch), sP = Math.sin(zPitch);
                var cR = Math.cos(zRoll), sR = Math.sin(zRoll);
                var fovZ = 4.6;

                // Dynamic 3D Light Vector steered by cursor
                var lxDir = (mx - centerX) / (420 * sc) + 0.32;
                var lyDir = (my - zBobY) / (420 * sc) - 0.45;
                var lzDir = 0.92;
                var lLen = Math.sqrt(lxDir * lxDir + lyDir * lyDir + lzDir * lzDir);
                lxDir /= lLen; lyDir /= lLen; lzDir /= lLen;

                function projZPt(pt) {
                    var x0 = pt[0] * cR - pt[1] * sR;
                    var y0 = pt[0] * sR + pt[1] * cR;
                    var z0 = pt[2];
                    var x1 = x0 * cY + z0 * sY;
                    var z1 = -x0 * sY + z0 * cY;
                    var y2 = y0 * cP - z1 * sP;
                    var z2 = y0 * sP + z1 * cP;
                    var ps = fovZ / (fovZ - z2);
                    return [centerX + x1 * zScale * ps, zBobY + y2 * zScale * ps, z2, x1, y2];
                }

                var pVerts = [];
                for (var vi = 0; vi < relic.verts.length; vi++) {
                    pVerts.push(projZPt(relic.verts[vi]));
                }

                // Group faces into 8 shade-tier buckets so ctx.fill() executes <= 8 times (zero drawFaces.sort)
                var tierBuckets = [[], [], [], [], [], [], [], []];
                for (var fi = 0; fi < relic.faces.length; fi++) {
                    var fc = relic.faces[fi];
                    var nx0 = fc.n[0] * cR - fc.n[1] * sR;
                    var ny0 = fc.n[0] * sR + fc.n[1] * cR;
                    var nz0 = fc.n[2];
                    var nx1 = nx0 * cY + nz0 * sY;
                    var nz1 = -nx0 * sY + nz0 * cY;
                    var ny2 = ny0 * cP - nz1 * sP;
                    var nz2 = ny0 * sP + nz1 * cP;

                    // Cull rear-facing faces unless in Ghost wireframe cloak
                    if (nz2 <= 0.0 && mode !== "ghost") continue;

                    var diff = Math.max(0.0, nx1 * lxDir + ny2 * lyDir + nz2 * lzDir);
                    var hx = lxDir, hy = lyDir, hz = lzDir + 1.0;
                    var hL = Math.sqrt(hx * hx + hy * hy + hz * hz);
                    var ndoth = Math.max(0.0, (nx1 * hx + ny2 * hy + nz2 * hz) / hL);
                    var spec = Math.pow(ndoth, fc.kind === 1 ? 18.0 : 12.0);
                    var shade = 0.16 + diff * 0.62 + spec * (fc.kind === 1 ? 0.52 : 0.34);
                    if (fc.kind === 2) shade += 0.08;
                    if (fc.kind === 3) shade += 0.16;
                    var tier = Math.max(0, Math.min(7, Math.floor(shade * 7.6)));
                    var cTier = (fc.kind >= 2 && mode !== "ghost" && Math.abs((fi * 0.08) - (0.5 + 0.5 * Math.sin(t * 1.4))) < 0.18) ? 7 : tier;
                    tierBuckets[cTier].push(fc.idx);
                }

                var lut = pal.facetLUT;
                ctx.globalAlpha = 1.0;
                for (var tb = 0; tb < 8; tb++) {
                    var bFaces = tierBuckets[tb];
                    if (bFaces.length === 0) continue;
                    ctx.fillStyle = lut[tb];
                    ctx.beginPath();
                    for (var bf = 0; bf < bFaces.length; bf++) {
                        var fIdxs = bFaces[bf];
                        var fp0 = pVerts[fIdxs[0]];
                        ctx.moveTo(fp0[0], fp0[1]);
                        for (var fpi = 1; fpi < fIdxs.length; fpi++) {
                            var fpk = pVerts[fIdxs[fpi]];
                            ctx.lineTo(fpk[0], fpk[1]);
                        }
                        ctx.closePath();
                    }
                    ctx.fill();
                }

                // Single 14-vertex raised front-crown contour stroke (14 segments, 1 opaque stroke total!)
                ctx.lineWidth = 1.15 * sc;
                ctx.strokeStyle = mode === "ghost" ? pal.cssPrimary : pal.cssSpecular;
                ctx.beginPath();
                ctx.moveTo(pVerts[28][0], pVerts[28][1]);
                for (var ci = 29; ci < 42; ci++) {
                    ctx.lineTo(pVerts[ci][0], pVerts[ci][1]);
                }
                ctx.closePath();
                ctx.stroke();

                // Ghostmode periodic horizontal stealth glitch-slices across wireframe Z
                if (mode === "ghost" && Math.sin(t * 4.7) > 0.55) {
                    var glYOff = (Math.sin(t * 19.0) * 0.5) * 90 * sc;
                    var glShift = Math.cos(t * 23.0) * 18 * sc;
                    ctx.lineWidth = 1.6 * sc;
                    ctx.strokeStyle = pal.acc74;
                    ctx.beginPath();
                    ctx.moveTo(centerX - 88 * sc + glShift, zBobY + glYOff);
                    ctx.lineTo(centerX + 88 * sc + glShift, zBobY + glYOff);
                    ctx.stroke();
                }

                // Engraved U+2800 Braille & Micro-Lattice Filigree embedded on front Z bars (direct fillRect)
                var engPts = [
                    [-0.48, -0.63, 0.335], [0.0, -0.63, 0.335], [0.46, -0.63, 0.335],
                    [0.24, -0.26, 0.335], [-0.24, 0.26, 0.335],
                    [-0.46, 0.63, 0.335], [0.0, 0.63, 0.335], [0.48, 0.63, 0.335]
                ];
                var engMasks = [0xFF, 0xFE, 0xF7, 0xBF, 0x7F, 0x3F, 0x07, 0x0B, 0x24];
                var engT = (t * 5) | 0;
                var zb0 = root.wmSubBatches[0], zc0 = 0;
                var zb1 = root.wmSubBatches[1], zc1 = 0;
                var zDot = 1.45 * sc, zDx = 1.4 * sc, zDy = 1.5 * sc;
                for (var epIdx = 0; epIdx < engPts.length; epIdx++) {
                    var ep3 = projZPt(engPts[epIdx]);
                    var engM = engMasks[(epIdx + engT) % engMasks.length];
                    if (epIdx % 2 === 0) zc0 = root.pushBraille(zb0, zc0, ep3[0], ep3[1], zDot, zDx, zDy, engM);
                    else zc1 = root.pushBraille(zb1, zc1, ep3[0], ep3[1], zDot, zDx, zDy, engM);
                }
                if (zc0 > 0) {
                    ctx.fillStyle = pal.spec75;
                    for (var zi0 = 0; zi0 < zc0; zi0 += 4) ctx.fillRect(zb0[zi0], zb0[zi0 + 1], zb0[zi0 + 2], zb0[zi0 + 3]);
                }
                if (zc1 > 0) {
                    ctx.fillStyle = pal.acc86;
                    for (var zi1 = 0; zi1 < zc1; zi1 += 4) ctx.fillRect(zb1[zi1], zb1[zi1 + 1], zb1[zi1 + 2], zb1[zi1 + 3]);
                }

                // 4C. Recessed Alchemical Spine Vein & Traveling Energy Pulse on Front Crown (butt caps)
                var spinePts = [];
                for (var spIdx = 0; spIdx < relic.spine.length; spIdx++) {
                    spinePts.push(projZPt(relic.spine[spIdx]));
                }
                ctx.lineWidth = 1.8 * sc;
                ctx.strokeStyle = pal.cssAccent;
                ctx.beginPath();
                for (var sv = 0; sv < spinePts.length; sv++) {
                    if (sv === 0) ctx.moveTo(spinePts[sv][0], spinePts[sv][1]);
                    else ctx.lineTo(spinePts[sv][0], spinePts[sv][1]);
                }
                ctx.stroke();

                // Live traveling pulse along the Z spine (0 dynamic radial gradients)
                var segTotal = spinePts.length - 1;
                var pulsePos = ((root.veinPulse % 1.0) + 1.0) % 1.0 * segTotal;
                var segI = Math.min(segTotal - 1, Math.floor(pulsePos));
                var segF = pulsePos - segI;
                var spA = spinePts[segI], spB = spinePts[segI + 1];
                var pulseX = spA[0] + (spB[0] - spA[0]) * segF;
                var pulseY = spA[1] + (spB[1] - spA[1]) * segF;
                ctx.fillStyle = pal.acc36;
                ctx.fillRect(pulseX - 9 * sc, pulseY - 9 * sc, 18 * sc, 18 * sc);
                ctx.fillStyle = pal.cssSpecular;
                ctx.fillRect(pulseX - 3.5 * sc, pulseY - 3.5 * sc, 7 * sc, 7 * sc);

                // Central Hermetic Eye Jewel at (0, 0, +0.44) via direct fillRect (0 path fills/strokes)
                var gemC = projZPt([0, 0, 0.44]);
                ctx.fillStyle = pal.cssAccent;
                ctx.fillRect(gemC[0] - 6.5 * sc, gemC[1] - 6.5 * sc, 13 * sc, 13 * sc);
                ctx.fillStyle = pal.cssSpecular;
                ctx.fillRect(gemC[0] - 3.0 * sc, gemC[1] - 3.0 * sc, 6 * sc, 6 * sc);

                // Braille & Bayer Edge Dissolution Sparks peeling off Z terminals (direct fillRect)
                var spMasks = [0xFF, 0xFE, 0xF7, 0xBF, 0x7F, 0x3F, 0x07, 0x0B, 0x24];
                var spT = (t * 6) | 0;
                var spB0 = root.wmSubBatches[0], spc0 = 0;
                var spB1 = root.wmSubBatches[1], spc1 = 0;
                var spDot = 1.65 * sc, spDx = 1.6 * sc, spDy = 1.7 * sc;
                for (var es = 0; es < 14; es++) {
                    var corner = pVerts[es];
                    var drift = ((t * 0.75 + es * 0.23) % 1.0);
                    var dirS = (es < 7) ? 1.0 : -1.0;
                    var ex = corner[0] + dirS * drift * 28 * sc;
                    var ey = corner[1] - drift * 16 * sc;
                    var spM = spMasks[(es + spT) % spMasks.length];
                    if (es % 3 === 0) spc1 = root.pushBraille(spB1, spc1, ex, ey, spDot, spDx, spDy, spM);
                    else spc0 = root.pushBraille(spB0, spc0, ex, ey, spDot, spDx, spDy, spM);
                }
                if (spc0 > 0) {
                    ctx.fillStyle = pal.pri55;
                    for (var si0 = 0; si0 < spc0; si0 += 4) ctx.fillRect(spB0[si0], spB0[si0 + 1], spB0[si0 + 2], spB0[si0 + 3]);
                }
                if (spc1 > 0) {
                    ctx.fillStyle = pal.acc86;
                    for (var si1 = 0; si1 < spc1; si1 += 4) ctx.fillRect(spB1[si1], spB1[si1 + 1], spB1[si1 + 2], spB1[si1 + 3]);
                }
            }

            // 4D. Draw Front Half of Orbital Apparatus (z >= 0) — True 3D Occlusion!
            drawOrbitalApparatus(true);

            // ════════════════════════════════════════════════════════════════
            // PASS 5: DYNAMIC "ZOTHOS" SHEEN & QUANTUM DISSOLUTION OVERLAY (Base Baked in backdropCanvas)
            // ════════════════════════════════════════════════════════════════
            var wmCells = root.wordmarkCells;
            if (wmCells && wmCells.length > 0) {
                var cellSz = 5.1 * sc;
                var totalCols = 69;
                var wmW = totalCols * cellSz;
                var wmH = 11 * cellSz;
                var wmStartX = centerX - wmW * 0.5;
                var wmStartY = wordmarkY - wmH * 0.5;
                var bayer = root.bayer8;

                var sb0 = root.wmSubBatches[0], sc0 = 0;
                var sb2 = root.wmSubBatches[2], sc2 = 0;

                for (var wc = 0; wc < wmCells.length; wc += 2) {
                    var cell = wmCells[wc];
                    var uNorm = cell.gx / totalCols;
                    var dxW = wmStartX + cell.gx * cellSz;
                    var dyW = wmStartY + cell.gy * cellSz;

                    var sheenDist = Math.abs((uNorm + cell.gy * 0.018) - root.sheenWave);
                    var sheenBoost = sheenDist < 0.13 ? (1.0 - sheenDist / 0.13) : 0.0;
                    var bVal = bayer[((cell.gy & 7) << 3) | (cell.gx & 7)];
                    var inDissolveTail = (uNorm >= 0.72) && (bVal > 0.48 + Math.sin(t * 3.0 + cell.gy) * 0.18);

                    if (sheenBoost > 0.18) {
                        sb2[sc2++] = dxW; sb2[sc2++] = dyW; sb2[sc2++] = cellSz * 0.88; sb2[sc2++] = cellSz * 0.88;
                    }
                    if (inDissolveTail && ((wc & 1) === 0)) {
                        var tailX = dxW + (Math.sin(t * 4.2 + cell.gy * 0.8) * 3.5 + 3.0) * sc;
                        sb0[sc0++] = tailX; sb0[sc0++] = dyW; sb0[sc0++] = cellSz * 0.48; sb0[sc0++] = cellSz * 0.48;
                        sb2[sc2++] = tailX + cellSz * 0.44; sb2[sc2++] = dyW + cellSz * 0.44; sb2[sc2++] = cellSz * 0.42; sb2[sc2++] = cellSz * 0.42;
                    }
                    if (cell.rightEdge && ((cell.gy + cell.letterIdx) % 2 === 0)) {
                        var emPhase = ((t * 0.85 + cell.gx * 0.13 + cell.gy * 0.29) % 1.0);
                        var emX = dxW + cellSz + emPhase * 28 * sc;
                        var emY = dyW + cellSz * 0.25 + Math.sin(t * 2.0 + cell.gy) * 3.8 * sc;
                        sb0[sc0++] = emX; sb0[sc0++] = emY; sb0[sc0++] = cellSz * 0.44; sb0[sc0++] = cellSz * 0.44;
                        if (emPhase > 0.45) {
                            sb2[sc2++] = emX + cellSz * 0.36; sb2[sc2++] = emY + cellSz * 0.36; sb2[sc2++] = cellSz * 0.36; sb2[sc2++] = cellSz * 0.36;
                        }
                    }
                }

                if (sc0 > 0) {
                    ctx.fillStyle = pal.pri86;
                    for (var i0 = 0; i0 < sc0; i0 += 4) ctx.fillRect(sb0[i0], sb0[i0 + 1], sb0[i0 + 2], sb0[i0 + 3]);
                }
                if (sc2 > 0) {
                    ctx.fillStyle = pal.spec95;
                    for (var i2 = 0; i2 < sc2; i2 += 4) ctx.fillRect(sb2[i2], sb2[i2 + 1], sb2[i2 + 2], sb2[i2 + 3]);
                }
            }

            // ════════════════════════════════════════════════════════════════
            // PASS 6: IN-SCENE 3D VOLUMETRIC "1NC0GN30" SCULPTURE
            //         (True 3D ASCII + Bayer Dither + Wireframe Lattice + U+2800 Braille)
            // ════════════════════════════════════════════════════════════════
            var rigAll = Character3DData.char3DRig;
            if (rigAll) {
                var poseCur = rigAll[root.activePose] || rigAll["hero"];
                var posePrv = rigAll[root.prevPose] || poseCur;
                var voxCur = poseCur.vRender || poseCur.v;
                var voxPrv = posePrv.vRender || posePrv.v;
                var edgeCur = poseCur.eRender || poseCur.e;
                var pMorph = root.poseMorph;
                var isMorphingPose = pMorph < 0.999;
                var pEase = pMorph * pMorph * (3.0 - 2.0 * pMorph);
                var pSwirl = isMorphingPose ? Math.sin(pMorph * Math.PI) : 0.0;

                var charScale = 238.0 * sc;
                var pedX = charX - normMx * 10 * sc;
                var pedY = H * 0.828 - normMy * 6 * sc;
                var figCenterY = pedY - charScale * 0.96 + Math.sin(t * 1.35) * 4.5 * sc;
                var waistY = figCenterY + 14 * sc;
                var waistRot = -0.18 + Math.sin(t * 0.45) * 0.08;

                // 6A. Waist-height 3D orbital ellipse & pedestal baked in backdropCanvas; live orbiting motes render in 6F

                // 6B. 3D Transform & Dual-Point-Light Shading of Volumetric Voxels
                // Angled slightly inward (-0.21 rad) toward the Center Hermetic Z so he inhabits the scene!
                var lookDx = (mx - pedX) / (W * 0.6);
                var lookDy = (my - figCenterY) / (H * 0.6);
                var charYaw = -0.21 + Math.sin(t * 0.48) * 0.18 + lookDx * 0.34 + pSwirl * 1.65;
                if (root.activePose === "walk" && root.walkDir > 0) {
                    charYaw += 0.25;
                }
                var charPitch = -lookDy * 0.16 + Math.cos(t * 0.37) * 0.04;

                var ccY = Math.cos(charYaw), scY = Math.sin(charYaw);
                var ccP = Math.cos(charPitch), scP = Math.sin(charPitch);
                var fovC = 3.8;

                // Point Light 1: Center 3D Hermetic Z Sanctum (casts warm rim light onto left/inner side!)
                var zLightX = -0.82, zLightY = -0.18, zLightZ = 0.54;
                // Point Light 2: User's 3D Cursor Torch
                var cLightX = Math.max(-1.0, Math.min(1.0, (mx - pedX) / (320 * sc)));
                var cLightY = Math.max(-1.0, Math.min(1.0, (my - figCenterY) / (320 * sc)));
                var cLightZ = 0.78;
                var cLL = Math.sqrt(cLightX * cLightX + cLightY * cLightY + cLightZ * cLightZ);
                cLightX /= cLL; cLightY /= cLL; cLightZ /= cLL;

                var vCount = voxCur.length;
                var prevCount = voxPrv.length;
                var pool = root.charProjPool;
                var buckets = root.depthBuckets;
                var bCounts = root.depthCounts;
                var numBuckets = 16;
                for (var bi = 0; bi < numBuckets; bi++) {
                    bCounts[bi] = 0;
                }

                for (var idx = 0; idx < vCount; idx++) {
                    var vc = voxCur[idx];
                    var lx = vc[0];
                    var ly = vc[1];
                    // Negate Z from Character3DData so front relief is +Z (closer to camera)!
                    var lz = -vc[2];

                    if (isMorphingPose && prevCount > 0) {
                        var vp = voxPrv[idx % prevCount];
                        var invE = 1.0 - pEase;
                        lx = (vp[0] * invE + lx * pEase) * (1.0 + pSwirl * 0.14);
                        ly = vp[1] * invE + ly * pEase;
                        lz = (-vp[2]) * invE + lz * pEase;
                    }

                    if (root.activePose === "walk" && root.walkDir > 0) {
                        lx = -lx;
                    }

                    var rxC = lx * ccY + lz * scY;
                    var rzC0 = -lx * scY + lz * ccY;
                    var ryC = ly * ccP - rzC0 * scP;
                    var rzC = ly * scP + rzC0 * ccP;

                    var perspC = fovC / (fovC - rzC * 0.85);
                    var scrX = pedX + rxC * charScale * perspC;
                    var scrY = figCenterY + ryC * charScale * perspC;

                    var vnx = vc[3], vny = vc[4], vnz = 0.72;
                    var rnx = vnx * ccY + vnz * scY;
                    var rnz = -vnx * scY + vnz * ccY;

                    var sanctumDot = Math.max(0.0, rnx * zLightX + vny * zLightY + rnz * zLightZ);
                    var cursorDot = Math.max(0.0, rnx * cLightX + vny * cLightY + rnz * cLightZ);
                    var lit = vc[5] * 0.62 + sanctumDot * 0.42 + cursorDot * 0.48;

                    var slot = pool[idx];
                    slot.sx = scrX;
                    slot.sy = scrY;
                    slot.z = rzC;
                    slot.ps = perspC;
                    slot.lit = lit;
                    slot.sanctum = sanctumDot;
                    slot.bayer = vc[6];
                    slot.flag = vc[7];
                    slot.bm = vc[10] !== undefined ? vc[10] : 0xDB;
                    slot.ac = vc[11] !== undefined ? vc[11] : 0;
                    slot.ly = ly;

                    var bIdx = Math.max(0, Math.min(numBuckets - 1, Math.floor(((rzC + 0.55) / 1.10) * numBuckets)));
                    buckets[bIdx][bCounts[bIdx]++] = slot;
                }

                // 6C. Batched 3D Internal Wireframe Lattice Struts (1 opaque stroke total, stride 8)
                ctx.lineWidth = 0.85 * sc;
                ctx.strokeStyle = pal.facetLUT[2];
                ctx.beginPath();
                for (var ei1 = 0; ei1 < edgeCur.length; ei1 += 8) {
                    var ep1 = edgeCur[ei1];
                    if (ep1[0] >= vCount || ep1[1] >= vCount) continue;
                    var pa1 = pool[ep1[0]];
                    var pb1 = pool[ep1[1]];
                    ctx.moveTo(pa1.sx, pa1.sy);
                    ctx.lineTo(pb1.sx, pb1.sy);
                }
                ctx.stroke();

                // 6D. Batched Back-to-Front Volumetric Voxel Paint (1-2 rects/voxel, Folded Braille + Vector Rim, 0 lineCap=round)
                var ghostScanY = ((t * 0.55) % 1.0) * 2.0 - 1.0;
                var rb = root.charRectBatches;
                var rc0 = 0, rc1 = 0, rc2 = 0, rc3 = 0, rc4 = 0, rc5 = 0;
                var rb0 = rb[0], rb1 = rb[1], rb2 = rb[2], rb3 = rb[3], rb4 = rb[4], rb5 = rb[5];
                var gb = root.charGlyphBatches;
                var gc0 = 0, gc1 = 0;
                var gb0 = gb[0], gb1 = gb[1];
                var tShuf = (t * 7.0) | 0;

                for (var bk = 0; bk < numBuckets; bk++) {
                    var cnt = bCounts[bk];
                    var bArr2 = buckets[bk];
                    for (var vi2 = 0; vi2 < cnt; vi2++) {
                        var pv = bArr2[vi2];
                        var flag = pv.flag;
                        var vDot = 1.65 * sc * pv.ps;
                        var vDx = 1.15 * sc * pv.ps;
                        var vDy = 1.25 * sc * pv.ps;
                        var vHr = 3.0 * sc * pv.ps;

                        // Flag 2 = Recessed Dark Alchemical Hood Void
                        if (flag === 2) {
                            var voidSz = 6.6 * sc * pv.ps;
                            rb4[rc4++] = pv.sx - voidSz * 0.5; rb4[rc4++] = pv.sy - voidSz * 0.5; rb4[rc4++] = voidSz; rb4[rc4++] = voidSz;
                            continue;
                        }

                        var phaseBand = mode === "ghost" ? Math.abs(pv.ly - ghostScanY) : 1.0;
                        var inCloakSlice = (mode === "ghost" && phaseBand < 0.22);

                        if (flag === 3) {
                            var holoSz = 5.4 * sc * pv.ps;
                            rb5[rc5++] = pv.sx - holoSz * 0.5; rb5[rc5++] = pv.sy - holoSz * 0.5; rb5[rc5++] = holoSz; rb5[rc5++] = holoSz;
                            if (pv.ac > 0) gc0 = root.pushStroke(gb0, gc0, pv.sx, pv.sy, vHr, pv.ac);
                            continue;
                        }

                        var tierIdx = (pv.sanctum > 0.44 && flag === 1) ? 3 : (pv.lit > 0.58 ? 2 : (pv.lit > 0.30 ? 1 : 0));

                        if (mode === "incognito") {
                            var dotR = (1.8 + pv.lit * 2.2) * sc * pv.ps;
                            if (pv.lit + 0.24 > pv.bayer * 0.72) {
                                var dDiam = dotR * 2.0;
                                if (tierIdx === 3) { rb3[rc3++] = pv.sx - dotR; rb3[rc3++] = pv.sy - dotR; rb3[rc3++] = dDiam; rb3[rc3++] = dDiam; }
                                else if (tierIdx === 2) { rb2[rc2++] = pv.sx - dotR; rb2[rc2++] = pv.sy - dotR; rb2[rc2++] = dDiam; rb2[rc2++] = dDiam; }
                                else if (tierIdx === 1) { rb1[rc1++] = pv.sx - dotR; rb1[rc1++] = pv.sy - dotR; rb1[rc1++] = dDiam; rb1[rc1++] = dDiam; }
                                else { rb0[rc0++] = pv.sx - dotR; rb0[rc0++] = pv.sy - dotR; rb0[rc0++] = dDiam; rb0[rc0++] = dDiam; }
                            } else if ((vi2 & 3) === 0 || (flag === 1 && (vi2 & 1) === 0)) {
                                if (pv.bm & 0x0F) { rb3[rc3++] = pv.sx - vDx; rb3[rc3++] = pv.sy - vDy; rb3[rc3++] = vDot; rb3[rc3++] = vDot; }
                                if (pv.bm & 0xF0) { rb3[rc3++] = pv.sx + vDx - vDot; rb3[rc3++] = pv.sy + vDy - vDot; rb3[rc3++] = vDot; rb3[rc3++] = vDot; }
                            }
                        } else if (inCloakSlice) {
                            if (flag === 1 && (vi2 & 1) === 0) {
                                if (pv.ac > 0) gc0 = root.pushStroke(gb0, gc0, pv.sx, pv.sy, vHr, pv.ac);
                            } else if (pv.bayer > 0.48 && (vi2 & 1) === 0) {
                                rb3[rc3++] = pv.sx - vDx; rb3[rc3++] = pv.sy - vDy; rb3[rc3++] = vDot; rb3[rc3++] = vDot;
                            }
                        } else {
                            // Streamlined Single Ordered Bayer Voxel + Selective Rim Vector Stroke
                            var subSz = 3.8 * sc * pv.ps;
                            var bT = pv.bayer;
                            if (pv.lit + 0.26 > bT * 0.58) {
                                var arrT = tierIdx === 3 ? rb3 : (tierIdx === 2 ? rb2 : (tierIdx === 1 ? rb1 : rb0));
                                var cT = tierIdx === 3 ? rc3 : (tierIdx === 2 ? rc2 : (tierIdx === 1 ? rc1 : rc0));
                                arrT[cT++] = pv.sx - subSz * 0.5; arrT[cT++] = pv.sy - subSz * 0.5; arrT[cT++] = subSz; arrT[cT++] = subSz;
                                if (tierIdx === 3) rc3 = cT;
                                else if (tierIdx === 2) rc2 = cT;
                                else if (tierIdx === 1) rc1 = cT;
                                else rc0 = cT;
                            }

                            if (flag === 1 && pv.ac > 0 && pv.lit > 0.52 && (vi2 & 3) === 0) {
                                gc0 = root.pushStroke(gb0, gc0, pv.sx, pv.sy, vHr, pv.ac);
                            }
                        }
                    }
                }

                // Flush all batched voxel + Braille rects via direct fillRect (bypasses QGrayRaster & QThreadPool!)
                if (rc4 > 0) {
                    ctx.fillStyle = pal.bgVoid38;
                    for (var c4i = 0; c4i < rc4; c4i += 4) ctx.fillRect(rb4[c4i], rb4[c4i + 1], rb4[c4i + 2], rb4[c4i + 3]);
                }
                var subLut = pal.charSubLUT;
                var rcArr = [rc0, rc1, rc2, rc3];
                for (var sbi = 0; sbi < 4; sbi++) {
                    var rCnt = rcArr[sbi];
                    if (rCnt > 0) {
                        var sArr = rb[sbi];
                        ctx.fillStyle = subLut[sbi];
                        for (var rci = 0; rci < rCnt; rci += 4) ctx.fillRect(sArr[rci], sArr[rci + 1], sArr[rci + 2], sArr[rci + 3]);
                    }
                }
                if (rc5 > 0) {
                    ctx.fillStyle = pal.acc36;
                    for (var c5i = 0; c5i < rc5; c5i += 4) ctx.fillRect(rb5[c5i], rb5[c5i + 1], rb5[c5i + 2], rb5[c5i + 3]);
                }

                // Flush bright directional ASCII contour vector micro-strokes (1 stroke total, fast butt caps!)
                if (gc0 > 0) {
                    ctx.lineWidth = Math.max(0.95, 1.15 * sc);
                    ctx.strokeStyle = pal.cssSpecular;
                    ctx.beginPath();
                    for (var g0i = 0; g0i < gc0; g0i += 4) { ctx.moveTo(gb0[g0i], gb0[g0i + 1]); ctx.lineTo(gb0[g0i + 2], gb0[g0i + 3]); }
                    ctx.stroke();
                }

                // 6E. Mode-Specific Live Action Streams Around 1nc0gn30 (Rising Braille Tokens / Laser Locks)
                if (root.activePose === "type" || mode === "matrix") {
                    var tkMasks = [0xFF, 0xFE, 0xF7, 0x3F, 0x07, 0x0B, 0xE4, 0x9B];
                    var tkT = (t * 6) | 0;
                    var tb0 = root.wmSubBatches[0], tc0 = 0;
                    var tb1 = root.wmSubBatches[1], tc1 = 0;
                    var tkDot = 1.45 * sc, tkDx = 1.4 * sc, tkDy = 1.5 * sc;
                    for (var tk = 0; tk < 12; tk++) {
                        var tkProg = ((t * 0.55 + tk * 0.083) % 1.0);
                        var tkAngle = tk * 0.52 + t * 0.4;
                        var tkX = pedX + Math.cos(tkAngle) * (58 + tk * 4) * sc - 22 * sc;
                        var tkY = figCenterY + 30 * sc - tkProg * 155 * sc;
                        var tkM = tkMasks[(tk * 3 + tkT) % tkMasks.length];
                        if (tk % 2 === 0) tc0 = root.pushBraille(tb0, tc0, tkX, tkY, tkDot, tkDx, tkDy, tkM);
                        else tc1 = root.pushBraille(tb1, tc1, tkX, tkY, tkDot, tkDx, tkDy, tkM);
                    }
                    if (tc0 > 0) {
                        ctx.fillStyle = pal.acc74;
                        for (var tki0 = 0; tki0 < tc0; tki0 += 4) ctx.fillRect(tb0[tki0], tb0[tki0 + 1], tb0[tki0 + 2], tb0[tki0 + 3]);
                    }
                    if (tc1 > 0) {
                        ctx.fillStyle = pal.spec88;
                        for (var tki1 = 0; tki1 < tc1; tki1 += 4) ctx.fillRect(tb1[tki1], tb1[tki1 + 1], tb1[tki1 + 2], tb1[tki1 + 3]);
                    }
                } else if (mode === "ghost") {
                    // Crimson stealth laser tracer lines locking 1nc0gn30 to Tor geodesic nodes (batched)
                    ctx.lineWidth = 0.85 * sc;
                    ctx.strokeStyle = pal.pri28;
                    ctx.beginPath();
                    for (var lt = 0; lt < 3; lt++) {
                        var lAng = t * 0.35 + lt * 2.1;
                        ctx.moveTo(pedX - 30 * sc, figCenterY - 20 * sc + lt * 28 * sc);
                        ctx.lineTo(centerX + Math.cos(lAng) * 210 * sc, zBobY + Math.sin(lAng) * 120 * sc);
                    }
                    ctx.stroke();
                }

                // 6F. Direct fillRect Orbiting Motes on Waist-Height Ring (static ellipses baked in backdropCanvas)
                var cwW = Math.cos(waistRot), swW = Math.sin(waistRot);
                ctx.fillStyle = pal.spec88;
                for (var om = 0; om < 6; om++) {
                    var oAng = t * 0.85 + om * (Math.PI / 3.0);
                    if (Math.sin(oAng) >= 0) {
                        var ox0 = Math.cos(oAng) * 128 * sc;
                        var oy0 = Math.sin(oAng) * 28 * sc;
                        var mox = pedX + ox0 * cwW - oy0 * swW;
                        var moy = waistY + ox0 * swW + oy0 * cwW;
                        ctx.fillRect(mox - 2.2 * sc, moy - 2.2 * sc, 4.4 * sc, 4.4 * sc);
                    }
                }
            }

            // ════════════════════════════════════════════════════════════════
            // PASS 7: INTERACTIVE CURSOR RETICLE, COMET TRAIL & SHOCKWAVE RINGS
            // ════════════════════════════════════════════════════════════════
            var waves = root.shockwaves;
            for (var swi = 0; swi < waves.length; swi++) {
                var wv = waves[swi];
                if (wv.life > 0.01) {
                    var prog = 1.0 - wv.life;
                    var wRad = (24 + prog * 340 * wv.strength) * sc;
                    ctx.lineWidth = (2.2 * wv.life + 0.6) * sc;
                    ctx.strokeStyle = swi % 2 === 0 ? pal.pri55 : pal.acc56;
                    ctx.beginPath();
                    ctx.arc(wv.x * sceneCanvas.resScale, wv.y * sceneCanvas.resScale, wRad, 0, Math.PI * 2.0);
                    ctx.stroke();
                }
            }

            // Reality-Shift Subtle Sanctuary Pulse Ring when switching ZothOS modes
            if (vortexBurst > 0.01) {
                var vRad = (90 + morph * 270) * sc;
                ctx.lineWidth = (2.4 * vortexBurst) * sc;
                ctx.strokeStyle = pal.spec55;
                ctx.beginPath();
                ctx.arc(centerX, zBobY, vRad, 0, Math.PI * 2.0);
                ctx.stroke();
            }

            // Mode-Distinct Interactive Cursor Signature (only when actively interacting on desktop)
            if (root.cursorActivity > 0.22) {
                var trail = root.cometTrail;
                ctx.lineWidth = 1.6 * sc;
                ctx.strokeStyle = pal.cssPrimary;
                ctx.beginPath();
                for (var ti = 0; ti < trail.length - 1; ti++) {
                    var tp0 = trail[ti];
                    var tp1 = trail[ti + 1];
                    ctx.moveTo(tp0.x * sceneCanvas.resScale, tp0.y * sceneCanvas.resScale);
                    ctx.lineTo(tp1.x * sceneCanvas.resScale, tp1.y * sceneCanvas.resScale);
                }
                ctx.stroke();
            }

            if (root.cursorActivity > 0.22) {
                ctx.lineWidth = 1.15 * sc;
                ctx.strokeStyle = root.cursorActivity > 0.25 ? pal.pri72 : pal.pri36;
                if (mode === "gold") {
                    ctx.beginPath();
                    ctx.arc(mx, my, (16 + root.cursorActivity * 6) * sc, t * 1.4, t * 1.4 + Math.PI * 1.35);
                    ctx.stroke();
                } else if (mode === "ghost") {
                    var dSz = (14 + root.cursorActivity * 5) * sc;
                    ctx.beginPath();
                    ctx.moveTo(mx, my - dSz);
                    ctx.lineTo(mx + dSz, my);
                    ctx.lineTo(mx, my + dSz);
                    ctx.lineTo(mx - dSz, my);
                    ctx.closePath();
                    ctx.stroke();
                } else if (mode === "matrix") {
                    var bSz = 13 * sc;
                    ctx.strokeRect(mx - bSz, my - bSz, bSz * 2, bSz * 2);
                } else {
                    ctx.strokeStyle = root.cursorActivity > 0.25 ? pal.acc56 : pal.acc28;
                    ctx.beginPath();
                    ctx.arc(mx, my, (18 + root.cursorActivity * 8) * sc, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }
    }

    // ── 7C. GPU-Cached Native QML HUD Text Overlays (Throttled, Zero Per-Frame Bindings) ──
    Text {
        id: wordmarkSubText
        readonly property real sc: Math.min(Math.max(1, root.width) / 1920.0, Math.max(1, root.height) / 1080.0)
        readonly property var prof: root.modeProfiles[root.currentMode] || root.modeProfiles["gold"]
        x: root.width * 0.475 - width * 0.5
        y: (root.height * 0.740 + 48.05 * sc) - height * 0.5
        text: "⣿  " + prof.label + "  ⣿"
        color: root.rgbaArr(prof.primary, 0.72)
        font.family: "monospace"
        font.pixelSize: Math.max(9, Math.round(10.5 * sc))
        renderType: Text.QtRendering
        visible: root.width >= 64 && root.height >= 64
        z: 10
    }

    Text {
        id: charPedestalText
        readonly property real sc: Math.min(Math.max(1, root.width) / 1920.0, Math.max(1, root.height) / 1080.0)
        readonly property var prof: root.modeProfiles[root.currentMode] || root.modeProfiles["gold"]
        x: root.width * 0.808 - width * 0.5
        y: (root.height * 0.828 + 42 * sc) - height * 0.5
        text: prof.charTag + "  ·  POSE:" + root.activePose.toUpperCase() + "  ·  " + root.displayYawDeg + "°"
        color: root.rgbaArr(prof.primary, 0.72)
        font.family: "monospace"
        font.pixelSize: Math.max(8, Math.round(9.5 * sc))
        renderType: Text.QtRendering
        visible: root.width >= 64 && root.height >= 64
        z: 10
    }

    // ── 8. Non-Intrusive Local Desktop Hover & Click Tracking ───────────────
    MouseArea {
        anchors.fill: parent
        hoverEnabled: true
        acceptedButtons: Qt.LeftButton | Qt.RightButton

        onPositionChanged: (mouse) => {
            root.rawMouseX = mouse.x;
            root.rawMouseY = mouse.y;
            root.lastLocalMouseTime = Date.now();
            mouse.accepted = false;
        }

        onPressed: (mouse) => {
            root.rawMouseX = mouse.x;
            root.rawMouseY = mouse.y;
            root.lastLocalMouseTime = Date.now();
            root.cursorActivity = 1.0;
            root.spawnShockwave(mouse.x, mouse.y, 1.25);
            mouse.accepted = false;
        }
    }

    // ── 9. Global Compositor Cursor & Live Reality-Mode Poller (:9989) ──────
    Timer {
        id: daemonPollTimer
        interval: 1200
        running: true
        repeat: true

        onTriggered: {
            if (root.xhrInFlight) return;
            var now = Date.now();
            var localFresh = (now - root.lastLocalMouseTime) < 160;
            // Always poll at least every 800ms so zoth-mode CLI switches trigger cleanly without foreground churn
            if (localFresh && (now - root.lastModePollTime) < 800) return;

            root.xhrInFlight = true;
            root.lastModePollTime = now;
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "http://127.0.0.1:9989/");
            xhr.timeout = 180;
            xhr.onreadystatechange = function() {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    root.xhrInFlight = false;
                    if (xhr.status === 200 && xhr.responseText) {
                        try {
                            var data = JSON.parse(xhr.responseText);
                            if (data && data.mode) {
                                root.applyModeSwitch(data.mode);
                            }
                            if (!localFresh && data && typeof data.x === "number" && typeof data.y === "number" && root.width > 0 && root.height > 0) {
                                var lx = ((data.x % root.width) + root.width) % root.width;
                                var ly = ((data.y % root.height) + root.height) % root.height;
                                if (Math.abs(lx - root.rawMouseX) > 2.0 || Math.abs(ly - root.rawMouseY) > 2.0) {
                                    root.cursorActivity = Math.max(root.cursorActivity, 0.14);
                                }
                                root.rawMouseX = lx;
                                root.rawMouseY = ly;
                            }
                        } catch (e) {}
                    }
                }
            };
            xhr.send();
        }
    }

    // ── 10. Adaptive Zero-GC Physics & Frame Scheduler ──────────────────────
    Timer {
        id: frameTimer
        interval: (root.cursorActivity > 0.28 || root.modeMorph < 1.0) ? 75 : 185
        running: true
        repeat: true

        onTriggered: {
            var now = Date.now();
            var dt = root.lastFrameTime > 0 ? Math.min((now - root.lastFrameTime) / 1000.0, 0.08) : 0.025;
            root.lastFrameTime = now;

            root.worldTime += dt;
            root.veinPulse = (root.veinPulse + dt * (0.34 + root.cursorActivity * 0.25)) % 1.0;

            root.sheenWave += dt * (0.28 + root.cursorActivity * 0.22);
            if (root.sheenWave > 1.55) root.sheenWave = -0.35;

            if (root.modeMorph < 1.0) {
                root.modeMorph = root.modeSwitchMs > 0 ? Math.min(1.0, (now - root.modeSwitchMs) / 680.0) : 1.0;
                root.backdropDirty = true;
            }
            if (root.poseMorph < 1.0) {
                root.poseMorph = Math.min(1.0, root.poseMorph + dt * 1.9);
            }

            root.frameTickCount = (root.frameTickCount + 1) & 1023;
            if ((root.frameTickCount & 15) === 0 && root.width > 0) {
                var pSwirlH = root.poseMorph < 0.999 ? Math.sin(root.poseMorph * Math.PI) : 0.0;
                var lookDxH = (root.smoothMouseX - root.width * 0.808) / (root.width * 0.6);
                var yawRadH = -0.21 + Math.sin(root.worldTime * 0.48) * 0.18 + lookDxH * 0.34 + pSwirlH * 1.65 + ((root.activePose === "walk" && root.walkDir > 0) ? 0.25 : 0.0);
                root.displayYawDeg = Math.round(((yawRadH * 180.0 / Math.PI) % 360 + 360) % 360);
            }

            // Critically damped silk cursor smoothing
            var damp = 1.0 - Math.exp(-14.0 * dt);
            root.smoothMouseX += (root.rawMouseX - root.smoothMouseX) * damp;
            root.smoothMouseY += (root.rawMouseY - root.smoothMouseY) * damp;

            var dx = root.smoothMouseX - root.prevSmoothX;
            var dy = root.smoothMouseY - root.prevSmoothY;
            var spd = Math.sqrt(dx * dx + dy * dy);
            root.cursorVx = dx;
            root.cursorVy = dy;
            root.cursorSpeed = spd;
            root.prevSmoothX = root.smoothMouseX;
            root.prevSmoothY = root.smoothMouseY;

            var targetAct = Math.min(spd / 11.0, 1.0);
            if (targetAct > root.cursorActivity) {
                root.cursorActivity += (targetAct - root.cursorActivity) * 0.35;
            } else {
                root.cursorActivity *= Math.exp(-2.2 * dt);
                if (root.cursorActivity < 0.03) root.cursorActivity = 0.03;
            }

            // Shift comet trail ring buffer in-place
            var tr = root.cometTrail;
            for (var ti = tr.length - 1; ti > 0; ti--) {
                tr[ti].x = tr[ti - 1].x;
                tr[ti].y = tr[ti - 1].y;
            }
            if (tr.length > 0) {
                tr[0].x = root.smoothMouseX;
                tr[0].y = root.smoothMouseY;
            }

            // Decay shockwaves
            var sws = root.shockwaves;
            for (var wi = 0; wi < sws.length; wi++) {
                if (sws[wi].life > 0.005) {
                    sws[wi].life *= Math.exp(-2.8 * dt);
                    if (sws[wi].life < 0.01) sws[wi].life = 0.0;
                }
            }

            // Drift golden constellation nodes gently
            var spks = root.ambientSparks;
            for (var si = 0; si < spks.length; si++) {
                var sp = spks[si];
                sp.x += sp.vx * dt;
                sp.y += sp.vy * dt;
                if (sp.x < 0.0) sp.x += 1.0;
                else if (sp.x > 1.0) sp.x -= 1.0;
                if (sp.y < 0.0) sp.y += 1.0;
                else if (sp.y > 1.0) sp.y -= 1.0;
            }

            // 1nc0gn30 Autonomous Pose Choreography + High-Velocity Cursor Sprint
            if (spd > 18.0) {
                root.lastSprintMs = now;
                if (Math.abs(dx) > 1.5) root.walkDir = dx > 0 ? 1 : -1;
                if (root.activePose !== "walk") {
                    root.switchCharPose("walk");
                }
            } else if (root.activePose === "walk" && (now - root.lastSprintMs) > 950) {
                root.switchCharPose(root.currentMode === "matrix" ? "type" : "hero");
            } else if ((now - root.lastPoseSwitchMs) > 14000) {
                root.poseCycleIdx = (root.poseCycleIdx + 1) % root.poseCycleOrder.length;
                var candidate = root.poseCycleOrder[root.poseCycleIdx];
                if (root.currentMode === "matrix" && root.poseCycleIdx % 2 === 0) {
                    candidate = "type";
                }
                root.switchCharPose(candidate);
            }

            if (root.backdropDirty) backdropCanvas.requestPaint();
            sceneCanvas.requestPaint();
        }
    }

    // ── 11. One-Time Procedural 3D Geometry & Pool Construction ─────────────
    Component.onCompleted: {
        var modeKeys = ["gold", "ghost", "matrix", "incognito"];
        var cpMap = {};
        for (var mk = 0; mk < modeKeys.length; mk++) {
            var mName = modeKeys[mk];
            cpMap[mName] = root.buildPaletteStrings(root.modeProfiles[mName]);
        }
        root.cachedPalettes = cpMap;

        if (root.configuration && root.configuration.realityMode) {
            var initM = root.normalizeMode(root.configuration.realityMode);
            root.currentMode = initM;
            root.prevMode = initM;
        }
        root.lastPoseSwitchMs = Date.now();
        root.backdropDirty = true;

        // A. Build Sculpted Beveled 3D Hermetic "Z" Relic (Outer Rim + Mitered Raised Crown + Crossbar)
        var outerZ = [
            [-0.78, -0.78], [ 0.78, -0.78], [ 0.78, -0.48], [-0.22,  0.48],
            [ 0.54,  0.48], [ 0.54,  0.28], [ 0.78,  0.28], [ 0.78,  0.78],
            [-0.78,  0.78], [-0.78,  0.48], [ 0.22, -0.48], [-0.54, -0.48],
            [-0.54, -0.28], [-0.78, -0.28]
        ];
        var N = outerZ.length;
        var edgeInNormals = [];
        for (var i = 0; i < N; i++) {
            var pA = outerZ[i];
            var pB = outerZ[(i + 1) % N];
            var edx = pB[0] - pA[0];
            var edy = pB[1] - pA[1];
            var el = Math.sqrt(edx * edx + edy * edy);
            // Clockwise in screen coords (+X right, +Y down) -> inward normal is (-dy, dx)
            edgeInNormals.push([-edy / el, edx / el]);
        }

        var inset = 0.068;
        var crownZ = [];
        for (var j = 0; j < N; j++) {
            var nPrev = edgeInNormals[(j - 1 + N) % N];
            var nCurr = edgeInNormals[j];
            var bx = nPrev[0] + nCurr[0];
            var by = nPrev[1] + nCurr[1];
            var bl = Math.sqrt(bx * bx + by * by);
            if (bl < 0.001) {
                bx = nCurr[0]; by = nCurr[1]; bl = 1.0;
            } else {
                bx /= bl; by /= bl;
            }
            var dot = bx * nCurr[0] + by * nCurr[1];
            var miter = inset / Math.max(0.45, dot);
            crownZ.push([outerZ[j][0] + bx * miter, outerZ[j][1] + by * miter]);
        }

        var zVerts = [];
        // 0..N-1: Outer Front (z = +0.19)
        for (var k = 0; k < N; k++) zVerts.push([outerZ[k][0], outerZ[k][1],  0.19]);
        // N..2N-1: Outer Back (z = -0.19)
        for (var k2 = 0; k2 < N; k2++) zVerts.push([outerZ[k2][0], outerZ[k2][1], -0.19]);
        // 2N..3N-1: Raised Crown Front (z = +0.32)
        for (var k3 = 0; k3 < N; k3++) zVerts.push([crownZ[k3][0], crownZ[k3][1],  0.32]);
        // 3N..4N-1: Raised Crown Back (z = -0.30)
        for (var k4 = 0; k4 < N; k4++) zVerts.push([crownZ[k4][0], crownZ[k4][1], -0.30]);

        var zFaces = [];
        for (var s = 0; s < N; s++) {
            var sn = (s + 1) % N;
            var outNx = -edgeInNormals[s][0];
            var outNy = -edgeInNormals[s][1];
            // Outer extruded side wall
            zFaces.push({ idx: [N + s, N + sn, sn, s], n: [outNx, outNy, 0.0], kind: 0 });
            // Front 45-deg jewel bevel
            zFaces.push({ idx: [s, sn, 2 * N + sn, 2 * N + s], n: [outNx * 0.68, outNy * 0.68, 0.73], kind: 1 });
            // Back bevel
            zFaces.push({ idx: [N + sn, N + s, 3 * N + s, 3 * N + sn], n: [outNx * 0.68, outNy * 0.68, -0.73], kind: 1 });
        }

        // Front & Back Crown Faces (decomposed into clean convex quads so Context2D fills 100% cleanly)
        // Top Left Spur, Top Bar, Diagonal Spine, Bottom Bar, Bottom Right Spur
        var crownParts = [
            [13, 0, 11, 12], // top-left serif spur
            [0, 1, 2, 10, 11], // top horizontal bar
            [10, 2, 3, 9],   // diagonal Z stroke
            [9, 3, 4, 7, 8], // bottom horizontal bar
            [5, 6, 7, 4]     // bottom-right serif spur
        ];
        for (var cp = 0; cp < crownParts.length; cp++) {
            var part = crownParts[cp];
            var fIdx = [], bIdx = [];
            for (var pi = 0; pi < part.length; pi++) {
                fIdx.push(2 * N + part[pi]);
                bIdx.push(3 * N + part[part.length - 1 - pi]);
            }
            zFaces.push({ idx: fIdx, n: [0, 0, 1], kind: 2 });
            zFaces.push({ idx: bIdx, n: [0, 0, -1], kind: 2 });
        }

        // Sculpted 3D Hermetic Central Crossbar Prism across the Z diagonal (Ƶ)
        var cbBase = zVerts.length;
        var cbRectO = [[-0.43, -0.072], [0.43, -0.072], [0.43, 0.072], [-0.43, 0.072]];
        var cbRectC = [[-0.38, -0.042], [0.38, -0.042], [0.38, 0.042], [-0.38, 0.042]];
        for (var cbi = 0; cbi < 4; cbi++) zVerts.push([cbRectO[cbi][0], cbRectO[cbi][1], 0.24]);
        for (var cbi2 = 0; cbi2 < 4; cbi2++) zVerts.push([cbRectC[cbi2][0], cbRectC[cbi2][1], 0.39]);
        var cbNorms = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        for (var cbs = 0; cbs < 4; cbs++) {
            var cbsn = (cbs + 1) % 4;
            zFaces.push({
                idx: [cbBase + cbs, cbBase + cbsn, cbBase + 4 + cbsn, cbBase + 4 + cbs],
                n: [cbNorms[cbs][0] * 0.65, cbNorms[cbs][1] * 0.65, 0.76],
                kind: 3
            });
        }
        zFaces.push({ idx: [cbBase + 4, cbBase + 5, cbBase + 6, cbBase + 7], n: [0, 0, 1], kind: 3 });

        root.zRelicGeo = {
            verts: zVerts,
            faces: zFaces,
            spine: [
                [-0.66, -0.34, 0.34],
                [-0.66, -0.63, 0.34],
                [ 0.56, -0.63, 0.34],
                [-0.56,  0.63, 0.34],
                [ 0.66,  0.63, 0.34],
                [ 0.66,  0.34, 0.34]
            ]
        };

        // B. Build 9x11 Architectural "ZOTHOS" Wordmark Lattice Grid (with Sobel Rim Flags)
        var glyphs9x11 = {
            "Z": [
                "111111111",
                "111111111",
                "110000111",
                "000001110",
                "000011100",
                "000111000",
                "001110000",
                "011100000",
                "111000011",
                "111111111",
                "111111111"
            ],
            "O": [
                "011111110",
                "111111111",
                "111000111",
                "110000011",
                "110000011",
                "110000011",
                "110000011",
                "110000011",
                "111000111",
                "111111111",
                "011111110"
            ],
            "T": [
                "111111111",
                "111111111",
                "110111011",
                "000111000",
                "000111000",
                "000111000",
                "000111000",
                "000111000",
                "000111000",
                "000111000",
                "001111100"
            ],
            "H": [
                "111000111",
                "111000111",
                "111000111",
                "111000111",
                "111111111",
                "111111111",
                "111000111",
                "111000111",
                "111000111",
                "111000111",
                "111000111"
            ],
            "S": [
                "011111110",
                "111111111",
                "111000011",
                "111000000",
                "111111100",
                "011111110",
                "000011111",
                "000000111",
                "110000111",
                "111111111",
                "011111110"
            ]
        };

        var word = ["Z", "O", "T", "H", "O", "S"];
        var cells = [];
        for (var li = 0; li < word.length; li++) {
            var bmp = glyphs9x11[word[li]];
            var colOffset = li * 12; // 9 cols + 3 col tracking
            for (var r = 0; r < 11; r++) {
                for (var c = 0; c < 9; c++) {
                    if (bmp[r].charAt(c) !== "1") continue;
                    var topEmpty = (r === 0) || (bmp[r - 1].charAt(c) !== "1");
                    var leftEmpty = (c === 0) || (bmp[r].charAt(c - 1) !== "1");
                    var rightEmpty = (c === 8) || (bmp[r].charAt(c + 1) !== "1");
                    cells.push({
                        gx: colOffset + c,
                        gy: r,
                        letterIdx: li,
                        topEdge: topEmpty,
                        leftEdge: leftEmpty,
                        rightEdge: rightEmpty
                    });
                }
            }
        }
        root.wordmarkCells = cells;

        // C. Build 3D Geodesic Tor Onion Relay Sphere (Subdivided Icosahedron for Ghostmode)
        var phi = (1.0 + Math.sqrt(5.0)) * 0.5;
        var rawIco = [
            [-1,  phi, 0], [ 1,  phi, 0], [-1, -phi, 0], [ 1, -phi, 0],
            [0, -1,  phi], [0,  1,  phi], [0, -1, -phi], [0,  1, -phi],
            [ phi, 0, -1], [ phi, 0,  1], [-phi, 0, -1], [-phi, 0,  1]
        ];
        var gVerts = [];
        for (var iv = 0; iv < rawIco.length; iv++) {
            var il = Math.sqrt(rawIco[iv][0]*rawIco[iv][0] + rawIco[iv][1]*rawIco[iv][1] + rawIco[iv][2]*rawIco[iv][2]);
            gVerts.push([rawIco[iv][0] / il, rawIco[iv][1] / il, rawIco[iv][2] / il]);
        }
        var baseVertCount = gVerts.length;
        var gEdges = [];
        for (var ia = 0; ia < baseVertCount; ia++) {
            for (var ib = ia + 1; ib < baseVertCount; ib++) {
                var dxI = gVerts[ia][0] - gVerts[ib][0];
                var dyI = gVerts[ia][1] - gVerts[ib][1];
                var dzI = gVerts[ia][2] - gVerts[ib][2];
                var distI = Math.sqrt(dxI*dxI + dyI*dyI + dzI*dzI);
                if (distI < 1.25) {
                    var mid = [
                        (gVerts[ia][0] + gVerts[ib][0]) * 0.5,
                        (gVerts[ia][1] + gVerts[ib][1]) * 0.5,
                        (gVerts[ia][2] + gVerts[ib][2]) * 0.5
                    ];
                    var ml = Math.sqrt(mid[0]*mid[0] + mid[1]*mid[1] + mid[2]*mid[2]);
                    var mIdx = gVerts.length;
                    gVerts.push([mid[0] / ml, mid[1] / ml, mid[2] / ml]);
                    gEdges.push([ia, mIdx]);
                    gEdges.push([mIdx, ib]);
                }
            }
        }
        var gProj = [];
        for (var gp = 0; gp < gVerts.length; gp++) gProj.push([0, 0, 0]);
        root.geodesicMesh = { verts: gVerts, edges: gEdges, proj: gProj };

        // C2. Build 2x2x2 Outer 3D Lattice Cube (8 corner verts, 12 edges)
        var latV = [];
        var latE = [];
        var latP = [];
        var LSteps = 1;
        for (var li3 = 0; li3 <= LSteps; li3++) {
            for (var lj3 = 0; lj3 <= LSteps; lj3++) {
                for (var lk3 = 0; lk3 <= LSteps; lk3++) {
                    latV.push([li3 * 2 - 1, lj3 * 2 - 1, lk3 * 2 - 1]);
                    latP.push([0, 0, 0]);
                    var curId = (li3 * 2 + lj3) * 2 + lk3;
                    if (li3 < LSteps) latE.push([curId, ((li3 + 1) * 2 + lj3) * 2 + lk3]);
                    if (lj3 < LSteps) latE.push([curId, (li3 * 2 + lj3 + 1) * 2 + lk3]);
                    if (lk3 < LSteps) latE.push([curId, (li3 * 2 + lj3) * 2 + lk3 + 1]);
                }
            }
        }
        root.latticeGeo = { verts: latV, edges: latE, proj: latP };

        // D. Pre-allocate Ambient Constellation / Spark Pool, Matrix 3D Rain, Shockwaves & Trail
        var spList = [];
        for (var sp = 0; sp < 46; sp++) {
            spList.push({
                x: ((sp * 0.6180339) % 1.0),
                y: ((sp * 0.381966 + 0.13) % 1.0),
                vx: (((sp % 5) - 2) * 0.0035),
                vy: (((sp % 3) - 1) * 0.0025),
                sz: (sp % 4 === 0) ? 2.4 : 1.5,
                depth: 0.3 + (sp % 5) * 0.16,
                phase: sp * 0.85
            });
        }
        root.ambientSparks = spList;

        var mCols = [];
        for (var mc = 0; mc < 32; mc++) {
            var dLayer = (mc % 3) * 0.38 + 0.24;
            mCols.push({
                x: (mc + 0.5) / 32.0,
                y: ((mc * 0.417) % 1.0),
                speed: 0.09 + dLayer * 0.16 + (mc % 4) * 0.02,
                depth: dLayer,
                len: 7 + (mc % 5)
            });
        }
        root.matrixColumns = mCols;

        var swPool = [];
        for (var sw = 0; sw < 5; sw++) {
            swPool.push({ x: 960, y: 540, life: 0.0, strength: 1.0 });
        }
        root.shockwaves = swPool;

        var trPool = [];
        for (var tp = 0; tp < 14; tp++) {
            trPool.push({ x: 960, y: 540 });
        }
        root.cometTrail = trPool;

        // E. Pre-decode Unicode U+2800 Braille masks (v[10]), ASCII contour codes (v[11]) & build compact front-shell vRender/eRender
        var poseNames = ["hero", "front", "threeQuarter", "side", "back", "type", "walk"];
        var rigInit = Character3DData.char3DRig;
        if (rigInit) {
            for (var pni = 0; pni < poseNames.length; pni++) {
                var pObj = rigInit[poseNames[pni]];
                if (!pObj || !pObj.v) continue;
                var pvArr = pObj.v;
                var vRender = [];
                var oldToNew = [];
                for (var pvi = 0; pvi < pvArr.length; pvi++) {
                    var vEntry = pvArr[pvi];
                    var bCode = vEntry[8] ? vEntry[8].charCodeAt(0) : 0;
                    vEntry[10] = (bCode >= 0x2800 && bCode <= 0x28FF) ? (bCode - 0x2800) : 0xDB;
                    var aCh = vEntry[9];
                    vEntry[11] = aCh === "/" ? 1 : (aCh === "\\" ? 2 : (aCh === "|" ? 3 : ((aCh === "-" || aCh === "=") ? 4 : ((aCh === "+" || aCh === "#" || aCh === "*" || aCh === "%") ? 5 : 0))));
                    var fl = vEntry[7];
                    var keep = (fl === 2 || fl === 3 || (fl === 1 && vEntry[2] <= 0.02 && (pvi % 3 !== 0)) || (fl === 0 && vEntry[2] <= -0.02 && (pvi & 3) === 0));
                    if (keep) {
                        oldToNew[pvi] = vRender.length;
                        vRender.push(vEntry);
                    } else {
                        oldToNew[pvi] = -1;
                    }
                }
                pObj.vRender = vRender;
                var peArr = pObj.e || [];
                var eRender = [];
                for (var pei = 0; pei < peArr.length; pei += 2) {
                    var ea = oldToNew[peArr[pei][0]];
                    var eb = oldToNew[peArr[pei][1]];
                    if (ea >= 0 && eb >= 0) eRender.push([ea, eb]);
                }
                pObj.eRender = eRender;
            }
        }

        // Pre-allocate Zero-GC 1nc0gn30 Voxel Projection Pool & 16 Depth Buckets
        var cPool = [];
        for (var cp2 = 0; cp2 < 1600; cp2++) {
            cPool.push({
                sx: 0, sy: 0, z: 0, ps: 1, lit: 0, sanctum: 0,
                bayer: 0, flag: 0, bm: 0xDB, ac: 0, ly: 0
            });
        }
        root.charProjPool = cPool;

        var dBuckets = [];
        var dCounts = [];
        for (var db = 0; db < 16; db++) {
            dBuckets.push([]);
            dCounts.push(0);
        }
        root.depthBuckets = dBuckets;
        root.depthCounts = dCounts;

        root.backdropDirty = true;
        backdropCanvas.requestPaint();
    }
}
