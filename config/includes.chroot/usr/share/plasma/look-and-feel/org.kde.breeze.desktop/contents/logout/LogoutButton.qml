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

    // Grand 96x96 insignia sizing for majestic presence
    icon.width: 96
    icon.height: 96

    property string customIconSource: ""

    font.underline: false
    opacity: activeFocus || hovered ? 1.0 : 0.90

    implicitWidth: 184
    implicitHeight: 240
    Layout.preferredWidth: 184
    Layout.preferredHeight: 240

    // Master 24K Alchemical Gold Circular Medallion (168x168)
    background: Item {
        implicitWidth: 168
        implicitHeight: 168
        width: 168
        height: 168
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.top: parent.top

        // Outer radiant ambient glow ring (illuminates electric 24K gold on hover/focus)
        Rectangle {
            anchors.fill: parent
            radius: width / 2
            color: "transparent"
            border.color: (buttonRoot.hovered || buttonRoot.activeFocus) ? "#ffd700" : Qt.rgba(0.83, 0.69, 0.22, 0.40)
            border.width: (buttonRoot.hovered || buttonRoot.activeFocus) ? 5.0 : 2.5
            opacity: (buttonRoot.hovered || buttonRoot.activeFocus) ? 1.0 : 0.6
            scale: (buttonRoot.hovered || buttonRoot.activeFocus) ? 1.10 : 1.0

            Behavior on scale { NumberAnimation { duration: 180; easing.type: Easing.OutBack } }
            Behavior on opacity { NumberAnimation { duration: 180 } }
            Behavior on border.color { ColorAnimation { duration: 180 } }
            Behavior on border.width { NumberAnimation { duration: 180 } }
        }

        // Secondary concentric engraved filigree ring
        Rectangle {
            anchors.centerIn: parent
            width: parent.width - 14
            height: parent.height - 14
            radius: width / 2
            color: "transparent"
            border.color: (buttonRoot.hovered || buttonRoot.activeFocus) ? "#ffd700" : Qt.rgba(0.83, 0.69, 0.22, 0.50)
            border.width: 1.5
            scale: (buttonRoot.hovered || buttonRoot.activeFocus) ? 1.07 : 1.0
            Behavior on scale { NumberAnimation { duration: 180; easing.type: Easing.OutBack } }
            Behavior on border.color { ColorAnimation { duration: 180 } }
        }

        // Tertiary inner fine etched ring
        Rectangle {
            anchors.centerIn: parent
            width: parent.width - 26
            height: parent.height - 26
            radius: width / 2
            color: "transparent"
            border.color: (buttonRoot.hovered || buttonRoot.activeFocus) ? Qt.rgba(1, 0.92, 0.5, 0.85) : Qt.rgba(0.83, 0.69, 0.22, 0.30)
            border.width: 1.0
            scale: (buttonRoot.hovered || buttonRoot.activeFocus) ? 1.05 : 1.0
            Behavior on scale { NumberAnimation { duration: 180; easing.type: Easing.OutBack } }
            Behavior on border.color { ColorAnimation { duration: 180 } }
        }

        // Inner solid obsidian disc with rich metallic gold gradient aura
        Rectangle {
            anchors.centerIn: parent
            width: parent.width - 10
            height: parent.height - 10
            radius: width / 2

            color: buttonRoot.down
                   ? Qt.rgba(1, 0.84, 0, 0.5)
                   : ((buttonRoot.hovered || buttonRoot.activeFocus)
                      ? Qt.rgba(0.24, 0.19, 0.08, 0.98)
                      : Qt.rgba(0.08, 0.10, 0.15, 0.94))

            border.color: buttonRoot.down
                          ? "#ffec80"
                          : ((buttonRoot.hovered || buttonRoot.activeFocus)
                             ? "#ffd700"
                             : Qt.rgba(0.83, 0.69, 0.22, 0.65))
            border.width: (buttonRoot.hovered || buttonRoot.activeFocus) ? 3.0 : 2.0

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
            y: 36

            // 24K Gold insignia emblem
            Image {
                id: customImg
                anchors.fill: parent
                source: {
                    if (!buttonRoot.customIconSource) return "";
                    if (buttonRoot.customIconSource.indexOf("://") !== -1) return buttonRoot.customIconSource;
                    return "file://" + buttonRoot.customIconSource;
                }
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
                visible: !customImg.visible
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
