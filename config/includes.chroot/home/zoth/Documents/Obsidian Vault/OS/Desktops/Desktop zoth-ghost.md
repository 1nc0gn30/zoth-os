---
title: "NullAI Ghostmode"
tags: [os, desktop]
aliases: ["zoth-ghost", "NullAI Ghostmode"]
---

# NullAI Ghostmode

Tor Route, Amnesic RAM & Anti-Forensics Mode.

## Desktop Entry Details

- **Name:** `NullAI Ghostmode`
- **Comment:** `Tor Route, Amnesic RAM & Anti-Forensics Mode`
- **Exec:** `xfce4-terminal -T 'Ghostmode Operations' -e 'zoth-ghost'`
- **Icon:** `zoth-ghost`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `Security;System;`
- **Startup Notify:** `true`
- **Keywords:** `ghost;nullai;tor;amnesic;anti-forensics;stealth;`
- **MIME Type:** `application/x-zoth-ghost;`
- **File:** `/usr/share/applications/zoth-ghost.desktop`

## Launch Configuration & Behavior

The `zoth-ghost.desktop` entry configures the primary terminal launcher for NullAI Ghostmode operations. It launches `xfce4-terminal` with the title `'Ghostmode Operations'` to execute `/usr/local/bin/zoth-ghost`, managing Tor network routing, volatile RAM storage isolation, and anti-forensic safeguards.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI zoth-ghost|zoth-ghost]] · [[Unit zoth-ghost.service|zoth-ghost.service]] · [[CLI xfce4-terminal|xfce4-terminal]]