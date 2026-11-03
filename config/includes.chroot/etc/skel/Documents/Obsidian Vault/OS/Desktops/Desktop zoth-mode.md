---
title: "Reality Switcher"
tags: [os, desktop]
aliases: ["zoth-mode", "Reality Switcher"]
---

# Reality Switcher

Toggle Matrix / Ghost / Win11 Undercover.

## Desktop Entry Details

- **Name:** `Reality Switcher`
- **Comment:** `Toggle Matrix / Ghost / Win11 Undercover`
- **Exec:** `xfce4-terminal -T 'Reality Switcher' -e 'zoth-mode'`
- **Icon:** `zoth-mode`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `Settings;System;`
- **Keywords:** `reality;switcher;matrix;ghost;win11;undercover;`
- **MimeType:** `application/x-zoth-mode;`
- **Startup Notify:** `true`
- **File:** `/usr/share/applications/zoth-mode.desktop`

## Launch Configuration & Behavior

The entry registers Reality Switcher under the Settings and System desktop categories. Launching this shortcut spawns an `xfce4-terminal` window titled `"Reality Switcher"` running `/usr/local/bin/zoth-mode` to switch desktop environments and opsec profiles between Matrix, Ghost, and Windows 11 undercover modes. It registers the MIME type `application/x-zoth-mode` and enables startup notification.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI zoth-mode|zoth-mode]] · [[CLI xfce4-terminal|xfce4-terminal]]