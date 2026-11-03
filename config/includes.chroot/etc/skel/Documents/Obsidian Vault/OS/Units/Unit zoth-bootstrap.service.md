---
title: "zoth-bootstrap.service"
tags: [os, systemd]
---
# zoth-bootstrap.service

ZOTHOS First-Boot Sovereign Bootstrap Provisioner

- **Unit:** `zoth-bootstrap.service`
- **WantedBy:** `multi-user.target`
- **ExecStart:** `/usr/local/bin/zoth-bootstrap`

- **Description:** ZOTHOS First-Boot Sovereign Bootstrap Provisioner
- **ExecStart:** `/usr/local/bin/zoth-bootstrap`
- **WantedBy:** `multi-user.target`
- Image unit under `etc/systemd/system`. Loopback daemons unless the unit says otherwise.

## See also

[[Zoth OS]] · [[MOC Units]] · [[CLI zoth-bootstrap|zoth-bootstrap]]