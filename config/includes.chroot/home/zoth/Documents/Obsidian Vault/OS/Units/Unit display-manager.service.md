---
title: "display-manager.service"
tags: [os, systemd]
---
# display-manager.service

Simple Desktop Display Manager

- **Unit:** `display-manager.service`
- **WantedBy:** `—`
- **ExecStart:** `/usr/bin/sddm`

- **Description:** Simple Desktop Display Manager
- **ExecStart:** `/usr/bin/sddm`
- Image unit under `etc/systemd/system`. Loopback daemons unless the unit says otherwise.

## See also

[[Zoth OS]] · [[MOC Units]]