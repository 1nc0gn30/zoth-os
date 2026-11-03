---
title: "zoth-surface-sentinel"
tags: [os, cli]
aliases: ["zoth-surface-sentinel"]
---

# zoth-surface-sentinel

`file`: Python script, Unicode text, UTF-8 text executable.

`zoth-surface-sentinel` is the command-line companion to [[Studio shodan-surface-sentinel|Shodan Attack Surface Sentinel]] and [[Component AttackSurfaceSentinelGodModeTool|AttackSurfaceSentinelGodModeTool]]. It performs live listening socket audits, verifies loopback and Tailscale enclaves, calculates attack surface metrics, and generates zero-egress UFW lockdown scripts for ZothOS v3.2.

## Usage & Options

```bash
zoth-surface-sentinel [-h] [--json] [--emit-ufw]
```

- **`--json`**: Output socket audit and perimeter posture report as structured JSON
- **`--emit-ufw`**: Output hardened UFW firewall lockdown script with default-deny policies

## Implementation Details

- **Path**: `/usr/local/bin/zoth-surface-sentinel` (symlinked from `~/.local/bin/zoth-surface-sentinel`)
- **Runtime**: `/usr/bin/env python3`
- **Socket Auditing**: Inspects system listening sockets using `ss -tulpn`
- **Perimeter Policy**: Enforces zero-egress rules, flagging unapproved non-loopback WAN bindings while permitting approved mesh interfaces (e.g. Tailscale wireguard `41641` and conductor `7890`)

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Studio shodan-surface-sentinel|Shodan Attack Surface Sentinel]] · [[Studio anderson-security-sentinel|Anderson Security Sentinel]] · [[Component AttackSurfaceSentinelGodModeTool|AttackSurfaceSentinelGodModeTool]]
