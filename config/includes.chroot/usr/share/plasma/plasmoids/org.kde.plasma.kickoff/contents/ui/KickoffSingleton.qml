/* SPDX-FileCopyrightText: 2021 Noah Davis <noahadvs@gmail.com>
 * SPDX-License-Identifier: LGPL-2.0-or-later
 */

pragma ComponentBehavior: Bound
pragma Singleton // NOTE: Singletons are shared between all instances of a plasmoid

import QtQml.Models
import QtQuick
import QtQuick.Templates as T
import org.kde.kirigami as Kirigami
import org.kde.ksvg as KSvg
import org.kde.plasma.plasma5support as P5Support

// Using Item because it has a default property.
// Trying to create a default property for a QtObject seems to cause segfaults.
Item {
    id: root

    visible: false

    //BEGIN Sovereign Reality Mode State & Command Runner
    property string currentMode: "gold"

    function normalizeMode(raw) {
        var m = String(raw || "gold").toLowerCase().trim();
        if (m === "win11" || m === "windows" || m === "incognito") return "incognito";
        if (m === "ghost" || m === "ghostmode") return "ghost";
        if (m === "matrix" || m === "lucy" || m === "p39") return "matrix";
        return "gold";
    }

    readonly property color accentColor: currentMode === "ghost" ? "#ff3058" :
                                         (currentMode === "matrix" ? "#00ff9d" :
                                         (currentMode === "incognito" ? "#48a8ff" : "#ffd700"))

    readonly property color accentBright: currentMode === "ghost" ? "#ff8da3" :
                                          (currentMode === "matrix" ? "#9effd6" :
                                          (currentMode === "incognito" ? "#a8d8ff" : "#fff48f"))

    readonly property string modeBadge: currentMode === "ghost" ? "◈ GHOSTMODE" :
                                        (currentMode === "matrix" ? "λ MATRIX P39" :
                                        (currentMode === "incognito" ? "❖ EXEC FLUENT" : "☿ 24K SANCTUM"))

    function rgbaAccent(alpha) {
        if (currentMode === "ghost") return Qt.rgba(1.0, 0.188, 0.345, alpha);
        if (currentMode === "matrix") return Qt.rgba(0.0, 1.0, 0.616, alpha);
        if (currentMode === "incognito") return Qt.rgba(0.282, 0.659, 1.0, alpha);
        return Qt.rgba(1.0, 0.84, 0.0, alpha);
    }

    readonly property P5Support.DataSource cmdRunner: P5Support.DataSource {
        engine: "executable"
        connectedSources: []
        onNewData: (source, data) => disconnectSource(source)
    }

    function switchRealityMode(modeId) {
        var norm = normalizeMode(modeId);
        root.currentMode = norm;
        cmdRunner.connectSource("/usr/local/bin/zoth-mode " + norm);
    }

    function openUrl(url) {
        cmdRunner.connectSource("xdg-open " + url);
    }

    function syncModeFromDaemon() {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "http://127.0.0.1:9989/");
        xhr.timeout = 250;
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200 && xhr.responseText) {
                try {
                    var parsed = JSON.parse(xhr.responseText);
                    if (parsed && parsed.mode) {
                        root.currentMode = root.normalizeMode(parsed.mode);
                    }
                } catch (e) {}
            }
        };
        xhr.send();
    }

    Component.onCompleted: syncModeFromDaemon()
    //END

    //BEGIN Models and Data Sources
    readonly property P5Support.DataSource powerManagement: P5Support.DataSource {
        engine: "powermanagement"
        connectedSources: ["PowerDevil"]
        // For some reason, these signal handlers need to be here for `data` to actually contain data.
        onSourceAdded: source => {
            disconnectSource(source);
            connectSource(source);
        }
        onSourceRemoved: source => disconnectSource(source);
    }
    //END

    //BEGIN Reusable Objects
    readonly property KSvg.Svg lineSvg: KSvg.Svg {
        imagePath: "widgets/line"
        property int horLineHeight: lineSvg.elementSize("horizontal-line").height
        property int vertLineWidth: lineSvg.elementSize("vertical-line").width
    }
    //END

    //BEGIN Metrics
    readonly property KSvg.FrameSvgItem listItemMetrics: KSvg.FrameSvgItem {
        visible: false
        imagePath: "widgets/listitem"
        prefix: "normal"
    }

    readonly property FontMetrics fontMetrics: FontMetrics {
        id: fontMetrics
        font: Kirigami.Theme.defaultFont
    }

    readonly property real gridCellSize: gridDelegate.implicitHeight
    readonly property real compactListDelegateHeight: compactListDelegate.implicitHeight
    readonly property real compactListDelegateContentHeight: compactListDelegate.implicitContentHeight
    //END

    //BEGIN Private
    KickoffGridDelegate {
        id: gridDelegate
        visible: false
        enabled: false
        model: null
        index: -1
        text: "asdf"
        url: ""
        decoration: "start-here-kde"
        description: "asdf"
        width: implicitHeight
        action: null
        indicator: null
        isMultilineText: false
    }
    KickoffListDelegate {
        id: compactListDelegate
        visible: false
        enabled: false
        compact: true
        model: null
        index: -1
        text: "asdf"
        url: ""
        decoration: "start-here-kde"
        description: "asdf"
        action: null
        indicator: null
        isMultilineText: false
    }
    //END
}
