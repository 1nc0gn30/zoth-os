/*
    SPDX-FileCopyrightText: 2016 Marco Martin <mart@kde.org>
    SPDX-FileCopyrightText: 2026 NullAI Tech <admin@nullai.tech>
    SPDX-License-Identifier: GPL-2.0-or-later
*/

import QtQuick 2.15
import QtQuick.Layouts 1.2
import org.kde.kirigami 2.20 as Kirigami
import org.kde.plasma.components 3.0 as PlasmaComponents3
import org.kde.breeze.components
import "timer.js" as AutoTriggerTimer

ActionButton {
    id: buttonRoot
    Layout.alignment: Qt.AlignTop

    // Grand 88x88 insignia sizing for majestic presence
    icon.width: 88
    icon.height: 88

    property string customIconSource: ""

    font.underline: false
    opacity: activeFocus || hovered ? 1.0 : 0.88

    implicitWidth: 172
    implicitHeight: 220
    Layout.preferredWidth: 172
    Layout.preferredHeight: 220

    // Master 24K Alchemical Gold Circular Medallion (154x154)
    background: Item {
        implicitWidth: 154
        implicitHeight: 154
        width: 154
        height: 154
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.top: parent.top

        // Outer radiant ambient glow ring (illuminates electric 24K gold on hover/focus)
        Rectangle {
            anchors.fill: parent
            radius: width / 2
            color: "transparent"
            border.color: (buttonRoot.hovered || buttonRoot.activeFocus) ? "#ffd700" : Qt.rgba(0.83, 0.69, 0.22, 0.35)
            border.width: (buttonRoot.hovered || buttonRoot.activeFocus) ? 4.5 : 2.0
            opacity: (buttonRoot.hovered || buttonRoot.activeFocus) ? 0.95 : 0.5
            scale: (buttonRoot.hovered || buttonRoot.activeFocus) ? 1.10 : 1.0

            Behavior on scale { NumberAnimation { duration: 180; easing.type: Easing.OutBack } }
            Behavior on opacity { NumberAnimation { duration: 180 } }
            Behavior on border.color { ColorAnimation { duration: 180 } }
            Behavior on border.width { NumberAnimation { duration: 180 } }
        }

        // Secondary concentric engraved filigree ring
        Rectangle {
            anchors.centerIn: parent
            width: parent.width - 12
            height: parent.height - 12
            radius: width / 2
            color: "transparent"
            border.color: (buttonRoot.hovered || buttonRoot.activeFocus) ? "#ffd700" : Qt.rgba(0.83, 0.69, 0.22, 0.45)
            border.width: 1.5
            scale: (buttonRoot.hovered || buttonRoot.activeFocus) ? 1.07 : 1.0
            Behavior on scale { NumberAnimation { duration: 180; easing.type: Easing.OutBack } }
            Behavior on border.color { ColorAnimation { duration: 180 } }
        }

        // Tertiary inner fine etched ring
        Rectangle {
            anchors.centerIn: parent
            width: parent.width - 24
            height: parent.height - 24
            radius: width / 2
            color: "transparent"
            border.color: (buttonRoot.hovered || buttonRoot.activeFocus) ? Qt.rgba(1, 0.92, 0.5, 0.8) : Qt.rgba(0.83, 0.69, 0.22, 0.25)
            border.width: 1.0
            scale: (buttonRoot.hovered || buttonRoot.activeFocus) ? 1.05 : 1.0
            Behavior on scale { NumberAnimation { duration: 180; easing.type: Easing.OutBack } }
            Behavior on border.color { ColorAnimation { duration: 180 } }
        }

        // Inner solid obsidian disc with rich metallic gold gradient aura
        Rectangle {
            anchors.centerIn: parent
            width: parent.width - 8
            height: parent.height - 8
            radius: width / 2

            color: buttonRoot.down
                   ? Qt.rgba(1, 0.84, 0, 0.5)
                   : ((buttonRoot.hovered || buttonRoot.activeFocus)
                      ? Qt.rgba(0.20, 0.16, 0.07, 0.96)
                      : Qt.rgba(0.06, 0.08, 0.13, 0.92))

            border.color: buttonRoot.down
                          ? "#ffec80"
                          : ((buttonRoot.hovered || buttonRoot.activeFocus)
                             ? "#ffd700"
                             : Qt.rgba(0.83, 0.69, 0.22, 0.6))
            border.width: (buttonRoot.hovered || buttonRoot.activeFocus) ? 2.5 : 1.5

            scale: buttonRoot.down ? 0.95 : ((buttonRoot.hovered || buttonRoot.activeFocus) ? 1.06 : 1.0)
            Behavior on scale { NumberAnimation { duration: 160; easing.type: Easing.OutQuad } }
            Behavior on color { ColorAnimation { duration: 160 } }
            Behavior on border.color { ColorAnimation { duration: 160 } }
        }
    }

    contentItem: Column {
        spacing: 12
        width: buttonRoot.width

        Item {
            width: buttonRoot.icon.width
            height: buttonRoot.icon.height
            anchors.horizontalCenter: parent.horizontalCenter
            y: 33

            // 24K Gold insignia emblem
            Image {
                anchors.fill: parent
                source: buttonRoot.customIconSource
                fillMode: Image.PreserveAspectFit
                mipmap: true
                smooth: true
                visible: source !== "" && status === Image.Ready
                scale: (buttonRoot.hovered || buttonRoot.activeFocus) ? 1.14 : 1.0
                Behavior on scale { NumberAnimation { duration: 160; easing.type: Easing.OutBack } }
            }

            Kirigami.Icon {
                anchors.fill: parent
                source: buttonRoot.icon.name
                color: (buttonRoot.hovered || buttonRoot.activeFocus) ? "#ffd700" : "#d4af37"
                active: buttonRoot.hovered || buttonRoot.activeFocus
                visible: buttonRoot.customIconSource === "" || parent.children[0].status !== Image.Ready
                scale: (buttonRoot.hovered || buttonRoot.activeFocus) ? 1.14 : 1.0
                Behavior on scale { NumberAnimation { duration: 160; easing.type: Easing.OutBack } }
            }
        }

        PlasmaComponents3.Label {
            anchors.horizontalCenter: parent.horizontalCenter
            width: buttonRoot.width
            text: buttonRoot.Kirigami.MnemonicData.richTextLabel
            font.bold: true
            font.pointSize: Kirigami.Theme.defaultFont.pointSize + 2
            color: (buttonRoot.hovered || buttonRoot.activeFocus) ? "#ffd700" : "#f1f5f9"
            horizontalAlignment: Text.AlignHCenter
            verticalAlignment: Text.AlignTop
            textFormat: Text.StyledText
            wrapMode: Text.WordWrap
            Behavior on color { ColorAnimation { duration: 150 } }
        }
    }

    Keys.onPressed: {
        AutoTriggerTimer.cancelAutoTrigger();
    }
}
