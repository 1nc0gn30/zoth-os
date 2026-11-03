---
title: "zoth-agent-layer"
tags: [os, cli]
aliases: ["zoth-agent-layer"]
---

# zoth-agent-layer

`file`: Bourne-Again shell script.

`zoth-agent-layer` is the ZOTHOS agent permission layer switcher and security ring controller located at `/usr/local/bin/zoth-agent-layer`.

## Purpose & Authority Hierarchy

The utility manages autonomous OS execution boundaries across two synchronized permission models:

### Security Rings (0 to 3)
- **Ring 0 (SOVEREIGN)**: Root, kernel, and amnesic authority (sudo, systemd, firewall, RAM purge).
- **Ring 1 (SYSADMIN)**: Privileged administration, user daemons, and network routing.
- **Ring 2 (TOOLMASTER)**: Agent tools, MCP runtime, filesystem modifications, and GUI automation.
- **Ring 3 (SPECTRE)**: Sandboxed execution, firejail containment, and read-only telemetry.

### Compatibility Layers (0 to 4)
- **Layer 0 (SPECTRE)**: Read-only metrics and telemetry inspection.
- **Layer 1 (RUNECRAFTER)**: User-space shell, repository commands, and code compilation.
- **Layer 2 (CYBERPUPPET)**: Desktop GUI automation, mouse/keyboard input, and browser control.
- **Layer 3 (WARLOCK)**: Offensive security arsenal, Tor routing, and network auditing.
- **Layer 4 (SOVEREIGN)**: Full root and kernel execution privileges.

## CLI Usage

- `zoth-agent-layer status` — Show ASCII banner and active authority status table.
- `zoth-agent-layer get` / `get-ring` — Print current layer or ring identifier.
- `zoth-agent-layer set <0-4>` — Set authority layer and synchronize corresponding ring.
- `zoth-agent-layer ring <0-3>` — Set authority ring and synchronize corresponding layer.
- `zoth-agent-layer lock` — Emergency lockdown restricting agent to Ring 3 (SPECTRE).

## State Files

- **Layer State**: `~/.config/zothos/agent-layer.state`
- **Ring State**: `~/.config/zothos/agent-ring.state`
- **Global Config**: `/etc/zothos/agent-permissions.json`

## See also

[[Zoth OS]] · [[MOC CLIs]]