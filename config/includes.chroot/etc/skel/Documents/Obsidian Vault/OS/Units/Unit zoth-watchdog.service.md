---
title: "zoth-watchdog.service"
tags: [os, systemd]
---
# zoth-watchdog.service

ZothOS Autonomous Watchdog & Self-Healing Resilience Service

- **Unit:** `zoth-watchdog.service`
- **WantedBy:** `multi-user.target`
- **ExecStart:** `/usr/local/bin/zoth-heal --quick --quiet`

- **Description:** ZothOS Autonomous Watchdog & Self-Healing Resilience Service
- **ExecStart:** `/usr/local/bin/zoth-heal --quick --quiet`
- **WantedBy:** `multi-user.target`
- Image unit under `etc/systemd/system`. Loopback daemons unless the unit says otherwise.

## See also

[[Zoth OS]] · [[MOC Units]] · [[Unit zoth-watchdog.timer|zoth-watchdog.timer]]