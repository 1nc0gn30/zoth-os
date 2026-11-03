---
title: "Zoth Firefox Navigator"
tags: [os, desktop]
aliases: ["firefox", "Zoth Firefox Navigator"]
---

# Zoth Firefox Navigator

Hardened Privacy & Web Research Browser.

## Desktop Entry Details

- **Name:** `Zoth Firefox Navigator`
- **Comment:** `Hardened Privacy & Web Research Browser`
- **Exec:** `/usr/local/bin/zoth-firefox %u`
- **Icon:** `/usr/share/pixmaps/firefox.png`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `Network;WebBrowser;`
- **Startup Notify:** `true`
- **File:** `/usr/share/applications/firefox.desktop`

## Launch Configuration & Behavior

Defines the primary web browsing application launcher for Zoth OS. Instead of calling unconfigured upstream Firefox, it runs the `/usr/local/bin/zoth-firefox %u` wrapper script, applying hardened privacy profiles, custom settings, and research configurations when opening URL targets. Classified under Network and WebBrowser categories with startup notifications active.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI zoth-firefox|zoth-firefox]]