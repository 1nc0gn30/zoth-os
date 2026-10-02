import QtQuick
import org.kde.plasma.plasmoid
import org.kde.plasma.core as PlasmaCore

WallpaperItem {
    id: root

    // Configuration parameters
    readonly property real maxTilt: 22.0
    readonly property real influenceRadius: 550.0

    // Cursor tracking state
    property real rawMouseX: root.width > 0 ? root.width / 2 : 960
    property real rawMouseY: root.height > 0 ? root.height / 2 : 540
    property real smoothMouseX: rawMouseX
    property real smoothMouseY: rawMouseY
    property real prevSmoothX: rawMouseX
    property real prevSmoothY: rawMouseY
    property real cursorActivity: 0.0
    property double lastLocalMouseTime: 0
    property real breathingPhase: 0.0

    // Particle pool state
    readonly property int sparkCount: 56
    property int sparkHead: 0
    property var sparkItems: []

    // ── 1. Base Wallpaper Vignette Layer ───────────────────────────────────
    Image {
        id: bgImage
        anchors.fill: parent
        source: "images/bg.png"
        fillMode: Image.PreserveAspectCrop
        asynchronous: true
        cache: true
    }

    // ── 2. Ambient Floating Stardust Embers ─────────────────────────────────
    Item {
        id: embersLayer
        anchors.fill: parent

        Repeater {
            model: 24
            Rectangle {
                id: ember
                property real seedX: (index * 79.19) % root.width
                property real speed: 0.4 + ((index * 31.7) % 10) * 0.08
                property real phase: (index * 13.5) % 6.28
                property real emberY: (index * 45.3) % root.height

                width: 2 + (index % 3)
                height: width
                radius: width / 2
                color: "#FFD700"
                opacity: 0.15 + 0.25 * Math.sin(root.breathingPhase + phase)
                x: seedX + Math.sin(root.breathingPhase * 0.5 + phase) * 20
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

    // ── 3. Dynamic Interactive Golden Cursor Trails & Aura ─────────────────
    Item {
        id: mouseTrailsLayer
        anchors.fill: parent

        // Outer ambient golden cursor bloom on the obsidian background
        Image {
            id: cursorAuraOuter
            source: "images/glow.png"
            width: 360
            height: 360
            x: root.smoothMouseX - width / 2
            y: root.smoothMouseY - height / 2
            opacity: 0.07 + root.cursorActivity * 0.23
            scale: 0.85 + root.cursorActivity * 0.35
            asynchronous: true
            cache: true
        }

        // Inner golden brilliance wake
        Image {
            id: cursorAuraInner
            source: "images/glow.png"
            width: 150
            height: 150
            x: root.smoothMouseX - width / 2
            y: root.smoothMouseY - height / 2
            opacity: 0.12 + root.cursorActivity * 0.42
            scale: 0.70 + root.cursorActivity * 0.40
            asynchronous: true
            cache: true
        }

        // Pool of floating golden sparks
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
                scale: Math.max(0.1, Math.min(1.0, pLife * 1.35))

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
                    width: parent.width * 2.8
                    height: 1.2
                    color: sparkItem.pColor
                    opacity: 0.65
                    rotation: sparkItem.pRot
                    visible: sparkItem.pSize > 4.2
                }
                Rectangle {
                    anchors.centerIn: parent
                    width: 1.2
                    height: parent.height * 2.8
                    color: sparkItem.pColor
                    opacity: 0.65
                    rotation: sparkItem.pRot
                    visible: sparkItem.pSize > 4.2
                }
            }
        }
    }

    // ── 4. Central Ambient Golden Bloom ────────────────────────────────────
    Image {
        id: centerBloom
        source: "images/glow.png"
        width: wordContainer.wordW * 0.85
        height: width
        anchors.centerIn: wordContainer
        opacity: 0.35 + 0.15 * Math.sin(root.breathingPhase * 0.8)
        asynchronous: true
        cache: true
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

    // ── 4. 3D Interactive Letters Canvas ───────────────────────────────────
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
    }

    // ── 5. Golden Subtitle Plate ───────────────────────────────────────────
    Image {
        id: subtitlePlate
        source: "images/subtitle.png"
        width: Math.min(wordContainer.wordW * 0.82, 760)
        height: width * 0.14
        anchors.top: wordContainer.bottom
        anchors.topMargin: 24
        anchors.horizontalCenter: parent.horizontalCenter
        opacity: 0.90
        asynchronous: true
        cache: true

        property real curTiltY: (root.smoothMouseX - root.width / 2) * 0.005
        property real curTiltX: -(root.smoothMouseY - root.height / 2) * 0.005

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

    // ── 6. Direct Desktop Mouse Tracking ───────────────────────────────────
    MouseArea {
        anchors.fill: parent
        hoverEnabled: true
        acceptedButtons: Qt.NoButton
        onPositionChanged: (mouse) => {
            root.rawMouseX = mouse.x;
            root.rawMouseY = mouse.y;
            root.lastLocalMouseTime = Date.now();
        }
    }

    // ── 7. 60 FPS Physics & Global Cursor Daemon Polling Engine ─────────────
    Timer {
        id: physicsTimer
        interval: 16
        running: true
        repeat: true

        onTriggered: {
            var now = Date.now();
            root.breathingPhase += 0.04;

            // 1. If no local desktop mouse movement in the last 60ms, poll cursor daemon HTTP endpoint
            if (now - root.lastLocalMouseTime > 60) {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "http://127.0.0.1:9989/");
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === XMLHttpRequest.DONE) {
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

            // 2. Smoothly interpolate cursor position
            root.smoothMouseX += (root.rawMouseX - root.smoothMouseX) * 0.20;
            root.smoothMouseY += (root.rawMouseY - root.smoothMouseY) * 0.20;

            // 3. Compute cursor speed and update particle trails
            var dxMouse = root.smoothMouseX - root.prevSmoothX;
            var dyMouse = root.smoothMouseY - root.prevSmoothY;
            var moveDist = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
            root.prevSmoothX = root.smoothMouseX;
            root.prevSmoothY = root.smoothMouseY;

            var targetActivity = Math.min(moveDist / 5.0, 1.0);
            if (targetActivity > root.cursorActivity) {
                root.cursorActivity += (targetActivity - root.cursorActivity) * 0.35;
            } else {
                root.cursorActivity *= 0.94;
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
                // Spawn golden sparks when cursor is moving
                if (moveDist > 1.5) {
                    var spawnCount = Math.min(Math.floor(moveDist / 3.0) + 1, 4);
                    var palette = ["#FFFFFF", "#FFF9C4", "#FFE082", "#FFD700", "#FFC107", "#FFB300", "#FFA000"];

                    for (var s = 0; s < spawnCount; s++) {
                        var p = items[root.sparkHead];
                        if (p) {
                            var t = Math.random();
                            p.px = (root.smoothMouseX - dxMouse * t) + (Math.random() - 0.5) * 12;
                            p.py = (root.smoothMouseY - dyMouse * t) + (Math.random() - 0.5) * 12;

                            var angle = Math.random() * 6.28318;
                            var speed = 0.4 + Math.random() * 2.2;
                            p.pVx = Math.cos(angle) * speed - dxMouse * 0.10;
                            p.pVy = Math.sin(angle) * speed - dyMouse * 0.10 - 0.45;

                            p.pLife = 1.0;
                            p.pDecay = 0.015 + Math.random() * 0.020;
                            p.pSize = 2.6 + Math.random() * 4.6;
                            p.pRot = Math.random() * 360;
                            p.pVRot = (Math.random() - 0.5) * 6.0;
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

            // 4. Compute 3D physics for each of the 6 letters
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

                // 3D Rotations:
                // Heading/Yaw (RotY): tilts towards the mouse X direction
                // Pitch (RotX): tilts towards the mouse Y direction
                var normX = dx / (dist + 50.0);
                var normY = dy / (dist + 50.0);

                var targetRotY = normX * root.maxTilt * (0.35 + 0.65 * factor);
                var targetRotX = -normY * root.maxTilt * (0.35 + 0.65 * factor);

                // Z-Elevation & Parallax
                var targetScale = 1.0 + 0.06 * factor;
                var targetTransX = normX * 14.0 * factor;
                var targetTransY = normY * 14.0 * factor;

                // Exponential spring smoothing
                item.curRotY += (targetRotY - item.curRotY) * 0.16;
                item.curRotX += (targetRotX - item.curRotX) * 0.16;
                item.curScale += (targetScale - item.curScale) * 0.16;
                item.curTransX += (targetTransX - item.curTransX) * 0.16;
                item.curTransY += (targetTransY - item.curTransY) * 0.16;
            }
        }
    }
}
