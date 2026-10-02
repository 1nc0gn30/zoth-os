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
    property double lastLocalMouseTime: 0
    property real breathingPhase: 0.0

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

    // ── 3. Central Ambient Golden Bloom ────────────────────────────────────
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

            // 3. Compute 3D physics for each of the 6 letters
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
