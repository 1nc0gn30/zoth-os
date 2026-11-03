---
title: "ZothOS Cockpit"
tags: [os, desktop]
aliases: ["zoth-cockpit", "ZothOS Cockpit"]
---

# ZothOS Cockpit

OS Dashboard & System Diagnostics.

## Desktop Entry Details

- **Name:** `ZothOS Cockpit`
- **Comment:** `OS Dashboard & System Diagnostics`
- **Exec:** `/usr/local/bin/zoth-cockpit`
- **Icon:** `zoth-cockpit`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `System;Monitoring;`
- **Startup Notify:** `true`
- **Keywords:** `cockpit;dashboard;diagnostics;system;monitor;os;`
- **MIME Type:** `application/x-zoth-cockpit;`
- **File:** `/usr/share/applications/zoth-cockpit.desktop`

## Launch Configuration & Behavior

The `zoth-cockpit.desktop` entry registers the ZothOS Cockpit dashboard under System and Monitoring. It directly invokes `/usr/local/bin/zoth-cockpit` without opening a terminal window, handling system metrics, diagnostic tools, and OS health monitoring with startup notifications active.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI zoth-cockpit|zoth-cockpit]]