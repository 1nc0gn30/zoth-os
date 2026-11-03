---
title: "Zoth Sentinel AI"
tags: [os, desktop]
aliases: ["zoth-sentinel", "Zoth Sentinel AI"]
---

# Zoth Sentinel AI

Lightweight autonomous AI daemon monitoring and executing OS tasks.

## Desktop Entry Details

- **Name:** `Zoth Sentinel AI`
- **Generic Name:** `Autonomous OS AI Supervisor`
- **Comment:** `Lightweight autonomous AI daemon monitoring and executing OS tasks`
- **Exec:** `/usr/local/bin/zoth-sentinel-hud`
- **Icon:** `zoth-sentinel`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `System;Security;Utility;Development;`
- **Keywords:** `AI;Sentinel;Assistant;Supervisor;Automation;Execution;`
- **Startup Notify:** `true`
- **File:** `/usr/share/applications/zoth-sentinel.desktop`

## Launch Configuration & Behavior

Registers Zoth Sentinel AI across `System`, `Security`, `Utility`, and `Development` categories. The entry launches the graphical monitoring head via `/usr/local/bin/zoth-sentinel-hud` (`Terminal=false`) with startup notification enabled, providing visibility into the autonomous AI daemon that supervises and executes operating system tasks.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI zoth-sentinel|zoth-sentinel]] · [[CLI zoth-sentinel-hud|zoth-sentinel-hud]] · [[Unit zoth-sentinel.service|zoth-sentinel.service]]