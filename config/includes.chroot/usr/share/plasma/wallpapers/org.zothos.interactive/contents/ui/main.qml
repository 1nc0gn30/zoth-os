import QtQuick
import org.kde.plasma.plasmoid
import org.kde.plasma.core as PlasmaCore
import "HologramData.js" as HologramData
import "CharacterBoardData.js" as CharacterBoardData

WallpaperItem {
    id: root

    // Configuration parameters
    readonly property real maxTilt: 22.0
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
    readonly property int nodeCount: 18
    property var constellationNodes: []
    property var twinkleStars: []

    // Pre-allocated metallic gold color tiers (Zero GC allocation during render)
    readonly property var goldFacetTiers: [
        "#1c1203", // 0: Deep ambient shadow
        "#3b2606", // 1: Shadow facet
        "#6b490c", // 2: Low-mid bronze
        "#9c6f14", // 3: Medium gold body
        "#c99920", // 4: 24K imperial gold
        "#e5b736", // 5: Radiant gold highlight
        "#fae078", // 6: Luminous champagne
        "#fffef4"  // 7: Pure specular gleam
    ]

    // Moving Metallic Gold Pixel Blocks
    property var goldPixelBlocks: []

    // Centerpiece: True 3D Volumetric Sculpted Monolith "Z" Mesh & 3D Lattice Cube from zothos.nullai.tech
    property var zMonolithMesh: null
    property var latticePoints: []
    property var latticeEdges: []

    // Floating Braille/ASCII sparks pool
    property var brailleSparks: []

    // 1nc0gn30 3D Orbiting Motes
    property var charOrbitMotes: []

    // 1nc0gn30 Character State: strictly Hero & Running Walk from 1nc0gn30.si
    property string activePoseName: "hero"
    property int runningDirection: -1 // -1 = running left, 1 = running right
    property double lastRunTime: 0

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
        x: -parent.width * 0.02 + (root.width / 2 - root.smoothMouseX) * 0.006
        y: -parent.height * 0.02 + (root.height / 2 - root.smoothMouseY) * 0.006
        source: "images/bg.png"
        fillMode: Image.PreserveAspectCrop
        asynchronous: true
        cache: true
    }

    // ── 2. Ambient Golden Nebula Bloom ─────────────────────────────────────
    Item {
        id: sacredCenterBackdrop
        anchors.centerIn: parent
        anchors.verticalCenterOffset: -Math.min(50, parent.height * 0.06)
        width: Math.min(root.width * 0.45, 520)
        height: width

        property real centerDist: Math.hypot(root.smoothMouseX - (parent.width / 2), root.smoothMouseY - (parent.height / 2 - 40))
        property real centerProximity: Math.max(0.0, 1.0 - centerDist / 650.0)

        // Soft central golden bloom breathing in deep space
        Image {
            id: centerBloom
            source: "images/glow.png"
            anchors.centerIn: parent
            width: parent.width * 1.30
            height: width
            opacity: 0.35 + 0.12 * Math.sin(root.breathingPhase * 0.8) + sacredCenterBackdrop.centerProximity * 0.22
            asynchronous: true
            cache: true
        }

        // Concentric sacred alchemical ring behind the 3D Z
        Image {
            source: "images/ring.png"
            anchors.centerIn: parent
            width: parent.width * 0.92
            height: width
            opacity: 0.20 + 0.15 * sacredCenterBackdrop.centerProximity
            rotation: -root.sacredRotation * 0.35
            scale: 0.95 + 0.05 * Math.sin(root.breathingPhase * 0.6)
            asynchronous: true
            cache: true
        }

        // Inner Sacred Seal
        Image {
            source: "images/seal.png"
            anchors.centerIn: parent
            width: parent.width * 0.65
            height: width
            opacity: 0.14 + 0.10 * sacredCenterBackdrop.centerProximity
            rotation: root.sacredRotation * 0.2
            asynchronous: true
            cache: true
        }
    }

    // ── 3. Background Ambient Canvas (Stars + Ley-Lines + Moving Blocks) ───
    Canvas {
        id: bgGraphicCanvas
        width: Math.max(480, Math.floor(parent.width / 2))
        height: Math.max(270, Math.floor(parent.height / 2))
        scale: 2.0
        transformOrigin: Item.TopLeft
        renderTarget: Canvas.FramebufferObject
        renderStrategy: Canvas.Cooperative
        smooth: true

        onPaint: {
            var ctx = getContext("2d");
            ctx.clearRect(0, 0, width, height);

            var W = width;
            var H = height;
            if (W <= 50 || H <= 50) return;

            var t = root.breathingPhase;
            var scaleFactor = 0.5;
            var mx = root.smoothMouseX * scaleFactor;
            var my = root.smoothMouseY * scaleFactor;

            // A. Batched Ambient Twinkling Stars
            var stars = root.twinkleStars;
            if (stars && stars.length > 0) {
                ctx.fillStyle = "rgba(255, 230, 140, 0.55)";
                ctx.beginPath();
                for (var ti = 0; ti < stars.length; ti++) {
                    var st = stars[ti];
                    var stWave = Math.sin(t * 1.8 + st.phase);
                    if (stWave > -0.2) {
                        ctx.rect(st.x * scaleFactor, st.y * scaleFactor, st.sz, st.sz);
                    }
                }
                ctx.fill();
            }

            // B. Moving Metallic Gold Pixel Blocks
            var blocks = root.goldPixelBlocks;
            if (blocks && blocks.length > 0) {
                for (var bi = 0; bi < blocks.length; bi++) {
                    var b = blocks[bi];
                    var bx = b.x * scaleFactor;
                    var by = b.y * scaleFactor;
                    var bsz = Math.max(3, b.sz * scaleFactor);

                    var bPhase = Math.sin(t * 1.2 + b.phase);
                    ctx.fillStyle = bPhase > 0 ? "#C99920" : "#6B490C";
                    ctx.fillRect(bx, by, bsz, bsz);

                    // 3D Bevel highlight
                    ctx.fillStyle = "rgba(255, 255, 230, 0.45)";
                    ctx.fillRect(bx, by, bsz, 1.0);
                    ctx.fillRect(bx, by, 1.0, bsz);
                }
            }

            // C. Constellation Ley-Lines (Pre-filtered distance)
            var nodes = root.constellationNodes;
            if (nodes && nodes.length > 0) {
                var connectDist = 80.0;
                ctx.lineWidth = 0.8;
                ctx.strokeStyle = "rgba(212, 175, 55, 0.18)";
                ctx.beginPath();

                for (var ni = 0; ni < nodes.length; ni++) {
                    var na = nodes[ni];
                    var nax = na.x * scaleFactor;
                    var nay = na.y * scaleFactor;

                    var dmx = Math.abs(mx - nax);
                    var dmy = Math.abs(my - nay);
                    if (dmx < 110.0 && dmy < 110.0) {
                        ctx.moveTo(nax, nay);
                        ctx.lineTo(mx, my);
                    }

                    for (var nj = ni + 1; nj < nodes.length; nj++) {
                        var nb = nodes[nj];
                        var nbx = nb.x * scaleFactor;
                        var nby = nb.y * scaleFactor;
                        var dx = Math.abs(nax - nbx);
                        var dy = Math.abs(nay - nby);
                        if (dx > connectDist || dy > connectDist) continue;
                        if (dx * dx + dy * dy < connectDist * connectDist) {
                            ctx.moveTo(nax, nay);
                            ctx.lineTo(nbx, nby);
                        }
                    }
                }
                ctx.stroke();

                // Star node points
                ctx.fillStyle = "rgba(255, 225, 120, 0.70)";
                ctx.beginPath();
                for (var npi = 0; npi < nodes.length; npi++) {
                    var nPoint = nodes[npi];
                    ctx.rect(nPoint.x * scaleFactor - 1, nPoint.y * scaleFactor - 1, 2, 2);
                }
                ctx.fill();
            }

            // D. Floating Braille/ASCII Embers (Fast Pixel Glints)
            var sparks = root.brailleSparks;
            if (sparks && sparks.length > 0 && root.showEmbers) {
                ctx.fillStyle = "rgba(255, 240, 160, 0.60)";
                ctx.beginPath();
                for (var spi = 0; spi < sparks.length; spi++) {
                    var sp = sparks[spi];
                    if (Math.sin(t * 2.0 + sp.phase) > -0.1) {
                        ctx.rect(sp.x * scaleFactor, sp.y * scaleFactor, 1.5, 1.5);
                    }
                }
                ctx.fill();
            }
        }
    }

    // ── 4. Dedicated 3D Monolith "Z" Viewport (with 3D Lattice Cube from zothos.nullai.tech)
    Canvas {
        id: zMonolithCanvas
        anchors.centerIn: parent
        anchors.verticalCenterOffset: -Math.min(50, parent.height * 0.06)
        width: Math.min(480, Math.min(parent.width * 0.44, parent.height * 0.44))
        height: width
        renderTarget: Canvas.FramebufferObject
        renderStrategy: Canvas.Cooperative
        smooth: true

        onPaint: {
            var ctx = getContext("2d");
            ctx.clearRect(0, 0, width, height);

            var zModel = root.zMonolithMesh;
            if (!zModel || !zModel.vertices || zModel.vertices.length === 0) return;

            var W = width;
            var H = height;
            var zcx = W * 0.5;
            var zcy = H * 0.5 + Math.sin(root.breathingPhase * 0.95) * 8.0;
            var zScale = W * 0.40;

            var normMx = Math.max(-1.0, Math.min(1.0, (root.smoothMouseX - parent.width * 0.5) / (parent.width * 0.5)));
            var normMy = Math.max(-1.0, Math.min(1.0, (root.smoothMouseY - parent.height * 0.5) / (parent.height * 0.5)));

            // Fluid continuous yaw & pitch + cursor tracking
            var zYaw = root.breathingPhase * 0.35 + normMx * 0.70;
            var zPitch = 0.22 + Math.sin(root.breathingPhase * 0.40) * 0.06 + normMy * 0.50;
            var zRoll = -normMx * 0.10;

            var cosY = Math.cos(zYaw), sinY = Math.sin(zYaw);
            var cosX = Math.cos(zPitch), sinX = Math.sin(zPitch);
            var cosZ = Math.cos(zRoll), sinZ = Math.sin(zRoll);

            // ── A. 3D Lattice Cube from zothos.nullai.tech Navbar Logo ────
            var latPts = root.latticePoints;
            var latEdges = root.latticeEdges;
            if (latPts && latPts.length > 0 && latEdges && latEdges.length > 0) {
                var latScale = zScale * 0.88;
                var projLat = [];
                for (var lpi = 0; lpi < latPts.length; lpi++) {
                    var lp = latPts[lpi];
                    var lpx = lp[0], lpy = lp[1], lpz = lp[2];
                    var lx1 = lpx * cosY - lpz * sinY;
                    var lz1 = lpx * sinY + lpz * cosY;
                    var ly2 = lpy * cosX - lz1 * sinX;
                    var lz2 = lpy * sinX + lz1 * cosX;
                    var lx3 = lx1 * cosZ - ly2 * sinZ;
                    var ly3 = lx1 * sinZ + ly2 * cosZ;
                    var lpf = 3.2 / (3.6 + lz2);
                    projLat.push([zcx + lx3 * latScale * lpf, zcy + ly3 * latScale * lpf, lz2]);
                }

                // Draw 3D lattice edges with depth fading
                ctx.lineWidth = 0.85;
                for (var lei = 0; lei < latEdges.length; lei++) {
                    var edge = latEdges[lei];
                    var ptA = projLat[edge[0]];
                    var ptB = projLat[edge[1]];
                    var avgZ = (ptA[2] + ptB[2]) * 0.5;
                    var edgeAlpha = Math.max(0.08, Math.min(0.40, 0.20 - avgZ * 0.15));
                    ctx.strokeStyle = "rgba(212, 175, 55, " + edgeAlpha.toFixed(2) + ")";
                    ctx.beginPath();
                    ctx.moveTo(ptA[0], ptA[1]);
                    ctx.lineTo(ptB[0], ptB[1]);
                    ctx.stroke();
                }

                // Glowing 3D lattice vertices
                for (var lvi = 0; lvi < projLat.length; lvi++) {
                    var lvp = projLat[lvi];
                    if (lvp[2] < 0.2) {
                        ctx.fillStyle = lvp[2] < -0.3 ? "rgba(255, 245, 190, 0.75)" : "rgba(212, 175, 55, 0.45)";
                        ctx.fillRect(lvp[0] - 1.2, lvp[1] - 1.2, 2.4, 2.4);
                    }
                }
            }

            // ── B. Transform 3D Z Monolith Vertices ────────────────────────
            var worldV = [];
            var projV = [];
            var verts = zModel.vertices;
            for (var vi = 0; vi < verts.length; vi++) {
                var vp = verts[vi];
                var vx = vp[0], vy = vp[1], vz = vp[2];
                var x1 = vx * cosY - vz * sinY;
                var z1 = vx * sinY + vz * cosY;
                var y2 = vy * cosX - z1 * sinX;
                var z2 = vy * sinX + z1 * cosX;
                var x3 = x1 * cosZ - y2 * sinZ;
                var y3 = x1 * sinZ + y2 * cosZ;
                var z3 = z2;
                worldV.push([x3, y3, z3]);
                var pf = 3.2 / (3.6 + z3);
                projV.push([zcx + x3 * zScale * pf, zcy + y3 * zScale * pf, z3]);
            }

            // Key light vector
            var lx = -0.40 + normMx * 0.35;
            var ly = -0.68 + normMy * 0.35;
            var lz = -0.62;
            var lLen = Math.sqrt(lx * lx + ly * ly + lz * lz);
            lx /= lLen; ly /= lLen; lz /= lLen;

            // Halfway specular vector
            var hx = lx, hy = ly, hz = lz - 1.0;
            var hLen = Math.sqrt(hx * hx + hy * hy + hz * hz);
            hx /= hLen; hy /= hLen; hz /= hLen;

            // Screen-space backface culling & depth sorting
            var fDefs = zModel.faces;
            var renderFaces = [];
            for (var fi = 0; fi < fDefs.length; fi++) {
                var fIdxs = fDefs[fi];
                var p0 = projV[fIdxs[0]];
                var p1 = projV[fIdxs[1]];
                var p2 = projV[fIdxs[2]];

                var cross2D = (p1[0] - p0[0]) * (p2[1] - p0[1]) - (p1[1] - p0[1]) * (p2[0] - p0[0]);
                if (cross2D <= 0) continue;

                var pA = worldV[fIdxs[0]], pB = worldV[fIdxs[1]], pC = worldV[fIdxs[2]];
                var avgDepth = (worldV[fIdxs[0]][2] + worldV[fIdxs[1]][2] + worldV[fIdxs[2]][2] + worldV[fIdxs[3]][2]) * 0.25;

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

                var dotLight = Math.max(0.0, -(fnx * lx + fny * ly + fnz * lz));
                var dotSpec = Math.pow(Math.max(0.0, -(fnx * hx + fny * hy + fnz * hz)), 22);
                var tier = Math.min(7, Math.floor(dotLight * 6.0 + dotSpec * 3.5));

                renderFaces.push({
                    depth: avgDepth,
                    indices: fIdxs,
                    tier: tier,
                    spec: dotSpec
                });
            }

            renderFaces.sort(function(a, b) { return b.depth - a.depth; });

            // Render 3D Polygons
            for (var rfi = 0; rfi < renderFaces.length; rfi++) {
                var rf = renderFaces[rfi];
                var fPoly = [
                    projV[rf.indices[0]],
                    projV[rf.indices[1]],
                    projV[rf.indices[2]],
                    projV[rf.indices[3]]
                ];

                ctx.fillStyle = root.goldFacetTiers[rf.tier];
                ctx.beginPath();
                ctx.moveTo(fPoly[0][0], fPoly[0][1]);
                ctx.lineTo(fPoly[1][0], fPoly[1][1]);
                ctx.lineTo(fPoly[2][0], fPoly[2][1]);
                ctx.lineTo(fPoly[3][0], fPoly[3][1]);
                ctx.closePath();
                ctx.fill();

                // Bevel border highlight
                ctx.strokeStyle = rf.spec > 0.4 ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 235, 160, 0.40)";
                ctx.lineWidth = rf.spec > 0.4 ? 1.6 : 1.0;
                ctx.stroke();
            }

            // Orbiting celestial stardust rings
            var orbPts = zModel.orbitParticles;
            if (orbPts && orbPts.length > 0) {
                var t = root.breathingPhase;
                for (var oi = 0; oi < orbPts.length; oi++) {
                    var op = orbPts[oi];
                    var opRad = op.angle + t * op.speed;
                    var opX = Math.cos(opRad) * op.radius;
                    var opZ = Math.sin(opRad) * op.radius;
                    var opY = Math.sin(opRad * 2.0 + op.phase) * (op.radius * 0.22);

                    var orx1 = opX * cosY - opZ * sinY;
                    var orz1 = opX * sinY + opZ * cosY;
                    var ory2 = opY * cosX - orz1 * sinX;
                    var orz2 = opY * sinX + orz1 * cosX;
                    var orx3 = orx1 * cosZ - ory2 * sinZ;
                    var ory3 = orx1 * sinZ + ory2 * cosZ;

                    var orf = 3.2 / (3.6 + orz2);
                    var orScreenX = zcx + orx3 * zScale * orf;
                    var orScreenY = zcy + ory3 * zScale * orf;

                    var isFront = orz2 < 0;
                    ctx.fillStyle = isFront ? "rgba(255, 250, 220, 0.85)" : "rgba(212, 175, 55, 0.40)";
                    ctx.beginPath();
                    ctx.arc(orScreenX, orScreenY, isFront ? (2.0 * orf) : (1.2 * orf), 0, 6.28318);
                    ctx.fill();
                }
            }
        }
    }

    // ── 5. Interactive 3D "ZOTHOS" Wordmark (Design Parity with zothos.nullai.tech) ──
    Item {
        id: zothosWordmarkBar
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.top: zMonolithCanvas.bottom
        anchors.topMargin: Math.max(12, parent.height * 0.016)
        width: wordmarkColumn.width
        height: wordmarkColumn.height

        Column {
            id: wordmarkColumn
            anchors.centerIn: parent
            spacing: 6

            Row {
                id: wordmarkRow
                spacing: Math.min(18, root.width * 0.012)
                anchors.horizontalCenter: parent.horizontalCenter

                Repeater {
                    model: [
                        { id: "Z",  src: "images/letter_z.png",  alt: "Z", w: 58 },
                        { id: "O1", src: "images/letter_o1.png", alt: "O", w: 64 },
                        { id: "T",  src: "images/letter_t.png",  alt: "T", w: 56 },
                        { id: "H",  src: "images/letter_h.png",  alt: "H", w: 64 },
                        { id: "O2", src: "images/letter_o2.png", alt: "O", w: 64 },
                        { id: "S",  src: "images/letter_s.png",  alt: "S", w: 52 }
                    ]

                    Item {
                        id: letterItem
                        width: modelData.w * (Math.min(80, root.height * 0.082) / 76.0)
                        height: Math.min(80, root.height * 0.082)

                        // Individual floating wave undulation per letter
                        property real letterWave: Math.sin(root.breathingPhase * 2.2 + index * 0.65) * 5.5

                        // Proximity to cursor lifts letter in 3D
                        property real cursorDist: {
                            var absX = zothosWordmarkBar.x + wordmarkColumn.x + wordmarkRow.x + letterItem.x + letterItem.width / 2;
                            var absY = zothosWordmarkBar.y + wordmarkColumn.y + wordmarkRow.y + letterItem.y + letterItem.height / 2;
                            return Math.hypot(root.smoothMouseX - absX, root.smoothMouseY - absY);
                        }
                        property real hoverBoost: cursorDist < 180 ? (1.0 - cursorDist / 180.0) : 0.0

                        // Continuous sweeping specular sheen wave from zothos.nullai.tech
                        property real letterNormPos: index / 5.0
                        property real sheenDist: Math.abs(root.sheenProgress - letterNormPos)
                        property real sheenGlow: Math.max(0.0, 1.0 - sheenDist * 4.5)

                        scale: 1.0 + hoverBoost * 0.16 + sheenGlow * 0.08

                        // 3D Parallax Tilt on each individual letter
                        transform: [
                            Translate {
                                y: letterItem.letterWave - letterItem.hoverBoost * 7.0 - letterItem.sheenGlow * 3.0
                            },
                            Rotation {
                                origin.x: letterItem.width / 2
                                origin.y: letterItem.height / 2
                                axis { x: 0; y: 1; z: 0 }
                                angle: -(root.smoothMouseX - root.width / 2) * 0.012
                            },
                            Rotation {
                                origin.x: letterItem.width / 2
                                origin.y: letterItem.height / 2
                                axis { x: 1; y: 0; z: 0 }
                                angle: (root.smoothMouseY - (zothosWordmarkBar.y + zothosWordmarkBar.height / 2)) * 0.015
                            }
                        ]

                        // Golden aura bloom flaring on sheen or cursor proximity
                        Rectangle {
                            anchors.centerIn: parent
                            width: parent.width * 1.35
                            height: parent.height * 1.35
                            radius: 16
                            color: letterItem.sheenGlow > 0.3 ? "#45ffe89e" : "#25d4af37"
                            opacity: 0.18 + letterItem.hoverBoost * 0.50 + letterItem.sheenGlow * 0.40
                        }

                        Image {
                            source: modelData.src
                            anchors.fill: parent
                            fillMode: Image.PreserveAspectFit
                            asynchronous: true
                            cache: true
                            opacity: 0.94 + letterItem.hoverBoost * 0.06
                        }
                    }
                }
            }

            // Micro-Telemetry Brand Sub-Line from zothos.nullai.tech
            Row {
                anchors.horizontalCenter: parent.horizontalCenter
                spacing: 8
                opacity: 0.65 + 0.20 * Math.sin(root.breathingPhase * 1.2)

                Text {
                    text: "⣿"
                    color: "#39D353"
                    font.family: "JetBrains Mono"
                    font.pixelSize: 9
                    font.bold: true
                }
                Text {
                    text: "U+2800 · SOVEREIGN OS · 24K GOLD"
                    color: "#C99920"
                    font.family: "JetBrains Mono"
                    font.pixelSize: 8.5
                    font.letterSpacing: 2.0
                    font.bold: true
                }
                Text {
                    text: "⣿"
                    color: "#39D353"
                    font.family: "JetBrains Mono"
                    font.pixelSize: 9
                    font.bold: true
                }
            }
        }
    }

    // ── 6. 1nc0gn30 Hooded Builder Stage (Hero & Running Walk from 1nc0gn30.si) ──
    Item {
        id: characterFlankStage

        // Responsive position: safely flanked on the right without edge cutoff
        anchors.right: parent.right
        anchors.rightMargin: Math.max(36, parent.width * 0.045)
        anchors.verticalCenter: parent.verticalCenter
        anchors.verticalCenterOffset: -Math.min(25, parent.height * 0.03)

        width: Math.min(320, parent.width * 0.22)
        height: Math.min(480, parent.height * 0.55)

        // Soft Radial Ethereal Aura Bloom behind character
        Rectangle {
            anchors.centerIn: parent
            width: parent.width * 0.95
            height: parent.height * 0.95
            radius: width / 2
            color: "#1839d353"
            opacity: 0.20 + 0.12 * Math.sin(root.breathingPhase * 0.9)
        }

        Rectangle {
            anchors.centerIn: parent
            width: parent.width * 0.70
            height: parent.height * 0.70
            radius: width / 2
            color: "#15d4af37"
            opacity: 0.16 + 0.10 * Math.sin(root.breathingPhase * 1.2)
        }

        // ── POSE 1: HERO (Main Sentinel Pose from 1nc0gn30.si) ───────────────
        Item {
            id: heroPoseItem
            anchors.fill: parent
            opacity: root.activePoseName === "hero" ? 1.0 : 0.0
            visible: opacity > 0.01

            Behavior on opacity {
                NumberAnimation { duration: 340; easing.type: Easing.InOutQuad }
            }

            // Levitation float & real-time 3D tilt tracking cursor in 1nc0gn30.si style
            transform: [
                Translate {
                    y: Math.sin(root.breathingPhase * 1.5) * 6.5
                },
                Rotation {
                    origin.x: heroPoseItem.width / 2
                    origin.y: heroPoseItem.height / 2
                    axis { x: 0; y: 1; z: 0 }
                    angle: {
                        var dx = (root.smoothMouseX - (characterFlankStage.x + heroPoseItem.width / 2));
                        return Math.max(-22, Math.min(22, -dx * 0.024 + Math.sin(root.breathingPhase * 0.7) * 2.5));
                    }
                },
                Rotation {
                    origin.x: heroPoseItem.width / 2
                    origin.y: heroPoseItem.height / 2
                    axis { x: 1; y: 0; z: 0 }
                    angle: {
                        var dy = (root.smoothMouseY - (characterFlankStage.y + heroPoseItem.height / 2));
                        return Math.max(-15, Math.min(15, dy * 0.020 + Math.cos(root.breathingPhase * 0.6) * 2.0));
                    }
                }
            ]

            Image {
                id: heroImg
                anchors.centerIn: parent
                source: "character/alpha-hero.png"
                width: parent.width
                height: parent.height
                fillMode: Image.PreserveAspectFit
                asynchronous: true
                cache: true
                smooth: true
                scale: 1.0 + 0.015 * Math.sin(root.breathingPhase * 1.1)
            }

            // 8 Orbiting 3D Runic Motes circling around hero in depth
            Repeater {
                model: root.charOrbitMotes

                Item {
                    property real mRad: modelData.angle + root.breathingPhase * modelData.speed
                    property real mX: Math.cos(mRad) * modelData.radius
                    property real mZ: Math.sin(mRad) * modelData.radius
                    property real mY: Math.sin(mRad * 2.0 + modelData.phase) * 35.0

                    x: heroPoseItem.width / 2 + mX - 3
                    y: heroPoseItem.height * 0.52 + mY - 3
                    z: mZ > 0 ? 10 : -10

                    Rectangle {
                        width: 3.2 * (mZ > 0 ? 1.3 : 0.8)
                        height: width
                        radius: width / 2
                        color: mZ > 0 ? "#FFDF70" : "#A07818"
                        opacity: 0.35 + (mZ + 1.0) * 0.30
                    }
                }
            }
        }

        // ── POSE 2: WALK (Running Vector Stride from 1nc0gn30.si) ─────────────
        Item {
            id: walkPoseItem
            anchors.fill: parent
            opacity: root.activePoseName === "walk" ? 1.0 : 0.0
            visible: opacity > 0.01

            Behavior on opacity {
                NumberAnimation { duration: 340; easing.type: Easing.InOutQuad }
            }

            // Running athletic stride bounce & forward lean from 1nc0gn30.si
            transform: [
                Translate {
                    y: -Math.abs(Math.sin(root.breathingPhase * 7.5)) * 9.5
                },
                Translate {
                    x: (root.runningDirection > 0 ? 12 : -12) * Math.min(1.0, root.cursorSpeed / 20.0)
                },
                Rotation {
                    origin.x: walkPoseItem.width / 2
                    origin.y: walkPoseItem.height / 2
                    axis { x: 1; y: 0; z: 0 }
                    angle: 8.5
                },
                Rotation {
                    origin.x: walkPoseItem.width / 2
                    origin.y: walkPoseItem.height / 2
                    axis { x: 0; y: 1; z: 0 }
                    angle: (root.runningDirection > 0 ? -12.0 : 12.0)
                }
            ]

            Image {
                id: walkImg
                anchors.centerIn: parent
                source: "character/alpha-walk.png"
                width: parent.width * 1.05
                height: parent.height * 1.05
                fillMode: Image.PreserveAspectFit
                asynchronous: true
                cache: true
                smooth: true

                transform: Scale {
                    origin.x: walkImg.width / 2
                    origin.y: walkImg.height / 2
                    xScale: root.runningDirection > 0 ? -1.0 : 1.0
                }
            }

            // Trailing running vector wake particles streaming behind runner
            Repeater {
                model: 12

                Item {
                    property real pPhase: (index / 12.0) * 6.28
                    property real pLife: (root.breathingPhase * 3.5 + index * 0.28) % 1.0
                    property real streamDir: root.runningDirection > 0 ? -1.0 : 1.0

                    x: walkPoseItem.width / 2 + streamDir * (30.0 + pLife * 80.0) + Math.sin(pPhase + root.breathingPhase * 4.0) * 12.0
                    y: walkPoseItem.height * 0.45 + (pLife * 45.0) - Math.abs(Math.sin(root.breathingPhase * 7.5)) * 9.5
                    opacity: (1.0 - pLife) * 0.75

                    Rectangle {
                        width: (1.0 - parent.pLife) * 4.0 + 1.5
                        height: width
                        color: index % 3 === 0 ? "#39D353" : (index % 2 === 0 ? "#F5B82E" : "#FFF5D0")
                    }
                }
            }
        }

        // Luminous wavefront pulse on morph transition
        Rectangle {
            id: morphWavefront
            anchors.horizontalCenter: parent.horizontalCenter
            width: parent.width * 1.2
            height: 3
            color: "#FFE27A"
            opacity: 0.0
            y: parent.height * 0.5

            SequentialAnimation on opacity {
                id: waveAnim
                running: false
                NumberAnimation { to: 0.85; duration: 120 }
                NumberAnimation { to: 0.0; duration: 250 }
            }
        }
    }

    // ── 7. Expanding Shockwaves & Interactive Reticle ──────────────────────
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
                border.width: Math.max(1.0, wLife * 2.5)
                border.color: "#FFD700"
                opacity: wLife * 0.65
                visible: wLife > 0.01
            }
        }

        // Cursor Alchemical Ring
        Image {
            source: "images/ring.png"
            width: 88
            height: 88
            x: root.smoothMouseX - width / 2
            y: root.smoothMouseY - height / 2
            opacity: 0.12 + root.cursorActivity * 0.30
            scale: 0.70 + root.cursorActivity * 0.30
            rotation: root.sacredRotation * 2.0
            asynchronous: true
            cache: true
        }

        // Luminous Cursor Star Core
        Item {
            x: root.smoothMouseX
            y: root.smoothMouseY
            opacity: 0.35 + root.cursorActivity * 0.50

            Rectangle {
                anchors.centerIn: parent
                width: 18 + root.cursorActivity * 14
                height: 1.2
                radius: 0.6
                color: "#FFFDF0"
                rotation: root.sacredRotation * 1.5
            }
            Rectangle {
                anchors.centerIn: parent
                width: 1.2
                height: 18 + root.cursorActivity * 14
                radius: 0.6
                color: "#FFFDF0"
                rotation: root.sacredRotation * 1.5
            }
            Rectangle {
                anchors.centerIn: parent
                width: 3.5
                height: 3.5
                radius: 1.75
                color: "#FFFFFF"
            }
        }
    }

    // ── 8. Desktop Mouse Tracking Surface ──────────────────────────────────
    MouseArea {
        anchors.fill: parent
        hoverEnabled: true
        acceptedButtons: Qt.LeftButton | Qt.MiddleButton
        propagateComposedEvents: true

        onPositionChanged: (mouse) => {
            root.rawMouseX = mouse.x;
            root.rawMouseY = mouse.y;
            root.lastLocalMouseTime = Date.now();
            if (root.cursorActivity < 0.45) root.cursorActivity = 0.45;
        }

        onPressed: (mouse) => {
            root.rawMouseX = mouse.x;
            root.rawMouseY = mouse.y;
            root.lastLocalMouseTime = Date.now();
            root.cursorActivity = 1.0;
            root.triggerShockwave(mouse.x, mouse.y, 1.20);
            mouse.accepted = false;
        }
    }

    // ── 9. Global Compositor Cursor Polling Engine (Throttled & Non-Blocking)
    property bool xhrInFlight: false

    Timer {
        id: globalCursorTimer
        interval: 100 // 10Hz polling
        running: true
        repeat: true

        onTriggered: {
            var now = Date.now();
            // If local mouse events were active in the last 150ms, skip network poll
            if (now - root.lastLocalMouseTime < 150) return;
            if (root.xhrInFlight) return;

            root.xhrInFlight = true;
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "http://127.0.0.1:9989/");
            xhr.timeout = 200;
            xhr.onreadystatechange = function() {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    root.xhrInFlight = false;
                    if (xhr.status === 200 && xhr.responseText) {
                        try {
                            var data = JSON.parse(xhr.responseText);
                            if (data && typeof data.x === "number" && typeof data.y === "number") {
                                var gx = data.x;
                                var gy = data.y;
                                var lx = gx % root.width;
                                var ly = gy % root.height;

                                if (Math.abs(lx - root.rawMouseX) > 2.0 || Math.abs(ly - root.rawMouseY) > 2.0) {
                                    root.cursorActivity = 0.60;
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

    // ── 10. Adaptive Physics & Render Loop (Ultra Smooth 60/30 FPS) ────────
    Timer {
        id: masterRenderTimer
        interval: root.cursorActivity > 0.08 ? 16 : 33 // 60fps when active, 30fps when idle
        running: true
        repeat: true

        onTriggered: {
            var now = Date.now();
            var dt = root.lastFrameTime > 0 ? Math.min((now - root.lastFrameTime) / 1000.0, 0.05) : 0.016;
            root.lastFrameTime = now;

            // Advance phases smoothly
            root.breathingPhase += dt * (root.cursorActivity > 0.05 ? 1.3 : 0.80);
            root.sacredRotation = (root.sacredRotation + dt * (14.0 + root.cursorActivity * 30.0)) % 360.0;

            // Sweeping specular sheen on wordmark (from zothos.nullai.tech navbar)
            root.sheenProgress += dt * (root.cursorActivity > 0.05 ? 0.50 : 0.25);
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

            var targetAct = Math.min(moveDist / 10.0, 1.0);
            if (targetAct > root.cursorActivity) {
                root.cursorActivity += (targetAct - root.cursorActivity) * 0.35;
            } else {
                root.cursorActivity *= Math.exp(-2.5 * dt);
                if (root.cursorActivity < 0.02) root.cursorActivity = 0.02;
            }

            // Dynamic 1nc0gn30 Character Pose Logic (STRICTLY HERO & RUNNING WALK from 1nc0gn30.si)
            var prevPose = root.activePoseName;
            var isRunningMotion = moveDist > 14.0 || root.cursorActivity > 0.45;

            if (isRunningMotion) {
                root.activePoseName = "walk";
                root.lastRunTime = now;
                if (Math.abs(dxMouse) > 1.0) {
                    root.runningDirection = dxMouse > 0 ? 1 : -1;
                }
            } else if (now - root.lastRunTime > 650) {
                root.activePoseName = "hero";
            }

            if (prevPose !== root.activePoseName) {
                waveAnim.restart();
            }

            // Rapid whip motion shockwave trigger
            if (moveDist > 48.0) {
                var nowMs = Date.now();
                if (nowMs - root.lastWhipWaveTime > 450) {
                    root.lastWhipWaveTime = nowMs;
                    root.triggerShockwave(root.smoothMouseX, root.smoothMouseY, 0.90);
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

            // Request repaints on isolated canvases
            zMonolithCanvas.requestPaint();
            bgGraphicCanvas.requestPaint();
        }
    }

    // ── 11. Setup Procedural Geometry Models On Initialization ────────────
    Component.onCompleted: {
        var refW = root.width > 100 ? root.width : 1920;
        var refH = root.height > 100 ? root.height : 1080;

        // A. Generate Twinkling Pixel Stars Field
        var tStars = [];
        for (var si = 0; si < 42; si++) {
            tStars.push({
                x: Math.random() * refW,
                y: Math.random() * refH,
                sz: (si % 3 === 0) ? 2.0 : 1.2,
                phase: Math.random() * 6.28
            });
        }
        root.twinkleStars = tStars;

        // B. Generate Moving Metallic Gold Pixel Blocks
        var blist = [];
        var blockCount = 20;
        for (var bi = 0; bi < blockCount; bi++) {
            blist.push({
                x: Math.random() * refW,
                y: Math.random() * refH,
                vx: 0.12 + (bi % 4) * 0.06,
                vy: (Math.sin(bi * 1.3) * 0.08),
                sz: 14 + (bi % 4) * 4,
                phase: bi * 0.75
            });
        }
        root.goldPixelBlocks = blist;

        // C. CENTERPIECE: 3D Volumetric Sculpted Monolith "Z" Mesh
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
        for (var fvi = 0; fvi < 10; fvi++) {
            zVerts.push([zContour[fvi][0], zContour[fvi][1], -zDepth]);
        }
        for (var bvi = 0; bvi < 10; bvi++) {
            zVerts.push([zContour[bvi][0], zContour[bvi][1], zDepth]);
        }

        var zFaces = [];
        zFaces.push([0, 9, 2, 1]);     // Top bar
        zFaces.push([7, 3, 2, 8]);     // Diagonal shear
        zFaces.push([6, 5, 4, 7]);     // Bottom bar

        zFaces.push([10, 11, 12, 19]); // Top bar back
        zFaces.push([18, 12, 13, 17]); // Diagonal back
        zFaces.push([17, 14, 15, 16]); // Bottom bar back

        for (var sei = 0; sei < 10; sei++) {
            var seiNext = (sei + 1) % 10;
            zFaces.push([sei, seiNext, 10 + seiNext, 10 + sei]);
        }

        var orbitParticles = [];
        for (var opi = 0; opi < 24; opi++) {
            var aRad = (opi / 24.0) * 6.28318;
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

        // D. 3D Lattice Cube from zothos.nullai.tech Navbar Logo
        var latP = [];
        var LN = 2;
        for (var li = 0; li <= LN; li++) {
            for (var lj = 0; lj <= LN; lj++) {
                for (var lk = 0; lk <= LN; lk++) {
                    latP.push([(li / LN) * 2 - 1, (lj / LN) * 2 - 1, (lk / LN) * 2 - 1]);
                }
            }
        }
        function getLid(i, j, k) { return (i * (LN + 1) + j) * (LN + 1) + k; }
        var latE = [];
        for (var ei = 0; ei <= LN; ei++) {
            for (var ej = 0; ej <= LN; ej++) {
                for (var ek = 0; ek <= LN; ek++) {
                    if (ei < LN) latE.push([getLid(ei, ej, ek), getLid(ei + 1, ej, ek)]);
                    if (ej < LN) latE.push([getLid(ei, ej, ek), getLid(ei, ej + 1, ek)]);
                    if (ek < LN) latE.push([getLid(ei, ej, ek), getLid(ei, ej, ek + 1)]);
                }
            }
        }
        root.latticePoints = latP;
        root.latticeEdges = latE;

        // E. Constellation Ley-Line Star Nodes
        var cNodes = [];
        for (var ni = 0; ni < root.nodeCount; ni++) {
            cNodes.push({
                x: (ni * 163.5) % refW,
                y: (ni * 277.7) % refH,
                vx: Math.cos(ni * 1.7) * 0.20,
                vy: Math.sin(ni * 2.3) * 0.20,
                r: 1.4,
                phase: (ni * 0.85) % 6.28
            });
        }
        root.constellationNodes = cNodes;

        // F. Floating Sparks
        var spks = [];
        for (var spi = 0; spi < 20; spi++) {
            spks.push({
                x: Math.random() * refW,
                y: Math.random() * refH,
                vx: 0.18 + Math.random() * 0.35,
                vy: (Math.random() - 0.5) * 0.15,
                phase: Math.random() * 6.28
            });
        }
        root.brailleSparks = spks;

        // G. 1nc0gn30 3D Orbiting Motes
        var cMotes = [];
        for (var mi = 0; mi < 8; mi++) {
            cMotes.push({
                angle: (mi / 8.0) * 6.28318,
                radius: 110.0 + (mi % 3) * 25.0,
                speed: 0.65 + (mi % 2) * 0.25,
                phase: mi * 0.78
            });
        }
        root.charOrbitMotes = cMotes;
    }
}
