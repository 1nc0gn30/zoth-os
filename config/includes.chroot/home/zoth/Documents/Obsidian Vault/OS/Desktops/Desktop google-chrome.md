---
title: "Zoth Chrome Web Engine"
tags: [os, desktop]
aliases: ["google-chrome", "Zoth Chrome Web Engine"]
---

# Zoth Chrome Web Engine

Google Chrome Enterprise & DevTools Platform.

## Desktop Entry Details

- **Name:** `Zoth Chrome Web Engine`
- **Comment:** `Google Chrome Enterprise & DevTools Platform`
- **Exec:** `/usr/local/bin/zoth-chrome %U`
- **Icon:** `/usr/share/pixmaps/google-chrome.png`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `Network;WebBrowser;`
- **Startup Notify:** `true`
- **File:** `/usr/share/applications/google-chrome.desktop`

## Launch Configuration & Behavior

The desktop entry establishes Google Chrome as the enterprise web engine and DevTools browser within ZothOS. Cataloged under Network and WebBrowser categories, the launcher executes the wrapper `/usr/local/bin/zoth-chrome` with `%U` parameter passing for URL handling, using the dedicated Chrome pixmap icon and standard startup notifications.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI zoth-chrome|zoth-chrome]]