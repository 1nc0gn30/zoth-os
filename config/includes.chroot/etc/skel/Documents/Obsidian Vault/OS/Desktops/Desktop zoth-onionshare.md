---
title: "Zoth OnionShare Privacy"
tags: [os, desktop]
aliases: ["zoth-onionshare", "Zoth OnionShare Privacy"]
---

# Zoth OnionShare Privacy

Secure and Anonymous File Sharing, Chat, and Hosting over Tor.

## Desktop Entry Details

- **Name:** `Zoth OnionShare Privacy`
- **Generic Name:** `Anonymous File Sharing`
- **Comment:** `Secure and Anonymous File Sharing, Chat, and Hosting over Tor`
- **Exec:** `onionshare`
- **TryExec:** `onionshare`
- **Icon:** `onionshare`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `Network;Security;ZothPentesting;ZothOpsec;`
- **Keywords:** `tor;onion;anonymous;share;privacy;chat;`
- **Startup Notify:** `true`
- **File:** `/usr/share/applications/zoth-onionshare.desktop`

## Launch Configuration & Behavior

The entry registers OnionShare under Network, Security, ZothPentesting, and ZothOpsec categories. It executes `onionshare` directly as a graphical application (checking binary availability via `TryExec=onionshare`), enabling secure, anonymous Tor-based ephemeral file transfers, anonymous chat, and static website hosting without exposing public IP addresses.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[Pkg onionshare|onionshare]]