---
title: "x11-tmp-dirs.service"
tags: [os, systemd]
---
# x11-tmp-dirs.service

Ensure X11 and ICE Unix domain socket directories exist

- **Unit:** `x11-tmp-dirs.service`
- **WantedBy:** `graphical.target multi-user.target`
- **ExecStart:** `/bin/sh -c 'mkdir -p /tmp/.X11-unix /tmp/.ICE-unix && chmod 1777 /tmp /tmp/.X11-unix /tmp/.ICE-unix && chown root:root /tmp /tmp/.X11-unix /tmp/.ICE-unix'`

- **Description:** Ensure X11 and ICE Unix domain socket directories exist
- **ExecStart:** `/bin/sh -c 'mkdir -p /tmp/.X11-unix /tmp/.ICE-unix && chmod 1777 /tmp /tmp/.X11-unix /tmp/.ICE-unix && chown root:root /tmp /tmp/.X11-unix /tmp/.ICE-unix'`
- **WantedBy:** `graphical.target multi-user.target`
- Image unit under `etc/systemd/system`. Loopback daemons unless the unit says otherwise.

## See also

[[Zoth OS]] · [[MOC Units]]