---
title: "ZOTHOS Sec Arsenal"
tags: [os, desktop]
aliases: ["zoth-sec", "ZOTHOS Sec Arsenal"]
---

# ZOTHOS Sec Arsenal

Kali & Parrot Pentesting Toolchain.

## Desktop Entry Details

- **Name:** `ZOTHOS Sec Arsenal`
- **Comment:** `Kali & Parrot Pentesting Toolchain`
- **Exec:** `xfce4-terminal -T 'Security Arsenal' -e 'zoth-sec'`
- **Icon:** `zoth-sec`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `Security;System;`
- **Keywords:** `security;pentest;kali;parrot;arsenal;toolchain;`
- **MimeType:** `application/x-zoth-sec;`
- **Startup Notify:** `true`
- **File:** `/usr/share/applications/zoth-sec.desktop`

## Launch Configuration & Behavior

Registers ZOTHOS Sec Arsenal under `Security` and `System` categories. When activated, it spawns an `xfce4-terminal` session with window title `'Security Arsenal'` and executes `/usr/local/bin/zoth-sec` to access the Kali and Parrot pentesting toolchain. It registers the `application/x-zoth-sec` MIME type and enables startup notification.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI zoth-sec|zoth-sec]] · [[CLI xfce4-terminal|xfce4-terminal]]