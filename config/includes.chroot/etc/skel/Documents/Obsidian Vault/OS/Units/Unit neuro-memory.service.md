---
title: "neuro-memory.service"
tags: [os, systemd]
---
# neuro-memory.service

ZothOS Neuro-Memory Biological Substrate & 3D Synaptic Daemon

- **Unit:** `neuro-memory.service`
- **WantedBy:** `multi-user.target`
- **ExecStart:** `/opt/zothos-ai-env/bin/python3 -m neuro_memory_daemon.cli serve --host 127.0.0.1 --port 8094`

- **Description:** ZothOS Neuro-Memory Biological Substrate & 3D Synaptic Daemon
- **ExecStart:** `/opt/zothos-ai-env/bin/python3 -m neuro_memory_daemon.cli serve --host 127.0.0.1 --port 8094`
- **WantedBy:** `multi-user.target`
- Image unit under `etc/systemd/system`. Loopback daemons unless the unit says otherwise.

## See also

[[Zoth OS]] · [[MOC Units]] · [[MCP neuro-memory|neuro-memory]] · [[CLI neuro-memory|neuro-memory]] · [[Daemon neuro_memory|neuro-memory-daemon]]