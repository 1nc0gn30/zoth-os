---
title: "zoth-auth-init.service"
tags: [os, systemd]
---
# zoth-auth-init.service

ZOTHOS Sovereign Authentication & Credential Enforcer

- **Unit:** `zoth-auth-init.service`
- **WantedBy:** `basic.target`
- **ExecStart:** `/usr/local/bin/zoth-auth-init`

- **Description:** ZOTHOS Sovereign Authentication & Credential Enforcer
- **ExecStart:** `/usr/local/bin/zoth-auth-init`
- **WantedBy:** `basic.target`
- Image unit under `etc/systemd/system`. Loopback daemons unless the unit says otherwise.

## See also

[[Zoth OS]] · [[MOC Units]] · [[CLI zoth-auth-init|zoth-auth-init]]