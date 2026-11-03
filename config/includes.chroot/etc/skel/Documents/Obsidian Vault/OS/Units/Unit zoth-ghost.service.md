---
title: "zoth-ghost.service"
tags: [os, systemd]
---
# zoth-ghost.service

ZOTHOS Ghostmode Runtime — Active Anti-Forensics Daemon

- **Unit:** `zoth-ghost.service`
- **WantedBy:** `multi-user.target`
- **ExecStart:** `/usr/local/bin/zoth-ghost start`

- **Description:** ZOTHOS Ghostmode Runtime — Active Anti-Forensics Daemon
- **ExecStart:** `/usr/local/bin/zoth-ghost start`
- **WantedBy:** `multi-user.target`
- Image unit under `etc/systemd/system`. Loopback daemons unless the unit says otherwise.

## See also

[[Zoth OS]] · [[MOC Units]] · [[CLI zoth-ghost|zoth-ghost]] · [[Desktop zoth-ghost|zoth-ghost]]