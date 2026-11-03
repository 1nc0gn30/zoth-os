---
title: "zoth-netkill"
tags: [os, cli]
aliases: ["zoth-netkill"]
---

# zoth-netkill

`file`: a bash script executable (binary data).

`zoth-netkill` is an emergency firewall blocker and network neutralization utility that enforces an immediate isolated network posture.

## Emergency Mitigation Actions

1. **Firewall Rule Enforcement**:
   - **`iptables` (Primary)**: Flushes the `INPUT` chain, sets default policy to `DROP`, allows loopback traffic (`-i lo`), and permits `ESTABLISHED,RELATED` states while dropping inbound traffic.
   - **`ufw` (Fallback)**: If `iptables` is unavailable, sets `ufw default deny incoming` and `ufw deny from any to any`.
2. **Listener Termination**:
   - Scans active TCP listening sockets via `ss -tlnp`.
   - Preserves port `22` to ensure SSH connectivity for VM management remains intact.
   - Terminates process IDs (`kill "$pid"`) bound to all other listening ports.
3. **Isolated Shell**: Spawns an interactive `bash` session within the secured, isolated environment.

## Reversal Instructions

The script provides the following restoration commands:
- `iptables -F` (or `ufw enable`) to reset firewall filtering.
- `netkill --restore` to reverse isolation rules.

## Paths

- **Script Path**: `/usr/local/bin/zoth-netkill`

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-netkill|zoth-netkill]]