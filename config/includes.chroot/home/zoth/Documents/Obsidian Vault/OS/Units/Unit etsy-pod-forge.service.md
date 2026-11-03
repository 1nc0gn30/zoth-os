---
title: "etsy-pod-forge.service"
tags: [os, systemd]
---
# etsy-pod-forge.service

ZothOS Etsy Print-on-Demand Studio & Listing Synthesizer

- **Unit:** `etsy-pod-forge.service`
- **WantedBy:** `multi-user.target`
- **ExecStart:** `/usr/bin/python3 -m etsy_pod_forge.server --host 127.0.0.1 --port 8107`

- **Description:** ZothOS Etsy Print-on-Demand Studio & Listing Synthesizer
- **ExecStart:** `/usr/bin/python3 -m etsy_pod_forge.server --host 127.0.0.1 --port 8107`
- **WantedBy:** `multi-user.target`
- Image unit under `etc/systemd/system`. Loopback daemons unless the unit says otherwise.

## See also

[[Zoth OS]] · [[MOC Units]] · [[Studio etsy-pod-forge|Etsy POD Forge]] · [[Workstation etsy-pod-forge|Etsy POD Forge // Print-on-Demand Studio]] · [[CLI etsy-pod-forge|etsy-pod-forge]] · [[Daemon etsy_pod_forge|etsy-pod-forge]]