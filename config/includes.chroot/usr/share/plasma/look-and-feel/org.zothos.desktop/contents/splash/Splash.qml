import QtQuick
import org.kde.kirigami 2 as Kirigami

Rectangle {
    id: root
    color: "#040605"

    property int stage

    onStageChanged: {
        if (stage == 1 || stage == 2) {
            introSequence.start();
        } else if (stage >= 5) {
            fadeOutAnimation.start();
        }
    }

    Component.onCompleted: {
        introSequence.start();
    }

    // Background Plate
    Image {
        id: bg
        anchors.fill: parent
        source: "images/bg.png"
        fillMode: Image.PreserveAspectCrop
        asynchronous: true
    }

    Item {
        id: masterContainer
        anchors.fill: parent

        readonly property real wordW: Math.min(parent.width * 0.58, 1060)
        readonly property real wordH: wordW / 4.3838

        // Ambient Center Bloom
        Image {
            id: glow
            source: "images/glow.png"
            width: masterContainer.wordW * 0.75
            height: width
            anchors.centerIn: wordContainer
            opacity: 0
            asynchronous: true

            SequentialAnimation on opacity {
                loops: Animation.Infinite
                NumberAnimation { from: 0.25; to: 0.45; duration: 2400; easing.type: Easing.InOutQuad }
                NumberAnimation { from: 0.45; to: 0.25; duration: 2400; easing.type: Easing.InOutQuad }
            }
        }

        // Word Letters Container
        Item {
            id: wordContainer
            width: masterContainer.wordW
            height: masterContainer.wordH
            anchors.centerIn: parent
            anchors.verticalCenterOffset: -45

            // Letter Z
            Image {
                id: letZ
                source: "images/letter_z.png"
                x: 0
                y: parent.height * 0.0202
                width: parent.width * 0.1613
                height: parent.height * 0.9798
                opacity: 0
                asynchronous: true
            }

            // Letter O1
            Image {
                id: letO1
                source: "images/letter_o1.png"
                x: parent.width * 0.1613
                y: 0
                width: parent.width * 0.1797
                height: parent.height
                opacity: 0
                asynchronous: true
            }

            // Letter T
            Image {
                id: letT
                source: "images/letter_t.png"
                x: parent.width * 0.3410
                y: parent.height * 0.0202
                width: parent.width * 0.1521
                height: parent.height * 0.9798
                opacity: 0
                asynchronous: true
            }

            // Letter H
            Image {
                id: letH
                source: "images/letter_h.png"
                x: parent.width * 0.4931
                y: parent.height * 0.0202
                width: parent.width * 0.1797
                height: parent.height * 0.9798
                opacity: 0
                asynchronous: true
            }

            // Letter O2
            Image {
                id: letO2
                source: "images/letter_o2.png"
                x: parent.width * 0.6728
                y: 0
                width: parent.width * 0.1843
                height: parent.height
                opacity: 0
                asynchronous: true
            }

            // Letter S
            Image {
                id: letS
                source: "images/letter_s.png"
                x: parent.width * 0.8571
                y: 0
                width: parent.width * 0.1429
                height: parent.height
                opacity: 0
                asynchronous: true
            }

            // Specular Sheen Beam
            Image {
                id: sheen
                source: "images/sheen.png"
                width: parent.height * 0.55
                height: parent.height
                y: 0
                x: -width
                opacity: 0
                asynchronous: true
            }
        }

        // Subtitle Plate
        Image {
            id: subtitle
            source: "images/subtitle.png"
            width: Math.min(masterContainer.wordW * 0.80, 720)
            height: width * 0.14
            anchors.top: wordContainer.bottom
            anchors.topMargin: 24
            anchors.horizontalCenter: parent.horizontalCenter
            opacity: 0
            asynchronous: true
        }

        // Minimal Status / Busy Line
        Rectangle {
            id: progressBarTrough
            width: Math.min(masterContainer.wordW * 0.44, 420)
            height: 4
            color: "#181818"
            radius: 2
            anchors.top: subtitle.bottom
            anchors.topMargin: 40
            anchors.horizontalCenter: parent.horizontalCenter
            opacity: 0.70

            Rectangle {
                id: progressBarFill
                height: parent.height
                radius: 2
                color: "#FFD700"
                width: 0

                NumberAnimation on width {
                    id: progressAnim
                    from: 0
                    to: progressBarTrough.width
                    duration: 3500
                    easing.type: Easing.OutCubic
                }
            }
        }

        Text {
            id: statusText
            anchors.top: progressBarTrough.bottom
            anchors.topMargin: 16
            anchors.horizontalCenter: parent.horizontalCenter
            text: "✦ SOVEREIGN INTELLIGENCE OS ✦"
            color: "#FFD700"
            font.family: "DejaVu Sans Mono"
            font.pixelSize: 11
            font.bold: true
            opacity: 0.85
        }
    }

    // Cinematic Intro Sequence
    ParallelAnimation {
        id: introSequence

        SequentialAnimation {
            PauseAnimation { duration: 300 }
            NumberAnimation { target: letZ; property: "opacity"; from: 0; to: 1; duration: 400; easing.type: Easing.OutCubic }
        }

        SequentialAnimation {
            PauseAnimation { duration: 550 }
            NumberAnimation { target: letO1; property: "opacity"; from: 0; to: 1; duration: 400; easing.type: Easing.OutCubic }
        }

        SequentialAnimation {
            PauseAnimation { duration: 800 }
            NumberAnimation { target: letT; property: "opacity"; from: 0; to: 1; duration: 400; easing.type: Easing.OutCubic }
        }

        SequentialAnimation {
            PauseAnimation { duration: 1050 }
            NumberAnimation { target: letH; property: "opacity"; from: 0; to: 1; duration: 400; easing.type: Easing.OutCubic }
        }

        SequentialAnimation {
            PauseAnimation { duration: 1300 }
            NumberAnimation { target: letO2; property: "opacity"; from: 0; to: 1; duration: 400; easing.type: Easing.OutCubic }
        }

        SequentialAnimation {
            PauseAnimation { duration: 1550 }
            NumberAnimation { target: letS; property: "opacity"; from: 0; to: 1; duration: 400; easing.type: Easing.OutCubic }
        }

        // Sheen Sweep
        SequentialAnimation {
            PauseAnimation { duration: 2200 }
            ParallelAnimation {
                NumberAnimation { target: sheen; property: "x"; from: -sheen.width; to: wordContainer.width + sheen.width; duration: 1200; easing.type: Easing.InOutQuad }
                SequentialAnimation {
                    NumberAnimation { target: sheen; property: "opacity"; from: 0; to: 0.85; duration: 600 }
                    NumberAnimation { target: sheen; property: "opacity"; from: 0.85; to: 0; duration: 600 }
                }
            }
        }

        // Subtitle Fade
        SequentialAnimation {
            PauseAnimation { duration: 2600 }
            NumberAnimation { target: subtitle; property: "opacity"; from: 0; to: 0.95; duration: 800; easing.type: Easing.InOutQuad }
        }
    }

    OpacityAnimator {
        id: fadeOutAnimation
        target: root
        from: 1
        to: 0
        duration: 500
        easing.type: Easing.InOutQuad
    }
}
