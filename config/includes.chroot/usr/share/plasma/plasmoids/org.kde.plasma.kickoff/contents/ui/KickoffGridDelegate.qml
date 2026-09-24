/*
    SPDX-FileCopyrightText: 2011 Martin *Gräßlin <mgraesslin@kde.org>
    SPDX-FileCopyrightText: 2012 Gregor Taetzner <gregor@freenet.de>
    SPDX-FileCopyrightText: 2014 Sebastian Kügler <sebas@kde.org>
    SPDX-FileCopyrightText: 2015-2018 Eike Hein <hein@kde.org>
    SPDX-FileCopyrightText: 2021 Mikel Johnson <mikel5764@gmail.com>
    SPDX-FileCopyrightText: 2021 Noah Davis <noahadvs@gmail.com>
    SPDX-FileCopyrightText: 2022 Nate Graham <nate@kde.org>

    SPDX-License-Identifier: GPL-2.0-or-later
 */

pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import org.kde.plasma.components as PC3
import org.kde.kirigami as Kirigami
import org.kde.plasma.plasmoid

AbstractKickoffItemDelegate {
    id: root

    leftPadding: KickoffSingleton.listItemMetrics.margins.left
    rightPadding: KickoffSingleton.listItemMetrics.margins.right
    topPadding: Kirigami.Units.smallSpacing * 2
    bottomPadding: Kirigami.Units.smallSpacing * 2

    icon.width: Kirigami.Units.iconSizes.large
    icon.height: Kirigami.Units.iconSizes.large

    labelTruncated: label.truncated
    descriptionVisible: false

    dragIconItem: iconItem

    background: Rectangle {
        anchors.fill: parent
        anchors.margins: 2
        radius: 8
        color: root.down ? Qt.rgba(1, 0.84, 0, 0.32) : 
               (root.mouseArea.containsMouse ? Qt.rgba(1, 0.84, 0, 0.12) : 
               (root.iconAndLabelsShouldlookSelected ? Qt.rgba(1, 0.84, 0, 0.16) : "transparent"))
        border.color: root.down ? "#ffd700" : 
                     (root.mouseArea.containsMouse ? Qt.rgba(1, 0.84, 0, 0.65) : 
                     (root.iconAndLabelsShouldlookSelected ? Qt.rgba(1, 0.84, 0, 0.45) : "transparent"))
        border.width: root.down ? 2 : 1
        scale: root.down ? 0.95 : (root.mouseArea.containsMouse ? 1.04 : 1.0)

        Behavior on scale {
            NumberAnimation { duration: 140; easing.type: Easing.OutCubic }
        }
        Behavior on color {
            ColorAnimation { duration: 150 }
        }
        Behavior on border.color {
            ColorAnimation { duration: 150 }
        }
    }

    contentItem: ColumnLayout {
        spacing: root.spacing

        Kirigami.Icon {
            id: iconItem
            implicitWidth: root.icon.width
            implicitHeight: root.icon.height
            Layout.alignment: Qt.AlignHCenter | Qt.AlignBottom

            animated: false
            selected: root.iconAndLabelsShouldlookSelected
            source: root.decoration || root.icon.name || root.icon.source
        }

        PC3.Label {
            id: label
            Layout.alignment: Qt.AlignHCenter | Qt.AlignTop
            Layout.fillWidth: true
            Layout.preferredHeight: label.lineCount === 1 ? label.implicitHeight * 2 : label.implicitHeight

            text: root.text
            textFormat: Text.PlainText
            elide: Text.ElideRight
            horizontalAlignment: Text.AlignHCenter
            verticalAlignment: Text.AlignTop
            maximumLineCount: 2
            wrapMode: Text.Wrap
            color: root.mouseArea.containsMouse ? "#fff48f" : (root.iconAndLabelsShouldlookSelected ? "#ffd700" : Kirigami.Theme.textColor)
        }
    }
}
