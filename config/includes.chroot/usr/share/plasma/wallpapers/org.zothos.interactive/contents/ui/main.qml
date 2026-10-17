import QtQuick
import org.kde.plasma.plasmoid
import org.kde.plasma.core as PlasmaCore

WallpaperItem {
    id: root

    // Configuration parameters
    readonly property real maxTilt: 25.0
    readonly property real influenceRadius: 600.0

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
    property real cursorActivity: 0.0
    property double lastLocalMouseTime: 0
    property real breathingPhase: 0.0
    property real sacredRotation: 0.0
    property real sheenProgress: -0.4

    // Particle pool state (upgraded to 84 particles)
    readonly property int sparkCount: 84
    property int sparkHead: 0
    property var sparkItems: []

    // Interactive Constellation Nodes (32 reactive ley-line stars)
    readonly property int nodeCount: 32
    property var constellationNodes: []

    // Shockwave Ring Pool (4 expanding pulse rings on click or whip-burst)
    readonly property int waveCount: 4
    property int waveHead: 0
    property var waveItems: []
    property double lastWhipWaveTime: 0

    function triggerShockwave(wx, wy, intensityScale) {
        if (root.waveItems.length === 0) {
            var wList = [];
            for (var wk = 0; wk < root.waveCount; wk++) {
                var wItm = waveRepeater.itemAt(wk);
                if (wItm) wList.push(wItm);
            }
            if (wList.length === root.waveCount) {
                root.waveItems = wList;
            }
        }
        if (root.waveItems.length === root.waveCount) {
            var w = root.waveItems[root.waveHead];
            if (w) {
                w.wx = wx;
                w.wy = wy;
                w.wLife = 1.0;
                w.wMaxRadius = (240 + Math.random() * 120) * (intensityScale || 1.0);
            }
            root.waveHead = (root.waveHead + 1) % root.waveCount;
        }
    }

    function spawnBurstSparks(bx, by, count) {
        var items = root.sparkItems;
        if (!items || items.length !== root.sparkCount) return;
        var palette = ["#FFFFFF", "#FFF9C4", "#FFE082", "#FFD700", "#FFC107", "#00F0FF", "#FFB300"];
        for (var s = 0; s < count; s++) {
            var p = items[root.sparkHead];
            if (p) {
                var angle = (s / count) * 6.28318 + (Math.random() - 0.5) * 0.3;
                var speed = 1.8 + Math.random() * 4.8;
                p.px = bx + (Math.random() - 0.5) * 8;
                p.py = by + (Math.random() - 0.5) * 8;
                p.pVx = Math.cos(angle) * speed;
                p.pVy = Math.sin(angle) * speed;
                p.pLife = 1.0;
                p.pDecay = 0.014 + Math.random() * 0.016;
                p.pSize = 3.2 + Math.random() * 5.2;
                p.pRot = Math.random() * 360;
                p.pVRot = (Math.random() - 0.5) * 9.0;
                p.pColor = palette[Math.floor(Math.random() * palette.length)];
            }
            root.sparkHead = (root.sparkHead + 1) % root.sparkCount;
        }
    }

    // ── 1. Base Wallpaper Vignette Layer (Subtle Cursor Parallax) ──────────
    Image {
        id: bgImage
        width: parent.width * 1.03
        height: parent.height * 1.03
        x: -parent.width * 0.015 + (root.width / 2 - root.smoothMouseX) * 0.008
        y: -parent.height * 0.015 + (root.height / 2 - root.smoothMouseY) * 0.008
        source: "images/bg.png"
        fillMode: Image.PreserveAspectCrop
        asynchronous: true
        cache: true
    }

    // ── 2. Interactive Alchemical Constellation & Ley-Line Canvas ──────────
    Canvas {
        id: constellationCanvas
        anchors.fill: parent
        opacity: 0.85

        onPaint: {
            var ctx = getContext("2d");
            ctx.clearRect(0, 0, width, height);

            var nodes = root.constellationNodes;
            if (!nodes || nodes.length === 0) return;

            var mx = root.smoothMouseX;
            var my = root.smoothMouseY;
            var connectDist = 185.0;
            var cursorConnectDist = 260.0;

            ctx.lineWidth = 1.0;

            // Draw node-to-node golden filaments & node-to-cursor ley lines
            for (var i = 0; i < nodes.length; i++) {
                var a = nodes[i];

                // Connection to cursor
                var dmx = mx - a.x;
                var dmy = my - a.y;
                var dm = Math.sqrt(dmx * dmx + dmy * dmy);
                if (dm < cursorConnectDist) {
                    var cAlpha = (1.0 - dm / cursorConnectDist) * (0.28 + root.cursorActivity * 0.35);
                    ctx.strokeStyle = "rgba(255, 215, 0, " + cAlpha.toFixed(3) + ")";
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(mx, my);
                    ctx.stroke();
                }

                // Connection to neighbor nodes
                for (var j = i + 1; j < nodes.length; j++) {
                    var b = nodes[j];
                    var dx = a.x - b.x;
                    var dy = a.y - b.y;
                    if (Math.abs(dx) > connectDist || Math.abs(dy) > connectDist) continue;
                    var d = Math.sqrt(dx * dx + dy * dy);
                    if (d < connectDist) {
                        var nAlpha = (1.0 - d / connectDist) * 0.16;
                        ctx.strokeStyle = "rgba(255, 215, 0, " + nAlpha.toFixed(3) + ")";
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }

            // Draw luminous star nodes
            for (var k = 0; k < nodes.length; k++) {
                var n = nodes[k];
                var ndx = mx - n.x;
                var ndy = my - n.y;
                var nd = Math.sqrt(ndx * ndx + ndy * ndy);
                var boost = nd < cursorConnectDist ? (1.0 - nd / cursorConnectDist) : 0.0;
                var alpha = Math.min(1.0, 0.25 + 0.25 * Math.sin(root.breathingPhase + n.phase) + boost * 0.55);
                var rad = n.r + boost * 2.2;

                ctx.fillStyle = boost > 0.35 ? "rgba(255, 248, 205, " + alpha.toFixed(3) + ")" : "rgba(255, 215, 0, " + alpha.toFixed(3) + ")";
                ctx.beginPath();
                ctx.arc(n.x, n.y, rad, 0, 6.28318);
                ctx.fill();
            }

            // Draw sleek multi-segment cursor comet ribbon when moving
            var vx = root.smoothMouseX - root.trailMouseX;
            var vy = root.smoothMouseY - root.trailMouseY;
            var tailLen = Math.sqrt(vx * vx + vy * vy);
            if (tailLen > 2.0) {
                var grad = ctx.createLinearGradient(root.trailMouseX, root.trailMouseY, root.smoothMouseX, root.smoothMouseY);
                grad.addColorStop(0.0, "rgba(255, 180, 0, 0.0)");
                grad.addColorStop(0.6, "rgba(255, 215, 0, " + (0.18 + root.cursorActivity * 0.28).toFixed(3) + ")");
                grad.addColorStop(1.0, "rgba(255, 250, 220, " + (0.35 + root.cursorActivity * 0.45).toFixed(3) + ")");
                ctx.strokeStyle = grad;
                ctx.lineWidth = 2.2 + root.cursorActivity * 3.0;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(root.trailMouseX, root.trailMouseY);
                ctx.quadraticCurveTo(
                    (root.trailMouseX + root.smoothMouseX) * 0.5 - root.cursorVelocityY * 0.4,
                    (root.trailMouseY + root.smoothMouseY) * 0.5 + root.cursorVelocityX * 0.4,
                    root.smoothMouseX,
                    root.smoothMouseY
                );
                ctx.stroke();
            }
        }
    }

    // ── 3. Ambient Floating Stardust Embers ─────────────────────────────────
    Item {
        id: embersLayer
        anchors.fill: parent

        Repeater {
            model: 28
            Rectangle {
                id: ember
                property real seedX: (index * 79.19) % Math.max(1, root.width)
                property real speed: 0.4 + ((index * 31.7) % 10) * 0.08
                property real phase: (index * 13.5) % 6.28
                property real emberY: (index * 45.3) % Math.max(1, root.height)

                width: 2 + (index % 3)
                height: width
                radius: width / 2
                color: index % 5 === 0 ? "#FFF8DC" : "#FFD700"
                opacity: 0.16 + 0.28 * Math.sin(root.breathingPhase + phase)
                x: seedX + Math.sin(root.breathingPhase * 0.5 + phase) * 24
                y: emberY

                NumberAnimation on emberY {
                    from: root.height
                    to: -20
                    duration: 12000 + (index * 1100) % 8000
                    loops: Animation.Infinite
                    running: true
                }
            }
        }
    }

    // ── 4. Sacred Hermetic Seal & Counter-Rotating Rings Behind 3D Word ────
    Item {
        id: sacredCenterBackdrop
        anchors.centerIn: wordContainer
        width: wordContainer.wordW * 0.72
        height: width

        property real centerDist: Math.hypot(root.smoothMouseX - (wordContainer.x + wordContainer.width / 2), root.smoothMouseY - (wordContainer.y + wordContainer.height / 2))
        property real centerProximity: Math.max(0.0, 1.0 - centerDist / 680.0)

        // Outer Alchemical Ring (counter-rotating, scales with cursor proximity)
        Image {
            id: sacredOuterRing
            source: "images/ring.png"
            anchors.centerIn: parent
            width: parent.width * (0.94 + sacredCenterBackdrop.centerProximity * 0.06)
            height: width
            opacity: 0.14 + sacredCenterBackdrop.centerProximity * 0.18 + 0.04 * Math.sin(root.breathingPhase)
            rotation: -root.sacredRotation * 0.7
            asynchronous: true
            cache: true
            smooth: true
        }

        // Inner Hermetic Seal (slow clockwise rotation + 3D parallax tilt)
        Image {
            id: sacredSeal
            source: "images/seal.png"
            anchors.centerIn: parent
            width: parent.width * 0.66
            height: width
            opacity: 0.11 + sacredCenterBackdrop.centerProximity * 0.16 + 0.04 * Math.cos(root.breathingPhase * 0.7)
            rotation: root.sacredRotation * 0.45
            asynchronous: true
            cache: true
            smooth: true

            transform: [
                Rotation {
                    origin.x: sacredSeal.width / 2
                    origin.y: sacredSeal.height / 2
                    axis { x: 0; y: 1; z: 0 }
                    angle: (root.smoothMouseX - root.width / 2) * 0.012
                },
                Rotation {
                    origin.x: sacredSeal.width / 2
                    origin.y: sacredSeal.height / 2
                    axis { x: 1; y: 0; z: 0 }
                    angle: -(root.smoothMouseY - root.height / 2) * 0.012
                }
            ]
        }
    }

    // ── 5. Central Ambient Golden Bloom ────────────────────────────────────
    Image {
        id: centerBloom
        source: "images/glow.png"
        width: wordContainer.wordW * 0.88
        height: width
        anchors.centerIn: wordContainer
        opacity: 0.34 + 0.14 * Math.sin(root.breathingPhase * 0.8) + sacredCenterBackdrop.centerProximity * 0.15
        asynchronous: true
        cache: true
    }

    // ── 6. Dynamic Interactive Golden Cursor Trails, Reticle & Shockwaves ──
    Item {
        id: mouseTrailsLayer
        anchors.fill: parent

        // Expanding Shockwave Pulse Rings (triggered on click or whip-motion)
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
                border.width: Math.max(1.0, wLife * 3.2)
                border.color: "#FFD700"
                opacity: wLife * 0.65
                visible: wLife > 0.01
            }
        }

        // Outer ambient golden cursor bloom on the obsidian background
        Image {
            id: cursorAuraOuter
            source: "images/glow.png"
            width: 400
            height: 400
            x: root.smoothMouseX - width / 2
            y: root.smoothMouseY - height / 2
            opacity: 0.09 + root.cursorActivity * 0.28
            scale: 0.85 + root.cursorActivity * 0.42
            asynchronous: true
            cache: true
        }

        // Sacred Rotating Cursor Halo Ring (subtle alchemical reticle around cursor)
        Image {
            id: cursorSacredRing
            source: "images/ring.png"
            width: 112
            height: 112
            x: root.smoothMouseX - width / 2
            y: root.smoothMouseY - height / 2
            opacity: 0.10 + root.cursorActivity * 0.38
            scale: 0.72 + root.cursorActivity * 0.48 + 0.05 * Math.sin(root.breathingPhase * 1.5)
            rotation: root.sacredRotation * 2.4
            asynchronous: true
            cache: true
            smooth: true
        }

        // Inner golden brilliance wake
        Image {
            id: cursorAuraInner
            source: "images/glow.png"
            width: 165
            height: 165
            x: root.smoothMouseX - width / 2
            y: root.smoothMouseY - height / 2
            opacity: 0.16 + root.cursorActivity * 0.48
            scale: 0.72 + root.cursorActivity * 0.45
            asynchronous: true
            cache: true
        }

        // Crisp Alchemical Starburst Core at Exact Cursor Focus
        Item {
            id: cursorStarCore
            x: root.smoothMouseX
            y: root.smoothMouseY
            opacity: 0.35 + root.cursorActivity * 0.55

            Rectangle {
                anchors.centerIn: parent
                width: 28 + root.cursorActivity * 26
                height: 1.4
                radius: 0.7
                color: "#FFF8DC"
                rotation: root.sacredRotation * 1.5
            }
            Rectangle {
                anchors.centerIn: parent
                width: 1.4
                height: 28 + root.cursorActivity * 26
                radius: 0.7
                color: "#FFF8DC"
                rotation: root.sacredRotation * 1.5
            }
            Rectangle {
                anchors.centerIn: parent
                width: 6 + root.cursorActivity * 4
                height: width
                radius: width / 2
                color: "#FFFFFF"
            }
        }

        // Pool of floating golden & celestial sparks
        Repeater {
            id: sparksRepeater
            model: root.sparkCount

            Item {
                id: sparkItem
                property real px: 0
                property real py: 0
                property real pLife: 0.0
                property real pSize: 4.0
                property real pVx: 0.0
                property real pVy: 0.0
                property real pDecay: 0.02
                property real pRot: 0.0
                property real pVRot: 0.0
                property color pColor: "#FFD700"

                x: px - width / 2
                y: py - height / 2
                width: pSize
                height: pSize
                visible: pLife > 0.01
                opacity: Math.max(0.0, Math.min(1.0, pLife))
                scale: Math.max(0.1, Math.min(1.0, pLife * 1.4))

                // Soft outer spark halo
                Rectangle {
                    anchors.centerIn: parent
                    width: parent.width * 2.2
                    height: parent.height * 2.2
                    radius: width / 2
                    color: sparkItem.pColor
                    opacity: 0.24
                }

                // Core luminous circular ember
                Rectangle {
                    anchors.centerIn: parent
                    width: parent.width
                    height: parent.height
                    radius: width / 2
                    color: sparkItem.pColor
                }

                // Celestial 4-pointed diamond glint on larger sparks
                Rectangle {
                    anchors.centerIn: parent
                    width: parent.width * 3.1
                    height: 1.2
                    color: sparkItem.pColor
                    opacity: 0.72
                    rotation: sparkItem.pRot
                    visible: sparkItem.pSize > 4.0
                }
                Rectangle {
                    anchors.centerIn: parent
                    width: 1.2
                    height: parent.height * 3.1
                    color: sparkItem.pColor
                    opacity: 0.72
                    rotation: sparkItem.pRot
                    visible: sparkItem.pSize > 4.0
                }
            }
        }
    }

    // ── Reusable 3D Letter Component ───────────────────────────────────────
    component ZothLetter: Item {
        id: letterRoot
        property string letterSource: ""
        property real relX: 0.0
        property real relY: 0.0
        property real relW: 0.0
        property real relH: 0.0

        x: wordContainer.width * relX
        y: wordContainer.height * relY
        width: wordContainer.width * relW
        height: wordContainer.height * relH

        property real curRotX: 0.0
        property real curRotY: 0.0
        property real curScale: 1.0
        property real curTransX: 0.0
        property real curTransY: 0.0
        property real curGlow: 0.0

        // Per-letter reactive golden backlight bloom when cursor is near
        Image {
            source: "images/glow.png"
            anchors.centerIn: parent
            width: parent.width * 1.65
            height: parent.height * 1.45
            opacity: letterRoot.curGlow * 0.42
            visible: opacity > 0.01
            asynchronous: true
            cache: true
        }

        // Master embossed metallic letter
        Image {
            source: letterRoot.letterSource
            anchors.fill: parent
            asynchronous: true
            cache: true
            smooth: true
            mipmap: true
        }

        transform: [
            Rotation {
                origin.x: letterRoot.width / 2
                origin.y: letterRoot.height / 2
                axis { x: 0; y: 1; z: 0 }
                angle: letterRoot.curRotY
            },
            Rotation {
                origin.x: letterRoot.width / 2
                origin.y: letterRoot.height / 2
                axis { x: 1; y: 0; z: 0 }
                angle: letterRoot.curRotX
            },
            Scale {
                origin.x: letterRoot.width / 2
                origin.y: letterRoot.height / 2
                xScale: letterRoot.curScale
                yScale: letterRoot.curScale
            },
            Translate {
                x: letterRoot.curTransX
                y: letterRoot.curTransY
            }
        ]
    }

    // ── 7. 3D Interactive Letters Canvas + Golden Light Sheen ──────────────
    Item {
        id: wordContainer
        readonly property real wordW: Math.min(root.width * 0.58, 1060)
        readonly property real wordH: wordW / 4.3838
        width: wordW
        height: wordH
        anchors.centerIn: parent
        anchors.verticalCenterOffset: -40

        ZothLetter {
            id: letZ
            letterSource: "images/letter_z.png"
            relX: 0.0000; relY: 0.0202; relW: 0.1613; relH: 0.9798
        }

        ZothLetter {
            id: letO1
            letterSource: "images/letter_o1.png"
            relX: 0.1613; relY: 0.0000; relW: 0.1797; relH: 1.0000
        }

        ZothLetter {
            id: letT
            letterSource: "images/letter_t.png"
            relX: 0.3410; relY: 0.0202; relW: 0.1521; relH: 0.9798
        }

        ZothLetter {
            id: letH
            letterSource: "images/letter_h.png"
            relX: 0.4931; relY: 0.0202; relW: 0.1797; relH: 0.9798
        }

        ZothLetter {
            id: letO2
            letterSource: "images/letter_o2.png"
            relX: 0.6728; relY: 0.0000; relW: 0.1843; relH: 1.0000
        }

        ZothLetter {
            id: letS
            letterSource: "images/letter_s.png"
            relX: 0.8571; relY: 0.0000; relW: 0.1429; relH: 1.0000
        }

        // Dynamic Golden Specular Sheen Sweeping Across the 3D Title
        Image {
            id: wordSheen
            source: "images/sheen.png"
            width: wordContainer.width * 0.32
            height: wordContainer.height * 1.25
            y: -wordContainer.height * 0.12
            x: wordContainer.width * root.sheenProgress
            opacity: root.sheenProgress >= -0.25 && root.sheenProgress <= 1.05 ? 0.35 : 0.0
            asynchronous: true
            cache: true
            smooth: true
        }
    }

    // ── 8. Golden Subtitle Plate ───────────────────────────────────────────
    Image {
        id: subtitlePlate
        source: "images/subtitle.png"
        width: Math.min(wordContainer.wordW * 0.82, 760)
        height: width * 0.14
        anchors.top: wordContainer.bottom
        anchors.topMargin: 24
        anchors.horizontalCenter: parent.horizontalCenter
        opacity: 0.92
        asynchronous: true
        cache: true

        property real curTiltY: (root.smoothMouseX - root.width / 2) * 0.006
        property real curTiltX: -(root.smoothMouseY - root.height / 2) * 0.006

        transform: [
            Rotation {
                origin.x: subtitlePlate.width / 2
                origin.y: subtitlePlate.height / 2
                axis { x: 0; y: 1; z: 0 }
                angle: subtitlePlate.curTiltY
            },
            Rotation {
                origin.x: subtitlePlate.width / 2
                origin.y: subtitlePlate.height / 2
                axis { x: 1; y: 0; z: 0 }
                angle: subtitlePlate.curTiltX
            }
        ]
    }

    // ── 9. Direct Desktop Mouse Tracking & Click Nova Burst ────────────────
    MouseArea {
        anchors.fill: parent
        hoverEnabled: true
        acceptedButtons: Qt.LeftButton | Qt.MiddleButton
        propagateComposedEvents: true
        onPositionChanged: (mouse) => {
            root.rawMouseX = mouse.x;
            root.rawMouseY = mouse.y;
            root.lastLocalMouseTime = Date.now();
        }
        onPressed: (mouse) => {
            root.rawMouseX = mouse.x;
            root.rawMouseY = mouse.y;
            root.lastLocalMouseTime = Date.now();
            root.triggerShockwave(mouse.x, mouse.y, 1.15);
            root.spawnBurstSparks(mouse.x, mouse.y, 22);
            mouse.accepted = false;
        }
    }

    // ── 10. Global Cursor Daemon Polling Engine (Adaptive 8Hz–33Hz) ────────
    property bool xhrInFlight: false

    Timer {
        id: cursorDaemonTimer
        interval: root.cursorActivity > 0.02 ? 30 : 120
        running: true
        repeat: true

        onTriggered: {
            var now = Date.now();
            if (root.xhrInFlight || (now - root.lastLocalMouseTime <= 60)) {
                return;
            }
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
                                root.rawMouseX = data.x;
                                root.rawMouseY = data.y;
                            }
                        } catch (e) {}
                    }
                }
            };
            xhr.send();
        }
    }

    // ── 11. Adaptive 15–60 FPS Physics & Constellation Engine ──────────────
    Timer {
        id: physicsTimer
        interval: root.cursorActivity > 0.02 ? 16 : 66
        running: true
        repeat: true

        onTriggered: {
            root.breathingPhase += 0.04;
            root.sacredRotation = (root.sacredRotation + 0.18 + root.cursorActivity * 0.85) % 360.0;

            // Periodic golden specular sheen across ZOTHOS title
            root.sheenProgress += 0.008 + root.cursorActivity * 0.012;
            if (root.sheenProgress > 2.4) {
                root.sheenProgress = -0.35;
            }

            // 1. Initialize interactive constellation nodes once width/height are valid
            if (root.constellationNodes.length === 0 && root.width > 100 && root.height > 100) {
                var cNodes = [];
                for (var ni = 0; ni < root.nodeCount; ni++) {
                    var bx = ((ni * 137.5) % root.width);
                    var by = ((ni * 293.7) % root.height);
                    cNodes.push({
                        x: bx,
                        y: by,
                        vx: (Math.cos(ni * 1.7) * 0.35),
                        vy: (Math.sin(ni * 2.3) * 0.35),
                        r: 1.5 + (ni % 3) * 0.65,
                        phase: (ni * 0.85) % 6.28
                    });
                }
                root.constellationNodes = cNodes;
            }

            // 2. Smoothly interpolate cursor & comet tail positions
            root.smoothMouseX += (root.rawMouseX - root.smoothMouseX) * 0.24;
            root.smoothMouseY += (root.rawMouseY - root.smoothMouseY) * 0.24;
            root.trailMouseX += (root.smoothMouseX - root.trailMouseX) * 0.11;
            root.trailMouseY += (root.smoothMouseY - root.trailMouseY) * 0.11;

            // 3. Compute cursor velocity, whip shockwaves, and particle trails
            var dxMouse = root.smoothMouseX - root.prevSmoothX;
            var dyMouse = root.smoothMouseY - root.prevSmoothY;
            var moveDist = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
            root.cursorVelocityX = dxMouse;
            root.cursorVelocityY = dyMouse;
            root.cursorSpeed = moveDist;
            root.prevSmoothX = root.smoothMouseX;
            root.prevSmoothY = root.smoothMouseY;

            var targetActivity = Math.min(moveDist / 18.0, 1.0);
            if (targetActivity > root.cursorActivity) {
                root.cursorActivity += (targetActivity - root.cursorActivity) * 0.38;
            } else {
                root.cursorActivity *= 0.93;
            }

            // Trigger automatic shockwave ring on rapid cursor whip motion
            if (moveDist > 42.0) {
                var nowMs = Date.now();
                if (nowMs - root.lastWhipWaveTime > 420) {
                    root.lastWhipWaveTime = nowMs;
                    root.triggerShockwave(root.smoothMouseX, root.smoothMouseY, 0.85);
                }
            }

            // Update expanding shockwaves
            if (root.waveItems.length === root.waveCount) {
                for (var wi = 0; wi < root.waveCount; wi++) {
                    var wItem = root.waveItems[wi];
                    if (wItem && wItem.wLife > 0.005) {
                        wItem.wLife *= 0.92;
                        if (wItem.wLife <= 0.01) wItem.wLife = 0.0;
                    }
                }
            }

            // Update interactive constellation nodes (cursor magnetic swirl + boundary wrap)
            var nodes = root.constellationNodes;
            if (nodes && nodes.length > 0 && root.width > 0 && root.height > 0) {
                for (var ci = 0; ci < nodes.length; ci++) {
                    var cn = nodes[ci];
                    cn.x += cn.vx;
                    cn.y += cn.vy;

                    // Gentle cursor gravitational pull + tangential swirl within 260px
                    var cdx = root.smoothMouseX - cn.x;
                    var cdy = root.smoothMouseY - cn.y;
                    var cdist = Math.sqrt(cdx * cdx + cdy * cdy);
                    if (cdist > 20.0 && cdist < 260.0) {
                        var pull = (1.0 - cdist / 260.0) * 0.45;
                        cn.x += (cdx / cdist) * pull + (-cdy / cdist) * pull * 0.65;
                        cn.y += (cdy / cdist) * pull + (cdx / cdist) * pull * 0.65;
                    }

                    if (cn.x < 0) cn.x += root.width;
                    else if (cn.x > root.width) cn.x -= root.width;
                    if (cn.y < 0) cn.y += root.height;
                    else if (cn.y > root.height) cn.y -= root.height;
                }
                constellationCanvas.requestPaint();
            }

            // Ensure cached particle references are initialized
            if (root.sparkItems.length === 0) {
                var list = [];
                for (var k = 0; k < root.sparkCount; k++) {
                    var itm = sparksRepeater.itemAt(k);
                    if (itm) list.push(itm);
                }
                if (list.length === root.sparkCount) {
                    root.sparkItems = list;
                }
            }

            var items = root.sparkItems;
            if (items && items.length === root.sparkCount) {
                // Spawn golden & celestial sparks when cursor is moving (plus gentle idle orbital ember)
                var shouldSpawnIdle = (Math.random() < 0.18);
                if (moveDist > 1.2 || shouldSpawnIdle) {
                    var spawnCount = moveDist > 1.2 ? Math.min(Math.floor(moveDist / 2.6) + 1, 5) : 1;
                    var palette = ["#FFFFFF", "#FFF9C4", "#FFE082", "#FFD700", "#FFC107", "#FFB300", "#FFA000", "#00F0FF"];

                    for (var s = 0; s < spawnCount; s++) {
                        var p = items[root.sparkHead];
                        if (p) {
                            var t = Math.random();
                            var spread = moveDist > 1.2 ? 14 : 38;
                            p.px = (root.smoothMouseX - dxMouse * t) + (Math.random() - 0.5) * spread;
                            p.py = (root.smoothMouseY - dyMouse * t) + (Math.random() - 0.5) * spread;

                            var angle = Math.random() * 6.28318;
                            var speed = (moveDist > 1.2 ? 0.5 : 0.2) + Math.random() * 2.4;
                            p.pVx = Math.cos(angle) * speed - dxMouse * 0.11;
                            p.pVy = Math.sin(angle) * speed - dyMouse * 0.11 - 0.42;

                            p.pLife = 1.0;
                            p.pDecay = 0.014 + Math.random() * 0.018;
                            p.pSize = 2.6 + Math.random() * 4.8;
                            p.pRot = Math.random() * 360;
                            p.pVRot = (Math.random() - 0.5) * 6.5;
                            p.pColor = palette[Math.floor(Math.random() * palette.length)];
                        }
                        root.sparkHead = (root.sparkHead + 1) % root.sparkCount;
                    }
                }

                // Update living sparks
                for (var pi = 0; pi < root.sparkCount; pi++) {
                    var spk = items[pi];
                    if (spk && spk.pLife > 0.005) {
                        spk.px += spk.pVx;
                        spk.py += spk.pVy;
                        spk.pVy -= 0.035; // gentle upward stardust float
                        spk.pVx *= 0.95;  // air resistance
                        spk.pVy *= 0.95;
                        spk.pRot += spk.pVRot;
                        spk.pLife -= spk.pDecay;
                        if (spk.pLife <= 0.005) {
                            spk.pLife = 0;
                        }
                    }
                }
            }

            // 4. Compute 3D physics & reactive golden glow for each of the 6 letters
            var letters = [letZ, letO1, letT, letH, letO2, letS];
            var containerX = wordContainer.x;
            var containerY = wordContainer.y;
            var R = root.influenceRadius;

            for (var i = 0; i < letters.length; i++) {
                var item = letters[i];
                var centerX = containerX + item.x + item.width / 2;
                var centerY = containerY + item.y + item.height / 2;

                var dx = root.smoothMouseX - centerX;
                var dy = root.smoothMouseY - centerY;
                var dist = Math.sqrt(dx * dx + dy * dy);

                // Proximity factor: Gaussian bell curve (1.0 at center, decaying with distance)
                var factor = Math.exp(-(dist * dist) / (2 * R * R));
                var closeFactor = Math.exp(-(dist * dist) / (2 * 220.0 * 220.0));

                // 3D Rotations + Subtle Idle Harmonic Wave
                var normX = dx / (dist + 50.0);
                var normY = dy / (dist + 50.0);
                var idleWaveY = Math.sin(root.breathingPhase * 0.9 + i * 0.65) * 2.2;
                var idleWaveX = Math.cos(root.breathingPhase * 0.7 + i * 0.55) * 1.6;

                var targetRotY = normX * root.maxTilt * (0.35 + 0.65 * factor) + idleWaveY;
                var targetRotX = -normY * root.maxTilt * (0.35 + 0.65 * factor) + idleWaveX;

                // Z-Elevation & Parallax
                var targetScale = 1.0 + 0.075 * factor;
                var targetTransX = normX * 16.0 * factor;
                var targetTransY = normY * 16.0 * factor + Math.sin(root.breathingPhase + i * 0.7) * 2.5;

                // Exponential spring smoothing
                item.curRotY += (targetRotY - item.curRotY) * 0.16;
                item.curRotX += (targetRotX - item.curRotX) * 0.16;
                item.curScale += (targetScale - item.curScale) * 0.16;
                item.curTransX += (targetTransX - item.curTransX) * 0.16;
                item.curTransY += (targetTransY - item.curTransY) * 0.16;
                item.curGlow += (closeFactor - item.curGlow) * 0.18;
            }
        }
    }
}
