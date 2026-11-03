---
title: "zoth-sentinel.service"
tags: [os, systemd]
---
# zoth-sentinel.service

ZothOS Autonomous AI Sentinel & OS Execution Engine

- **Unit:** `zoth-sentinel.service`
- **WantedBy:** `multi-user.target`
- **ExecStart:** `/usr/local/bin/zoth-sentinel daemon`

- **Description:** ZothOS Autonomous AI Sentinel & OS Execution Engine
- **ExecStart:** `/usr/local/bin/zoth-sentinel daemon`
- **WantedBy:** `multi-user.target`
- Image unit under `etc/systemd/system`. Loopback daemons unless the unit says otherwise.

## See also

[[Zoth OS]] · [[MOC Units]] · [[CLI zoth-sentinel|zoth-sentinel]] · [[Desktop zoth-sentinel|zoth-sentinel]]