import QtQuick
import org.kde.plasma.plasmoid
import org.kde.plasma.core as PlasmaCore

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
    property real breathingPhase: 0.0
    property real sacredRotation: 0.0
    property real sheenProgress: -0.4
    property int idleThrottle: 0

    // Shockwave Ring Pool (4 expanding pulse rings on click or whip-burst)
    readonly property int waveCount: 4
    property int waveHead: 0
    property var waveItems: []
    property double lastWhipWaveTime: 0

    // Constellation ley-line nodes
    readonly property int nodeCount: 22
    property var constellationNodes: []

    // Mathematical Constants & Data Grids for Uncommon Web Engine
    readonly property var bayer4: [
        0.03125, 0.53125, 0.15625, 0.65625,
        0.78125, 0.28125, 0.90625, 0.40625,
        0.21875, 0.71875, 0.09375, 0.59375,
        0.96875, 0.46875, 0.84375, 0.34375
    ]

    // 1. Moving Metallic Gold Pixel Blocks
    property var goldPixelBlocks: []

    // 2. 1nc0gn30.si Background 3D Hyper-Lattice (N=3: 64 points, 144 edges)
    property var bgLatticePoints: []
    property var bgLatticeEdges: []

    // 3. Centerpiece: 3D Unicode Braille Lattice Letter "Z" (78 points, 156 edges)
    property var zLatticePoints: []
    property var zLatticeEdges: []

    // 4. Floating Braille/ASCII sparks pool
    property var brailleSparks: []

    // 5. Pre-computed active pixel coordinates for ZOTHOS wordmark
    property var wordmarkPixels: []

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

    // ── 2. Sacred Hermetic Rings & Ambient Bloom Behind 3D Z ───────────────
    Item {
        id: sacredCenterBackdrop
        anchors.centerIn: parent
        anchors.verticalCenterOffset: -45
        width: Math.min(root.width * 0.52, 640)
        height: width

        property real centerDist: Math.hypot(root.smoothMouseX - (parent.width / 2), root.smoothMouseY - (parent.height / 2 - 45))
        property real centerProximity: Math.max(0.0, 1.0 - centerDist / 650.0)

        // Outer Alchemical Ring
        Image {
            id: sacredOuterRing
            source: "images/ring.png"
            anchors.centerIn: parent
            width: parent.width * (0.92 + sacredCenterBackdrop.centerProximity * 0.06)
            height: width
            opacity: 0.16 + sacredCenterBackdrop.centerProximity * 0.22 + 0.04 * Math.sin(root.breathingPhase)
            rotation: -root.sacredRotation * 0.6
            asynchronous: true
            cache: true
            smooth: true
        }

        // Inner Hermetic Seal (slow rotation + 3D parallax)
        Image {
            id: sacredSeal
            source: "images/seal.png"
            anchors.centerIn: parent
            width: parent.width * 0.68
            height: width
            opacity: 0.13 + sacredCenterBackdrop.centerProximity * 0.18 + 0.03 * Math.cos(root.breathingPhase * 0.7)
            rotation: root.sacredRotation * 0.35
            asynchronous: true
            cache: true
            smooth: true

            transform: [
                Rotation {
                    origin.x: sacredSeal.width / 2
                    origin.y: sacredSeal.height / 2
                    axis { x: 0; y: 1; z: 0 }
                    angle: (root.smoothMouseX - root.width / 2) * 0.009
                },
                Rotation {
                    origin.x: sacredSeal.width / 2
                    origin.y: sacredSeal.height / 2
                    axis { x: 1; y: 0; z: 0 }
                    angle: -(root.smoothMouseY - root.height / 2) * 0.009
                }
            ]
        }

        // Central Golden Bloom
        Image {
            id: centerBloom
            source: "images/glow.png"
            anchors.centerIn: parent
            width: parent.width * 1.15
            height: width
            opacity: 0.30 + 0.12 * Math.sin(root.breathingPhase * 0.8) + sacredCenterBackdrop.centerProximity * 0.20
            asynchronous: true
            cache: true
        }
    }

    // ── 3. Master GPU Canvas: Metallic Blocks + 1nc0gn30 Lattice + 3D Z ───
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
            var normMx = (mx - W * 0.5) / (W * 0.5);
            var normMy = (my - H * 0.5) / (H * 0.5);

            // ── A. Moving Metallic Gold Pixel Blocks (Background Field) ───
            var blocks = root.goldPixelBlocks;
            if (blocks && blocks.length > 0) {
                for (var bi = 0; bi < blocks.length; bi++) {
                    var b = blocks[bi];
                    var distM = Math.hypot(mx - (b.x + b.sz * 0.5), my - (b.y + b.sz * 0.5));
                    var mBoost = distM < 240.0 ? (1.0 - distM / 240.0) : 0.0;

                    // Wave shimmer phase
                    var bPhase = Math.sin(t * 1.2 + b.phase + (b.x + b.y) * 0.004);
                    var bAlpha = Math.max(0.12, Math.min(0.85, 0.18 + bPhase * 0.12 + mBoost * 0.45));

                    // Metallic Gold Fill Gradient
                    var grad = ctx.createLinearGradient(b.x, b.y, b.x + b.sz, b.y + b.sz);
                    if (mBoost > 0.35) {
                        grad.addColorStop(0.0, "rgba(255, 253, 240, " + bAlpha.toFixed(2) + ")");
                        grad.addColorStop(0.5, "rgba(255, 225, 120, " + bAlpha.toFixed(2) + ")");
                        grad.addColorStop(1.0, "rgba(165, 125, 20, " + bAlpha.toFixed(2) + ")");
                    } else {
                        grad.addColorStop(0.0, "rgba(255, 232, 158, " + (bAlpha * 0.9).toFixed(2) + ")");
                        grad.addColorStop(0.5, "rgba(212, 175, 55, " + (bAlpha * 0.85).toFixed(2) + ")");
                        grad.addColorStop(1.0, "rgba(107, 80, 8, " + (bAlpha * 0.75).toFixed(2) + ")");
                    }
                    ctx.fillStyle = grad;
                    ctx.fillRect(b.x, b.y, b.sz, b.sz);

                    // 3D Metallic Bevel Edges
                    ctx.fillStyle = "rgba(255, 253, 240, " + (bAlpha * 0.95).toFixed(2) + ")";
                    ctx.fillRect(b.x, b.y, b.sz, 1.0); // top light
                    ctx.fillRect(b.x, b.y, 1.0, b.sz); // left light

                    ctx.fillStyle = "rgba(35, 25, 3, " + (bAlpha * 0.90).toFixed(2) + ")";
                    ctx.fillRect(b.x, b.y + b.sz - 1.0, b.sz, 1.0); // bottom shade
                    ctx.fillRect(b.x + b.sz - 1.0, b.y, 1.0, b.sz); // right shade

                    // Bayer 4x4 sub-pixel metallic dither core
                    var bayerThresh = root.bayer4[((bi * 3) & 3) * 4 + ((bi * 5) & 3)];
                    if (bayerThresh > 0.40) {
                        ctx.fillStyle = "rgba(255, 248, 220, " + (bAlpha * 0.50).toFixed(2) + ")";
                        ctx.fillRect(b.x + b.sz * 0.3, b.y + b.sz * 0.3, b.sz * 0.4, b.sz * 0.4);
                    }
                }
            }

            // ── B. 1nc0gn30.si 3D Hyper-Lattice Figure in Background ─────
            var bgPts = root.bgLatticePoints;
            var bgEdges = root.bgLatticeEdges;
            if (bgPts.length > 0 && bgEdges.length > 0) {
                var bcx = W * 0.5;
                var bcy = H * 0.43 - 35;
                var bScale = Math.min(W * 0.20, 260);

                // Slower majestic background counter-rotation
                var bYaw = -t * 0.22 + normMx * 0.45;
                var bPitch = 0.38 + Math.sin(t * 0.25) * 0.12 + normMy * 0.35;
                var bcosY = Math.cos(bYaw), bsinY = Math.sin(bYaw);
                var bcosX = Math.cos(bPitch), bsinX = Math.sin(bPitch);

                var bProj = [];
                for (var bpi = 0; bpi < bgPts.length; bpi++) {
                    var bp = bgPts[bpi];
                    var bpx = bp[0], bpy = bp[1], bpz = bp[2];
                    var bX = bpx * bcosY - bpz * bsinY;
                    var bZ = bpx * bsinY + bpz * bcosY;
                    var bY = bpy * bcosX - bZ * bsinX;
                    bZ = bpy * bsinX + bZ * bcosX;
                    var bf = 2.8 / (3.6 + bZ);
                    bProj.push([bcx + bX * bScale * bf, bcy + bY * bScale * bf, bZ]);
                }

                // Render 1nc0gn30.si lattice filaments
                ctx.lineWidth = 0.9;
                for (var bei = 0; bei < bgEdges.length; bei++) {
                    var bEdge = bgEdges[bei];
                    var bpA = bProj[bEdge[0]];
                    var bpB = bProj[bEdge[1]];
                    var bAvgZ = (bpA[2] + bpB[2]) * 0.5;
                    var bDepthAlpha = Math.max(0.04, Math.min(0.35, 0.12 + ((2.0 - bAvgZ) / 4.0) * 0.25));
                    ctx.strokeStyle = "rgba(212, 175, 55, " + bDepthAlpha.toFixed(3) + ")";
                    ctx.beginPath();
                    ctx.moveTo(bpA[0], bpA[1]);
                    ctx.lineTo(bpB[0], bpB[1]);
                    ctx.stroke();
                }

                // 1nc0gn30 node points (Bayer-dithered ambient nodes)
                for (var bvi = 0; bvi < bProj.length; bvi++) {
                    var bvPt = bProj[bvi];
                    if (bvPt[2] < 0.2 && bvi % 2 === 0) {
                        ctx.fillStyle = "rgba(255, 215, 0, 0.28)";
                        ctx.fillRect(bvPt[0] - 1.2, bvPt[1] - 1.2, 2.4, 2.4);
                    }
                }
            }

            // ── C. Centerpiece: 3D Unicode Braille Lattice Letter "Z" ─────
            var zPts = root.zLatticePoints;
            var zEdges = root.zLatticeEdges;
            if (zPts.length > 0 && zEdges.length > 0) {
                var zcx = W * 0.5;
                var zcy = H * 0.43 - 35;
                var zScale = Math.min(W * 0.16, 210);

                // High-responsiveness mouse-tracking yaw and pitch
                var zYaw = t * 0.42 + normMx * 0.95;
                var zPitch = 0.28 + Math.sin(t * 0.45) * 0.10 + normMy * 0.70;

                var zcosY = Math.cos(zYaw), zsinY = Math.sin(zYaw);
                var zcosX = Math.cos(zPitch), zsinX = Math.sin(zPitch);

                var zProj = [];
                for (var zpi = 0; zpi < zPts.length; zpi++) {
                    var zp = zPts[zpi];
                    var zx = zp[0], zy = zp[1], zz = zp[2];
                    var zX = zx * zcosY - zz * zsinY;
                    var zZ = zx * zsinY + zz * zcosY;
                    var zY = zy * zcosX - zZ * zsinX;
                    zZ = zy * zsinX + zZ * zcosX;
                    var zf = 2.9 / (3.4 + zZ);
                    zProj.push([zcx + zX * zScale * zf, zcy + zY * zScale * zf, zZ, zp[2]]);
                }

                // 1. Draw 3D Z Lattice Edges / Struts with Depth Attenuation
                ctx.lineWidth = 1.6;
                for (var zei = 0; zei < zEdges.length; zei++) {
                    var zEdge = zEdges[zei];
                    var zpA = zProj[zEdge[0]];
                    var zpB = zProj[zEdge[1]];
                    var zAvgZ = (zpA[2] + zpB[2]) * 0.5;
                    var isFrontEdge = (zpA[3] < -0.1 && zpB[3] < -0.1);

                    var zEdgeAlpha = Math.max(0.15, Math.min(0.95, (isFrontEdge ? 0.65 : 0.30) + ((1.5 - zAvgZ) / 3.0) * 0.45));
                    ctx.strokeStyle = isFrontEdge ?
                        "rgba(255, 248, 220, " + zEdgeAlpha.toFixed(3) + ")" :
                        "rgba(255, 215, 0, " + zEdgeAlpha.toFixed(3) + ")";
                    ctx.beginPath();
                    ctx.moveTo(zpA[0], zpA[1]);
                    ctx.lineTo(zpB[0], zpB[1]);
                    ctx.stroke();
                }

                // 2. Render Unicode Braille & 24K Gold Glyphs at 3D Z Vertices
                ctx.font = 'bold 12px "JetBrains Mono", "DejaVu Sans Mono", monospace';
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                var brailleZSymbols = ["⣿", "⠿", "⬡", "⠇", "⠋", "⠸", "⠹", "⠼", "⠿", "⣿", "⬡", "⠇"];
                for (var zvi = 0; zvi < zProj.length; zvi++) {
                    var zvNode = zProj[zvi];
                    var isFront = zvNode[3] < -0.1;
                    var zDepthAlpha = Math.min(1.0, (isFront ? 0.70 : 0.35) + (1.2 - zvNode[2]) * 0.40);

                    // Specular light sweep on 3D Z nodes
                    var scanWave = Math.sin(t * 1.5 + zvNode[0] * 0.02);
                    var hasGlint = scanWave > 0.65;

                    if (hasGlint || isFront) {
                        ctx.fillStyle = hasGlint ? "#FFFFFF" : "rgba(255, 248, 220, " + zDepthAlpha.toFixed(2) + ")";
                    } else {
                        ctx.fillStyle = "rgba(212, 175, 55, " + zDepthAlpha.toFixed(2) + ")";
                    }
                    ctx.fillText(brailleZSymbols[zvi % brailleZSymbols.length], zvNode[0], zvNode[1]);
                }

                // 3. Extruded Specular 24K Gold Monolith Front Bevel
                var zArm = zScale * 0.46;
                var zRise = zScale * 0.52;
                ctx.save();
                ctx.translate(zcx, zcy);
                ctx.scale(Math.cos(zYaw) * 0.18 + 0.90, Math.cos(zPitch) * 0.14 + 0.92);
                ctx.lineCap = "square";
                ctx.lineJoin = "miter";

                // Drop shadow extrusion
                ctx.strokeStyle = "rgba(92, 67, 8, 0.85)";
                ctx.lineWidth = 5.0;
                ctx.beginPath();
                ctx.moveTo(-zArm + 3.0, -zRise + 3.0);
                ctx.lineTo(zArm + 3.0, -zRise + 3.0);
                ctx.lineTo(-zArm + 3.0, zRise + 3.0);
                ctx.lineTo(zArm + 3.0, zRise + 3.0);
                ctx.stroke();

                // Specular 24K Gold stroke
                ctx.strokeStyle = "#FFE89E";
                ctx.lineWidth = 3.6;
                ctx.beginPath();
                ctx.moveTo(-zArm, -zRise);
                ctx.lineTo(zArm, -zRise);
                ctx.lineTo(-zArm, zRise);
                ctx.lineTo(zArm, zRise);
                ctx.stroke();
                ctx.restore();
            }

            // ── D. Interactive Ley-Line Filaments ─────────────────────────
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
                    ctx.fillStyle = nBoost > 0.3 ? "rgba(255, 248, 220, " + nA.toFixed(3) + ")" : "rgba(212, 175, 55, " + nA.toFixed(3) + ")";
                    ctx.beginPath();
                    ctx.arc(na.x, na.y, na.r + nBoost * 2.0, 0, 6.28318);
                    ctx.fill();
                }
            }

            // ── E. Floating Braille & Hex Sparks (Uncommon Web Embers) ────
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

            // ── F. Dynamic Comet Wake from Cursor Motion ──────────────────
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

            // ── G. Sub-Pixel Braille / Bayer Dither Wordmark "ZOTHOS" ─────
            var wPixels = root.wordmarkPixels;
            if (wPixels && wPixels.length > 0) {
                var wordH = 7;
                var wordW = 47;
                var wScale = Math.min(W * 0.0075, 9.5);
                var startX = W * 0.5 - (wordW * wScale) * 0.5;
                var startY = H * 0.74;

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
                    }
                }

                // ── H. Micro-Telemetry Technical Sub-Deck ──────────────────
                ctx.font = 'bold 11px "JetBrains Mono", "DejaVu Sans Mono", monospace';
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "rgba(212, 175, 55, 0.88)";
                ctx.fillText("⣿ U+2800 UNICODE BRAILLE  ·  3D Z-LATTICE  ·  1NC0GN30 HYPERSTRUCTURE  ·  ZOTHOS LINUX", W * 0.5, startY + wordH * wScale + 24);
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
        interval: 60
        running: true
        repeat: true

        onTriggered: {
            var now = Date.now();
            if (now - root.lastLocalMouseTime < 80) return;
            if (root.xhrInFlight) return;

            root.xhrInFlight = true;
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "http://127.0.0.1:9989/");
            xhr.onreadystatechange = function() {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    root.xhrInFlight = false;
                    if (xhr.status === 200 && xhr.responseText) {
                        try {
                            var data = JSON.parse(xhr.responseText);
                            if (data && typeof data.x === "number" && typeof data.y === "number") {
                                var gx = data.x;
                                var gy = data.y;

                                // Map global desktop coordinates to this screen's local space
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
                                        ly = gy;
                                    }
                                } catch (err) {
                                    lx = gx % root.width;
                                    ly = gy;
                                }

                                if (Math.abs(lx - root.rawMouseX) > 2.0 || Math.abs(ly - root.rawMouseY) > 2.0) {
                                    root.cursorActivity = 0.75;
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

    // ── 7. Master Physics & Render Loop (Dynamic Adaptive) ─────────────────
    Timer {
        id: masterRenderTimer
        interval: 20 // 50 FPS smooth render loop
        running: true
        repeat: true

        onTriggered: {
            root.breathingPhase += (root.cursorActivity > 0.05 ? 0.024 : 0.012);
            root.sacredRotation = (root.sacredRotation + 0.16 + root.cursorActivity * 0.65) % 360.0;

            // Sweeping specular sheen on wordmark
            root.sheenProgress += (root.cursorActivity > 0.05 ? 0.010 : 0.004);
            if (root.sheenProgress > 1.8) {
                root.sheenProgress = -0.4;
            }

            // Smoothly interpolate cursor position
            root.smoothMouseX += (root.rawMouseX - root.smoothMouseX) * 0.22;
            root.smoothMouseY += (root.rawMouseY - root.smoothMouseY) * 0.22;
            root.trailMouseX += (root.smoothMouseX - root.trailMouseX) * 0.10;
            root.trailMouseY += (root.smoothMouseY - root.trailMouseY) * 0.10;

            // Velocity & activity decay
            var dxMouse = root.smoothMouseX - root.prevSmoothX;
            var dyMouse = root.smoothMouseY - root.prevSmoothY;
            var moveDist = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
            root.cursorVelocityX = dxMouse;
            root.cursorVelocityY = dyMouse;
            root.cursorSpeed = moveDist;
            root.prevSmoothX = root.smoothMouseX;
            root.prevSmoothY = root.smoothMouseY;

            var targetAct = Math.min(moveDist / 14.0, 1.0);
            if (targetAct > root.cursorActivity) {
                root.cursorActivity += (targetAct - root.cursorActivity) * 0.35;
            } else {
                root.cursorActivity *= 0.94;
                if (root.cursorActivity < 0.02) root.cursorActivity = 0.02;
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
                        wItem.wLife *= 0.92;
                        if (wItem.wLife <= 0.01) wItem.wLife = 0.0;
                    }
                }
            }

            // Drift metallic gold pixel blocks
            var blocks = root.goldPixelBlocks;
            if (blocks && blocks.length > 0 && root.width > 0) {
                for (var bi = 0; bi < blocks.length; bi++) {
                    var b = blocks[bi];
                    b.x += b.vx;
                    b.y += b.vy;
                    if (b.x > root.width + 40) b.x = -40;
                    else if (b.x < -40) b.x = root.width + 40;
                    if (b.y > root.height + 40) b.y = -40;
                    else if (b.y < -40) b.y = root.height + 40;
                }
            }

            // Drift constellation nodes
            var nodes = root.constellationNodes;
            if (nodes && nodes.length > 0) {
                for (var ci = 0; ci < nodes.length; ci++) {
                    var cn = nodes[ci];
                    cn.x += cn.vx;
                    cn.y += cn.vy;

                    // Swirl around cursor when near
                    var cdx = root.smoothMouseX - cn.x;
                    var cdy = root.smoothMouseY - cn.y;
                    var cdist = Math.sqrt(cdx * cdx + cdy * cdy);
                    if (cdist > 25.0 && cdist < 240.0) {
                        var pull = (1.0 - cdist / 240.0) * 0.40;
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
                for (var si = 0; si < sparks.length; si++) {
                    var sp = sparks[si];
                    sp.x += sp.vx;
                    sp.y += sp.vy;
                    if (sp.x > root.width + 20) sp.x = -20;
                    if (sp.y > root.height + 20) sp.y = -20;
                    else if (sp.y < -20) sp.y = root.height + 20;
                }
            }

            // Throttle idle canvas repaints to keep CPU near 0%
            if (root.cursorActivity > 0.05) {
                mainGraphicCanvas.requestPaint();
            } else {
                root.idleThrottle = (root.idleThrottle + 1) % 2;
                if (root.idleThrottle === 0) {
                    mainGraphicCanvas.requestPaint();
                }
            }
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

        // B. Generate Moving Metallic Gold Pixel Blocks
        var blist = [];
        var blockCount = 42;
        for (var bi = 0; bi < blockCount; bi++) {
            blist.push({
                x: Math.random() * refW,
                y: Math.random() * refH,
                vx: 0.15 + (bi % 4) * 0.08,
                vy: (Math.sin(bi * 1.3) * 0.12),
                sz: 18 + (bi % 5) * 6, // 18px to 42px
                phase: bi * 0.75
            });
        }
        root.goldPixelBlocks = blist;

        // C. 1nc0gn30.si Background 3D Hyper-Lattice (N=3: 64 points, 144 edges)
        var bgP = [];
        var bgE = [];
        var N = 3;
        for (var i = 0; i <= N; i++) {
            for (var j = 0; j <= N; j++) {
                for (var k = 0; k <= N; k++) {
                    bgP.push([i / N * 2 - 1, j / N * 2 - 1, k / N * 2 - 1]);
                }
            }
        }
        var bgLid = function(ii, jj, kk) { return (ii * (N + 1) + jj) * (N + 1) + kk; };
        for (var ii = 0; ii <= N; ii++) {
            for (var jj = 0; jj <= N; jj++) {
                for (var kk = 0; kk <= N; kk++) {
                    if (ii < N) bgE.push([bgLid(ii, jj, kk), bgLid(ii + 1, jj, kk)]);
                    if (jj < N) bgE.push([bgLid(ii, jj, kk), bgLid(ii, jj + 1, kk)]);
                    if (kk < N) bgE.push([bgLid(ii, jj, kk), bgLid(ii, jj, kk + 1)]);
                }
            }
        }
        root.bgLatticePoints = bgP;
        root.bgLatticeEdges = bgE;

        // D. Centerpiece: 3D Unicode Braille Lattice Letter "Z" (78 points, 156 edges)
        var zContour = [
            [-0.75, -0.75],
            [ 0.75, -0.75],
            [ 0.75, -0.50],
            [-0.35,  0.50],
            [ 0.75,  0.50],
            [ 0.75,  0.75],
            [-0.75,  0.75],
            [-0.75,  0.50],
            [ 0.35, -0.50],
            [-0.75, -0.50]
        ];

        var zDepths = [-0.30, 0.0, 0.30];
        var edgeSubdiv = [4, 1, 4, 3, 1, 4, 1, 4, 3, 1];
        var ring2D = [];
        for (var eIdx = 0; eIdx < zContour.length; eIdx++) {
            var pA = zContour[eIdx];
            var pB = zContour[(eIdx + 1) % zContour.length];
            var nSteps = edgeSubdiv[eIdx];
            for (var s = 0; s < nSteps; s++) {
                var u = s / nSteps;
                ring2D.push([pA[0] + (pB[0] - pA[0]) * u, pA[1] + (pB[1] - pA[1]) * u]);
            }
        }

        var nRing = ring2D.length; // 26 perimeter vertices per layer
        var zP = [];
        var zE = [];

        // Generate 3 layers of vertices (front, mid, back) -> 26 * 3 = 78 vertices
        for (var lIdx = 0; lIdx < zDepths.length; lIdx++) {
            var zVal = zDepths[lIdx];
            for (var rIdx = 0; rIdx < nRing; rIdx++) {
                zP.push([ring2D[rIdx][0], ring2D[rIdx][1], zVal]);
            }
        }

        // Intra-layer perimeter edges -> 26 * 3 = 78 edges
        for (var lIdx = 0; lIdx < zDepths.length; lIdx++) {
            var base = lIdx * nRing;
            for (var rIdx = 0; rIdx < nRing; rIdx++) {
                zE.push([base + rIdx, base + ((rIdx + 1) % nRing)]);
            }
        }

        // Inter-layer longitudinal and cross-lattice struts -> 26 * 2 + 26 = 78 edges
        for (var lIdx = 0; lIdx < zDepths.length - 1; lIdx++) {
            var baseA = lIdx * nRing;
            var baseB = (lIdx + 1) * nRing;
            for (var rIdx = 0; rIdx < nRing; rIdx++) {
                zE.push([baseA + rIdx, baseB + rIdx]);
                if (rIdx % 2 === 0) {
                    zE.push([baseA + rIdx, baseB + ((rIdx + 1) % nRing)]);
                }
            }
        }

        root.zLatticePoints = zP;
        root.zLatticeEdges = zE;

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
