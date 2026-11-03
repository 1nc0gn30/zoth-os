---
title: "zoth-watchdog.timer"
tags: [os, systemd]
---
# zoth-watchdog.timer

Periodic Autonomous Watchdog & Self-Healing Timer (Every 15m)

- **Unit:** `zoth-watchdog.timer`
- **WantedBy:** `timers.target multi-user.target`
- **ExecStart:** `—`

- **Description:** Periodic Autonomous Watchdog & Self-Healing Timer (Every 15m)
- **WantedBy:** `timers.target multi-user.target`
- Image unit under `etc/systemd/system`. Loopback daemons unless the unit says otherwise.

## See also

[[Zoth OS]] · [[MOC Units]] · [[Unit zoth-watchdog.service|zoth-watchdog.service]]