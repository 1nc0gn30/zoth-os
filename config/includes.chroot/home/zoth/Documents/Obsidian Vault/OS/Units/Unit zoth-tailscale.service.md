---
title: "zoth-tailscale.service"
tags: [os, systemd]
---
# zoth-tailscale.service

ZOTHOS Tailscale Mesh VPN — Persistent Zero-Trust Networking

- **Unit:** `zoth-tailscale.service`
- **WantedBy:** `multi-user.target`
- **ExecStart:** `/bin/sh -c 'command -v tailscale >/dev/null 2>&1 && tailscale up --accept-routes --accept-dns --hostname=zothos-$(cat /etc/machine-id 2>/dev/null | head -c 8) 2>/dev/null || true'`

- **Description:** ZOTHOS Tailscale Mesh VPN — Persistent Zero-Trust Networking
- **ExecStart:** `/bin/sh -c 'command -v tailscale >/dev/null 2>&1 && tailscale up --accept-routes --accept-dns --hostname=zothos-$(cat /etc/machine-id 2>/dev/null | head -c 8) 2>/dev/null || true'`
- **WantedBy:** `multi-user.target`
- Image unit under `etc/systemd/system`. Loopback daemons unless the unit says otherwise.

## See also

[[Zoth OS]] · [[MOC Units]]