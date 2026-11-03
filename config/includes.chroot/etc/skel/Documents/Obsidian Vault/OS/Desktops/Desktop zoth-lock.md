---
title: "Zoth Lock"
tags: [os, desktop]
aliases: ["zoth-lock", "Lock status", "Zoth Lock"]
---

# Zoth Lock

Lock the screen with your Zoth password. Agents and servers keep running.

## Desktop Entry Details

- **Name:** `Zoth Lock`
- **Generic Name:** `Stay-running screen lock`
- **Comment:** `Lock the screen with your Zoth password. Agents and servers keep running.`
- **Exec:** `/usr/local/bin/zoth-lock`
- **Icon:** `zoth-quicklock`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `Security;System;`
- **Keywords:** `lock;screen;password;zoth;quicklock;walk-away;`
- **Startup Notify:** `false`
- **Actions:** `SetPassword`, `Status`
- **File:** `/usr/share/applications/zoth-lock.desktop`

## Launch Configuration & Actions

The desktop entry registers Zoth Lock under Security and System categories. Launching the primary entry executes `/usr/local/bin/zoth-lock` to lock the workstation screen while leaving background agents, daemon processes, and servers intact. It also defines two desktop quick actions:
- **Set lock password:** runs `/usr/local/bin/zoth-lock --set-password`
- **Lock status:** runs `/usr/local/bin/zoth-lock --status`

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI zoth-lock|zoth-lock]] · [[CLI zoth-quicklock|zoth-quicklock]]