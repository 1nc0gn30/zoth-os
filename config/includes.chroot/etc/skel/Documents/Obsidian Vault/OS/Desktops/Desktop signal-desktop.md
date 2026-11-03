---
title: "Zoth Signal Guard"
tags: [os, desktop]
aliases: ["signal-desktop", "Zoth Signal Guard"]
---

# Zoth Signal Guard

Sovereign Encrypted Voice, Video & Text Messenger.

## Desktop Entry Details

- **Name:** `Zoth Signal Guard`
- **Comment:** `Sovereign Encrypted Voice, Video & Text Messenger`
- **Exec:** `/usr/local/bin/signal-desktop %U`
- **Icon:** `/usr/share/pixmaps/signal-desktop.png`
- **Terminal:** `false`
- **Type:** `Application`
- **StartupWMClass:** `signal`
- **Categories:** `Network;Chat;InstantMessaging;`
- **MimeType:** `x-scheme-handler/sgnl;x-scheme-handler/signalcaptcha;`
- **File:** `/usr/share/applications/signal-desktop.desktop`

## Launch Configuration & Behavior

The desktop entry registers Signal Desktop under the Network, Chat, and InstantMessaging application menus with custom Zoth branding. It targets `/usr/local/bin/signal-desktop %U` to process URL handler schemes (`sgnl:` and `signalcaptcha:`), associates with window class `signal`, and references a local high-resolution pixmap icon.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI signal-desktop|signal-desktop]] · [[CLI signal-cli|signal-cli]]