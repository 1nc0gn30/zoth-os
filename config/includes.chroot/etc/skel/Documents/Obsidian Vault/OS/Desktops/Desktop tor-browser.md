---
title: "Zoth Tor Privacy Browser"
tags: [os, desktop]
aliases: ["tor-browser", "Zoth Tor Privacy Browser"]
---

# Zoth Tor Privacy Browser

Tor Onion Routing Anonymous Web Explorer.

## Desktop Entry Details

- **Name:** `Zoth Tor Privacy Browser`
- **Comment:** `Tor Onion Routing Anonymous Web Explorer`
- **Exec:** `/usr/local/bin/tor-browser %u`
- **Icon:** `/usr/share/pixmaps/torbrowser.png`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `Network;WebBrowser;Security;Pentesting;`
- **Startup Notify:** `true`
- **File:** `/usr/share/applications/tor-browser.desktop`

## Launch Configuration & Behavior

The desktop entry integrates Tor Browser into the Zoth OS desktop under Network, WebBrowser, Security, and Pentesting application categories. It executes `/usr/local/bin/tor-browser %u`, passing URL arguments directly to the browser wrapper script while displaying the system Tor Browser icon and providing startup notification.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI tor-browser|tor-browser]]