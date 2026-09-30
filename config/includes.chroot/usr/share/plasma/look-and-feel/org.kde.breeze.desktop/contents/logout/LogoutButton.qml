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

    // Grand insignia sizing centered majestically in the medallion
    icon.width: 100
    icon.height: 100

    property string customIconSource: ""

    font.underline: false
    opacity: activeFocus || hovered ? 1.0 : 0.90

    implicitWidth: 230
    implicitHeight: 275
    Layout.preferredWidth: 230
    Layout.preferredHeight: 275

    // Master 24K Alchemical Gold Circular Medallion (220x220)
    background: Item {
        id: medallionBg
        implicitWidth: 220
        implicitHeight: 220
        width: 220
        height: 220
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
            scale: (buttonRoot.hovered || buttonRoot.activeFocus) ? 1.08 : 1.0

            Behavior on scale { NumberAnimation { duration: 180; easing.type: Easing.OutBack } }
            Behavior on opacity { NumberAnimation { duration: 180 } }
            Behavior on border.color { ColorAnimation { duration: 180 } }
            Behavior on border.width { NumberAnimation { duration: 180 } }
        }

        // Secondary concentric engraved filigree ring
        Rectangle {
            anchors.centerIn: parent
            width: parent.width - 16
            height: parent.height - 16
            radius: width / 2
            color: "transparent"
            border.color: (buttonRoot.hovered || buttonRoot.activeFocus) ? "#ffd700" : Qt.rgba(0.83, 0.69, 0.22, 0.50)
            border.width: 1.5
            scale: (buttonRoot.hovered || buttonRoot.activeFocus) ? 1.05 : 1.0
            Behavior on scale { NumberAnimation { duration: 180; easing.type: Easing.OutBack } }
            Behavior on border.color { ColorAnimation { duration: 180 } }
        }

        // Tertiary inner fine etched ring
        Rectangle {
            anchors.centerIn: parent
            width: parent.width - 32
            height: parent.height - 32
            radius: width / 2
            color: "transparent"
            border.color: (buttonRoot.hovered || buttonRoot.activeFocus) ? Qt.rgba(1, 0.92, 0.5, 0.85) : Qt.rgba(0.83, 0.69, 0.22, 0.30)
            border.width: 1.0
            scale: (buttonRoot.hovered || buttonRoot.activeFocus) ? 1.04 : 1.0
            Behavior on scale { NumberAnimation { duration: 180; easing.type: Easing.OutBack } }
            Behavior on border.color { ColorAnimation { duration: 180 } }
        }

        // Inner solid obsidian disc with rich metallic gold gradient aura
        Rectangle {
            anchors.centerIn: parent
            width: parent.width - 12
            height: parent.height - 12
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

            scale: buttonRoot.down ? 0.96 : ((buttonRoot.hovered || buttonRoot.activeFocus) ? 1.04 : 1.0)
            Behavior on scale { NumberAnimation { duration: 160; easing.type: Easing.OutQuad } }
            Behavior on color { ColorAnimation { duration: 160 } }
            Behavior on border.color { ColorAnimation { duration: 160 } }
        }
    }

    contentItem: Item {
        implicitWidth: buttonRoot.width
        implicitHeight: buttonRoot.height

        Item {
            id: iconItemWrapper
            width: buttonRoot.icon.width
            height: buttonRoot.icon.height
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.top: parent.top
            anchors.topMargin: Math.round((220 - height) / 2)

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
                scale: (buttonRoot.hovered || buttonRoot.activeFocus) ? 1.10 : 1.0
                Behavior on scale { NumberAnimation { duration: 160; easing.type: Easing.OutBack } }
            }

            Kirigami.Icon {
                anchors.fill: parent
                source: buttonRoot.icon.name
                color: (buttonRoot.hovered || buttonRoot.activeFocus) ? "#ffd700" : "#d4af37"
                active: buttonRoot.hovered || buttonRoot.activeFocus
                visible: !customImg.visible
                scale: (buttonRoot.hovered || buttonRoot.activeFocus) ? 1.10 : 1.0
                Behavior on scale { NumberAnimation { duration: 160; easing.type: Easing.OutBack } }
            }
        }

        PlasmaComponents3.Label {
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.top: parent.top
            anchors.topMargin: 232
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
