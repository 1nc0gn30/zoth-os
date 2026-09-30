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
import org.kde.ksvg as KSvg
import org.kde.plasma.components as PC3
import org.kde.kirigami as Kirigami
import org.kde.plasma.plasmoid

AbstractKickoffItemDelegate {
    id: root

    property bool compact: Kirigami.Settings.tabletMode ? false : Plasmoid.configuration.compactMode

    leftPadding: (KickoffSingleton.listItemMetrics.margins.left + 8)
    + (mirrored ? KickoffSingleton.fontMetrics.descent : 0)
    rightPadding: (KickoffSingleton.listItemMetrics.margins.right + 8)
    + (!mirrored ? KickoffSingleton.fontMetrics.descent : 0)
    // Generous breathing room for category and item rows
    topPadding: root.isCategoryListItem ? 9 : (compact ? 6 : 8)
    bottomPadding: root.isCategoryListItem ? 9 : (compact ? 6 : 8)

    icon.width: root.isCategoryListItem ? 32 : (compact ? Kirigami.Units.iconSizes.smallMedium : Kirigami.Units.iconSizes.medium)
    icon.height: root.isCategoryListItem ? 32 : (compact ? Kirigami.Units.iconSizes.smallMedium : Kirigami.Units.iconSizes.medium)

    labelTruncated: label.truncated
    descriptionTruncated: descriptionLabel.truncated
    descriptionVisible: descriptionLabel.visible

    dragIconItem: icon

    background: Item {
        anchors.fill: parent

        Rectangle {
            id: goldListBg
            anchors.fill: parent
            anchors.margins: 2
            radius: 8
            color: root.down ? Qt.rgba(1, 0.84, 0, 0.28) : 
                   (root.mouseArea.containsMouse ? Qt.rgba(1, 0.84, 0, 0.14) : 
                   (root.iconAndLabelsShouldlookSelected ? Qt.rgba(1, 0.84, 0, 0.18) : "transparent"))
            border.color: root.down ? "#ffd700" : 
                         (root.mouseArea.containsMouse ? Qt.rgba(1, 0.84, 0, 0.50) : 
                         (root.iconAndLabelsShouldlookSelected ? Qt.rgba(1, 0.84, 0, 0.35) : "transparent"))
            border.width: 1
            scale: root.down ? 0.98 : (root.mouseArea.containsMouse ? 1.015 : 1.0)

            Behavior on scale {
                NumberAnimation { duration: 150; easing.type: Easing.OutCubic }
            }
            Behavior on color {
                ColorAnimation { duration: 150 }
            }
            Behavior on border.color {
                ColorAnimation { duration: 150 }
            }
        }

        // Gold indicator bar for category navigation & item selection
        Rectangle {
            id: goldActiveBar
            width: (root.iconAndLabelsShouldlookSelected || root.down) ? 4 : (root.mouseArea.containsMouse ? 2.5 : 0)
            anchors.left: parent.left
            anchors.top: parent.top
            anchors.bottom: parent.bottom
            anchors.topMargin: 4
            anchors.bottomMargin: 4
            radius: 2
            color: root.down ? "#ffffff" : "#ffd700"
            visible: width > 0

            Behavior on width {
                NumberAnimation { duration: 160; easing.type: Easing.OutCubic }
            }
        }
    }

    contentItem: RowLayout {
        id: row
        spacing: Math.max(14, Math.round(KickoffSingleton.listItemMetrics.margins.left * 1.5))

        Item {
            id: iconWrapper
            implicitWidth: root.icon.width
            implicitHeight: root.icon.height
            Layout.alignment: Qt.AlignLeft | Qt.AlignVCenter
            scale: root.mouseArea.containsMouse ? 1.10 : 1.0
            Behavior on scale {
                NumberAnimation { duration: 180; easing.type: Easing.OutBack; easing.overshoot: 1.2 }
            }

            Image {
                id: goldCatImg
                anchors.fill: parent
                fillMode: Image.PreserveAspectFit
                asynchronous: true
                mipmap: true
                smooth: true
                source: {
                    if (root.isCategoryListItem) {
                        var t = (root.text || "").toLowerCase().trim();
                        var dec = String(root.decoration || "").toLowerCase();
                        var iname = String(root.icon?.name || "").toLowerCase();
                        if (t.indexOf("favor") !== -1 || dec.indexOf("favor") !== -1 || dec.indexOf("bookmark") !== -1 || iname.indexOf("favor") !== -1 || iname.indexOf("bookmark") !== -1) return "/usr/share/pixmaps/menu-gold-favorites.png";
                        if (t.indexOf("all") !== -1 || dec.indexOf("all") !== -1 || dec.indexOf("grid") !== -1 || iname.indexOf("all") !== -1 || iname.indexOf("grid") !== -1) return "/usr/share/pixmaps/menu-gold-all-apps.png";
                        if (t === "development" || dec.indexOf("devel") !== -1) return "/usr/share/pixmaps/menu-gold-development.png";
                        if (t === "education" || dec.indexOf("edu") !== -1) return "/usr/share/pixmaps/menu-gold-education.png";
                        if (t === "graphics" || dec.indexOf("graph") !== -1) return "/usr/share/pixmaps/menu-gold-graphics.png";
                        if (t === "help" || dec.indexOf("help") !== -1) return "/usr/share/pixmaps/menu-gold-help.png";
                        if (t === "internet" || dec.indexOf("net") !== -1) return "/usr/share/pixmaps/menu-gold-internet.png";
                        if (t === "miscellaneous" || t === "more" || dec.indexOf("misc") !== -1) return "/usr/share/pixmaps/menu-gold-misc.png";
                        if (t === "multimedia" || dec.indexOf("media") !== -1) return "/usr/share/pixmaps/menu-gold-multimedia.png";
                        if (t.indexOf("pentest") !== -1 || t.indexOf("red team") !== -1 || dec.indexOf("sec") !== -1) return "/usr/share/pixmaps/menu-gold-pentesting.png";
                        if (t === "system" || dec.indexOf("system") !== -1) return "/usr/share/pixmaps/menu-gold-system.png";
                        if (t === "utilities" || dec.indexOf("util") !== -1) return "/usr/share/pixmaps/menu-gold-utilities.png";
                        if (t === "settings" || dec.indexOf("setting") !== -1) return "/usr/share/pixmaps/menu-gold-settings.png";
                        if (t === "office" || dec.indexOf("office") !== -1) return "/usr/share/pixmaps/menu-gold-all-apps.png";
                    }
                    return "";
                }
                visible: source != ""
            }

            Kirigami.Icon {
                id: fallbackIcon
                anchors.fill: parent
                visible: !goldCatImg.visible
                animated: false
                selected: root.iconAndLabelsShouldlookSelected
                source: root.decoration || root.icon.name || root.icon.source
            }
        }

        GridLayout {
            id: gridLayout

            readonly property color textColor: root.down ? "#ffffff" : (root.mouseArea.containsMouse ? "#fff48f" : (root.iconAndLabelsShouldlookSelected ? "#ffd700" : Kirigami.Theme.textColor))

            Layout.fillWidth: true

            transform: Translate {
                x: root.mouseArea.containsMouse ? (root.mirrored ? -3 : 3) : 0
                Behavior on x {
                    NumberAnimation { duration: 160; easing.type: Easing.OutCubic }
                }
            }

            rows: root.compact ? 1 : 2
            columns: root.compact ? 2 : 1
            rowSpacing: 0
            columnSpacing: Kirigami.Units.largeSpacing

            PC3.Label {
                id: label
                Layout.fillWidth: !descriptionLabel.visible
                Layout.maximumWidth: root.width - root.leftPadding - root.rightPadding - icon.width - row.spacing
                Layout.preferredHeight: {
                    if (root.isCategoryListItem) {
                        return root.compact ? implicitHeight : Math.round(implicitHeight * 1.6);
                    }
                    if (!root.compact && !descriptionLabel.visible) {
                        return implicitHeight + descriptionLabel.implicitHeight + 4;
                    }
                    return implicitHeight;
                }
                text: root.text
                textFormat: root.isMultilineText ? Text.StyledText : Text.PlainText
                elide: Text.ElideRight
                wrapMode: root.isMultilineText ? Text.WordWrap : Text.NoWrap
                verticalAlignment: Text.AlignVCenter
                maximumLineCount: root.isMultilineText ? Infinity : 1
                color: gridLayout.textColor
            }


            PC3.Label {
                id: descriptionLabel
                Layout.fillWidth: true
                visible: {
                    let isApplicationSearchResult = root.model?.group === "Applications" || root.model?.group === "System Settings"
                    let isSearchResultWithDescription = root.isSearchResult && (Plasmoid.configuration?.appNameFormat > 1 || !isApplicationSearchResult)
                    return text.length > 0 && (isSearchResultWithDescription || (text !== label.text && !root.isCategoryListItem && Plasmoid.configuration?.appNameFormat > 1))
                }
                enabled: false
                text: root.description
                textFormat: Text.PlainText
                font: Kirigami.Theme.smallFont
                elide: Text.ElideRight
                verticalAlignment: Text.AlignVCenter
                horizontalAlignment: root.compact ? Text.AlignRight : Text.AlignLeft
                maximumLineCount: 1
                color: gridLayout.textColor
            }
        }
    }

    Loader {
        id: separatorLoader

        anchors.left: root.left
        anchors.right: root.right
        anchors.verticalCenter: root.verticalCenter

        active: root.isSeparator

        asynchronous: false
        sourceComponent: KSvg.SvgItem {
            width: parent.width
            height: KickoffSingleton.lineSvg.horLineHeight

            svg: KickoffSingleton.lineSvg
            elementId: "horizontal-line"
        }
    }
}
