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

    icon.width: Kirigami.Units.iconSizes.huge
    icon.height: Kirigami.Units.iconSizes.huge

    property string customIconSource: ""

    font.underline: false
    opacity: activeFocus || hovered ? 1 : 0.85

    background: Rectangle {
        implicitWidth: buttonRoot.icon.width + Kirigami.Units.gridUnit * 1.4
        implicitHeight: buttonRoot.icon.height + Kirigami.Units.gridUnit * 1.4
        width: implicitWidth
        height: implicitHeight
        radius: width / 2
        anchors.horizontalCenter: parent.horizontalCenter

        // Sovereign 24K Alchemical Gold interactive circle
        color: buttonRoot.down
               ? Qt.rgba(1, 0.84, 0, 0.38)
               : (buttonRoot.hovered || buttonRoot.activeFocus
                  ? Qt.rgba(0.83, 0.69, 0.22, 0.25)
                  : Qt.rgba(0.10, 0.12, 0.16, 0.75))

        border.color: buttonRoot.down
                      ? "#ffd700"
                      : (buttonRoot.hovered || buttonRoot.activeFocus
                         ? "#ffd700"
                         : Qt.rgba(0.83, 0.69, 0.22, 0.45))
        border.width: (buttonRoot.hovered || buttonRoot.activeFocus) ? 2 : 1

        scale: buttonRoot.down ? 0.94 : ((buttonRoot.hovered || buttonRoot.activeFocus) ? 1.08 : 1.0)
        Behavior on scale { NumberAnimation { duration: 140; easing.type: Easing.OutQuad } }
        Behavior on color { ColorAnimation { duration: 140 } }
        Behavior on border.color { ColorAnimation { duration: 140 } }
    }

    contentItem: Column {
        spacing: Kirigami.Units.smallSpacing + 2
        anchors.horizontalCenter: parent.horizontalCenter

        Item {
            width: buttonRoot.icon.width
            height: buttonRoot.icon.height
            anchors.horizontalCenter: parent.horizontalCenter

            // 24K Gold insignia image
            Image {
                anchors.fill: parent
                source: buttonRoot.customIconSource
                fillMode: Image.PreserveAspectFit
                mipmap: true
                smooth: true
                visible: source !== "" && status === Image.Ready
            }

            Kirigami.Icon {
                anchors.fill: parent
                source: buttonRoot.icon.name
                active: buttonRoot.hovered || buttonRoot.activeFocus
                visible: buttonRoot.customIconSource === "" || parent.children[0].status !== Image.Ready
            }
        }

        PlasmaComponents3.Label {
            anchors.horizontalCenter: parent.horizontalCenter
            width: Math.min(implicitWidth, buttonRoot.width)
            text: buttonRoot.Kirigami.MnemonicData.richTextLabel
            color: (buttonRoot.hovered || buttonRoot.activeFocus) ? "#ffd700" : Kirigami.Theme.textColor
            horizontalAlignment: Text.AlignHCenter
            verticalAlignment: Text.AlignTop
            textFormat: Text.StyledText
            wrapMode: Text.WordWrap
            Behavior on color { ColorAnimation { duration: 140 } }
        }
    }

    Keys.onPressed: {
        AutoTriggerTimer.cancelAutoTrigger();
    }
}
