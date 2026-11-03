---
title: "zoth-live-logger.service"
tags: [os, systemd]
---
# zoth-live-logger.service

ZothOS Live Boot Journal Persister

- **Unit:** `zoth-live-logger.service`
- **WantedBy:** `graphical.target multi-user.target`
- **ExecStart:** `/bin/sh -c 'mkdir -p /var/log/zoth; journalctl -b > /var/log/zoth/startup-journal.log 2>&1 || true'`

- **Description:** ZothOS Live Boot Journal Persister
- **ExecStart:** `/bin/sh -c 'mkdir -p /var/log/zoth; journalctl -b > /var/log/zoth/startup-journal.log 2>&1 || true'`
- **WantedBy:** `graphical.target multi-user.target`
- Image unit under `etc/systemd/system`. Loopback daemons unless the unit says otherwise.

## See also

[[Zoth OS]] · [[MOC Units]]