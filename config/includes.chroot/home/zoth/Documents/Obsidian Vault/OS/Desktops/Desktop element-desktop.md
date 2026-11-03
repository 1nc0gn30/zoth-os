---
title: "Zoth Element Matrix Chat"
tags: [os, desktop]
aliases: ["element-desktop", "Zoth Element Matrix Chat"]
---

# Zoth Element Matrix Chat

Decentralized End-to-End Encrypted Matrix Chat.

## Desktop Entry Details

- **Name:** `Zoth Element Matrix Chat`
- **Comment:** `Decentralized End-to-End Encrypted Matrix Chat`
- **Exec:** `/usr/local/bin/element-desktop %U`
- **Icon:** `/usr/share/pixmaps/element-desktop.png`
- **Terminal:** `false`
- **Type:** `Application`
- **Startup WM Class:** `Element`
- **Categories:** `Network;Chat;InstantMessaging;`
- **MIME Type:** `x-scheme-handler/io.element.desktop;x-scheme-handler/element;`
- **File:** `/usr/share/applications/element-desktop.desktop`

## Launch Configuration & Behavior

Registers the Element Matrix messaging client in the Zoth desktop environment. It executes `/usr/local/bin/element-desktop %U`, registers protocol handlers for `io.element.desktop` and `element` URL schemes, and maps desktop window grouping to the `Element` window class. Categories include Network, Chat, and InstantMessaging.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI element-desktop|element-desktop]]