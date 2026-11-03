---
title: "Ring 0: Root, Kernel & Amnesic Authority"
tags: [os, ring]
aliases: ["SOVEREIGN", "ring-0"]
---

# Ring 0: Root, Kernel & Amnesic Authority

Unrestricted OS control: execute root/sudo commands, modify system services, configure iptables firewalls, manage kernel modules, and trigger emergency amnesic RAM purges.

- **Codename:** `SOVEREIGN`
- **Active on this image:** ring `2` (this note is ring 0)
- **Confirmation required above ring:** `1`
- **Default engine:** `ollama`
- **Network:** `unrestricted` · ports *
- **Tor enforced:** `False`
- **Sandbox:** `none` · CPU 100% · RAM 0 MB
- **Tokens / request:** 128000 · hourly 10000000 · timeout 600s
- **FS read:** *
- **FS write:** *

**Allowed.** `*`

From `etc/zothos/agent-permissions.json` v3.0.0. MCP catalog stays off regardless of ring.

## See also

[[Agent permissions]] · [[Zoth OS]] · [[MCP Catalog]]
