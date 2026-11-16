/*
 * SPDX-FileCopyrightText: 2021 Noah Davis <noahadvs@gmail.com>
 * SPDX-License-Identifier: LGPL-2.0-or-later
 */

pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import QtQuick.Templates as T
import org.kde.plasma.components as PC3
import org.kde.kirigami as Kirigami

EmptyPage {
    id: root
    property real preferredSideBarWidth: Math.max(220, footer.tabBar.implicitWidth, applicationsPage.implicitSideBarWidth)

    header: Rectangle {
        id: realityModeBar
        implicitHeight: 38
        color: KickoffSingleton.rgbaAccent(0.06)

        Rectangle {
            anchors.bottom: parent.bottom
            anchors.left: parent.left
            anchors.right: parent.right
            height: 1
            color: KickoffSingleton.rgbaAccent(0.24)
        }

        RowLayout {
            anchors.fill: parent
            anchors.leftMargin: 12
            anchors.rightMargin: 12
            spacing: 6

            PC3.Label {
                text: KickoffSingleton.modeBadge
                color: KickoffSingleton.accentColor
                font.family: "monospace"
                font.pixelSize: 10
                font.bold: true
                Layout.rightMargin: 6
            }

            Repeater {
                model: [
                    { id: "gold", label: "☿ 24K" },
                    { id: "ghost", label: "◈ GHOST" },
                    { id: "matrix", label: "λ MATRIX" },
                    { id: "incognito", label: "❖ EXEC" }
                ]
                delegate: Rectangle {
                    id: modePill
                    required property var modelData
                    readonly property bool isActive: KickoffSingleton.currentMode === modelData.id
                    implicitWidth: pillLbl.implicitWidth + 14
                    implicitHeight: 24
                    radius: 6
                    color: isActive ? KickoffSingleton.rgbaAccent(0.24) : (pillMouse.containsMouse ? KickoffSingleton.rgbaAccent(0.12) : Qt.rgba(1, 1, 1, 0.04))
                    border.color: isActive ? KickoffSingleton.accentColor : (pillMouse.containsMouse ? KickoffSingleton.rgbaAccent(0.45) : Qt.rgba(1, 1, 1, 0.10))
                    border.width: 1

                    PC3.Label {
                        id: pillLbl
                        anchors.centerIn: parent
                        text: modePill.modelData.label
                        color: modePill.isActive ? KickoffSingleton.accentBright : Kirigami.Theme.textColor
                        font.family: "monospace"
                        font.pixelSize: 10
                        font.bold: modePill.isActive
                    }

                    MouseArea {
                        id: pillMouse
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: KickoffSingleton.switchRealityMode(modePill.modelData.id)
                    }
                }
            }

            Item { Layout.fillWidth: true }

            Rectangle {
                id: studioBtn
                implicitWidth: studioLbl.implicitWidth + 16
                implicitHeight: 24
                radius: 6
                color: studioMouse.containsMouse ? KickoffSingleton.rgbaAccent(0.22) : Qt.rgba(1, 1, 1, 0.05)
                border.color: studioMouse.containsMouse ? KickoffSingleton.accentColor : KickoffSingleton.rgbaAccent(0.38)
                border.width: 1

                PC3.Label {
                    id: studioLbl
                    anchors.centerIn: parent
                    text: "✦ STUDIO :3000"
                    color: studioMouse.containsMouse ? KickoffSingleton.accentBright : KickoffSingleton.accentColor
                    font.family: "monospace"
                    font.pixelSize: 10
                    font.bold: true
                }

                MouseArea {
                    id: studioMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: {
                        KickoffSingleton.openUrl("http://127.0.0.1:3000");
                        if (kickoff.hideOnWindowDeactivate) {
                            kickoff.expanded = false;
                        }
                    }
                }
            }
        }
    }

    contentItem: HorizontalStackView {
        id: stackView
        focus: true
        reverseTransitions: footer.tabBar.currentIndex === 1
        initialItem: ApplicationsPage {
            id: applicationsPage
            preferredSideBarWidth: root.preferredSideBarWidth + kickoff.backgroundMetrics.leftPadding
        }
        Component {
            id: placesPage
            PlacesPage {
                preferredSideBarWidth: root.preferredSideBarWidth + kickoff.backgroundMetrics.leftPadding
                preferredSideBarHeight: applicationsPage.implicitSideBarHeight
            }
        }
        Connections {
            target: footer.tabBar
            function onCurrentIndexChanged() {
                if (footer.tabBar.currentIndex === 0) {
                    stackView.replace(applicationsPage)
                } else if (footer.tabBar.currentIndex === 1) {
                    stackView.replace(placesPage)
                }
            }
        }
    }

    footer: Footer {
        id: footer
        preferredTabBarWidth: root.preferredSideBarWidth
        Binding {
            target: kickoff
            property: "footer"
            value: footer
            restoreMode: Binding.RestoreBinding
        }
        // Eat down events to prevent them from reaching the contentArea or searchField
        Keys.onDownPressed: event => {}
    }
}
