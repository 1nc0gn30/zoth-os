import QtQuick
import org.kde.plasma.plasmoid
import org.kde.plasma.core as PlasmaCore
import "HologramData.js" as HologramData
import "CharacterBoardData.js" as CharacterBoardData

WallpaperItem {
    id: root

    // Configuration parameters
    readonly property real maxTilt: 24.0
    readonly property real influenceRadius: 650.0
    readonly property bool showEmbers: true

    // Cursor tracking state
    property real rawMouseX: root.width > 0 ? root.width / 2 : 960
    property real rawMouseY: root.height > 0 ? root.height / 2 : 540
    property real smoothMouseX: rawMouseX
    property real smoothMouseY: rawMouseY
    property real trailMouseX: rawMouseX
    property real trailMouseY: rawMouseY
    property real prevSmoothX: rawMouseX
    property real prevSmoothY: rawMouseY
    property real cursorVelocityX: 0.0
    property real cursorVelocityY: 0.0
    property real cursorSpeed: 0.0
    property real cursorActivity: 0.20
    property double lastLocalMouseTime: 0
    property double lastFrameTime: 0
    property real breathingPhase: 0.0
    property real sacredRotation: 0.0
    property real sheenProgress: -0.4

    // Shockwave Ring Pool (4 expanding pulse rings on click or whip-burst)
    readonly property int waveCount: 4
    property int waveHead: 0
    property var waveItems: []
    property double lastWhipWaveTime: 0

    // Constellation ley-line nodes & twinkling pixel stars
    readonly property int nodeCount: 26
    property var constellationNodes: []
    property var twinkleStars: []

    // Mathematical Constants & Bayer Matrix
    readonly property var bayer4: [
        0.03125, 0.53125, 0.15625, 0.65625,
        0.78125, 0.28125, 0.90625, 0.40625,
        0.21875, 0.71875, 0.09375, 0.59375,
        0.96875, 0.46875, 0.84375, 0.34375
    ]

    // 1. Moving Metallic Gold Pixel Blocks
    property var goldPixelBlocks: []

    // 2. Centerpiece: True 3D Volumetric Sculpted Monolith "Z" Mesh
    property var zMonolithMesh: null

    // 3. Floating Braille/ASCII sparks pool
    property var brailleSparks: []

    // 4. Pre-computed active pixel coordinates for ZOTHOS wordmark
    property var wordmarkPixels: []

    // 1nc0gn30 Hooded Builder Stage active pose state
    property string activePoseName: "hero"
    property string activePoseTag: "1NC0GN30 · SENTINEL"

    function triggerShockwave(wx, wy, intensityScale) {
        if (root.waveItems.length === 0) {
            var wList = [];
            for (var wk = 0; wk < root.waveCount; wk++) {
                var wItm = waveRepeater.itemAt(wk);
                if (wItm) wList.push(wItm);
            }
            if (wList.length === root.waveCount) root.waveItems = wList;
        }
        if (root.waveItems.length === root.waveCount) {
            var w = root.waveItems[root.waveHead];
            if (w) {
                w.wx = wx;
                w.wy = wy;
                w.wLife = 1.0;
                w.wMaxRadius = (260 + Math.random() * 140) * (intensityScale || 1.0);
            }
            root.waveHead = (root.waveHead + 1) % root.waveCount;
        }
    }

    // ── 1. Base Obsidian Wallpaper Layer (Subtle Mouse Parallax) ───────────
    Image {
        id: bgImage
        width: parent.width * 1.04
        height: parent.height * 1.04
        x: -parent.width * 0.02 + (root.width / 2 - root.smoothMouseX) * 0.007
        y: -parent.height * 0.02 + (root.height / 2 - root.smoothMouseY) * 0.007
        source: "images/bg.png"
        fillMode: Image.PreserveAspectCrop
        asynchronous: true
        cache: true
    }

    // ── 2. Ambient Golden Nebula Bloom (Coin Image Completely Removed) ─────
    Item {
        id: sacredCenterBackdrop
        anchors.centerIn: parent
        anchors.verticalCenterOffset: -35
        width: Math.min(root.width * 0.48, 560)
        height: width

        property real centerDist: Math.hypot(root.smoothMouseX - (parent.width / 2), root.smoothMouseY - (parent.height / 2 - 35))
        property real centerProximity: Math.max(0.0, 1.0 - centerDist / 650.0)

        // Soft, ethereal central golden bloom breathing in deep space
        Image {
            id: centerBloom
            source: "images/glow.png"
            anchors.centerIn: parent
            width: parent.width * 1.25
            height: width
            opacity: 0.28 + 0.10 * Math.sin(root.breathingPhase * 0.8) + sacredCenterBackdrop.centerProximity * 0.22
            asynchronous: true
            cache: true
        }
    }

    // ── 2B. 1nc0gn30 Hooded Builder Stage (Flanked to the Right of Center) ─
    Item {
        id: characterFlankStage
        x: (parent.width * 0.5) + Math.min(parent.width * 0.25, 480) + (root.smoothMouseX - parent.width * 0.5) * 0.02
        y: (parent.height * 0.44 - 35) - height * 0.5 + (root.smoothMouseY - parent.height * 0.5) * 0.015
        width: 320
        height: 440

        // Holographic Emerald & Gold Halo
        Rectangle {
            anchors.centerIn: parent
            width: parent.width * 0.95
            height: parent.height * 0.95
            radius: 18
            color: "#180d1a12"
            border.color: "#3839d353"
            border.width: 1.5
        }

        // 1nc0gn30 Character Image
        Image {
            id: characterPhotoImg
            anchors.centerIn: parent
            source: "character/" + root.activePoseName + ".jpg"
            width: parent.width * 0.82
            height: parent.height * 0.82
            fillMode: Image.PreserveAspectFit
            asynchronous: true
            opacity: 0.88
            smooth: true
        }

        // 1nc0gn30 High-Contrast Bayer Dither Layer
        Image {
            id: characterDitherImg
            anchors.centerIn: parent
            source: "character/dither-" + root.activePoseName + ".png"
            width: parent.width * 0.82
            height: parent.height * 0.82
            fillMode: Image.PreserveAspectFit
            smooth: false
            asynchronous: true
            opacity: 0.95
        }

        // Holographic Vertical Scan Beam
        Rectangle {
            anchors.fill: characterDitherImg
            color: "transparent"
            clip: true

            Rectangle {
                width: parent.width
                height: 4
                y: ((root.breathingPhase * 75) % parent.height)
                color: "#9939d353"
            }
        }

        // Cybernetic Telemetry Badge under character
        Rectangle {
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.bottom: parent.bottom
            anchors.bottomMargin: 6
            width: charBadgeText.implicitWidth + 28
            height: 24
            radius: 12
            color: "#ee080c0a"
            border.color: "#d4af37"
            border.width: 1.5

            Text {
                id: charBadgeText
                anchors.centerIn: parent
                text: "⣿ " + root.activePoseTag
                font.family: "JetBrains Mono"
                font.pixelSize: 11
                font.bold: true
                color: "#39d353"
            }
        }
    }

    // ── 3. Master GPU Canvas: 3D Z Monolith + Pixel Stars + ZOTHOS Wordmark
    Canvas {
        id: mainGraphicCanvas
        anchors.fill: parent
        renderTarget: Canvas.Image
        renderStrategy: Canvas.Cooperative

        onPaint: {
            var ctx = getContext("2d");
            ctx.clearRect(0, 0, width, height);

            var W = width;
            var H = height;
            if (W <= 100 || H <= 100) return;

            var t = root.breathingPhase;
            var mx = root.smoothMouseX;
            var my = root.smoothMouseY;
            var act = root.cursorActivity;
            var normMx = Math.max(-1.0, Math.min(1.0, (mx - W * 0.5) / (W * 0.5)));
            var normMy = Math.max(-1.0, Math.min(1.0, (my - H * 0.5) / (H * 0.5)));

            // ── A. Ambient Twinkling Pixel Stars Field ─────────────────────
            var stars = root.twinkleStars;
            if (stars && stars.length > 0) {
                for (var ti = 0; ti < stars.length; ti++) {
                    var st = stars[ti];
                    var stWave = Math.sin(t * 1.8 + st.phase);
                    var stAlpha = 0.20 + stWave * 0.25;
                    if (stAlpha > 0.08) {
                        ctx.fillStyle = st.isGold ?
                            "rgba(255, 225, 120, " + Math.min(0.9, stAlpha).toFixed(2) + ")" :
                            "rgba(255, 255, 255, " + Math.min(0.95, stAlpha).toFixed(2) + ")";
                        ctx.fillRect(st.x, st.y, st.sz, st.sz);
                        // Subtle 4-point cross glint on brightest twinkle peak
                        if (stWave > 0.75 && st.sz >= 2.0) {
                            ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
                            ctx.fillRect(st.x - 2, st.y, st.sz + 4, 1);
                            ctx.fillRect(st.x, st.y - 2, 1, st.sz + 4);
                        }
                    }
                }
            }

            // ── B. Moving Metallic Gold Pixel Blocks (Drifting Space) ──────
            var blocks = root.goldPixelBlocks;
            if (blocks && blocks.length > 0) {
                for (var bi = 0; bi < blocks.length; bi++) {
                    var b = blocks[bi];
                    var distM = Math.hypot(mx - (b.x + b.sz * 0.5), my - (b.y + b.sz * 0.5));
                    var mBoost = distM < 240.0 ? (1.0 - distM / 240.0) : 0.0;

                    var bPhase = Math.sin(t * 1.2 + b.phase + (b.x + b.y) * 0.004);
                    var bAlpha = Math.max(0.12, Math.min(0.85, 0.18 + bPhase * 0.12 + mBoost * 0.45));

                    // Metallic Gold Linear Gradient
                    var bGrad = ctx.createLinearGradient(b.x, b.y, b.x + b.sz, b.y + b.sz);
                    if (mBoost > 0.35) {
                        bGrad.addColorStop(0.0, "rgba(255, 253, 240, " + bAlpha.toFixed(2) + ")");
                        bGrad.addColorStop(0.5, "rgba(255, 225, 120, " + bAlpha.toFixed(2) + ")");
                        bGrad.addColorStop(1.0, "rgba(165, 125, 20, " + bAlpha.toFixed(2) + ")");
                    } else {
                        bGrad.addColorStop(0.0, "rgba(255, 232, 158, " + (bAlpha * 0.9).toFixed(2) + ")");
                        bGrad.addColorStop(0.5, "rgba(212, 175, 55, " + (bAlpha * 0.85).toFixed(2) + ")");
                        bGrad.addColorStop(1.0, "rgba(107, 80, 8, " + (bAlpha * 0.75).toFixed(2) + ")");
                    }
                    ctx.fillStyle = bGrad;
                    ctx.fillRect(b.x, b.y, b.sz, b.sz);

                    // 3D Bevel Highlights
                    ctx.fillStyle = "rgba(255, 253, 240, " + (bAlpha * 0.95).toFixed(2) + ")";
                    ctx.fillRect(b.x, b.y, b.sz, 1.0);
                    ctx.fillRect(b.x, b.y, 1.0, b.sz);

                    ctx.fillStyle = "rgba(35, 25, 3, " + (bAlpha * 0.90).toFixed(2) + ")";
                    ctx.fillRect(b.x, b.y + b.sz - 1.0, b.sz, 1.0);
                    ctx.fillRect(b.x + b.sz - 1.0, b.y, 1.0, b.sz);

                    // Bayer 4x4 sub-pixel metallic dither core
                    var bayerThresh = root.bayer4[((bi * 3) & 3) * 4 + ((bi * 5) & 3)];
                    if (bayerThresh > 0.40) {
                        ctx.fillStyle = "rgba(255, 248, 220, " + (bAlpha * 0.50).toFixed(2) + ")";
                        ctx.fillRect(b.x + b.sz * 0.3, b.y + b.sz * 0.3, b.sz * 0.4, b.sz * 0.4);
                    }
                }
            }

            // ── C. 1nc0gn30 Hooded Builder Character Board (Flank Matrix) ──
            var board = CharacterBoardData.characterBoard;
            if (board) {
                var seqs = board.sequences || [];
                var totalCycleDuration = 0;
                for (var si = 0; si < seqs.length; si++) {
                    totalCycleDuration += seqs[si].duration;
                }

                var isSpinningTurntable = Math.abs(normMx) > 0.45;
                var currentLines = null;
                var pKey = "hero";
                var pTag = "1NC0GN30 · SENTINEL";

                if (isSpinningTurntable && board.latticeFrames && board.latticeFrames.length > 0) {
                    var lFrames = board.latticeFrames;
                    var curFrameIdx = (Math.floor(t * 3.2) + Math.floor(normMx * 12.0) + lFrames.length * 40) % lFrames.length;
                    currentLines = lFrames[curFrameIdx];
                    pTag = "TURNTABLE · 360° 3D LATTICE";
                    pKey = "hero";
                } else if (seqs.length > 0) {
                    var cycleT = (t * 0.8) % Math.max(1, totalCycleDuration);
                    var accT = 0;
                    var curSeq = seqs[0];
                    for (var sIdx = 0; sIdx < seqs.length; sIdx++) {
                        accT += seqs[sIdx].duration;
                        if (cycleT <= accT) {
                            curSeq = seqs[sIdx];
                            break;
                        }
                    }
                    pKey = curSeq ? curSeq.pose : "hero";
                    pTag = curSeq ? curSeq.tag : "1NC0GN30";
                    currentLines = (board.braillePoses && board.braillePoses[pKey]) ? board.braillePoses[pKey] : board.braillePoses["hero"];
                }

                if (root.activePoseName !== pKey) root.activePoseName = pKey;
                if (root.activePoseTag !== pTag) root.activePoseTag = pTag;

                if (currentLines && currentLines.length > 0) {
                    var flankOffset = Math.min(W * 0.24, 460);
                    var hcx = W * 0.5 + flankOffset + normMx * 18.0;
                    var hcy = H * 0.44 - 35 + normMy * 12.0;
                    var lineH = 9.8;
                    var startHY = hcy - (currentLines.length * lineH) * 0.5;

                    ctx.font = '9.5px "JetBrains Mono", "DejaVu Sans Mono", monospace';
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";

                    var sweepY = ((t * 0.55) % 1.35) - 0.18;

                    for (var cli = 0; cli < currentLines.length; cli++) {
                        var cLine = currentLines[cli];
                        if (!cLine || cLine.trim().length === 0) continue;

                        var lineNormY = cli / currentLines.length;
                        var scanDist = Math.abs(lineNormY - sweepY);
                        var scanGlow = Math.max(0.0, 1.0 - scanDist * 4.0);
                        var cAlpha = Math.min(0.85, 0.28 + scanGlow * 0.45 + act * 0.15);

                        if (scanGlow > 0.38) {
                            ctx.fillStyle = "rgba(255, 255, 255, " + cAlpha.toFixed(3) + ")";
                        } else if (cli % 4 === 0) {
                            ctx.fillStyle = "rgba(57, 211, 83, " + (cAlpha * 0.90).toFixed(3) + ")";
                        } else {
                            ctx.fillStyle = "rgba(245, 184, 46, " + cAlpha.toFixed(3) + ")";
                        }

                        ctx.fillText(cLine, hcx, startHY + cli * lineH);
                    }
                }
            }

            // ── D. Centerpiece: True 3D Volumetric Sculpted Monolith "Z" ──
            var zModel = root.zMonolithMesh;
            if (zModel && zModel.vertices && zModel.vertices.length > 0) {
                var zcx = W * 0.5;
                var zcy = H * 0.44 - 35;
                var zScale = Math.min(W * 0.17, 235);

                // Fluid continuous yaw and pitch + responsive cursor tracking
                var zYaw = t * 0.38 + normMx * 0.85;
                var zPitch = 0.24 + Math.sin(t * 0.42) * 0.08 + normMy * 0.65;
                var zRoll = -normMx * 0.15;

                var cosY = Math.cos(zYaw), sinY = Math.sin(zYaw);
                var cosX = Math.cos(zPitch), sinX = Math.sin(zPitch);
                var cosZ = Math.cos(zRoll), sinZ = Math.sin(zRoll);

                // Transform 3D vertices
                var worldV = [];
                var projV = [];
                var verts = zModel.vertices;
                for (var vi = 0; vi < verts.length; vi++) {
                    var vp = verts[vi];
                    var vx = vp[0], vy = vp[1], vz = vp[2];
                    // Yaw (around Y)
                    var x1 = vx * cosY - vz * sinY;
                    var z1 = vx * sinY + vz * cosY;
                    // Pitch (around X)
                    var y2 = vy * cosX - z1 * sinX;
                    var z2 = vy * sinX + z1 * cosX;
                    // Roll (around Z)
                    var x3 = x1 * cosZ - y2 * sinZ;
                    var y3 = x1 * sinZ + y2 * cosZ;
                    var z3 = z2;
                    worldV.push([x3, y3, z3]);
                    // Perspective projection
                    var pf = 3.2 / (3.6 + z3);
                    projV.push([zcx + x3 * zScale * pf, zcy + y3 * zScale * pf, z3]);
                }

                // Interactive key light source + cursor point light
                var lx = -0.40 + normMx * 0.35;
                var ly = -0.68 + normMy * 0.35;
                var lz = -0.62;
                var lLen = Math.sqrt(lx * lx + ly * ly + lz * lz);
                lx /= lLen; ly /= lLen; lz /= lLen;

                // Blinn-Phong specular halfway vector
                var hx = lx, hy = ly, hz = lz - 1.0;
                var hLen = Math.sqrt(hx * hx + hy * hy + hz * hz);
                hx /= hLen; hy /= hLen; hz /= hLen;

                // Sort faces by depth (Painter's Algorithm) with Screen-Space Back-Face Culling
                var fDefs = zModel.faces;
                var renderFaces = [];
                for (var fi = 0; fi < fDefs.length; fi++) {
                    var fIdxs = fDefs[fi];
                    var p0 = projV[fIdxs[0]];
                    var p1 = projV[fIdxs[1]];
                    var p2 = projV[fIdxs[2]];

                    // Screen-space 2D cross product for perfect back-face culling (Y-down)
                    var cross2D = (p1[0] - p0[0]) * (p2[1] - p0[1]) - (p1[1] - p0[1]) * (p2[0] - p0[0]);
                    if (cross2D <= 0) continue; // Face is pointing away from viewer -> cull!

                    var pA = worldV[fIdxs[0]], pB = worldV[fIdxs[1]], pC = worldV[fIdxs[2]];
                    var avgDepth = (worldV[fIdxs[0]][2] + worldV[fIdxs[1]][2] + worldV[fIdxs[2]][2] + worldV[fIdxs[3]][2]) * 0.25;

                    // Face normal via cross product in world coordinates
                    var v1x = pB[0] - pA[0], v1y = pB[1] - pA[1], v1z = pB[2] - pA[2];
                    var v2x = pC[0] - pA[0], v2y = pC[1] - pA[1], v2z = pC[2] - pA[2];
                    var fnx = v1y * v2z - v1z * v2y;
                    var fny = v1z * v2x - v1x * v2z;
                    var fnz = v1x * v2y - v1y * v2x;
                    var fnLen = Math.sqrt(fnx * fnx + fny * fny + fnz * fnz);
                    if (fnLen > 0.0001) {
                        fnx /= fnLen; fny /= fnLen; fnz /= fnLen;
                    } else {
                        fnx = 0; fny = 0; fnz = -1;
                    }

                    // Diffuse & Specular lighting (Blinn-Phong)
                    var dotLight = Math.max(0.0, -(fnx * lx + fny * ly + fnz * lz));
                    var dotSpec = Math.pow(Math.max(0.0, -(fnx * hx + fny * hy + fnz * hz)), 26);

                    renderFaces.push({
                        depth: avgDepth,
                        indices: fIdxs,
                        dot: dotLight,
                        spec: dotSpec
                    });
                }

                // Sort back to front (largest depth drawn first)
                renderFaces.sort(function(a, b) { return b.depth - a.depth; });

                // Render each polygonal face with luxury metallic gold gradient
                for (var rfi = 0; rfi < renderFaces.length; rfi++) {
                    var rf = renderFaces[rfi];
                    var polyPts = [];
                    for (var pi = 0; pi < 4; pi++) {
                        polyPts.push(projV[rf.indices[pi]]);
                    }

                    var dLight = rf.dot;
                    var sGleam = rf.spec;

                    var fGrad = ctx.createLinearGradient(polyPts[0][0], polyPts[0][1], polyPts[2][0], polyPts[2][1]);
                    if (dLight > 0.55 || sGleam > 0.40) {
                        // Radiant champagne-to-24K gold facet
                        var hiAlpha = Math.min(1.0, 0.78 + sGleam * 0.22).toFixed(2);
                        fGrad.addColorStop(0.0, "rgba(255, 253, 240, " + hiAlpha + ")");
                        fGrad.addColorStop(0.35, "rgba(255, 226, 122, 0.96)");
                        fGrad.addColorStop(0.70, "rgba(212, 175, 55, 0.94)");
                        fGrad.addColorStop(1.0, "rgba(142, 108, 22, 0.92)");
                    } else if (dLight > 0.25) {
                        // Lustrous deep gold body facet
                        fGrad.addColorStop(0.0, "rgba(235, 196, 78, 0.94)");
                        fGrad.addColorStop(0.50, "rgba(195, 155, 42, 0.92)");
                        fGrad.addColorStop(1.0, "rgba(102, 76, 14, 0.90)");
                    } else {
                        // Burnished dark bronze/gold shadow facet
                        fGrad.addColorStop(0.0, "rgba(155, 120, 32, 0.90)");
                        fGrad.addColorStop(0.50, "rgba(96, 70, 16, 0.88)");
                        fGrad.addColorStop(1.0, "rgba(48, 34, 8, 0.86)");
                    }

                    ctx.fillStyle = fGrad;
                    ctx.beginPath();
                    ctx.moveTo(polyPts[0][0], polyPts[0][1]);
                    for (var step = 1; step < 4; step++) {
                        ctx.lineTo(polyPts[step][0], polyPts[step][1]);
                    }
                    ctx.closePath();
                    ctx.fill();

                    // Crisp specular bevel outline on front-facing edges
                    var edgeGlow = Math.min(1.0, 0.40 + dLight * 0.40 + sGleam * 0.35);
                    ctx.strokeStyle = sGleam > 0.35 ?
                        "rgba(255, 255, 255, " + edgeGlow.toFixed(2) + ")" :
                        "rgba(255, 242, 195, " + edgeGlow.toFixed(2) + ")";
                    ctx.lineWidth = sGleam > 0.5 ? 2.0 : 1.2;
                    ctx.stroke();
                }

                // Orbiting Celestial Stardust Rings circling the 3D Z
                var orbPts = zModel.orbitParticles;
                if (orbPts && orbPts.length > 0) {
                    for (var oi = 0; oi < orbPts.length; oi++) {
                        var op = orbPts[oi];
                        var opRad = op.angle + t * op.speed;
                        var opX = Math.cos(opRad) * op.radius;
                        var opZ = Math.sin(opRad) * op.radius;
                        var opY = Math.sin(opRad * 2.0 + op.phase) * (op.radius * 0.22);

                        // Rotate with 3D Z orientation
                        var orx1 = opX * cosY - opZ * sinY;
                        var orz1 = opX * sinY + opZ * cosY;
                        var ory2 = opY * cosX - orz1 * sinX;
                        var orz2 = opY * sinX + orz1 * cosX;
                        var orx3 = orx1 * cosZ - ory2 * sinZ;
                        var ory3 = orx1 * sinZ + ory2 * cosZ;

                        var orf = 3.2 / (3.6 + orz2);
                        var orScreenX = zcx + orx3 * zScale * orf;
                        var orScreenY = zcy + ory3 * zScale * orf;

                        var orAlpha = Math.max(0.15, Math.min(0.95, 0.45 + (1.2 - orz2) * 0.40));
                        var isFrontGlow = orz2 < 0;

                        ctx.fillStyle = isFrontGlow ?
                            "rgba(255, 250, 225, " + orAlpha.toFixed(2) + ")" :
                            "rgba(212, 175, 55, " + (orAlpha * 0.70).toFixed(2) + ")";

                        ctx.beginPath();
                        ctx.arc(orScreenX, orScreenY, isFrontGlow ? (2.2 * orf) : (1.4 * orf), 0, 6.28318);
                        ctx.fill();
                    }
                }
            }

            // ── E. Interactive Ley-Line Filaments & Star Nodes ─────────────
            var nodes = root.constellationNodes;
            if (nodes && nodes.length > 0) {
                var cursorConnectDist = 260.0;
                var connectDist = 180.0;
                ctx.lineWidth = 1.0;

                for (var ni = 0; ni < nodes.length; ni++) {
                    var na = nodes[ni];
                    var ndmx = mx - na.x;
                    var ndmy = my - na.y;
                    var ndm = Math.sqrt(ndmx * ndmx + ndmy * ndmy);

                    // Connection to cursor
                    if (ndm < cursorConnectDist) {
                        var cAlpha = (1.0 - ndm / cursorConnectDist) * (0.22 + act * 0.35);
                        ctx.strokeStyle = "rgba(255, 215, 0, " + cAlpha.toFixed(3) + ")";
                        ctx.beginPath();
                        ctx.moveTo(na.x, na.y);
                        ctx.lineTo(mx, my);
                        ctx.stroke();
                    }

                    // Neighbor connections
                    for (var nj = ni + 1; nj < nodes.length; nj++) {
                        var nb = nodes[nj];
                        var dx = na.x - nb.x;
                        var dy = na.y - nb.y;
                        if (Math.abs(dx) > connectDist || Math.abs(dy) > connectDist) continue;
                        var d = Math.sqrt(dx * dx + dy * dy);
                        if (d < connectDist) {
                            var nAlpha = (1.0 - d / connectDist) * 0.12;
                            ctx.strokeStyle = "rgba(212, 175, 55, " + nAlpha.toFixed(3) + ")";
                            ctx.beginPath();
                            ctx.moveTo(na.x, na.y);
                            ctx.lineTo(nb.x, nb.y);
                            ctx.stroke();
                        }
                    }

                    // Star node dot
                    var nBoost = ndm < cursorConnectDist ? (1.0 - ndm / cursorConnectDist) : 0.0;
                    var nA = Math.min(1.0, 0.20 + 0.20 * Math.sin(t + na.phase) + nBoost * 0.55);
                    ctx.fillStyle = nBoost > 0.3 ?
                        "rgba(255, 248, 220, " + nA.toFixed(3) + ")" :
                        "rgba(212, 175, 55, " + nA.toFixed(3) + ")";
                    ctx.beginPath();
                    ctx.arc(na.x, na.y, na.r + nBoost * 2.0, 0, 6.28318);
                    ctx.fill();
                }
            }

            // ── F. Floating Braille & Hex Sparks (Embers) ──────────────────
            var sparks = root.brailleSparks;
            if (sparks.length > 0 && root.showEmbers) {
                ctx.font = 'bold 11px "JetBrains Mono", "DejaVu Sans Mono", monospace';
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                for (var si = 0; si < sparks.length; si++) {
                    var sp = sparks[si];
                    var spAlpha = 0.22 + 0.38 * Math.sin(t * 2.2 + sp.phase);
                    ctx.fillStyle = sp.tone === 2 ? "rgba(255, 255, 255, " + spAlpha.toFixed(3) + ")" :
                                    sp.tone === 1 ? "rgba(255, 225, 120, " + spAlpha.toFixed(3) + ")" :
                                                    "rgba(212, 175, 55, " + spAlpha.toFixed(3) + ")";
                    ctx.fillText(sp.glyph, sp.x, sp.y);
                }
            }

            // ── G. Dynamic Comet Wake from Cursor Motion ──────────────────
            var cvx = root.smoothMouseX - root.trailMouseX;
            var cvy = root.smoothMouseY - root.trailMouseY;
            var trailDist = Math.sqrt(cvx * cvx + cvy * cvy);
            if (trailDist > 2.0) {
                var cGrad = ctx.createLinearGradient(root.trailMouseX, root.trailMouseY, root.smoothMouseX, root.smoothMouseY);
                cGrad.addColorStop(0.0, "rgba(212, 175, 55, 0.0)");
                cGrad.addColorStop(0.7, "rgba(255, 215, 0, " + (0.20 + act * 0.35).toFixed(3) + ")");
                cGrad.addColorStop(1.0, "rgba(255, 255, 255, " + (0.45 + act * 0.50).toFixed(3) + ")");
                ctx.strokeStyle = cGrad;
                ctx.lineWidth = 2.0 + act * 3.5;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(root.trailMouseX, root.trailMouseY);
                ctx.quadraticCurveTo(
                    (root.trailMouseX + root.smoothMouseX) * 0.5 - root.cursorVelocityY * 0.3,
                    (root.trailMouseY + root.smoothMouseY) * 0.5 + root.cursorVelocityX * 0.3,
                    root.smoothMouseX,
                    root.smoothMouseY
                );
                ctx.stroke();
            }

            // ── H. Animated Pixel Wordmark "ZOTHOS" (Bayer Dither Sheen) ───
            var wPixels = root.wordmarkPixels;
            if (wPixels && wPixels.length > 0) {
                var wordH = 7;
                var wordW = 47;
                var wScale = Math.min(W * 0.0075, 9.5);
                var startX = W * 0.5 - (wordW * wScale) * 0.5;
                var startY = H * 0.73;

                var scanX = ((root.sheenProgress + 0.4) * 0.7);

                for (var pki = 0; pki < wPixels.length; pki++) {
                    var pix = wPixels[pki];
                    var gx = pix[0];
                    var gy = pix[1];
                    var isBorder = pix[2];

                    var wpx = startX + gx * wScale;
                    var wpy = startY + gy * wScale;
                    var nX = gx / wordW;

                    var distWave = Math.abs(nX - scanX);
                    var sheenGlow = Math.max(0.0, 1.0 - distWave * 4.2);

                    var bVal = root.bayer4[((gy & 3) * 4 + (gx & 3))];
                    var wLum = 0.58 + sheenGlow * 0.45 + (isBorder ? 0.25 : 0.0);

                    if (wLum > bVal * 0.45) {
                        ctx.fillStyle = sheenGlow > 0.35 ? "#FFFDF0" : (isBorder ? "#FFE57F" : "#D4AF37");
                        ctx.fillRect(wpx, wpy, wScale - 0.7, wScale - 0.7);

                        // Subtle specular bevel edge on each pixel
                        ctx.fillStyle = "rgba(255, 255, 255, " + (0.15 + sheenGlow * 0.35).toFixed(2) + ")";
                        ctx.fillRect(wpx, wpy, wScale - 0.7, 1.0);
                        ctx.fillRect(wpx, wpy, 1.0, wScale - 0.7);
                    }
                }
            }
        }
    }

    // ── 4. Expanding Shockwaves & Interactive Cursor Reticle ───────────────
    Item {
        id: cursorFxLayer
        anchors.fill: parent

        Repeater {
            id: waveRepeater
            model: root.waveCount

            Rectangle {
                id: waveRing
                property real wx: 0
                property real wy: 0
                property real wLife: 0.0
                property real wMaxRadius: 280.0

                property real curRadius: (1.0 - wLife) * wMaxRadius
                x: wx - curRadius
                y: wy - curRadius
                width: curRadius * 2
                height: curRadius * 2
                radius: curRadius
                color: "transparent"
                border.width: Math.max(1.0, wLife * 3.0)
                border.color: "#FFD700"
                opacity: wLife * 0.70
                visible: wLife > 0.01
            }
        }

        // Cursor Alchemical Halo
        Image {
            source: "images/ring.png"
            width: 104
            height: 104
            x: root.smoothMouseX - width / 2
            y: root.smoothMouseY - height / 2
            opacity: 0.12 + root.cursorActivity * 0.40
            scale: 0.75 + root.cursorActivity * 0.40
            rotation: root.sacredRotation * 2.2
            asynchronous: true
            cache: true
        }

        // Luminous Cursor Star Core
        Item {
            x: root.smoothMouseX
            y: root.smoothMouseY
            opacity: 0.40 + root.cursorActivity * 0.55

            Rectangle {
                anchors.centerIn: parent
                width: 24 + root.cursorActivity * 20
                height: 1.4
                radius: 0.7
                color: "#FFFDF0"
                rotation: root.sacredRotation * 1.5
            }
            Rectangle {
                anchors.centerIn: parent
                width: 1.4
                height: 24 + root.cursorActivity * 20
                radius: 0.7
                color: "#FFFDF0"
                rotation: root.sacredRotation * 1.5
            }
            Rectangle {
                anchors.centerIn: parent
                width: 5
                height: 5
                radius: 2.5
                color: "#FFFFFF"
            }
        }
    }

    // ── 5. Desktop Mouse Tracking Surface ──────────────────────────────────
    MouseArea {
        anchors.fill: parent
        hoverEnabled: true
        acceptedButtons: Qt.LeftButton | Qt.MiddleButton
        propagateComposedEvents: true

        onPositionChanged: (mouse) => {
            root.rawMouseX = mouse.x;
            root.rawMouseY = mouse.y;
            root.lastLocalMouseTime = Date.now();
            if (root.cursorActivity < 0.4) root.cursorActivity = 0.4;
        }

        onPressed: (mouse) => {
            root.rawMouseX = mouse.x;
            root.rawMouseY = mouse.y;
            root.lastLocalMouseTime = Date.now();
            root.cursorActivity = 1.0;
            root.triggerShockwave(mouse.x, mouse.y, 1.2);
            mouse.accepted = false;
        }
    }

    // ── 6. Global Compositor Cursor Polling Engine (Continuous & Multi-Screen)
    property bool xhrInFlight: false

    Timer {
        id: globalCursorTimer
        interval: 50
        running: true
        repeat: true

        onTriggered: {
            var now = Date.now();
            if (now - root.lastLocalMouseTime < 80) return;
            if (root.xhrInFlight) return;

            root.xhrInFlight = true;
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "http://127.0.0.1:9989/");
            xhr.timeout = 250;
            xhr.onreadystatechange = function() {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    root.xhrInFlight = false;
                    if (xhr.status === 200 && xhr.responseText) {
                        try {
                            var data = JSON.parse(xhr.responseText);
                            if (data && typeof data.x === "number" && typeof data.y === "number") {
                                var gx = data.x;
                                var gy = data.y;

                                var lx = gx;
                                var ly = gy;
                                try {
                                    if (typeof root.mapFromGlobal === "function") {
                                        var pt = root.mapFromGlobal(gx, gy);
                                        if (pt && typeof pt.x === "number") {
                                            lx = pt.x;
                                            ly = pt.y;
                                        }
                                    } else {
                                        lx = gx % root.width;
                                        ly = gy % root.height;
                                    }
                                } catch (err) {
                                    lx = gx % root.width;
                                    ly = gy % root.height;
                                }

                                // If cursor is off-screen, smoothly ease toward a gentle floating center orbit
                                if (lx < -120 || lx > root.width + 120 || ly < -120 || ly > root.height + 120) {
                                    root.rawMouseX = root.width * 0.5 + Math.sin(root.breathingPhase * 0.5) * 80;
                                    root.rawMouseY = root.height * 0.44 + Math.cos(root.breathingPhase * 0.4) * 45;
                                } else {
                                    if (Math.abs(lx - root.rawMouseX) > 2.0 || Math.abs(ly - root.rawMouseY) > 2.0) {
                                        root.cursorActivity = 0.75;
                                    }
                                    root.rawMouseX = lx;
                                    root.rawMouseY = ly;
                                }
                            }
                        } catch (e) {}
                    }
                }
            };
            xhr.send();
        }
    }

    // ── 7. Master Physics & Render Loop (60 FPS Seamless Continuous) ───────
    Timer {
        id: masterRenderTimer
        interval: 16 // 60 FPS buttery smooth render loop
        running: true
        repeat: true

        onTriggered: {
            var now = Date.now();
            var dt = root.lastFrameTime > 0 ? Math.min((now - root.lastFrameTime) / 1000.0, 0.05) : 0.016;
            root.lastFrameTime = now;

            // Advance phases smoothly based on real delta time
            root.breathingPhase += dt * (root.cursorActivity > 0.05 ? 1.5 : 0.9);
            root.sacredRotation = (root.sacredRotation + dt * (18.0 + root.cursorActivity * 40.0)) % 360.0;

            // Sweeping specular sheen on wordmark
            root.sheenProgress += dt * (root.cursorActivity > 0.05 ? 0.60 : 0.35);
            if (root.sheenProgress > 1.8) {
                root.sheenProgress = -0.4;
            }

            // Exponential dampening for physical silk cursor smoothing
            var damp = 1.0 - Math.exp(-14.0 * dt);
            root.smoothMouseX += (root.rawMouseX - root.smoothMouseX) * damp;
            root.smoothMouseY += (root.rawMouseY - root.smoothMouseY) * damp;

            var trailDamp = 1.0 - Math.exp(-7.0 * dt);
            root.trailMouseX += (root.smoothMouseX - root.trailMouseX) * trailDamp;
            root.trailMouseY += (root.smoothMouseY - root.trailMouseY) * trailDamp;

            // Velocity & activity decay
            var dxMouse = root.smoothMouseX - root.prevSmoothX;
            var dyMouse = root.smoothMouseY - root.prevSmoothY;
            var moveDist = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
            root.cursorVelocityX = dxMouse;
            root.cursorVelocityY = dyMouse;
            root.cursorSpeed = moveDist;
            root.prevSmoothX = root.smoothMouseX;
            root.prevSmoothY = root.smoothMouseY;

            var targetAct = Math.min(moveDist / 12.0, 1.0);
            if (targetAct > root.cursorActivity) {
                root.cursorActivity += (targetAct - root.cursorActivity) * 0.35;
            } else {
                root.cursorActivity *= Math.exp(-3.0 * dt);
                if (root.cursorActivity < 0.03) root.cursorActivity = 0.03;
            }

            // Rapid whip motion shockwave trigger
            if (moveDist > 45.0) {
                var nowMs = Date.now();
                if (nowMs - root.lastWhipWaveTime > 400) {
                    root.lastWhipWaveTime = nowMs;
                    root.triggerShockwave(root.smoothMouseX, root.smoothMouseY, 0.85);
                }
            }

            // Decay shockwave rings
            if (root.waveItems.length === root.waveCount) {
                for (var wi = 0; wi < root.waveCount; wi++) {
                    var wItem = root.waveItems[wi];
                    if (wItem && wItem.wLife > 0.005) {
                        wItem.wLife *= Math.exp(-4.5 * dt);
                        if (wItem.wLife <= 0.01) wItem.wLife = 0.0;
                    }
                }
            }

            // Drift metallic gold pixel blocks
            var blocks = root.goldPixelBlocks;
            if (blocks && blocks.length > 0 && root.width > 0) {
                var dtSpeed = dt * 60.0;
                for (var bi = 0; bi < blocks.length; bi++) {
                    var b = blocks[bi];
                    b.x += b.vx * dtSpeed;
                    b.y += b.vy * dtSpeed;
                    if (b.x > root.width + 40) b.x = -40;
                    else if (b.x < -40) b.x = root.width + 40;
                    if (b.y > root.height + 40) b.y = -40;
                    else if (b.y < -40) b.y = root.height + 40;
                }
            }

            // Drift constellation star nodes
            var nodes = root.constellationNodes;
            if (nodes && nodes.length > 0) {
                var dtSpeed = dt * 60.0;
                for (var ci = 0; ci < nodes.length; ci++) {
                    var cn = nodes[ci];
                    cn.x += cn.vx * dtSpeed;
                    cn.y += cn.vy * dtSpeed;

                    // Swirl around cursor when near
                    var cdx = root.smoothMouseX - cn.x;
                    var cdy = root.smoothMouseY - cn.y;
                    var cdist = Math.sqrt(cdx * cdx + cdy * cdy);
                    if (cdist > 25.0 && cdist < 240.0) {
                        var pull = (1.0 - cdist / 240.0) * 0.40 * dtSpeed;
                        cn.x += (cdx / cdist) * pull + (-cdy / cdist) * pull * 0.60;
                        cn.y += (cdy / cdist) * pull + (cdx / cdist) * pull * 0.60;
                    }

                    if (cn.x < 0) cn.x += root.width;
                    else if (cn.x > root.width) cn.x -= root.width;
                    if (cn.y < 0) cn.y += root.height;
                    else if (cn.y > root.height) cn.y -= root.height;
                }
            }

            // Drift floating Braille sparks
            var sparks = root.brailleSparks;
            if (sparks && sparks.length > 0) {
                var dtSpeed = dt * 60.0;
                for (var si = 0; si < sparks.length; si++) {
                    var sp = sparks[si];
                    sp.x += sp.vx * dtSpeed;
                    sp.y += sp.vy * dtSpeed;
                    if (sp.x > root.width + 20) sp.x = -20;
                    if (sp.y > root.height + 20) sp.y = -20;
                    else if (sp.y < -20) sp.y = root.height + 20;
                }
            }

            // Flawless, continuous 60fps canvas paint request
            mainGraphicCanvas.requestPaint();
        }
    }

    // ── 8. Setup Procedural Geometry Models On Initialization ──────────────
    Component.onCompleted: {
        var refW = root.width > 100 ? root.width : 1920;
        var refH = root.height > 100 ? root.height : 1080;

        // A. Pre-compute Active Wordmark Pixels for 7-row ZOTHOS
        var glyphMap = {
            'Z': ['1111111','1111111','0000110','0011100','0110000','1111111','1111111'],
            'O': ['0111110','1111111','1100011','1100011','1100011','1111111','0111110'],
            'T': ['1111111','1111111','0011100','0011100','0011100','0011100','0011100'],
            'H': ['1100011','1100011','1111111','1111111','1100011','1100011','1100011'],
            'S': ['0111111','1110000','1111110','0111111','0000111','1111111','1111110']
        };
        var word = "ZOTHOS";
        var pixList = [];
        for (var c = 0; c < word.length; c++) {
            var mat = glyphMap[word[c]] || glyphMap['Z'];
            for (var gy = 0; gy < 7; gy++) {
                for (var gx = 0; gx < 7; gx++) {
                    if (mat[gy][gx] === '1') {
                        var isBorder = (gy === 0 || gx === 0 || gy === 6 || gx === 6);
                        pixList.push([c * 8 + gx, gy, isBorder]);
                    }
                }
            }
        }
        root.wordmarkPixels = pixList;

        // B. Generate Twinkling Pixel Stars Field
        var tStars = [];
        for (var si = 0; si < 64; si++) {
            tStars.push({
                x: Math.random() * refW,
                y: Math.random() * refH,
                sz: (si % 3 === 0) ? 2.5 : 1.5,
                phase: Math.random() * 6.28,
                isGold: (si % 2 === 0)
            });
        }
        root.twinkleStars = tStars;

        // C. Generate Moving Metallic Gold Pixel Blocks
        var blist = [];
        var blockCount = 42;
        for (var bi = 0; bi < blockCount; bi++) {
            blist.push({
                x: Math.random() * refW,
                y: Math.random() * refH,
                vx: 0.15 + (bi % 4) * 0.08,
                vy: (Math.sin(bi * 1.3) * 0.12),
                sz: 18 + (bi % 5) * 6,
                phase: bi * 0.75
            });
        }
        root.goldPixelBlocks = blist;

        // D. CENTERPIECE: 3D Volumetric Sculpted Monolith "Z" Mesh (TLC Upgrade)
        var zContour = [
            [-0.65, -0.65],
            [ 0.65, -0.65],
            [ 0.65, -0.35],
            [-0.25,  0.35],
            [ 0.65,  0.35],
            [ 0.65,  0.65],
            [-0.65,  0.65],
            [-0.65,  0.35],
            [ 0.25, -0.35],
            [-0.65, -0.35]
        ];

        var zDepth = 0.22;
        var zVerts = [];
        // Front vertices (0..9 at z = -zDepth)
        for (var fvi = 0; fvi < 10; fvi++) {
            zVerts.push([zContour[fvi][0], zContour[fvi][1], -zDepth]);
        }
        // Back vertices (10..19 at z = +zDepth)
        for (var bvi = 0; bvi < 10; bvi++) {
            zVerts.push([zContour[bvi][0], zContour[bvi][1], zDepth]);
        }

        // Polygon face index lists (4 vertices per quad)
        var zFaces = [];
        // Correct outward-pointing front faces (facing -Z towards camera)
        zFaces.push([0, 9, 2, 1]);   // Top horizontal bar
        zFaces.push([7, 3, 2, 8]);   // Diagonal shear bar
        zFaces.push([6, 5, 4, 7]);   // Bottom horizontal bar

        // Correct outward-pointing back faces (facing +Z away from camera)
        zFaces.push([10, 11, 12, 19]); // Top bar back
        zFaces.push([18, 12, 13, 17]); // Diagonal back
        zFaces.push([17, 14, 15, 16]); // Bottom bar back

        // 10 Extruded side bevel faces connecting perimeter edges front-to-back
        for (var sei = 0; sei < 10; sei++) {
            var seiNext = (sei + 1) % 10;
            zFaces.push([sei, seiNext, 10 + seiNext, 10 + sei]);
        }

        // Orbiting celestial stardust particles encircling the 3D Z
        var orbitParticles = [];
        for (var opi = 0; opi < 36; opi++) {
            var aRad = (opi / 36.0) * 6.28318;
            orbitParticles.push({
                angle: aRad,
                radius: 1.25 + (opi % 3) * 0.15,
                phase: opi * 0.6,
                speed: 0.35 + (opi % 2) * 0.15
            });
        }

        root.zMonolithMesh = {
            vertices: zVerts,
            faces: zFaces,
            orbitParticles: orbitParticles
        };

        // E. Constellation Ley-Line Star Nodes
        var cNodes = [];
        for (var ni = 0; ni < root.nodeCount; ni++) {
            cNodes.push({
                x: (ni * 137.5) % refW,
                y: (ni * 293.7) % refH,
                vx: Math.cos(ni * 1.7) * 0.30,
                vy: Math.sin(ni * 2.3) * 0.30,
                r: 1.5 + (ni % 3) * 0.7,
                phase: (ni * 0.85) % 6.28
            });
        }
        root.constellationNodes = cNodes;

        // F. Floating Braille & Hex Sparks
        var glyphRoster = ["⣿", "⠿", "⠇", "⠋", "0", "1", "/", ">", "_", "#", "*", "λ", "⬡"];
        var spks = [];
        for (var spi = 0; spi < 36; spi++) {
            spks.push({
                x: Math.random() * refW,
                y: Math.random() * refH,
                vx: 0.20 + Math.random() * 0.55,
                vy: (Math.random() - 0.5) * 0.20,
                glyph: glyphRoster[spi % glyphRoster.length],
                tone: spi % 3,
                phase: Math.random() * 6.28
            });
        }
        root.brailleSparks = spks;
    }
}
