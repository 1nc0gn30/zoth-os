/*
 *    SPDX-FileCopyrightText: 2021 Mikel Johnson <mikel5764@gmail.com>
 *    SPDX-FileCopyrightText: 2021 Noah Davis <noahadvs@gmail.com>
 *
 *    SPDX-License-Identifier: GPL-2.0-or-later
 */

pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import org.kde.ksvg as KSvg
import org.kde.plasma.components as PC3
import org.kde.plasma.extras as PlasmaExtras
import org.kde.kirigami as Kirigami

PlasmaExtras.PlasmoidHeading {
    id: root

    readonly property alias tabBar: tabBar
    property real preferredTabBarWidth: 0
    readonly property alias leaveButtons: leaveButtons

    contentWidth: tabBar.implicitWidth + spacing
    contentHeight: Math.max(tabBar.implicitHeight, leaveButtons.implicitHeight, 44)

    // Generous outer margins so footer items don't touch the window border
    leftPadding: Math.max(kickoff.backgroundMetrics.leftPadding, 16)
    rightPadding: Math.max(kickoff.backgroundMetrics.rightPadding, 16)
    topPadding: 12
    bottomPadding: 12

    topInset: 0
    leftInset: 0
    rightInset: 0
    bottomInset: 0

    spacing: Math.max(kickoff.backgroundMetrics.spacing, 14)
    position: PC3.ToolBar.Footer

    PC3.TabBar {
        id: tabBar

        // Calculate tab width with generous internal padding so text and icons have plenty of room
        property real minTabWidth: Math.max(applicationsTab.contentItem.implicitWidth + 40, placesTab.contentItem.implicitWidth + 40)
        property real tabWidth: root.preferredTabBarWidth > 0 
            ? Math.max(minTabWidth, (root.preferredTabBarWidth / 2) - 6) 
            : minTabWidth

        focus: true

        width: (tabWidth * 2) + tabBarListView.spacing
        implicitWidth: (minTabWidth * 2) + tabBarListView.spacing + leftPadding + rightPadding
        implicitHeight: 42

        // This is needed to keep the separators horizontally aligned
        leftPadding: mirrored ? root.spacing : 0
        rightPadding: !mirrored ? root.spacing : 0

        anchors {
            top: parent.top
            left: parent.left
            bottom: parent.bottom
        }

        position: PC3.TabBar.Footer

        contentItem: ListView {
            id: tabBarListView
            focus: true
            model: tabBar.contentModel
            currentIndex: tabBar.currentIndex

            spacing: 8
            orientation: ListView.Horizontal
            boundsBehavior: Flickable.StopAtBounds
            flickableDirection: Flickable.AutoFlickIfNeeded
            snapMode: ListView.SnapToItem

            highlightMoveDuration: Kirigami.Units.longDuration
            highlightRangeMode: ListView.ApplyRange
            preferredHighlightBegin: tabBar.tabWidth
            preferredHighlightEnd: width - tabBar.tabWidth
            highlight: Item { visible: false }
            keyNavigationEnabled: false
        }

        PC3.TabButton {
            id: applicationsTab
            focus: true
            width: tabBar.tabWidth
            anchors.top: tabBarListView.contentItem.top
            anchors.bottom: tabBarListView.contentItem.bottom
            anchors.topMargin: 2
            anchors.bottomMargin: 2
            text: i18n("Applications")

            leftPadding: 16
            rightPadding: 16
            topPadding: 6
            bottomPadding: 6

            contentItem: RowLayout {
                anchors.centerIn: parent
                spacing: 8
                Image {
                    source: "/usr/share/pixmaps/menu-gold-all-apps.png"
                    Layout.preferredWidth: 20
                    Layout.preferredHeight: 20
                    fillMode: Image.PreserveAspectFit
                    mipmap: true
                    smooth: true
                }
                PC3.Label {
                    text: applicationsTab.text
                    color: applicationsTab.checked ? "#ffd700" : (applicationsTab.hovered ? "#fff48f" : Kirigami.Theme.textColor)
                    font.bold: applicationsTab.checked
                }
            }

            background: Rectangle {
                color: applicationsTab.checked ? Qt.rgba(1, 0.84, 0, 0.16) : (applicationsTab.hovered ? Qt.rgba(1, 0.84, 0, 0.08) : "transparent")
                border.color: applicationsTab.checked ? Qt.rgba(1, 0.84, 0, 0.45) : (applicationsTab.hovered ? Qt.rgba(1, 0.84, 0, 0.25) : "transparent")
                border.width: 1
                radius: 8
                Behavior on color { ColorAnimation { duration: 150 } }
                Behavior on border.color { ColorAnimation { duration: 150 } }
                Rectangle {
                    anchors.bottom: parent.bottom
                    anchors.bottomMargin: 2
                    anchors.horizontalCenter: parent.horizontalCenter
                    width: Math.max(parent.width - 24, 20)
                    height: applicationsTab.checked ? 2.5 : (applicationsTab.hovered ? 1.5 : 0)
                    radius: 2
                    color: "#ffd700"
                    visible: height > 0
                    Behavior on height { NumberAnimation { duration: 150; easing.type: Easing.OutCubic } }
                }
            }

            Keys.onBacktabPressed: event => {
                (kickoff.lastCentralPane || nextItemInFocusChain(false))
                    .forceActiveFocus(Qt.BacktabFocusReason)
            }
        }
        PC3.TabButton {
            id: placesTab
            width: tabBar.tabWidth
            anchors.top: tabBarListView.contentItem.top
            anchors.bottom: tabBarListView.contentItem.bottom
            anchors.topMargin: 2
            anchors.bottomMargin: 2
            text: i18n("Places") //Explore?

            leftPadding: 16
            rightPadding: 16
            topPadding: 6
            bottomPadding: 6

            contentItem: RowLayout {
                anchors.centerIn: parent
                spacing: 8
                Image {
                    source: "/usr/share/pixmaps/menu-gold-places.png"
                    Layout.preferredWidth: 20
                    Layout.preferredHeight: 20
                    fillMode: Image.PreserveAspectFit
                    mipmap: true
                    smooth: true
                }
                PC3.Label {
                    text: placesTab.text
                    color: placesTab.checked ? "#ffd700" : (placesTab.hovered ? "#fff48f" : Kirigami.Theme.textColor)
                    font.bold: placesTab.checked
                }
            }

            background: Rectangle {
                color: placesTab.checked ? Qt.rgba(1, 0.84, 0, 0.16) : (placesTab.hovered ? Qt.rgba(1, 0.84, 0, 0.08) : "transparent")
                border.color: placesTab.checked ? Qt.rgba(1, 0.84, 0, 0.45) : (placesTab.hovered ? Qt.rgba(1, 0.84, 0, 0.25) : "transparent")
                border.width: 1
                radius: 8
                Behavior on color { ColorAnimation { duration: 150 } }
                Behavior on border.color { ColorAnimation { duration: 150 } }
                Rectangle {
                    anchors.bottom: parent.bottom
                    anchors.bottomMargin: 2
                    anchors.horizontalCenter: parent.horizontalCenter
                    width: Math.max(parent.width - 24, 20)
                    height: placesTab.checked ? 2.5 : (placesTab.hovered ? 1.5 : 0)
                    radius: 2
                    color: "#ffd700"
                    visible: height > 0
                    Behavior on height { NumberAnimation { duration: 150; easing.type: Easing.OutCubic } }
                }
            }
        }


        Connections {
            target: kickoff
            function onExpandedChanged() {
                if (kickoff.expanded) {
                    tabBar.currentIndex = 0
                }
            }
        }

        Keys.onPressed: event => {
            const Key_Next = Qt.application.layoutDirection === Qt.RightToLeft ? Qt.Key_Left : Qt.Key_Right
            const Key_Prev = Qt.application.layoutDirection === Qt.RightToLeft ? Qt.Key_Right : Qt.Key_Left
            if (event.key === Key_Next) {
                if (currentIndex === count - 1) {
                    leaveButtons.nextItemInFocusChain().forceActiveFocus(Qt.TabFocusReason)
                } else {
                    incrementCurrentIndex()
                    currentItem.forceActiveFocus(Qt.TabFocusReason)
                }
                event.accepted = true
            } else if (event.key === Key_Prev && currentIndex > 0) {
                decrementCurrentIndex()
                currentItem.forceActiveFocus(Qt.BacktabFocusReason)
                event.accepted = true
            }
        }
        Keys.onUpPressed: event => {
            kickoff.firstCentralPane.forceActiveFocus(Qt.BacktabFocusReason);
        }
    }

    LeaveButtons {
        id: leaveButtons

        anchors {
            top: parent.top
            right: parent.right
            bottom: parent.bottom
        }

        // available width for leaveButtons
        maximumWidth: root.availableWidth - tabBar.width - root.spacing

        Keys.onUpPressed: event => {
            kickoff.lastCentralPane.forceActiveFocus(Qt.BacktabFocusReason);
        }
    }

    Behavior on height {
        enabled: kickoff.expanded
        NumberAnimation {
            duration: Kirigami.Units.longDuration
            easing.type: Easing.InQuad
        }
    }

    // Using item containing WheelHandler instead of MouseArea because
    // MouseArea doesn't keep track to the total amount of rotation.
    // Keeping track of the total amount of rotation makes it work
    // better for touch pads.
    Item {
        id: mouseItem
        parent: root
        anchors.left: parent.left
        height: root.height
        width: tabBar.width
        z: 1 // Has to be above contentItem to receive mouse wheel events
        WheelHandler {
            id: tabScrollHandler
            acceptedDevices: PointerDevice.Mouse | PointerDevice.TouchPad
            onWheel: {
                const shouldDec = rotation >= 15
                const shouldInc = rotation <= -15
                const shouldReset = (rotation > 0 && tabBar.currentIndex === 0) || (rotation < 0 && tabBar.currentIndex === tabBar.count - 1)
                if (shouldDec) {
                    tabBar.decrementCurrentIndex();
                    rotation = 0
                } else if (shouldInc) {
                    tabBar.incrementCurrentIndex();
                    rotation = 0
                } else if (shouldReset) {
                    rotation = 0
                }
            }
        }
    }

    Shortcut {
        sequences: ["Ctrl+Tab", "Ctrl+Shift+Tab", StandardKey.NextChild, StandardKey.PreviousChild]
        onActivated: {
            tabBar.currentIndex = (tabBar.currentIndex === 0) ? 1 : 0;
        }
    }
}
